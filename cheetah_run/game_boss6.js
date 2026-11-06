// game_boss6.js
class GameBoss6 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 170, 30];
        this.bossTop = -164;
        this.approachSpeed = 6;

        this.injectStyles();

        // ✅ جلب الصورة من localStorage أولاً (المصدر الموثوق)
        let playerBgImage = this.getPlayerProfileImage();

        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-6-element';
        this.bossElement.innerHTML = `
            <div class="boss6-image-container">
                <div class="boss6-character-profile" id="boss6-profile-img" style="background-image: ${playerBgImage};"></div>
            </div>
        `;
        this.gameContainer.appendChild(this.bossElement);

        // ✅ تحديث الصورة ديناميكياً إذا تغيّرت أثناء وجود البوس
        this.profileImageWatcher = setInterval(() => {
            const profileEl = document.getElementById('boss6-profile-img');
            if (!profileEl) return;
            const freshImage = this.getPlayerProfileImage();
            if (freshImage && profileEl.style.backgroundImage !== freshImage) {
                profileEl.style.backgroundImage = freshImage;
            }
        }, 500);

        this.whiteCircles = [];
        this.arrows = [];
        this.whiteCirclePool = [];
        this.arrowPool = [];

        this.circleInterval = setInterval(() => {
            this.spawnWhiteCircle();
        }, 1200);

        this.arrowInterval = setInterval(() => {
            this.spawnArrow();
        }, 700);
    }

    // ✅ دالة موحّدة لجلب صورة البروفايل بنفس طريقة #white-box-icon
    getPlayerProfileImage() {
        const stored = localStorage.getItem('selectedPlayerImage');
        if (stored) {
            return `url('${stored}')`;
        }

        const whiteBoxIcon = document.getElementById('white-box-icon');
        if (whiteBoxIcon) {
            const computed = window.getComputedStyle(whiteBoxIcon).backgroundImage;
            if (computed && computed !== 'none' && computed !== '') {
                return computed;
            }
        }

        const playerEl = document.getElementById('player');
        if (playerEl) {
            const computed = window.getComputedStyle(playerEl).backgroundImage;
            if (computed && computed !== 'none' && computed !== '') {
                return computed;
            }
        }

        return "url('players/jamaica.png')";
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
            /* ✅ صورة الشخصية: الحفاظ على نفس المقاسات مع استبدال التوهج الخارجي بحدود خطوط حمراء */
            .boss6-character-profile {
                position: relative;
                width: 300px;
                height: 200px;
                background-size: 200% 600%;
                background-position: 100% 90%;
                background-repeat: no-repeat;
                border-radius: 6px;
                opacity: 0.7;
                z-index: 2;
                border: 3px solid #ff2a2a;
                box-shadow: 0 0 12px #ff2a2a,
                            inset 0 0 8px rgba(255, 0, 0, 0.6);
                filter: saturate(1.3) contrast(1.15);
                animation: boss6ProfilePulse 1.4s ease-in-out infinite;
            }
            /* ✅ طبقة حمراء خفيفة فوق الصورة لتعزيز المظهر */
            .boss6-character-profile::after {
                content: '';
                position: absolute;
                inset: 0;
                border-radius: 4px;
                background: rgba(255, 0, 0, 0.12);
                mix-blend-mode: overlay;
                pointer-events: none;
                z-index: 3;
            }
            /* ✅ نبض خفيف لخطوط الحدود الحمراء فقط دون تأثيرات خارجية ضخمة */
            @keyframes boss6ProfilePulse {
                0%, 100% {
                    border-color: #ff2a2a;
                    box-shadow: 0 0 10px #ff2a2a,
                                inset 0 0 6px rgba(255, 0, 0, 0.5);
                }
                50% {
                    border-color: #ff5252;
                    box-shadow: 0 0 18px #ff2a2a,
                                inset 0 0 12px rgba(255, 0, 0, 0.8);
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
        if (this.bossTop < -164) {
            this.bossTop = -164;
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

        if (this.bossTop + 120 >= 373) {
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
        if (this.profileImageWatcher) {
            clearInterval(this.profileImageWatcher);
            this.profileImageWatcher = null;
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
