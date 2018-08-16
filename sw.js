const CACHE_VERSION = 1;
const MAIN_CACHE = `restaurant-reviews-static-v${CACHE_VERSION}`;
const allCaches = [
  MAIN_CACHE,
];
const urlsToCache = [
  'js/main.js',
  'js/restaurant_info.js',
  'js/dbhelper.js',
  'js/indexController.js',
  'lib/idb.js',
  'lib/bLazy.js',
  'css/main.css',
  'css/lazy_load.css',
  'css/main_responsive.css',
  'css/restaurant.css',
  'css/restaurant_responsive.css',
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
  const requestURL = new URL(event.request.url);
  event.respondWith(
    caches.match(requestURL.pathname).then(response => {
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
              cache.put(event.request.url, responseToCache);
            });
          return response;
        }
      );
    })
  );
});