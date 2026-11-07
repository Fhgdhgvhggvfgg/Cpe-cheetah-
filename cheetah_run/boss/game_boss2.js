// game_boss2.js
class GameBoss2 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;
        
        this.injectStyles();

        // إنشاء طبقة الساحة/الحلبة الرمادية
        this.arenaLayer = document.createElement('div');
        this.arenaLayer.className = 'boss-arena-overlay';
        this.gameContainer.appendChild(this.arenaLayer);

        // إنشاء عنصر الزعيم الثاني
        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-2-element';
        this.gameContainer.appendChild(this.bossElement);

        this.projectiles = [];
        // إطلاق الخطوط كل فترة زمنية
        this.shootInterval = setInterval(() => this.shootLine(), 2000);
    }

    injectStyles() {
        if (document.getElementById('game-boss-2-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'game-boss-2-styles';
        style.innerHTML = `
            /* طبقة الساحة أو الحلبة الرمادية */
            .boss-arena-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(160, 150, 130, 0.35);
                pointer-events: none; /* لكي لا تؤثر على تفاعلات اللمس أو الماوس */
                z-index: 2; /* تحت العناصر المهمة وفوق الخلفية الأساسية */
            }
            .game-boss-2-element {
                position: absolute;
                width: 70px;
                height: 70px;
                background: #9900ff;
                border-radius: 50%;
                box-shadow: 0 0 20px #9900ff;
                top: 30px;
                left: 185px;
                z-index: 15;
            }
            /* الخط الأحمر (أسفل اللاعب - يقفز فوقه) */
            .boss-line-red {
                position: absolute;
                width: 420px;
                height: 12px;
                background: #ff3366;
                box-shadow: 0 0 10px #ff3366;
                border-radius: 6px;
                left: 10px;
                top: 90px;
                z-index: 5; /* تحت اللاعب */
            }
            /* الخط البرتقالي/الأصفر (فوق اللاعب - يمر من فوقه) */
            .boss-line-yellow {
                position: absolute;
                width: 420px;
                height: 12px;
                background: #ff9900;
                box-shadow: 0 0 10px #ff9900;
                border-radius: 6px;
                left: 10px;
                top: 90px;
                z-index: 12; /* فوق اللاعب */
            }
        `;
        document.head.appendChild(style);
    }

    shootLine() {
        const line = document.createElement('div');
        
        // اختيار عشوائي بين الخط الأحمر (أسفل) والخط البرتقالي (فوق)
        const isRed = Math.random() < 0.5;
        line.className = isRed ? 'boss-line-red' : 'boss-line-yellow';
        line.dataset.type = isRed ? 'red' : 'yellow';

        line.style.top = '90px';
        this.gameContainer.appendChild(line);
        this.projectiles.push(line);
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            
            // تحرك الخط إلى الأسفل نحو اللاعب
            let currentTop = parseFloat(p.style.top) + 350 * deltaTime;
            p.style.top = currentTop + 'px';

            // نطاق اصطدام الخط باللاعب
            if (currentTop >= 390 && currentTop <= 470) {
                let jumping = this.isPlayerJumping ? this.isPlayerJumping() : false;
                let lineType = p.dataset.type;

                if (lineType === 'red') {
                    // الخط الأحمر (أسفل): يجب على اللاعب القفز فوقه، إذا لم يقفز يخسر
                    if (!jumping) {
                        p.remove();
                        this.projectiles.splice(i, 1);
                        if (this.onHitPlayer) this.onHitPlayer();
                        continue;
                    }
                } else if (lineType === 'yellow') {
                    // الخط البرتقالي (فوق): يمر فوق اللاعب، فإذا قفز اللاعب بالخطأ يصطدم به ويخسر
                    if (jumping) {
                        p.remove();
                        this.projectiles.splice(i, 1);
                        if (this.onHitPlayer) this.onHitPlayer();
                        continue;
                    }
                }
            }

            // إزالة الخط إذا تجاوز الشاشة
            if (currentTop > 680) {
                p.remove();
                this.projectiles.splice(i, 1);
            }
        }
    }

    destroy() {
        clearInterval(this.shootInterval);
        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];
        if (this.bossElement) {
            this.bossElement.remove();
        }
        if (this.arenaLayer) {
            this.arenaLayer.remove();
        }
    }
}
