import { Bonus } from '../entities/Bonus.js';

export class BonusSystem {
    constructor(game) {
        this.game = game;
        this.pool = [];
        this.poolSize = 5; 

        // Inicijalizacija bazena objekata
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Bonus());
        }

        // Prvi bonus nakon 5 sekundi
        this.spawnTimer = 5; 
    }

    spawn() {
        // Pronalaženje neaktivnog bonusa
        const bonus = this.pool.find(b => !b.active);
        
        if (bonus) {
            const canvasWidth = this.game.engine.canvas.width;
            const x = Math.random() * (canvasWidth - 80) + 40; // Malo veći padding
            const y = -60; 

            // Određivanje tipa bonusa na osnovu verovatnoće
            const rand = Math.random();
            let type = 'SPREAD';

            if (rand < 0.20) {
                type = 'LIFE';   // Crveni - HP
            } else if (rand < 0.50) {
                type = 'BOMB';   // Žuti - Clear screen
            } else {
                type = 'SPREAD'; // Plavi - Weapon Upgrade
            }
            
            // Aktiviranje bonusa (unutar Bonus.js se generiše math zadatak)
            bonus.spawn(x, y, type);
            
            // Logovanje za HR analitiku (opciono)
            console.log(`%c [MATH CHALLENGE]: Kockica ${type} stvorena!`, "color: #ffaa00; font-weight: bold;");
        }
    }

    // Metoda za čišćenje ekrana (poziva se pri promeni nivoa ili Game Over-u)
    clearAll() {
        this.pool.forEach(bonus => {
            bonus.active = false;
            bonus.isTouched = false;
        });
    }

    update(dt) {
        // Dinamički spawn rate na osnovu nivoa
        // Što je veći nivo, bonusi mogu biti za nijansu učestaliji
        const levelMultiplier = this.game.levels ? this.game.levels.currentLevelIndex * 0.5 : 0;
        
        this.spawnTimer -= dt;
        
        if (this.spawnTimer <= 0) {
            this.spawn();
            // Reset tajmera na 10-18 sekundi (smanjuje se sa nivoima)
            this.spawnTimer = Math.max(8, (12 + Math.random() * 8) - levelMultiplier);
        }

        // Update samo aktivnih kockica
        this.pool.forEach(bonus => {
            if (bonus.active) {
                bonus.update(dt, this.game.engine.canvas.height);
            }
        });
    }

    draw(ctx) {
        this.pool.forEach(bonus => {
            if (bonus.active) {
                bonus.draw(ctx);
            }
        });
    }
}