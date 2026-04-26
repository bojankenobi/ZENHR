import { Entity } from './Entity.js';

export class Enemy extends Entity {
    constructor(game) {
        super(0, 0, 40, 40, '#ff0000');
        this.game = game; 
        this.active = false;
        this.aiType = 'BASIC';
        this.age = 0; 
        this.shootTimer = 0;
        this.startX = 0;
        this.speed = 100;
    }

    spawn(x, y, forcedType = null) {
        this.x = x;
        this.startX = x;
        this.y = y;
        this.active = true;
        this.age = 0;

        this.aiType = forcedType;

        if (this.aiType === 'BASIC') {
            this.color = '#ff4444';
            this.speed = 150;
            this.width = 40; 
            this.height = 40;
        } 
        else if (this.aiType === 'WAVER') {
            this.color = '#ff00ff';
            this.speed = 100;
            this.width = 40; 
            this.height = 40;
        } 
        else if (this.aiType === 'SHOOTER') {
            this.color = '#ffff00';
            this.speed = 80;
            this.width = 45;
            this.height = 45;
            this.shootTimer = 1.0 + Math.random() * 1.5;
        }
        // NOVO: Civilni brod - predstavlja test selektivne pažnje
        else if (this.aiType === 'CIVILIAN') {
            this.color = '#ffffff'; 
            this.speed = 120;
            this.width = 30;
            this.height = 30;
        }
    }

    update(dt, canvasHeight) {
        if (!this.active) return;
        this.age += dt;

        this.y += this.speed * dt;

        if (this.aiType === 'WAVER') {
            this.x = this.startX + Math.sin(this.age * 3) * 60;
        }
        else if (this.aiType === 'SHOOTER') {
            this.shootTimer -= dt;
            if (this.shootTimer <= 0) {
                const bulletX = this.x + this.width / 2;
                const bulletY = this.y + this.height;
                this.game.enemyBullets.fire(bulletX, bulletY, this.game.player.x, this.game.player.y);
                this.shootTimer = 1.5 + Math.random();
            }
        }

        if (this.y > canvasHeight) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        if (this.aiType === 'CIVILIAN') {
            // Vizuelno neutralan stil - krug sa krstom
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.width / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillRect(centerX - 1, centerY - 8, 2, 16);
            ctx.fillRect(centerX - 8, centerY - 1, 16, 2);
        } else if (this.aiType === 'BASIC') {
            ctx.beginPath();
            ctx.moveTo(centerX, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y);
            ctx.lineTo(centerX, this.y + this.height * 0.3);
            ctx.lineTo(this.x, this.y);
            ctx.closePath();
            ctx.fill();
        } else if (this.aiType === 'WAVER') {
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, this.width * 0.3, this.height * 0.5, 0, 0, Math.PI*2);
            ctx.fill();
        } else if (this.aiType === 'SHOOTER') {
            ctx.fillRect(this.x + 10, this.y, this.width - 20, this.height * 0.7);
            ctx.fillRect(this.x + 5, this.y + this.height * 0.5, 8, this.height * 0.5);
            ctx.fillRect(this.x + this.width - 13, this.y + this.height * 0.5, 8, this.height * 0.5);
        }
        
        ctx.restore();
    }
}