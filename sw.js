const CACHE_NAME = "orion-player-v6";

// 🔥 BASE dinâmica (funciona local + GitHub Pages)
const BASE = self.location.pathname.replace("/sw.js", "");

// arquivos principais
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
// INSTALL (ROBUSTO)
// ==========================
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of APP_ASSETS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("Erro ao cachear:", url);
        }
      }
    }),
  );
});

// ==========================
// ACTIVATE (limpa antigo)
// ==========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        }),
      ),
    ),
  );

  self.clients.claim();
});

// ==========================
// FETCH (CACHE FIRST)
// ==========================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // ❌ não interceptar áudio
  if (request.destination === "audio") return;

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // cache dinâmico seguro
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
        .catch(() => {
          // fallback offline
          return caches.match(BASE + "/index.html");
        });
    }),
  );
});
