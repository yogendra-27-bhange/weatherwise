
// Basic Service Worker for WeatherWise
const CACHE_NAME = 'weatherwise-cache-v1';
const urlsToCache = [
  // '/', // Caching the root path
  // '/manifest.json',
  // '/favicon.ico', // Assuming you have one
  // Add other static assets critical for offline experience
  // Note: Be careful with caching dynamic content or API responses without a proper strategy
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // event.waitUntil(
  //   caches.open(CACHE_NAME)
  //     .then((cache) => {
  //       console.log('Service Worker: Caching app shell');
  //       return cache.addAll(urlsToCache);
  //     })
  // );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Clean up old caches if any
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
  //     );
  //   })
  // );
});

self.addEventListener('fetch', (event) => {
  // console.log('Service Worker: Fetching ', event.request.url);
  // Example: Cache-first strategy for specific assets, network-first for others
  // This is a very basic example and needs to be tailored.
  // For a PWA, you'd typically want to cache the app shell and provide offline fallback.
  // event.respondWith(
  //   caches.match(event.request)
  //     .then((response) => {
  //       return response || fetch(event.request);
  //     })
  // );
});
