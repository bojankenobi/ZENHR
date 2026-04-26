export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = {};
        this.axis = { x: 0, y: 0 };
        this.touchAxis = { x: 0, y: 0 };
        this.isFiring = false;
        this.inputBuffer = "";
        this.touchId = null;

        // --- EVENT LISTENERS ---
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (e.code === 'Space') this.isFiring = true;
            
            // Provera za Radnu Memoriju
            this.handleMemoryInput(e.code);
            
            // Provera za bonuse (brojevi)
            if (e.key >= '0' && e.key <= '9') {
                this.handleNumberInput(parseInt(e.key));
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isFiring = false;
        });

        this.setupTouchControls();

        // Podrška za kliktanje na virtuelnoj tastaturi
        document.querySelectorAll('.mem-btn').forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault(); 
                const keyCode = btn.getAttribute('data-key');
                this.handleMemoryInput(keyCode);
            });
        });
    }

    handleMemoryInput(keyCode) {
        if (!this.game.levels || !this.game.levels.isMemoryInputActive) return;

        const levelSys = this.game.levels;
        let char = "";
        
        if (keyCode === 'KeyA') char = "A";
        else if (keyCode === 'KeyB') char = "B";
        else if (keyCode === 'KeyC') char = "C";
        else if (keyCode === 'KeyX') char = "X";

        if (char !== "") {
            this.inputBuffer += char;
            
            // Ažuriranje prikaza ukucanih slova na kartici
            const display = document.getElementById('input-display');
            if (display) {
                const remaining = levelSys.currentSequence.length - this.inputBuffer.length;
                display.innerText = this.inputBuffer + "_ ".repeat(Math.max(0, remaining));
            }

            // Provera kada završi unos
            if (this.inputBuffer.length === levelSys.currentSequence.length) {
                const isCorrect = this.inputBuffer === levelSys.currentSequence;
                
                if (this.game.analytics) {
                    this.game.analytics.recordMemoryAttempt(isCorrect);
                }

                // Odmah pošalji signal u LevelSystem
                if (isCorrect) {
                    const remaining = this.game.levels.freezeTimer;
                    if (this.game.analytics.recordTimePressureResilience) {
                        this.game.analytics.recordTimePressureResilience(remaining);
                    }
                    this.game.levels.closeMemoryInput(true);
                } else {
                    this.game.levels.closeMemoryInput(false);
                }
            }
        }
    }

    handleNumberInput(num) {
        if (!this.game.bonuses) return;
        const activeBonus = this.game.bonuses.pool.find(b => b.active && b.isTouched);
        
        if (activeBonus) {
            const solveTime = (Date.now() - activeBonus.touchTime) / 1000;
            if (num === activeBonus.correctAnswer) {
                this.applyBonusEffect(activeBonus);
                if (this.game.analytics && this.game.analytics.recordMathSuccess) {
                    this.game.analytics.recordMathSuccess(solveTime);
                }
            } else {
                this.game.shake(10);
            }
            activeBonus.active = false;
            activeBonus.isTouched = false;
        }
    }

    applyBonusEffect(bonus) {
        if (this.game.sound) this.game.sound.playBossHit();
        if (bonus.type === 'LIFE') {
            this.game.player.lives++;
            this.game.player.updateLivesUI();
        } else if (bonus.type === 'BOMB') {
            this.game.enemies.pool.forEach(e => e.active = false);
            this.game.enemyBullets.pool.forEach(b => b.active = false);
        } else if (bonus.type === 'SPREAD') {
            this.game.player.upgradeWeapon();
        }
    }

    update() {
        this.axis.x = 0;
        this.axis.y = 0;

        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.axis.x = -1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.axis.x = 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.axis.y = -1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.axis.y = 1;

        if (this.touchId !== null) {
            this.axis.x = this.touchAxis.x;
            this.axis.y = this.touchAxis.y;
        }

        if (this.axis.x !== 0 && this.axis.y !== 0) {
            const length = Math.sqrt(this.axis.x**2 + this.axis.y**2);
            this.axis.x /= length;
            this.axis.y /= length;
        }
    }

    setupTouchControls() {
        const zone = document.getElementById('joystick-zone');
        const stick = document.getElementById('joystick-stick');
        const fireBtn = document.getElementById('fire-btn');
        if (!zone || !stick || !fireBtn) return;
        
        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchId = e.changedTouches[0].identifier;
            this.handleJoystickMove(e.changedTouches[0], zone, stick, 35);
        }, { passive: false });
        
        zone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.touchId) {
                    this.handleJoystickMove(e.changedTouches[i], zone, stick, 35);
                }
            }
        }, { passive: false });
        
        const stopTouch = (e) => {
            e.preventDefault();
            this.touchId = null;
            this.touchAxis = { x: 0, y: 0 };
            stick.style.transform = `translate(-50%, -50%)`;
        };
        zone.addEventListener('touchend', stopTouch);
        
        fireBtn.addEventListener('touchstart', (e) => { 
            e.preventDefault(); 
            this.isFiring = true; 
        }, { passive: false });
        
        fireBtn.addEventListener('touchend', (e) => { 
            e.preventDefault(); 
            this.isFiring = false; 
        });
    }

    handleJoystickMove(touch, zone, stick, maxRadius) {
        const rect = zone.getBoundingClientRect();
        let dx = touch.clientX - (rect.left + rect.width / 2);
        let dy = touch.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > maxRadius) { dx *= maxRadius / dist; dy *= maxRadius / dist; }
        stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        this.touchAxis.x = dx / maxRadius;
        this.touchAxis.y = dy / maxRadius;
    }

    getAxis() { return this.axis; }
    getFire() { return this.isFiring; }
}