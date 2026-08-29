const CACHE = 'lm-pilot-pro-uad-v2-cache-1';
const PREFIX = 'lm-pilot-pro-uad-v2-';
const SHELL = ['./','./index.html','./manifest.webmanifest','./offline.html','../icon-192.png','../icon-512.png','../icon-maskable-512.png','../splash-lm-pilot-pro.jpg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request; if (request.method !== 'GET') return; const url = new URL(request.url);
  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(fetch(request).then(response => { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(request,copy)); return response; }).catch(() => caches.match(request).then(response => response || caches.match('./offline.html')))); return;
  }
  if (url.origin === self.location.origin) event.respondWith(caches.match(request).then(cached => { const network=fetch(request).then(response => { if(response && response.status===200 && response.type==='basic'){ const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(request,copy)); } return response; }).catch(() => cached); return cached || network; }));
});
