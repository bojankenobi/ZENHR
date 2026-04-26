class BgObject {
    constructor(x, y, size, type, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type; // 'PLANET', 'COMET', 'ASTEROID'
        this.color = color;
        this.active = true;

        if (this.type === 'PLANET') {
            this.speedX = 0;
            this.speedY = Math.random() * 10 + 5; 
        } else if (this.type === 'ASTEROID') {
            // Asteroidi su brži od planeta, sporiji od kometa
            this.speedY = Math.random() * 50 + 50; 
            this.speedX = (Math.random() - 0.5) * 20;
            this.rotation = Math.random() * Math.PI;
            this.rotSpeed = (Math.random() - 0.5) * 2;
        } else {
            // Komete
            this.speedY = Math.random() * 100 + 150; 
            this.speedX = (Math.random() - 0.5) * 100; 
            this.angle = Math.atan2(this.speedY, this.speedX);
        }
    }

    update(dt, canvasHeight) {
        this.x += this.speedX * dt;
        this.y += this.speedY * dt;
        if (this.type === 'ASTEROID') this.rotation += this.rotSpeed * dt;

        if (this.y - this.size * 4 > canvasHeight || this.x < -200 || this.x > 800) {
            this.active = false;
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.type === 'PLANET') this.drawPlanet(ctx);
        else if (this.type === 'ASTEROID') this.drawAsteroid(ctx);
        else this.drawComet(ctx);
        ctx.restore();
    }

    drawAsteroid(ctx) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#555555'; // Siva boja
        ctx.shadowBlur = 0; // Kamen ne sija
        
        // Crtamo nepravilan oblik (kamen)
        ctx.beginPath();
        const r = this.size;
        ctx.moveTo(r, 0);
        ctx.lineTo(r * 0.5, r * 0.8);
        ctx.lineTo(-r * 0.6, r * 0.6);
        ctx.lineTo(-r, -r * 0.2);
        ctx.lineTo(-r * 0.4, -r * 0.9);
        ctx.lineTo(r * 0.6, -r * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Detalj (krater)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(r*0.3, r*0.2, r*0.3, 0, Math.PI*2);
        ctx.fill();
    }
    
    drawPlanet(ctx) {
        const gradient = ctx.createRadialGradient(
            this.x - this.size/3, this.y - this.size/3, this.size/10,
            this.x, this.y, this.size
        );
        gradient.addColorStop(0, '#ffffff'); 
        gradient.addColorStop(0.5, this.color); 
        gradient.addColorStop(1, '#000005');

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    drawComet(ctx) {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle - Math.PI / 2); 
        const tailGrad = ctx.createLinearGradient(0, 0, 0, -this.size * 3);
        tailGrad.addColorStop(0, this.color); 
        tailGrad.addColorStop(1, 'transparent'); 
        ctx.fillStyle = tailGrad;
        ctx.beginPath();
        ctx.moveTo(-this.size / 2, 0); 
        ctx.lineTo(0, -this.size * 4); 
        ctx.lineTo(this.size / 2, 0);  
        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath();
        ctx.arc(0, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class BackgroundSystem {
    constructor(game) {
        this.game = game;
        this.objects = [];
        this.spawnTimer = 5;
        this.currentLevelId = 1; // Pratimo nivo
        this.isWarping = false;  // Ako je warp, ne spawnujemo ništa
    }

    setLevel(id) {
        this.currentLevelId = id;
    }

    setWarp(active) {
        this.isWarping = active;
        if (active) {
            // Opciono: Ubrzaj postojeće objekte da "odlete"
            this.objects.forEach(o => o.speedY *= 5);
        }
    }

    update(dt) {
        this.spawnTimer -= dt;
        
        // SPAWN LOGIKA (Samo ako nije warp)
        if (this.spawnTimer <= 0 && !this.isWarping) {
            this.spawn();
            this.spawnTimer = Math.random() * 15 + 10; 
        }

        this.objects.forEach(obj => obj.update(dt, this.game.engine.canvas.height));
        this.objects = this.objects.filter(obj => obj.active);
    }

    spawn() {
        const w = this.game.engine.canvas.width;
        
        // --- LOGIKA PO NIVOIMA ---
        if (this.currentLevelId === 2) {
            // === NIVO 2: ASTEROID BELT ===
            const size = Math.random() * 20 + 10; // Smanjen i asteroid (pre bilo 30+20)
            const x = Math.random() * w;
            this.objects.push(new BgObject(x, -50, size, 'ASTEROID', '#444'));
        } 
        else {
            // === OSTALI NIVOI ===
            const rand = Math.random();
    
            // Smanjena šansa za planetu sa 0.3 na 0.1 (samo 10% šanse)
            if (rand < 0.1) {
                // PLANETA - Smanjena maksimalna veličina sa 80+40 na 40+20
                const size = Math.random() * 40 + 20; 
                const x = Math.random() * w;
                
                let color = '#ff4400';
                if (this.currentLevelId === 3) color = '#0088ff';
                else if (this.currentLevelId === 1) color = '#cc00cc';
                
                this.objects.push(new BgObject(x, -size*2, size, 'PLANET', color));
            } else {
                // KOMETA (Sada se pojavljuje u 90% slučajeva umesto krupnih tela)
                const size = Math.random() * 8 + 3; // Još sitnije komete
                const x = Math.random() * w;
                this.objects.push(new BgObject(x, -50, size, 'COMET', '#00ffff'));
            }
        }
    }

    draw(ctx) {
        this.objects.forEach(obj => obj.draw(ctx));
    }
}