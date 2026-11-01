class CharacterManager {
    constructor() {
        this.currentPlayerImage = localStorage.getItem('selectedPlayerImage') || 'players/jamaica.png';
    }

    // تطبيق الصورة الحالية على عناصر الواجهة
    applyPlayerImage(imgName, ...elements) {
        elements.forEach(el => {
            if (el) el.style.backgroundImage = `url('${imgName}')`;
        });
    }

    // فتح القائمة وجلب الشخصيات من الملف ومن الذاكرة المحلية
    async openCharacterSelect(containerId, onSelectCallback) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = 'جاري التحميل...';

        try {
            const response = await fetch('player_t.txt');
            const text = await response.text();
            let images = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);

            let customKeys = JSON.parse(localStorage.getItem('customPlayerImages')) || [];
            container.innerHTML = '';

            // 1. عرض الشخصيات المخصصة أولاً
            customKeys.forEach((key, index) => {
                let imgData = localStorage.getItem(key);
                if (!imgData) return;

                const item = this.createCharacterItem(imgData, `character${index + 1}`, true, () => {
                    this.deleteCustomCharacter(key, imgData, () => this.openCharacterSelect(containerId, onSelectCallback));
                }, () => {
                    this.selectCharacter(imgData, onSelectCallback);
                });

                container.appendChild(item);
            });

            // 2. عرض الشخصيات الأساسية من الملف
            images.forEach(imgName => {
                let fileName = imgName.split('/').pop().replace(/\.[^/.]+$/, "");
                const item = this.createCharacterItem(imgName, fileName, false, null, () => {
                    this.selectCharacter(imgName, onSelectCallback);
                });

                container.appendChild(item);
            });

        } catch (error) {
            container.innerHTML = 'فشل تحميل ملف الشخصيات player_t.txt';
        }
    }

    // إنشاء عنصر القائمة لكل شخصية
    createCharacterItem(imgSrc, name, isCustom, onDelete, onClick) {
        const item = document.createElement('div');
        item.className = 'character-item';
        item.onclick = (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                onClick();
            }
        };

        const imgPreview = document.createElement('div');
        imgPreview.className = 'character-preview-img';
        imgPreview.style.backgroundImage = `url('${imgSrc}')`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'character-name';
        nameSpan.style.flexGrow = '1';
        nameSpan.textContent = name;

        item.appendChild(imgPreview);
        item.appendChild(nameSpan);

        if (isCustom && onDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.style.cssText = 'background: #ff3366; color: #fff; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-weight: bold; margin-right: 10px;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                onDelete();
            };
            item.appendChild(deleteBtn);
        }

        return item;
    }

    // اختيار وحفظ الشخصية
    selectCharacter(imgName, callback) {
        this.currentPlayerImage = imgName;
        localStorage.setItem('selectedPlayerImage', imgName);
        if (callback) callback(imgName);
    }

    // معالجة رفع صورة جديدة من المعرض
    handleDeviceImage(event, callback) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Image = e.target.result;
            let customCount = parseInt(localStorage.getItem('customCharacterCount') || '0') + 1;
            let characterKey = `character${customCount}`;

            localStorage.setItem(characterKey, base64Image);
            localStorage.setItem('customCharacterCount', customCount);

            let customImages = JSON.parse(localStorage.getItem('customPlayerImages')) || [];
            if (!customImages.includes(characterKey)) {
                customImages.push(characterKey);
                localStorage.setItem('customPlayerImages', JSON.stringify(customImages));
            }

            this.selectCharacter(base64Image, callback);
        };
        reader.readAsDataURL(file);
    }

    // حذف شخصية مخصصة
    deleteCustomCharacter(key, imgData, refreshCallback) {
        localStorage.removeItem(key);
        let customKeys = JSON.parse(localStorage.getItem('customPlayerImages')) || [];
        customKeys = customKeys.filter(k => k !== key);
        localStorage.setItem('customPlayerImages', JSON.stringify(customKeys));

        if (this.currentPlayerImage === imgData) {
            this.currentPlayerImage = 'players/player_jump.png';
            localStorage.setItem('selectedPlayerImage', 'players/player_jump.png');
        }

        if (refreshCallback) refreshCallback();
    }
}
