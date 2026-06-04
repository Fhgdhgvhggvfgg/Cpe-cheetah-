import { GameCore } from './GameCore.js';
import { StorageManager } from './StorageManager.js';
import { UIManager } from './UIManager.js';

window.isGamePaused = false;

if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist();
}
// تهيئة مدير التخزين
const storage = new StorageManager();

// تهيئة مدير واجهة المستخدم
const uiManager = new UIManager(storage);

// طلب تخزين دائم (غير قابل للمسح من المتصفح)
if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(granted => {
        if (granted) {
            console.log("✅ التخزين الدائم ممنوح!");
        } else {
            console.log("⚠️ المستخدم لم يمنح التخزين الدائم");
        }
    });
}

// معرفة المساحة المتاحة
navigator.storage.estimate().then(estimate => {
    console.log("المساحة المتاحة:", estimate.quota / 1024 / 1024, "MB");
    console.log("المستخدم:", estimate.usage / 1024 / 1024, "MB");
});

// اطلب مساحة تخزين مؤقتة كبيرة أولاً
if (navigator.storage && navigator.storage.estimate) {
    navigator.storage.estimate().then(estimate => {
        // هذه المساحة ستزيد تلقائياً عند إضافة صور
        console.log("المساحة المحجوزة:", estimate.quota);
        console.log("المستخدم:", estimate.usage);
    });
}

// في بداية الملف بعد الاستيرادات
let currentGame = null;
window.currentGame = currentGame;

// ثم عند بدء اللعبة:
document.getElementById('survivalBtn').onclick = () => {
    storage.kills = 0;
    storage.saveKills(0);
    uiManager.updateMenuDisplay();
    currentGame = new GameCore('survival', storage, uiManager);
    window.currentGame = currentGame;
};

document.getElementById('creativeBtn').onclick = () => {
    currentGame = new GameCore('creative', storage, uiManager);
    window.currentGame = currentGame;
};

// تحميل الصور الافتراضية إذا لم تكن موجودة
(async function initDefaultImages() {
    const pData = await storage.loadImageAsDataURL('ranav.png');
    const bData = await storage.loadImageAsDataURL('ranav_ingdom.png');
    const eData = await storage.loadImageAsDataURL('enemy.png');
    
    
    // بعد الكود الموجود، أضف:
// إنشاء قيمة افتراضية لـ blockCG إذا لم تكن موجودة
if (!localStorage.getItem('blockCG')) {
    localStorage.setItem('blockCG', '0');
}
    if (pData && !localStorage.getItem('playerImage')) {
        storage.saveImage('playerImage', pData);
    }
    if (bData && !localStorage.getItem('bgImage')) {
        storage.saveImage('bgImage', bData);
    }
    if (eData && !localStorage.getItem('enemyImage')) {
        storage.saveImage('enemyImage', eData);
    }
    
    // إنشاء صور افتراضية إذا لم توجد أي صورة
    if (!localStorage.getItem('playerImage')) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(0, 0, 800, 100);
        storage.saveImage('playerImage', canvas.toDataURL());
    }
    
    if (!localStorage.getItem('bgImage')) {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, 1920, 1080);
        storage.saveImage('bgImage', canvas.toDataURL());
    }
    
    if (!localStorage.getItem('enemyImage')) {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(50, 50, 40, 0, Math.PI * 2);
        ctx.fill();
        storage.saveImage('enemyImage', canvas.toDataURL());
    }
    
    // تحديث المعاينات
    const playerPreview = document.getElementById('playerPreview');
    const bgPreview = document.getElementById('bgPreview');
    const enemyPreview = document.getElementById('enemyPreview');
    
    if (playerPreview && storage.player) playerPreview.src = storage.player;
    if (bgPreview && storage.bg) bgPreview.src = storage.bg;
    if (enemyPreview && storage.enemy) enemyPreview.src = storage.enemy;
    
    // تحديث عرض اسم اللاعب
    uiManager.updateFileNameDisplay();

})();

// تحديث عرض القائمة
uiManager.updateMenuDisplay();

// إعداد رافعات الصور
const playerImgObj = new Image();
const bgImgObj = new Image();
const enemyImgObj = new Image();

if (storage.player) playerImgObj.src = storage.player;
if (storage.bg) bgImgObj.src = storage.bg;
if (storage.enemy) enemyImgObj.src = storage.enemy;

uiManager.setupImageLoader('playerLoader', 'playerPreview', 'playerImage', playerImgObj);
uiManager.setupImageLoader('bgLoader', 'bgPreview', 'bgImage', bgImgObj);
uiManager.setupImageLoader('enemyLoader', 'enemyPreview', 'enemyImage', enemyImgObj);

// تطبيق حجم الأزرار المحفوظ
uiManager.applyBtnSize(storage.btnSize);

// أزرار القائمة الرئيسية
document.getElementById('survivalBtn').onclick = () => {
    storage.kills = 0;
    storage.saveKills(0);
    uiManager.updateMenuDisplay();
    new GameCore('survival', storage, uiManager);
};

document.getElementById('creativeBtn').onclick = () => {
    new GameCore('creative', storage, uiManager);
};

document.getElementById('openCustomizer').onclick = () => {
    uiManager.showCustomizer();
};

document.getElementById('closeCustomizer').onclick = () => {
    uiManager.hideCustomizer();
};

// أضف هذا الكود في آخر main.js (قبل السطر الأخير)

// منع التكرار التلقائي لزر الهجوم S
document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyS' && e.repeat) {
        e.preventDefault();
    }
});