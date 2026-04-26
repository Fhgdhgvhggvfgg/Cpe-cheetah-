export class UIManager {
    constructor(storage) {
        this.storage = storage;
        this.initEventListeners();
    }

    initEventListeners() {
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
                this.storage.saveControlsSize(slider.value);
            };
        }
        
        if(saveAndReload) {
            saveAndReload.onclick = () => location.reload();
        }
        
        if(closeCustomizer) {
            closeCustomizer.onclick = () => this.hideCustomizer();
        }
        
        if(openCustomizer) {
            openCustomizer.onclick = () => this.showCustomizer();
        }
    }

    applyBtnSize(size) {
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.style.width = size + 'px';
            btn.style.height = size + 'px';
        });
    }

    updateMenuDisplay() {
        const killDisplay = document.getElementById('killCountDisplay');
        if(killDisplay) {
            killDisplay.innerHTML = this.storage.kills > 0 ? 
                "آخر نتيجة قتال: " + this.storage.kills : 
                "اضغط الشاشة تبني اضغط المربع تهدم. ";
        }
    }

    showCustomizer() {
        document.getElementById('customizerOverlay').style.display = 'flex';
        this.updatePlayerNameDisplay(); // عرض اسم اللاعب داخل نافذة التخصيص
    }

    hideCustomizer() {
        document.getElementById('customizerOverlay').style.display = 'none';
    }

    // تحديث عرض اسم اللاعب داخل نافذة التخصيص فقط
    updatePlayerNameDisplay() {
        const fileName = this.storage.playerName;
        const displayElement = document.getElementById('playerNameDisplay');
        if (displayElement) {
            if (fileName && fileName !== 'undefined') {
                displayElement.innerText = "📁 ملف اللاعب الحالي: " + fileName;
                displayElement.style.display = 'block';
            } else {
                displayElement.style.display = 'none';
            }
        }
    }

    // تم إلغاء هذه الدالة لأننا لم نعد نستخدم fileNameDisplay العام
    // updateFileNameDisplay() { ... }

    setupImageLoader(id, previewId, key, imgObj) {
        const loader = document.getElementById(id);
        if(!loader) return;
        
        loader.onchange = async (e) => {
            const file = e.target.files[0]; 
            if (!file) return;
            
            if (key === 'playerImage') {
                const newName = file.name.split('.')[0];
                this.storage.savePlayerName(newName);
                this.updatePlayerNameDisplay(); // تحديث اسم اللاعب داخل نافذة التخصيص
            }
            
            const reader = new FileReader();
            const pCont = document.getElementById('progCont');
            const pBar = document.getElementById('progBar');
            
            reader.onloadstart = () => { 
                if(pCont) pCont.style.display = 'block'; 
                if(pBar) pBar.style.width = '100%'; 
            };
            
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                try {
                    this.storage.saveImage(key, dataUrl);
                    const preview = document.getElementById(previewId);
                    if(preview) preview.src = dataUrl;
                    if(imgObj) imgObj.src = dataUrl;
                } catch(err) {
                    alert("الملف كبير جداً على ذاكرة المتصفح.");
                }
                setTimeout(() => { if(pCont) pCont.style.display = 'none'; }, 600);
            };
            
            reader.readAsDataURL(file); 
        };
    }

    showProgressBar() {
        const pCont = document.getElementById('progCont');
        const pBar = document.getElementById('progBar');
        if(pCont) pCont.style.display = 'block';
        if(pBar) pBar.style.width = '100%';
        setTimeout(() => { if(pCont) pCont.style.display = 'none'; }, 600);
    }

    updateHealth(health, maxHealth) {
        const healthBar = document.getElementById('healthBar');
        if(healthBar) {
            healthBar.style.width = (health/maxHealth) * 100 + "%";
        }
    }
}
