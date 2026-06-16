const CACHE_NAME = 'fitness-ai-v2';

// Кешуємо ТІЛЬКИ те, що завантажується в браузер користувача
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/map.html',
  '/music.html',
  '/css/style.css',
  '/css/dashboard.css',
  '/js/script.js',
  '/js/dashboard.js',
  '/js/map.js',
  '/js/player.js',
  '/js/manifest.json', // Зверни увагу: він у тебе в папці js!
  '/icon-192.png',
  '/icon-512.png'
];

// Встановлення Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кешуємо ресурси фронтенду...');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Активація та видалення старого кешу
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Видаляємо старий кеш:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Стратегія: спочатку мережа, якщо немає інтернету — беремо з кешу
// Це ідеально для динамічних фітнес-додатків з ШІ
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});