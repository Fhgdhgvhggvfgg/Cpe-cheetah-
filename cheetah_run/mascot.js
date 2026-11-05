/**
 * mascot.js — مناعة مؤقتة (10 ثوانٍ) بحذف الكيانات قبل وصولها + هالة زرقاء + مؤقت شريحة البيتزا
 *  ⚠️ متوافق مع الكود السابق مع إضافة عداد تناقص دائري (شكل شريحة بيتزا دائرية)
 */
(function () {
    'use strict';

    let isActive = false;
    let originalEndGame = null;
    let originalResetGscore = null;
    let patched = false;
    let playerEl = null;
    let rafId = null;
    let autoDeactivateTimer = null;

    let ERASE_LINE_Y = 150;
    const TELEPORT_TO_BOTTOM = true;
    const HIDE_TELEPORTED = true;
    let SHIELD_DURATION_SEC = 10;
    
    // متغيرات مؤقت البيتزا
    let pizzaTimerEl = null;
    let timerInterval = null;

    function getPlayer() {
        if (!playerEl) playerEl = document.getElementById('player');
        return playerEl;
    }
    function getPlayerContainer() {
        return document.getElementById('player-container');
    }
    function getGameContainer() {
        return document.getElementById('game-container');
    }

    // ====== دوال gscore ======
    function keepGscoreAtScore() {
        if (typeof window.setGscore === 'function' && typeof window.getScore === 'function') {
            try {
                const s = window.getScore();
                if (typeof s === 'number') window.setGscore(s);
                return true;
            } catch (e) {}
        }
        return false;
    }

    function isProgressBarFull() {
        const bar = document.getElementById('score-progress-bar');
        if (!bar) return false;
        const width = bar.style.width || '0%';
        const pct = parseFloat(width);
        return !isNaN(pct) && pct >= 99.5;
    }

    // ====== الهالة الزرقاء ومؤقت شريحة البيتزا ======
    function injectAuraStyles() {
        if (document.getElementById('mascot-aura-style')) return;
        const style = document.createElement('style');
        style.id = 'mascot-aura-style';
        style.textContent = `
            @keyframes mascotAuraPulse {
                0%   { filter: drop-shadow(0 0 8px #00ccff) drop-shadow(0 0 18px #00ccff) drop-shadow(0 0 30px #0099ff); }
                50%  { filter: drop-shadow(0 0 14px #00ffff) drop-shadow(0 0 26px #00ccff) drop-shadow(0 0 42px #0099ff); }
                100% { filter: drop-shadow(0 0 8px #00ccff) drop-shadow(0 0 18px #00ccff) drop-shadow(0 0 30px #0099ff); }
            }

            /* مؤقت شريحة البيتزا الدائرية */
            .mascot-pizza-timer {
                position: absolute;
                top: -130px;
                left: 50%;
                transform: translateX(-50%);
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: conic-gradient(#00ccff 0deg, rgba(0, 204, 255, 0.2) 0deg);
                box-shadow: 0 0 10px rgba(0, 204, 255, 0.8), inset 0 0 5px rgba(255, 255, 255, 0.5);
                border: 2px solid #ffffff;
                z-index: 1000;
                pointer-events: none;
                transition: transform 0.1s linear;
            }
            .mascot-pizza-timer::after {
                content: '';
                position: absolute;
                top: 9px;
                left: 9px;
                right: 9px;
                bottom: 9px;
                background: rgba(10, 20, 40, 0.85);
                border-radius: 50%;
            }
        `;
        document.head.appendChild(style);
    }

    function applyAura() {
        const p = getPlayer();
        if (!p) return;
        p.style.animation = 'mascotAuraPulse 1.2s ease-in-out infinite';
    }

    function removeAura() {
        const p = getPlayer();
        if (!p) return;
        p.style.filter = 'none';
        p.style.animation = '';
    }

    // إنشاء وعرض مؤقت البيتزا الدائري
    function createPizzaTimer() {
        removePizzaTimer();
        const container = getPlayerContainer();
        if (!container) return;

        pizzaTimerEl = document.createElement('div');
        pizzaTimerEl.className = 'mascot-pizza-timer';
        container.appendChild(pizzaTimerEl);

        let startTime = Date.now();
        let durationMs = SHIELD_DURATION_SEC * 1000;

        timerInterval = setInterval(() => {
            let elapsed = Date.now() - startTime;
            let progress = elapsed / durationMs;

            if (progress >= 1) {
                progress = 1;
                clearInterval(timerInterval);
            }

            // الزاوية تتناقص من 360 إلى 0 (أو العكس بحسب طريقة التعبئة)
            let degrees = (1 - progress) * 360;
            if (pizzaTimerEl) {
                pizzaTimerEl.style.background = `conic-gradient(#00ccff ${degrees}deg, rgba(0, 204, 255, 0.15) ${degrees}deg)`;
            }
        }, 50);
    }

    function removePizzaTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (pizzaTimerEl) {
            pizzaTimerEl.remove();
            pizzaTimerEl = null;
        }
    }

    // ====== الحذف/النقل البعيد ======
    function eraseDistantEntities() {
        const game = getGameContainer();
        if (!game) return;

        const excludeIds = [
            'player-container', 'player', 'shadow', 'ui',
            'score-progress-container', 'score-progress-bar',
            'white-box-icon', 'powerup-status', 'game-over',
            'start-screen', 'character-select-screen', 'reset-gscore-btn'
        ];

        const children = Array.from(game.children);
        for (const el of children) {
            if (!el.classList) continue;
            if (excludeIds.includes(el.id)) continue;

            const cls = el.className || '';
            if (typeof cls === 'string' && cls.includes('lane-line')) continue;
            if (cls.includes('road-mark')) continue; // ← أضف هذا السطر لتتخطى الندوب ولا يتم حذفها
            if (cls.includes('blue-circle')) continue;

            const isObstacle = cls.includes('obstacle') && !cls.includes('obstacle-line');
            const isObstacleLine = cls.includes('obstacle-line');
            const isEnemy = cls.includes('enemy-yellow');
            const hasPosition = el.style.top !== '' && el.style.left !== '';

            if (!isObstacle && !isObstacleLine && !isEnemy && !hasPosition) continue;

            if (el.closest('#game-over') || el.closest('#start-screen') ||
                el.closest('#character-select-screen')) continue;

            const top = parseFloat(el.style.top);
            if (isNaN(top)) continue;

            if (top >= ERASE_LINE_Y) {
                if (TELEPORT_TO_BOTTOM) {
                    el.style.top = '700px';
                    if (HIDE_TELEPORTED) el.style.opacity = '0';
                } else {
                    el.remove();
                }
            }
        }
    }


    // ====== الجري ======
    function forceRunPose() {
        const p = getPlayer();
        const c = getPlayerContainer();
        if (c) c.style.bottom = '170px';
        if (p) {
            p.style.transform = 'translateY(0)';
            p.style.backgroundPosition = '0% 0%';
        }
    }

    // ====== اعتراض endGame ======
    function patchEndGame() {
        if (patched) return;
        if (typeof window.endGame === 'function') originalEndGame = window.endGame;
        try {
            Object.defineProperty(window, 'endGame', {
                configurable: true,
                get() {
                    return function () {
                        if (isActive) { forceRunPose(); return; }
                        if (originalEndGame) return originalEndGame.apply(window, arguments);
                    };
                },
                set(fn) { originalEndGame = fn; }
            });
        } catch (e) {
            const orig = originalEndGame;
            window.endGame = function () {
                if (isActive) { forceRunPose(); return; }
                if (orig) return orig.apply(window, arguments);
            };
        }
        patched = true;
    }

    function unpatchEndGame() {
        if (!patched) return;
        if (originalEndGame) {
            try {
                Object.defineProperty(window, 'endGame', {
                    configurable: true, writable: true, value: originalEndGame
                });
            } catch (e) { window.endGame = originalEndGame; }
        }
        patched = false;
    }

    // ====== حلقة الماحي ======
    function eraserLoop() {
        if (isActive) {
            eraseDistantEntities();
            forceRunPose();
            keepGscoreAtScore();   // ← gscore = score كل إطار
        }
        rafId = requestAnimationFrame(eraserLoop);
    }
    function startEraser() {
        if (rafId) return;
        rafId = requestAnimationFrame(eraserLoop);
    }
    function stopEraser() {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    function scheduleAutoDeactivate() {
        if (autoDeactivateTimer) clearTimeout(autoDeactivateTimer);
        autoDeactivateTimer = setTimeout(() => {
            MascotShield.deactivate();
        }, SHIELD_DURATION_SEC * 1000);
    }
    function cancelAutoDeactivate() {
        if (autoDeactivateTimer) {
            clearTimeout(autoDeactivateTimer);
            autoDeactivateTimer = null;
        }
    }

    // ====== الواجهة ======
    const MascotShield = {
        activate() {
            if (isActive) { scheduleAutoDeactivate(); return this; }
            isActive = true;
            patchEndGame();
            forceRunPose();
            applyAura();
            createPizzaTimer(); // تشغيل مؤقت شرائح البيتزا الدائري
            startEraser();
            scheduleAutoDeactivate();
            return this;
        },
        deactivate() {
            if (!isActive) return this;
            isActive = false;
            cancelAutoDeactivate();
            unpatchEndGame();
            removeAura();
            removePizzaTimer(); // إزالة مؤقت البيتزا
            stopEraser();

            // ضمان أخير: gscore = score
            keepGscoreAtScore();
            try {
                if (typeof window.updateGscoreProgressBar === 'function') {
                    window.updateGscoreProgressBar();
                }
            } catch (e) {}

            return this;
        },
        isInvincible() { return isActive === true; },
        isActive() { return isActive === true; },
        setEraseLine(y) {
            if (typeof y === 'number' && y >= 0 && y <= 680) ERASE_LINE_Y = y;
            return this;
        },
        setDuration(seconds) {
            if (typeof seconds === 'number' && seconds > 0) SHIELD_DURATION_SEC = seconds;
            return this;
        }
    };

    // ====== اعتراض resetGscore ======
    function autoPatchResetGscore() {
        const timer = setInterval(() => {
            if (typeof window.resetGscore === 'function' && !window.__mascot_resetPatched) {
                const originalReset = window.resetGscore;
                originalResetGscore = originalReset;

                window.resetGscore = function () {
                    const wasFull = isProgressBarFull();
                    const result = originalReset.apply(this, arguments);
                    const nowEmpty = !isProgressBarFull();
                    if (wasFull && nowEmpty) {
                        MascotShield.activate();
                    }
                    return result;
                };
                window.__mascot_resetPatched = true;
                clearInterval(timer);
            }
        }, 200);
        setTimeout(() => clearInterval(timer), 10000);
    }

    function bindResetButton() {
        const btn = document.getElementById('reset-gscore-btn');
        if (btn && !btn.__mascotBound) btn.__mascotBound = true;
    }

    // ====== تشغيل ======
    function init() {
        injectAuraStyles();
        bindResetButton();
        autoPatchResetGscore();

        const MascotShieldConstructor = function MascotShield() {
            return MascotShield;
        };
        Object.assign(MascotShieldConstructor, MascotShield);
        MascotShieldConstructor.prototype = MascotShield;

        window.MascotShield = MascotShieldConstructor;
        window.mascotShield = MascotShield;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
