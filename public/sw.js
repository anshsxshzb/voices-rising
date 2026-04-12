const CACHE_NAME = 'voices-rising-v2';
const DYNAMIC_CACHE = 'voices-rising-dynamic-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Ignore Firebase/Firestore/Google API traffic (let Firebase SDK handle its own offline persistence)
  if (
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('firebase') ||
    url.hostname.includes('gstatic.com')
  ) {
    return;
  }

  // SPA Navigation Fallback (Network First, fallback to cached index.html)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for assets (JS, CSS, Images)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Ignore network errors, handled by returning cachedResponse
      });

      return cachedResponse || fetchPromise;
    })
  );
});
