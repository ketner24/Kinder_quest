/* Kinder Quest - offline support. Caches the app so it works without internet
   after the first visit. Bump VERSION whenever you change files. */
const VERSION = 'kq-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/util.js', 'js/data.js', 'js/themes.js', 'js/audio.js', 'js/progress.js',
  'js/engine.js', 'js/activities.js', 'js/special.js', 'js/parent.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Fonts: cache-first (they never change).
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(VERSION + '-fonts').then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => (c.put(req, res.clone()), res)).catch(() => hit))
      )
    );
    return;
  }
  if (url.origin !== location.origin) return;
  // App files: network first so updates arrive, cache as a fallback for offline.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});
