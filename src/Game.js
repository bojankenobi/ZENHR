import { Engine } from './core/Engine.js';
import { InputHandler } from './core/Input.js';
import { SoundSystem } from './core/Sound.js';

// Entiteti
import { Player } from './entities/Player.js';
import { Boss } from './entities/Boss.js';

// Sistemi
import { StarfieldSystem } from './systems/Starfield.js';
import { BackgroundSystem } from './systems/BackgroundSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { BulletSystem } from './systems/BulletSystem.js';
import { EnemySystem } from './systems/EnemySystem.js';
import { EnemyBulletSystem } from './systems/EnemyBulletSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { CollisionSystem } from './systems/Collision.js';
import { AnalyticsSystem } from './systems/AnalyticsSystem.js';

// --- SUPABASE INICIJALIZACIJA ---
// Mora biti van klase da bi bio dostupan odmah nakon učitavanja skripte iz index.html
let supabaseClient;
const initSupabase = () => {
    if (window.supabase) {
        // Tvoji ključevi iz projekta
        const supabaseUrl = 'https://kpqqeiaqezkpubspoplg.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcXFlaWFxZXprcHVic3BvcGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNDQ3NDksImV4cCI6MjA5MjcyMDc0OX0.QCfAZim-Zo9A4ElE8b7gmCmycd5hjwHIntvwiU6iiRo';
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.error("Supabase biblioteka nije učitana! Proverite redosled skripti u index.html");
    }
};
initSupabase();

class Game {
    constructor() {
        // GLAVNI OSIGURAČ - Dok ovo ne postane true, igra ne mrda!
        this.gameActive = false; 

        // 1. Inicijalizacija Engine-a i osnovnih kontrolera
        this.engine = new Engine('gameCanvas');
        this.sound = new SoundSystem();
        
        // 2. Inicijalizacija Analitike i Inputa
        this.analytics = new AnalyticsSystem(this);
        this.input = new InputHandler(this);

        // 3. Inicijalizacija Sistema
        this.starfield = new StarfieldSystem(this);
        this.background = new BackgroundSystem(this);
        this.levels = new LevelSystem(this);
        this.bullets = new BulletSystem(this);
        this.enemies = new EnemySystem(this);
        this.enemyBullets = new EnemyBulletSystem(this);
        this.particles = new ParticleSystem(this);
        this.collision = new CollisionSystem(this);

        // 4. Glavni Akteri
        this.player = new Player(this);
        this.boss = new Boss(this);

        // 5. Game State
        this.score = 0;
        this.isGameOver = false;
        this.bossDefeated = false;
        this.shakeIntensity = 0;
        this.shakeDecay = 30;
        this.fadeOpacity = 0;
        this.isFadingIn = false;

        // --- UI KONTROLERI (IDENTIFIKACIJA -> BRIEFING -> START) ---
        const nextBtn = document.getElementById('next-to-briefing-btn');
        const startBtn = document.getElementById('start-mission-btn');
        const nameInput = document.getElementById('candidate-name');
        const nameSection = document.getElementById('name-input-section');
        const briefingSection = document.getElementById('briefing-section');

        // KORAK 1: Od imena do pravila igre
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!nameInput || nameInput.value.trim().length < 3) {
                    alert("Molimo Vas unesite puno ime i prezime.");
                    return;
                }
                // Čuvamo ime kandidata za HR izveštaj
                this.analytics.candidateName = nameInput.value;
                
                // Menjamo ekran unutar crnog intro kontejnera
                if (nameSection) nameSection.style.display = 'none';
                if (briefingSection) briefingSection.style.display = 'block';
            });
        }

        // KORAK 2: Od pravila igre do same igre
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                // 1. Skloni crni intro ekran zauvek
                document.getElementById('intro-screen').style.display = 'none';
                
                // 2. Prikaži HUD elemente sada kada je ekran čist
                document.getElementById('hud').style.display = 'block';
                document.getElementById('lives-display').style.display = 'block';
                
                // 3. Pokreni Audio i otključaj logiku igre
                this.sound.resume(); 
                this.gameActive = true; // OTKLJUČAVANJE MOTORA!
                
                // 4. Startuj nivo (Ovo okida prvo šifru, pa borbu)
                this.levels.start(); 
            });
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.resetGame());
        }

        // --- Povezivanje petlji motora ---
        this.engine.onUpdate = (dt) => this.update(dt);
        this.engine.onDraw = (ctx) => this.draw(ctx);

        // Engine kreće da radi odmah, ali mi kontrolišemo ŠTA se vrti kroz this.gameActive
        this.engine.start();
    }

    shake(amount) { 
        this.shakeIntensity = amount;
    }

    setFadeOverlay(opacity) {
        this.fadeOpacity = opacity;
        if (this.fadeOpacity > 1) this.fadeOpacity = 1;
    }

    startFadeIn() {
        this.fadeOpacity = 1;
        this.isFadingIn = true;
    }

    async sendAssessmentData(report) {
        const candidateName = this.analytics.candidateName || "Anonimni Kandidat";
        console.log(`%c [DB]: Arhiviranje rezultata za: ${candidateName}`, "color: #00ffff;");

        // Pucamo u hr_reports (kako smo dogovorili za HR bazu)
        if (supabaseClient) {
            const { error } = await supabaseClient
                .from('hr_reports') 
                .insert([{ 
                    candidate_name: candidateName,
                    memory_score: report.memoryScore,
                    memory_accuracy: report.memoryAccuracy,
                    reaction_time: report.averageReactionTime,
                    impulse_control: report.impulseControl,
                    accuracy: report.accuracy,
                    stress_resilience: report.stressResilience,
                    stability_index: report.emotionalStabilityIndex,
                    duration: report.gameDuration
                }]);

            if (error) {
                console.error("Greška pri upisu u bazu:", error.message);
            } else {
                console.log("%c [SUCCESS]: HR Izveštaj je trajno sačuvan u bazi.", "color: #00ff00; font-weight: bold;");
            }
        }
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        const report = this.analytics.getFinalReport();
        this.displayHRLog(report, "TERMINATED");

        const highScore = localStorage.getItem('retroShooterHighScore') || 0;
        if (this.score > highScore) localStorage.setItem('retroShooterHighScore', this.score);
        
        const screen = document.getElementById('game-over-screen');
        if (screen) {
            const h1 = screen.querySelector('h1');
            const p = screen.querySelector('p');
            if (h1) h1.innerText = "GAME OVER";
            const best = Math.max(this.score, highScore);
            if (p) p.innerHTML = `FINAL SCORE: <span id="final-score">${this.score}</span><br>(BEST: ${best})`;
            screen.style.display = 'flex';
        }
        
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) mobileControls.style.display = 'none';
        this.shake(20);
    }

    triggerVictory() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        
        const report = this.analytics.getFinalReport();
        this.displayHRLog(report, "SUCCESS");

        const screen = document.getElementById('game-over-screen');
        if (screen) {
            const h1 = screen.querySelector('h1');
            if (h1) {
                h1.innerText = "MISSION ACCOMPLISHED";
                h1.style.color = "#00ff00";
            }
            screen.style.display = 'flex';
        }
    }

    displayHRLog(report, status) {
        const color = status === "SUCCESS" ? "#00ff00" : "#ff0055";
        
        console.groupCollapsed(`%c 📊 [HR ASSESSMENT REPORT] - MISSION ${status} `, `color: #000; background: ${color}; font-weight: bold; font-size: 14px; padding: 4px;`);
        
        const allMetrics = {
            "01. Kandidat": this.analytics.candidateName,
            "02. Trajanje Evaluacije": report.gameDuration,
            "03. Radna Memorija (Uspesnost)": report.memoryScore,
            "04. Tačnost Memorije (%)": report.memoryAccuracy,
            "05. Brzina Reakcije na Pretnju": report.averageReactionTime,
            "06. Preciznost Pucanja": report.accuracy,
            "07. Disciplina na Okidaču": report.triggerDiscipline,
            "08. Nastradali Civili": report.civilianCasualties,
            "09. Inhibicija Impulsa": report.impulseControl,
            "10. Pretrpljena Šteta (Udarci)": report.totalDamageTaken,
            "11. Otpornost na Stres": report.stressResilience,
            "12. Intenzitet Kretanja (Jitter)": report.movementIntensity,
            "13. Indeks Emocionalne Stabilnosti": report.emotionalStabilityIndex
        };

        console.table(allMetrics);
        console.groupEnd();

        this.sendAssessmentData(report);
    }

    resetGame() {
        this.score = 0;
        this.isGameOver = false;
        this.bossDefeated = false;
        
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.innerText = "0";
        
        // Sačuvaj ime iz prethodne sesije pre rekreiranja analitike
        const lastName = this.analytics.candidateName;
        this.analytics = new AnalyticsSystem(this);
        this.analytics.candidateName = lastName;

        this.bullets.pool.forEach(b => { b.active = false; });
        this.enemyBullets.pool.forEach(b => { b.active = false; });
        this.enemies.pool.forEach(e => { e.active = false; });
        this.particles.pool.forEach(p => { p.active = false; });
        this.background.objects = [];

        this.player.x = this.engine.canvas.width / 2 - 20;
        this.player.y = this.engine.canvas.height - 100;
        this.player.lives = 3;
        this.player.updateLivesUI();
        this.player.invulnerableTimer = 0;
        this.player.weaponLevel = 1;
        
        this.boss.active = false;
        const bossHud = document.getElementById('boss-hud');
        if (bossHud) bossHud.style.display = 'none';
        
        this.starfield.setWarp(false);
        this.background.setWarp(false);
        this.fadeOpacity = 0;
        this.levels.start();

        const screen = document.getElementById('game-over-screen');
        if (screen) screen.style.display = 'none';
        
        const mobileControls = document.getElementById('mobile-controls');
        if (mobileControls) mobileControls.style.display = '';
    }

    update(dt) {
        // OSIGURAČ: Ako korisnik nije potvrdio intro, vrti se samo zvezdano nebo.
        if (!this.gameActive) {
            this.starfield.update(dt);
            return; // Prekida dalje ažuriranje!
        }

        if (this.isGameOver) return;
        
        if (this.isFadingIn) {
            this.fadeOpacity -= dt * 0.8;
            if (this.fadeOpacity <= 0) {
                this.fadeOpacity = 0;
                this.isFadingIn = false;
            }
        }

        this.input.update();
        this.starfield.update(dt);
        this.background.update(dt);
        this.levels.update(dt);
        this.player.update(dt);
        this.bullets.update(dt);
        this.enemyBullets.update(dt);
        this.particles.update(dt);

        if (this.boss.active) {
            this.boss.update(dt);
        } else if (!this.bossDefeated) {
            this.enemies.update(dt);
        }

        this.collision.update();

        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= this.shakeDecay * dt;
            if (this.shakeIntensity < 0) this.shakeIntensity = 0;
        }
    }

    draw(ctx) {
        // Uvek očisti ekran crnom bojom prvo
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        // OSIGURAČ: Ne crtamo letelice, neprijatelje i metke ako igra nije aktivna
        if (!this.gameActive) {
            this.starfield.draw(ctx);
            return; // Prekida dalje crtanje!
        }

        // Standardno crtanje kada je igra aktivna
        ctx.save();
        if (this.shakeIntensity > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity;
            const dy = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(dx, dy);
        }

        this.starfield.draw(ctx);
        this.background.draw(ctx);
        
        if (this.boss.active) {
            this.boss.draw(ctx);
        } else {
            this.enemies.draw(ctx);
        }

        this.enemyBullets.draw(ctx);
        this.bullets.draw(ctx);
        this.player.draw(ctx);
        this.particles.draw(ctx);
        ctx.restore();

        if (this.fadeOpacity > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${this.fadeOpacity})`;
            ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
            ctx.restore();
        }
    }
}

new Game();