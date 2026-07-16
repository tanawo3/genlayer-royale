class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1, slideFreq?: number) {
    if (!this.enabled || !this.ctx) return;
    
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = type;
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      const t = this.ctx.currentTime;
      osc.frequency.setValueAtTime(freq, t);
      if (slideFreq) {
        osc.frequency.exponentialRampToValueAtTime(slideFreq, t + duration);
      }
      
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
      
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playBump() {
    this.playTone(150, 'triangle', 0.1, 0.2, 50);
  }

  playDamage() {
     this.playTone(80, 'sawtooth', 0.2, 0.3, 40);
  }

  playEat() {
    this.playTone(400, 'sine', 0.1, 0.1, 600);
  }

  playCollect() {
    this.playTone(600, 'sine', 0.05, 0.1, 800);
    setTimeout(() => {
        this.playTone(800, 'sine', 0.15, 0.1, 1200);
    }, 50);
  }

  playBoost() {
    this.playTone(300, 'square', 0.15, 0.1, 100);
  }

  playWin() {
    [400, 500, 600, 800, 1000].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.15, 0.2, f * 1.2), i * 150);
    });
  }

  playLose() {
    this.playTone(300, 'sawtooth', 0.4, 0.3, 50);
  }
}

export const audio = new AudioEngine();
