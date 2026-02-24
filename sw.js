const CACHE = "minhanetflix-v1";

const ASSETS = [
"/",
"/index.html",
"/manifest.json"
];

self.addEventListener("install", e => {
self.skipWaiting();
e.waitUntil(
caches.open(CACHE).then(cache => cache.addAll(ASSETS))
);
});

self.addEventListener("activate", e => {
e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
if (event.request.method !== "GET") return;

event.respondWith(
fetch(event.request).catch(() => caches.match(event.request))
);
});
