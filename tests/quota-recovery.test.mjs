import test from 'node:test';
import assert from 'node:assert/strict';
import {getAIConfig,requestAIJSON,nextQuotaReset} from '../ai-provider.mjs';
import {createStore,createEngine,createApp,CATALOG} from '../server.mjs';
import {reviewSchema} from '../schemas.mjs';

const project={id:'recovery',title:'A Última Sessão',kind:'film',genre:'Drama',duration:90,concept:'Uma projecionista precisa salvar a última sessão do cinema de seu bairro.'};
const review=()=>({summary:'Salvar o cinema exige uma decisão.',verdict:'Defina o custo dessa escolha.',hook:'Uma sessão contra o fechamento.',scores:{originality:78,coherence:81,characters:79,impact:85,execution:82},strengths:['Há um objetivo concreto.'],risks:[{aspect:'Consequência',evidence:'Não foi descrito o custo pessoal.',impact:'O dilema perde peso.',advice:'Escolha o que a protagonista arrisca.'}],productionWeeks:3,comments:Array.from({length:6},(_,i)=>({name:'Pessoa '+i,ageGroup:'Adulto',platform:'tuiter',text:'A decisão de salvar o cinema tem um custo. Opinião '+i,role:'Fã',replyTo:-1,mood:'debate'}))});
const snapshot=()=>({campaignId:'campaign',studio:'Teste',week:1,projects:[],recentTexts:[],cursor:0});
const body=(title=project.title)=>({campaignId:'campaign',project:{...project,title}});

test('Erro diário do provedor é separado de pausa por minuto e respeita o próximo dia do Pacífico',async()=>{
 const now=Date.parse('2026-10-13T14:00:00Z');
 for(const[daily,code]of [[true,'AI_PROVIDER_DAILY_LIMIT'],[false,'AI_PROVIDER_RATE_LIMIT']]){
  const response={ok:false,status:429,headers:new Headers(),json:async()=>({error:{details:[{'@type':'type.googleapis.com/google.rpc.QuotaFailure',violations:[{quotaId:daily?'GenerateRequestsPerDayPerProjectPerModel-FreeTier':'GenerateRequestsPerMinutePerProjectPerModel-FreeTier'}]},{'@type':'type.googleapis.com/google.rpc.RetryInfo',retryDelay:'30s'}]}})};
  await assert.rejects(requestAIJSON('Avalie.',{project},reviewSchema,{provider:'gemini',apiKey:'test-only',fetch:async()=>response,clock:()=>now}),e=>e.code===code&&e.retryAt===(daily?Date.parse('2026-10-14T07:00:00Z'):now+60000));
 }
 assert.equal(nextQuotaReset(Date.parse('2026-11-01T07:01:00Z'),'America/Los_Angeles'),Date.parse('2026-11-02T08:00:00Z'));
 assert.equal(nextQuotaReset(now,'UTC'),Date.parse('2026-10-14T00:00:00Z'));
});

test('Tempo máximo cancela a chamada e devolve uma pausa explícita',async()=>{
 await assert.rejects(requestAIJSON('Avalie.',{project},reviewSchema,{provider:'gemini',apiKey:'test-only',timeoutMs:5,fetch:async(_url,{signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'})),{once:true}))}),e=>e.status===504&&e.code==='AI_TIMEOUT'&&e.retryAfter===60);
});

test('Worker não repete falhas a cada minuto nem após reinício; análise manual continua após a pausa',async()=>{
 const db=createStore(':memory:');let now=Date.parse('2026-10-13T14:00:00Z'),calls=0;
 const provider=async(kind)=>{calls++;if(kind!=='review')throw Object.assign(Error('Provedor temporariamente indisponível'),{status:502,code:'AI_PROVIDER_UNAVAILABLE'});return review();};
 let engine=createEngine({db,aiEnabled:true,provider,clock:()=>now,globalLimit:20,userLimit:16,backgroundLimit:4,socialMinutes:360,worldMinutes:720});
 try{
  engine.sync('user',snapshot());await engine.tick();assert.equal(calls,1);
  assert.equal(engine.status('user').code,'AI_PROVIDER_UNAVAILABLE');
  assert.equal(engine.status('user').quotas.account.used,0);
  for(let i=0;i<10;i++){now+=60000;await engine.tick();}
  assert.equal(calls,1);
  engine=createEngine({db,aiEnabled:true,provider,clock:()=>now,globalLimit:20,userLimit:16,backgroundLimit:4,socialMinutes:360,worldMinutes:720});
  await engine.tick();assert.equal(calls,1);
  await engine.analyse('user',body());assert.equal(calls,2);
  assert.equal(engine.status('user').quotas.global.used,2);
  assert.equal(engine.status('user').quotas.account.used,1);
  assert.equal(engine.status('user').available,true);
 }finally{db.close();}
});

test('Geração automática tem cota própria e não consome a cota pessoal de análises',async()=>{
 const db=createStore(':memory:');let calls=0;
 const provider=async(kind)=>{calls++;if(kind==='review')return review();if(kind==='world')return{works:[{title:'Cinema da Ponte',kind:'film',genre:'Drama',premise:'Um cinema reúne duas irmãs.',story:{motivation:'Reunir a família.',conflict:'Uma carta impede o reencontro.',payoff:'A verdade custa a herança.'},intent:'Responsabilidade.',studio:'Estúdio Rio',networkId:CATALOG.networks[0].id,quality:83,productionWeeks:5}]};return{comments:review().comments.map(c=>({...c,projectId:'',episodeId:'',title:'Mercado'}))};};
 const engine=createEngine({db,aiEnabled:true,provider,globalLimit:4,userLimit:3,backgroundLimit:2});
 try{
  engine.sync('one',snapshot());engine.sync('two',snapshot());await engine.tick();assert.equal(calls,2);
  assert.equal(engine.status('one').quotas.account.used,0);assert.equal(engine.status('one').available,true);
  await engine.analyse('one',body());await engine.analyse('one',body('Outra sessão'));assert.equal(calls,4);
  await assert.rejects(engine.analyse('one',body('Terceira sessão')),e=>e.code==='AI_SERVER_DAILY_LIMIT'&&e.retryAfter>0&&Number.isFinite(e.retryAt));
  assert.equal((await engine.analyse('one',body())).cached,true);assert.equal(calls,4);
 }finally{db.close();}
});

test('HTTP entrega código e horário da pausa; sincronizar não anuncia IA disponível após falha',async()=>{
 const db=createStore(':memory:'),engine=createEngine({db,aiEnabled:true,provider:async()=>{throw Object.assign(Error('A IA demorou além do limite.'),{status:504,code:'AI_TIMEOUT',retryAfter:60});}}),app=createApp({db,engine,worker:false});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 try{
  const auth=await(await fetch(base+'/v1/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'recovery',password:'OnlyTest123!'})})).json();
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+auth.token};
  const response=await fetch(base+'/v1/analyse',{method:'POST',headers,body:JSON.stringify(body())}),error=await response.json();
  assert.equal(response.status,504);assert.equal(error.code,'AI_TIMEOUT');assert.equal(error.retryAfter,60);assert.equal(response.headers.get('retry-after'),'60');
  assert(Number.isFinite(error.retryAt));assert(!JSON.stringify(error).includes(auth.token));
  const synced=await(await fetch(base+'/v1/sync',{method:'POST',headers,body:JSON.stringify(snapshot())})).json();
  assert.equal(synced.aiStatus.available,false);assert.equal(synced.aiStatus.code,'AI_TIMEOUT');assert.equal(synced.aiStatus.quotas.account.used,1);
  const health=await(await fetch(base+'/health')).json();assert.equal(health.aiStatus.available,false);assert.equal(health.aiStatus.configured,true);assert.equal(health.aiStatus.quotas,undefined);
 }finally{await app.close();db.close();}
});
