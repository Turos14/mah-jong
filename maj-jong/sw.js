const CACHE_NAME = 'majhong-v6';
const ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/app.css',
    './js/data/tiles.js',
    './js/data/fans.js',
    './js/engine/hand.js',
    './js/engine/fans-engine.js',
    './js/engine/payout.js',
    './js/state.js',
    './js/storage.js',
    './js/ui/dashboard.js',
    './js/ui/tile-editor.js',
    './js/ui/calculator.js',
    './js/ui/rules.js',
    './js/ui/parties.js',
    './js/app.js',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/tiles/a1.png',
    './assets/tiles/a2.png',
    './assets/tiles/a3.png',
    './assets/tiles/a4.png',
    './assets/tiles/dg.png',
    './assets/tiles/dr.png',
    './assets/tiles/dw.png',
    './assets/tiles/f1.png',
    './assets/tiles/f2.png',
    './assets/tiles/f3.png',
    './assets/tiles/f4.png',
    './assets/tiles/m1.png',
    './assets/tiles/m2.png',
    './assets/tiles/m3.png',
    './assets/tiles/m4.png',
    './assets/tiles/m5.png',
    './assets/tiles/m6.png',
    './assets/tiles/m7.png',
    './assets/tiles/m8.png',
    './assets/tiles/m9.png',
    './assets/tiles/p1.png',
    './assets/tiles/p2.png',
    './assets/tiles/p3.png',
    './assets/tiles/p4.png',
    './assets/tiles/p5.png',
    './assets/tiles/p6.png',
    './assets/tiles/p7.png',
    './assets/tiles/p8.png',
    './assets/tiles/p9.png',
    './assets/tiles/s1.png',
    './assets/tiles/s2.png',
    './assets/tiles/s3.png',
    './assets/tiles/s4.png',
    './assets/tiles/s5.png',
    './assets/tiles/s6.png',
    './assets/tiles/s7.png',
    './assets/tiles/s8.png',
    './assets/tiles/s9.png',
    './assets/tiles/we.png',
    './assets/tiles/wn.png',
    './assets/tiles/ws.png',
    './assets/tiles/ww.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                return response;
            }).catch(() => cached);
        })
    );
});
