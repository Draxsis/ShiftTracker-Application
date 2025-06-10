// Service Worker for Shift Tracker PWA
const CACHE_NAME = 'shift-tracker-cache-v1';
const ASSETS_TO_CACHE = [
  './', // Alias for index.html for root access
  './index.html',
  './manifest.json',
  './sw.js',
  './favicon.ico',
  './logo192.png',
  './logo512.png',
  // Local JS/TS modules (browser will fetch these via requests intercepted by SW)
  './index.tsx',
  './App.tsx',
  './constants.ts',
  './types.ts',
  './components/TimerDisplay.tsx',
  './components/EndTimeDisplay.tsx',
  // Note: CDN resources (Tailwind, esm.sh for React) are handled by browser HTTP cache
  // and generally not included directly in SW pre-cache unless complex strategies are needed.
];

// Install event: Cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        // Add all assets, but be careful with assets that might fail
        // For example, if a .tsx file is not directly servable without transpilation
        // and a build step is missing for the SW context.
        // For this project structure, assuming ./index.tsx etc., are resolvable as is
        // or through the import map mechanism which the browser handles before SW fetch.
        return Promise.all(
          ASSETS_TO_CACHE.map(asset => {
            return cache.add(asset).catch(err => {
              console.warn(`Failed to cache ${asset}:`, err);
            });
          })
        );
      })
      .then(() => {
        self.skipWaiting(); // Activate worker immediately
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// Fetch event: Serve cached assets when available (Cache-First strategy for cached assets)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests (e.g., to index.html), try network first, then cache.
  // This helps if the app shell is updated.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request)
          .then(response => response || caches.match('./index.html'))) // Fallback to root index.html
    );
    return;
  }
  
  // For other requests (assets like JS, CSS, images), try cache first.
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // console.log('Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }
        // console.log('Service Worker: Fetching from network:', event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // Optionally, cache new resources dynamically if needed
          // For now, we rely on the pre-cached assets.
          return networkResponse;
        });
      })
      .catch(error => {
        console.error('Service Worker: Fetch error:', error);
        // You could return a generic fallback page here if needed for specific errors
        // For example, an offline page for images that weren't cached.
      })
  );
});