// game_boss.js
class GameBoss {
    constructor(gameContainer, getPlayerLane, getPlayerPosition, onHitPlayer, isPlayerJumping) {
        this.gameContainer = gameContainer;
        this.getPlayerLane = getPlayerLane;
        this.getPlayerPosition = getPlayerPosition;
        this.onHitPlayer = onHitPlayer;
        this.isPlayerJumping = isPlayerJumping;
        
        // حقن الـ CSS برمجياً داخل الملف
        this.injectStyles();

        // إنشاء عنصر الزعيم (الدائرة الحمراء)
        this.bossElement = document.createElement('div');
        this.bossElement.className = 'game-boss-element';
        this.gameContainer.appendChild(this.bossElement);

        this.projectiles = [];
        this.shootInterval = setInterval(() => this.shoot(), 1200);
    }

    injectStyles() {
        if (document.getElementById('game-boss-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'game-boss-styles';
        style.innerHTML = `
            .game-boss-element {
                position: absolute;
                width: 70px;
                height: 70px;
                background: #ff0000;
                border-radius: 50%;
                box-shadow: 0 0 20px #ff0000;
                top: 30px;
                left: 185px;
                z-index: 15;
            }
            .boss-projectile {
                position: absolute;
                width: 20px;
                height: 20px;
                background: #ff9900;
                border-radius: 50%;
                box-shadow: 0 0 10px #ff9900;
                top: 90px;
                z-index: 5; /* تم جعلها 5 لكي تظهر تحت اللاعب (الذي طبقاته 10) */
            }
        `;
        document.head.appendChild(style);
    }

    shoot() {
        const proj = document.createElement('div');
        proj.className = 'boss-projectile';
        
        const bossCurrentLeft = parseFloat(this.bossElement.style.left || '185px');
        proj.style.left = (bossCurrentLeft + 25) + 'px';
        proj.style.top = '90px';

        this.gameContainer.appendChild(proj);
        this.projectiles.push(proj);
    }

    update(deltaTime) {
        const lanes = [320, 185, 50];

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            let p = this.projectiles[i];
            
            // 1. النزول عمودياً إلى الأسفل باستمرار
            let currentTop = parseFloat(p.style.top) + 400 * deltaTime;
            p.style.top = currentTop + 'px';

            // 2. تتبع مسار اللاعب أفقياً أثناء نزولها
            let targetLaneX = lanes[this.getPlayerLane()];
            let targetX = targetLaneX + 22; 
            let currentX = parseFloat(p.style.left);

            if (currentX < targetX) {
                currentX += 200 * deltaTime;
                if (currentX > targetX) currentX = targetX;
            } else if (currentX > targetX) {
                currentX -= 200 * deltaTime;
                if (currentX < targetX) currentX = targetX;
            }
            p.style.left = currentX + 'px';

            // 3. التحقق من الاصطدام باللاعب
            if (currentTop >= 450 && currentTop <= 520) {
                if (Math.abs(currentX - (targetX)) < 30) {
                    let jumping = this.isPlayerJumping ? this.isPlayerJumping() : false;
                    if (!jumping) {
                        p.remove();
                        this.projectiles.splice(i, 1);
                        if (this.onHitPlayer) this.onHitPlayer();
                        continue;
                    }
                }
            }

            // إزالة القذيفة إذا تجاوزت شاشة اللعبة
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
    }
}
