// StorageManager.js - نسخة معدلة بالكامل مع IndexedDB ومخازن منفصلة
export class StorageManager {
    constructor() {
        this.dbName = 'CheetahGameDB';
        this.dbVersion = 1;
        this.db = null;
        this.initPromise = null;
        
// نقرأ القيمة المخزنة أولاً
let savedMusic = localStorage.getItem('music_c');

if (savedMusic === null) {
    savedMusic = 'true';
    localStorage.setItem('music_c', 'true');
}

this.music_c = savedMusic === 'true';


        // الإعدادات العادية في localStorage
        this.blockCG = parseInt(localStorage.getItem('blockCG')) || 0;
        this.platforms = JSON.parse(localStorage.getItem('gamePlatforms') || "[]");
        this.lastX = parseFloat(localStorage.getItem('playerLastX')) || 400;
        this.lastY = parseFloat(localStorage.getItem('playerLastY')) || 1400;
        this.kills = parseInt(localStorage.getItem('totalKills')) || 0;
        this.btnSize = localStorage.getItem('controlsSize') || 75;
        this.playerName = localStorage.getItem('playerName') || '';
        this.zoom = parseFloat(localStorage.getItem('gameZoom')) || 1.5;
        
        this.speed = parseFloat(localStorage.getItem('playerSpeed')) || 450;
        this.dash_s = parseFloat(localStorage.getItem('playerDashSpeed')) || 1500;
        this.damage_p = parseFloat(localStorage.getItem('playerDamage')) || 100;
        this.radius_dp = parseFloat(localStorage.getItem('damageRadius')) || 170;
        
        const savedJump = localStorage.getItem('playerJumpForce');
        this.jumpForce = savedJump !== null ? parseFloat(savedJump) : -790;
        
        // متغيرات الصور (سيتم تحميلها من IndexedDB)
        this.player = null;
        this.bg = null;
        this.enemy = null;
        
        // بدء تهيئة IndexedDB
        this.initDB();
    }
    
    async initDB() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('❌ فشل فتح قاعدة البيانات');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB متصلة بنجاح');
                this.loadAllImages(); // تحميل الصور بعد الاتصال
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // مخزن منفصل لكل نوع صورة
                if (!db.objectStoreNames.contains('player')) {
                    db.createObjectStore('player', { keyPath: 'id' });
                    console.log('✅ تم إنشاء مخزن اللاعب');
                }
                if (!db.objectStoreNames.contains('background')) {
                    db.createObjectStore('background', { keyPath: 'id' });
                    console.log('✅ تم إنشاء مخزن الخلفية');
                }
                if (!db.objectStoreNames.contains('enemy')) {
                    db.createObjectStore('enemy', { keyPath: 'id' });
                    console.log('✅ تم إنشاء مخزن العدو');
                }
            };
        });
        
        return this.initPromise;
    }
    
    async loadAllImages() {
        await this.initDB();
        
        // تحميل صورة اللاعب
        this.player = await this.loadImageFromStore('player', 'main');
        // تحميل صورة الخلفية
        this.bg = await this.loadImageFromStore('background', 'main');
        // تحميل صورة العدو
        this.enemy = await this.loadImageFromStore('enemy', 'main');
        
        console.log('🖼️ تم تحميل جميع الصور من IndexedDB');
        
        // عرض مساحة التخزين
        const info = await this.getStorageInfo();
        console.log(`💾 مساحة الصور المستخدمة: ${info.totalUsedMB} MB`);
    }
    
    async loadImageFromStore(storeName, imageId) {
        await this.initDB();
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(imageId);
            
            request.onsuccess = () => {
                resolve(request.result ? request.result.data : null);
            };
            
            request.onerror = () => resolve(null);
        });
    }
    
    async saveImageToStore(storeName, imageId, dataUrl) {
        await this.initDB();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const sizeInMB = (dataUrl.length * 0.75) / (1024 * 1024);
            console.log(`💾 حفظ في ${storeName}: ${sizeInMB.toFixed(2)} MB`);
            
            const record = {
                id: imageId,
                data: dataUrl,
                timestamp: Date.now(),
                sizeMB: sizeInMB
            };
            
            const request = store.put(record);
            
            request.onsuccess = () => {
                console.log(`✅ تم حفظ ${storeName}`);
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveImage(key, dataUrl) {
        switch(key) {
            case 'playerImage':
                await this.saveImageToStore('player', 'main', dataUrl);
                this.player = dataUrl;
                break;
            case 'bgImage':
                await this.saveImageToStore('background', 'main', dataUrl);
                this.bg = dataUrl;
                break;
            case 'enemyImage':
                await this.saveImageToStore('enemy', 'main', dataUrl);
                this.enemy = dataUrl;
                break;
        }
        
        const info = await this.getStorageInfo();
        console.log(`💾 مساحة الصور الآن: ${info.totalUsedMB} MB`);
    }
    
    async deleteImage(key) {
        await this.initDB();
        
        let storeName = '';
        switch(key) {
            case 'playerImage':
                storeName = 'player';
                this.player = null;
                break;
            case 'bgImage':
                storeName = 'background';
                this.bg = null;
                break;
            case 'enemyImage':
                storeName = 'enemy';
                this.enemy = null;
                break;
            default: return;
        }
        
        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete('main');
            
            request.onsuccess = () => {
                console.log(`🗑️ تم حذف ${storeName}`);
                resolve();
            };
            request.onerror = () => resolve();
        });
    }
    
    async getStorageInfo() {
        await this.initDB();
        
        let totalSize = 0;
        const stores = ['player', 'background', 'enemy'];
        
        for (const storeName of stores) {
            const images = await new Promise((resolve) => {
                const transaction = this.db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => resolve([]);
            });
            
            for (const img of images) {
                totalSize += img.data.length * 0.75;
            }
        }
        
        let estimatedQuota = 500 * 1024 * 1024;
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            estimatedQuota = estimate.quota;
        }
        
        return {
            totalUsedMB: (totalSize / (1024 * 1024)).toFixed(2),
            availableMB: ((estimatedQuota - totalSize) / (1024 * 1024)).toFixed(2),
            totalMB: (estimatedQuota / (1024 * 1024)).toFixed(2)
        };
    }
    
    async waitForImages() {
        await this.initDB();
        // الانتظار حتى تحميل الصور
        while (this.player === null && this.bg === null && this.enemy === null) {
            await new Promise(r => setTimeout(r, 50));
        }
    }
    
    // باقي الدوال كما هي بدون تغيير
    saveZoom(zoom) {
        localStorage.setItem('gameZoom', zoom);
        this.zoom = zoom;
    }

    saveBlockCG(count) {
        localStorage.setItem('blockCG', count);
        this.blockCG = count;
    }

    savePlayerPosition(x, y) {
        localStorage.setItem('playerLastX', x);
        localStorage.setItem('playerLastY', y);
    }

    savePlatforms(platforms) {
        localStorage.setItem('gamePlatforms', JSON.stringify(platforms));
        this.platforms = platforms;
    }

    saveKills(kills) {
        localStorage.setItem('totalKills', kills);
        this.kills = kills;
    }

    saveControlsSize(size) {
        localStorage.setItem('controlsSize', size);
        this.btnSize = size;
    }

    savePlayerName(name) {
        localStorage.setItem('playerName', name);
        this.playerName = name;
    }

    clearPlatforms() {
        localStorage.removeItem('gamePlatforms');
        this.platforms = [];
    }

    saveJumpForce(force) {
        const numForce = parseFloat(force);
        if (!isNaN(numForce)) {
            localStorage.setItem('playerJumpForce', numForce);
            this.jumpForce = numForce;
            console.log('JumpForce saved:', numForce);
            return true;
        }
        return false;
    }

    async loadImageAsDataURL(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch(e) { return null; }
    }
}