// Service Worker — offline caching for Iron Log
const CACHE_NAME = "ironlog-v2";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./food.js",
  "./body-comp.js",
  "./body-diagrams.js",
  "./body-svgs.js",
  "./confirmations.js",
  "./diet-adjuster.js",
  "./diet-styles.js",
  "./exercise-database.js",
  "./exercise-pool.js",
  "./generator.js",
  "./home.js",
  "./intake.js",
  "./program-data.js",
  "./program-storage.js",
  "./rehab-routines.js",
  "./year-shard.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./favicon-16.png",
  "./favicon-32.png",
  "./ifct-foods.json",
];
const CDN_FILES = [
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.4/chart.umd.min.js",
  "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
  "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache app files first (reliable), then CDN files (best-effort)
      return cache.addAll(APP_FILES).then(() =>
        Promise.allSettled(CDN_FILES.map((url) => cache.add(url)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and API calls (USDA, Open Food Facts, GitHub)
  if (e.request.method !== "GET") return;
  if (url.hostname === "api.nal.usda.gov") return;
  if (url.hostname === "world.openfoodfacts.org") return;
  if (url.hostname === "api.github.com") return;

  // Network-first for app HTML (so updates land quickly), cache-first for everything else
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for all other assets
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        // Cache new font files and CDN resources as they're fetched
        if (res.ok && (url.hostname.includes("googleapis") || url.hostname.includes("gstatic") || url.hostname.includes("cdnjs") || url.hostname.includes("jsdelivr") || url.hostname.includes("unpkg"))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
