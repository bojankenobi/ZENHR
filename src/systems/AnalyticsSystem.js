export class AnalyticsSystem {
    constructor(game) {
        this.game = game;
        this.metrics = {
            startTime: Date.now(),
            shotsFired: 0,
            hitsConfirmed: 0,
            reactionTimes: [], 
            lastEnemySpawnTime: 0,
            damageEvents: [],
            // Radna memorija
            memoryAttempts: [], 
            // Selektivna pažnja (Inhibicija impulsa)
            civilianHits: 0,
            // Neurometrija
            totalDistanceTraveled: 0, // Ukupan put letelice
            overActivityScore: 0,     // Kretanje bez promene cilja (nervozno šetanje levo-desno)
            lastPosition: { x: 0, y: 0 }
        };
    }

    recordShot() {
        this.metrics.shotsFired++;
    }

    recordHit() {
        this.metrics.hitsConfirmed++;
        if (this.metrics.lastEnemySpawnTime > 0) {
            const reaction = Date.now() - this.metrics.lastEnemySpawnTime;
            this.metrics.reactionTimes.push(reaction);
            this.metrics.lastEnemySpawnTime = 0; 
        }
    }

    recordEnemySpawn() {
        this.metrics.lastEnemySpawnTime = Date.now();
    }

    recordDamage() {
        this.metrics.damageEvents.push(Date.now());
    }

    // Beleženje pokušaja unosa šifre (Radna memorija)
    recordMemoryAttempt(isCorrect) {
        this.metrics.memoryAttempts.push({
            correct: isCorrect,
            timestamp: Date.now()
        });
    }

    // NOVO: Beleženje pogođenih civila (Selektivna pažnja)
    recordCivilianHit() {
        this.metrics.civilianHits++;
    }

    recordMovement(currentX, currentY) {
        if (this.metrics.lastPosition) {
            const dx = Math.abs(currentX - this.metrics.lastPosition.x);
            const dy = Math.abs(currentY - this.metrics.lastPosition.y);
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            this.metrics.totalDistanceTraveled += dist;

            // Ako se igrač pomera prebrzo i često menja smer (jitter), povećavamo score "neuroticizma"
            if (dist > 5) { // Brzi, nagli pokreti
                this.metrics.overActivityScore += 0.01;
            }
        }
        this.metrics.lastPosition = { x: currentX, y: currentY };
    }

    getFinalReport() {
        const duration = (Date.now() - this.metrics.startTime) / 1000;
        
        // Obračun preciznosti
        const accuracy = this.metrics.shotsFired > 0 
            ? (this.metrics.hitsConfirmed / this.metrics.shotsFired) * 100 
            : 0;
        
        // Obračun prosečne reakcije
        const avgReaction = this.metrics.reactionTimes.length > 0
            ? this.metrics.reactionTimes.reduce((a, b) => a + b) / this.metrics.reactionTimes.length
            : 0;

        // Obračun radne memorije
        const memorySuccess = this.metrics.memoryAttempts.filter(a => a.correct).length;
        const totalMemoryAttempts = this.metrics.memoryAttempts.length;
        const activityDensity = this.metrics.totalDistanceTraveled / duration;

        // Logika za selektivnu pažnju (Inhibicija impulsa)
        let impulseControl = "EXCELLENT";
        if (this.metrics.civilianHits > 0) {
            impulseControl = "POOR (Civilian Casualties)";
        }

        return {
            gameDuration: duration.toFixed(2) + "s",
            accuracy: accuracy.toFixed(2) + "%",
            averageReactionTime: avgReaction.toFixed(0) + "ms",
            totalDamageTaken: this.metrics.damageEvents.length,
            // HR Metrika za selektivnu pažnju
            civilianCasualties: this.metrics.civilianHits,
            impulseControl: impulseControl,
            // Neurometrija
            movementIntensity: activityDensity.toFixed(0),
            triggerDiscipline: accuracy > 60 ? "HIGH" : (accuracy > 30 ? "MODERATE" : "LOW (Panic)"),
            stressResilience: this.metrics.damageEvents.length < 3 ? "STABLE" : "FRAGILE",
            emotionalStabilityIndex: (accuracy / (activityDensity + 1)).toFixed(2),
            // HR Metrika za radnu memoriju
            memoryScore: `${memorySuccess}/${totalMemoryAttempts} sequences correct`,
            memoryAccuracy: totalMemoryAttempts > 0 
                ? ((memorySuccess / totalMemoryAttempts) * 100).toFixed(2) + "%" 
                : "N/A"
        };
    }
}