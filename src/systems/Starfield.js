class Star {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.reset(true); // true = nasumična pozicija pri startu igre
    }

    reset(randomY = false) {
        this.x = Math.random() * this.screenWidth;
        
        // Ako je randomY true, stavi je bilo gde na ekranu (inicijalno punjenje).
        // Ako je false, stavi je iznad ekrana (respawn).
        this.y = randomY ? Math.random() * this.screenHeight : -10;

        // --- PARALLAX LOGIKA ---
        // Definišemo "sloj" dubine (1, 2 ili 3)
        // 1 = Daleko, 3 = Blizu
        const layer = Math.floor(Math.random() * 3) + 1;

        this.size = layer; // Veličina: 1px, 2px ili 3px
        this.speed = layer * 50; // Brzina: 50, 100 ili 150 px/s
        
        // Daleke zvezde su tamnije, bliske su svetlije
        this.alpha = 0.3 + (layer * 0.2); 
    }

    update(dt) {
        this.y += this.speed * dt;

        // Ako izađe sa dna ekrana, resetuj je na vrh
        if (this.y > this.screenHeight) {
            this.reset(false);
        }
    }

    draw(ctx) {
        // Crtamo kvadrat jer je brže od kruga (arc), a na 2px se ne vidi razlika
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

export class StarfieldSystem {
    constructor(game) {
        this.game = game;
        this.stars = [];
        this.count = 100;
        this.baseSpeed = 10; 
        this.speedMultiplier = 1; 
        this.color = '#ffffff'; 
        
        // --- WARP VARIJABLE ---
        this.isWarping = false;
        this.warpFactor = 1; // 1 = Normalno, >1 = Razvučeno

        for (let i = 0; i < this.count; i++) {
            this.stars.push({
                x: Math.random() * this.game.engine.canvas.width,
                y: Math.random() * this.game.engine.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 20 + 5
            });
        }
    }

    setAtmosphere(color, speedMult) {
        this.color = color;
        this.speedMultiplier = speedMult;
    }

    // Poziva se kad boss umre
    setWarp(active) {
        this.isWarping = active;
    }

    update(dt) {
        const height = this.game.engine.canvas.height;
        const width = this.game.engine.canvas.width;

        // Ako je Warp uključen, faktor raste do 50, inače pada na 1
        const targetWarp = this.isWarping ? 40 : 1;
        this.warpFactor += (targetWarp - this.warpFactor) * 2 * dt; // Glatka tranzicija

        this.stars.forEach(star => {
            // Brzina se drastično povećava tokom warpa
            let currentSpeed = star.speed * this.speedMultiplier * this.warpFactor;
            
            star.y += currentSpeed * dt;

            if (star.y > height) {
                star.y = 0;
                star.x = Math.random() * width;
            }
        });
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color; // Za linije
        
        this.stars.forEach(star => {
            ctx.globalAlpha = Math.random() * 0.5 + 0.5;

            if (this.warpFactor > 2) {
                // --- WARP MODE: CRTAMO LINIJE ---
                ctx.lineWidth = star.size;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                // Dužina linije zavisi od brzine warpa
                ctx.lineTo(star.x, star.y - (this.warpFactor * 2)); 
                ctx.stroke();
            } else {
                // --- NORMAL MODE: CRTAMO TAČKE ---
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        });
        ctx.globalAlpha = 1.0;
    }
}