import {createReadStream,statSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.i16':'application/octet-stream','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg'};
export function serveWeb(req,res,root){
 if(!['GET','HEAD'].includes(req.method)||!root)return false;
 let route;try{route=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return false;}
 if(route==='/')route='/index.html';
 if(!/^\/(index\.html|startup\.js|sw\.js|manifest\.webmanifest|art\/|media\/|audio\/|analysis\/)/.test(route))return false;
 const directory=resolve(root),file=resolve(directory,'.'+route);if(!file.startsWith(directory+sep))return false;
 let info;try{info=statSync(file);}catch{return false;}if(!info.isFile())return false;
 const type=TYPES[extname(file)]||(file.endsWith('.webmanifest')?'application/manifest+json':null);if(!type)return false;
 let start=0,end=info.size-1,status=200;
 if(req.headers.range){
  const m=String(req.headers.range).match(/^bytes=(\d*)-(\d*)$/);
  if(!m||(!m[1]&&!m[2])){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return true;}
  start=m[1]?Number(m[1]):Math.max(0,info.size-Number(m[2]));end=m[1]?(m[2]?Math.min(info.size-1,Number(m[2])):info.size-1):info.size-1;
  if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return true;}status=206;
 }
 const headers={'Content-Type':type,'Content-Length':end-start+1,'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':/index\.html|sw\.js|manifest\.webmanifest/.test(file)?'no-cache':'public, max-age=86400'};
 if(status===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+info.size;
 res.writeHead(status,headers);if(req.method==='HEAD')res.end();else{const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);}
 return true;
}
