// Service worker: tiene in memoria solo il "guscio" dell'app (grafica e codice),
// mai i dati delle spese, che vengono sempre letti dal foglio in tempo reale.
const CACHE = 'acciughi-v5';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest',
               'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // le chiamate al foglio (altro dominio, POST) non passano mai dalla cache
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // rete prima, cache solo se offline: così gli aggiornamenti arrivano subito
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
