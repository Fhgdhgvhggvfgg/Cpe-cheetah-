export class StorageManager {
    constructor() {
        this.player = localStorage.getItem('playerImage');
        this.bg = localStorage.getItem('bgImage');
        this.enemy = localStorage.getItem('enemyImage');
        this.platforms = JSON.parse(localStorage.getItem('gamePlatforms') || "[]");
        this.lastX = parseFloat(localStorage.getItem('playerLastX')) || 400;
        this.lastY = parseFloat(localStorage.getItem('playerLastY')) || 1400;
        this.kills = parseInt(localStorage.getItem('totalKills')) || 0;
        this.btnSize = localStorage.getItem('controlsSize') || 75;
        this.playerName = localStorage.getItem('playerName') || '';
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