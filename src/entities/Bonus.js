import { Entity } from './Entity.js';

export class Bonus extends Entity {
    constructor() {
        super(0, 0, 45, 45, '#fff'); // Malo veći okvir za bolju čitljivost
        this.active = false;
        this.speed = 150;
        this.type = 'NONE'; 
        this.wobble = 0;
        this.isTouched = false;
        this.touchTime = 0;
        this.mathQuestion = "";
        this.correctAnswer = 0;
    }

    spawn(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.isTouched = false;
        this.wobble = 0;
        
        // Generator brzih operacija sa rezultatom 0-9
        const ops = ['+', '-', '*', '/'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let a, b, res;

        switch(op) {
            case '+':
                res = Math.floor(Math.random() * 10); // Rezultat 0-9
                a = Math.floor(Math.random() * (res + 1));
                b = res - a;
                break;
            case '-':
                a = Math.floor(Math.random() * 10);
                b = Math.floor(Math.random() * (a + 1));
                res = a - b;
                break;
            case '*':
                // Parovi čiji je proizvod <= 9
                const pairs = [[0,5], [1,9], [2,4], [3,3], [4,2], [5,1], [1,1]];
                const pair = pairs[Math.floor(Math.random() * pairs.length)];
                a = pair[0];
                b = Math.floor(Math.random() * (pair[1] + 1));
                res = a * b;
                break;
            case '/':
                res = Math.floor(Math.random() * 9) + 1; // Rezultat 1-9
                b = Math.floor(Math.random() * 3) + 1;   // Delilac 1-3
                a = res * b;
                break;
        }

        this.correctAnswer = res;
        this.mathQuestion = `${a}${op}${b}`;
        
        // Postavljanje boja prema tipu bonusa
        if (this.type === 'BOMB') this.color = '#ffaa00';
        else if (this.type === 'SPREAD') this.color = '#00ffff';
        else if (this.type === 'LIFE') this.color = '#ff0055';
    }

    update(dt, canvasHeight) {
        if (!this.active) return;

        // Ako kockica NIJE dotaknuta, ona nastavlja da pada
        if (!this.isTouched) {
            this.y += this.speed * dt;
            this.wobble += dt * 5;
            this.x += Math.sin(this.wobble) * 0.5; // Blago lelujanje levo-desno
        } else {
            // Ako je dotaknuta, stoji u mestu dok igrač ne unese broj
            // Ovde možemo dodati i tajmer da bonus nestane ako se ne reši brzo
            if (Date.now() - this.touchTime > 5000) { // 5 sekundi limit
                this.active = false;
                this.isTouched = false;
            }
        }

        // Deaktivacija ako izleti sa ekrana
        if (this.y > canvasHeight) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        
        // Neon efekat i senka
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Stil za tekst zadatka
        ctx.fillStyle = '#000';
        ctx.font = 'bold 22px VT323';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Vizuelni feedback kada je kockica "aktivirana" dodirom
        if (this.isTouched) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
            ctx.fillStyle = '#ff0000'; // Crveni tekst za hitnost
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff0000';
        }

        ctx.fillText(this.mathQuestion, this.x + this.width / 2, this.y + this.height / 2);

        ctx.restore();
    }
}