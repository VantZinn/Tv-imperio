import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createStore,createEngine,createApp} from '../server.mjs';
test('Página web abre junto da API, mídia suporta Range e arquivos privados ficam fora das rotas',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'empire-web-'));mkdirSync(join(dir,'audio'));writeFileSync(join(dir,'index.html'),'<h1>Empire TV</h1>');writeFileSync(join(dir,'audio/music.mp3'),'0123456789');writeFileSync(join(dir,'.env'),'private');
 const db=createStore(':memory:'),engine=createEngine({db,aiEnabled:false}),app=createApp({db,engine,worker:false,publicDir:dir});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+app.server.address().port;
 try{
  const response=await fetch(url+'/');assert.equal(response.status,200);assert((await response.text()).includes('Empire TV'));
  const range=await fetch(url+'/audio/music.mp3',{headers:{Range:'bytes=2-5'}});assert.equal(range.status,206);assert.equal(range.headers.get('content-range'),'bytes 2-5/10');assert.equal(await range.text(),'2345');
  assert.equal((await fetch(url+'/audio/music.mp3',{headers:{Range:'bytes=999-'}})).status,416);
  assert.equal((await fetch(url+'/.env')).status,404);
  assert.equal((await fetch(url+'/audio/%2e%2e/%2e%2e/.env')).status,404);
  assert.equal((await fetch(url+'/health',{headers:{Origin:url}})).status,200);
  assert.equal((await fetch(url+'/health',{headers:{Origin:'https://unknown.invalid'}})).status,403);
 }finally{await app.close();db.close();rmSync(dir,{recursive:true,force:true});}
});
