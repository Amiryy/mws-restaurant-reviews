const CACHE_VERSION = 1;
const MAIN_CACHE = `restaurant-reviews-static-v${CACHE_VERSION}`;
const allCaches = [
  MAIN_CACHE,
];
const urlsToCache = [
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js',
  'css/main.css',
  'css/restaurant.css',
  'index.html',
  'restaurant.html'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(MAIN_CACHE).then(function(cache) {
      console.log('cache created - ' + MAIN_CACHE);
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (allCaches.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      const requestClone = event.request.clone();
      return fetch(requestClone).then(response => {
          if(!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(MAIN_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        }
      );
    })
  );
});