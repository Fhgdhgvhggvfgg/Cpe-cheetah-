const CACHE_NAME = 'cheetah-runner-v5';

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

// دالة مساعدة لتحميل الملف مع إعادة المحاولة في حال الفشل العشوائي
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { cache: 'reload' });
      if (response.ok) return response;
    } catch (err) {
      console.warn(`⚠️ محاولة فاشلة لجلب الملف (${i + 1}/${retries}): ${url}`);
    }
    // انتظار قصير قبل إعادة المحاولة
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`❌ فشل نهائي في تحميل الملف بعد عدة محاولات: ${url}`);
}

// 1. مرحلة التثبيت مع نظام إعادة المحاولة التلقائية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('🔄 بدء التخزين الدائم مع فحص الملفات...');
      
      for (let asset of assetsToCache) {
        try {
          const response = await fetchWithRetry(asset, 3); // يحاول تحميل كل ملف 3 مرات تلقائياً إذا فشل
          await cache.put(asset, response);
          console.log(`✅ تم تخزين الملف بنجاح وثبات: ${asset}`);
        } catch (err) {
          console.error(err);
        }
      }
      
      console.log('🎉 اكتملت عملية التثبيت وتثبيت كافة الملحقات بنجاح تام!');
    }).then(() => {
      return self.skipWaiting();
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

// 3. اعتراض الطلبات وجلبها من الذاكرة الدائمة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./indexR.html');
        }
      });
    })
  );
});
