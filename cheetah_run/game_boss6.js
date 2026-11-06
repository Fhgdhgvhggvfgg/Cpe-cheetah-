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

        // جلب خلفية صورة اللاعب الحالية ديناميكياً من DOM دون استخدام أي صور خارجية
        const playerElement = document.getElementById('player');
        let playerBgImage = 'none';
        if (playerElement) {
            playerBgImage = window.getComputedStyle(playerElement).backgroundImage;
        }

        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-6-element';
        // استخدام النصف العلوي فقط من سبريت اللاعب لملء شكل البوس مع تأثير الإنارة الحمراء
        this.bossElement.innerHTML = `
            <div class="boss6-image-container">
                <div class="boss6-red-glow-effect"></div>
                <div class="boss6-character-half" style="background-image: ${playerBgImage};"></div>
            </div>
        `;
        this.gameContainer.appendChild(this.bossElement);

        this.whiteCircles = [];
        this.arrows = [];

        // Object Pools لتقليل إنشاء عناصر DOM واستهلاك الـ RAM
        this.whiteCirclePool = [];
        this.arrowPool = [];

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
                height: 140px;
                background: transparent;
                border: none;
                box-shadow: none;
                border-radius: 12px;
                z-index: 15;
                opacity: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                pointer-events: none;
            }
            .boss6-image-container {
                position: relative;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            /* تأثير الإنارة الحمراء القوية (Red Lighting Effect) */
            .boss6-red-glow-effect {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle, rgba(231, 76, 60, 0.8) 0%, rgba(192, 57, 43, 0.4) 50%, transparent 80%);
                box-shadow: 0 0 35px 15px rgba(255, 0, 0, 0.7), inset 0 0 20px rgba(255, 69, 0, 0.9);
                border-radius: 50%;
                animation: bossRedPulse 1.5s infinite alternate;
                z-index: 1;
            }
            /* النصف العلوي من صورة اللاعب لملء شكل البوس مع الفلتر والتوهج الأحمر */
            .boss6-character-half {
                position: relative;
                width: 110px;
                height: 110px;
                background-size: 200% 400%;
                background-position: 0% 0%; /* النصف العلوي فقط */
                border-radius: 50%;
                z-index: 2;
                border: 3px solid rgba(255, 0, 0, 0.8);
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.9);
                filter: drop-shadow(0 0 12px rgba(255, 0, 0, 0.9)) brightness(0.9) sepia(1) hue-rotate(-50deg) saturate(4);
            }
            @keyframes bossRedPulse {
                0% {
                    transform: scale(0.95);
                    opacity: 0.7;
                    box-shadow: 0 0 25px 10px rgba(255, 0, 0, 0.6);
                }
                100% {
                    transform: scale(1.1);
                    opacity: 1;
                    box-shadow: 0 0 45px 20px rgba(255, 0, 0, 0.9);
                }
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
            .boss6-arrow-yellow {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 40px solid transparent;
                border-right: 40px solid transparent;
                border-top: 52px solid #f1c40f;
                filter: drop-shadow(0 0 8px #f1c40f);
                z-index: 16;
                pointer-events: none;
            }
            .boss6-arrow-red {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 40px solid transparent;
                border-right: 40px solid transparent;
                border-top: 52px solid #e74c3c;
                filter: drop-shadow(0 0 8px #e74c3c);
                z-index: 1;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);
    }

    spawnWhiteCircle() {
        if (!this.bossElement) return;

        let circle;
        if (this.whiteCirclePool.length > 0) {
            circle = this.whiteCirclePool.pop();
            circle.style.display = 'block';
        } else {
            circle = document.createElement('div');
            circle.className = 'boss6-white-circle';
            this.gameContainer.appendChild(circle);
        }

        const randomLaneIndex = Math.floor(Math.random() * 3);
        const startX = this.lanes[randomLaneIndex] + 12; 

        circle.style.left = startX + 'px';
        circle.style.top = '0px'; 
        circle.dataset.lane = randomLaneIndex;

        this.whiteCircles.push(circle);
    }

    spawnArrow() {
        if (!this.bossElement) return;

        const isYellow = Math.random() < 0.5;
        const targetClass = isYellow ? 'boss6-arrow-yellow' : 'boss6-arrow-red';

        let arrow;
        if (this.arrowPool.length > 0) {
            arrow = this.arrowPool.pop();
            arrow.className = targetClass;
            arrow.style.display = 'block';
        } else {
            arrow = document.createElement('div');
            arrow.className = targetClass;
            this.gameContainer.appendChild(arrow);
        }

        const randomLaneIndex = Math.floor(Math.random() * 3);
        const startX = this.lanes[randomLaneIndex] + 10;

        arrow.style.left = startX + 'px';
        arrow.style.top = '0px'; 
        arrow.dataset.lane = randomLaneIndex;
        arrow.dataset.type = isYellow ? 'yellow' : 'red';

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
                circ.style.display = 'none';
                this.whiteCirclePool.push(circ);
                this.whiteCircles.splice(i, 1);
                this.bossTop -= 66;
                this.checkAndLimitBossPosition();
                continue;
            }

            if (currentTop > 680) {
                circ.style.display = 'none';
                this.whiteCirclePool.push(circ);
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
                    arrow.style.display = 'none';
                    this.arrowPool.push(arrow);
                    this.arrows.splice(i, 1);
                    this.destroy();
                    if (typeof this.onHitPlayer === 'function') {
                        this.onHitPlayer();
                    }
                    return;
                } else if (arrowType === 'red' && !isJumping) {
                    arrow.style.display = 'none';
                    this.arrowPool.push(arrow);
                    this.arrows.splice(i, 1);
                    this.destroy();
                    if (typeof this.onHitPlayer === 'function') {
                        this.onHitPlayer();
                    }
                    return;
                }
            }

            if (currentTop > 680) {
                arrow.style.display = 'none';
                this.arrowPool.push(arrow);
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
        this.whiteCirclePool.forEach(c => c.remove());
        this.whiteCirclePool = [];

        this.arrows.forEach(a => a.remove());
        this.arrows = [];
        this.arrowPool.forEach(a => a.remove());
        this.arrowPool = [];

        if (this.bossElement) {
            this.bossElement.remove();
            this.bossElement = null;
        }
    }
}
