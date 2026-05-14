const CACHE_NAME = 'srq-v6';
// Don't pre-cache index.html — must always come fresh from network
const STATIC_ASSETS = ['/manifest.json'];
// Never cache API/function calls
const NEVER_CACHE = /\/(\.netlify\/functions|netlify\/functions)\//;
// Always fetch HTML navigation requests fresh
const IS_NAVIGATE = function(req) { return req.mode === 'navigate'; };

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(name) {
        return name !== CACHE_NAME;
      }).map(function(name) {
        return caches.delete(name);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // API calls: network-only, offline error response
  if (NEVER_CACHE.test(url)) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response(JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // HTML navigation: network-first so the app always loads fresh JS/CSS
  if (IS_NAVIGATE(e.request)) {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('/index.html') || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Static assets (JS/CSS/fonts with hashed names): cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var networkFetch = fetch(e.request).then(function(response) {
        if (response && response.status === 200 && response.type !== 'error') {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() {
        return cached || new Response('Offline', { status: 503 });
      });
      return cached || networkFetch;
    })
  );
});

// Show notification
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(ex) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Reading Quest', {
      body: data.body || 'Time for your daily reading challenge!',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: 'daily-reminder',
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || '/'));
});
