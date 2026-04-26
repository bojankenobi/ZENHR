import { Entity } from './Entity.js';

export class Boss extends Entity {
    constructor(game) {
        // Početne dimenzije (biće pregažene u spawn)
        super(0, -200, 200, 100, '#ff0000');
        this.game = game;
        this.active = false;
        
        // --- STATE MACHINE ---
        this.state = 'OFF'; // OFF, ENTERING, FIGHTING
        
        // --- STATISTIKA ---
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 100;     // Brzina kretanja levo-desno
        this.shootRate = 1.0; // Koliko često puca
        this.shootTimer = 0;
        this.tier = 1;

        // --- VIZUELNO ---
        this.hitFlashTimer = 0; // Za blicanje kad ga pogodimo
        this.moveDirection = 1; // 1 = Desno, -1 = Levo
    }

    spawn(tier = 4) {
        this.active = true;
        this.tier = tier;
        
        // 1. POČETNA POZICIJA (IZNAD EKRANA)
        this.width = 200;
        this.height = 120;
        this.x = this.game.engine.canvas.width / 2 - this.width / 2;
        this.y = -250; // Skroz gore van ekrana
        
        this.state = 'ENTERING'; // <-- BITNO: Prvo ulazi na scenu

        // 2. KONFIGURACIJA PO TIER-u
        if (tier === 1) { // Laki
            this.maxHealth = 150;
            this.shootRate = 1.5;
            this.speed = 80;
            this.color = '#0088ff';
        } else if (tier === 2) { // Srednji
            this.maxHealth = 300;
            this.shootRate = 1.0;
            this.speed = 100;
            this.color = '#00ff00';
        } else if (tier === 3) { // Teški
            this.maxHealth = 500;
            this.shootRate = 0.7;
            this.speed = 120;
            this.color = '#ffaa00';
        } else { // MOTHERSHIP
            this.maxHealth = 1000;
            this.shootRate = 0.4;
            this.speed = 50; // Sporo se kreće ali uništi sve
            this.color = '#ff0000';
            this.width = 300; // Veći
            this.x = this.game.engine.canvas.width / 2 - this.width / 2;
        }

        this.health = this.maxHealth;
        this.updateHealthBar();
        this.shootTimer = 2.0; // Mala pauza pre prvog pucnja

        // UI Update
        const bossName = document.querySelector('.boss-name');
        if (tier === 4) bossName.innerText = "⚠️ MOTHERSHIP ⚠️";
        else bossName.innerText = `⚠️ SECTOR BOSS (CLASS ${tier}) ⚠️`;
        
        document.getElementById('boss-hud').style.display = 'block';
    }

    update(dt) {
        if (!this.active) return;

        // Blicanje (Visual feedback)
        if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

        // --- FAZA 1: ULAZAK NA EKRAN ---
        if (this.state === 'ENTERING') {
            // Spuštaj se dole dok ne dođeš do Y = 50
            this.y += 100 * dt; 
            if (this.y >= 50) {
                this.y = 50;
                this.state = 'FIGHTING'; // Pređi u borbeni režim
            }
            return; // Dok ulazi, ne puca i ne ide levo-desno
        }

        // --- FAZA 2: BORBA ---
        if (this.state === 'FIGHTING') {
            const canvasWidth = this.game.engine.canvas.width;

            // 1. Kretanje Levo-Desno
            this.x += this.speed * this.moveDirection * dt;

            // Provera ivica (Ping-Pong kretanje)
            if (this.x <= 0) {
                this.x = 0;
                this.moveDirection = 1; // Idi desno
            } else if (this.x + this.width >= canvasWidth) {
                this.x = canvasWidth - this.width;
                this.moveDirection = -1; // Idi levo
            }

            // 2. Pucanje
            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                this.fire();
                this.shootTimer = this.shootRate;
            }
        }
    }

    fire() {
        const centerX = this.x + this.width / 2;
        const bottomY = this.y + this.height - 20;

        // Različiti napadi zavisno od Tier-a
        if (this.tier === 1) {
            // Običan metak ka igraču
            this.game.enemyBullets.fire(centerX, bottomY, this.game.player.x, this.game.player.y);
        } 
        else if (this.tier === 2 || this.tier === 3) {
            // Dva metka (sa levog i desnog topa)
            this.game.enemyBullets.fire(this.x + 20, bottomY, this.game.player.x, this.game.player.y);
            this.game.enemyBullets.fire(this.x + this.width - 20, bottomY, this.game.player.x, this.game.player.y);
        } 
        else {
            // MOTHERSHIP: 3 Metka (Lepeza) + Brza paljba
            this.game.enemyBullets.fire(centerX, bottomY, this.game.player.x, this.game.player.y);
            this.game.enemyBullets.fire(this.x + 40, bottomY, this.game.player.x - 100, this.game.player.y + 100);
            this.game.enemyBullets.fire(this.x + this.width - 40, bottomY, this.game.player.x + 100, this.game.player.y + 100);
        }
        
        // Zvuk pucnja (koristimo shoot zvuk malo dublje)
        // Ovde bi idealno išao poseban zvuk, ali za sad je ok.
    }

    takeDamage(amount) {
        if (this.state !== 'FIGHTING') return; // Ne možeš ga povrediti dok ulazi

        this.health -= amount;
        this.hitFlashTimer = 0.1; // Blicni belo
        this.updateHealthBar();

        if (this.health <= 0) {
            this.die();
        }
    }

    updateHealthBar() {
        const fill = document.getElementById('hp-bar-fill');
        const percent = Math.max(0, (this.health / this.maxHealth) * 100);
        fill.style.width = percent + '%';
    }

    die() {
        this.active = false;
        this.game.bossDefeated = true; // Javljamo LevelSystemu
        document.getElementById('boss-hud').style.display = 'none';

        // Velika eksplozija
        this.game.sound.playExplosion();
        this.game.shake(30);
        
        // Mnogo čestica
        for(let i=0; i<20; i++) {
            setTimeout(() => {
                const rx = this.x + Math.random() * this.width;
                const ry = this.y + Math.random() * this.height;
                this.game.particles.explode(rx, ry, '#ffaa00', 30);
            }, i * 100);
        }
    }

    // --- CRTANJE (Isto kao što smo napravili malopre, sa Neon stilom) ---
    draw(ctx) {
        if (!this.active) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();

        // 1. EFEKAT POGOTKA (Beli blic)
        if (this.hitFlashTimer > 0) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#ffffff';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.restore();
            return; 
        }

        // 2. GLAVNI TRUP
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color; // Koristimo boju Tier-a
        ctx.fillStyle = '#110000'; // Tamna baza
        
        // Trup
        ctx.beginPath();
        ctx.moveTo(this.x, this.y); 
        ctx.lineTo(this.x + this.width, this.y); 
        ctx.lineTo(this.x + this.width * 0.8, this.y + this.height); 
        ctx.lineTo(this.x + this.width * 0.2, this.y + this.height); 
        ctx.closePath();
        ctx.fill();

        // 3. DETALJI (Linije)
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 20, centerY);
        ctx.lineTo(this.x + this.width - 20, centerY);
        ctx.stroke();

        // 4. JEZGRO
        const chargeRatio = Math.max(0, this.shootTimer / 1.5); 
        // Boja jezgra
        ctx.shadowBlur = 30 + (1-chargeRatio) * 20; 
        ctx.fillStyle = `rgba(255, 255, 255, ${1-chargeRatio})`; // Pulsira belo pred pucanj

        ctx.beginPath();
        ctx.arc(centerX, centerY + 10, 20, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}