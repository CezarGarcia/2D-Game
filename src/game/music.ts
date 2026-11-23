/**
 * Música de fundo tocada na hora com WebAudio, sem arquivos de áudio. Um agendador acorda a cada 25 ms
 * e marca, no relógio do áudio, as notas dos próximos 0,15 s das partituras de src/game/tracks.ts,
 * em instrumentos feitos de osciladores, ruído, filtros e cordas dedilhadas.
 * Trocar de faixa faz um fade cruzado; o modo chefe entra na virada do compasso, sem perder o lugar na música.
 */
import { makeRng } from '../data/rng';
import { audioContext, loadVolumes } from './audio';
import { sfx } from './sfx';
import { PERCUSSION, composeSting, composeTrack, pluck, songSeconds, stepSeconds, type Inst, type Note, type Song, type StingId, type TrackId } from './tracks';

const LOOKAHEAD = 0.15;
const TICK_MS = 25;
/** Notas soando ao mesmo tempo, no máximo (a percussão passa um pouco disso, porque é curta). */
const MAX_VOICES = 40;
/** Ganho da música com o controle no máximo: fica abaixo dos efeitos. */
const MUSIC_GAIN = 0.7;

/** Volume de cada instrumento e se ele vai para o eco e a reverberação. */
const MIX: Record<Inst, { g: number; wet: boolean }> = {
  pifano: { g: 0.2, wet: true }, flauta: { g: 0.2, wet: true }, ocarina: { g: 0.24, wet: true },
  sanfona: { g: 0.13, wet: true }, bandoneon: { g: 0.15, wet: true },
  viola: { g: 0.5, wet: true }, violao: { g: 0.55, wet: true }, berimbau: { g: 0.42, wet: true },
  agua: { g: 0.16, wet: true }, sino: { g: 0.16, wet: true }, caixinha: { g: 0.14, wet: true },
  canto: { g: 0.2, wet: true }, clarim: { g: 0.12, wet: true },
  pad: { g: 0.05, wet: true }, coro: { g: 0.045, wet: true }, drone: { g: 0.09, wet: true },
  baixo: { g: 0.3, wet: false },
  zabumba: { g: 0.55, wet: false }, bacalhau: { g: 0.16, wet: false }, triangulo: { g: 0.07, wet: true },
  ganza: { g: 0.16, wet: false }, caxixi: { g: 0.18, wet: false }, atabaque: { g: 0.4, wet: true },
  tambor: { g: 0.5, wet: true }, alfaia: { g: 0.6, wet: true }, gongue: { g: 0.12, wet: true },
  caixa: { g: 0.18, wet: false }, pandeiro: { g: 0.14, wet: false }, palma: { g: 0.22, wet: true },
  bombo: { g: 0.5, wet: true }, gota: { g: 0.12, wet: true }, pio: { g: 0.06, wet: true }, coracao: { g: 0.5, wet: false },
};

/** Taxa das amostras de corda: metade da comum basta para cordas e gasta metade da memória. */
const STRING_RATE = 22050;
/** Cordas dedilhadas: quanto a corda segura o som, quanto agudo tem o ataque e quanto dura a amostra. */
const STRINGS: Partial<Record<Inst, { decay: number; bright: number; secs: number; octave: number }>> = {
  viola: { decay: 0.997, bright: 0.8, secs: 1.3, octave: 0.55 },
  violao: { decay: 0.996, bright: 0.42, secs: 1.5, octave: 0 },
  berimbau: { decay: 0.9985, bright: 0.6, secs: 1.2, octave: 0 },
};

/** Uma faixa tocando: onde está na partitura e os nós de som só dela (fade, eco). */
interface Play {
  song: Song;
  key: string;
  byStep: Note[][];
  total: number;
  dur: number;
  pos: number;
  next: number;
  out: GainNode;
  send: GainNode;
  nodes: AudioNode[];
  /** Para de marcar notas a partir deste instante. */
  stopAt: number;
  /** Desliga os nós depois deste instante (já deu tempo de a cauda sumir). */
  deadAt: number;
}

const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckG: GainNode | null = null;
  private mix: GainNode | null = null;
  private verb: ConvolverNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private strings = new Map<string, { buf: AudioBuffer; freq: number }>();
  private songs = new Map<string, Song>();
  private plays: Play[] = [];
  private current: Play | null = null;
  private want: { id: TrackId; boss: boolean } | null = null;
  private stingUntil = 0;
  private ends: number[] = [];
  private vol = loadVolumes().musica;
  private mute = false;

  /** Volume da música, de 0 a 1 (o controle das opções). */
  get volume(): number { return this.vol; }
  set volume(v: number) { this.vol = Math.max(0, Math.min(1, v)); this.applyLevel(); }

  /** Silencia sem mexer no volume escolhido (a tecla M). */
  get muted(): boolean { return this.mute; }
  set muted(m: boolean) { this.mute = m; this.applyLevel(); }

  /** Chame em todo gesto do jogador: cria o áudio na primeira vez e começa a faixa pedida. */
  unlock(): void {
    const c = audioContext();
    if (!c) return;
    if (!this.ctx) this.build(c);
    if (c.state === 'suspended') void c.resume().catch(() => undefined);
    this.apply();
  }

  /** Pede uma faixa. Se for a que já toca, nada muda; senão, fade cruzado. */
  play(id: TrackId): void {
    if (this.want?.id === id && !this.want.boss) return;
    this.want = { id, boss: false };
    this.apply();
  }

  /** Liga ou desliga a camada de chefe da faixa atual. */
  setBoss(on: boolean): void {
    if (!this.want || this.want.boss === on) return;
    this.want = { id: this.want.id, boss: on };
    this.apply();
  }

  /** Abaixa a música (pausa) ou devolve o volume. */
  duck(on: boolean): void {
    const c = this.ctx;
    if (c && this.duckG) this.duckG.gain.setTargetAtTime(on ? 0.3 : 1, c.currentTime, 0.12);
  }

  /** Vinheta de vitória ou derrota: a faixa some e a próxima só entra quando a vinheta acabar. */
  sting(kind: StingId): void {
    const c = this.ctx, root = this.current?.song.root ?? 60;
    this.want = null;
    if (!c || c.state !== 'running') return;
    if (this.current) { this.fadeOut(this.current, c.currentTime, 0.6); this.current = null; }
    const song = composeSting(kind, root), at = c.currentTime + 0.35;
    const p = this.start(song, kind, at, 0, 0.02);
    this.stingUntil = at + songSeconds(song);
    p.deadAt = this.stingUntil + 3;
  }

  /* ---------- montagem ---------- */

  private build(c: AudioContext): void {
    this.ctx = c;
    this.master = c.createGain();
    this.master.connect(c.destination);
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    comp.connect(this.master);
    this.duckG = c.createGain();
    this.duckG.connect(comp);
    this.mix = c.createGain();
    this.mix.connect(this.duckG);
    // reverberação: ruído que decai, gerado uma vez
    const rate = c.sampleRate, len = Math.floor(rate * 2.2), ir = c.createBuffer(2, len, rate), rng = makeRng(4242);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (rng() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    this.verb = c.createConvolver();
    this.verb.buffer = ir;
    const back = c.createGain();
    back.gain.value = 0.6;
    this.verb.connect(back); back.connect(this.duckG);
    this.noiseBuf = c.createBuffer(1, rate, rate);
    const nd = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rng() * 2 - 1;
    this.applyLevel();
    setInterval(() => this.tick(), TICK_MS);
  }

  private level(): number { return this.mute ? 0 : Math.pow(this.vol, 1.3) * MUSIC_GAIN; }

  private applyLevel(): void {
    if (this.ctx && this.master) this.master.gain.setTargetAtTime(this.level(), this.ctx.currentTime, 0.05);
  }

  private apply(): void {
    const c = this.ctx;
    if (!c || c.state === 'closed') return;
    const want = this.want, key = want ? want.id + (want.boss ? ':chefe' : '') : null;
    const old = this.current;
    if ((old?.key ?? null) === key) return;
    if (!want || !key) {
      if (old) this.fadeOut(old, c.currentTime, 1.2);
      this.current = null;
      return;
    }
    let song = this.songs.get(key);
    if (!song) { song = composeTrack(want.id, want.boss); this.songs.set(key, song); }
    if (old && old.key.split(':')[0] === want.id) {
      // mesma música, outra intensidade: troca na virada do compasso e continua do mesmo ponto
      const st = old.song.steps, left = (st - (old.pos % st)) % st;
      const at = Math.max(old.next + left * old.dur, c.currentTime + 0.03);
      const bar = Math.round((old.pos + left) / st);
      old.stopAt = at;
      this.fadeOut(old, at, 0.35);
      this.current = this.start(song, key, at, (bar * song.steps) % (song.steps * song.bars), 0.2);
    } else {
      if (old) this.fadeOut(old, c.currentTime, 1.6);
      const at = Math.max(c.currentTime + (old ? 0.5 : 0.05), this.stingUntil);
      this.current = this.start(song, key, at, 0, old ? 1.4 : 0.8);
    }
  }

  private start(song: Song, key: string, at: number, pos: number, fadeIn: number): Play {
    const c = this.ctx!, dur = stepSeconds(song), total = song.steps * song.bars;
    const out = c.createGain(), send = c.createGain();
    for (const g of [out, send]) {
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.setValueAtTime(0, at);
      g.gain.linearRampToValueAtTime(song.gain, at + fadeIn);
    }
    out.connect(this.mix!);
    const rv = c.createGain();
    rv.gain.value = song.reverb;
    send.connect(rv); rv.connect(this.verb!);
    // eco desta faixa, com o tempo casado ao andamento
    const em = c.createGain(), dl = c.createDelay(2), fb = c.createGain(), lp = c.createBiquadFilter();
    em.gain.value = song.echo.mix;
    dl.delayTime.value = Math.min(1.9, song.echo.steps * dur);
    fb.gain.value = song.echo.feedback;
    lp.type = 'lowpass'; lp.frequency.value = 2600;
    send.connect(em); em.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(this.mix!);
    const byStep: Note[][] = Array.from({ length: total }, () => []);
    for (const n of song.notes) byStep[n.s].push(n);
    const p: Play = { song, key, byStep, total, dur, pos, next: at, out, send, nodes: [out, send, rv, em, dl, fb, lp], stopAt: Infinity, deadAt: Infinity };
    this.plays.push(p);
    return p;
  }

  private fadeOut(p: Play, at: number, secs: number): void {
    for (const g of [p.out, p.send]) {
      g.gain.cancelScheduledValues(at);
      g.gain.setTargetAtTime(0, at, secs / 4);
    }
    p.stopAt = Math.min(p.stopAt, at + secs);
    p.deadAt = at + secs + 4;
  }

  /* ---------- agendador ---------- */

  private tick(): void {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const now = c.currentTime, horizon = now + LOOKAHEAD, on = this.level() > 0;
    for (const p of this.plays) {
      // a aba ficou para trás (o navegador segura o setInterval): pula sem tocar o que passou
      if (p.next < now - 0.25) { const k = Math.ceil((now - p.next) / p.dur); p.pos += k; p.next += k * p.dur; }
      while (p.next < horizon && p.next < p.stopAt) {
        if (p.song.once && p.pos >= p.total) { p.stopAt = 0; break; }
        const i = p.pos % p.total, t = p.next + (i % 2 ? p.song.swing * p.dur : 0);
        if (on) for (const n of p.byStep[i]) this.note(p, n, t + (n.d ?? 0) * p.dur);
        p.pos++;
        p.next += p.dur;
      }
    }
    this.plays = this.plays.filter((p) => {
      if (now < p.deadAt) return true;
      for (const n of p.nodes) n.disconnect();
      return false;
    });
  }

  private note(p: Play, n: Note, t: number): void {
    const now = this.ctx!.currentTime;
    this.ends = this.ends.filter((e) => e > now);
    const drum = PERCUSSION.has(n.inst);
    if (this.ends.length >= (drum ? MAX_VOICES + 8 : MAX_VOICES)) return;
    const mix = MIX[n.inst], dest: AudioNode[] = mix.wet ? [p.out, p.send] : [p.out];
    this.ends.push(this.voice(n.inst, t, n.len * p.dur, n.midi, n.vel * mix.g, dest));
  }

  /* ---------- peças dos instrumentos ---------- */

  private osc(type: OscillatorType, f: number, t: number, end: number, dest: AudioNode, detune = 0): OscillatorNode {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest);
    o.start(t); o.stop(end);
    return o;
  }

  private gain(v: number, dest: AudioNode): GainNode {
    const g = this.ctx!.createGain();
    g.gain.value = v;
    g.connect(dest);
    return g;
  }

  private filter(type: BiquadFilterType, f: number, q: number, dest: AudioNode): BiquadFilterNode {
    const fl = this.ctx!.createBiquadFilter();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    fl.connect(dest);
    return fl;
  }

  /** Envelope: sobe em `a`, cai para `sus` do pico, segura até o fim da nota e solta em `rel`. Devolve o nó e o fim do som. */
  private env(t: number, dur: number, a: number, peak: number, sus: number, rel: number, dests: AudioNode[]): { g: GainNode; end: number } {
    const g = this.ctx!.createGain(), p = g.gain, off = t + Math.max(dur, a);
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(peak, t + a);
    if (sus < 1) p.setTargetAtTime(peak * sus, t + a, 0.12);
    p.setTargetAtTime(0, off, rel / 3);
    for (const d of dests) g.connect(d);
    return { g, end: off + rel * 1.7 };
  }

  /** Golpe que só decai. */
  private perc(t: number, peak: number, decay: number, dests: AudioNode[]): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    for (const d of dests) g.connect(d);
    return g;
  }

  private noise(t: number, decay: number, v: number, type: BiquadFilterType, f: number, q: number, dests: AudioNode[]): number {
    const c = this.ctx!, src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    src.connect(this.filter(type, f, q, this.perc(t, v, decay, dests)));
    src.start(t, Math.random() * 0.8);
    src.stop(t + decay + 0.02);
    return t + decay;
  }

  /** Pele de tambor: seno que despenca de `f0` para `f1`. */
  private membrane(t: number, v: number, f0: number, f1: number, decay: number, dests: AudioNode[]): number {
    const o = this.osc('sine', f0, t, t + decay + 0.02, this.perc(t, v, decay, dests));
    o.frequency.exponentialRampToValueAtTime(f1, t + decay * 0.5);
    return t + decay;
  }

  private vibrato(o: OscillatorNode, t: number, end: number, rate: number, depth: number): void {
    const c = this.ctx!, lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = rate;
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(depth, t + 0.3);
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(t); lfo.stop(end);
  }

  private stringBuf(inst: Inst, midi: number): { buf: AudioBuffer; freq: number } {
    const id = `${inst}:${midi}`;
    let s = this.strings.get(id);
    if (!s) {
      const c = this.ctx!, o = STRINGS[inst]!, f = hz(midi), rate = STRING_RATE;
      const a = pluck(f, rate, o.secs, { decay: o.decay, bright: o.bright, seed: midi * 31 + inst.length });
      // a viola caipira tem cordas em pares: a de baixo vem com outra uma oitava acima
      const b = o.octave ? pluck(a.freq * 2 * 1.002, rate, o.secs, { decay: o.decay, bright: o.bright, seed: midi * 17 + 5 }) : null;
      const buf = c.createBuffer(1, a.data.length, rate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (a.data[i] + (b ? b.data[i] * o.octave : 0)) / (1 + o.octave * 0.6);
      s = { buf, freq: a.freq };
      this.strings.set(id, s);
    }
    return s;
  }

  /** Toca uma nota no instrumento e devolve quando o som acaba. */
  private voice(inst: Inst, t: number, dur: number, midi: number, v: number, dest: AudioNode[]): number {
    const c = this.ctx!, f = hz(midi);
    switch (inst) {
      case 'pifano': case 'flauta': case 'ocarina': {
        const pif = inst === 'pifano', oca = inst === 'ocarina';
        const e = this.env(t, dur, pif ? 0.025 : 0.05, v, 0.85, pif ? 0.08 : 0.16, dest);
        const o = this.osc(oca ? 'sine' : 'triangle', f, t, e.end, e.g);
        this.osc('sine', f * 2, t, e.end, this.gain(pif ? 0.22 : 0.08, e.g));
        if (dur > 0.25) this.vibrato(o, t + 0.12, e.end, pif ? 6 : 5, f * (oca ? 0.005 : 0.008));
        this.noise(t, 0.08, v * (oca ? 0.25 : 0.35), 'bandpass', Math.min(9000, f * 2), 1.2, dest);
        return e.end;
      }
      case 'sanfona': case 'bandoneon': {
        const band = inst === 'bandoneon';
        const e = this.env(t, dur, band ? 0.06 : 0.025, v, 0.9, band ? 0.14 : 0.07, dest);
        const pre = this.gain(0.4, this.filter('lowpass', band ? 1400 : Math.min(5000, 1900 + f), 0.8, e.g));
        if (band) { this.osc('square', f, t, e.end, pre, -6); this.osc('sawtooth', f, t, e.end, pre, 6); }
        else { this.osc('sawtooth', f, t, e.end, pre, -8); this.osc('sawtooth', f, t, e.end, pre, 8); this.osc('square', f / 2, t, e.end, this.gain(0.35, pre)); }
        return e.end;
      }
      case 'viola': case 'violao': case 'berimbau': {
        const s = this.stringBuf(inst, midi), src = c.createBufferSource(), rate = f / s.freq;
        src.buffer = s.buf;
        const g = c.createGain(), off = t + Math.max(dur, 0.3), end = Math.min(t + s.buf.duration / rate, off + 0.6);
        g.gain.setValueAtTime(v, t);
        g.gain.setTargetAtTime(0, off, 0.15);
        for (const d of dest) g.connect(d);
        if (inst === 'berimbau') {
          // a cabaça abrindo e fechando: um pico de filtro que corre, e a corda que sobe um pouquinho no ataque
          const pk = this.filter('peaking', 380, 4, g);
          pk.gain.value = 12;
          pk.frequency.setValueAtTime(380, t);
          pk.frequency.exponentialRampToValueAtTime(1500, t + 0.28);
          src.connect(pk);
          src.playbackRate.setValueAtTime(rate * 0.985, t);
          src.playbackRate.linearRampToValueAtTime(rate, t + 0.05);
        } else {
          src.playbackRate.value = rate;
          src.connect(g);
        }
        src.start(t); src.stop(end);
        return end;
      }
      case 'agua': case 'sino': case 'caixinha': {
        const ratio = inst === 'agua' ? 2 : inst === 'sino' ? 3.5 : 4, idx = inst === 'agua' ? 2.2 : inst === 'sino' ? 3 : 1.6;
        const decay = inst === 'agua' ? Math.min(1.6, dur + 0.5) : inst === 'sino' ? 3.2 : 1.2;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
        for (const d of dest) g.connect(d);
        const car = this.osc('sine', f, t, t + decay, g), mod = c.createOscillator(), mg = c.createGain();
        mod.frequency.value = f * ratio;
        mg.gain.setValueAtTime(f * idx, t);
        mg.gain.exponentialRampToValueAtTime(f * 0.05 + 1, t + decay * 0.5);
        mod.connect(mg); mg.connect(car.frequency);
        mod.start(t); mod.stop(t + decay);
        return t + decay;
      }
      case 'canto': {
        const e = this.env(t, dur, 0.14, v, 0.9, 0.35, dest), lp = this.filter('lowpass', 1500, 0.7, e.g);
        const o = this.osc('triangle', f, t, e.end, lp);
        this.osc('sine', f, t, e.end, this.gain(0.6, lp), 5);
        if (dur > 0.3) this.vibrato(o, t + 0.15, e.end, 5, f * 0.009);
        return e.end;
      }
      case 'clarim': {
        const e = this.env(t, dur, 0.03, v, 0.85, 0.1, dest), lp = this.filter('lowpass', f * 1.2, 1.2, e.g);
        lp.frequency.setValueAtTime(f * 1.2, t);
        lp.frequency.linearRampToValueAtTime(f * 6 + 600, t + 0.06);
        lp.frequency.setTargetAtTime(f * 3 + 300, t + 0.06, 0.15);
        this.osc('sawtooth', f, t, e.end, lp, -5); this.osc('sawtooth', f, t, e.end, lp, 5);
        return e.end;
      }
      case 'pad': case 'coro': case 'drone': {
        const coro = inst === 'coro', drone = inst === 'drone';
        const e = this.env(t, dur, drone ? 1 : coro ? 0.5 : 0.3, v, 1, drone ? 1.5 : 0.9, dest);
        const lp = this.filter('lowpass', drone ? 420 : coro ? 1700 : 1100, 0.5, e.g), pre = this.gain(0.5, lp);
        for (const dt of coro ? [-14, 0, 14] : drone ? [-6, 6] : [-9, 9]) this.osc('sawtooth', f, t, e.end, pre, dt);
        if (drone) {
          const lfo = c.createOscillator(), lg = c.createGain();
          lfo.frequency.value = 0.15; lg.gain.value = 160;
          lfo.connect(lg); lg.connect(lp.frequency);
          lfo.start(t); lfo.stop(e.end);
        }
        return e.end;
      }
      case 'baixo': {
        const e = this.env(t, dur, 0.006, v, 0.55, 0.08, dest), lp = this.filter('lowpass', 700, 0.7, e.g);
        this.osc('triangle', f, t, e.end, lp);
        this.osc('sine', f, t, e.end, this.gain(0.7, lp));
        return e.end;
      }
      case 'zabumba': this.noise(t, 0.03, v * 0.4, 'lowpass', 900, 0.7, dest); return this.membrane(t, v, 110, 48, 0.38, dest);
      case 'tambor': this.noise(t, 0.04, v * 0.25, 'bandpass', 600, 1, dest); return this.membrane(t, v, 95, 55, 0.45, dest);
      case 'atabaque': this.noise(t, 0.03, v * 0.4, 'bandpass', 1800, 1, dest); return this.membrane(t, v, 200, 120, 0.25, dest);
      case 'alfaia': this.noise(t, 0.09, v * 0.6, 'lowpass', 500, 0.7, dest); return this.membrane(t, v, 78, 40, 0.6, dest);
      case 'bombo': this.noise(t, 0.05, v * 0.3, 'lowpass', 300, 0.7, dest); return this.membrane(t, v, 68, 48, 0.5, dest);
      case 'coracao': this.membrane(t, v, 60, 40, 0.25, dest); return this.membrane(t + 0.2, v * 0.7, 55, 38, 0.3, dest);
      case 'bacalhau': this.osc('triangle', 820, t, t + 0.05, this.perc(t, v * 0.4, 0.03, dest)); return this.noise(t, 0.045, v, 'highpass', 2500, 0.7, dest);
      case 'caixa': this.osc('triangle', 185, t, t + 0.08, this.perc(t, v * 0.5, 0.06, dest)); return this.noise(t, 0.13, v, 'bandpass', 3200, 0.8, dest);
      case 'pandeiro': if (midi === 1) this.membrane(t, v, 170, 130, 0.1, dest); return this.noise(t, 0.1, v * 0.8, 'highpass', 6500, 0.7, dest);
      case 'palma':
        this.noise(t, 0.015, v, 'bandpass', 1200, 1.3, dest);
        this.noise(t + 0.011, 0.015, v, 'bandpass', 1200, 1.3, dest);
        return this.noise(t + 0.022, 0.09, v, 'bandpass', 1200, 1.3, dest);
      case 'triangulo': {
        const decay = midi === 1 ? 0.6 : 0.09, g = this.perc(t, v, decay, dest);
        this.osc('sine', 4200, t, t + decay, g); this.osc('sine', 6150, t, t + decay, this.gain(0.6, g));
        return t + decay;
      }
      case 'ganza': return this.noise(t, 0.045, v, 'bandpass', 7500, 1.5, dest);
      case 'caxixi': return this.noise(t, 0.06, v, 'bandpass', 5200, 2, dest);
      case 'gongue': {
        const fr = midi === 1 ? 720 : 480, g = this.perc(t, v, 0.35, dest);
        this.osc('sine', fr, t, t + 0.36, g); this.osc('sine', fr * 2.7, t, t + 0.2, this.gain(0.4, g));
        return t + 0.35;
      }
      case 'gota': {
        const o = this.osc('sine', f, t, t + 0.14, this.perc(t, v, 0.12, dest));
        o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.05);
        return t + 0.12;
      }
      case 'pio': {
        for (const dt of [0, 0.13]) {
          const o = this.osc('sine', f, t + dt, t + dt + 0.11, this.perc(t + dt, v, 0.1, dest));
          o.frequency.linearRampToValueAtTime(f * 1.5, t + dt + 0.05);
          o.frequency.linearRampToValueAtTime(f * 1.15, t + dt + 0.1);
        }
        return t + 0.23;
      }
    }
  }
}

export const music = new Music();

/** Libera os efeitos e a música no primeiro gesto do jogador (pode chamar sempre). */
export function unlockAudio(): void {
  sfx.unlock();
  music.unlock();
}
