import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {getAIConfig,requestAIJSON} from '../ai-provider.mjs';
import {createStore,createEngine,createApp,CATALOG} from '../server.mjs';
import {reviewSchema,socialSchema,worldSchema} from '../schemas.mjs';

const project={id:'free-idea',title:'A Última Carta',kind:'film',genre:'Drama',duration:90,concept:'Uma carteira precisa entregar uma carta antes que a vila seja demolida.'};
const comment=i=>({name:'Morador '+i,ageGroup:['Jovem','Adulto','Senhor'][i%3],platform:['tuiter','istagram','facibuk'][i%3],text:'A escolha de entregar a carta muda o destino da vila. Opinião '+i,role:'Fã',replyTo:i===5?0:-1,mood:'debate'});
const review=()=>({summary:'A entrega confronta o desejo de preservar a vila.',verdict:'Desenvolva o custo da decisão.',hook:'Uma carta contra a demolição.',scores:{originality:79,coherence:84,characters:80,impact:87,execution:81},strengths:['O prazo cria urgência.'],risks:[{aspect:'Consequência',evidence:'A premissa não explica quem paga pela entrega.',impact:'O dilema ainda tem pouco peso.',advice:'Defina uma perda concreta para a protagonista.'}],productionWeeks:4,comments:Array.from({length:6},(_,i)=>comment(i))});
const snapshot=()=>({campaignId:'free-campaign',studio:'Estúdio Teste',week:2,projects:[],recentTexts:[],cursor:0});
const ok=value=>({ok:true,status:200,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]})});
const aiOptions=fetch=>({provider:'gemini',apiKey:'unit-test-placeholder',model:'gemini-3.5-flash-lite',fetch});

test('Gemini é o padrão e nunca ativa OpenAI por encontrar uma chave paga',()=>{
 const config=getAIConfig({OPENAI_API_KEY:'unit-test-paid-placeholder'});
 assert.equal(config.provider,'gemini');assert.equal(config.apiKey,'');assert.equal(config.model,'gemini-3.5-flash-lite');
 const both=getAIConfig({GEMINI_API_KEY:' unit-test-placeholder ',OPENAI_API_KEY:'unit-test-paid-placeholder'});
 assert.equal(both.apiKey,'unit-test-placeholder');assert.equal(both.dayTimeZone,'America/Los_Angeles');
 assert.equal(getAIConfig({AI_PROVIDER:'openai',OPENAI_API_KEY:'unit-test-placeholder'}).provider,'openai');
 assert.throws(()=>getAIConfig({AI_PROVIDER:'unknown'}),e=>e.status===503);
 assert.throws(()=>getAIConfig({AI_MODEL:'../unsafe?key=value'}),e=>e.status===503);
});

test('Gemini: chave só no cabeçalho e contrato completo do parecer',async()=>{
 let sent;
 const result=await requestAIJSON('Avalie sem contar palavras.',{project},reviewSchema,aiOptions(async(url,options)=>{sent={url,options,body:JSON.parse(options.body)};return ok(review());}));
 assert.equal(result.scores.impact,87);
 assert.equal(sent.url,'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
 assert.equal(sent.options.headers['x-goog-api-key'],'unit-test-placeholder');
 assert(!sent.url.includes('unit-test-placeholder'));assert(!JSON.stringify(sent.body).includes('unit-test-placeholder'));
 assert.equal(sent.body.generationConfig.responseMimeType,'application/json');
 assert.equal(sent.body.generationConfig.responseJsonSchema.properties.comments.minItems,6);
 assert.equal(sent.body.generationConfig.responseJsonSchema.properties.scores.properties.impact.maximum,100);
 assert.equal(sent.body.generationConfig.responseJsonSchema.properties.summary.maxLength,undefined);
 assert.match(sent.body.generationConfig.responseJsonSchema.properties.summary.description,/2400/);
 assert.equal(sent.body.tools,undefined);
});

test('Gemini entrega conversas e concorrentes nos mesmos contratos do jogo',async()=>{
 const comments={comments:Array.from({length:6},(_,i)=>({...comment(i),projectId:'',episodeId:'',title:'Mercado'}))};
 assert.equal((await requestAIJSON('Crie conversas.',snapshot(),socialSchema,aiOptions(async()=>ok(comments)))).comments.length,6);
 const works={works:[{title:'As Vozes da Ponte',kind:'series',genre:'Drama',premise:'Uma ponte divide a família.',story:{motivation:'Reunir a família.',conflict:'Um segredo impede o reencontro.',payoff:'A verdade custa a herança.'},intent:'Responsabilidade.',studio:'Estúdio Rio',networkId:CATALOG.networks[0].id,quality:83,productionWeeks:5}]};
 assert.equal((await requestAIJSON('Crie concorrentes.',{},worldSchema(CATALOG),aiOptions(async()=>ok(works)))).works[0].productionWeeks,5);
});

test('Gemini rejeita JSON quebrado, notas inválidas, texto longo e geração cortada',async()=>{
 for(const raw of [
  {candidates:[{finishReason:'STOP',content:{parts:[{text:'{"summary":'}]}}]},
  {candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...review(),productionWeeks:7})}]}}]},
  {candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...review(),summary:'x'.repeat(2401)})}]}}]},
  {candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:JSON.stringify(review())}]}}]},
  {candidates:[]}
 ])await assert.rejects(requestAIJSON('Avalie.',{project},reviewSchema,aiOptions(async()=>({ok:true,json:async()=>raw}))),e=>e.status===502);
 await assert.rejects(requestAIJSON('Avalie.',{},reviewSchema,aiOptions(async()=>({ok:true,json:async()=>({promptFeedback:{blockReason:'SAFETY'}})}))),e=>e.status===422);
});

test('Erros de cota, acesso, modelo e conexão têm mensagens sem segredos',async()=>{
 for(const[status,expected]of [[429,429],[401,503],[403,503],[404,503],[500,502]]){
  await assert.rejects(requestAIJSON('Avalie.',{},reviewSchema,aiOptions(async()=>({ok:false,status,headers:new Headers({'retry-after':'120'}),json:async()=>({error:{message:'unit-test-placeholder'}})}))),e=>e.status===expected&&!e.message.includes('unit-test-placeholder')&&(status!==429||e.retryAfter===120));
 }
 await assert.rejects(requestAIJSON('Avalie.',{},reviewSchema,aiOptions(async()=>{throw new TypeError('unit-test-placeholder');})),e=>e.status===502&&!e.message.includes('unit-test-placeholder'));
});

test('429 preserva progresso, pausa novas chamadas e persiste após reiniciar',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'empire-free-test-')),path=join(dir,'universe.sqlite');let db=createStore(path),now=Date.now(),calls=0;
 const provider=async()=>{calls++;throw Object.assign(Error('Cota atingida'),{status:429,retryAfter:120});};
 try{
  let engine=createEngine({db,aiEnabled:true,provider,clock:()=>now});
  await assert.rejects(engine.analyse('user',{campaignId:'c',project}),e=>e.status===429);
  assert.equal(db.prepare('SELECT COUNT(*) AS c FROM cache').get().c,0);
  const used=db.prepare('SELECT count FROM usage WHERE scope=?').get('global').count;
  await assert.rejects(engine.analyse('user',{campaignId:'c',project:{...project,title:'Nova carta'}}),e=>e.status===429);
  await engine.tick();assert.equal(calls,1);assert.equal(db.prepare('SELECT count FROM usage WHERE scope=?').get('global').count,used);
  db.close();db=createStore(path);engine=createEngine({db,aiEnabled:true,provider,clock:()=>now});
  await assert.rejects(engine.analyse('user',{campaignId:'c',project}),e=>e.status===429);assert.equal(calls,1);
  now+=121000;await assert.rejects(engine.analyse('user',{campaignId:'c',project}),e=>e.status===429);assert.equal(calls,2);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});

test('Cache não atribui a Gemini um parecer de outro provedor ou modelo',async()=>{
 const db=createStore(':memory:');let calls=0;const provider=async()=>{calls++;return review();};
 try{
  const body={campaignId:'c',project};
  const a=createEngine({db,aiEnabled:true,aiProvider:'gemini',aiModel:'model-a',provider});
  assert.equal((await a.analyse('user',body)).provider,'gemini');assert.equal((await a.analyse('user',body)).cached,true);
  const b=createEngine({db,aiEnabled:true,aiProvider:'gemini',aiModel:'model-b',provider});assert.equal((await b.analyse('user',body)).cached,false);
  const c=createEngine({db,aiEnabled:true,aiProvider:'openai',aiModel:'model-a',provider});assert.equal((await c.analyse('user',body)).cached,false);assert.equal(calls,3);
 }finally{db.close();}
});

test('Cota diária do Gemini usa o dia do Pacífico, não a meia-noite UTC',async()=>{
 const db=createStore(':memory:');let now=Date.parse('2026-10-13T06:59:00Z'),calls=0;
 const engine=createEngine({db,aiEnabled:true,dayTimeZone:'America/Los_Angeles',clock:()=>now,globalLimit:1,userLimit:1,provider:async()=>{calls++;return review();}});
 try{
  await engine.analyse('user',{campaignId:'c',project});
  now=Date.parse('2026-10-13T07:01:00Z');
  await engine.analyse('user',{campaignId:'c',project:{...project,title:'Carta no novo dia'}});assert.equal(calls,2);
 }finally{db.close();}
});

test('HTTP continua compatível com o APK e informa Gemini sem revelar a chave',async()=>{
 const db=createStore(':memory:'),engine=createEngine({db,aiEnabled:true,aiProvider:'gemini',aiModel:'gemini-3.5-flash-lite',provider:async()=>review()}),app=createApp({db,engine,worker:false});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 try{
  const health=await(await fetch(base+'/health')).json();assert.equal(health.aiProvider,'gemini');assert.equal(health.aiAvailable,true);assert.equal(health.paymentsEnabled,false);assert.equal(health.apiKey,undefined);
  const auth=await(await fetch(base+'/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'freeuser',password:'Testing123!'})})).json();
  const analysed=await(await fetch(base+'/v1/analyse',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+auth.token},body:JSON.stringify({campaignId:'c',project})})).json();
  assert.equal(analysed.provider,'gemini');assert.equal(analysed.review.productionWeeks,4);
 }finally{await app.close();db.close();}
});
