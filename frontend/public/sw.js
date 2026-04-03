const CACHE_VERSION = "examguru-v5";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k))) // delete ALL old caches
    ).then(() => self.clients.claim())
  );
});

// No caching at all — fresh requests only
// This prevents stale JS causing refresh loops
self.addEventListener("fetch", e => {
  // Skip API and HMR requests entirely
  if (e.request.url.includes("/api/") || 
      e.request.url.includes("hot-update") ||
      e.request.url.includes("sockjs")) {
    return;
  }
  // For everything else — network only, no cache
  e.respondWith(fetch(e.request).catch(() => new Response("Offline", { status: 503 })));
});
