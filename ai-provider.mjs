import {validateSchema} from './schemas.mjs';

const failure=(status,message,extra={})=>Object.assign(new Error(message),{status,...extra});
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

function retryDelay(response,body){
 const seconds=Number(response.headers?.get?.('retry-after'));
 const detail=body?.error?.details?.find(x=>x['@type']?.endsWith('RetryInfo'));
 const fromBody=Number.parseFloat(detail?.retryDelay||'');
 return Math.min(86400,Math.max(60,Number.isFinite(seconds)&&seconds>0?seconds:Number.isFinite(fromBody)&&fromBody>0?Math.ceil(fromBody):900));
}

export async function requestAIJSON(system,payload,schema,options={}){
 const config=getAIConfig(process.env,options);
 if(!config.apiKey)throw failure(503,'O responsável pelo servidor ainda não ativou a IA.');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),85000);
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
  let raw;try{raw=await response.json();}catch{throw failure(502,'O provedor retornou uma resposta inválida. Nenhuma mudança foi aplicada.');}
  if(!response.ok){
   if(response.status===429)throw failure(429,'A cota da IA foi atingida. Aguarde para tentar novamente; o modo local continua disponível.',{retryAfter:retryDelay(response,raw)});
   if([401,403].includes(response.status))throw failure(503,'A chave de IA não tem acesso. Confira a chave e o projeto no painel do provedor.');
   if(response.status===404)throw failure(503,'O modelo de IA não está disponível nesse projeto. Confira AI_MODEL no servidor.');
   throw failure(502,'O provedor de IA está indisponível. O jogo e o saldo foram preservados.');
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
  if(e.name==='AbortError')throw failure(504,'A IA demorou além do limite. Tente novamente.');
  if(!e.status)throw failure(502,'Não foi possível acessar a IA. Confira a conexão do servidor.');
  throw e;
 }finally{clearTimeout(timer);}
}
