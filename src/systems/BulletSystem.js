import { Bullet } from '../entities/Bullet.js';

export class BulletSystem {
    constructor(game) {
        this.game = game;
        this.pool = [];
        this.poolSize = 50; 

        // Inicijalizacija bazena (Object Pooling)
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Bullet());
        }
    }

    // Pronađi prvi slobodan metak i ispali ga
    fire(x, y) {
        const bullet = this.pool.find(b => !b.active);
        if (bullet) {
            bullet.spawn(x - bullet.width / 2, y);
            
            // ANALITIKA: Beležimo pucanj za HR metriku
            this.game.analytics.recordShot();
        }
    }

    // Multi-shot (3 metka)
    fireSpread(x, y) {
        let count = 0;
        const angles = [-0.2, 0, 0.2];
        
        this.pool.forEach(b => {
            if (!b.active && count < 3) {
                const offset = angles[count] * 100;
                b.spawn((x - b.width/2) + offset, y);
                
                // ANALITIKA: Svaki metak iz spread-a se računa u preciznost
                this.game.analytics.recordShot();
                count++;
            }
        });
    }

    update(dt) {
        this.pool.forEach(bullet => {
            bullet.update(dt, this.game.engine.canvas.height);
        });
    }

    draw(ctx) {
        this.pool.forEach(bullet => {
            bullet.draw(ctx);
        });
    }
}