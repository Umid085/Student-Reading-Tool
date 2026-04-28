// Service Worker for Student Reading Quest
// Caches assets and API responses for offline support + faster repeat visits

const CACHE_NAME = 'student-reading-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
];

// Install: Cache essential assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return cacheName !== CACHE_NAME;
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for assets, cache-first for API
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // API calls: network-first with cache fallback
  if (url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (!response.ok) throw new Error('Network response not ok');
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, response.clone());
          });
          return response;
        })
        .catch(function() {
          return caches.match(request);
        })
    );
    return;
  }

  // Assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then(function(response) {
      return response || fetch(request).then(function(fetchResponse) {
        if (!fetchResponse.ok) return fetchResponse;
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, fetchResponse.clone());
        });
        return fetchResponse;
      });
    })
  );
});
