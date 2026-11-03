// game_boss5.js
class GameBoss5 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 185, 50]; // إحداثيات المسارات الثلاثة
        this.collectedSquaresCount = 0; // عداد المربعات التي تم التقاطها

        this.injectStyles();

        // إنشاء عنصر وجه القط
        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-5-cat';
        this.bossElement.innerHTML = `
            <div class="cat-ear cat-ear-left"></div>
            <div class="cat-ear cat-ear-right"></div>
            <div class="cat-eye cat-eye-left"></div>
            <div class="cat-eye cat-eye-right"></div>
            <div class="cat-nose"></div>
            <div class="cat-whiskers left-whiskers"></div>
            <div class="cat-whiskers right-whiskers"></div>
        `;
        this.gameContainer.appendChild(this.bossElement);

        this.projectiles = [];
        this.waveTimeouts = []; // مصفوفة لتخزين المؤقتات القادمة وإلغائها عند الموت

        // إطلاق أول موجة فوراً ثم تكرارها كل 4 ثوانٍ
        this.launchSquareWave();
        this.attackInterval = setInterval(() => {
            this.launchSquareWave();
        }, 4000);
    }

    injectStyles() {
        if (document.getElementById('game-boss-5-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-boss-5-styles';
        style.innerHTML = `
            /* شكل وجه القطة */
            .game-boss-5-cat {
                position: absolute;
                top: 25px;
                left: 185px;
                width: 70px;
                height: 60px;
                background: #e67e22;
                border-radius: 50% 50% 45% 45%;
                box-shadow: 0 0 15px #d35400;
                z-index: 15;
                pointer-events: none;
            }
            .cat-ear {
                position: absolute;
                top: -12px;
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-bottom: 20px solid #e67e22;
            }
            .cat-ear-left { left: 5px; transform: rotate(-15deg); }
            .cat-ear-right { right: 5px; transform: rotate(15deg); }
            .cat-eye {
                position: absolute;
                top: 18px;
                width: 10px;
                height: 14px;
                background: #2ecc71;
                border-radius: 50%;
            }
            .cat-eye-left { left: 15px; }
            .cat-eye-right { right: 15px; }
            .cat-nose {
                position: absolute;
                top: 32px;
                left: 31px;
                width: 8px;
                height: 6px;
                background: #e74c3c;
                border-radius: 40%;
            }

            /* المربعات القاتلة */
            .boss5-square {
                position: absolute;
                width: 45px;
                height: 45px;
                background: #9b59b6;
                border: 3px solid #f1c40f;
                box-shadow: 0 0 12px #8e44ad;
                border-radius: 8px;
                z-index: 12;
                pointer-events: none;
            }

            /* نافذة عرض بروفايل اللاعب مع توهج حول بكسلات الشخصية الظاهرة */
            .boss5-profile-popup {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 240px;
                height: 240px;
                background-size: 200% 400%;
                background-position: -100% 200%;
                border-radius: 12px;
                /* إزالة الحدود والمربع العادي واستخدام drop-shadow لتتبع البكسلات الظاهرة */
                border: none;
                background-color: transparent;
                box-shadow: none;
                filter: drop-shadow(0 0 12px #00ccff) drop-shadow(0 0 20px #00ccff);
                z-index: 30;
                pointer-events: none;
                animation: popInScale 0.5s ease;
            }
            @keyframes popInScale {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }

        `;
        document.head.appendChild(style);
    }

    clearPendingWaveTimeouts() {
        this.waveTimeouts.forEach(t => clearTimeout(t));
        this.waveTimeouts = [];
    }

    launchSquareWave() {
        this.clearPendingWaveTimeouts();

        // إطلاق 4 مربعات بفترات منتظمة (0.7 ثانية بين كل مربع)
        for (let i = 0; i < 4; i++) {
            let t = setTimeout(() => {
                if (!this.bossElement) return;
                this.spawnSingleSquare();
            }, i * 700);
            this.waveTimeouts.push(t);
        }
    }

    spawnSingleSquare() {
        const square = document.createElement('div');
        square.className = 'boss5-square';

        const targetLaneIndex = Math.floor(Math.random() * 3);
        const startX = this.lanes[targetLaneIndex] + 10; 

        const speed = 220; 

        square.style.left = startX + 'px';
        square.style.top = '80px';
        
        square.dataset.x = startX;
        square.dataset.speed = speed;
        square.dataset.lane = targetLaneIndex;

        this.gameContainer.appendChild(square);
        this.projectiles.push(square);
    }

    showPlayerProfilePopup() {
        // جلب عنصر معاينة البروفايل الموجود في القائمة الرئيسية مباشرة
        const previewElement = document.getElementById('start-player-preview');
        if (!previewElement) return;

        // جلب خصائص الصورة والخصائص المرئية المطابقة تماماً للقائمة الرئيسية
        const bgImage = previewElement.style.backgroundImage;
        const bgPosition = previewElement.style.backgroundPosition;

        const popup = document.createElement('div');
        popup.className = 'boss5-profile-popup';
        popup.style.backgroundImage = bgImage;
popup.style.backgroundPosition = "-100% 200%";


        this.gameContainer.appendChild(popup);

        // إخفاء الصورة بعد نصف ثانية (500 ميلي ثانية)
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
            }
        }, 500);
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let square = this.projectiles[i];

            let speed = parseFloat(square.dataset.speed);

            let currentTop = parseFloat(square.style.top) + speed * deltaTime;
            square.style.top = currentTop + 'px';

            let projLane = parseInt(square.dataset.lane);

            // التحقق من وصول المربع إلى نطاق الاصطدام باللاعب
            if (currentTop >= 380 && currentTop <= 470) {
                if (projLane === this.getPlayerLane()) {
                    // المربع يختفي فوراً عند وقوف اللاعب عليه
                    square.remove();
                    this.projectiles.splice(i, 1);

                    // زيادة عداد المربعات المكتسبة
                    this.collectedSquaresCount++;
                    if (this.collectedSquaresCount >= 4) {
                        this.collectedSquaresCount = 0; // إعادة ضبط العداد
                        this.showPlayerProfilePopup(); // إظهار صورة بروفايل القائمة الرئيسية نصف ثانية
                    }

                    continue;
                }
            }

            // إذا تجاوز المربع خط اللاعب دون لمس => ضربة القط المباشرة القاتلة!
            if (currentTop > 520) {
                this.destroy();

                if (this.onHitPlayer) {
                    this.onHitPlayer();
                }
                break;
            }
        }
    }

    destroy() {
        if (this.attackInterval) {
            clearInterval(this.attackInterval);
            this.attackInterval = null;
        }

        this.clearPendingWaveTimeouts();

        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];

        if (this.bossElement) {
            this.bossElement.remove();
            this.bossElement = null;
        }
    }
}
