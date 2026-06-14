import { GameCore } from './GameCore.js';
import { StorageManager } from './StorageManager.js';
import { UIManager } from './UIManager.js';

window.isGamePaused = false;

if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist();
}

// ========== تنظيف التخزين القديم ==========
(async function migrateOldImages() {
    const migrationDone = localStorage.getItem('migrationToIndexedDB');
    
    if (!migrationDone) {
        console.log('🔄 جاري ترحيل الصور القديمة إلى IndexedDB...');
        
        window.pendingMigration = {
            player: localStorage.getItem('playerImage'),
            bg: localStorage.getItem('bgImage'),
            enemy: localStorage.getItem('enemyImage')
        };
    }
})();

// تهيئة مدير التخزين
const storage = new StorageManager();

// تهيئة مدير واجهة المستخدم
const uiManager = new UIManager(storage);

// طلب تخزين دائم
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        console.log(granted ? "✅ التخزين الدائم ممنوح!" : "⚠️ المستخدم لم يمنح التخزين الدائم");
    });
}

// معرفة المساحة المتاحة
navigator.storage.estimate().then(estimate => {
    console.log("المساحة المتاحة:", estimate.quota / 1024 / 1024, "MB");
    console.log("المستخدم:", estimate.usage / 1024 / 1024, "MB");
});

let currentGame = null;
window.currentGame = currentGame;

// ========== أزرار بدء اللعبة ==========
document.getElementById('survivalBtn').onclick = async () => {
    storage.kills = 0;
    storage.saveKills(0);
    uiManager.updateMenuDisplay();
    await storage.waitForImages();
    currentGame = new GameCore('survival', storage, uiManager);
    window.currentGame = currentGame;
};

document.getElementById('creativeBtn').onclick = async () => {
    await storage.waitForImages();
    currentGame = new GameCore('creative', storage, uiManager);
    window.currentGame = currentGame;
};

// ========== تحميل الصور الافتراضية ==========
(async function initDefaultImages() {
    await storage.initDB();
    
    // ترحيل الصور القديمة
    if (window.pendingMigration) {
        let migrated = false;
        
        if (window.pendingMigration.player && !(await storage.loadImageFromStore('player', 'main'))) {
            await storage.saveImage('playerImage', window.pendingMigration.player);
            console.log('📦 تم ترحيل صورة اللاعب');
            migrated = true;
        }
        if (window.pendingMigration.bg && !(await storage.loadImageFromStore('background', 'main'))) {
            await storage.saveImage('bgImage', window.pendingMigration.bg);
            console.log('📦 تم ترحيل صورة الخلفية');
            migrated = true;
        }
        if (window.pendingMigration.enemy && !(await storage.loadImageFromStore('enemy', 'main'))) {
            await storage.saveImage('enemyImage', window.pendingMigration.enemy);
            console.log('📦 تم ترحيل صورة العدو');
            migrated = true;
        }
        
        if (migrated) {
            localStorage.removeItem('playerImage');
            localStorage.removeItem('bgImage');
            localStorage.removeItem('enemyImage');
            localStorage.setItem('migrationToIndexedDB', 'done');
            console.log('✅ تم الترحيل بنجاح ومسح التخزين القديم');
        }
        
        delete window.pendingMigration;
    }
    
    // التحقق من وجود الصور
    const existingPlayer = await storage.loadImageFromStore('player', 'main');
    const existingBg = await storage.loadImageFromStore('background', 'main');
    const existingEnemy = await storage.loadImageFromStore('enemy', 'main');
    
    const pData = await storage.loadImageAsDataURL('ranav.png');
    const bData = await storage.loadImageAsDataURL('ranav_ingdom.png');
    const eData = await storage.loadImageAsDataURL('enemy.png');
    
    // صورة اللاعب
    if (!existingPlayer) {
        if (pData) {
            await storage.saveImage('playerImage', pData);
            console.log('🎮 تم تحميل صورة اللاعب الافتراضية');
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(0, 0, 800, 200);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PLAYER', 400, 110);
            await storage.saveImage('playerImage', canvas.toDataURL());
            console.log('🎨 تم إنشاء صورة لاعب افتراضية');
        }
    }
    
    // صورة الخلفية
    if (!existingBg) {
        if (bData) {
            await storage.saveImage('bgImage', bData);
            console.log('🌄 تم تحميل صورة الخلفية الافتراضية');
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a472a';
            ctx.fillRect(0, 0, 1920, 1080);
            await storage.saveImage('bgImage', canvas.toDataURL());
            console.log('🎨 تم إنشاء خلفية افتراضية');
        }
    }
    
    // صورة العدو
    if (!existingEnemy) {
        if (eData) {
            await storage.saveImage('enemyImage', eData);
            console.log('👾 تم تحميل صورة العدو الافتراضية');
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(100, 100, 80, 0, Math.PI * 2);
            ctx.fill();
            await storage.saveImage('enemyImage', canvas.toDataURL());
            console.log('🎨 تم إنشاء صورة عدو افتراضية');
        }
    }
    
    await storage.waitForImages();
    
    // تحديث المعاينات
    const playerPreview = document.getElementById('playerPreview');
    const bgPreview = document.getElementById('bgPreview');
    const enemyPreview = document.getElementById('enemyPreview');
    
    if (playerPreview && storage.player) playerPreview.src = storage.player;
    if (bgPreview && storage.bg) bgPreview.src = storage.bg;
    if (enemyPreview && storage.enemy) enemyPreview.src = storage.enemy;
    
    uiManager.updateFileNameDisplay();
    
    const info = await storage.getStorageInfo();
    console.log(`✅ تم التهيئة | المستخدم: ${info.totalUsedMB} MB / ${info.totalMB} MB`);
})();

// تحديث عرض القائمة
uiManager.updateMenuDisplay();

// إعداد رافعات الصور
const playerImgObj = new Image();
const bgImgObj = new Image();
const enemyImgObj = new Image();

setTimeout(async () => {
    if (storage.player) playerImgObj.src = storage.player;
    if (storage.bg) bgImgObj.src = storage.bg;
    if (storage.enemy) enemyImgObj.src = storage.enemy;
}, 500);

uiManager.setupImageLoader('playerLoader', 'playerPreview', 'playerImage', playerImgObj);
uiManager.setupImageLoader('bgLoader', 'bgPreview', 'bgImage', bgImgObj);
uiManager.setupImageLoader('enemyLoader', 'enemyPreview', 'enemyImage', enemyImgObj);

uiManager.applyBtnSize(storage.btnSize);

document.getElementById('openCustomizer').onclick = () => {
    uiManager.showCustomizer();
};

document.getElementById('closeCustomizer').onclick = () => {
    uiManager.hideCustomizer();
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyS' && e.repeat) {
        e.preventDefault();
    }
});

// بعد حفظ صورة الخلفية، أرسل حدث
const originalSaveImage = storage.saveImage.bind(storage);
storage.saveImage = async (key, dataUrl) => {
    await originalSaveImage(key, dataUrl);
    if (key === 'bgImage') {
        window.dispatchEvent(new Event('bgImageChanged'));
    }
};

// زر تشغيل/إيقاف الموسيقى في القائمة الرئيسية
const musicMenuBtn = document.getElementById('musicMenuToggleBtn');
if (musicMenuBtn) {
    musicMenuBtn.onclick = async () => {
        const newState = !storage.music_c;
        storage.music_c = newState;
        localStorage.setItem('music_c', newState);
        
        if (window.currentGame) {
            window.currentGame.music_c = newState;
            if (newState && window.currentGame.bgMusic.src) {
                window.currentGame.bgMusic.play().catch(e => console.log(e));
            } else if (!newState && window.currentGame.bgMusic) {
                window.currentGame.bgMusic.pause();
            }
        }
        
        musicMenuBtn.innerText = newState ? "🎵 موسيقى: ON" : "🔇 موسيقى: OFF";
    };
    
    const savedMusic = localStorage.getItem('music_c') === 'true';
    musicMenuBtn.innerText = savedMusic ? "🎵 موسيقى: ON" : "🔇 موسيقى: OFF";
}

// في نهاية main.js، بعد تعريف storage
window.storage = storage;