import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createStore,createEngine,createApp} from '../server.mjs';
const project={id:'auto-project',title:'A Ponte',kind:'film',genre:'Drama',duration:90,concept:'Uma médica precisa salvar o irmão, mas a ponte fecha antes do amanhecer.'};
const body=i=>({campaignId:'campaign',project:{...project,title:'A Ponte '+i}});
const review=()=>({summary:'O objetivo e o prazo criam um conflito.',verdict:'Defina o custo da escolha.',hook:'Um resgate muda uma relação.',scores:{originality:82,coherence:86,characters:83,impact:87,execution:80},strengths:['A ponte impõe um limite.'],risks:[{aspect:'Consequência',evidence:'O custo não está descrito.',impact:'O risco pode ficar abstrato.',advice:'Mostre o que se perde.'}],productionWeeks:3,comments:Array.from({length:6},(_,i)=>({name:'Pessoa '+i,ageGroup:'Adulto',platform:'tuiter',text:'O limite da ponte muda a decisão. '+i,role:'Fã',replyTo:-1,mood:'debate'}))});

test('Análises ultrapassam os antigos limites, mantêm contagem e reutilizam pareceres',async()=>{
 const db=createStore(':memory:');let calls=0;const provider=async()=>{calls++;return review();};
 try{
  const engine=createEngine({db,aiEnabled:true,globalLimit:0,userLimit:0,backgroundLimit:4,provider});
  for(let i=0;i<40;i++)await engine.analyse('one',body(i));
  await engine.analyse('two',body(50));await engine.analyse('one',body(0));
  assert.equal(calls,41);const status=engine.status('one');assert.equal(status.available,true);assert.equal(status.quotas.global.used,41);assert.equal(status.quotas.account.used,40);assert.equal(status.quotas.account.limit,null);assert.equal(status.quotas.account.unlimited,true);
  const restarted=createEngine({db,aiEnabled:true,provider});await restarted.analyse('one',body(100));assert.equal(restarted.status('one').quotas.account.used,41);
 }finally{db.close();}
});

test('Desativar a cota interna libera contagem anterior sem apagar o banco',async()=>{
 const db=createStore(':memory:'),provider=async()=>review();
 try{
  const capped=createEngine({db,aiEnabled:true,userLimit:1,globalLimit:2,provider});await capped.analyse('one',body(1));await assert.rejects(capped.analyse('one',body(2)),e=>e.code==='AI_ACCOUNT_DAILY_LIMIT');
  const uncapped=createEngine({db,aiEnabled:true,globalLimit:0,userLimit:0,provider});await uncapped.analyse('one',body(2));assert.equal(uncapped.status('one').quotas.account.used,2);assert.equal(uncapped.status('one').available,true);
 }finally{db.close();}
});

test('Sem limite interno, a pausa real do provedor continua persistida e cache continua disponível',async()=>{
 const db=createStore(':memory:');let now=Date.now(),calls=0;const provider=async()=>{calls++;if(calls>1)throw Object.assign(Error('Cota diária do provedor.'),{status:429,code:'AI_PROVIDER_DAILY_LIMIT',retryAt:now+3600000});return review();};
 try{
  let engine=createEngine({db,aiEnabled:true,provider,clock:()=>now});await engine.analyse('one',body(0));await assert.rejects(engine.analyse('one',body(1)),e=>e.code==='AI_PROVIDER_DAILY_LIMIT');
  engine=createEngine({db,aiEnabled:true,provider,clock:()=>now});assert.equal(engine.status('one').available,false);assert.equal(engine.status('one').quotas.account.unlimited,true);await assert.rejects(engine.analyse('two',body(2)),e=>e.code==='AI_PROVIDER_DAILY_LIMIT');assert.equal(calls,2);assert.equal((await engine.analyse('one',body(0))).cached,true);assert.equal(calls,2);
 }finally{db.close();}
});

test('Cota automática zero desativa lotes, preservando análises livres',async()=>{
 const db=createStore(':memory:');let calls=0;const engine=createEngine({db,aiEnabled:true,backgroundLimit:0,provider:async()=>{calls++;return review();}});
 try{await engine.tick();assert.equal(calls,0);assert.equal(engine.status('one').quotas.automatic.disabled,true);await engine.analyse('one',body(0));assert.equal(calls,1);}finally{db.close();}
});

test('Environment aceita zero, mantém o orçamento automático e permite cotas positivas opcionais',()=>{
 const keys=['AI_PROVIDER','AI_GLOBAL_DAILY_LIMIT','AI_USER_DAILY_LIMIT','AI_BACKGROUND_DAILY_LIMIT'],saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  process.env.AI_PROVIDER='gemini';process.env.AI_BACKGROUND_DAILY_LIMIT='4';
  for(const value of [undefined,'0','','-1','invalid']){
   if(value===undefined){delete process.env.AI_GLOBAL_DAILY_LIMIT;delete process.env.AI_USER_DAILY_LIMIT;}else{process.env.AI_GLOBAL_DAILY_LIMIT=value;process.env.AI_USER_DAILY_LIMIT=value;}
   const db=createStore(':memory:'),app=createApp({db,worker:false});try{const q=app.engine.status('one').quotas;assert.equal(q.global.unlimited,true);assert.equal(q.account.unlimited,true);assert.equal(q.automatic.limit,4);}finally{db.close();}
  }
  process.env.AI_GLOBAL_DAILY_LIMIT='3';process.env.AI_USER_DAILY_LIMIT='2';const db=createStore(':memory:'),app=createApp({db,worker:false});try{const q=app.engine.status('one').quotas;assert.equal(q.global.limit,3);assert.equal(q.account.limit,2);assert.equal(q.automatic.limit,2);}finally{db.close();}
  process.env.AI_PROVIDER='openai';delete process.env.AI_GLOBAL_DAILY_LIMIT;delete process.env.AI_USER_DAILY_LIMIT;const paidDb=createStore(':memory:'),paid=createApp({db:paidDb,worker:false});try{const q=paid.engine.status('one').quotas;assert.equal(q.global.limit,144);assert.equal(q.account.limit,48);}finally{paidDb.close();}
 }finally{for(const key of keys){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}}
});

test('Autenticação automática isola perfis, renova sessão e guarda somente hash do segredo',async()=>{
 const db=createStore(':memory:'),engine=createEngine({db,aiEnabled:true,provider:async()=>review()}),app=createApp({db,engine,worker:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 const post=async(path,body,token)=>{const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return{status:response.status,body:await response.json()};};
 const device=()=>({deviceId:randomBytes(32).toString('hex'),deviceSecret:randomBytes(32).toString('hex')});
 try{
  const alice=device(),bob=device(),a=await post('/v1/auth/device',alice),b=await post('/v1/auth/device',bob);assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.body.accountKind,'device');assert.equal(a.body.token.length,64);assert(a.body.expiresAt>Date.now());assert(a.body.aiStatus.quotas.account.unlimited);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,2);const row=db.prepare('SELECT * FROM device_accounts WHERE device_id=?').get(alice.deviceId);assert.notEqual(row.secret_hash,alice.deviceSecret);assert(!JSON.stringify(a.body).includes(alice.deviceSecret));
  assert.equal((await post('/v1/auth/device',{...alice,deviceSecret:bob.deviceSecret})).status,401);assert.equal((await post('/v1/auth/device',{deviceId:'invalid',deviceSecret:'invalid'})).status,400);
  db.prepare('UPDATE sessions SET expires=0 WHERE user_id=?').run(row.user_id);assert.equal((await post('/v1/analyse',body(0),a.body.token)).status,401);
  const renewed=await post('/v1/auth/device',alice);assert.equal(renewed.status,200);assert.notEqual(renewed.body.token,a.body.token);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,2);
  assert.equal((await post('/v1/analyse',body(0),renewed.body.token)).status,200);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM cache WHERE user_id=?').get(row.user_id).n,1);
  const bobRow=db.prepare('SELECT user_id FROM device_accounts WHERE device_id=?').get(bob.deviceId);assert.equal(engine.status(bobRow.user_id).quotas.account.used,0);
 }finally{await app.close();db.close();}
});

test('Cadastro fechado impede novo perfil automático, mantendo recuperação de perfil existente',async()=>{
 const saved=process.env.REGISTRATION_ENABLED,db=createStore(':memory:'),app=createApp({db,worker:false});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 const pair=()=>({deviceId:randomBytes(32).toString('hex'),deviceSecret:randomBytes(32).toString('hex')}),post=body=>fetch(base+'/v1/auth/device',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 try{delete process.env.REGISTRATION_ENABLED;const old=pair();assert.equal((await post(old)).status,200);process.env.REGISTRATION_ENABLED='false';assert.equal((await post(pair())).status,403);assert.equal((await post(old)).status,200);}finally{if(saved===undefined)delete process.env.REGISTRATION_ENABLED;else process.env.REGISTRATION_ENABLED=saved;await app.close();db.close();}
});
