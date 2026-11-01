// game_boss4.js
class GameBoss4 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 185, 50]; // المسارات الثلاثة أفقياً

        this.injectStyles();

        // إنشاء عنصر الزعيم (مثلث يتحرك يميناً ويساراً)
        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-4-element';
        this.gameContainer.appendChild(this.bossElement);

        this.bossX = 185; // الموقع الأفقي الأولي للزعيم
        this.bossDirection = 1; // 1 لليمين، -1 لليسار

        this.projectiles = []; // مصفوفة ليزر الخطوط العمودية والتحذيرات

        // دورة الهجمات: تبدأ بمرحلة "التحذير والاستباق" ثم إطلاق الضربة كل 2.2 ثانية
        this.attackInterval = setInterval(() => this.startAttackCycle(), 2200);
    }

    injectStyles() {
        if (document.getElementById('game-boss-4-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-boss-4-styles';
        style.innerHTML = `
            /* كلاس الزعيم: مثلث يحمل الضربة */
            .game-boss-4-element {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 35px solid transparent;
                border-right: 35px solid transparent;
                border-bottom: 60px solid #00ffcc;
                filter: drop-shadow(0px 0px 12px #00ffcc);
                top: 25px;
                z-index: 15;
                pointer-events: none;
            }
            /* النور الاستباقي / التحذيري للأحمر (تحت اللاعب z-index: 5) */
            .boss4-warning-red {
                position: absolute;
                top: 85px;
                width: 12px;
                height: 595px;
                background: rgba(255, 0, 85, 0.35);
                border: 1px dashed #ff0055;
                z-index: 5;
                pointer-events: none;
            }
            /* النور الاستباقي / التحذيري للبرتقالي (فوق اللاعب لكي يمر تحته، z-index: 12) */
            .boss4-warning-orange {
                position: absolute;
                top: 85px;
                width: 12px;
                height: 595px;
                background: rgba(255, 153, 0, 0.35);
                border: 1px dashed #ff9900;
                z-index: 12;
                pointer-events: none;
            }
            /* الليزر الفعلي الأحمر (تحت اللاعب z-index: 5) */
            .boss4-laser-red {
                position: absolute;
                top: 85px;
                width: 14px;
                height: 595px;
                background: #ff0055;
                box-shadow: 0 0 18px #ff0055;
                z-index: 5;
                pointer-events: none;
            }
            /* الليزر الفعلي البرتقالي (فوق اللاعب ليظهر فوقه بينما يمر اللاعب تحته، z-index: 12) */
            .boss4-laser-orange {
                position: absolute;
                top: 85px;
                width: 14px;
                height: 595px;
                background: #ff9900;
                box-shadow: 0 0 18px #ff9900;
                z-index: 12;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    startAttackCycle() {
        if (!this.bossElement) return;

        // تنظيف أي ضربات أو تحذيرات سابقة فوراً عند بدء دورة جديدة أو نفاذ الوقت
        this.clearAllProjectiles();

        // تحديد نوع الضربة عشوائياً (برتقالي أو أحمر)
        const isOrange = Math.random() < 0.5;
        const attackType = isOrange ? 'orange' : 'red';
        
        // جعل الضربة تسير وتتبع موقع المثلث (الزعيم) تماماً
        let initialX = this.bossX + 30;

        // 1. إظهار النور الاستباقي (التحذير) لمدة ثانية واحدة مرتبطاً بموقع الزعيم
        const warning = document.createElement('div');
        warning.className = isOrange ? 'boss4-warning-orange' : 'boss4-warning-red';
        warning.style.left = initialX + 'px';
        warning.dataset.isFollowingBoss = "true"; // لكي يتحرك مع المثلث أثناء التحذير
        this.gameContainer.appendChild(warning);
        this.projectiles.push(warning);

        // تخزين مرجع مؤقت لمهلة التحذير وانهائها نظيفاً
        this.warningTimeout = setTimeout(() => {
            if (!this.bossElement) return;
            
            // إزالة تحذير الاستباق
            warning.remove();
            let wIndex = this.projectiles.indexOf(warning);
            if (wIndex !== -1) this.projectiles.splice(wIndex, 1);

            // إطلاق الليزر الفعلي في مكان الزعيم الحالي ليتحرك معه
            const laser = document.createElement('div');
            laser.className = isOrange ? 'boss4-laser-orange' : 'boss4-laser-red';
            let laserX = this.bossX + 30;
            laser.style.left = laserX + 'px';
            laser.dataset.type = attackType;
            laser.dataset.isFollowingBoss = "true"; // لكي يتحرك الليزر مع المثلث

            this.gameContainer.appendChild(laser);
            this.projectiles.push(laser);

            // بقاء الليزر الفعلي لمدة 0.8 ثانية ثم حذفه تلقائياً عند نفاذ وقته
            this.laserTimeout = setTimeout(() => {
                let index = this.projectiles.indexOf(laser);
                if (index !== -1) {
                    laser.remove();
                    this.projectiles.splice(index, 1);
                }
            }, 1200);

        }, 500); // مدة النور الاستباقي (ثانية واحدة)
    }

    clearAllProjectiles() {
        // إلغاء أي مؤتمرات نشطة لتجنب التداخل
        if (this.warningTimeout) clearTimeout(this.warningTimeout);
        if (this.laserTimeout) clearTimeout(this.laserTimeout);

        // حذف جميع الضربات والتحذيرات الموجودة وتفريغ المصفوفة تماماً عند انتهاء الوقت
        this.projectiles.forEach(p => {
            if (p && p.parentNode) {
                p.remove();
            }
        });
        this.projectiles = [];
    }

    update(deltaTime) {
        // تحرك الزعيم (المثلث) يميناً ويساراً باستمرار
        this.bossX += this.bossDirection * 260 * deltaTime;
        if (this.bossX > 370) {
            this.bossX = 370;
            this.bossDirection = -1;
        } else if (this.bossX < 10) {
            this.bossX = 10;
            this.bossDirection = 1;
        }
        if (this.bossElement) {
            this.bossElement.style.left = this.bossX + 'px';
        }

        // جعل التحذيرات أو الليزر الفعلي تتحرك وتتبع مكان المثلث (الزعيم)
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            
            if (p.dataset.isFollowingBoss === "true") {
                let currentBossCenter = this.bossX + 30;
                p.style.left = currentBossCenter + 'px';
            }

            // تخطي عناصر التحذير في فحص الاصطدام
            if (!p.dataset || !p.dataset.type) continue;

            let laserX = parseFloat(p.style.left);
            let laserType = p.dataset.type;

            let playerLaneX = this.getPlayerLane ? this.lanes[this.getPlayerLane()] : 185;

            // التحقق من تواجد اللاعب في عمود الليزر المتحرك
            if (Math.abs(laserX - (playerLaneX + 25)) < 40) {
                let jumping = this.isPlayerJumping ? this.isPlayerJumping() : false;

                if (laserType === 'orange' && jumping) {
                    // ليزر برتقالي يضرب اللاعب عند القفز فقط
                    p.remove();
                    this.projectiles.splice(i, 1);
                    if (this.onHitPlayer) this.onHitPlayer();
                    break;
                } else if (laserType === 'red' && !jumping) {
                    // ليزر أحمر يضرب اللاعب عندما لا يقفز
                    p.remove();
                    this.projectiles.splice(i, 1);
                    if (this.onHitPlayer) this.onHitPlayer();
                    break;
                }
            }
        }
    }

    destroy() {
        if (this.attackInterval) {
            clearInterval(this.attackInterval);
        }
        // حذف كل شيء نهائياً عند تدمير الكلاس أو انتهاء العداد
        this.clearAllProjectiles();
        if (this.bossElement) {
            this.bossElement.remove();
        }
    }
}
