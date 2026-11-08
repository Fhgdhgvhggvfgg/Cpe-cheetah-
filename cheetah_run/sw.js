const CACHE_NAME = 'cheetah-runner-v2';
const assetsToCache = [
  './',
  'index.html',
  'manifest.json',
  'runer.png',
  'game_m.mp3',
  'city.png',
  'animes.png',
  'players/keven_01.png',
  'players/jamaica.png',
  'players/asia.png',
  'player_t.txt',
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

// تثبيت الخدمة وتخزين كافة الملفات في الذاكرة الدائمة للمتصفح
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف الكاش القديم إن وجد
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// اعتراض الطلبات لجلبها من الذاكرة المحلية (الدائمة) في حال انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // يمكن إرجاع صفحة بديلة هنا إذا لزم الأمر في حال فشل الاتصال وعدم توفر الملف
      });
    })
  );
});
