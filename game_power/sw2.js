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

// 1. مرحلة التثبيت: إجبار المتصفح على تحميل وتخزين كافة الملحقات حصرياً قبل البدء
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔄 جاري تحميل كافة ملحقات التطبيق مسبقاً...');
      return cache.addAll(assetsToCache);
    }).then(() => {
      console.log('✅ تم تحميل وتخزين كافة الملحقات بنجاح تام!');
      return self.skipWaiting();
    }).catch((err) => {
      console.error('❌ فشل تحميل بعض الملحقات أثناء التثبيت، تأكد من صحة مسارات الملفات:', err);
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

// 1. مرحلة التثبيت: إجبار المتصفح على تحميل وتخزين كافة الملحقات وطلب التخزين الدائم
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // طلب التخزين الدائم من المتصفح لمنع الحذف التلقائي
      if (navigator.storage && navigator.storage.persist) {
        const isPersistent = await navigator.storage.persist();
        if (isPersistent) {
          console.log("🔒 تم منح صلاحية التخزين الدائم بنجاح.");
        } else {
          console.log("⚠️ تم رفض طلب التخزين الدائم أو لم يوافِ المتصفح الشروط.");
        }
      }

      // تخزين الملفات كالمعتاد
      const cache = await caches.open(CACHE_NAME);
      console.log('🔄 جاري تحميل كافة ملحقات التطبيق مسبقاً...');
      await cache.addAll(assetsToCache);
      console.log('✅ تم تحميل وتخزين كافة الملحقات بنجاح تام!');
      
      return self.skipWaiting();
    })().catch((err) => {
      console.error('❌ فشل أثناء التثبيت أو طلب التخزين الدائم:', err);
    })
  );
});
