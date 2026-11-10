// game_boss7.js
class GameBoss7 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 185, 50];
        this.circles = [];
        this.circlePool = [];
        this.waveTimer = null;
        this.isDestroyed = false;
        
        // نظام النقاط (3 محاولات)
        this.lives = 3;
        this.lifeDots = [];

        this.injectStyles();
        this.createTransparentZone();
        this.createLifeDots();

        // ربط أحداث السحب (الإيماءات) الخاصة باللاعب
        this.boundHandleGesture = this.handleGesture ? this.handleGesture.bind(this) : null;
        this.gameContainer.addEventListener('touchstart', this.boundTouchStart = (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
            this.touchStartY = e.changedTouches[0].screenY;
        }, { passive: true });

        this.gameContainer.addEventListener('touchend', this.boundTouchEnd = (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.touchEndY = e.changedTouches[0].screenY;
            this.checkGestureAndExplode();
        }, { passive: true });

        // البدء بإطلاق الموجات فوراً وتكرارها كل 6.2 ثانية
        this.startWaveCycle();
    }

    injectStyles() {
        if (document.getElementById('game-boss-7-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-boss-7-styles';
        style.innerHTML = `
            .boss7-transparent-zone {
                position: absolute;
                bottom: 150px;
                left: 30px;
                width: 380px;
                height: 100px;
                background: rgba(0, 204, 255, 0.15);
                border: 2px dashed rgba(0, 204, 255, 0.6);
                border-radius: 12px;
                z-index: 8;
                pointer-events: none;
            }
            .boss7-circle-item {
                position: absolute;
                width: 80px;
                height: 80px;
                background: rgba(20, 20, 20, 0.9);
                border: 3px solid #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
                z-index: 14;
                pointer-events: none;
                font-size: 50px;
                color: #ffffff;
                font-weight: 900;
            }
            .boss7-lives-container {
                position: absolute;
                top: 120px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 20;
                pointer-events: none;
            }
            .boss7-life-dot {
                width: 18px;
                height: 18px;
                background-color: #ff0000;
                border: 2px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 8px #ff0000;
                transition: background-color 0.3s, opacity 0.3s;
            }
            .boss7-life-dot.lost {
                background-color: rgba(100, 100, 100, 0.4);
                border-color: rgba(255, 255, 255, 0.3);
                box-shadow: none;
            }
        `;
        document.head.appendChild(style);
    }

    createTransparentZone() {
        this.transparentZone = document.createElement('div');
        this.transparentZone.className = 'boss7-transparent-zone';
        this.gameContainer.appendChild(this.transparentZone);
    }

    createLifeDots() {
        this.livesContainer = document.createElement('div');
        this.livesContainer.className = 'boss7-lives-container';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'boss7-life-dot';
            this.livesContainer.appendChild(dot);
            this.lifeDots.push(dot);
        }

        this.gameContainer.appendChild(this.livesContainer);
    }

    updateLifeDotsUI() {
        for (let i = 0; i < this.lifeDots.length; i++) {
            if (i >= this.lives) {
                this.lifeDots[i].classList.add('lost');
            } else {
                this.lifeDots[i].classList.remove('lost');
            }
        }
    }

    startWaveCycle() {
        if (this.isDestroyed) return;
        this.spawnBatchOfCircles();

        this.waveTimer = setInterval(() => {
            if (this.isDestroyed) return;
            this.spawnBatchOfCircles();
        }, 6200);
    }

    spawnBatchOfCircles() {
        const arrowsList = [
            { symbol: '⬆️', direction: '↑' },
            { symbol: '⬇️', direction: '↓' },
            { symbol: '⬅️', direction: '←' },
            { symbol: '➡️', direction: '→' }
        ];

        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                if (this.isDestroyed) return;
                
                let circle;
                if (this.circlePool.length > 0) {
                    circle = this.circlePool.pop();
                    circle.style.display = 'flex';
                } else {
                    circle = document.createElement('div');
                    circle.className = 'boss7-circle-item';
                    this.gameContainer.appendChild(circle);
                }

                const middleLaneIndex = 1;
                const startX = this.lanes[middleLaneIndex] + 2.5;
                const randomArrowObj = arrowsList[Math.floor(Math.random() * arrowsList.length)];

                circle.style.left = startX + 'px';
                circle.style.top = '-70px';
                circle.textContent = randomArrowObj.symbol;
                
                circle.dataset.lane = middleLaneIndex;
                circle.dataset.arrow = randomArrowObj.direction;

                this.circles.push(circle);
            }, i * 450);
        }
    }

    checkGestureAndExplode() {
        let diffX = this.touchEndX - this.touchStartX;
        let diffY = this.touchEndY - this.touchStartY;
        let threshold = 30;
        let playerGesture = '';

        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (Math.abs(diffX) > threshold) {
                playerGesture = diffX < 0 ? '←' : '→';
            }
        } else {
            if (Math.abs(diffY) > threshold) {
                playerGesture = diffY < 0 ? '↑' : '↓';
            }
        }

        if (!playerGesture) return;

        for (let i = this.circles.length - 1; i >= 0; i--) {
            let circ = this.circles[i];
            let currentTop = parseFloat(circ.style.top);
            let circArrow = circ.dataset.arrow;

            if (currentTop >= 340 && currentTop <= 540 && circArrow === playerGesture) {
                circ.style.display = 'none';
                this.circlePool.push(circ);
                this.circles.splice(i, 1);
                break;
            }
        }
    }

    update(deltaTime) {
        if (this.isDestroyed) return;

        for (let i = this.circles.length - 1; i >= 0; i--) {
            let circ = this.circles[i];
            let currentTop = parseFloat(circ.style.top) + (280 * deltaTime);
            circ.style.top = currentTop + 'px';

            // إذا تجاوزت الدائرة خط النهاية دون تفجيرها
            if (currentTop > 580) {
                circ.style.display = 'none';
                this.circlePool.push(circ);
                this.circles.splice(i, 1);

                // خصم حياة واحدة وتحديث النقاط الحمراء
                this.lives--;
                this.updateLifeDotsUI();

                // إذا انتهت النقاط تماماً -> خسارة اللعبة
                if (this.lives <= 0) {
                    this.destroy();
                    if (typeof this.onHitPlayer === 'function') {
                        this.onHitPlayer();
                    }
                    return;
                }
            }
        }
    }

    destroy() {
        this.isDestroyed = true;

        if (this.waveTimer) {
            clearInterval(this.waveTimer);
            this.waveTimer = null;
        }

        if (this.transparentZone) {
            this.transparentZone.remove();
            this.transparentZone = null;
        }

        if (this.livesContainer) {
            this.livesContainer.remove();
            this.livesContainer = null;
        }

        if (this.boundTouchStart) {
            this.gameContainer.removeEventListener('touchstart', this.boundTouchStart);
        }
        if (this.boundTouchEnd) {
            this.gameContainer.removeEventListener('touchend', this.boundTouchEnd);
        }

        this.circles.forEach(c => c.remove());
        this.circles = [];
        this.circlePool.forEach(c => c.remove());
        this.circlePool = [];
    }
}
