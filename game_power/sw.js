const CACHE_NAME = 'keven-cheetah-v1';
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
  './js/main.js'
  './js/UIManager.js'
  './js/InputHandler.js'
  './js/StorageManager.js'
  './js/GameCore.js'
];


// تثبيت الخدمة وتخزين الملفات في الذاكرة الدائمة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

// تفعيل الخدمة وتنظيف التخزين القديم إن وجد
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

// اعتراض الطلبات لجلب الملفات من الذاكرة عندما لا يوجد إنترنت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // إذا فشل الاتصال ولم يكن الملف مخزناً، يمكنك إرجاع صفحة بديلة أو تجاهل
      });
    })
  );
});
