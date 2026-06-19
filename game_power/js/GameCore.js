// GameCore.js - نسخة محسنة بحركة ناعمة باستخدام تقنيات الألعاب الاحترافية

import { InputHandler } from './InputHandler.js';

export class GameCore {
    constructor(mode, storage, uiManager) {
    	
    this.power_b = 25;
    this.canUseSpecial = true;
        this.attackHoldTimeout = null;
        this.resetRowTimeout = null; // لم يعد مستخدماً للإنهاء المباشر
        this.isAttackPressed = false;
        
        // متغيرات العداد الجديد
        this.abilityCooldownRemaining = 0;
        this.abilityDurationRemaining = 0;
    
    this.size_p_f = 50;
        this.staticBlocks = [];
        this.deadFrameOffsetY = 0;
        this.deadFrameRiseSpeed = 100;
        const savedSuperMode = localStorage.getItem('superModeEnabled');
        this.damageCircleEnabled = savedSuperMode !== null ? (parseInt(savedSuperMode) === 0) : false;
        this.canUseSpecial = true;
        this.attackHoldTimeout = null;
        this.resetRowTimeout = null;
        this.isAttackPressed = false;
        this.abilityCooldownRemaining = 0;
        this.abilityDurationRemaining = 0;
        this.bossIsActive = false;
        this.spawningEnabled = true;
        this.countD = 0;
        this.zoom = storage.zoom || 1.5;
        this.radius_dp = storage.radius_dp;
        this.damage_p = storage.damage_p;
        this.useTopRow = 1;
        this.dash_s = storage.dash_s;
        this.bgMusic = new Audio();
        this.bgMusic.loop = true;
        this.blockCG = storage.blockCG;
        this.isPaused = false;
        this.mode = mode;
        this.storage = storage;
        this.uiManager = uiManager;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        
        this.LOGIC_WIDTH = 1280;
        this.LOGIC_HEIGHT = 720;
        
        // --- تقنيات الحركة الناعمة ---
        this.FIXED_TIMESTEP = 1 / 60; // 60 إطار في الثانية للفيزياء
        this.accumulator = 0;
        this.lastTimestamp = 0;
        
        // متغيرات الاستيفاء (Interpolation) للرسم الناعم
        this.renderX = storage.lastX;
        this.renderY = storage.lastY;
        this.prevX = storage.lastX;
        this.prevY = storage.lastY;
        this.renderCamX = storage.lastX;
        this.renderCamY = storage.lastY;
        this.prevCamX = storage.lastX;
        this.prevCamY = storage.lastY;
        
        this.x = storage.lastX;
        this.y = storage.lastY;
        this.playerHealth = 100;
        this.maxHealth = 100;
        
        this.enemies = [];
        this.enemySpawnTimer = 0;
        this.speed = storage.speed;
        this.gravity = 1340;
        this.jumpForce = storage.jumpForce;
        this.velocityY = 0;
        this.moveDir = 0;
        this.facingRight = true;
        this.groundY = 1200;
        this.radius = 60;
        this.jumpCount = 0;
        this.camX = this.x;
        this.camY = this.y;
        this.leftBoundX = -1300;
        this.rightBoundX = 11000;
        this.boundaryLineWidth = 5;
        
        this.isDashing = false;
        this.canDash = true;
        this.isAttacking = false;
        this.attackTime = 0;
        this.canAttack = true;
        
        this.platforms = [...storage.platforms];
        
        this.isDead = false;
        
        this.currentFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.12;
        this.walkFrame = 1;
        
        this.playerImg = new Image();
        this.bgImg = new Image();
        this.enemyImg = new Image();
        
        this.pinkSquare = {
    sourceX: 770 / 810,
    sourceY: 1175 / 1215,
    size: 40 / 810
};
        
        this.input = new InputHandler(this);
        this.init();
    }
    
// دالة init تبقى كما هي بدون تغيير (لأنها لا تحتاج await)
init() {
    this.loadImages();
    
    // تشغيل الموسيقى حسب حالة storage.music_c
    if (this.storage.music_c) {
        if (this.mode === 'survival') this.bgMusic.src = 'sounds/survival_bg.mp3';
        else if (this.mode === 'creative') this.bgMusic.src = 'sounds/creative_bg.mp3';
        
        // محاولة التشغيل (قد تمنعها المتصفحات)
        this.bgMusic.play().catch(err => console.log("بانتظار تفاعل المستخدم لتشغيل الصوت"));
    }
    
    document.getElementById('mainMenu').style.display = 'none';
    this.canvas.style.display = 'block';
    document.getElementById('uiLayer').style.display = 'block';
    if(this.mode === 'survival') document.getElementById('healthBarContainer').style.display = 'block';
    
    this.uiManager.updateBlockCounter(this.blockCG);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.bindControls();
    requestAnimationFrame((t) => this.loop(t));
}

toggleMusic() {
    this.music_c = !this.music_c;
    this.storage.music_c = this.music_c;
    localStorage.setItem('music_c', this.music_c);
    
    if (this.music_c) {
        if (!this.bgMusic.src) {
            if (this.mode === 'survival') this.bgMusic.src = 'sounds/survival_bg.mp3';
            else if (this.mode === 'creative') this.bgMusic.src = 'sounds/creative_bg.mp3';
        }
        this.bgMusic.play().catch(e => console.log("خطأ", e));
    } else {
        this.bgMusic.pause();
    }
}
    
    resize() {
        this.scale = Math.min(window.innerWidth / this.LOGIC_WIDTH, window.innerHeight / this.LOGIC_HEIGHT);
        this.canvas.width = this.LOGIC_WIDTH * this.scale;
        this.canvas.height = this.LOGIC_HEIGHT * this.scale;
        this.ctx.imageSmoothingEnabled = false;
    }
    
    updateZoom(newZoom) {
    // تحديد نطاق الزوم بين 1 و 4
    this.zoom = Math.min(4, Math.max(1, newZoom));
    
    // حفظ القيمة في التخزين
    this.storage.saveZoom(this.zoom);
    
    // تحديث العرض في الواجهة إذا كان العنصر موجوداً
    const zoomValueDisplay = document.getElementById('zoomValueDisplay');
    if (zoomValueDisplay) {
        zoomValueDisplay.innerText = this.zoom.toFixed(1) + 'x';
    }
    
    // تحديث شريط التحكم في الزوم في القائمة (إذا كان مفتوحاً)
    const zoomSlider = document.getElementById('zoomSlider');
    if (zoomSlider) {
        zoomSlider.value = this.zoom;
        const zoomVal = document.getElementById('zoomVal');
        if (zoomVal) zoomVal.innerText = this.zoom;
    }
    
    console.log('Zoom changed to:', this.zoom);
}

// استبدل دالة loadImages الموجودة بهذه النسخة:
loadImages() {
    // استخدام الصور مباشرة من storage (ستكون جاهزة لأننا ننتظر في main.js)
    if(this.storage.player) {
        this.playerImg.src = this.storage.player;
    }
    if(this.storage.bg) {
        this.bgImg.src = this.storage.bg;
    }
    if(this.storage.enemy) {
        this.enemyImg.src = this.storage.enemy;
    }
    
    console.log('🖼️ تم تحميل الصور في اللعبة');
}

    
    spawnEnemy() {
        if (this.mode !== 'survival' || this.isDead || !this.spawningEnabled) return;
        const side = Math.random() > 0.5 ? 1 : -1;
        this.enemies.push({ 
            x: this.x + (side * 1000), y: this.y - 100, health: 50 + this.storage.kills, 
            maxHealth: 50 + this.storage.kills, radius: 70, speed: 200,
            damageCircleActive: false, damageCircleTimer: 0, damageCircleRadius: 120, damageCirclePosition: null,
            // متغيرات الاستيفاء للأعداء
            renderX: this.x + (side * 1000),
            renderY: this.y - 100,
            prevX: this.x + (side * 1000),
            prevY: this.y - 100
        });
    }
    
    spawnStaticBlock(x, y, size = 40) {
        if (!this.staticBlocks) this.staticBlocks = [];
        this.staticBlocks.push({
            x: x, y: y, size: size, originalY: y, bobOffset: Math.random() * Math.PI * 2,
            bobSpeed: 2, bobAmount: 5
        });
    }
    
    spawnEnemyBoss() {
        if (this.mode !== 'survival' || this.isDead || this.bossIsActive) return;
        this.bossIsActive = true;
        this.spawningEnabled = false;
        const side = Math.random() > 0.5 ? 1 : -1;
        this.enemies.push({ 
            x: this.x + (side * 1000), y: this.y - 100, health: 230 + 3 * this.storage.kills, 
            maxHealth: 200 + 3 * this.storage.kills, radius: 150, speed: 200,
            damageCircleActive: false, damageCircleTimer: 0, damageCircleRadius: 120, damageCirclePosition: null,
            renderX: this.x + (side * 1000),
            renderY: this.y - 100,
            prevX: this.x + (side * 1000),
            prevY: this.y - 100
        });
    }
    
    checkAndHandleEnemyDeath() {
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.health <= 0) {
                this.spawnStaticBlock(enemy.x, enemy.y - 50, 45);
                if (enemy.radius > 100) {
                    this.bossIsActive = false;
                    this.spawningEnabled = true;
                    this.blockCG += this.storage.kills;
                    this.storage.kills++;
                    this.playerHealth = this.maxHealth;
                    this.uiManager.updateHealth(this.playerHealth, this.maxHealth);
                } else {
                    this.storage.kills++;
                    if (this.storage.kills > 0 && this.storage.kills % 30 === 0 && !this.bossIsActive && this.spawningEnabled) {
                        this.spawnEnemyBoss();
                    }
                    this.storage.saveKills(this.storage.kills);
                    this.uiManager.updateMenuDisplay();
                }
                this.enemies.splice(i, 1);
                this.storage.saveBlockCG(this.blockCG);
                this.uiManager.updateBlockCounter(this.blockCG);
                i--;
            }
        }
    }
    
activateSuperPower() {
        // التحقق من الجاهزية وعدد البلوكات المتاحة
        if (!this.canUseSpecial || this.blockCG < this.power_b) return;

        // زيادة الصحة واستهلاك البلوكات وتحديث الواجهة
        if (this.playerHealth + 30 > this.maxHealth) this.playerHealth = this.maxHealth;
        else this.playerHealth += 30;
        
        this.blockCG -= this.power_b;
        this.storage.saveBlockCG(this.blockCG);
        this.uiManager.updateBlockCounter(this.blockCG);

        // تفعيل الخصائص الخارقة (مضاعفة القوة والسرعة)
        this.useTopRow = 0;
        this.playerHealth *= 2;
        this.maxHealth *= 2;
        this.speed *= 1.5;
        this.dash_s *= 1.5;
        this.damage_p *= 2;
        this.radius_dp *= 1.5;

        // ضبط العدادات الزمنية للقوة
        this.abilityCooldownRemaining = 100; // مدة إعادة الشحن 100 ثانية
        this.abilityDurationRemaining = 30;  // مدة استمرار القوة 30 ثانية
        this.canUseSpecial = false;

        // إلغاء أي مؤقتات سابقة إذا وجدت لضمان النظافة
        if (this.resetRowTimeout) {
            clearTimeout(this.resetRowTimeout);
            this.resetRowTimeout = null;
        }
        
        // ملاحظة: تم إزالة setTimeout الخاص بإعادة الشحن لأننا سنعتمد على abilityCooldownRemaining في fixedUpdate
    }
    
    deactivateSuperPower() {
        // التحقق من أن القوة تعمل حالياً (عبر فحص حالة استخدام الصف العلوي) لمنع الإلغاء المتكرر
        if (this.useTopRow === 1) return; 

        console.log("جاري إلغاء القوة الخارقة واستعادة القيم الأصلية...");

        // إعادة الخصائص إلى القيم الأصلية بدقة
        this.playerHealth /= 2; 
        this.maxHealth /= 2; 
        this.useTopRow = 1;
        
        // استعادة القيم الأصلية بدقة تامة
        this.speed /= 1.5;
        this.dash_s /= 1.5;
        this.damage_p /= 2;
        this.radius_dp /= 1.5;

        // تأكد من أن العداد صفر
        this.abilityDurationRemaining = 0;
        
        console.log(`تم الاستعادة: Speed=${this.speed}, Dash=${this.dash_s}`);
    }
    
    updateAnimation(dt, isMoving) {
        let baseFrame = 0;
        if (this.isDead) baseFrame = 5;
        else if (this.isAttacking) baseFrame = 7;
        else if (this.isDashing) baseFrame = 6;
        else if (Math.abs(this.velocityY) > 50 || this.jumpCount > 0) baseFrame = 5;
        else if (isMoving && this.moveDir !== 0) {
            this.animTimer += dt;
            if (this.animTimer >= this.animSpeed) { 
                this.animTimer = 0; 
                this.walkFrame = (this.walkFrame % 4) + 1; 
            }
            baseFrame = this.walkFrame;
        } else {
            baseFrame = 0;
            this.walkFrame = 1;
            this.animTimer = 0;
        }
        this.currentFrame = (this.useTopRow == 1) ? baseFrame : baseFrame + 8;
    }
    
    bindControls() {
    // متغيرات للضغط المستمر للزوم
    let zoomInterval = null;
    let currentZoomAction = null;
    const ZOOM_STEP = 0.5;
    
    // دالة بدء التكبير/التصغير
    const startZoom = (action) => {
        if (action === 'in') {
            let newZoom = Math.min(4, this.zoom + ZOOM_STEP);
            this.updateZoom(newZoom);
        } else if (action === 'out') {
            let newZoom = Math.max(1, this.zoom - ZOOM_STEP);
            this.updateZoom(newZoom);
        }
        
        currentZoomAction = action;
        if (zoomInterval) clearInterval(zoomInterval);
        zoomInterval = setInterval(() => {
            if (action === 'in') {
                let newZoom = Math.min(4, this.zoom + ZOOM_STEP);
                this.updateZoom(newZoom);
            } else if (action === 'out') {
                let newZoom = Math.max(1, this.zoom - ZOOM_STEP);
                this.updateZoom(newZoom);
            }
        }, 150);
    };
    
    const stopZoom = () => {
        if (zoomInterval) {
            clearInterval(zoomInterval);
            zoomInterval = null;
        }
        currentZoomAction = null;
    };
    
    // ربط أزرار الزوم
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (zoomInBtn) {
        zoomInBtn.onclick = null;
        zoomInBtn.onpointerdown = null;
        zoomInBtn.onpointerup = null;
        
        zoomInBtn.onpointerdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            startZoom('in');
        };
        zoomInBtn.onpointerup = stopZoom;
        zoomInBtn.onpointerleave = stopZoom;
        
        zoomInBtn.onmousedown = (e) => {
            e.preventDefault();
            startZoom('in');
        };
        zoomInBtn.onmouseup = stopZoom;
        zoomInBtn.onmouseleave = stopZoom;
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.onclick = null;
        zoomOutBtn.onpointerdown = null;
        zoomOutBtn.onpointerup = null;
        
        zoomOutBtn.onpointerdown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            startZoom('out');
        };
        zoomOutBtn.onpointerup = stopZoom;
        zoomOutBtn.onpointerleave = stopZoom;
        
        zoomOutBtn.onmousedown = (e) => {
            e.preventDefault();
            startZoom('out');
        };
        zoomOutBtn.onmouseup = stopZoom;
        zoomOutBtn.onmouseleave = stopZoom;
    }
    
    // ========== باقي الكود من هنا ==========
    
    // زر الإيقاف المؤقت
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
        pauseBtn.onclick = () => {
            this.isPaused = !this.isPaused;
            pauseBtn.innerText = this.isPaused ? "استئناف" : "إيقاف";
            pauseBtn.style.background = this.isPaused ? "var(--success)" : "var(--primary)";
            if (window) {
                window.isGamePaused = this.isPaused;
            }
        };
    }
    
    // دالة مساعدة لربط أزرار التحكم
    const btn = (id, down, up) => {
        const el = document.getElementById(id);
        if(el) {
            el.onpointerdown = (e) => { e.preventDefault(); if(!this.isDead) down(); };
            if(up) el.onpointerup = (e) => { e.preventDefault(); up(); };
        }
    };
    
    // أزرار الحركة والهجوم
    btn('leftBtn', () => { this.moveDir = -1; this.facingRight = false; }, () => this.moveDir = 0);
    btn('rightBtn', () => { this.moveDir = 1; this.facingRight = true; }, () => this.moveDir = 0);
    btn('jumpBtn', () => { if(this.jumpCount < 2 && !this.isDead) { this.velocityY = this.jumpForce; this.jumpCount++; } });
    btn('dashBtn', () => { if (this.canDash && !this.isDead) { this.isDashing = true; this.canDash = false; setTimeout(() => this.isDashing = false, 200); setTimeout(() => this.canDash = true, 760); } });
    
    btn('attackBtn', () => { 
        if (this.canAttack && !this.isDead) { 
            this.isAttacking = true; 
            this.attackTime = 0.3; 
            this.canAttack = false; 
            const attackBtn = document.getElementById('attackBtn');
            if(attackBtn) attackBtn.style.opacity = "0.3";
            this.attackHoldTimeout = setTimeout(() => { this.activateSuperPower(); }, 500);
            setTimeout(() => { this.canAttack = true; if(attackBtn) attackBtn.style.opacity = "1"; }, 600);
        } 
    }, () => { if (this.attackHoldTimeout) { clearTimeout(this.attackHoldTimeout); this.attackHoldTimeout = null; } });
    
    // الضغط على الكانفاس للبناء/الهدم
    this.canvas.onpointerdown = (e) => {
        if(this.isDead) return;
        const rect = this.canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / (this.scale * this.zoom) + this.camX - (this.LOGIC_WIDTH / (2 * this.zoom));
        const my = (e.clientY - rect.top) / (this.scale * this.zoom) + this.camY - (this.LOGIC_HEIGHT / (2 * this.zoom));
        const gx = Math.floor(mx/60)*60;
        const gy = Math.floor(my/60)*60;
        const idx = this.platforms.findIndex(p => p.x === gx && p.y === gy);
        if (idx !== -1) {
            this.platforms.splice(idx, 1);
            this.blockCG++;
            this.storage.saveBlockCG(this.blockCG);
            this.uiManager.updateBlockCounter(this.blockCG);
        } else {
            if (this.blockCG <= 0) { this.showNoBlocksWarning(); return; }
            this.platforms.push({x: gx, y: gy});
            this.blockCG--;
            this.storage.saveBlockCG(this.blockCG);
            this.uiManager.updateBlockCounter(this.blockCG);
        }
    };
    
    // أزرار الخروج والمسح
    document.getElementById('exitBtn').onclick = () => { this.storage.savePlayerPosition(this.x, this.y); this.storage.savePlatforms(this.platforms); location.reload(); };
    document.getElementById('clearBtn').onclick = () => { this.storage.clearPlatforms(); location.reload(); };
}
    
    updateStaticBlocks(dt) {
        if (!this.staticBlocks) return;
        for (let i = 0; i < this.staticBlocks.length; i++) {
            const block = this.staticBlocks[i];
            block.bobOffset += dt * block.bobSpeed;
            block.y = block.originalY + Math.sin(block.bobOffset) * block.bobAmount;
        }
    }
    
    checkBlockCollection() {
        for (let i = 0; i < this.staticBlocks.length; i++) {
            const block = this.staticBlocks[i];
            const dx = this.x - block.x;
            const dy = this.y - block.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.radius + block.size/2) {
                this.blockCG++;
                this.storage.saveBlockCG(this.blockCG);
                this.uiManager.updateBlockCounter(this.blockCG);
                this.staticBlocks.splice(i, 1);
                i--;
            }
        }
    }
    
    // تحديث الفيزياء بوقت ثابت (Fixed Update)
    fixedUpdate(dt) {
        if(this.stopUpdating || this.isPaused) return;
        
        // حفظ الموضع السابق للاستيفاء
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevCamX = this.camX;
        this.prevCamY = this.camY;
        
        // حفظ مواضع الأعداء السابقة
        for (const enemy of this.enemies) {
            enemy.prevX = enemy.x;
            enemy.prevY = enemy.y;
        }
        
        this.checkBlockCollection();
        this.updateStaticBlocks(dt);
        
        if (this.isDead) this.deadFrameOffsetY -= this.deadFrameRiseSpeed * dt;
        
// تحديث العدادات الزمنية
// تحديث العدادات الزمنية (تتجمد تلقائياً عند isPaused لأن الدالة تتوقف)
    
    // 1. عداد إعادة الاستخدام (Cooldown)
    if (this.abilityCooldownRemaining > 0) { 
        this.abilityCooldownRemaining -= dt; 
        if (this.abilityCooldownRemaining <= 0) {
            this.abilityCooldownRemaining = 0;
            this.canUseSpecial = true; // إعادة تفعيل الزر عند انتهاء الوقت
        }
    }
    
    // 2. عداد مدة القوة (Duration)
    if (this.abilityDurationRemaining > 0) { 
        this.abilityDurationRemaining -= dt; 
        
        // إذا انتهى وقت القوة أثناء اللعب
        if (this.abilityDurationRemaining <= 0) {
            this.abilityDurationRemaining = 0;
            this.deactivateSuperPower(); // استدعاء دالة الإلغاء
        }
    }
    
    // تحديث الواجهة بالقيم الحالية
    if (window.setAbilityTimers) window.setAbilityTimers(this.abilityCooldownRemaining, this.abilityDurationRemaining);
        // تحسين منطق دوائر الضرر
        if (this.damageCircleEnabled) {
            for (let i = 0; i < this.enemies.length; i++) {
                const enemy = this.enemies[i];
                let platformsToRemove = [];
                for (let pIndex = 0; pIndex < this.platforms.length; pIndex++) {
                    const platform = this.platforms[pIndex];
                    if (enemy.x + enemy.radius > platform.x && enemy.x - enemy.radius < platform.x + 60 &&
                        enemy.y + enemy.radius > platform.y && enemy.y - enemy.radius < platform.y + 60) {
                        platformsToRemove.push(pIndex);
                        this.countD++;
                        if(this.countD >= 3){
                            this.countD = 0;
                            if (!enemy.damageCircleActive) {
                                enemy.damageCircleActive = true;
                                enemy.damageCircleTimer = 0.5;
                                enemy.damageCircleRadius = 70;
                                enemy.damageCirclePosition = { x: enemy.x, y: enemy.y };
                            }
                        }
                    }
                }
                for (let r = platformsToRemove.length - 1; r >= 0; r--) {
                    const pIndex = platformsToRemove[r];
                    this.platforms.splice(pIndex, 1);
                    this.storage.saveBlockCG(this.blockCG);
                    this.uiManager.updateBlockCounter(this.blockCG);
                }
            }
        }
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.damageCircleActive) {
                for (let j = 0; j < this.enemies.length; j++) {
                    const otherEnemy = this.enemies[j];
                    const dx = otherEnemy.x - enemy.x;
                    const dy = otherEnemy.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < (enemy.damageCircleRadius || 120)) otherEnemy.health -= 34 * dt;
                }
            }
            if (enemy.damageCircleActive) {
                enemy.damageCircleTimer -= dt;
                if (enemy.damageCircleTimer <= 0) enemy.damageCircleActive = false;
            }
        }
        
        this.input.update();
        
        let moveSpeed = this.isDashing ? this.dash_s : this.speed;
        let effectiveDir = this.isDashing ? (this.facingRight ? 1 : -1) : this.moveDir;
        let nx = this.x + (effectiveDir * moveSpeed) * dt;
        let ny = this.y + this.velocityY * dt;
        
        if (this.isDashing) this.velocityY = 0;
        else this.velocityY += this.gravity * dt;
        
        // تحسين كشف التصادم مع المنصات
        for (let i = 0; i < this.platforms.length; i++) {
            const p = this.platforms[i];
            const pL = p.x, pR = p.x + 60, pT = p.y, pB = p.y + 60;
            if (nx + this.size_p_f > pL && nx - this.size_p_f < pR && ny + this.size_p_f > pT && ny - this.size_p_f < pB) {
                const oL = (nx + this.size_p_f) - pL;
                const oR = pR - (nx - this.size_p_f);
                const oT = (ny + this.size_p_f) - pT;
                const oB = pB - (ny - this.size_p_f);
                const min = Math.min(oL, oR, oT, oB);
                if (min === oT && this.velocityY > 0) { 
                    ny = pT - this.size_p_f; 
                    this.velocityY = 0; 
                    this.jumpCount = 0; 
                } else if (min === oB && this.velocityY < 0) { 
                    ny = pB + this.size_p_f; 
                    this.velocityY = 0; 
                } else if (min === oL) {
                    nx = pL - this.size_p_f;
                } else if (min === oR) {
                    nx = pR + this.size_p_f;
                }
            }
        }
        
        this.x = nx;
        this.y = ny;
        if (this.x < this.leftBoundX + this.size_p_f) this.x = this.leftBoundX + this.size_p_f;
        if (this.x > this.rightBoundX - this.size_p_f) this.x = this.rightBoundX - this.size_p_f;
        if (this.y >= this.groundY) { this.y = this.groundY; this.velocityY = 0; this.jumpCount = 0; }
        
        const isMoving = this.moveDir !== 0 && !this.isDashing && !this.isAttacking;
        this.updateAnimation(dt, isMoving);
        
        if (this.isAttacking) { this.attackTime -= dt; if (this.attackTime <= 0) this.isAttacking = false; }
        
        if (this.mode === 'survival') {
            this.enemySpawnTimer += dt;
            if (this.enemySpawnTimer > 8) {
                this.spawnEnemy();
                setTimeout(() => this.spawnEnemy(), 500);
                setTimeout(() => this.spawnEnemy(), 1000);
                this.enemySpawnTimer = 0;
            }
            for (let i = 0; i < this.enemies.length; i++) {
                const en = this.enemies[i];
                const dx = this.x - en.x;
                const dy = this.y - en.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 0.01) { 
                    en.x += (dx/dist) * en.speed * dt; 
                    en.y += (dy/dist) * en.speed * dt; 
                }
                if (dist < this.radius + en.radius) {
                    this.playerHealth -= 20 * dt;
                    this.uiManager.updateHealth(this.playerHealth, this.maxHealth);
if (this.playerHealth <= 0) { 
    this.isDead = true; 
    
    // 🟢 الحماية: حفظ الكتل الحالية فوراً لمنع المتصفح من تصفيرها عند الـ reload
    if (this.storage && typeof this.storage.savePlatforms === 'function') {
        this.storage.savePlatforms(this.platforms); 
    }
    
    // حفظ موقع اللاعب الأخير أيضاً إذا كنت تحتاجه
    if (this.storage && typeof this.storage.savePlayerPosition === 'function') {
        this.storage.savePlayerPosition(this.x, this.y);
    }

    setTimeout(() => { this.stopUpdating = true; }, 2000); 
    setTimeout(() => location.reload(), 2000); 
}

                }
                let attackX = this.facingRight ? this.x + 80 : this.x - 80;
                let attackDist = Math.sqrt((attackX - en.x)**2 + (this.y - en.y)**2);
let hitRadius = this.radius_dp + en.radius * 0.5; // منطقة الضرب = نصف قطر الضربة + نصف قطر البوس
if (this.isAttacking && attackDist < hitRadius) {
    en.health -= this.damage_p * dt;
    en.speed = 70;
} else {
    en.speed = 200; // القيمة الأصلية من constructor
}
            }
        }
        
        // تحديث الكاميرا مع smooth follow
        const FOLLOW_SPEED = 0.15;
        this.camX += (this.x - this.camX) * FOLLOW_SPEED;
        this.camY += (this.y - this.camY) * FOLLOW_SPEED;
        
        this.checkAndHandleEnemyDeath();
    }
    
    // الحلقة الرئيسية مع Fixed Timestep و Interpolation
    loop(timestamp) {
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        
        let dt = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
        this.lastTimestamp = timestamp;
        
        if (!this.isPaused && !this.stopUpdating) {
            // Fixed Timestep - تحديث الفيزياء بوقت ثابت
            this.accumulator += dt;
            
            // منع تراكم كبير (max 5 frames)
            if (this.accumulator > 0.1) this.accumulator = 0.1;
            
            while (this.accumulator >= this.FIXED_TIMESTEP) {
                this.fixedUpdate(this.FIXED_TIMESTEP);
                this.accumulator -= this.FIXED_TIMESTEP;
            }
            
            // حساب مواضع الرسم بالاستيفاء (Interpolation)
            const alpha = this.accumulator / this.FIXED_TIMESTEP;
            
            // استيفاء موضع اللاعب
            this.renderX = this.prevX + (this.x - this.prevX) * alpha;
            this.renderY = this.prevY + (this.y - this.prevY) * alpha;
            
            // استيفاء الكاميرا
            this.renderCamX = this.prevCamX + (this.camX - this.prevCamX) * alpha;
            this.renderCamY = this.prevCamY + (this.camY - this.prevCamY) * alpha;
            
            // استيفاء مواضع الأعداء
            for (const enemy of this.enemies) {
                enemy.renderX = enemy.prevX + (enemy.x - enemy.prevX) * alpha;
                enemy.renderY = enemy.prevY + (enemy.y - enemy.prevY) * alpha;
            }
        }
        
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
    
    drawPlayer() {
        this.ctx.save(); 
        // استخدام موضع الرسم المستوف (الناعم)
        this.ctx.translate(this.renderX, this.renderY);
        if (this.isDead) { this.ctx.translate(0, this.deadFrameOffsetY); this.ctx.globalAlpha = 0.6; }
        if (this.storage.playerName && this.storage.playerName !== 'undefined') {
            this.ctx.save();
            this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            this.ctx.font = "bold 18px Segoe UI";
            this.ctx.textAlign = "center";
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = "black";
            this.ctx.fillText(this.storage.playerName, 0, -85); 
            this.ctx.restore();
        }
        if(!this.facingRight) this.ctx.scale(-1, 1);
        if(this.playerImg.complete && this.playerImg.naturalWidth > 0) {
            const framesX = 8, framesY = 2;
            const frameW = this.playerImg.naturalWidth / framesX;
            const frameH = this.playerImg.naturalHeight / framesY;
            const frameCol = this.currentFrame % framesX;
            const frameRow = Math.floor(this.currentFrame / framesX) % framesY;
            const frameX = frameCol * frameW;
            const frameY = frameRow * frameH;
            this.ctx.drawImage(this.playerImg, frameX, frameY, frameW, frameH, -75, -75, 150, 150);
        } else {
            this.ctx.fillStyle = "#f39c12";
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    drawBoundaryLines() {
        this.ctx.save();
        const lineY = this.renderCamY;
        this.ctx.strokeStyle = "#ff3366";
        this.ctx.lineWidth = this.boundaryLineWidth;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = "#ff3366";
        this.ctx.beginPath();
        this.ctx.moveTo(this.leftBoundX, lineY - 500);
        this.ctx.lineTo(this.leftBoundX, lineY + 500);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.rightBoundX, lineY - 500);
        this.ctx.lineTo(this.rightBoundX, lineY + 500);
        this.ctx.stroke();
        this.ctx.strokeStyle = "rgba(255, 51, 102, 0.5)";
        this.ctx.lineWidth = this.boundaryLineWidth + 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.leftBoundX, lineY - 500);
        this.ctx.lineTo(this.leftBoundX, lineY + 500);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(this.rightBoundX, lineY - 500);
        this.ctx.lineTo(this.rightBoundX, lineY + 500);
        this.ctx.stroke();
        this.ctx.restore();
    }
    
    drawStaticBlocks() {
        if (!this.staticBlocks) return;
        for (const block of this.staticBlocks) {
            this.ctx.save();
            this.ctx.translate(block.x, block.y);
            const whiteAmount = (Math.sin(Date.now() / 120) + 1) / 4;
            if (this.bgImg.complete && this.bgImg.naturalWidth > 0) {
                this.ctx.drawImage(this.bgImg, this.pinkSquare.sourceX * this.bgImg.width, this.pinkSquare.sourceY * this.bgImg.height, this.pinkSquare.size * this.bgImg.width, this.pinkSquare.size * this.bgImg.width, -block.size/2, -block.size/2, block.size, block.size);
                this.ctx.fillStyle = `rgba(255, 255, 255, ${whiteAmount})`;
                this.ctx.fillRect(-block.size/2, -block.size/2, block.size, block.size);
            } else {
                const mix = Math.floor(243 - (243 - 255) * whiteAmount * 2);
                this.ctx.fillStyle = `rgb(255, ${mix}, ${Math.floor(156 + (255 - 156) * whiteAmount * 2)})`;
                this.ctx.fillRect(-block.size/2, -block.size/2, block.size, block.size);
            }
            this.ctx.restore();
        }
    }
    
    draw() {
        const s = this.scale * this.zoom;
        this.ctx.setTransform(s, 0, 0, s, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.clearRect(0, 0, this.LOGIC_WIDTH, this.LOGIC_HEIGHT);
        this.ctx.save();
        // استخدام موضع الكاميرا المستوف (الناعم)
        this.ctx.translate(-this.renderCamX + (this.LOGIC_WIDTH / (2 * this.zoom)), -this.renderCamY + (this.LOGIC_HEIGHT / (2 * this.zoom)));
        
        if(this.bgImg.complete && this.bgImg.naturalWidth > 0) { 
            const drawW = 1296 / this.zoom, drawH = 1944 / this.zoom;
            let startX = this.renderCamX - (this.LOGIC_WIDTH / (2 * this.zoom));
            let centerY = this.renderCamY - (drawH / 4);
            this.ctx.drawImage(this.bgImg, 0, 0, this.bgImg.width, this.bgImg.height / 2, startX + (drawW) - drawW, centerY, drawW, drawH / 2);
            const drawW2 = 3600, drawH2 = 5200;
            for(let i = -2000; i < 9000; i += (drawW2 - 1)) {
                this.ctx.drawImage(this.bgImg, 0, this.bgImg.height / 2, this.bgImg.width, this.bgImg.height / 2, i, -3350 + (drawH2 / 2), drawW2, drawH2 / 2);
            }
            this.drawBoundaryLines();
            this.ctx.save();
            this.ctx.drawImage(this.bgImg, this.pinkSquare.sourceX * this.bgImg.width, this.pinkSquare.sourceY * this.bgImg.height, this.pinkSquare.size * this.bgImg.width, this.pinkSquare.size * this.bgImg.width, this.renderX + 30, this.renderY - 20, 20, 20);
            this.ctx.restore();
        }
        
        this.drawStaticBlocks();
        this.platforms.forEach(p => {
            if(this.bgImg.complete && this.bgImg.naturalWidth > 0) this.ctx.drawImage(this.bgImg, this.pinkSquare.sourceX * this.bgImg.width, this.pinkSquare.sourceY * this.bgImg.height, this.pinkSquare.size * this.bgImg.width, this.pinkSquare.size * this.bgImg.width, p.x, p.y, 60, 60);
            else { this.ctx.fillStyle = "rgba(52, 152, 219, 0.6)"; this.ctx.fillRect(p.x, p.y, 60, 60); }
        });
        
        // رسم الأعداء باستخدام الموضع المستوف
        for (const en of this.enemies) {
            this.ctx.save();
            this.ctx.translate(en.renderX, en.renderY);
            if (this.renderX < en.renderX) this.ctx.scale(-1, 1);
            if(this.enemyImg.complete && this.enemyImg.naturalWidth > 0) {
                const frameW = this.enemyImg.naturalWidth;
                const frameH = this.enemyImg.naturalHeight / 2;
                const frameY = en.radius > 100 ? frameH : 0;
                this.ctx.drawImage(this.enemyImg, 0, frameY, frameW, frameH, -en.radius, -en.radius, en.radius * 2, en.radius * 2);
            } else {
                this.ctx.fillStyle = en.radius > 100 ? "#8e44ad" : "#e67e22";
                this.ctx.beginPath();
                this.ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
            const barWidth = 60;
            this.ctx.fillStyle = "#222";
            this.ctx.fillRect(en.renderX - barWidth/2, en.renderY - en.radius - 15, barWidth, 6);
            this.ctx.fillStyle = "#e74c3c";
            this.ctx.fillRect(en.renderX - barWidth/2, en.renderY - en.radius - 15, (en.health / en.maxHealth) * barWidth, 6);
        }
        
        for (const en of this.enemies) {
            if (en.damageCircleActive) {
                this.ctx.save();
                this.ctx.shadowBlur = 15;
                this.ctx.shadowColor = "#ff0000";
                this.ctx.beginPath();
                this.ctx.arc(en.renderX, en.renderY, en.damageCircleRadius || 120, 0, Math.PI * 2);
                this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(en.renderX, en.renderY, (en.damageCircleRadius || 120) * 0.6, 0, Math.PI * 2);
                this.ctx.fillStyle = "rgba(255, 100, 0, 0.5)";
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(en.renderX, en.renderY, en.damageCircleRadius || 120, 0, Math.PI * 2);
                this.ctx.strokeStyle = "#ff3300";
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                this.ctx.restore();
            }
        }
        
        this.drawPlayer();
        if (this.isAttacking && !this.isDead) {
            this.ctx.fillStyle = "rgba(231, 76, 60, 0.25)";
            this.ctx.beginPath();
            let offsetX = this.facingRight ? 80 : -80;
            this.ctx.arc(this.renderX + offsetX, this.renderY, this.radius_dp, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }
    
    showNoBlocksWarning() {
        const warning = document.createElement('div');
        warning.textContent = '⚠️ ليس لديك بلوكات كافية للبناء! ⚠️';
        warning.style.position = 'fixed';
        warning.style.bottom = '20px';
        warning.style.left = '50%';
        warning.style.transform = 'translateX(-50%)';
        warning.style.backgroundColor = 'rgba(0,0,0,0.8)';
        warning.style.color = '#f39c12';
        warning.style.padding = '8px 16px';
        warning.style.borderRadius = '20px';
        warning.style.fontSize = '14px';
        warning.style.zIndex = '2000';
        warning.style.pointerEvents = 'none';
        document.body.appendChild(warning);
        setTimeout(() => warning.remove(), 1500);
    }
}