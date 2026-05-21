// Define a name for the current cache version
const CACHE_NAME = 'scoring-method-v1';

// The core assets the app needs to function offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  // React build files will be automatically intercepted, 
  // but listing core entry points helps ensure offline stability
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// 1. Install Event: Pre-caches all vital app shell assets
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app shell and assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      // Forces the waiting service worker to become the active service worker
      return (self as any).skipWaiting();
    })
  );
});

// 2. Activate Event: Cleans up any old caches from previous versions
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Allows the service worker to immediately take control of the page
      return (self as any).clients.claim();
    })
  );
});

// 3. Fetch Event: Network-first, falling back to cache strategy
// This ensures you get updates if online, but the app still loads if offline.
self.addEventListener('fetch', (event: any) => {
  // Only handle standard http/https requests (ignores chrome extensions, etc.)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the network request works, clone it and update the cache dynamically
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If the network fails (offline on the course), look for it in the cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fallback if an asset isn't cached and there's no network
          return new Response("Offline content not available", { 
            status: 503, 
            statusText: "Service Unavailable" 
          });
        });
      })
  );
});