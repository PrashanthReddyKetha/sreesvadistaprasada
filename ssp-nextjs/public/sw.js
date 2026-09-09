/* Minimal service worker: enables home-screen install and caches immutable
   static assets. Navigations and ALL /api requests always go to the network —
   ordering data must never be stale. Bump the version to invalidate caches. */
const CACHE = 'ssp-static-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Never touch API traffic or cross-origin requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api')) return;

  // Cache-first only for content-hashed / immutable static assets
  const cacheable =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/sounds/') ||
    url.pathname === '/logo-header.png';
  if (!cacheable) return; // navigations, images, everything else: straight to network

  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(req).then(hit => {
        if (hit) return hit;
        return fetch(req).then(res => {
          if (res.ok) cache.put(req, res.clone());
          return res;
        });
      })
    )
  );
});
