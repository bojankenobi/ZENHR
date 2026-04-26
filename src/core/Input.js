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
            
            // 1. Provera za Radnu Memoriju (A, B, C, X)
            this.handleMemoryInput(e.code);
            
            // 2. Provera za brojeve (0-9)
            if (e.key >= '0' && e.key <= '9') {
                this.handleNumberInput(parseInt(e.key));
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
            if (e.code === 'Space') this.isFiring = false;
        });

        this.setupTouchControls();

        // Povezivanje virtuelne tastature za mobilne / touch uređaje
        document.querySelectorAll('.mem-btn').forEach(btn => {
            // Koristimo 'pointerdown' jer pokriva i mis i touch, pre nego sto element izgubi fokus
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault(); // Sprečava zumiranje na dupli tap
                const keyCode = btn.getAttribute('data-key');
                this.handleMemoryInput(keyCode);
            });
        });
    }

    handleMemoryInput(keyCode) {
        // PROVERA: Da li je test uopšte aktivan?
        if (!this.game.levels || !this.game.levels.isMemoryInputActive) return;

        const levelSys = this.game.levels;
        let char = "";

        // Mapiranje tastera
        if (keyCode === 'KeyA') char = "A";
        else if (keyCode === 'KeyB') char = "B";
        else if (keyCode === 'KeyC') char = "C";
        else if (keyCode === 'KeyX') char = "X";

        if (char !== "") {
            this.inputBuffer += char;
            console.log(`%c [INPUT]: Dodato ${char} | Trenutni buffer: ${this.inputBuffer}`, "color: #00ffff");

            // Ažuriranje vizuelnog prikaza na ekranu
            const display = document.getElementById('input-display');
            if (display) {
                // Prikazuje ukucana slova + donje crte za preostala
                const remaining = levelSys.currentSequence.length - this.inputBuffer.length;
                display.innerText = this.inputBuffer + "_ ".repeat(Math.max(0, remaining));
            }

            // Provera da li je sekvenca kompletirana
            if (this.inputBuffer.length === levelSys.currentSequence.length) {
                const isCorrect = this.inputBuffer === levelSys.currentSequence;
                
                // Slanje rezultata u analitiku
                if (this.game.analytics) {
                    this.game.analytics.recordMemoryAttempt(isCorrect);
                }

                // Feedback i zatvaranje prozora
                setTimeout(() => {
                    const overlay = document.getElementById('memory-input-overlay');
                    if (overlay) overlay.style.display = 'none';
                    
                    this.inputBuffer = "";
                    levelSys.isMemoryInputActive = false;
                }, 400);

                if (isCorrect) {
                    console.log("%c [SUCCESS]: Šifra ispravna!", "color: #00ff00; font-weight: bold;");
                    if (this.game.sound) this.game.sound.playBossHit();
                } else {
                    console.log("%c [FAIL]: Šifra pogrešna!", "color: #ff0000; font-weight: bold;");
                    this.game.shake(20);
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

        // Kretanje tastaturom (radi nezavisno od unosa šifre)
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