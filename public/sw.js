// Service worker NEXA : permet l'installation et un démarrage même sans réseau. Il ne met JAMAIS en cache les données (API, photos).
const V = 'nexa-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    // Page d'abord depuis le réseau (toujours la dernière version) ; copie gardée pour le mode sans réseau.
    e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((ch) => ch.put('/', c)); return res; })
      .catch(() => caches.match('/').then((x) => x || new Response('<meta charset="utf-8"><title>NEXA</title><body style="font-family:sans-serif;padding:24px"><h1>NEXA</h1><p>Pas de connexion. Reviens quand tu as du réseau.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } }))));
    return;
  }
  if (/\.(png|webmanifest)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((x) => x || fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((ch) => ch.put(r, c)); return res; })));
  }
});
