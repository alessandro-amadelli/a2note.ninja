const CURRENT_CACHE = 'a2note-ninja-cache-v.1.5';
const staticAssets = [
  '/static/a2note/android-chrome-144x144.png',
  '/static/a2note/apple-touch-icon.png',
  '/static/a2note/bulletin.js',
  '/static/a2note/favicon-16x16.png',
  '/static/a2note/favicon-32x32.png',
  '/static/a2note/favicon.ico',
  '/static/a2note/offline_cat.jpg',
  '/static/a2note/index.js',
  '/static/a2note/main.css',
  '/static/a2note/my_account.js',
  '/static/a2note/shoplist_editor.js',
  '/static/a2note/shoplist_functions.js',
  '/static/a2note/shoplist_viewer.js',
  '/static/a2note/shoplist.js',
  '/static/a2note/todolist_editor.js',
  '/static/a2note/todolist_functions.js',
  '/static/a2note/todolist_viewer.js',
  '/static/a2note/todolist.js',
  '/static/a2note/utilities.js',
  '/about_us/',
  '/open_shared/',
  '/my_dashboard/',
  '/bulletin_board/',
  '/my_account/',
  '/offline/'
];

self.addEventListener('install', async e => {
  // const cache = await caches.open(CURRENT_CACHE);
  // await cache.addAll(staticAssets);
  // return self.skipWaiting();
  e.waitUntil(
    caches.open(CURRENT_CACHE).then(cache => {
      return cache.addAll(staticAssets);
    })
  )
});

self.addEventListener('activate', e => {
  // self.clients.claim();
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CURRENT_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  )
});

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
  new Promise((fulfill, reject) => {
    const timeoutId = setTimeout(reject, timeout);
    fetch(request).then(response => {
      clearTimeout(timeoutId);
      fulfill(response);
      update(request);
    }, reject);
  });

// fetch the resource from the browser cache
const fromCache = request =>
  caches
    .open(CURRENT_CACHE)
    .then(cache =>
      cache
        .match(request)
        .then(matching => matching || cache.match('/offline/'))
    );

// cache the current page to make it available for offline
const update = request =>
  caches
    .open(CURRENT_CACHE)
    .then(cache =>
      fetch(request).then(response => cache.put(request, response))
    );

//fetch event
self.addEventListener('fetch', evt => {
  evt.respondWith(
    fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
  );
  evt.waitUntil(update(evt.request));
});