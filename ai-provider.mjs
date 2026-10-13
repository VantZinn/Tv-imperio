import {validateSchema} from './schemas.mjs';

const failure=(status,message,extra={})=>Object.assign(new Error(message),{status,...extra});
export function nextQuotaReset(now=Date.now(),timeZone='America/Los_Angeles'){
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}),day=formatter.format(now);
 let low=Math.floor(now/1000),high=low+36*3600;
 while(high-low>1){const mid=Math.floor((low+high)/2);if(formatter.format(mid*1000)===day)low=mid;else high=mid;}
 return high*1000;
}
export function getAIConfig(env=process.env,options={}){
 const provider=String(options.provider||env.AI_PROVIDER||'gemini').trim().toLowerCase();
 if(!['gemini','openai'].includes(provider))throw failure(503,'Provedor inválido. Configure AI_PROVIDER=gemini ou openai no servidor.');
 const gemini=provider==='gemini';
 const apiKey=String(options.apiKey||(gemini?env.GEMINI_API_KEY:env.OPENAI_API_KEY)||'').trim();
 const model=String(options.model||env.AI_MODEL||(gemini?env.GEMINI_MODEL:env.OPENAI_MODEL)||(gemini?'gemini-3.5-flash-lite':'gpt-6.1-sol')).trim();
 if(!/^[a-zA-Z0-9._-]+$/.test(model))throw failure(503,'Nome de modelo inválido no servidor.');
 return{provider,apiKey,model,dayTimeZone:gemini?'America/Los_Angeles':'UTC'};
}

// Gemini accepts a JSON Schema subset. Keep the full schema for local validation.
export function geminiSchema(schema){
 const out={};
 for(const[key,value]of Object.entries(schema)){
  if(key==='maxLength')continue;
  if(key==='properties')out.properties=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,geminiSchema(v)]));
  else if(key==='items')out.items=geminiSchema(value);
  else out[key]=value;
 }
 if(schema.maxLength)out.description=[out.description,'No máximo '+schema.maxLength+' caracteres.'].filter(Boolean).join(' ');
 return out;
}

function retryDelay(response,body,now){
 const header=response.headers?.get?.('retry-after'),seconds=Number(header),dateSeconds=(Date.parse(header)-now)/1000;
 const detail=body?.error?.details?.find(x=>x['@type']?.endsWith('RetryInfo'));
 const fromBody=Number.parseFloat(detail?.retryDelay||'');
 return Math.min(90000,Math.max(60,Number.isFinite(seconds)&&seconds>0?seconds:Number.isFinite(dateSeconds)&&dateSeconds>0?Math.ceil(dateSeconds):Number.isFinite(fromBody)&&fromBody>0?Math.ceil(fromBody):900));
}

export async function requestAIJSON(system,payload,schema,options={}){
 const config=getAIConfig(process.env,options);
 if(!config.apiKey)throw failure(503,'O responsável pelo servidor ainda não ativou a IA.',{code:'AI_NOT_CONFIGURED'});
 const timeoutMs=Math.max(1,Math.min(85000,options.timeoutMs||Number(process.env.AI_TIMEOUT_MS)||60000));
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  let url,headers,body;
  if(config.provider==='gemini'){
   url='https://generativelanguage.googleapis.com/v1beta/models/'+config.model+':generateContent';
   headers={'x-goog-api-key':config.apiKey,'Content-Type':'application/json'};
   body={systemInstruction:{parts:[{text:system+' Responda apenas com JSON válido. Seja conciso sem perder evidências e sugestões específicas.'}]},contents:[{role:'user',parts:[{text:JSON.stringify(payload)}]}],generationConfig:{responseMimeType:'application/json',responseJsonSchema:geminiSchema(schema),maxOutputTokens:7000}};
  }else{
   url='https://api.openai.com/v1/responses';
   headers={Authorization:'Bearer '+config.apiKey,'Content-Type':'application/json'};
   body={model:config.model,reasoning:{effort:'low'},store:false,input:[{role:'developer',content:system},{role:'user',content:JSON.stringify(payload)}],text:{format:{type:'json_schema',name:'empire_content',strict:true,schema}},max_output_tokens:7000};
  }
  const response=await (options.fetch||fetch)(url,{method:'POST',headers,body:JSON.stringify(body),signal:controller.signal});
  let raw;try{raw=await response.json();}catch{if(!response.ok)raw={};else throw failure(502,'O provedor retornou uma resposta inválida. Nenhuma mudança foi aplicada.',{code:'AI_INVALID_RESPONSE',retryAfter:60});}
  if(!raw||typeof raw!=='object')throw failure(502,'O provedor retornou uma resposta inválida. Nenhuma mudança foi aplicada.',{code:'AI_INVALID_RESPONSE',retryAfter:60});
  if(!response.ok){
   if(response.status===429){
    const now=options.clock?options.clock():Date.now(),violations=(raw.error?.details||[]).flatMap(d=>d.violations||[]);
    const daily=violations.some(v=>/per.?day|daily/i.test(String(v.quotaId||'')+' '+String(v.quotaMetric||'')));
    const retryAt=daily?nextQuotaReset(now,config.dayTimeZone):now+retryDelay(response,raw,now)*1000;
    throw failure(429,daily?'A cota diária do provedor de IA foi atingida. O jogo pode continuar com análise local.':'O provedor de IA pediu uma pausa entre chamadas. O jogo pode continuar com análise local.',{code:daily?'AI_PROVIDER_DAILY_LIMIT':'AI_PROVIDER_RATE_LIMIT',providerStatus:429,retryAt,retryAfter:Math.ceil((retryAt-now)/1000)});
   }
   if([401,403].includes(response.status))throw failure(503,'A chave de IA não tem acesso. Confira a chave e o projeto no painel do provedor.',{code:'AI_ACCESS',providerStatus:response.status,retryAfter:600});
   if(response.status===404)throw failure(503,'O modelo de IA não está disponível nesse projeto. Confira AI_MODEL no servidor.',{code:'AI_MODEL_UNAVAILABLE',providerStatus:404,retryAfter:600});
   if(response.status===400)throw failure(502,'O provedor não aceitou a configuração da chamada. Atualize o servidor e confira AI_MODEL.',{code:'AI_REQUEST_REJECTED',providerStatus:400,retryAfter:600});
   throw failure(502,'O provedor de IA está indisponível. O jogo pode continuar com análise local.',{code:'AI_PROVIDER_UNAVAILABLE',providerStatus:response.status,retryAfter:60});
  }
  let output;
  if(config.provider==='gemini'){
   const candidate=raw.candidates?.[0];
   if(raw.promptFeedback?.blockReason||candidate?.finishReason==='SAFETY')throw failure(422,'A IA não analisou esse conteúdo. Revise o texto da ideia e tente novamente.');
   if(candidate?.finishReason!=='STOP')throw failure(502,'A resposta da IA foi interrompida. Tente novamente.');
   output=(candidate.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('');
  }else{
   if(raw.status!=='completed')throw failure(502,'O parecer foi interrompido. Tente novamente.');
   output=(raw.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
  }
  let result;try{result=JSON.parse(output);}catch{throw failure(502,'A IA retornou um conteúdo incompleto.');}
  if(!validateSchema(result,schema))throw failure(502,'A resposta da IA não passou na verificação.');
  return result;
 }catch(e){
  if(e.name==='AbortError')throw failure(504,'A IA demorou além do limite. O jogo pode continuar com análise local.',{code:'AI_TIMEOUT',retryAfter:60});
  if(!e.status)throw failure(502,'Não foi possível acessar a IA. Confira a conexão do servidor.',{code:'AI_CONNECTION',retryAfter:60});
  throw e;
 }finally{clearTimeout(timer);}
}
