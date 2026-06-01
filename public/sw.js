// Service worker – PWA standalone mode + static asset caching
const STATIC_CACHE = "listkompis-static-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  // Ignore non-GET requests.
  if (e.request.method !== "GET") return;

  // Avoid a known browser/SW edge case that can cause navigation failures.
  if (
    e.request.cache === "only-if-cached" &&
    e.request.mode !== "same-origin"
  ) {
    return;
  }

  const url = new URL(e.request.url);

  // Cache-first for Next.js static assets (content-hashed filenames, safe forever)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const response = await fetch(e.request);
        if (response.ok) cache.put(e.request, response.clone());
        return response;
      }),
    );
  }
});
