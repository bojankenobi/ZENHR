import { Enemy } from '../entities/Enemy.js';

export class EnemySystem {
    constructor(game) {
        this.game = game;
        this.pool = [];
        this.poolSize = 30;
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Enemy(this.game));
        }
        this.spawnTimer = 0;
    }

    spawn(allowedTypes) {
        const enemy = this.pool.find(e => !e.active);
        if (enemy) {
            const width = this.game.engine.canvas.width;
            const x = Math.random() * (width - 40);
            
            // Šansa od 15% da se pojavi civil umesto neprijatelja
            let type;
            if (Math.random() < 0.15) {
                type = 'CIVILIAN';
            } else {
                type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
            }
            
            enemy.spawn(x, -40, type);
            
            // Beležimo spawn za reakciju samo ako je neprijatelj, ne civil
            if (type !== 'CIVILIAN') {
                this.game.analytics.recordEnemySpawn();
            }
        }
    }

    update(dt) {
        const config = this.game.levels.getCurrentConfig();
        if (!config) {
            this.pool.forEach(enemy => enemy.update(dt, this.game.engine.canvas.height));
            return;
        }

        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawn(config.enemyTypes);
            this.spawnTimer = config.spawnRate;
        }

        this.pool.forEach(enemy => enemy.update(dt, this.game.engine.canvas.height));
    }

    draw(ctx) {
        this.pool.forEach(enemy => enemy.draw(ctx));
    }
}