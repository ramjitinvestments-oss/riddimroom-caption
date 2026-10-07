// EventCam service worker: network first, cache fallback. Never touches API calls or non-GET requests.
const CACHE_NAME = 'eventcam-v2';
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(['/eventcam-manifest.json', '/icon.svg']).catch(() => {})));
});
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api')) return;
  event.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || Response.error())));
});
