export class LevelSystem {
    constructor(game) {
        this.game = game;
        
        this.levels = [
            { id: 1, title: "SECTOR 1", duration: 60, spawnRate: 1.5, enemyTypes: ['BASIC'], bossTier: 1, bgColor: '#ffffff', bgSpeed: 1.0, seqLen: 3 },
            { id: 2, title: "SECTOR 2", duration: 60, spawnRate: 1.1, enemyTypes: ['BASIC', 'WAVER'], bossTier: 2, bgColor: '#aaaaaa', bgSpeed: 3.0, seqLen: 4 },
            { id: 3, title: "SECTOR 3", duration: 60, spawnRate: 0.8, enemyTypes: ['BASIC', 'WAVER', 'SHOOTER'], bossTier: 3, bgColor: '#88ccff', bgSpeed: 1.5, seqLen: 5 },
            { id: 4, title: "FINAL SECTOR", duration: 60, spawnRate: 0.5, enemyTypes: ['SHOOTER'], bossTier: 4, bgColor: '#ff5555', bgSpeed: 0.5, seqLen: 6 }
        ];
        
        this.currentLevelIndex = 0;
        this.levelTimer = 0;
        this.state = 'IDLE';
        this.announceTimer = 0;
        this.warpTimer = 0;

        this.currentSequence = ""; 
        this.isMemoryInputActive = false;
        
        this.freezeTimer = 0; 
        this.triggers = [20, 40]; 
        this.triggerIndex = 0;
    }

    isMemoryPaused() {
        return this.state === 'PREVIEW' || this.state === 'MEMORY_INPUT';
    }

    start() {
        this.startLevel(0);
    }

    generateSequence(length) {
        const chars = "ABCX";
        let res = "";
        for (let i = 0; i < length; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return res;
    }

    startLevel(index) {
        this.currentLevelIndex = index;
        const level = this.levels[index];

        this.triggerIndex = 0;
        this.isMemoryInputActive = false;
        this.levelTimer = 0;

        if (this.game.starfield) this.game.starfield.setAtmosphere(level.bgColor, level.bgSpeed);
        if (this.game.background) this.game.background.setLevel(level.id);

        // Odmah kreiramo prvi kod i pauziramo igru na 3 sekunde da ga igrač vidi
        this.currentSequence = this.generateSequence(level.seqLen);
        this.showPreviewScreen(3.0);
    }

    showPreviewScreen(duration) {
        this.state = 'PREVIEW';
        this.announceTimer = duration; 
        this.game.shake(5); 

        const previewScreen = document.getElementById('memory-preview-screen');
        const bigSeqDisplay = document.getElementById('big-memory-sequence');
        
        if (previewScreen && bigSeqDisplay) {
            bigSeqDisplay.innerText = this.currentSequence.split('').join(' ');
            previewScreen.style.display = 'flex';
        }
    }

    update(dt) {
        const currentLevel = this.levels[this.currentLevelIndex];

        // 1. Gledanje koda (3 sekunde)
        if (this.state === 'PREVIEW') {
            this.announceTimer -= dt;
            if (this.announceTimer <= 0) {
                const previewScreen = document.getElementById('memory-preview-screen');
                if (previewScreen) previewScreen.style.display = 'none';

                // Ako smo tek na početku nivoa (tajmer je manji od 0.1), idemo na ANNOUNCEMENT
                if (this.levelTimer < 0.1) {
                    const screen = document.getElementById('level-screen');
                    const title = document.getElementById('level-title');
                    const subtitle = document.getElementById('level-subtitle');

                    if (screen && title && subtitle) {
                        title.innerText = currentLevel.title;
                        subtitle.innerText = "GET READY";
                        screen.style.display = 'flex';
                    }
                    this.state = 'ANNOUNCEMENT';
                    this.announceTimer = 2.0; 
                } else {
                    // Ako je kod bio u sredini nivoa, samo nastavi igru
                    this.state = 'PLAYING';
                }
            }
            return; // Dok teče preview, igra stoji!
        }

        // Najava Sektora (samo na početku nivoa)
        if (this.state === 'ANNOUNCEMENT') {
            this.announceTimer -= dt;
            if (this.announceTimer <= 0) {
                const screen = document.getElementById('level-screen');
                if (screen) screen.style.display = 'none';
                this.state = 'PLAYING';
            }
            return;
        }

        // 2. Kucanje Koda (5 sekundi max)
        if (this.state === 'MEMORY_INPUT') {
            this.freezeTimer -= dt;
            
            // Ažuriranje HTML tajmera koji se nalazi na samoj kartici
            const timerDisplay = document.getElementById('freeze-timer-display');
            if (timerDisplay) {
                timerDisplay.innerText = Math.max(0, Math.ceil(this.freezeTimer));
            }

            if (this.freezeTimer <= 0) {
                this.closeMemoryInput(false);
            }
            return; // Dok se kuca kod, igra stoji!
        }

        // 3. Igranje
        if (this.state === 'PLAYING') {
            this.levelTimer += dt;

            if (this.triggerIndex < this.triggers.length) {
                const nextTriggerTime = this.triggers[this.triggerIndex];
                if (this.levelTimer >= nextTriggerTime) {
                    this.triggerMemoryLock();
                    this.triggerIndex++;
                }
            }

            if (this.levelTimer >= currentLevel.duration) {
                this.state = 'BOSS_FIGHT';
                this.game.enemies.pool.forEach(e => { e.active = false; });
                this.game.boss.spawn(currentLevel.bossTier);
                
                const overlay = document.getElementById('memory-input-overlay');
                if (overlay) overlay.style.display = 'none';
            }
        }

        if (this.state === 'BOSS_FIGHT') {
            if (!this.game.boss.active && this.game.bossDefeated) {
                this.game.bossDefeated = false;
                this.triggerWarpSequence();
            }
        }

        if (this.state === 'WARPING') {
            this.warpTimer -= dt;
            if (this.warpTimer <= 1.0) {
                this.game.setFadeOverlay(1.0 - this.warpTimer);
            }
            if (this.warpTimer <= 0) {
                this.state = 'IDLE';
                this.game.starfield.setWarp(false);
                this.game.background.setWarp(false);
                this.nextLevel();
                this.game.startFadeIn();
            }
        }
    }

    triggerMemoryLock() {
        this.state = 'MEMORY_INPUT'; 
        this.isMemoryInputActive = true;
        this.freezeTimer = 5.0; // 5 sekundi stresa
        this.game.shake(15);

        const overlay = document.getElementById('memory-input-overlay');
        const display = document.getElementById('input-display');
        let timerDisplay = document.getElementById('freeze-timer-display');
        
        // --- AUTO-HEALING MEHANIZAM ---
        // Ako pregledač zabaguje i ne vidi tajmer iz index.html, JS će ga fizički napraviti!
        if (!timerDisplay && overlay) {
            const neonBox = overlay.querySelector('.neon-box');
            if (neonBox) {
                const cont = document.createElement('div');
                cont.id = 'freeze-timer-cont';
                cont.style.color = '#ff0055';
                cont.style.fontSize = '24px';
                cont.style.margin = '10px 0';
                cont.innerHTML = 'PREOSTALO VREME: <span id="freeze-timer-display">5</span>s';
                
                // Ubacujemo ga iznad tastature
                const kb = document.getElementById('virtual-keyboard');
                if (kb) neonBox.insertBefore(cont, kb);
                else neonBox.appendChild(cont);
                
                // Ponovo pronalazimo element
                timerDisplay = document.getElementById('freeze-timer-display');
            }
        }

        if (overlay && display) {
            overlay.style.display = 'block';
            display.innerText = "_ ".repeat(this.currentSequence.length);
            if (timerDisplay) timerDisplay.innerText = "5"; // Inicijalno zakucaj na 5 sekundi
        } else {
            console.error("Greška: Osnovni kontejneri fale u UI-u!");
        }
    }

    closeMemoryInput(isSuccess) {
        const overlay = document.getElementById('memory-input-overlay');
        if (overlay) overlay.style.display = 'none';
        
        this.isMemoryInputActive = false;
        
        if (this.game.input) {
            this.game.input.inputBuffer = ""; // Čistimo bafer
        }

        if (!isSuccess) {
            if (this.game.analytics) {
                this.game.analytics.recordMemoryAttempt(false);
                if (typeof this.game.analytics.recordTimePressureResilience === 'function') {
                    this.game.analytics.recordTimePressureResilience(0);
                }
            }
            this.game.shake(20);
        }

        // AKO IMA JOŠ TESTOVA -> GENERIŠI NOVI KOD I PRIKAŽI GA 3 SEKUNDE
        if (this.triggerIndex < this.triggers.length) {
            const currentLevel = this.levels[this.currentLevelIndex];
            this.currentSequence = this.generateSequence(currentLevel.seqLen);
            this.showPreviewScreen(3.0);
        } else {
            // NEMA VIŠE TESTOVA -> NASTAVI IGRU DO BOSA
            this.state = 'PLAYING';
        }
    }

    triggerWarpSequence() {
        if (this.currentLevelIndex >= this.levels.length - 1) {
            this.game.triggerVictory();
            return;
        }
        this.state = 'WARPING';
        this.warpTimer = 3.0;
        this.game.starfield.setWarp(true);
        this.game.background.setWarp(true);
    }

    nextLevel() {
        if (this.currentLevelIndex < this.levels.length - 1) {
            this.startLevel(this.currentLevelIndex + 1);
        } else {
            this.game.triggerVictory();
        }
    }

    getCurrentConfig() {
        if (this.state !== 'PLAYING') return null;
        return this.levels[this.currentLevelIndex];
    }
}