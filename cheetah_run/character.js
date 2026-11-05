class CharacterManager {
    constructor() {
        this.currentPlayerImage = localStorage.getItem('selectedPlayerImage') || 'players/jamaica.png';
        this.initRunningAnimation();
        this.initPreviewTouchJump();
    }

    // حركة الركض المستمرة للطبقة العلوية
    initRunningAnimation() {
        let runFrame = 0;
        let animTimer = 0;
        let lastTime = performance.now();

        const animate = (currentTime) => {
            const selectScreen = document.getElementById('character-select-screen');
            const playerDiv = document.getElementById('single-preview-player');

            if (selectScreen && selectScreen.style.display === 'flex' && playerDiv) {
                let deltaTime = (currentTime - lastTime) / 1000;
                lastTime = currentTime;
                if (deltaTime > 0.1) deltaTime = 0.1;

                animTimer += deltaTime;
                if (animTimer > 0.16) {
                    runFrame = 1 - runFrame;
                    if (playerDiv.dataset.isJumping !== 'true') {
                        playerDiv.style.backgroundPosition = (runFrame === 0 ? '0% 0%' : '-100% 0%');
                    }
                    animTimer = 0;
                }
            } else {
                lastTime = performance.now();
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }

    // إضافة دعم السحب للأعلى للقفز في شاشة المعاينة العلوية
    initPreviewTouchJump() {
        let startY = 0;
        
        document.addEventListener('touchstart', (e) => {
            const upperScreen = document.getElementById('upper-preview-screen');
            if (upperScreen && upperScreen.contains(e.target)) {
                startY = e.changedTouches[0].screenY;
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const upperScreen = document.getElementById('upper-preview-screen');
            if (upperScreen && upperScreen.contains(e.target)) {
                let endY = e.changedTouches[0].screenY;
                let diffY = endY - startY;
                
                if (diffY < -30) {
                    this.triggerPreviewJump();
                }
            }
        }, { passive: true });
    }

    // تنفيذ حركة القفز للاعب في المعاينة العلوية
    triggerPreviewJump() {
        const playerDiv = document.getElementById('single-preview-player');
        if (!playerDiv || playerDiv.dataset.isJumping === 'true') return;

        playerDiv.dataset.isJumping = 'true';
        let num = Math.floor(Math.random() * 10) + 1;
        let bgPos = num < 4 ? '-100% 200%' : '-100% 0%';

        playerDiv.style.transition = 'transform 0.4s cubic-bezier(0, 0, 0.2, 1)';
        playerDiv.style.transform = 'translateY(-60px)';
        playerDiv.style.backgroundPosition = bgPos;

        setTimeout(() => {
            playerDiv.style.transition = 'transform 0.2s cubic-bezier(0.42, 0, 1, 1)';
            playerDiv.style.transform = 'translateY(0)';
            playerDiv.style.backgroundPosition = '0% 0%';
            setTimeout(() => {
                playerDiv.dataset.isJumping = 'false';
            }, 200);
        }, 400);
    }

    // تطبيق الصورة الحالية على عناصر الواجهة وطبقة المعاينة العلوية
    applyPlayerImage(imgName, ...elements) {
        this.currentPlayerImage = imgName;
        elements.forEach(el => {
            if (el) el.style.backgroundImage = `url('${imgName}')`;
        });
        
        const singlePlayer = document.getElementById('single-preview-player');
        if (singlePlayer) {
            singlePlayer.style.backgroundImage = `url('${imgName}')`;
        }
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

                const item = this.createCharacterItem(
                    imgData, 
                    `character${index + 1}`, 
                    true, 
                    // عند الضغط على زر الحذف
                    () => {
                        this.deleteCustomCharacter(key, imgData, () => this.openCharacterSelect(containerId, onSelectCallback));
                    }, 
                    // عند الضغط على الشخصية (تغيير المعاينة فقط دون الخروج)
                    () => {
                        this.previewCharacter(imgData);
                    },
                    // عند الضغط على زر علامة الصح (تأكيد الخروج)
                    () => {
                        this.selectCharacter(imgData, onSelectCallback);
                    }
                );

                container.appendChild(item);
            });

            // 2. عرض الشخصيات الأساسية من الملف
            images.forEach(imgName => {
                let fileName = imgName.split('/').pop().replace(/\.[^/.]+$/, "");
                const item = this.createCharacterItem(
                    imgName, 
                    fileName, 
                    false, 
                    null, 
                    // عند الضغط على الشخصية (معاينة فقط)
                    () => {
                        this.previewCharacter(imgName);
                    },
                    // عند الضغط على زر علامة الصح (تأكيد الخروج)
                    () => {
                        this.selectCharacter(imgName, onSelectCallback);
                    }
                );

                container.appendChild(item);
            });

        } catch (error) {
            container.innerHTML = 'فشل تحميل ملف الشخصيات player_t.txt';
        }
    }

    // المعاينة المؤقتة عند الضغط على الشخصية بدون الخروج وتحديث علامات الصح
    previewCharacter(imgName) {
        this.currentPlayerImage = imgName;
        const singlePlayer = document.getElementById('single-preview-player');
        if (singlePlayer) {
            singlePlayer.style.backgroundImage = `url('${imgName}')`;
        }

        // تحديث إظهار علامات الصح في القائمة بناءً على الشخصية المعروضة حالياً
        const items = document.querySelectorAll('.character-item');
        items.forEach(item => {
            const checkBtn = item.querySelector('.check-btn');
            const imgPreview = item.querySelector('.character-preview-img');
            if (checkBtn && imgPreview) {
                let bgImage = imgPreview.style.backgroundImage;
                if (bgImage.includes(imgName)) {
                    checkBtn.style.display = 'flex';
                    item.style.borderColor = '#00ffcc';
                } else {
                    checkBtn.style.display = 'none';
                    item.style.borderColor = 'transparent';
                }
            }
        });
    }

    // إنشاء عنصر القائمة لكل شخصية (الأيقونة في اليمين والاسم في اليسار)
    createCharacterItem(imgSrc, name, isCustom, onDelete, onClickPreview, onConfirmSelect) {
        const item = document.createElement('div');
        item.className = 'character-item';
        
        let isSelected = (this.currentPlayerImage === imgSrc);
        let borderColor = isSelected ? '#00ffcc' : 'transparent';

        item.style.cssText = `display: flex; flex-direction: row; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.1); padding: 8px 12px; border-radius: 8px; width: 90%; cursor: pointer; border: 2px solid ${borderColor}; transition: 0.2s; flex-shrink: 0;`;
        
        item.onclick = (e) => {
            if (!e.target.classList.contains('delete-btn') && !e.target.classList.contains('check-btn')) {
                onClickPreview();
            }
        };

        // اسم الشخصية في اليسار
        const nameSpan = document.createElement('span');
        nameSpan.className = 'character-name';
        nameSpan.style.cssText = 'font-size: 14px; color: #fff; text-align: left; flex-grow: 1; margin-left: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
        nameSpan.textContent = name;

        // حاوية تحتوي على صورة الأيقونة وعلامة الصح فوقها
        const imgContainer = document.createElement('div');
        imgContainer.style.cssText = 'position: relative; width: 60px; height: 60px; flex-shrink: 0;';

        // صورة الأيقونة في اليمين
        const imgPreview = document.createElement('div');
        imgPreview.className = 'character-preview-img';
        imgPreview.style.cssText = `width: 100%; height: 100%; background-image: url('${imgSrc}'); background-size: 200% 400%; background-position: 100% 100%; border-radius: 6px; border: 2px solid #ffffff; box-shadow: 0 0 8px #00ccff;`;

        // زر علامة الصح (يظهر بجانب الأيقونة للشخصية الحالية التي تركض في الأعلى)
        const checkBtn = document.createElement('button');
        checkBtn.className = 'check-btn';
        checkBtn.innerHTML = '✓';
        let displayCheck = isSelected ? 'flex' : 'none';
        checkBtn.style.cssText = `position: absolute; top: -20px; right: -70px; width: 24px; height: 24px; background: #00ffcc; color: #000; border: none; border-radius: 50%; font-weight: bold; font-size: 14px; cursor: pointer; display: ${displayCheck}; align-items: center; justify-content: center; box-shadow: 0 0 5px #000; z-index: 5;`;
        
        checkBtn.onclick = (e) => {
            e.stopPropagation();
            onConfirmSelect();
        };

        imgContainer.appendChild(imgPreview);
        imgContainer.appendChild(checkBtn);

        item.appendChild(nameSpan);
        item.appendChild(imgContainer);

        if (isCustom && onDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = '✕';
            deleteBtn.style.cssText = 'background: #ff3366; color: #fff; border: none; border-radius: 4px; padding: 5px 8px; cursor: pointer; font-size: 12px; margin-right: 8px;';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                onDelete();
            };
            item.appendChild(deleteBtn);
        }

        return item;
    }

    selectCharacter(imgName, callback) {
        this.currentPlayerImage = imgName;
        localStorage.setItem('selectedPlayerImage', imgName);
        if (callback) callback(imgName);
    }

    // معالجة رفع صورة جديدة وإضافتها للقائمة ومعاينتها دون استبدال اللعب مباشرة
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

            // معاينة الصورة المرفوعة الجديدة في الأعلى وتحديث القائمة بدلاً من الخروج المباشر
            this.previewCharacter(base64Image);
            
            // إعادة تحميل القائمة لتظهر الشخصية الجديدة فيها
            this.openCharacterSelect('character-list', callback);
        };
        reader.readAsDataURL(file);
    }

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
