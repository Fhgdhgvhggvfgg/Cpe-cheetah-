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
            slider.oninput = () => { 
                sizeVal.innerText = slider.value; 
                this.applyBtnSize(slider.value); 
                this.applyAllElementsSize(slider.value);  // تطبيق الحجم على جميع العناصر
                this.storage.saveControlsSize(slider.value); 
            };
        }
        if(saveAndReload) saveAndReload.onclick = () => location.reload();
        if(closeCustomizer) closeCustomizer.onclick = () => this.hideCustomizer();
        if(openCustomizer) openCustomizer.onclick = () => this.showCustomizer();
        
        // تطبيق الحجم الأولي على جميع العناصر
        setTimeout(() => {
            this.applyAllElementsSize(this.storage.btnSize);
        }, 100);
    }

    // دالة تطبيق الحجم على أزرار التحكم فقط (تبقى كما هي)
    applyBtnSize(size) { 
        document.querySelectorAll('.control-btn').forEach(btn => { 
            btn.style.width = size + 'px'; 
            btn.style.height = size + 'px'; 
        }); 
    }
    
    // دالة جديدة: تطبيق الحجم على جميع عناصر الواجهة
// دالة تطبيق الحجم على جميع عناصر الواجهة - كل شيء متناسب مع size
applyAllElementsSize(size) {
	this.ms = 1.2;
    // كل القيم مشتقة من size فقط، بدون أرقام ثابتة
    const gap = size / this.ms * 0.27;
    const btnGap = size / this.ms * 0.27;
    
    // 1. أزرار التكبير والتصغير - 60% من حجم أزرار التحكم
    const zoomBtnSize = size / this.ms * 0.6;
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (zoomInBtn) {
        zoomInBtn.style.width = zoomBtnSize + 'px';
        zoomInBtn.style.height = zoomBtnSize + 'px';
        zoomInBtn.style.minWidth = zoomBtnSize + 'px';
        zoomInBtn.style.fontSize = (size / this.ms * 0.3) + 'px';
    }
    if (zoomOutBtn) {
        zoomOutBtn.style.width = zoomBtnSize + 'px';
        zoomOutBtn.style.height = zoomBtnSize + 'px';
        zoomOutBtn.style.minWidth = zoomBtnSize + 'px';
        zoomOutBtn.style.fontSize = (size / this.ms * 0.3) + 'px';
    }
    
    // 2. قيمة عرض التكبير
    const zoomValueDisplay = document.getElementById('zoomValueDisplay');
    if (zoomValueDisplay) {
        zoomValueDisplay.style.fontSize = (size / this.ms * 0.2) + 'px';
        zoomValueDisplay.style.padding = (size / this.ms * 0.08) + 'px ' + (size / this.ms * 0.12) + 'px';
        zoomValueDisplay.style.minWidth = (size / this.ms * 0.5) + 'px';
    }
    
    // 3. أزرار الإجراءات العلوية - 70% من حجم أزرار التحكم
    const actionBtnWidth = size / 2 * 1.2;
    const pauseBtn = document.getElementById('pauseBtn');
    const clearBtn = document.getElementById('clearBtn');
    const exitBtn = document.getElementById('exitBtn');
    
    [pauseBtn, clearBtn, exitBtn].forEach(btn => {
        if (btn) {
            btn.style.width = actionBtnWidth + 'px';
            btn.style.height = (size / this.ms * 0.55) + 'px';
            btn.style.fontSize = (size / this.ms * 0.22) + 'px';
            btn.style.padding = '0 ' + (size / this.ms * 0.12) + 'px';
            btn.style.minWidth = actionBtnWidth + 'px';
        }
    });
    
    // 4. العدادات
    const killCounter = document.getElementById('killCounterGame');
    const blockCounter = document.getElementById('blockCounterGame');
    
    [killCounter, blockCounter].forEach(counter => {
        if (counter) {
            counter.style.fontSize = (size / this.ms * 0.24) + 'px';
            counter.style.padding = (size / this.ms * 0.1) + 'px ' + (size / this.ms * 0.2) + 'px';
            const img = counter.querySelector('img');
            if (img) {
                img.style.width = (size / this.ms * 0.35) + 'px';
                img.style.height = (size / this.ms * 0.35) + 'px';
            }
        }
    });
    
    // 5. مؤقتات القدرة الخارقة
    const cooldownTimer = document.getElementById('abilityCooldownTimer');
    const durationTimer = document.getElementById('abilityDurationTimer');
    
    [cooldownTimer, durationTimer].forEach(timer => {
        if (timer) {
            timer.style.fontSize = (size / this.ms * 0.18) + 'px';
            timer.style.padding = (size / this.ms * 0.07) + 'px ' + (size / this.ms * 0.14) + 'px';
        }
    });
    
    // 6. شريط الصحة
    const healthContainer = document.getElementById('healthBarContainer');
    if (healthContainer) {
        healthContainer.style.width = (size / this.ms * 2.5) + 'px';
        healthContainer.style.height = (size / this.ms * 0.12) + 'px';
    }
    
// 7. المسافات بين الأزرار وتحديد موضع مجموعة الأزرار العلوية
const controlsMove = document.querySelector('.controls-move');
const controlsActions = document.querySelector('.controls-actions');
const topBtnGroup = document.querySelector('.top-btn-group');

if (controlsMove) controlsMove.style.gap = (size / this.ms * 0.27) + 'px';
if (controlsActions) controlsActions.style.gap = (size / this.ms * 0.27) + 'px';
if (topBtnGroup) {
    topBtnGroup.style.gap = (size / this.ms * 0.13) + 'px';
    topBtnGroup.style.top = (size / this.ms * 0.6) + 'px';      // 45px ~ size*0.6
    topBtnGroup.style.right = (size / this.ms * 0.17) + 'px';    // 20px ~ size*0.27
}    
    // 8. تحديث المواضع
    this.updateElementsPosition(size);
}
    
    // تحديث موضع العناصر بناءً على حجم الأزرار
// تحديث موضع العناصر بناءً على حجم الأزرار - كل شيء يعتمد على size
updateElementsPosition(size) {
    const killCounter = document.getElementById('killCounterGame');
    const blockCounter = document.getElementById('blockCounterGame');
    const cooldownTimer = document.getElementById('abilityCooldownTimer');
    const durationTimer = document.getElementById('abilityDurationTimer');
    
    // المسافة الأساسية من الأعلى
    const baseTop = size / this.ms * 0.27;
    
    // ارتفاع كل عداد تقريباً (حسب حجم الخط والpadding)
    const counterHeight = size / this.ms * 0.45;  // الارتفاع التقريبي للعداد
    
    if (killCounter) {
        killCounter.style.top = baseTop + 'px';
    }
    if (blockCounter) {
        // وضع عداد البلوكات أسفل عداد القتلى بمسافة مناسبة
        blockCounter.style.top = (baseTop + counterHeight + size / this.ms * 0.1) + 'px';
    }
    if (cooldownTimer) {
        cooldownTimer.style.top = (baseTop + counterHeight * 2 + size / this.ms * 0.2) + 'px';
    }
    if (durationTimer) {
        durationTimer.style.top = (baseTop + counterHeight * 2 + size / this.ms * 0.2 + size / this.ms * 0.35) + 'px';
    }
}
    
    updateBlockCounter(blockCount) {
        const blockCounter = document.getElementById('blockCounterGame');
        if (blockCounter) {
            if (this.storage.bg) {
                const img = new Image();
                img.onload = () => {
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    
                    const scaleX = imgWidth / 810;
                    const scaleY = imgHeight / 1215;
                    
                    const originalX = 770;
                    const originalY = 1175;
                    const originalSize = 40;
                    
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
                    const imgSize = Math.max(20, this.storage.btnSize * 0.37) + 'px';
                    blockCounter.innerHTML = `<img src="${blockImgSrc}" style="width: ${imgSize}; height: ${imgSize}; vertical-align: middle; margin-left: 5px; image-rendering: pixelated;"> ${blockCount}`;
                    
                    // إعادة تطبيق الحجم بعد تغيير المحتوى
                    this.applyAllElementsSize(this.storage.btnSize);
                };
                img.src = this.storage.bg;
            } else {
                blockCounter.innerHTML = `🧱 ${blockCount}`;
                this.applyAllElementsSize(this.storage.btnSize);
            }
        }
    }

    updateMenuDisplay() {
        const killDisplay = document.getElementById('killCountDisplay');
        if(killDisplay) killDisplay.innerHTML = this.storage.kills > 0 ? "آخر نتيجة قتال: " + this.storage.kills : "اضغط الشاشة تبني اضغط المربع تهدم. ";
        this.updateInGameKillCounter(this.storage.kills);
    }

    updateInGameKillCounter(kills) { 
        const killCounter = document.getElementById('killCounterGame'); 
        if (killCounter) killCounter.innerHTML = kills;
        // إعادة تطبيق الحجم بعد تغيير المحتوى
        this.applyAllElementsSize(this.storage.btnSize);
    }

    showCustomizer() { 
        document.getElementById('customizerOverlay').style.display = 'flex'; 
        this.updatePlayerNameDisplay(); 
    }
    
    hideCustomizer() { 
        document.getElementById('customizerOverlay').style.display = 'none'; 
    }

    updatePlayerNameDisplay() {
        const fileName = this.storage.playerName;
        const displayElement = document.getElementById('playerNameDisplay');
        if (displayElement) {
            if (fileName && fileName !== 'undefined') { 
                displayElement.innerText = "📁 ملف اللاعب الحالي: " + fileName; 
                displayElement.style.display = 'block'; 
            }
            else displayElement.style.display = 'none';
        }
    }

    setupImageLoader(id, previewId, key, imgObj) {
        const loader = document.getElementById(id);
        if(!loader) return;
        
        loader.onchange = async (e) => {
            const file = e.target.files[0]; 
            if (!file) return;
            
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                alert(`⚠️ الملف كبير جداً! الحد الأقصى 50 ميجابايت.\nحجم ملفك: ${(file.size / (1024*1024)).toFixed(2)} MB`);
                return;
            }
            
            if (key === 'playerImage') { 
                const newName = file.name.split('.')[0]; 
                this.storage.savePlayerName(newName); 
                this.updatePlayerNameDisplay(); 
            }
            
            const reader = new FileReader();
            const pCont = document.getElementById('progCont');
            const pBar = document.getElementById('progBar');
            
            reader.onloadstart = () => { 
                if(pCont) pCont.style.display = 'block'; 
                if(pBar) pBar.style.width = '100%'; 
            };
            
            reader.onload = async (ev) => {
                const dataUrl = ev.target.result;
                
                try {
                    await this.storage.saveImage(key, dataUrl);
                    
                    const preview = document.getElementById(previewId); 
                    if(preview) preview.src = dataUrl; 
                    if(imgObj) imgObj.src = dataUrl;
                    
                    const info = await this.storage.getStorageInfo();
                    console.log(`✅ تم حفظ ${key} | المستخدم: ${info.totalUsedMB} MB`);
                    
                    const notification = document.createElement('div');
                    notification.textContent = `💾 تم حفظ الصورة | المستخدم: ${info.totalUsedMB} MB`;
                    notification.style.position = 'fixed';
                    notification.style.bottom = '80px';
                    notification.style.left = '50%';
                    notification.style.transform = 'translateX(-50%)';
                    notification.style.backgroundColor = 'rgba(0,0,0,0.8)';
                    notification.style.color = '#27ae60';
                    notification.style.padding = '10px 20px';
                    notification.style.borderRadius = '30px';
                    notification.style.fontSize = '14px';
                    notification.style.zIndex = '3000';
                    document.body.appendChild(notification);
                    setTimeout(() => notification.remove(), 3000);
                    
                } catch(err) { 
                    console.error(err);
                    alert("❌ فشل حفظ الصورة. تأكد من وجود مساحة كافية."); 
                }
                
                setTimeout(() => { 
                    if(pCont) pCont.style.display = 'none'; 
                }, 600);
            };
            
            reader.readAsDataURL(file); 
        };
    }

    showProgressBar() { 
        const pCont = document.getElementById('progCont'); 
        const pBar = document.getElementById('progBar'); 
        if(pCont) pCont.style.display = 'block'; 
        if(pBar) pBar.style.width = '100%'; 
        setTimeout(() => { 
            if(pCont) pCont.style.display = 'none'; 
        }, 600); 
    }

    updateHealth(health, maxHealth) { 
        const healthBar = document.getElementById('healthBar'); 
        if(healthBar) healthBar.style.width = (health/maxHealth) * 100 + "%"; 
    }
}