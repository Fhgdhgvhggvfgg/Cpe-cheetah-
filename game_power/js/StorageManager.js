export class StorageManager {
    constructor() {
        this.blockCG = parseInt(localStorage.getItem('blockCG')) || 0;
        this.player = localStorage.getItem('playerImage');
        this.bg = localStorage.getItem('bgImage');
        this.enemy = localStorage.getItem('enemyImage');
        this.platforms = JSON.parse(localStorage.getItem('gamePlatforms') || "[]");
        this.lastX = parseFloat(localStorage.getItem('playerLastX')) || 400;
        this.lastY = parseFloat(localStorage.getItem('playerLastY')) || 1400;
        this.kills = parseInt(localStorage.getItem('totalKills')) || 0;
        this.btnSize = localStorage.getItem('controlsSize') || 75;
        this.playerName = localStorage.getItem('playerName') || '';
        this.zoom = parseFloat(localStorage.getItem('gameZoom')) || 1.5;
        
        this.speed = parseFloat(localStorage.getItem('playerSpeed')) || 450;
        this.dash_s = parseFloat(localStorage.getItem('playerDashSpeed')) || 1500;
        this.damage_p = parseFloat(localStorage.getItem('playerDamage')) || 100;
        this.radius_dp = parseFloat(localStorage.getItem('damageRadius')) || 170;
        
        // مهم: يجب أن تسمح القيمة السالبة، 0 تعتبر قيمة صحيحة
        const savedJump = localStorage.getItem('playerJumpForce');
        this.jumpForce = savedJump !== null ? parseFloat(savedJump) : -790;
    }
    
    saveZoom(zoom) {
        localStorage.setItem('gameZoom', zoom);
        this.zoom = zoom;
    }

    saveBlockCG(count) {
        localStorage.setItem('blockCG', count);
        this.blockCG = count;
    }

    savePlayerPosition(x, y) {
        localStorage.setItem('playerLastX', x);
        localStorage.setItem('playerLastY', y);
    }

    savePlatforms(platforms) {
        localStorage.setItem('gamePlatforms', JSON.stringify(platforms));
    }

    saveKills(kills) {
        localStorage.setItem('totalKills', kills);
        this.kills = kills;
    }

    saveControlsSize(size) {
        localStorage.setItem('controlsSize', size);
        this.btnSize = size;
    }

    saveImage(key, dataUrl) {
        localStorage.setItem(key, dataUrl);
        switch(key) {
            case 'playerImage': this.player = dataUrl; break;
            case 'bgImage': this.bg = dataUrl; break;
            case 'enemyImage': this.enemy = dataUrl; break;
        }
    }

    savePlayerName(name) {
        localStorage.setItem('playerName', name);
        this.playerName = name;
    }

    clearPlatforms() {
        localStorage.removeItem('gamePlatforms');
        this.platforms = [];
    }

    // دالة حفظ قوة القفز - مهم: تقبل الأرقام السالبة
    saveJumpForce(force) {
        const numForce = parseFloat(force);
        if (!isNaN(numForce)) {
            localStorage.setItem('playerJumpForce', numForce);
            this.jumpForce = numForce;
            console.log('JumpForce saved:', numForce); // للتأكد
            return true;
        }
        return false;
    }

    async loadImageAsDataURL(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } catch(e) { return null; }
    }
}