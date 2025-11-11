/* Ride Forecast — simple SW cache */
const WW_CACHE = 'ww-shell-v1.5';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
  // Fonts and Material Symbols are cross-origin; the browser handles them.
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(WW_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== WW_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Stale-while-revalidate for same-origin shell; bypass for API calls
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Don’t cache Open-Meteo or other cross-origin requests
  if (url.origin !== location.origin) {
    return; // default network
  }

  // Only handle GET for our shell
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((resp) => {
        // Update cache in background if OK
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(WW_CACHE).then((c) => c.put(e.request, copy)).catch(()=>{});
        }
        return resp;
      }).catch(() => cached); // fallback to cache if offline
      return cached || fetchPromise;
    })
  );
});
