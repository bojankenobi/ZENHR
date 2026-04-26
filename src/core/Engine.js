export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.onUpdate = () => {}; // Funkcija koju ćemo definisati u Game.js
        this.onDraw = () => {};

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
    // 1. Pronađi kontejner u kome se nalazi canvas
    const container = this.canvas.parentElement; // Ovo je #game-container
    
    // 2. Postavi veličinu canvasa na veličinu kontejnera
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    
    // 3. Pixel art settings
    this.ctx.imageSmoothingEnabled = false;
}

    start() {
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(currentTime) {
        // Izračunaj koliko je milisekundi prošlo od zadnjeg frejma
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Ako je tab bio neaktivan, dt će biti ogroman, pa ga ograničavamo
        const limitedDt = Math.min(dt, 0.1);

        this.onUpdate(limitedDt);
        this.onDraw(this.ctx);

        requestAnimationFrame(this.loop.bind(this));
    }
}