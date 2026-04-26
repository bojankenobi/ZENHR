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
            memoryAttempts: [], 
            timePressureEvents: [], // Niz svih sekundi pre roka [cite: 539, 540]
            civilianHits: 0,
            totalDistanceTraveled: 0,
            overActivityScore: 0,
            lastPosition: { x: 0, y: 0 },
            // NOVO: Istorija kretanja za Heatmap i hronologija pogodaka za Zamor
            movementHistory: [], 
            performanceLog: [] // Beležimo {timestamp, type: 'HIT'|'MISS'} [cite: 541]
        };
    }

    recordShot() {
        this.metrics.shotsFired++;
        this.metrics.performanceLog.push({ t: Date.now(), type: 'SHOT' }); // [cite: 542]
    }

    recordHit() {
        this.metrics.hitsConfirmed++;
        this.metrics.performanceLog.push({ t: Date.now(), type: 'HIT' });
        if (this.metrics.lastEnemySpawnTime > 0) {
            const reaction = Date.now() - this.metrics.lastEnemySpawnTime;
            this.metrics.reactionTimes.push(reaction); // [cite: 543, 544]
            this.metrics.lastEnemySpawnTime = 0; 
        }
    }

    recordEnemySpawn() {
        this.metrics.lastEnemySpawnTime = Date.now(); // [cite: 545]
    }

    recordDamage() {
        this.metrics.damageEvents.push(Date.now()); // [cite: 546]
    }

    recordMemoryAttempt(isCorrect) {
        this.metrics.memoryAttempts.push({
            correct: isCorrect,
            timestamp: Date.now() // [cite: 547]
        });
    }

    recordTimePressureResilience(remainingTime) {
        this.metrics.timePressureEvents.push(remainingTime); // [cite: 548]
    }

    recordCivilianHit() {
        this.metrics.civilianHits++; // [cite: 549]
    }

    recordMovement(currentX, currentY) {
        if (this.metrics.lastPosition) {
            const dx = Math.abs(currentX - this.metrics.lastPosition.x);
            const dy = Math.abs(currentY - this.metrics.lastPosition.y);
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.metrics.totalDistanceTraveled += dist; // [cite: 550, 551]

            // Čuvamo koordinate za Heatmap (svakih n frejmova ili na promenu)
            if (this.metrics.movementHistory.length < 500) { 
                this.metrics.movementHistory.push({ x: Math.round(currentX), y: Math.round(currentY) });
            }

            if (dist > 5) { 
                this.metrics.overActivityScore += 0.01; // [cite: 552]
            }
        }
        this.metrics.lastPosition = { x: currentX, y: currentY }; // [cite: 553]
    }

    // Pomoćna funkcija za računanje preciznosti u određenom vremenskom intervalu (Kognitivni zamor)
    calculatePhaseAccuracy(startFrac, endFrac) {
        const totalDuration = Date.now() - this.metrics.startTime;
        const startT = this.metrics.startTime + totalDuration * startFrac;
        const endT = this.metrics.startTime + totalDuration * endFrac;

        const phaseShots = this.metrics.performanceLog.filter(l => l.t >= startT && l.t <= endT);
        const phaseHits = phaseShots.filter(l => l.type === 'HIT').length;

        return phaseShots.length > 0 ? (phaseHits / phaseShots.length) * 100 : 0;
    }

    getFinalReport() {
        const duration = (Date.now() - this.metrics.startTime) / 1000; // [cite: 554]
        
        const accuracy = this.metrics.shotsFired > 0 
            ? (this.metrics.hitsConfirmed / this.metrics.shotsFired) * 100 
            : 0; // 
        
        const avgReaction = this.metrics.reactionTimes.length > 0
            ? this.metrics.reactionTimes.reduce((a, b) => a + b) / this.metrics.reactionTimes.length
            : 0; // [cite: 557]

        const memorySuccess = this.metrics.memoryAttempts.filter(a => a.correct).length;
        const totalMemoryAttempts = this.metrics.memoryAttempts.length; // [cite: 558, 559]
        const activityDensity = this.metrics.totalDistanceTraveled / duration;

        const avgTimeResilience = this.metrics.timePressureEvents.length > 0
            ? this.metrics.timePressureEvents.reduce((a, b) => a + b) / this.metrics.timePressureEvents.length
            : 0; // [cite: 561]

        let impulseControl = "EXCELLENT";
        if (this.metrics.civilianHits > 0) {
            impulseControl = "POOR (Civilian Casualties)"; // [cite: 563, 564]
        }

        return {
            gameDuration: duration.toFixed(2) + "s",
            accuracy: accuracy.toFixed(2) + "%",
            averageReactionTime: avgReaction.toFixed(0) + "ms",
            totalDamageTaken: this.metrics.damageEvents.length,
            civilianCasualties: this.metrics.civilianHits,
            impulseControl: impulseControl,
            movementIntensity: activityDensity.toFixed(0),
            triggerDiscipline: accuracy > 60 ? "HIGH" : (accuracy > 30 ? "MODERATE" : "LOW (Panic)"), // [cite: 566]
            stressResilience: this.metrics.damageEvents.length < 3 ? "STABLE" : "FRAGILE", // [cite: 567]
            emotionalStabilityIndex: (accuracy / (activityDensity + 1)).toFixed(2),
            memoryScore: `${memorySuccess}/${totalMemoryAttempts} sequences correct`,
            memoryAccuracy: totalMemoryAttempts > 0 
                ? ((memorySuccess / totalMemoryAttempts) * 100).toFixed(2) + "%" 
                : "N/A", // [cite: 568]
            timePressureResilience: this.metrics.timePressureEvents.length > 0 
                ? avgTimeResilience.toFixed(2) + "s pre roka" 
                : "N/A", // [cite: 569]

            // --- NOVI PODACI ZA GRAFIKONE U ADMIN PANELU ---
            stressTimeline: this.metrics.timePressureEvents, // Za Line Chart
            spatialData: this.metrics.movementHistory,      // Za Heatmap
            fatigueIndex: [
                this.calculatePhaseAccuracy(0, 0.33).toFixed(1), // Početak
                this.calculatePhaseAccuracy(0.33, 0.66).toFixed(1), // Sredina
                this.calculatePhaseAccuracy(0.66, 1.0).toFixed(1)  // Kraj
            ],
            reactionDistribution: this.metrics.reactionTimes // Za Histogram
        };
    }
}