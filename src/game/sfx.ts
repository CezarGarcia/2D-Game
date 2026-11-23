/**
 * Efeitos sonoros sintetizados na hora, sem arquivos de áudio. Servem para dar peso aos golpes
 * no protótipo; serão trocados por gravações quando houver uma biblioteca de sons escolhida.
 */
export type SfxName = 'swing' | 'hit' | 'crit' | 'kill' | 'hurt' | 'dodge' | 'perfect' | 'cast' | 'tele' | 'slam' | 'crash'
  | 'spit' | 'splat' | 'win' | 'death' | 'wave' | 'armor' | 'coin' | 'chest' | 'buff' | 'pot' | 'orb';

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Navegadores só liberam áudio depois de um gesto do jogador. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const c = this.ctx, m = this.master;
    if (!c || !m) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(m);
    o.start(t); o.stop(t + dur + 0.02);
  }

  private noise(dur: number, vol: number, type: BiquadFilterType, f0: number, f1: number, delay = 0): void {
    const c = this.ctx, m = this.master;
    if (!c || !m) return;
    const t = c.currentTime + delay, n = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    fl.type = type;
    fl.frequency.setValueAtTime(f0, t);
    fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(fl); fl.connect(g); g.connect(m);
    src.start(t);
  }

  play(name: SfxName): void {
    if (this.muted || !this.ctx) return;
    switch (name) {
      case 'swing': this.noise(0.13, 0.35, 'bandpass', 2600, 700); break;
      case 'hit': this.noise(0.09, 0.6, 'lowpass', 1800, 300); this.tone(190, 80, 0.11, 'square', 0.25); break;
      case 'crit': this.noise(0.12, 0.7, 'lowpass', 2600, 300); this.tone(240, 70, 0.16, 'square', 0.3); this.tone(1320, 880, 0.14, 'triangle', 0.2); break;
      case 'armor': this.tone(520, 380, 0.08, 'square', 0.12); this.noise(0.05, 0.3, 'highpass', 3000, 2000); break;
      case 'kill': this.tone(320, 60, 0.28, 'sawtooth', 0.22); this.noise(0.22, 0.4, 'lowpass', 1400, 120); break;
      case 'hurt': this.tone(210, 70, 0.3, 'sawtooth', 0.4); this.noise(0.16, 0.5, 'lowpass', 900, 150); break;
      case 'dodge': this.noise(0.2, 0.3, 'highpass', 900, 3600); break;
      case 'perfect': this.tone(880, 880, 0.14, 'triangle', 0.3); this.tone(1320, 1320, 0.22, 'triangle', 0.3, 0.08); break;
      case 'cast': this.tone(420, 940, 0.16, 'sine', 0.3); this.noise(0.14, 0.2, 'bandpass', 1800, 3600); break;
      case 'tele': this.tone(330, 300, 0.07, 'square', 0.08); break;
      case 'slam': this.noise(0.4, 0.9, 'lowpass', 500, 50); this.tone(90, 35, 0.4, 'sine', 0.7); break;
      case 'crash': this.noise(0.28, 0.7, 'lowpass', 900, 90); this.tone(130, 50, 0.25, 'square', 0.3); break;
      case 'spit': this.tone(280, 520, 0.12, 'sine', 0.2); break;
      case 'splat': this.noise(0.14, 0.4, 'lowpass', 700, 150); break;
      case 'wave': this.tone(392, 392, 0.12, 'triangle', 0.22); this.tone(523, 523, 0.18, 'triangle', 0.22, 0.12); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.28, 'triangle', 0.26, i * 0.12)); break;
      case 'coin': { const f = 1568 + Math.random() * 300; this.tone(f, f, 0.05, 'square', 0.07); this.tone(f * 1.5, f * 1.5, 0.09, 'triangle', 0.1, 0.04); break; }
      case 'chest': this.noise(0.12, 0.35, 'lowpass', 900, 200); [659, 784, 988, 1319].forEach((f, i) => this.tone(f, f, 0.16, 'triangle', 0.18, 0.06 + i * 0.07)); break;
      case 'buff': this.tone(330, 990, 0.3, 'sine', 0.22); this.tone(660, 1320, 0.24, 'triangle', 0.14, 0.08); break;
      case 'pot': this.noise(0.18, 0.55, 'bandpass', 2400, 600); this.tone(420, 180, 0.12, 'triangle', 0.18); break;
      case 'orb': this.tone(880, 1760, 0.14, 'sine', 0.18); break;
      case 'death': [330, 262, 196, 131].forEach((f, i) => this.tone(f, f * 0.9, 0.34, 'sawtooth', 0.22, i * 0.16)); break;
    }
  }
}
