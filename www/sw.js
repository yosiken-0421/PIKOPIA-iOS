const CACHE='pikopia-arcade-20261026-v5';
const ASSETS=['./','./index.html','./style.css','./friends.css','./arcade.css','./maze.css','./app.js','./friends.js','./arcade.js','./maze.js','./firebase-config.js','./online.js','./manifest.webmanifest','./assets/bgm-pikopia.wav','./assets/pikopia-world.webp','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pikopia-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin !== self.location.origin)return;e.respondWith(caches.match(e.request).then(x=>x||fetch(e.request)));});
