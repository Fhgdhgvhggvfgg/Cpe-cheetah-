const CACHE_NAME = 'keven-cheetah-v5';

// قائمة كافة الملحقات والملفات التي يجب تحميلها بالكامل قبل تفعيل التطبيق
const assetsToCache = [
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
];

// 1. مرحلة التثبيت: طلب التخزين الدائم وتحميل وتخزين كافة الملحقات حصرياً قبل البدء
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // أ) طلب التخزين الدائم من المتصفح لمنع الحذف التلقائي
      if (navigator.storage && navigator.storage.persist) {
        try {
          const isPersistent = await navigator.storage.persist();
          if (isPersistent) {
            console.log("🔒 تم منح صلاحية التخزين الدائم بنجاح.");
          } else {
            console.log("⚠️ تم رفض طلب التخزين الدائم أو لم يوافِ المتصفح الشروط.");
          }
        } catch (e) {
          console.warn("⚠️ حدث خطأ أثناء طلب التخزين الدائم:", e);
        }
      }

      // ب) تحميل وتخزين كافة الملحقات
      const cache = await caches.open(CACHE_NAME);
      console.log('🔄 جاري تحميل كافة ملحقات التطبيق مسبقاً...');
      await cache.addAll(assetsToCache);
      console.log('✅ تم تحميل وتخزين كافة الملحقات بنجاح تام!');
      
      return self.skipWaiting();
    })().catch((err) => {
      console.error('❌ فشل أثناء التثبيت أو طلب التخزين الدائم، تأكد من صحة مسارات الملفات:', err);
    })
  );
});

// 2. تفعيل النسخة الجديدة وحذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('🗑️ حذف الكاش القديم:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. اعتراض الطلبات لجلبها مباشرة من الكاش (مع منع ظهور رسالة انقطاع الإنترنت)
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
        // 3. عند انقطاع الإنترنت وعدم توفر الملف، إرجاع صفحة index.html
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
 