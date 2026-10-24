// Keeps the app working with no signal. The app's own files are served from the cache and refreshed in the
// background; the reading tools (vendor/) are cached the first time they are used and never change.
// Bump VERSION whenever a file in SHELL changes.

const VERSION = "1.0.0";
const SHELL_CACHE = "shell-" + VERSION;
const VENDOR_CACHE = "vendor-1";
const SHELL = ["./", "index.html", "app.css", "manifest.webmanifest", "js/app.js", "js/util.js", "js/names.js", "js/parse.js",
  "js/store.js", "js/api.js", "js/reader.js", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== VENDOR_CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;   // the server's API is never cached
  if (url.pathname.includes("/vendor/")) {
    e.respondWith(caches.open(VENDOR_CACHE).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }
  const asset = req.mode === "navigate" ? "index.html" : req;
  e.respondWith(caches.open(SHELL_CACHE).then(async (c) => {
    const hit = await c.match(asset, { ignoreSearch: true });
    const fresh = fetch(req).then((res) => { if (res.ok) c.put(asset, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    return (await fresh) || new Response("Offline", { status: 503 });
  }));
});
