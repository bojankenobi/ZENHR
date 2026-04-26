export class LevelSystem {
    constructor(game) {
        this.game = game;
        this.levels = [
            { id: 1, title: "SECTOR 1", duration: 25, spawnRate: 1.5, enemyTypes: ['BASIC'], bossTier: 1, bgColor: '#ffffff', bgSpeed: 1.0 },
            { id: 2, title: "SECTOR 2", duration: 35, spawnRate: 1.1, enemyTypes: ['BASIC', 'WAVER'], bossTier: 2, bgColor: '#aaaaaa', bgSpeed: 3.0 },
            { id: 3, title: "SECTOR 3", duration: 45, spawnRate: 0.8, enemyTypes: ['BASIC', 'WAVER', 'SHOOTER'], bossTier: 3, bgColor: '#88ccff', bgSpeed: 1.5 },
            { id: 4, title: "FINAL SECTOR", duration: 10, spawnRate: 0.5, enemyTypes: ['SHOOTER'], bossTier: 4, bgColor: '#ff5555', bgSpeed: 0.5 }
        ];

        this.currentLevelIndex = 0;
        this.levelTimer = 0;
        this.state = 'IDLE';
        this.announceTimer = 0;
        this.warpTimer = 0;

        // --- Radna memorija (HR Test) ---
        this.currentSequence = ""; 
        this.isMemoryInputActive = false;
        this.promptTriggered = false;
    }

    // Ovu metodu zoveš u Game.js:84
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
        
        // Generišemo šifru na osnovu težine nivoa
        this.currentSequence = this.generateSequence(3 + index);
        this.isMemoryInputActive = false;
        this.promptTriggered = false;

        // Postavljanje atmosfere
        if (this.game.starfield) {
            this.game.starfield.setAtmosphere(level.bgColor, level.bgSpeed);
        }
        if (this.game.background) {
            this.game.background.setLevel(level.id);
        }

        // Prikazivanje VELIKE šifre pre nivoa
        const previewScreen = document.getElementById('memory-preview-screen');
        const bigSeqDisplay = document.getElementById('big-memory-sequence');
        
        if (previewScreen && bigSeqDisplay) {
            // Razmičemo slova za bolju čitljivost (npr. "A B X")
            bigSeqDisplay.innerText = this.currentSequence.split('').join(' ');
            previewScreen.style.display = 'flex';
        }

        // Sakrijemo regularan level ekran ako je slučajno ostao vidljiv
        const screen = document.getElementById('level-screen');
        if (screen) screen.style.display = 'none';
        
        // Postavljamo stanje na PREVIEW (gledanje šifre)
        this.state = 'MEMORY_PREVIEW';
        this.announceTimer = 3.0; // Prikaz traje tačno 3 sekunde
        this.levelTimer = 0;
    }

    update(dt) {
        const currentLevel = this.levels[this.currentLevelIndex];

        // NOVO STANJE: Gledanje velike šifre (3 sekunde)
        if (this.state === 'MEMORY_PREVIEW') {
            this.announceTimer -= dt;
            if (this.announceTimer <= 0) {
                // Sklanjamo veliki prikaz
                const previewScreen = document.getElementById('memory-preview-screen');
                if (previewScreen) previewScreen.style.display = 'none';
                
                // Prelazimo na najavu nivoa
                const screen = document.getElementById('level-screen');
                const title = document.getElementById('level-title');
                const subtitle = document.getElementById('level-subtitle');
                
                if (screen && title && subtitle) {
                    title.innerText = currentLevel.title;
                    subtitle.innerText = "GET READY"; // Bez šifre, samo priprema za borbu
                    screen.style.display = 'flex';
                }
                
                this.state = 'ANNOUNCEMENT';
                this.announceTimer = 2.0; // Najava sektora traje još 2 sekunde
            }
            return;
        }

        // STANJE: Najava Sektora
        if (this.state === 'ANNOUNCEMENT') {
            this.announceTimer -= dt;
            if (this.announceTimer <= 0) {
                const screen = document.getElementById('level-screen');
                if (screen) screen.style.display = 'none';
                this.state = 'PLAYING';
            }
            return;
        }

        // STANJE: Igra
        if (this.state === 'PLAYING') {
            this.levelTimer += dt;

            // --- AKTIVACIJA GRAFIČKOG INPUTA NA 50% NIVOA ---
            if (this.levelTimer >= currentLevel.duration / 2 && !this.promptTriggered) {
                this.isMemoryInputActive = true;
                this.promptTriggered = true;
                
                const overlay = document.getElementById('memory-input-overlay');
                const display = document.getElementById('input-display');
                
                if (overlay && display) {
                    overlay.style.display = 'block';
                    display.innerText = "_ ".repeat(this.currentSequence.length);
                }
                
                this.game.shake(15);
                console.log("%c [HR TEST]: LOCK SYSTEM ACTIVE!", "color: #ff00ff; font-weight: bold;");
            }

            if (this.levelTimer >= currentLevel.duration) {
                this.state = 'BOSS_FIGHT';
                this.game.enemies.pool.forEach(e => { e.active = false; });
                this.game.boss.spawn(currentLevel.bossTier);
                
                // Sigurnosno gašenje overlay-a ako igrač nije stigao da unese šifru
                const overlay = document.getElementById('memory-input-overlay');
                if (overlay) overlay.style.display = 'none';
            }
        }

        // STANJE: Boss
        if (this.state === 'BOSS_FIGHT') {
            if (!this.game.boss.active && this.game.bossDefeated) {
                this.game.bossDefeated = false;
                this.triggerWarpSequence();
            }
        }

        // STANJE: Warp (prelazak na sledeći nivo)
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