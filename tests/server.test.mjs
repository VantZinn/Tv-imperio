import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore,createEngine,createApp,openAIJSON,CATALOG,normalizeProject} from '../server.mjs';
import {reviewSchema,worldSchema,validateSchema} from '../schemas.mjs';
const project={id:'42',title:'A Frequência Final',kind:'film',genre:'Drama',duration:90,concept:'Uma médica arrisca a carreira para salvar o irmão numa estação de rádio.',story:{motivation:'Salvar o irmão e cumprir uma promessa.',conflict:'Um operador esconde a saída para ocultar um crime.',payoff:'Transmitir a prova salva o irmão e custa seu emprego.'},intent:'Humor como defesa diante do medo.',script:'Ela encontra uma gravação e escolhe revelar o crime.'};
const comment=i=>({name:'Personagem '+i,ageGroup:['Jovem','Adulto','Senhor'][i%3],platform:['tuiter','istagram','facibuk'][i%3],text:'Opinião específica sobre a decisão da médica, número '+i,role:i%3?'Fã':'Crítico',replyTo:i===4?0:-1,mood:i%2?'debate':'euforia'});
const review=()=>({summary:'A escolha custa uma carreira, dando peso ao resgate.',verdict:'Ideia coerente, com risco de exposição excessiva.',hook:'Salvar alguém significa perder outra parte da vida.',scores:{originality:92,coherence:87,characters:90,impact:91,execution:78},strengths:['O objetivo e a consequência se conectam.'],risks:[{aspect:'Exposição',evidence:'A prova aparece num registro de rádio.',impact:'Pode parecer conveniente.',advice:'Introduza uma pista antes.'}],productionWeeks:4,comments:Array.from({length:6},(_,i)=>comment(i))});
const snapshot=(campaign='campaign-a')=>({campaignId:campaign,studio:'Estúdio Teste',week:8,difficulty:'hard',cursor:0,projects:[{...project,status:'ended',fame:5000,lastEpisode:{id:'99',title:'A Frequência Final',number:1,season:1,quality:88,critics:86,public:90,views:500000,likes:150000,favorites:14000,actor:'Wiu Ismiti',script:project.script,intent:project.intent,credits:[{name:'Wiu Ismiti',role:'Atuação',fame:98}]}}],recentTexts:[]});
function fakeProvider(){
 const calls=[];
 const provider=async(kind,payload)=>{
  calls.push({kind,payload});
  if(kind==='review')return review();
  if(kind==='world')return {works:[{title:'Concorrente Inédito '+calls.length,kind:'series',genre:'Drama',premise:'Duas irmãs herdam uma ponte que revela um segredo da cidade.',story:{motivation:'Salvar a casa da família.',conflict:'O segredo ameaça quem elas protegem.',payoff:'Uma irmã revela a verdade e perde a herança.'},intent:'Drama sobre responsabilidade.',studio:'Maré Alta Filmes',networkId:'nf',quality:88,productionWeeks:5}]};
  const sh=payload.projects[0],ep=sh?.lastEpisode;
  return {comments:Array.from({length:6},(_,i)=>({...comment(i),text:comment(i).text+' lote '+calls.length,projectId:String(sh?.id||''),episodeId:String(ep?.id||''),title:sh?.title||'Mercado'}))};
 };
 return{calls,provider};
}
test('Schema valida todos os campos e rejeita notas/prazos inválidos',()=>{
 assert(validateSchema(review(),reviewSchema));assert(!validateSchema({...review(),productionWeeks:7},reviewSchema));assert(!validateSchema({...review(),scores:{...review().scores,impact:101}},reviewSchema));assert(!validateSchema({...review(),unexpected:'field'},reviewSchema));
 assert.equal(normalizeProject({...project,duration:90.2}).duration,90);assert.throws(()=>normalizeProject({...project,kind:'invalid'}));assert.throws(()=>normalizeProject({...project,genre:'invalid'}));
});
test('API do provedor usa Responses, esquema estrito e segredo no servidor',async()=>{
 const original=globalThis.fetch;let request;
 globalThis.fetch=async(url,options)=>{request={url,options,body:JSON.parse(options.body)};return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(review())}]}]})};};
 try{const result=await openAIJSON('review',{project},reviewSchema,{apiKey:'unit-test-placeholder',model:'gpt-6.1-sol'});assert.equal(result.scores.originality,92);assert.equal(request.url,'https://api.openai.com/v1/responses');assert.equal(request.body.text.format.strict,true);assert.equal(request.body.store,false);assert.equal(request.body.model,'gpt-6.1-sol');assert(!JSON.stringify(request.body).includes('unit-test-placeholder'));assert.equal(request.options.headers.Authorization,'Bearer unit-test-placeholder');}
 finally{globalThis.fetch=original;}
});
test('Resposta incompleta ou fora do esquema não chega ao jogo',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async()=>({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({...review(),productionWeeks:10})}]}]})});
 try{await assert.rejects(openAIJSON('review',{project},reviewSchema,{apiKey:'unit-test-placeholder'}),e=>e.status===502);}finally{globalThis.fetch=original;}
});
test('Pareceres têm cache por autor/versão e chamadas iguais são agrupadas',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider();let count=0;
 const engine=createEngine({db,aiEnabled:true,provider:async(...args)=>{count++;await new Promise(r=>setTimeout(r,5));return fake.provider(...args);}});
 try{const body={campaignId:'a',project,context:{}},results=await Promise.all([engine.analyse('one',body),engine.analyse('one',body)]);assert.equal(count,1);assert.equal(results[1].cached,true);await engine.analyse('one',body);assert.equal(count,1);await engine.analyse('two',body);assert.equal(count,2);await engine.analyse('one',{...body,project:{...project,concept:project.concept+' Uma escolha diferente muda a consequência.'}});assert.equal(count,3);}finally{db.close();}
});
test('Limites diários permanecem no banco e cache não consome nova chamada',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider(),engine=createEngine({db,aiEnabled:true,provider:fake.provider,userLimit:1,globalLimit:3});
 try{const body={campaignId:'a',project};await engine.analyse('one',body);await engine.analyse('one',body);assert.equal(fake.calls.length,1);await assert.rejects(engine.analyse('one',{...body,project:{...project,title:'Revisão'}}),e=>e.status===429);const restarted=createEngine({db,aiEnabled:true,provider:fake.provider,userLimit:1,globalLimit:3});await assert.rejects(restarted.analyse('one',{...body,project:{...project,title:'Revisão'}}),e=>e.status===429);}finally{db.close();}
});
test('Worker cria concorrentes e comentários privados mesmo sem novo sync',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider();let now=Date.now();const engine=createEngine({db,aiEnabled:true,provider:fake.provider,clock:()=>now});
 try{engine.sync('alice',snapshot());engine.sync('bob',snapshot('campaign-b'));await engine.tick();const alice=engine.sync('alice',snapshot()),bob=engine.sync('bob',snapshot('campaign-b'));assert.equal(alice.works.length,1);assert.equal(alice.works[0].productionWeeks,5);assert.equal(alice.posts.length,6);assert.equal(bob.posts.length,6);assert(!alice.posts.some(a=>bob.posts.some(b=>b.id===a.id)));const first=alice.cursor,callCount=fake.calls.length;await engine.tick();assert.equal(fake.calls.length,callCount);
  now+=3600001;await engine.tick();const later=engine.sync('alice',{...snapshot(),cursor:first});assert.equal(later.posts.length,6);assert(later.cursor>first);assert.equal(new Set(db.prepare('SELECT text_hash FROM posts WHERE owner=?').all('alice').map(x=>x.text_hash)).size,12);
 }finally{db.close();}
});
test('Somente a campanha mais recente da conta recebe novos lotes',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider();let now=Date.now();const engine=createEngine({db,aiEnabled:true,provider:fake.provider,clock:()=>now});
 try{engine.sync('alice',snapshot('old'));now+=1;engine.sync('alice',snapshot('current'));await engine.tick();assert.equal(db.prepare('SELECT COUNT(*) AS c FROM posts WHERE owner=? AND campaign=?').get('alice','old').c,0);assert.equal(db.prepare('SELECT COUNT(*) AS c FROM posts WHERE owner=? AND campaign=?').get('alice','current').c,6);}finally{db.close();}
});
test('Concorrente fraco é redirecionado para emissora de exigência compatível',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider();const engine=createEngine({db,aiEnabled:true,provider:async(kind,payload)=>{const result=await fake.provider(kind,payload);if(kind==='world')result.works[0].quality=50;return result;}});
 try{await engine.tick();const work=JSON.parse(db.prepare('SELECT payload FROM works').get().payload),network=CATALOG.networks.find(n=>n.id===work.networkId);assert.notEqual(work.networkId,'nf');assert(network.threshold<=work.quality);}finally{db.close();}
});
test('Universo e pareceres sobrevivem ao reinício do processo',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'empire-tv-test-')),file=join(dir,'game.sqlite'),fake=fakeProvider();let db=createStore(file);
 try{const engine=createEngine({db,aiEnabled:true,provider:fake.provider});engine.sync('alice',snapshot());await engine.analyse('alice',{campaignId:'campaign-a',project});await engine.tick();db.close();db=createStore(file);const restarted=createEngine({db,aiEnabled:true,provider:fake.provider});assert.equal(restarted.sync('alice',snapshot()).posts.length,6);const calls=fake.calls.length;assert.equal((await restarted.analyse('alice',{campaignId:'campaign-a',project})).cached,true);assert.equal(fake.calls.length,calls);}finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
test('Sem chave: nada finge usar IA, e o serviço informa a configuração pendente',async()=>{
 const db=createStore(':memory:'),engine=createEngine({db,aiEnabled:false,provider:()=>{throw Error('Must not run');}});
 try{await assert.rejects(engine.analyse('one',{campaignId:'a',project}),e=>e.status===503);assert.equal(await engine.tick(),false);assert.equal(engine.sync('one',snapshot()).aiAvailable,false);assert.equal(db.prepare('SELECT COUNT(*) AS c FROM usage').get().c,0);}finally{db.close();}
});
test('HTTP: sessão, senha, isolamento, CORS, validação e pagamento bloqueado',async()=>{
 const db=createStore(':memory:'),fake=fakeProvider(),engine=createEngine({db,aiEnabled:true,provider:fake.provider}),app=createApp({db,engine,worker:false,origins:['https://appassets.androidplatform.net']});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 async function post(route,body,token=null,origin='https://appassets.androidplatform.net'){const response=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return{status:response.status,body:await response.json()};}
 try{
  const health=await(await fetch(base+'/health')).json();assert.equal(health.paymentsEnabled,false);assert.equal(health.version,'1.0.0.1 BETA');
  const alice=await post('/v1/auth/register',{username:'Alice',password:'Testing123!'}),bob=await post('/v1/auth/register',{username:'Bob',password:'Testing123!'});assert.equal(alice.status,200);assert.equal(alice.body.token.length,64);assert.equal(bob.status,200);
  assert.equal((await post('/v1/auth/login',{username:'alice',password:'Incorrect123'})).status,401);assert.equal((await post('/v1/auth/login',{username:'ALICE',password:'Testing123!'})).status,200);
  assert.equal((await post('/v1/analyse',{campaignId:'a',project})).status,401);assert.equal((await post('/v1/analyse',{campaignId:'a',project},alice.body.token)).status,200);
  const user=db.prepare('SELECT * FROM users WHERE name=?').get('alice');assert.notEqual(user.password,'Testing123!');assert(!db.prepare('SELECT token FROM sessions').all().some(x=>x.token===alice.body.token));
  await post('/v1/sync',snapshot(),alice.body.token);await engine.tick();const synced=await post('/v1/sync',snapshot(),alice.body.token),isolated=await post('/v1/sync',snapshot(),bob.body.token);assert.equal(synced.body.posts.length,6);assert.equal(isolated.body.posts.length,0);
  assert.equal((await post('/v1/sync',snapshot(),alice.body.token,'https://unknown.invalid')).status,403);assert.equal((await post('/v1/sync',null,alice.body.token)).status,400);
  const before=await post('/v1/wallet',{},alice.body.token),purchase=await post('/v1/shop/purchase',{mf:1000000,paid:true},alice.body.token),after=await post('/v1/wallet',{},alice.body.token);assert.equal(purchase.status,501);assert.equal(before.body.purchasedMF,0);assert.deepEqual(after.body,before.body);
 }finally{await app.close();db.close();}
});
