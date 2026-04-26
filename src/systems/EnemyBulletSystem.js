import { Entity } from '../entities/Entity.js';

class EnemyBullet extends Entity {
    constructor() {
        super(0, 0, 8, 8, '#ff5555'); // Crveni/Roze metak
        this.active = false;
        this.speed = 250;
        this.vx = 0; // Velocity X
        this.vy = 0; // Velocity Y
    }

    spawn(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.active = true;
    }

    update(dt, h) {
        if (!this.active) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.y > h || this.x < 0 || this.x > window.innerWidth) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ff0055';
        ctx.fillStyle = this.color;
        // Crtamo kružni metak za bosa
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

export class EnemyBulletSystem {
    constructor(game) {
        this.game = game;
        this.pool = [];
        // Bazen od 100 metaka za bosa (trebaće mu za "Bullet Hell")
        for(let i=0; i<100; i++) this.pool.push(new EnemyBullet());
    }

    fire(x, y, targetX, targetY) {
        const bullet = this.pool.find(b => !b.active);
        if (bullet) {
            // Matematika za pucanje ka igraču (vektori)
            const angle = Math.atan2(targetY - y, targetX - x);
            const speed = 250;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            bullet.spawn(x, y, vx, vy);
        }
    }

    // Pattern: Pucanje u krug (za bosa)
    fireRadial(x, y) {
        for (let i = 0; i < 8; i++) {
            const bullet = this.pool.find(b => !b.active);
            if (bullet) {
                const angle = (Math.PI * 2 / 8) * i;
                const speed = 200;
                bullet.spawn(x, y, Math.cos(angle)*speed, Math.sin(angle)*speed);
            }
        }
    }

    update(dt) {
        this.pool.forEach(b => b.update(dt, this.game.engine.canvas.height));
    }

    draw(ctx) {
        this.pool.forEach(b => b.draw(ctx));
    }
}