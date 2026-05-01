import { InputHandler } from './InputHandler.js';

export class GameCore {
    constructor(mode, storage, uiManager) {

this.bgMusic = new Audio();
this.bgMusic.loop = true; // لجعل الموسيقى تتكرر

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
        this.speed = 450;
        this.gravity = 1340;
        this.jumpForce = -650;
        this.velocityY = 0;
        this.moveDir = 0;
        this.facingRight = true;
        this.groundY = 1200;
        this.radius = 60;
        this.jumpCount = 0;
        this.zoom = 1.5;
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
        this.bgMusic.src = 'sounds/survival_bg.mp3'; // تأكد من المسار الصحيح للملف
    } else if (this.mode === 'creative') {
        this.bgMusic.src = 'sounds/creative_bg.mp3'; // تأكد من المسار الصحيح للملف
    }
        
            this.bgMusic.play().catch(err => console.log("بانتظار تفاعل المستخدم لتشغيل الصوت"));
            
        document.getElementById('mainMenu').style.display = 'none';
        this.canvas.style.display = 'block';
        document.getElementById('uiLayer').style.display = 'block';
        
        if(this.mode === 'survival') {
            document.getElementById('healthBarContainer').style.display = 'block';
        }
        
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
        const side = Math.random() > 0.5 ? 1 : -1;
        this.enemies.push({ 
            x: this.x + (side * 500), 
            y: this.y - 100, 
            health: 50, 
            maxHealth: 50, 
            radius: 45, 
            speed: 200 
        });
    }
    
    updateAnimation(dt, isMoving) {
        if (this.isAttacking) { 
            this.currentFrame = 7; 
            return; 
        }
        if (this.isDashing) { 
            this.currentFrame = 6; 
            return; 
        }
        if (Math.abs(this.velocityY) > 50 || this.jumpCount > 0) { 
            this.currentFrame = 5; 
            return; 
        }
        if (isMoving && this.moveDir !== 0) {
            this.animTimer += dt;
            if (this.animTimer >= this.animSpeed) { 
                this.animTimer = 0; 
                this.walkFrame = (this.walkFrame % 4) + 1; 
            }
            this.currentFrame = this.walkFrame; 
            return;
        }
        this.currentFrame = 0;
        this.walkFrame = 1;
        this.animTimer = 0;
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
        
        btn('attackBtn', () => { 
            if (this.canAttack && !this.isDead) { 
                this.isAttacking = true; 
                this.attackTime = 0.3; 
                this.canAttack = false; 
                const attackBtn = document.getElementById('attackBtn');
                if(attackBtn) attackBtn.style.opacity = "0.3";
                setTimeout(() => { 
                    this.canAttack = true; 
                    if(attackBtn) attackBtn.style.opacity = "1"; 
                }, 600); 
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
                this.platforms.splice(idx, 1);
            } else {
                this.platforms.push({x: gx, y: gy});
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
        if (dt > 0.1) dt = 0.1;
        if (this.isDead) return;
        
        this.input.update();
        
        let moveSpeed = this.isDashing ? 1200 : this.speed;
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
                
                if (this.isAttacking && dist < 170) {
                    en.health -= 100 * dt;
                    if(en.health <= 0) {
                        this.enemies.splice(i, 1);
                        this.storage.kills++;
                        this.storage.saveKills(this.storage.kills);
                        this.uiManager.updateMenuDisplay();
                        i--;
                    }
                }
            }
        }
        
        this.camX += (this.x - this.camX) * 0.1;
        this.camY += (this.y - this.camY) * 0.1;
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
            const frameW = this.playerImg.naturalWidth / 8;
            this.ctx.drawImage(this.playerImg, 
                this.currentFrame * frameW, 0, frameW, this.playerImg.naturalHeight, 
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
            const drawW = 851, drawH = 1276;
            let startX = this.camX - (this.LOGIC_WIDTH / (2 * this.zoom));
            let centerY = this.camY - (drawH / 4); 
            for(let i = 0; i < 3; i++) {
                this.ctx.drawImage(this.bgImg, 0, 0, this.bgImg.width, this.bgImg.height / 2, 
                    startX + (i * drawW) - drawW, centerY, drawW, drawH / 2);
            }
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
        this.enemies.forEach(en => {
            this.ctx.save();
            this.ctx.translate(en.x, en.y);
            if (this.x < en.x) this.ctx.scale(-1, 1);
            if(this.enemyImg.complete && this.enemyImg.naturalWidth > 0) {
                this.ctx.drawImage(this.enemyImg, -en.radius, -en.radius, en.radius * 2, en.radius * 2);
            } else {
                this.ctx.fillStyle = "#e67e22";
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
        
        this.drawPlayer();
        
        // رسم دائرة الهجوم
        if (this.isAttacking && !this.isDead) {
            this.ctx.fillStyle = "rgba(231, 76, 60, 0.25)";
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, 170, 0, Math.PI * 2);
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
