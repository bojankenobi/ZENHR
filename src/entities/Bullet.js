import { Entity } from './Entity.js';

export class Bullet extends Entity {
    constructor() {
        // Počinjemo sa 0,0, postavićemo pravu poziciju kad ga ispalimo
        super(0, 0, 4, 15, '#ffff00'); // Žuta boja, tanak i dugačak
        this.speed = 800; // Veoma brz
        this.active = false; // Po defaultu je "mrtav" i čeka u bazenu
    }

    // Metod za aktivaciju metka (reusability)
    spawn(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }

    update(dt, canvasHeight) {
        if (!this.active) return;

        // Metak uvek ide gore (y se smanjuje)
        this.y -= this.speed * dt;

        // Ako izađe sa ekrana, deaktiviraj ga (vrati u bazen)
        if (this.y + this.height < 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        // Dodajemo intenzivan glow efekt samo za metke
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffaa00';
        super.draw(ctx);
        ctx.shadowBlur = 0;
    }
}