const CACHE='soccer-cards-v2';
const ASSETS=['./','./index.html','./styles.css','./data.js','./game.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||
      fetch(e.request).then(res=>{
        if(res.ok&&e.request.method==='GET'){
          const c=res.clone();
          caches.open(CACHE).then(cache=>cache.put(e.request,c));
        }
        return res;
      }).catch(()=>caches.match('./index.html'))
    )
  );
});
