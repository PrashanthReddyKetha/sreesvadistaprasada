/* Minimal service worker: enables home-screen install and caches immutable
   static assets. Navigations and ALL /api requests always go to the network —
   ordering data must never be stale. Bump the version to invalidate caches. */
const CACHE = 'ssp-static-v2';
const API = 'https://svadista-backend.onrender.com/api';

// Analytics beacon — best-effort, never blocks the notification
const track = (campaignId, event) => {
  if (!campaignId) return Promise.resolve();
  return fetch(`${API}/push/track?c=${encodeURIComponent(campaignId)}&e=${event}`, {
    method: 'POST',
    mode: 'no-cors',
  }).catch(() => {});
};

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch {}
  const title = data.title || 'Sree Svadista Prasada';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data.url || '/order', campaign_id: data.campaign_id || null },
  };
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    track(data.campaign_id, 'received'),
  ]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { url, campaign_id } = event.notification.data || {};
  const target = new URL(url || '/order', self.location.origin).href;
  event.waitUntil(Promise.all([
    track(campaign_id, 'clicked'),
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const open = list.find(c => c.url.startsWith(self.location.origin));
      if (open) return open.focus().then(c => (c && c.navigate ? c.navigate(target) : null));
      return self.clients.openWindow(target);
    }),
  ]));
});

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
