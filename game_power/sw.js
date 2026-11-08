const CACHE_NAME = 'keven-cheetah-v5';

// تثبيت الخدمة وتخزين الملفات الأساسية فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './favicon.png',
        './button.png',
        './menu.png',
        './sounds/creative_bg.mp3',
        './sounds/survival_bg.mp3',
        './player_f.png',
        './js/main.js',
        './js/UIManager.js',
        './js/InputHandler.js',
        './js/StorageManager.js',
        './js/GameCore.js'
      ]).catch(err => console.log('بعض الملفات لم تُحفظ أثناء التثبيت، سيتم حفظها لاحقاً', err));
    })
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف الكاش القديم
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

// اعتراض الطلبات لمنع ظهور رسالة انقطاع الإنترنت نهائياً
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات الخارجية التي لا تنتمي لنطاق اللعبة
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. إذا كان الملف موجوداً في الذاكرة المؤقتة، قم بإرجاعه فوراً
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. إذا لم يكن موجوداً، قم بجلبه من الشبكة وحفظه للمستقبل
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // 3. 🛑 هنا الحل الجذري: عند انقطاع الإنترنت وعدم توفر الملف، 
        // أرجع صفحة index.html بدلاً من إظهار رسالة "لا توجد اتصال بالإنترنت" الخاصة بالمتصفح!
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
