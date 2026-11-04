// game_boss6.js
class GameBoss6 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 170, 30]; // المسارات الثلاثة
        this.bossTop = -100; 
        this.approachSpeed = 6;

        this.injectStyles();

        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-6-element';
        this.bossElement.innerHTML = `
            <div class="boss6-face">
                <div class="boss6-eye left"></div>
                <div class="boss6-eye right"></div>
                <div class="boss6-mouth"></div>
            </div>
        `;
        this.gameContainer.appendChild(this.bossElement);

        this.whiteCircles = [];
        this.arrows = [];

        this.circleInterval = setInterval(() => {
            this.spawnWhiteCircle();
        }, 1200);

        this.arrowInterval = setInterval(() => {
            this.spawnArrow();
        }, 700);
    }

    injectStyles() {
        if (document.getElementById('game-boss-6-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-boss-6-styles';
        style.innerHTML = `
            .game-boss-6-element {
                position: absolute;
                top: 20px;
                left: 15px;
                width: 410px;
                height: 120px;
                background: rgba(142, 68, 173, 0.35);
                border: 4px solid rgba(241, 196, 15, 0.6);
                box-shadow: 0 0 25px rgba(231, 76, 60, 0.4);
                border-radius: 12px;
                z-index: 15;
                opacity: 0.4;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            .boss6-face {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
            }
            .boss6-eye {
                width: 25px;
                height: 25px;
                background: #00ffff;
                border-radius: 50%;
                box-shadow: 0 0 10px #00ffff;
                display: inline-block;
                margin: 0 15px;
            }
            .boss6-mouth {
                width: 120px;
                height: 12px;
                background: #f39c12;
                border-radius: 6px;
            }
            .boss6-white-circle {
                position: absolute;
                width: 40px;
                height: 40px;
                background: #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 15px #ffffff, inset 0 0 8px #00ccff;
                z-index: 14;
                pointer-events: none;
            }
            /* السهم الأصفر المثلث: رأسه الحاد موجه للأسفل نحو اللاعب */
            .boss6-arrow-yellow {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 40px solid transparent;
                border-right: 40px solid transparent;
                border-top: 52px solid #f1c40f; /* القاعدة للأعلى ورأس المثلث الحاد لأسفل */
                filter: drop-shadow(0 0 8px #f1c40f);
                z-index: 16;
                pointer-events: none;
            }
            /* السهم الأحمر المثلث: رأسه الحاد موجه للأسفل نحو اللاعب */
            .boss6-arrow-red {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 40px solid transparent;
                border-right: 40px solid transparent;
                border-top: 52px solid #e74c3c; /* القاعدة للأعلى ورأس المثلث الحاد لأسفل */
                filter: drop-shadow(0 0 8px #e74c3c);
                z-index: 1; /* قم بتغيير هذه القيمة من 10 إلى 1 (أو أقل من طبقة اللاعب) */
                pointer-events: none;
            }

        `;
        document.head.appendChild(style);
    }

    spawnWhiteCircle() {
        if (!this.bossElement) return;

        const circle = document.createElement('div');
        circle.className = 'boss6-white-circle';

        const randomLaneIndex = Math.floor(Math.random() * 3);
        const startX = this.lanes[randomLaneIndex] + 12; 

        circle.style.left = startX + 'px';
        // جعل الدائرة البيضاء تنطلق من بداية الشاشة العلوية (0) تماماً
        circle.style.top = '0px'; 
        circle.dataset.lane = randomLaneIndex;

        this.gameContainer.appendChild(circle);
        this.whiteCircles.push(circle);
    }

        spawnArrow() {
        if (!this.bossElement) return;

        const arrow = document.createElement('div');
        
        // اختيار نوع السهم عشوائياً (أصفر أو أحمر)
        const isYellow = Math.random() < 0.5;
        arrow.className = isYellow ? 'boss6-arrow-yellow' : 'boss6-arrow-red';

        const randomLaneIndex = Math.floor(Math.random() * 3);
        const startX = this.lanes[randomLaneIndex] + 10; // توسيط السهم المثلث في المسار

        arrow.style.left = startX + 'px';
        // جعل السهم ينطلق من بداية الشاشة العلوية (0) وليس من موقع البوس
        arrow.style.top = '0px'; 
        arrow.dataset.lane = randomLaneIndex;
        arrow.dataset.type = isYellow ? 'yellow' : 'red';

        this.gameContainer.appendChild(arrow);
        this.arrows.push(arrow);
    }


    checkAndLimitBossPosition() {
        if (this.bossTop < -100) {
            this.bossTop = -100;
        }
    }

    update(deltaTime) {
        if (!this.bossElement) return;

        this.bossTop += this.approachSpeed * (deltaTime * 10);
        this.checkAndLimitBossPosition();
        this.bossElement.style.top = this.bossTop + 'px';

        for (let i = this.whiteCircles.length - 1; i >= 0; i--) {
            let circ = this.whiteCircles[i];
            let currentTop = parseFloat(circ.style.top) + (350 * deltaTime);
            circ.style.top = currentTop + 'px';

            let circLane = parseInt(circ.dataset.lane);
            let playerLane = typeof this.getPlayerLane === 'function' ? this.getPlayerLane() : 1;

            if (currentTop >= 370 && currentTop <= 480 && circLane === playerLane) {
                circ.remove();
                this.whiteCircles.splice(i, 1);
                this.bossTop -= 66;
                this.checkAndLimitBossPosition();
                continue;
            }

            if (currentTop > 680) {
                circ.remove();
                this.whiteCircles.splice(i, 1);
            }
        }

        for (let i = this.arrows.length - 1; i >= 0; i--) {
            let arrow = this.arrows[i];
            let currentTop = parseFloat(arrow.style.top) + (400 * deltaTime);
            arrow.style.top = currentTop + 'px';

            let arrowLane = parseInt(arrow.dataset.lane);
            let arrowType = arrow.dataset.type;
            let playerLane = typeof this.getPlayerLane === 'function' ? this.getPlayerLane() : 1;
            let isJumping = typeof this.isPlayerJumping === 'function' ? this.isPlayerJumping() : false;

            if (currentTop >= 380 && currentTop <= 470 && arrowLane === playerLane) {
                if (arrowType === 'yellow' && isJumping) {
                    arrow.remove();
                    this.arrows.splice(i, 1);
                    this.destroy();
                    if (typeof this.onHitPlayer === 'function') {
                        this.onHitPlayer();
                    }
                    return;
                } else if (arrowType === 'red' && !isJumping) {
                    arrow.remove();
                    this.arrows.splice(i, 1);
                    this.destroy();
                    if (typeof this.onHitPlayer === 'function') {
                        this.onHitPlayer();
                    }
                    return;
                }
            }

            if (currentTop > 680) {
                arrow.remove();
                this.arrows.splice(i, 1);
            }
        }

        if (this.bossTop + 120 >= 430) {
            this.destroy();
            if (typeof this.onHitPlayer === 'function') {
                this.onHitPlayer();
            }
        }
    }

    destroy() {
        if (this.circleInterval) {
            clearInterval(this.circleInterval);
            this.circleInterval = null;
        }
        if (this.arrowInterval) {
            clearInterval(this.arrowInterval);
            this.arrowInterval = null;
        }

        this.whiteCircles.forEach(c => c.remove());
        this.whiteCircles = [];

        this.arrows.forEach(a => a.remove());
        this.arrows = [];

        if (this.bossElement) {
            this.bossElement.remove();
            this.bossElement = null;
        }
    }
}
