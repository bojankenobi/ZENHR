export class SoundSystem {
    constructor() {
        // Kreiramo Audio Context. Ovo je tvoja virtuelna zvučna kartica.
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Master Volume (da ne probijemo uši)
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // 30% jačine
        this.masterGain.connect(this.ctx.destination);

        // Buffer za šum (koristi se za eksplozije)
        this.noiseBuffer = this.createNoiseBuffer();
    }

    // Browseri blokiraju zvuk dok korisnik ne klikne.
    // Ovu metodu zovemo na prvi klik/touch.
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // --- GENERATOR ŠUMA (Za eksplozije) ---
    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 sekunde šuma
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // --- ZVUK 1: LASER (Pew Pew) ---
    playShoot() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        // Postavke tona
        osc.type = 'square'; // 'square' ili 'sawtooth' su dobri za retro
        
        // Frekvencija pada sa 880Hz na 100Hz (Slide efekat)
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

        // Volume Envelope (ADSR - Attack, Decay, Sustain, Release)
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // --- ZVUK 2: EKSPLOZIJA (Boom) ---
    playExplosion() {
        const src = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        src.buffer = this.noiseBuffer;
        
        // Lowpass filter "guši" šum da zvuči kao eksplozija, a ne kao TV sneg
        filter.type = 'lowpass';
        filter.frequency.value = 1000;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        const now = this.ctx.currentTime;
        
        // Volume opada duže nego kod pucnja
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        // Filter frequency drop (da zvuk postane "dublji" pred kraj)
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.4);

        src.start(now);
        src.stop(now + 0.5);
    }

    // --- ZVUK 3: BOSS HIT (Metalni udarac) ---
    playBossHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        
        // Kratak, nizak ton
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.1);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }
}