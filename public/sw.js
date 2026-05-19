// Bump on any SW logic change so old caches are evicted on activate.
const CACHE_NAME = 'srq-v8';

// Stable paths worth pre-caching so the app shell loads from cache
// on the first offline visit. Hashed build assets (/assets/index-*.js,
// /assets/index-*.css) are still picked up via runtime caching below.
const PRECACHE_PATHS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

// Never cache API calls — student data and AI responses must be live.
const NEVER_CACHE = /\/api\/|\/\.netlify\/functions\//;

function isNavigation(req) { return req.mode === 'navigate'; }

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Use Request with cache:reload to avoid picking up stale http cache.
      return Promise.all(
        PRECACHE_PATHS.map(function(p) {
          return cache.add(new Request(p, { cache: 'reload' })).catch(function() {});
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      caches.keys().then(function(names) {
        return Promise.all(names.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        }));
      }),
      // Faster navigation when the SW is alive — let the browser fetch the
      // HTML in parallel with SW boot and pass the response through.
      self.registration.navigationPreload && self.registration.navigationPreload.enable(),
    ]).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // API calls: network-only with a friendly offline JSON.
  if (NEVER_CACHE.test(url)) {
    e.respondWith(fetch(e.request).catch(function() {
      return new Response(JSON.stringify({ error: 'You appear to be offline. Please check your connection.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // HTML navigation: network-first with preload, fall back to cached shell.
  if (isNavigation(e.request)) {
    e.respondWith((async function() {
      try {
        var preload = await e.preloadResponse;
        if (preload) return preload;
        return await fetch(e.request);
      } catch (err) {
        var cache = await caches.open(CACHE_NAME);
        return (await cache.match('/')) || (await cache.match('/index.html')) ||
               new Response('Offline — please reconnect to load Reading Quest.', {
                 status: 503,
                 headers: { 'Content-Type': 'text/plain; charset=utf-8' }
               });
      }
    })());
    return;
  }

  // Static assets (JS/CSS/fonts with hashed names, icons, etc.): cache-first
  // with a background network refresh so updates propagate after one visit.
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

// Show push notification (kept from prior SW — used for daily reminders).
self.addEventListener('push', function(e) {
  var data = {};
  try { data = e.data.json(); } catch(ex) {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Reading Quest', {
      body: data.body || 'Time for your daily reading challenge!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-reminder',
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || '/'));
});
