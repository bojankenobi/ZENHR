export class CollisionSystem {
    constructor(game) {
        this.game = game;
    }

    // Univerzalna metoda za proveru sudara pravougaonika
    checkRectCollision(rect1, rect2) {
        if (!rect1 || !rect2) return false;
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    update() {
        const bullets = this.game.bullets?.pool || [];
        const enemies = this.game.enemies?.pool || [];
        const player = this.game.player;
        const boss = this.game.boss;
        const enemyBullets = this.game.enemyBullets?.pool || [];
        const bonuses = this.game.bonuses?.pool || [];

        if (!player || player.lives <= 0) return;

        // --- 1. NAŠI METCI (Uništavanje neprijatelja i IFF test) ---
        bullets.forEach(bullet => {
            if (!bullet.active) return;

            enemies.forEach(enemy => {
                if (enemy.active && this.checkRectCollision(bullet, enemy)) {
                    bullet.active = false;
                    
                    if (enemy.aiType === 'CIVILIAN') {
                        // KAZNA ZA CIVILA (Selektivna pažnja)
                        enemy.active = false;
                        this.game.score = Math.max(0, this.game.score - 500); 
                        this.game.shake(25);
                        
                        // Sigurno beleženje u analitiku
                        this.game.analytics.recordCivilianHit();
                        
                        this.game.sound.playExplosion?.();
                        this.game.particles.explode(enemy.x, enemy.y, '#ffffff', 30);
                    } else {
                        // Regularni neprijatelj
                        enemy.active = false;
                        this.game.analytics.recordHit();
                        this.game.sound.playExplosion?.();
                        this.game.particles.explode(enemy.x, enemy.y, enemy.color, 15);
                        this.game.score += 100;
                    }
                    
                    const scoreEl = document.getElementById('score');
                    if (scoreEl) scoreEl.innerText = this.game.score;
                }
            });

            // Sudar metka sa Bosom
            if (boss && boss.active && this.checkRectCollision(bullet, boss)) {
                bullet.active = false;
                boss.takeDamage(2);
                this.game.analytics.recordHit();
                this.game.sound.playBossHit?.();
                this.game.particles.explode(bullet.x, bullet.y, '#ffaa00', 5);
            }
        });

        // --- 2. NEPRIJATELJSKA VATRA I SUDARI SA LETELICOM ---
        enemyBullets.forEach(b => {
             if (b.active && this.checkRectCollision(b, player)) {
                 b.active = false;
                 this.game.analytics.recordDamage();
                 player.takeDamage();
                 this.game.particles.explode(player.x, player.y, '#ff0000', 20);
             }
        });

        enemies.forEach(enemy => {
            if (enemy.active && this.checkRectCollision(player, enemy)) {
                enemy.active = false;
                this.game.analytics.recordDamage();
                player.takeDamage();
                this.game.particles.explode(player.x, player.y, '#ff0000', 30);
            }
        });

        // --- 3. NUMERIČKA OBRADA (Igrač skuplja Bonus kockicu) ---
        bonuses.forEach(bonus => {
            if (bonus.active && this.checkRectCollision(player, bonus)) {
                // Kada igrač dodirne kockicu, ona se "zaključava" za unos
                if (!bonus.isTouched) {
                    bonus.isTouched = true;
                    bonus.touchTime = Date.now();
                    
                    // Vizuelni feedback u konzoli i igri
                    console.log(`%c [MATH TASK]: ${bonus.mathQuestion} = ?`, "color: #ffff00; font-weight: bold; font-size: 14px;");
                    
                    // Opciono: Možeš dodati zvuk koji signalizira početak zadatka
                    this.game.sound.playPowerUp?.(); 
                }
            }
        });

        // Sudar sa telom bosa (Instant smrt / kraj)
        if (boss && boss.active && this.checkRectCollision(boss, player)) {
             player.lives = 0;
             player.updateLivesUI();
             this.game.triggerGameOver();
        }
    }
}