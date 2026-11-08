const CACHE_NAME = 'keven-cheetah-v2';
const assetsToCache = [
  './',
  './index.html',
  './manifest.json', 
  './favicon.png',
  './button.png',
  './ranav.png',
  './ranav_ingdom.png',
  './menu.png',
  './player_f.png',
  './js/main.js',
  './js/UIManager.js',
  './js/InputHandler.js',
  './js/StorageManager.js',
  './js/GameCore.js'
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

// اعتراض الطلبات لجلبها من الذاكرة المحلية (Cache) في حال انقطاع الإنترنت أو لتسريع التحميل
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إرجاع الملف من الذاكرة إذا وجد، وإلا جلبه من الشبكة
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // يمكنك هنا إرجاع صفحة بديلة (Fallback) في حال انقطاع الإنترنت ولم يكن الملف مخزناً
      });
    })
  );
});
