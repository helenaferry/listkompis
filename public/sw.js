// Minimal service worker – required for PWA standalone mode (no address bar)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// A fetch handler is required for Chrome to treat this as an installable PWA.
// Network-first: always fetch from network, no offline caching.
self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});
