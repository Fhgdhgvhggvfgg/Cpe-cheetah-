const CACHE_NAME = 'cheetah-runner-v3';

// قائمة كافة الملحقات والملفات التي يجب تحميلها وتخزينها بالكامل قبل بدء التطبيق
const assetsToCache = [
  './',
  'indexR.html',
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

// 1. مرحلة التثبيت الإجباري: تحميل كافة الملحقات قبل تفعيل التطبيق
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔄 جاري تحميل وتخزين كافة ملحقات التطبيق مسبقاً...');
      // cache.addAll تجلب كل الملفات دفعة واحدة وتنتظر اكتمالها
      return cache.addAll(assetsToCache);
    }).then(() => {
      console.log('✅ تم تحميل وتخزين كافة الملحقات بنجاح!');
      return self.skipWaiting(); // الانتقال للتفعيل فوراً
    }).catch((error) => {
      console.error('❌ فشل في تحميل بعض الملحقات أثناء التثبيت:', error);
    })
  );
});

// 2. تفعيل النسخة الجديدة وحذف الكاش القديم إن وجد
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

// 3. اعتراض الطلبات وجلبها مباشرة من الذاكرة المحلية
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // إذا انقطع الإنترنت ولم يتم العثور على الملف، يمكن إرجاع الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./indexR.html');
        }
      });
    })
  );
});
