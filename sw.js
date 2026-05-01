const CACHE_NAME = "orion-player-v2"; // 🔥 IMPORTANTE: mudou versão

const BASE = "/orion-player";

const APP_ASSETS = [
  BASE + "/",
  BASE + "/index.html",
  BASE + "/style.css",
  BASE + "/player.js",
  BASE + "/manifest.json",
  BASE + "/assets/icon-192.png",
  BASE + "/assets/icon-512.png",
  BASE + "/assets/logo.png",
  BASE + "/assets/default-cover.png",
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_ASSETS) {
        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } catch (err) {
          console.warn("Falha ao cachear:", url);
        }
      }
    }),
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        }),
      ),
    ),
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // não intercepta áudio
  if (request.destination === "audio") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (
            request.method === "GET" &&
            response.status === 200 &&
            request.url.startsWith(self.location.origin)
          ) {
            const clone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    }),
  );
});
