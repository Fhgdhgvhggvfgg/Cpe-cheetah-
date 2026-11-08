const CACHE_NAME = 'cheetah-runner-v1';
const assetsToCache = [
  'index.html',
  'manifest.json',
  'runer.png',
  'game_m.mp3',
  'gameP/start_p.js',
  'gameP/character.js',
  'gameP/mascot.js',
  'boss/game_boss.js',
  'boss/game_boss2.js',
  'boss/game_boss3.js',
  'boss/game_boss4.js',
  'boss/game_boss5.js',
  'boss/game_boss6.js'
];

// تثبيت التطبيق وتخزين الملفات مؤقتاً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
});

// تفعيل الكاش وجلب الملفات بدون إنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
