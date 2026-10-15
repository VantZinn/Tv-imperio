const CACHE='empire-tv-web-10008';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./startup.js']))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('empire-tv-web-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/v1/')||url.pathname==='/health'||req.headers.has('range'))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(req);if(response.ok){await cache.put(req,response.clone());const keys=await cache.keys();for(const key of keys.slice(0,Math.max(0,keys.length-24)))if(!['/','/startup.js'].includes(new URL(key.url).pathname))await cache.delete(key);}return response;}catch(error){return(await cache.match(req))||(url.pathname.endsWith('index.html')?await cache.match('./'):null)||Response.error();}})());
});