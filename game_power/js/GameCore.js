import { InputHandler } from './InputHandler.js';

export class GameCore {
    constructor(mode, storage, uiManager) {
    	// أضف هذا مع باقي المتغيرات
const savedSuperMode = localStorage.getItem('superModeEnabled');
this.damageCircleEnabled = savedSuperMode !== null ? (parseInt(savedSuperMode) === 0) : false;
    this.canUseSpecial = true;
this.attackHoldTimeout = null;
this.resetRowTimeout = null;
    	// أضف هذا السطر مع باقي المتغيرات (قبل this.input = new InputHandler)
this.isAttackPressed = false;
    	// في constructor، بعد الأسطر الموجودة
this.abilityCooldownRemaining = 0;   // الوقت المتبقي لإعادة الاستخدام
this.abilityDurationRemaining = 0;   // الوقت المتبقي للقدرة النشطة
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
this.blockCG = storage.blockCG; // ربط مع التخزين
        this.isPaused = false;
        this.mode = mode;
        this.storage = storage;
        this.uiManager = uiManager;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // إعدادات منع التنعيم
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        
        this.LOGIC_WIDTH = 1280;
        this.LOGIC_HEIGHT = 720;
        
        // خصائص اللاعب
        this.x = storage.lastX;
        this.y = storage.lastY;
        this.playerHealth = 100;
        this.maxHealth = 100;
        
        // خصائص اللعبة
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
        // في constructor، بعد تعريف this.camY = this.y; أضف:
this.leftBoundX = -1550;
this.rightBoundX = 11000;
this.boundaryLineWidth = 5;  // عرض الخط
        // قدرات خاصة
        this.isDashing = false;
        this.canDash = true;
        this.isAttacking = false;
        this.attackTime = 0;
        this.canAttack = true;
        
        // المنصات
        this.platforms = [...storage.platforms];
        
        // حالة اللعبة
        this.isDead = false;
        this.lastTimestamp = 0;
        
        // خصائص الأنيميشن
        this.currentFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 0.12;
        this.walkFrame = 1;
        
        // صور اللعبة
        this.playerImg = new Image();
        this.bgImg = new Image();
        this.enemyImg = new Image();
        
        // المربع الوردي
        this.pinkSquare = {
            sourceX: 770,
            sourceY: 1175,
            size: 40
        };
        
        this.input = new InputHandler(this);
        this.init();
    }
    
init() {
    this.loadImages();
    
    if (this.mode === 'survival') {
        this.bgMusic.src = 'sounds/survival_bg.mp3';
    } else if (this.mode === 'creative') {
        this.bgMusic.src = 'sounds/creative_bg.mp3';
    }
    
    this.bgMusic.play().catch(err => console.log("بانتظار تفاعل المستخدم لتشغيل الصوت"));
    
    document.getElementById('mainMenu').style.display = 'none';
    this.canvas.style.display = 'block';
    document.getElementById('uiLayer').style.display = 'block';
    
    if(this.mode === 'survival') {
        document.getElementById('healthBarContainer').style.display = 'block';
    }
    
    // تحديث عداد البلوكات عبر UIManager
    this.uiManager.updateBlockCounter(this.blockCG);
    
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.bindControls();
    requestAnimationFrame((t) => this.loop(t));
}
    
    loadImages() {
        if(this.storage.player) {
            this.playerImg.src = this.storage.player;
        }
        if(this.storage.bg) {
            this.bgImg.src = this.storage.bg;
        }
        if(this.storage.enemy) {
            this.enemyImg.src = this.storage.enemy;
        }
    }
    
    resize() {
        this.scale = Math.min(window.innerWidth / this.LOGIC_WIDTH, window.innerHeight / this.LOGIC_HEIGHT);
        this.canvas.width = this.LOGIC_WIDTH * this.scale;
        this.canvas.height = this.LOGIC_HEIGHT * this.scale;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
    }
    
spawnEnemy() {
    if (this.mode !== 'survival' || this.isDead) return;
    if (!this.spawningEnabled) return; // منع spawn إذا كان البوس موجود
    
    const side = Math.random() > 0.5 ? 1 : -1;
    this.enemies.push({ 
        x: this.x + (side * 1000), 
        y: this.y - 100, 
        health: 50 + this.storage.kills, 
        maxHealth: 50 + this.storage.kills, 
        radius: 70, 
        speed: 200,
        damageCircleActive: false,
        damageCircleTimer: 0,
        damageCircleRadius: 120,
        damageCirclePosition: null
    });
}

spawnEnemyBoss() {
    if (this.mode !== 'survival' || this.isDead) return;
    if (this.bossIsActive) return;
    
    this.bossIsActive = true;
    this.spawningEnabled = false; // إيقاف spawn الأعداء
    
    const side = Math.random() > 0.5 ? 1 : -1;
    this.enemies.push({ 
        x: this.x + (side * 1000), 
        y: this.y - 100, 
        health: 230 + 3 * this.storage.kills, 
        maxHealth: 200 + 3 * this.storage.kills, 
        radius: 150, 
        speed: 200,
        damageCircleActive: false,
        damageCircleTimer: 0,
        damageCircleRadius: 120,
        damageCirclePosition: null
    });
}
    
checkAndHandleEnemyDeath() {
    for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        
        if (enemy.health <= 0) {
            // 🔽 تحقق إذا كان بوس 🔽
            if (enemy.radius > 100) {
                this.bossIsActive = false;
                this.spawningEnabled = true;
                this.blockCG += this.storage.kills;
                this.storage.kills++;
                this.playerHealth = this.maxHealth;
                this.uiManager.updateHealth(this.playerHealth, this.maxHealth);
            }
            else {
                this.storage.kills++;
                this.blockCG++;
                
                if (this.storage.kills > 0 && this.storage.kills % 30 === 0 && !this.bossIsActive && this.spawningEnabled) {
                    this.spawnEnemyBoss();
                }
                
                this.storage.saveKills(this.storage.kills);
                this.uiManager.updateMenuDisplay();
            }
            
            this.enemies.splice(i, 1);
            this.storage.saveBlockCG(this.blockCG);
            this.uiManager.updateBlockCounter(this.blockCG);
            i--;  // تعديل المؤشر بعد الحذف
        }
    }
}
    
    
    activateSuperPower() {
    if (!this.canUseSpecial || this.blockCG < 5) return;
    
    if (this.playerHealth + 30 > this.maxHealth) {
        this.playerHealth = this.maxHealth;
    } else {
        this.playerHealth += 30;
    }
    
    this.blockCG -= 8;
    this.storage.saveBlockCG(this.blockCG);
    this.uiManager.updateBlockCounter(this.blockCG);
    this.useTopRow = 0;
    this.playerHealth *= 2;
    this.maxHealth *= 2;
    this.speed *= 1.5;
    this.dash_s *= 1.5;
    this.damage_p *= 2;
    this.radius_dp *= 1.5;
    this.abilityCooldownRemaining = 100;
    this.abilityDurationRemaining = 30;
    this.canUseSpecial = false;
    
    if (this.resetRowTimeout) clearTimeout(this.resetRowTimeout);
    this.resetRowTimeout = setTimeout(() => {
        this.abilityDurationRemaining = 0;
        this.playerHealth /= 2;
        this.maxHealth /= 2;
        this.useTopRow = 1;
        this.speed /= 1.5;
        this.dash_s /= 1.5;
        this.damage_p /= 2;
        this.radius_dp /= 1.5;
    }, 30000);
    
    setTimeout(() => {
        this.canUseSpecial = true;
    }, 100000);
}

updateAnimation(dt, isMoving) {
    let baseFrame = 0;
    
    if (this.isAttacking) { 
        baseFrame = 7; 
    } else if (this.isDashing) { 
        baseFrame = 6; 
    } else if (Math.abs(this.velocityY) > 50 || this.jumpCount > 0) { 
        baseFrame = 5; 
    } else if (isMoving && this.moveDir !== 0) {
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
    
    // استخدام المتغير العام this.useTopRow
    if (this.useTopRow == 1) {
        this.currentFrame = baseFrame;      // الصف العلوي (0-7)
    } else {
        this.currentFrame = baseFrame + 8;  // الصف السفلي (8-15)
    }
}
    
    bindControls() {

// أضف هذا الكود داخل دالة bindControls
const pauseBtn = document.getElementById('pauseBtn');
if (pauseBtn) {
    pauseBtn.onclick = () => {
        this.isPaused = !this.isPaused;
        pauseBtn.innerText = this.isPaused ? "استئناف" : "إيقاف";
        pauseBtn.style.background = this.isPaused ? "var(--success)" : "var(--primary)";
    };
}

        
        const btn = (id, down, up) => {
            const el = document.getElementById(id);
            if(el) {
                el.onpointerdown = (e) => { 
                    e.preventDefault(); 
                    if(!this.isDead) down(); 
                };
                if(up) el.onpointerup = (e) => { 
                    e.preventDefault(); 
                    up(); 
                };
            }
        };
        
        btn('leftBtn', () => { 
            this.moveDir = -1; 
            this.facingRight = false; 
        }, () => this.moveDir = 0);
        
        btn('rightBtn', () => { 
            this.moveDir = 1; 
            this.facingRight = true; 
        }, () => this.moveDir = 0);
        
        btn('jumpBtn', () => { 
            if(this.jumpCount < 2 && !this.isDead) { 
                this.velocityY = this.jumpForce; 
                this.jumpCount++; 
            } 
        });
        
        btn('dashBtn', () => { 
            if (this.canDash && !this.isDead) { 
                this.isDashing = true; 
                this.canDash = false; 
                setTimeout(() => this.isDashing = false, 200); 
                setTimeout(() => this.canDash = true, 760); 
            } 
        });
        
let attackHoldTimeout = null;
let resetRowTimeout = null;
let canUseSpecial = true;  // متغير بسيط للتحكم بالمهلة

btn('attackBtn', () => { 
    if (this.canAttack && !this.isDead) { 
        this.isAttacking = true; 
        this.attackTime = 0.3; 
        this.canAttack = false; 
        const attackBtn = document.getElementById('attackBtn');
        if(attackBtn) attackBtn.style.opacity = "0.3";
        
attackHoldTimeout = setTimeout(() => {
    this.activateSuperPower();
}, 500);
        
        setTimeout(() => { 
            this.canAttack = true; 
            if(attackBtn) attackBtn.style.opacity = "1"; 
        }, 600); 
    } 
}, () => {
    if (attackHoldTimeout) {
        clearTimeout(attackHoldTimeout);
        attackHoldTimeout = null;
    }
});


        
this.canvas.onpointerdown = (e) => {
    if(this.isDead) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / (this.scale * this.zoom) + this.camX - (this.LOGIC_WIDTH / (2 * this.zoom));
    const my = (e.clientY - rect.top) / (this.scale * this.zoom) + this.camY - (this.LOGIC_HEIGHT / (2 * this.zoom));
    const gx = Math.floor(mx/60)*60;
    const gy = Math.floor(my/60)*60;
    const idx = this.platforms.findIndex(p => p.x === gx && p.y === gy);
    
    if (idx !== -1) {
        // حذف منصة - زيادة العداد
        this.platforms.splice(idx, 1);
        this.blockCG++;
        this.storage.saveBlockCG(this.blockCG);
        this.uiManager.updateBlockCounter(this.blockCG);
    } else {
        // محاولة إضافة منصة - تحقق من وجود رصيد كافٍ
        if (this.blockCG <= 0) {
            // لا يمكن البناء - رصيد غير كافٍ
            
            // يمكن إضافة تأثير بصري للمستخدم
            this.showNoBlocksWarning();
            return;
        }
        
        // إضافة منصة - نقص العداد
        this.platforms.push({x: gx, y: gy});
        this.blockCG--;
        this.storage.saveBlockCG(this.blockCG);
        this.uiManager.updateBlockCounter(this.blockCG);
    }
};
        
        document.getElementById('exitBtn').onclick = () => {
            this.storage.savePlayerPosition(this.x, this.y);
            this.storage.savePlatforms(this.platforms);
            location.reload();
        };
        
        document.getElementById('clearBtn').onclick = () => {
            this.storage.clearPlatforms();
            location.reload();
        };
    }
    
    update(dt) {
    	
    // هجوم مستمر مثل زر اللمس
if (this.isAttackPressed && this.canAttack && !this.isDead) {
    this.isAttacking = true;
    this.attackTime = 0.3;
    this.canAttack = false;
    const attackBtn = document.getElementById('attackBtn');
    if(attackBtn) attackBtn.style.opacity = "0.3";
    setTimeout(() => { 
        this.canAttack = true; 
        if(attackBtn) attackBtn.style.opacity = "1"; 
    }, 250); // 0.25 ثانية بين الهجمات
}
    	

    // تحديث مؤقتات القدرة الخارقة
if (this.abilityCooldownRemaining > 0) {
    this.abilityCooldownRemaining -= dt;
    if (this.abilityCooldownRemaining < 0) this.abilityCooldownRemaining = 0;
}
if (this.abilityDurationRemaining > 0) {
    this.abilityDurationRemaining -= dt;
    if (this.abilityDurationRemaining < 0) this.abilityDurationRemaining = 0;
}

// إرسال القيم إلى العدادين في الواجهة
if (window.setAbilityTimers) {
    window.setAbilityTimers(this.abilityCooldownRemaining, this.abilityDurationRemaining);
}
    
// التحقق من تصادم الأعداء مع الكتل (المنصات)
// ==========================================
// كود انفجار الكتلة (دائرة الضرر) - كامل
// ==========================================

// التحقق من تصادم الأعداء مع الكتل (المنصات)
if (this.damageCircleEnabled) {   // ✅ الشرط هنا
    for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        
        // تخزين مؤقت للمنصات التي سيتم حذفها
        let platformsToRemove = [];
        
        for (let pIndex = 0; pIndex < this.platforms.length; pIndex++) {
            const platform = this.platforms[pIndex];
            
            // حساب التصادم بين العدو والكتلة
            const enemyLeft = enemy.x - enemy.radius;
            const enemyRight = enemy.x + enemy.radius;
            const enemyTop = enemy.y - enemy.radius;
            const enemyBottom = enemy.y + enemy.radius;
            
            const platformLeft = platform.x;
            const platformRight = platform.x + 60;
            const platformTop = platform.y;
            const platformBottom = platform.y + 60;
            
            // التحقق من التصادم
            if (enemyRight > platformLeft && enemyLeft < platformRight &&
                enemyBottom > platformTop && enemyTop < platformBottom) {
                
                // تسجيل الكتلة للحذف
                platformsToRemove.push(pIndex);
                this.countD++;
                if(this.countD >= 3){
                    this.countD = 0;
                    // تفعيل دائرة الضرر إذا لم تكن مفعلة بالفعل
                    if (!enemy.damageCircleActive) {
                        enemy.damageCircleActive = true;
                        enemy.damageCircleTimer = 0.5; // نصف ثانية
                        enemy.damageCircleRadius = 70;
                        enemy.damageCirclePosition = { x: enemy.x, y: enemy.y };
                    }
                } 
            }
        }
        
        // حذف الكتل المتصادمة
        for (let r = platformsToRemove.length - 1; r >= 0; r--) {
            const pIndex = platformsToRemove[r];
            this.platforms.splice(pIndex, 1);
            this.storage.saveBlockCG(this.blockCG);
            this.uiManager.updateBlockCounter(this.blockCG);
        }
    }
}

// إصابة جميع الأعداء بدائرة الضرر (يعمل دائماً بغض النظر عن الشرط)
for (let i = 0; i < this.enemies.length; i++) {
    const enemy = this.enemies[i];
    
    if (enemy.damageCircleActive) {
        for (let j = 0; j < this.enemies.length; j++) {
            const otherEnemy = this.enemies[j];
            const dx = otherEnemy.x - enemy.x;
            const dy = otherEnemy.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < (enemy.damageCircleRadius || 120)) {
                otherEnemy.health -= 34 * dt;
            }
        }
    }
}

// تحديث مؤقت دائرة الضرر (يعمل دائماً)
for (let i = 0; i < this.enemies.length; i++) {
    const enemy = this.enemies[i];
    if (enemy.damageCircleActive) {
        enemy.damageCircleTimer -= dt;
        if (enemy.damageCircleTimer <= 0) {
            enemy.damageCircleActive = false;
        }
    }
}
    
        if (dt > 0.1) dt = 0.1;
        if (this.isDead) return;
        
        this.input.update();
        
        let moveSpeed = this.isDashing ? this.dash_s : this.speed;
        let effectiveDir = this.isDashing ? (this.facingRight ? 1 : -1) : this.moveDir;
        let nx = this.x + (effectiveDir * moveSpeed) * dt;
        let ny = this.y + this.velocityY * dt;
        
        if (this.isDashing) {
            this.velocityY = 0;
        } else {
            this.velocityY += this.gravity * dt;
        }
        
        // معالجة التصادم مع المنصات
        this.platforms.forEach(p => {
            const pL = p.x, pR = p.x + 60, pT = p.y, pB = p.y + 60;
            if (nx + 45 > pL && nx - 45 < pR && ny + 45 > pT && ny - 45 < pB) {
                const oL = (nx + 45) - pL;
                const oR = pR - (nx - 45);
                const oT = (ny + 45) - pT;
                const oB = pB - (ny - 45);
                const min = Math.min(oL, oR, oT, oB);
                
                if (min === oT && this.velocityY > 0) {
                    ny = pT - 45;
                    this.velocityY = 0;
                    this.jumpCount = 0;
                } else if (min === oB && this.velocityY < 0) {
                    ny = pB + 45;
                    this.velocityY = 0;
                } else if (min === oL) {
                    nx = pL - 45;
                } else if (min === oR) {
                    nx = pR + 45;
                }
            }
        });
        
        this.x = nx;
        this.y = ny;
        
        // حدود الخريطة
        if (this.x < -1550) this.x = -1550;
        if (this.x > 11000) this.x = 11000;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.velocityY = 0;
            this.jumpCount = 0;
        }
        
        const isMoving = this.moveDir !== 0 && !this.isDashing && !this.isAttacking;
        this.updateAnimation(dt, isMoving);
        
        if (this.isAttacking) {
            this.attackTime -= dt;
            if (this.attackTime <= 0) {
                this.isAttacking = false;
            }
        }
        
        // وضع البقاء (Survival)
        if (this.mode === 'survival') {
            this.enemySpawnTimer += dt;
            if (this.enemySpawnTimer > 8) {
                this.spawnEnemy(); // الأول يظهر فوراً

setTimeout(() => {
    this.spawnEnemy(); // الثاني يظهر بعد 500 ملي ثانية
}, 500);

setTimeout(() => {
    this.spawnEnemy(); // الثالث يظهر بعد 1000 ملي ثانية
}, 1000);

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
                    
                    if(this.playerHealth <= 0) {
                        this.isDead = true;
                        setTimeout(() => location.reload(), 1000);
                    }
                }
                
       // احسب المسافة من موقع الهجوم (أمام اللاعب)
let attackX = this.facingRight ? this.x + 80 : this.x - 80;
let attackDist = Math.sqrt((attackX - en.x)**2 + (this.y - en.y)**2);
let cc = 0;
if (this.isAttacking && attackDist < this.radius_dp) {
    en.health -= this.damage_p * dt;

    

}
            }
        }
        
        this.camX += (this.x - this.camX) * 0.1;
        this.camY += (this.y - this.camY) * 0.1;
        
        this.checkAndHandleEnemyDeath();
    }
    
    drawPlayer() {
    if (this.isDead) return;
    
    this.ctx.save(); 
    this.ctx.translate(this.x, this.y);
    
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
        // ================================
        // عدد الفريمات أفقياً = 8
        // عدد الفريمات عمودياً = 2
        // ================================
        const framesX = 8;  // عدد الفريمات في الصف الواحد
        const framesY = 2;  // عدد الصفوف (ارتفاع الصورة ÷ 2)
        
        const frameW = this.playerImg.naturalWidth / framesX;   // عرض الفريم
        const frameH = this.playerImg.naturalHeight / framesY;  // ارتفاع الفريم
        
        // حساب موقع الفريم في الشبكة
        const frameCol = this.currentFrame % framesX;  // العمود (0-7)
        const frameRow = Math.floor(this.currentFrame / framesX) % framesY; // الصف (0 أو 1)
        
        const frameX = frameCol * frameW;
        const frameY = frameRow * frameH;
        
        this.ctx.drawImage(this.playerImg, 
            frameX,    // X في الصورة
            frameY,    // Y في الصورة
            frameW,    // العرض
            frameH,    // الارتفاع
            -75, -75, 150, 150);
    } else {
        this.ctx.fillStyle = "#f39c12";
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 45, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    this.ctx.restore();
}
    
    // أضف هذه الدالة في GameCore.js
drawBoundaryLines() {
    this.ctx.save();
    
    // تحديد موقع الخطوط بناءً على الكاميرا
    const lineY = this.camY; // يتبع الكاميرا عمودياً
    
    // الخط الأيسر (عند x = -1550)
    this.ctx.strokeStyle = "#ff3366";
    this.ctx.lineWidth = this.boundaryLineWidth;
    this.ctx.shadowBlur = 8;
    this.ctx.shadowColor = "#ff3366";
    this.ctx.beginPath();
    this.ctx.moveTo(this.leftBoundX, lineY - 500);
    this.ctx.lineTo(this.leftBoundX, lineY + 500);
    this.ctx.stroke();
    
    // الخط الأيمن (عند x = 11000)
    this.ctx.beginPath();
    this.ctx.moveTo(this.rightBoundX, lineY - 500);
    this.ctx.lineTo(this.rightBoundX, lineY + 500);
    this.ctx.stroke();
    
    // تأثير توهج إضافي
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
    
    draw() {
        const s = this.scale * this.zoom;
        this.ctx.setTransform(s, 0, 0, s, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        
        this.ctx.clearRect(0, 0, this.LOGIC_WIDTH, this.LOGIC_HEIGHT);
        this.ctx.save();
        this.ctx.translate(-this.camX + (this.LOGIC_WIDTH / (2 * this.zoom)), 
                          -this.camY + (this.LOGIC_HEIGHT / (2 * this.zoom)));
        
        // رسم الخلفية
        if(this.bgImg.complete && this.bgImg.naturalWidth > 0) { 
            const drawW = 1296 / this.zoom, drawH = 1728 / this.zoom;
            let startX = this.camX - (this.LOGIC_WIDTH / (2 * this.zoom));
            let centerY = this.camY - (drawH / 4); 

                this.ctx.drawImage(this.bgImg, 0, 0, this.bgImg.width, this.bgImg.height / 2, 
                    startX + (drawW) - drawW, centerY, drawW, drawH / 2);
            
            const drawW2 = 3600, drawH2 = 5200;
            for(let i = -2000; i < 9000; i += (drawW2 - 1)) {
                this.ctx.drawImage(this.bgImg, 0, this.bgImg.height / 2, this.bgImg.width, this.bgImg.height / 2, 
                    i, -3350 + (drawH2 / 2), drawW2, drawH2 / 2);
            }
            
            // في دالة draw()، بعد رسم الخلفية و قبل رسم المنصات، أضف:
this.drawBoundaryLines();
            // رسم المربع الوردي
            this.ctx.save();
            this.ctx.drawImage(
                this.bgImg, 
                this.pinkSquare.sourceX, this.pinkSquare.sourceY, this.pinkSquare.size, this.pinkSquare.size, 
                this.x + 30, this.y - 20, 20, 20 
            );
            this.ctx.restore();
        }
        
        // رسم المنصات
        this.platforms.forEach(p => {
            if(this.bgImg.complete && this.bgImg.naturalWidth > 0) {
                this.ctx.drawImage(
                    this.bgImg, 
                    this.pinkSquare.sourceX, this.pinkSquare.sourceY, this.pinkSquare.size, this.pinkSquare.size, 
                    p.x, p.y, 60, 60 
                );
            } else {
                this.ctx.fillStyle = "rgba(52, 152, 219, 0.6)";
                this.ctx.fillRect(p.x, p.y, 60, 60);
            }
        });
        
        // رسم الأعداء
// رسم الأعداء مع دعم صورتين (علوي للعدو، سفلي للبوس)
// في دالة draw() - تعديل رسم الأعداء
// استبدل هذا الجزء في دالة draw() (رسم الأعداء)
// رسم الأعداء (استبدل هذا الجزء في دالة draw())
this.enemies.forEach(en => {
    this.ctx.save();
    this.ctx.translate(en.x, en.y);
    if (this.x < en.x) this.ctx.scale(-1, 1);
    
    if(this.enemyImg.complete && this.enemyImg.naturalWidth > 0) {
        // تقسيم الصورة: العرض 250، الارتفاع 500 مقسم إلى نصفين
        const frameW = this.enemyImg.naturalWidth;      // = 250
        const frameH = this.enemyImg.naturalHeight / 2; // = 250
        
        // تحديد النصف حسب نوع العدو
        // العدو العادي (radius <= 100) -> النصف العلوي (0)
        // البوس (radius > 100) -> النصف السفلي (250)
        const frameY = en.radius > 100 ? frameH : 0;
        
        this.ctx.drawImage(
            this.enemyImg, 
            0, frameY,           // نقطة البداية في الصورة
            frameW, frameH,      // الأبعاد المأخوذة (250×250)
            -en.radius, -en.radius,  // مكان الرسم على canvas
            en.radius * 2, en.radius * 2  // حجم الرسم
        );
    } else {
        // لون احتياطي إذا لم تتحمل الصورة
        this.ctx.fillStyle = en.radius > 100 ? "#8e44ad" : "#e67e22";
        this.ctx.beginPath();
        this.ctx.arc(0, 0, en.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    this.ctx.restore();
    
    // شريط حياة العدو
    const barWidth = 60;
    this.ctx.fillStyle = "#222";
    this.ctx.fillRect(en.x - barWidth/2, en.y - en.radius - 15, barWidth, 6);
    this.ctx.fillStyle = "#e74c3c";
    this.ctx.fillRect(en.x - barWidth/2, en.y - en.radius - 15, (en.health / en.maxHealth) * barWidth, 6);
});
        
        // رسم دوائر الضرر للأعداء
this.enemies.forEach(en => {
    if (en.damageCircleActive) {
        this.ctx.save();
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = "#ff0000";
        
        // دائرة خارجية حمراء
        this.ctx.beginPath();
        this.ctx.arc(en.x, en.y, en.damageCircleRadius || 120, 0, Math.PI * 2);
        this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        this.ctx.fill();
        
        // دائرة داخلية برتقالية
        this.ctx.beginPath();
        this.ctx.arc(en.x, en.y, (en.damageCircleRadius || 120) * 0.6, 0, Math.PI * 2);
        this.ctx.fillStyle = "rgba(255, 100, 0, 0.5)";
        this.ctx.fill();
        
        // حدود الدائرة
        this.ctx.beginPath();
        this.ctx.arc(en.x, en.y, en.damageCircleRadius || 120, 0, Math.PI * 2);
        this.ctx.strokeStyle = "#ff3300";
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        this.ctx.restore();
    }
});
        
        this.drawPlayer();
        

// رسم دائرة الهجوم المتقدمة
if (this.isAttacking && !this.isDead) {
    this.ctx.fillStyle = "rgba(231, 76, 60, 0.25)";
    this.ctx.beginPath();
    let offsetX = this.facingRight ? 80 : -80;
    this.ctx.arc(this.x + offsetX, this.y, this.radius_dp, 0, Math.PI * 2);
    this.ctx.fill();
}
        
        this.ctx.restore();
    }
    
    loop(timestamp) {
    // حساب فارق الوقت بين الإطارات (Delta Time)
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const dt = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    // --- التعديل هنا ---
    if (!this.isPaused) {
        // إذا لم تكن اللعبة متوقفة، قم بتحديث المنطق (الحركة، الجاذبية، التصادم)
        this.update(dt);
    }
    
    // عملية الرسم (Draw) تستمر دائماً لكي تظل اللعبة مرئية وهي متوقفة
    this.draw();
    
    // طلب الإطار التالي
    requestAnimationFrame((t) => this.loop(t));
}

}
