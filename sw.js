const CACHE_NAME = "orion-player-v5"; // 🔥 sempre mudar ao atualizar

const BASE = "/player-orion";

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

// ==========================
// INSTALL
// ==========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );
});

// ==========================
// ACTIVATE
// ==========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ==========================
// FETCH
// ==========================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // ❌ NÃO INTERCEPTAR:
  if (
    request.method !== "GET" ||
    request.url.includes("chrome-extension") ||
    request.destination === "audio"
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      // 🔥 PRIORIDADE: CACHE → NETWORK (stale-while-revalidate)
      const fetchPromise = fetch(request)
        .then((response) => {
          if (
            response &&
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
    })
  );
});