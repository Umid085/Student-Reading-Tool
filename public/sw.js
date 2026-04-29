const CACHE_NAME = 'srq-v1';
const ASSETS = ['/', '/index.html', '/favicon.svg'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) {
    return cache.addAll(ASSETS);
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(names) {
    return Promise.all(names.filter(function(name) {
      return name !== CACHE_NAME;
    }).map(function(name) {
      return caches.delete(name);
    }));
  }));
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) return response;
      return fetch(e.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'error') return response;
        var cache_copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, cache_copy);
        });
        return response;
      }).catch(function() {
        return caches.match('/');
      });
    })
  );
});
