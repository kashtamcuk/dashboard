const CACHE_NAME = 'fitness-ai-v2';

// Кешуємо ТІЛЬКИ фронтенд (серверні файли сюди НЕ ПИШЕМО!)
const URLS_TO_CACHE = [
  'index.html',
  'dashboard.html',
  'map.html',
  'music.html',
  'css/style.css',
  'css/dashboard.css',
  'js/script.js',
  'js/dashboard.js',
  'js/map.js',
  'js/player.js',
  'js/manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кешування фронтенду...');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Оновлення кешу
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Видалення старого кешу:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Стратегія: Спочатку запит в інтернет, якщо немає зв'язку — беремо з кешу
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});