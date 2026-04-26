import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(game) {
        const startX = game.engine.canvas.width / 2 - 20;
        const startY = game.engine.canvas.height - 100;
        super(startX, startY, 40, 40, '#00ff00');

        this.game = game;
        this.speed = 400;
        
        // --- ORUŽJE ---
        this.fireTimer = 0;
        this.fireRate = 0.15;
        this.weaponLevel = 1;
        this.powerUpTimer = 0;
        
        // --- ŽIVOTI I ODBRANA ---
        this.lives = 3;             // 3 Života
        this.invulnerableTimer = 0; // Tajmer besmrtnosti
        this.isVisible = true;      // Za efekat treperenja
        
        this.engineFlicker = 0;
    }

    upgradeWeapon() {
        this.weaponLevel = 2;
        this.powerUpTimer = 10.0;
        this.color = '#00ffff';
    }

    // Metoda za primanje štete
    takeDamage() {
        // Ako smo već besmrtni (upravo pogođeni), ignoriši štetu
        if (this.invulnerableTimer > 0) return;

        this.lives--;
        
        // Ažuriraj UI
        this.updateLivesUI();

        if (this.lives > 0) {
            // Preživeo je, daj mu 2 sekunde besmrtnosti
            this.invulnerableTimer = 2.0;
            this.game.sound.playExplosion(); // Manja eksplozija
            this.game.shake(10);
            // Opciono: resetuj poziciju na centar? Ne moramo, bolje da nastavi.
        } else {
            // Mrtav skroz
            this.game.sound.playExplosion(); // Velika eksplozija
            this.game.triggerGameOver();
        }
    }

    updateLivesUI() {
        // Generiši string sa srcima
        let hearts = '';
        for(let i=0; i<this.lives; i++) hearts += '❤️';
        const el = document.getElementById('lives-count');
        if(el) el.innerText = hearts;
    }

    update(dt) {
        // ... (Kretanje, Clamping, Pucanje ostaje isto kao pre) ...
        const input = this.game.input.getAxis();
        this.x += input.x * this.speed * dt;
        this.y += input.y * this.speed * dt;

        const canvas = this.game.engine.canvas;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;

        if (this.weaponLevel > 1) {
            this.powerUpTimer -= dt;
            if (this.powerUpTimer <= 0) {
                this.weaponLevel = 1;
                this.color = '#00ff00';
            }
        }

        if (this.fireTimer > 0) this.fireTimer -= dt;
        if (this.game.input.getFire() && this.fireTimer <= 0) {
            const centerX = this.x + this.width / 2;
            if (this.weaponLevel === 1) this.game.bullets.fire(centerX, this.y);
            else this.game.bullets.fireSpread(centerX, this.y);
            this.game.sound.playShoot();
            this.fireTimer = this.fireRate;
        }
        
        this.engineFlicker += dt * 20;

        // --- UPDATE BESMRTNOSTI ---
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
            // Treperenje: svakih 0.1s menjaj vidljivost
            this.isVisible = Math.floor(this.invulnerableTimer * 10) % 2 === 0;
            
            if (this.invulnerableTimer <= 0) {
                this.isVisible = true; // Budi siguran da je vidljiv na kraju
            }
        }
        
        if (this.game.analytics) {
            this.game.analytics.recordMovement(this.x, this.y);
        }
    }

    draw(ctx) {
        // Ako smo u fazi treperenja i 'nevidljivi' smo trenutno, ne crtaj ništa
        if (!this.isVisible) return;

        // ... (Crtanje motora i broda ostaje isto kao pre) ...
        ctx.save();
        const flicker = Math.sin(this.engineFlicker) * 5;
        ctx.fillStyle = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + this.height);
        ctx.lineTo(this.x + this.width - 10, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height + 15 + flicker);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height - 10);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}