class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0; // Brzina po X
        this.vy = 0; // Brzina po Y
        this.life = 0; // Koliko dugo živi (od 1.0 do 0.0)
        this.decay = 0; // Koliko brzo umire
        this.size = 0;
        this.color = '#fff';
        this.active = false;
    }

    spawn(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.active = true;
        this.life = 1.0;
        
        // Random veličina
        this.size = Math.random() * 3 + 2; 
        
        // Random brzina u svim pravcima (eksplozija)
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 150 + 50; // Između 50 i 200 px/s
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        // Random brzina nestajanja
        this.decay = Math.random() * 1.5 + 0.5;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= this.decay * dt;

        // Ako je život istekao, ugasi česticu
        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.globalAlpha = this.life; // Transparentnost zavisi od života
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor(game) {
        this.pool = [];
        this.poolSize = 200; // 200 čestica u bazenu

        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Particle());
        }
    }

    // Glavna metoda: EKSPLOZIJA!
    explode(x, y, color, count = 10) {
        let spawned = 0;
        for (let particle of this.pool) {
            if (!particle.active) {
                particle.spawn(x, y, color);
                spawned++;
                if (spawned >= count) break;
            }
        }
    }

    update(dt) {
        this.pool.forEach(p => p.update(dt));
    }

    draw(ctx) {
        this.pool.forEach(p => p.draw(ctx));
    }
}