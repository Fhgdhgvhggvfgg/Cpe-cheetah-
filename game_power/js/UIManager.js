export class UIManager {
    
    updateFileNameDisplay() {
        const display = document.getElementById('playerNameDisplay');
        if (display) {
            display.innerText = this.storage.playerName || "لاعب الفهد";
            display.style.display = 'block';
        }
    }

    constructor(storage) {
        this.storage = storage;
        this.initEventListeners();
    }

    initEventListeners() {
        const toggleBtn = document.getElementById('toggleSuperMode');
        const statusSpan = document.getElementById('superModeStatus');
        const savedSuperMode = localStorage.getItem('superModeEnabled');
        const isNormalMode = savedSuperMode !== null ? parseInt(savedSuperMode) : 1;
        
        function updateToggleUI(value) {
            if (statusSpan) {
                if (value === 1) { statusSpan.innerText = "لا تنفجر"; statusSpan.style.color = "#27ae60"; }
                else { statusSpan.innerText = "تنفجر"; statusSpan.style.color = "#e74c3c"; }
            }
        }
        updateToggleUI(isNormalMode);
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                let currentValue = parseInt(localStorage.getItem('superModeEnabled'));
                if (isNaN(currentValue)) currentValue = 1;
                const newValue = currentValue === 1 ? 0 : 1;
                localStorage.setItem('superModeEnabled', newValue);
                updateToggleUI(newValue);
                if (window.currentGame) { window.currentGame.useTopRow = newValue; window.currentGame.superModeToggle = (newValue === 0); }
            };
        }
        
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomVal = document.getElementById('zoomVal');
        if (zoomSlider) {
            zoomSlider.value = this.storage.zoom || 1.5;
            if (zoomVal) zoomVal.innerText = this.storage.zoom || 1.5;
            zoomSlider.oninput = () => {
                const newZoom = parseFloat(zoomSlider.value);
                if (zoomVal) zoomVal.innerText = newZoom;
                this.storage.saveZoom(newZoom);
                if (window.currentGame) window.currentGame.zoom = newZoom;
            };
        }
        
        const slider = document.getElementById('btnSizeSlider');
        const sizeVal = document.getElementById('sizeVal');
        const saveAndReload = document.getElementById('saveAndReload');
        const closeCustomizer = document.getElementById('closeCustomizer');
        const openCustomizer = document.getElementById('openCustomizer');
        if(slider) {
            slider.value = this.storage.btnSize;
            sizeVal.innerText = this.storage.btnSize;
            slider.oninput = () => { sizeVal.innerText = slider.value; this.applyBtnSize(slider.value); this.storage.saveControlsSize(slider.value); };
        }
        if(saveAndReload) saveAndReload.onclick = () => location.reload();
        if(closeCustomizer) closeCustomizer.onclick = () => this.hideCustomizer();
        if(openCustomizer) openCustomizer.onclick = () => this.showCustomizer();
    }

    applyBtnSize(size) { document.querySelectorAll('.control-btn').forEach(btn => { btn.style.width = size + 'px'; btn.style.height = size + 'px'; }); }
    
updateBlockCounter(blockCount) {
    const blockCounter = document.getElementById('blockCounterGame');
    if (blockCounter) {
        if (this.storage.bg) {
            const img = new Image();
            img.onload = () => {
                const imgWidth = img.width;
                const imgHeight = img.height;
                
                // حساب النسب بناءً على الأبعاد الفعلية للصورة
                const scaleX = imgWidth / 810;
                const scaleY = imgHeight / 1215;
                
                // الإحداثيات الأصلية للكتلة (في الصورة 810x1215)
                const originalX = 770;
                const originalY = 1175;
                const originalSize = 40;
                
                // الإحداثيات الجديدة حسب حجم الصورة الفعلي
                const sourceX = originalX * scaleX;
                const sourceY = originalY * scaleY;
                const sourceSize = originalSize * scaleX;
                
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                
                ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 32, 32);
                const blockImgSrc = canvas.toDataURL();
                blockCounter.innerHTML = `<img src="${blockImgSrc}" style="width: 28px; height: 28px; vertical-align: middle; margin-left: 5px; image-rendering: pixelated;"> ${blockCount}`;
            };
            img.src = this.storage.bg;
        } else {
            blockCounter.innerHTML = `🧱 ${blockCount}`;
        }
    }
}

    updateMenuDisplay() {
        const killDisplay = document.getElementById('killCountDisplay');
        if(killDisplay) killDisplay.innerHTML = this.storage.kills > 0 ? "آخر نتيجة قتال: " + this.storage.kills : "اضغط الشاشة تبني اضغط المربع تهدم. ";
        this.updateInGameKillCounter(this.storage.kills);
    }

    updateInGameKillCounter(kills) { const killCounter = document.getElementById('killCounterGame'); if (killCounter) killCounter.innerHTML = kills; }

    showCustomizer() { document.getElementById('customizerOverlay').style.display = 'flex'; this.updatePlayerNameDisplay(); }
    hideCustomizer() { document.getElementById('customizerOverlay').style.display = 'none'; }

    updatePlayerNameDisplay() {
        const fileName = this.storage.playerName;
        const displayElement = document.getElementById('playerNameDisplay');
        if (displayElement) {
            if (fileName && fileName !== 'undefined') { displayElement.innerText = "📁 ملف اللاعب الحالي: " + fileName; displayElement.style.display = 'block'; }
            else displayElement.style.display = 'none';
        }
    }

    setupImageLoader(id, previewId, key, imgObj) {
        const loader = document.getElementById(id);
        if(!loader) return;
        loader.onchange = async (e) => {
            const file = e.target.files[0]; 
            if (!file) return;
            if (key === 'playerImage') { const newName = file.name.split('.')[0]; this.storage.savePlayerName(newName); this.updatePlayerNameDisplay(); }
            const reader = new FileReader();
            const pCont = document.getElementById('progCont');
            const pBar = document.getElementById('progBar');
            reader.onloadstart = () => { if(pCont) pCont.style.display = 'block'; if(pBar) pBar.style.width = '100%'; };
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                try { this.storage.saveImage(key, dataUrl); const preview = document.getElementById(previewId); if(preview) preview.src = dataUrl; if(imgObj) imgObj.src = dataUrl; }
                catch(err) { alert("الملف كبير جداً على ذاكرة المتصفح."); }
                setTimeout(() => { if(pCont) pCont.style.display = 'none'; }, 600);
            };
            reader.readAsDataURL(file); 
        };
    }

    showProgressBar() { const pCont = document.getElementById('progCont'); const pBar = document.getElementById('progBar'); if(pCont) pCont.style.display = 'block'; if(pBar) pBar.style.width = '100%'; setTimeout(() => { if(pCont) pCont.style.display = 'none'; }, 600); }

    updateHealth(health, maxHealth) { const healthBar = document.getElementById('healthBar'); if(healthBar) healthBar.style.width = (health/maxHealth) * 100 + "%"; }
}