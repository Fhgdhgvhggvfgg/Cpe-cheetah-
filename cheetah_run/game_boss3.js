// game_boss3.js
class GameBoss3 {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;

        this.lanes = [320, 185, 50]; // مواضع المسارات الثلاثة أفقياً

        this.injectStyles();

        // إنشاء عنصر الزعيم (مربع رمادي)
        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-3-element';
        this.gameContainer.appendChild(this.bossElement);

        this.warningLanes = []; // الخطوط الملونة المحذرة
        this.projectiles = [];   // المقذوفات (المثلثات والصواريخ)

        // الانتظار ثانية واحدة قبل إطلاق أول قذيفة ومن ثم تكرار الهجمات
        setTimeout(() => {
            this.triggerAttackPattern();
            this.attackInterval = setInterval(() => this.triggerAttackPattern(), 2400);
        }, 1000);
    }

    injectStyles() {
        if (document.getElementById('game-boss-3-styles')) return;

        const style = document.createElement('style');
        style.id = 'game-boss-3-styles';
        style.innerHTML = `
            .game-boss-3-element {
                position: absolute;
                width: 70px;
                height: 70px;
                background: #888888;
                border-radius: 0; /* تحويل الدائرة إلى مربع */
                box-shadow: 0 0 20px #888888;
                top: 30px;
                left: 185px;
                z-index: 15;
                pointer-events: none; /* لضمان عدم حجب اللمس */
            }
            /* خطوط التحذير العمودية في المسارات */
            .boss-warning-line {
                position: absolute;
                top: 0;
                bottom: 0;
                width: 65px;
                opacity: 0.5;
                z-index: 4;
                transition: opacity 0.2s;
                pointer-events: none; /* لضمان عدم حجب اللمس */
            }
            .boss-warning-red {
                background: #ff0055;
                box-shadow: inset 0 0 15px #ff0055;
            }
            .boss-warning-orange {
                background: #ff9900;
                box-shadow: inset 0 0 15px #ff9900;
            }
            /* الصاروخ الأحمر */
            .boss3-rocket {
                position: absolute;
                width: 30px;
                height: 60px;
                background: #ff0055;
                border-radius: 15px 15px 5px 5px;
                box-shadow: 0 0 15px #ff0055;
                z-index: 6;
                pointer-events: none; /* لضمان عدم حجب اللمس */
            }
            /* المثلث المعكوس البرتقالي */
            .boss3-inverted-triangle {
                position: absolute;
                width: 0;
                height: 0;
                border-left: 25px solid transparent;
                border-right: 25px solid transparent;
                border-top: 50px solid #ff9900;
                filter: drop-shadow(0px 0px 8px #ff9900);
                z-index: 12;
                pointer-events: none; /* لضمان عدم حجب اللمس */
            }
        `;
        document.head.appendChild(style);
    }

    triggerAttackPattern() {
        this.clearWarnings();

        const laneStates = [];

        for (let i = 0; i < 3; i++) {
            const isRed = Math.random() < 0.5;
            const state = isRed ? 'red' : 'orange';
            laneStates.push(state);

            const warningEl = document.createElement('div');
            warningEl.className = `boss-warning-line boss-warning-${state}`;
            warningEl.style.left = (this.lanes[i]) + 'px';
            this.gameContainer.appendChild(warningEl);
            this.warningLanes.push(warningEl);
        }

        setTimeout(() => {
            this.clearWarnings();
            this.spawnObstacles(laneStates);
        }, 600);
    }

    spawnObstacles(laneStates) {
        for (let i = 0; i < 3; i++) {
            const state = laneStates[i];
            const laneX = this.lanes[i];

            if (state === 'red') {
                const rocket = document.createElement('div');
                rocket.className = 'boss3-rocket';
                rocket.style.left = (laneX + 17) + 'px';
                rocket.style.top = '-60px';
                rocket.dataset.lane = i;
                rocket.dataset.type = 'red';
                this.gameContainer.appendChild(rocket);
                this.projectiles.push(rocket);
            } else if (state === 'orange') {
                const triangle = document.createElement('div');
                triangle.className = 'boss3-inverted-triangle';
                triangle.style.left = (laneX + 7) + 'px';
                triangle.style.top = '-60px';
                triangle.dataset.lane = i;
                triangle.dataset.type = 'orange';
                this.gameContainer.appendChild(triangle);
                this.projectiles.push(triangle);
            }
        }
    }

    clearWarnings() {
        this.warningLanes.forEach(el => el.remove());
        this.warningLanes = [];
    }

    update(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];

            let currentTop = parseFloat(p.style.top) + 1300 * deltaTime;
            p.style.top = currentTop + 'px';

            let projLane = parseInt(p.dataset.lane);
            let projType = p.dataset.type;

            if (currentTop >= 390 && currentTop <= 520) { 
                if (projLane === this.getPlayerLane()) {
                    let jumping = this.isPlayerJumping ? this.isPlayerJumping() : false;

                    if (projType === 'orange' && jumping) {
                        p.remove(); 
                        this.projectiles.splice(i, 1); 
                        if (this.onHitPlayer) this.onHitPlayer();
                        continue;
                    } else if (projType === 'red' && !jumping) {
                        p.remove(); 
                        this.projectiles.splice(i, 1); 
                        if (this.onHitPlayer) this.onHitPlayer();
                        continue;
                    }
                }
            }

            if (currentTop > 680) {
                p.remove();
                this.projectiles.splice(i, 1);
            }
        }
    }

    destroy() {
        if (this.attackInterval) {
            clearInterval(this.attackInterval);
        }
        this.clearWarnings();
        this.projectiles.forEach(p => p.remove());
        this.projectiles = [];
        if (this.bossElement) {
            this.bossElement.remove();
        }
    }
}
