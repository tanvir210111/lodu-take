// Audio Manager using Web Audio API (Synthesized SFX without external audio files)
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback error', e);
        }
    }

    playDiceRoll() {
        if (!this.enabled) return;
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(200 + Math.random() * 300, 'triangle', 0.05, 0.1);
            }, i * 60);
        }
    }

    playMoveStep() {
        this.playTone(520, 'sine', 0.08, 0.12);
    }

    playCutSound() {
        // Impact sound when token is cut
        this.playTone(180, 'sawtooth', 0.25, 0.2);
    }

    playLadderClimb() {
        if (!this.enabled) return;
        const notes = [300, 400, 500, 650, 800];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.1, 0.12);
            }, idx * 70);
        });
    }

    playSnakeBite() {
        if (!this.enabled) return;
        const notes = [600, 480, 360, 240, 160];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.12, 0.15);
            }, idx * 80);
        });
    }

    playWin() {
        if (!this.enabled) return;
        const fanfare = [440, 554, 659, 880];
        fanfare.forEach((f, idx) => {
            setTimeout(() => {
                this.playTone(f, 'triangle', 0.3, 0.2);
            }, idx * 120);
        });
    }

    playLose() {
        if (!this.enabled) return;
        const sad = [350, 310, 270, 220];
        sad.forEach((f, idx) => {
            setTimeout(() => {
                this.playTone(f, 'sawtooth', 0.35, 0.2);
            }, idx * 150);
        });
    }
}

window.audioManager = new AudioManager();
