/**
 * Partituras da música de fundo, geradas com semente: cada faixa tem escala, progressão de acordes,
 * uma melodia em frases que voltam com variação e o ritmo de uma música regional brasileira.
 * Nada aqui toca som nem conhece o navegador; src/game/music.ts transforma as notas em áudio.
 */
import { makeRng, pick, type Rng } from '../data/rng';
import { isTowerId } from '../data/tower';

export const TRACKS = ['acampamento', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'cap6', 'cap7', 'cap8', 'torre'] as const;
export type TrackId = (typeof TRACKS)[number];
export type StingId = 'vitoria' | 'derrota';

/** Instrumentos sintetizados (o som de cada um mora em music.ts). */
export type Inst =
  | 'pifano' | 'flauta' | 'ocarina' | 'sanfona' | 'bandoneon' | 'viola' | 'violao' | 'berimbau'
  | 'agua' | 'sino' | 'caixinha' | 'canto' | 'clarim' | 'pad' | 'coro' | 'drone' | 'baixo'
  | 'zabumba' | 'bacalhau' | 'triangulo' | 'ganza' | 'caxixi' | 'atabaque' | 'tambor' | 'alfaia'
  | 'gongue' | 'caixa' | 'pandeiro' | 'palma' | 'bombo' | 'gota' | 'pio' | 'coracao';

/** Percussão e efeitos: o `midi` escolhe a variação do toque (ou a altura do pingo e do pio), não uma nota da escala. */
export const PERCUSSION: ReadonlySet<Inst> = new Set<Inst>([
  'zabumba', 'bacalhau', 'triangulo', 'ganza', 'caxixi', 'atabaque', 'tambor', 'alfaia', 'gongue', 'caixa', 'pandeiro', 'palma', 'bombo', 'gota', 'pio', 'coracao',
]);

/** Uma nota: começa no passo `s` (mais `d` de passo, para o rasqueado) e dura `len` passos. */
export interface Note { s: number; len: number; inst: Inst; midi: number; vel: number; d?: number }

export interface Song {
  key: string;
  bpm: number;
  /** Passos por compasso: 16 (semicolcheias em 4/4) ou 12 (em 6/8). */
  steps: number;
  bars: number;
  /** Atraso dos passos ímpares, em fração do passo: o balanço. */
  swing: number;
  /** Eco: atraso em passos, quanto volta e quanto entra. */
  echo: { steps: number; feedback: number; mix: number };
  /** Quanto vai para a reverberação. */
  reverb: number;
  /** Ajuste de volume da faixa, para todas soarem parecido. */
  gain: number;
  /** Tônica em MIDI e a escala, em semitons a partir dela. */
  root: number;
  scale: readonly number[];
  /** Vinheta: toca uma vez e para. */
  once: boolean;
  notes: Note[];
}

/** Duração de um passo, em segundos. */
export const stepSeconds = (song: Song): number => 60 / song.bpm / 4;

/** Até onde a última nota soa, em segundos (sem a cauda do eco). */
export function songSeconds(song: Song): number {
  let end = 0;
  for (const n of song.notes) end = Math.max(end, n.s + n.len);
  return end * stepSeconds(song);
}

export const MODES = {
  jonio: [0, 2, 4, 5, 7, 9, 11],
  dorico: [0, 2, 3, 5, 7, 9, 10],
  frigio: [0, 1, 3, 5, 7, 8, 10],
  lidio: [0, 2, 4, 6, 7, 9, 11],
  mixolidio: [0, 2, 4, 5, 7, 9, 10],
  eolio: [0, 2, 3, 5, 7, 8, 10],
  menorHarmonica: [0, 2, 3, 5, 7, 8, 11],
  tonsInteiros: [0, 2, 4, 6, 8, 10],
} as const;

const BARS = 16;

/* ---------- harmonia: graus da escala, acordes e vozes ---------- */

class Harm {
  constructor(readonly root: number, readonly mode: readonly number[], readonly prog: readonly number[], readonly steps: number) {}

  get n(): number { return this.mode.length; }

  /** Grau (pode passar da oitava ou ser negativo) em MIDI. */
  midi(deg: number): number {
    const n = this.n, o = Math.floor(deg / n);
    return this.root + 12 * o + this.mode[deg - o * n];
  }

  /** Grau da fundamental do acorde do compasso. */
  chord(bar: number): number { return this.prog[bar % this.prog.length]; }

  isTone(deg: number, bar: number): boolean {
    const n = this.n, r = (((deg - this.chord(bar)) % n) + n) % n;
    return r === 0 || r === 2 || r === 4;
  }

  /** Nota do acorde mais perto do grau (na dúvida, a de baixo). */
  snap(deg: number, bar: number): number {
    for (let d = 0; d < this.n; d++) {
      if (this.isTone(deg - d, bar)) return deg - d;
      if (this.isTone(deg + d, bar)) return deg + d;
    }
    return deg;
  }

  /** O grau em MIDI, na oitava mais perto de `near`. */
  near(deg: number, near: number): number {
    let m = this.midi(deg);
    while (m < near - 6) m += 12;
    while (m >= near + 6) m -= 12;
    return m;
  }

  /** Acorde do compasso em posição fechada, a partir de `lo`. */
  voicing(bar: number, lo: number, seventh = false): number[] {
    const c = this.chord(bar), degs = seventh ? [c, c + 2, c + 4, c + 6] : [c, c + 2, c + 4];
    return degs.map((d) => {
      let m = this.midi(d);
      while (m < lo) m += 12;
      while (m >= lo + 12) m -= 12;
      return m;
    }).sort((a, b) => a - b);
  }

  /** Fundamental do acorde entre `lo` e uma oitava acima. */
  bass(bar: number, lo = 36): number {
    let m = this.midi(this.chord(bar));
    while (m < lo) m += 12;
    while (m >= lo + 12) m -= 12;
    return m;
  }

  /** Quinta do acorde, logo acima da fundamental do baixo. */
  fifth(bar: number, lo = 36): number {
    let m = this.midi(this.chord(bar) + 4);
    const r = this.bass(bar, lo);
    while (m <= r) m += 12;
    while (m > r + 12) m -= 12;
    return m;
  }
}

/* ---------- melodia: motivos de dois compassos, variação e cadência ---------- */

interface Mel { s: number; len: number; deg: number }
/** Um compasso de ritmo: [passo, duração]. */
type Rhythm = readonly (readonly [number, number])[];

const strong = (s: number, steps: number): boolean => s % (steps / 2) === 0;

/** Motivo de dois compassos: graus conjuntos com saltos raros, e nota do acorde nos tempos fortes. */
function motif(rng: Rng, h: Harm, bar: number, bank: readonly Rhythm[], start: number, center: number): Mel[] {
  const out: Mel[] = [];
  let deg = start, dir = rng() < 0.5 ? 1 : -1;
  for (let b = 0; b < 2; b++) {
    for (const [s, len] of pick(rng, bank)) {
      if (out.length) {
        const roll = rng();
        const mv = roll < 0.08 ? 0 : roll < 0.66 ? 1 : roll < 0.88 ? 2 : rng() < 0.5 ? 3 : 4;
        if (rng() < 0.3) dir = -dir;
        // a frase não sai de perto do centro: se fosse passar, vira para o outro lado
        if (deg + mv * dir > center + 5 || deg + mv * dir < center - 3) dir = -dir;
        deg += mv * dir;
      }
      if (!out.length || strong(s, h.steps)) deg = h.snap(deg, bar + b);
      out.push({ s: b * h.steps + s, len, deg });
    }
  }
  return out;
}

/** Põe o motivo a partir do compasso `bar`, acertando os tempos fortes com os acordes de lá. */
function place(mel: Mel[], bar: number, h: Harm): Mel[] {
  return mel.map((n) => ({
    s: bar * h.steps + n.s,
    len: n.len,
    deg: strong(n.s % h.steps, h.steps) ? h.snap(n.deg, bar + Math.floor(n.s / h.steps)) : n.deg,
  }));
}

/** A mesma frase com uma ou duas mudanças: ornamento, outro final ou uma síncope. */
function vary(rng: Rng, mel: Mel[]): Mel[] {
  const out = mel.map((n) => ({ ...n }));
  const ops = 1 + (rng() < 0.5 ? 1 : 0);
  for (let i = 0; i < ops; i++) {
    const r = rng();
    if (r < 0.35) {
      let k = 0;
      out.forEach((n, j) => { if (n.len > out[k].len) k = j; });
      const n = out[k];
      if (n.len >= 2) {
        const half = Math.floor(n.len / 2);
        out.splice(k + 1, 0, { s: n.s + half, len: n.len - half, deg: n.deg + (rng() < 0.5 ? 1 : -1) });
        n.len = half;
      }
    } else if (r < 0.7) {
      const k = out.length - 1 - Math.floor(rng() * Math.min(2, out.length));
      out[k].deg += pick(rng, [-2, -1, 1, 2]);
    } else {
      const cand = out.map((_, j) => j).filter((j) => j > 0 && (out[j - 1].s + out[j - 1].len < out[j].s || out[j - 1].len >= 2));
      if (cand.length) {
        const j = pick(rng, cand), prev = out[j - 1];
        if (prev.s + prev.len >= out[j].s) prev.len -= 1;
        out[j].s -= 1; out[j].len += 1;
      }
    }
  }
  return out;
}

/** Fecha a frase na fundamental do último acorde, segurando até perto do fim do compasso `endBar`. */
function cadence(mel: Mel[], h: Harm, endBar: number): Mel[] {
  const last = mel[mel.length - 1];
  if (!last) return mel;
  const c = h.chord(endBar - 1), k = Math.round((last.deg - c) / h.n);
  last.deg = c + k * h.n;
  last.len = Math.max(last.len, endBar * h.steps - 2 - last.s);
  return mel;
}

/** Desloca a melodia de oitava até caber entre `lo` e `hi`; a nota que ainda sobrar muda de oitava sozinha. */
function fit(mel: Mel[], h: Harm, lo: number, hi: number): Mel[] {
  let shift = 0;
  const range = () => {
    let a = Infinity, b = -Infinity;
    for (const n of mel) { const m = h.midi(n.deg + shift); a = Math.min(a, m); b = Math.max(b, m); }
    return [a, b];
  };
  for (let i = 0; i < 4; i++) {
    const [a, b] = range();
    if (b > hi) shift -= h.n;
    else if (a < lo) shift += h.n;
    else break;
  }
  return mel.map((n) => {
    let deg = n.deg + shift;
    while (h.midi(deg) > hi) deg -= h.n;
    while (h.midi(deg) < lo) deg += h.n;
    return { ...n, deg };
  });
}

/**
 * Melodia de 16 compassos na forma A A' B A (cadência), duas vezes. Na segunda volta cada frase
 * volta com outra variação, para a repetição não cansar.
 */
function tune(rng: Rng, h: Harm, bank: readonly Rhythm[], lo: number, hi: number): Mel[] {
  const center = Math.floor(rng() * 3);
  const start = h.snap(center + Math.floor(rng() * 3), 0);
  const A = motif(rng, h, 0, bank, start, center);
  const B = motif(rng, h, 4, bank, start + 2 + Math.floor(rng() * 2), center + 2);
  const A1 = vary(rng, A), A2 = vary(rng, A), A3 = vary(rng, A1), B1 = vary(rng, B);
  return fit([
    ...place(A, 0, h), ...place(A1, 2, h), ...place(B, 4, h), ...cadence(place(A, 6, h), h, 8),
    ...place(A2, 8, h), ...place(A3, 10, h), ...place(B1, 12, h), ...cadence(place(A2, 14, h), h, 16),
  ], h, lo, hi);
}

/* ---------- partitura ---------- */

class Score {
  notes: Note[] = [];
  constructor(readonly steps: number, readonly bars: number, readonly rng: Rng) {}

  get total(): number { return this.steps * this.bars; }

  add(s: number, len: number, inst: Inst, midi: number, vel: number, d?: number): void {
    if (s < 0 || s >= this.total || len <= 0 || vel <= 0) return;
    const n: Note = { s, len, inst, midi, vel: Math.round(Math.min(1, vel) * 1000) / 1000 };
    if (d) n.d = d;
    this.notes.push(n);
  }

  /** Repete um padrão de toques em todos os compassos (ou em `bars`), com um pouco de variação na força. */
  drum(inst: Inst, pattern: readonly (readonly [number, number])[], midi = 0, bars?: (b: number) => boolean): void {
    for (let b = 0; b < this.bars; b++) {
      if (bars && !bars(b)) continue;
      for (const [s, v] of pattern) this.add(b * this.steps + s, 1, inst, midi, v * (0.9 + this.rng() * 0.2));
    }
  }

  /** Melodia em notas, com acento leve nos tempos fortes. */
  melody(mel: Mel[], h: Harm, inst: Inst, vel: number, keep: (n: Mel) => boolean = () => true): void {
    for (const n of mel) if (keep(n)) this.add(n.s, n.len, inst, h.midi(n.deg), vel * (strong(n.s % h.steps, h.steps) ? 1 : 0.88) * (0.94 + this.rng() * 0.12));
  }

  /** Acorde rasqueado: as cordas soam uma depois da outra, para baixo ou para cima. */
  strum(s: number, len: number, inst: Inst, notes: number[], vel: number, up = false): void {
    const ord = up ? notes.slice().reverse() : notes;
    ord.forEach((m, i) => this.add(s, len, inst, m, vel * (up ? 0.8 : 1), i * 0.09));
  }
}

const R16 = {
  calma: [[[0, 6], [6, 2], [8, 8]], [[0, 4], [4, 4], [8, 4], [12, 4]], [[0, 8], [8, 4], [12, 4]], [[2, 2], [4, 4], [8, 6], [14, 2]], [[0, 3], [3, 3], [6, 2], [8, 8]], [[0, 12], [12, 4]]],
  mata: [[[0, 6], [6, 1], [7, 1], [8, 8]], [[0, 4], [4, 4], [8, 6], [14, 2]], [[0, 2], [2, 2], [4, 4], [8, 8]], [[0, 8], [8, 4], [12, 2], [14, 2]], [[0, 12], [12, 4]]],
  baiao: [[[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 4]], [[0, 2], [2, 2], [4, 2], [6, 2], [8, 3], [11, 5]], [[0, 3], [3, 5], [8, 3], [11, 3], [14, 2]], [[2, 2], [4, 2], [6, 2], [8, 4], [12, 2], [14, 2]], [[0, 6], [6, 2], [8, 2], [10, 6]]],
  moda: [[[0, 4], [4, 2], [6, 2], [8, 4], [12, 4]], [[0, 2], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]], [[0, 6], [6, 2], [8, 8]], [[0, 3], [3, 3], [6, 6], [12, 4]]],
  selva: [[[0, 4], [4, 4], [8, 8]], [[0, 6], [6, 2], [8, 8]], [[0, 2], [2, 6], [8, 4], [12, 4]], [[0, 12], [12, 2], [14, 2]]],
  milonga: [[[0, 3], [3, 3], [6, 2], [8, 8]], [[0, 6], [6, 6], [12, 4]], [[0, 2], [2, 1], [3, 3], [6, 2], [8, 4], [12, 4]], [[0, 8], [8, 2], [10, 2], [12, 4]], [[3, 3], [6, 2], [8, 8]]],
  esparsa: [[[0, 16]], [[0, 8], [12, 4]], [[4, 12]], [[0, 6], [8, 8]]],
  maracatu: [[[0, 3], [3, 3], [6, 2], [8, 4], [12, 4]], [[0, 4], [4, 2], [6, 2], [8, 6], [14, 2]], [[0, 2], [2, 2], [4, 4], [8, 3], [11, 5]], [[0, 8], [8, 8]]],
} satisfies Record<string, Rhythm[]>;
const R12: Rhythm[] = [[[0, 6], [6, 6]], [[0, 4], [4, 2], [6, 6]], [[0, 2], [2, 2], [4, 2], [6, 6]], [[0, 12]], [[0, 3], [3, 3], [6, 4], [10, 2]]];

interface Base {
  bpm: number; steps: number; swing: number; root: number; scale: readonly number[];
  echo: Song['echo']; reverb: number;
  gain?: number;
  /** Bumbo e caixa da camada de chefe. */
  kick: Inst; snare: Inst;
}

type Arranger = (sc: Score, boss: boolean) => { h: Harm; base: Base };

/* ---------- as faixas ---------- */

const ARRANGERS: Record<TrackId, Arranger> = {
  /** Fogueira do acampamento: berimbau no toque de Angola, viola dedilhada e pandeiro leve. */
  acampamento: (sc) => {
    const h = new Harm(50, MODES.jonio, [0, 3, 0, 4, 5, 3, 4, 0], 16);
    const tune1 = tune(sc.rng, h, R16.calma, 64, 81);
    sc.drum('caxixi', [[0, 0.35], [2, 0.25], [8, 0.35], [10, 0.25]]);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16, v = h.voicing(b, 55);
      sc.add(at + 4, 2, 'berimbau', h.root, 0.7); sc.add(at + 6, 2, 'berimbau', h.root + 2, 0.55);
      sc.add(at + 12, 2, 'berimbau', h.root, 0.7); sc.add(at + 14, 2, 'berimbau', h.root + 2, b % 4 === 3 ? 0.7 : 0.5);
      if (b % 4 === 3) sc.add(at + 13, 1, 'berimbau', h.root + 2, 0.4);
      [0, 3, 6, 8, 11, 14].forEach((s, i) => sc.add(at + s, 3, 'viola', v[[0, 1, 2, 1, 2, 1][i]], i === 0 ? 0.5 : 0.36));
      sc.add(at, 6, 'baixo', h.bass(b, 38), 0.42); sc.add(at + 10, 4, 'baixo', h.bass(b, 38), 0.3);
    }
    sc.drum('pandeiro', [[2, 0.15], [4, 0.35], [6, 0.15], [10, 0.15], [12, 0.35], [14, 0.15]]);
    sc.drum('atabaque', [[0, 0.4], [10, 0.28]]);
    // na primeira volta a viola canta; na segunda, a flauta
    sc.melody(tune1, h, 'viola', 0.55, (n) => n.s < 8 * 16);
    sc.melody(tune1, h, 'flauta', 0.5, (n) => n.s >= 8 * 16);
    return { h, base: { bpm: 84, steps: 16, swing: 0.1, root: h.root, scale: h.mode, echo: { steps: 6, feedback: 0.25, mix: 0.15 }, reverb: 0.3, kick: 'tambor', snare: 'caixa' } };
  },

  /** Mata Atlântica: pífano em dórico, atabaque e ganzá, passarinhos ao longe. */
  cap1: (sc, boss) => {
    const h = new Harm(52, MODES.dorico, [0, 0, 6, 0, 3, 3, 6, 4], 16);
    sc.melody(tune(sc.rng, h, R16.mata, 74, 91), h, 'pifano', 0.6);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16;
      for (const m of h.voicing(b, 52)) sc.add(at, 16, 'pad', m, 0.45);
      if (b % 4 === 0) sc.add(at, 64, 'drone', 40, 0.4);
      if (!boss) { sc.add(at, 6, 'baixo', h.bass(b, 36), 0.4); sc.add(at + 10, 4, 'baixo', h.bass(b, 36), 0.3); }
    }
    sc.drum('ganza', [[0, 0.22], [2, 0.12], [4, 0.2], [6, 0.12], [8, 0.22], [10, 0.12], [12, 0.2], [14, 0.12]]);
    sc.drum('atabaque', [[0, 0.5], [7, 0.3], [10, 0.42]]);
    sc.drum('atabaque', [[14, 0.3], [15, 0.36]], 0, (b) => b % 4 === 3);
    for (let i = 0; i < 6; i++) sc.add(Math.floor(sc.rng() * sc.total), 1, 'pio', 93 + Math.floor(sc.rng() * 8), 0.25 + sc.rng() * 0.15);
    return { h, base: { bpm: 88, steps: 16, swing: 0.06, root: h.root, scale: h.mode, echo: { steps: 6, feedback: 0.35, mix: 0.3 }, reverb: 0.4, kick: 'tambor', snare: 'caixa' } };
  },

  /** Rios do Norte: 6/8 em lídio, arpejo que corre como água e a voz da Iara. */
  cap2: (sc, boss) => {
    const h = new Harm(50, MODES.lidio, [0, 1, 0, 1, 5, 1, 4, 0], 12);
    sc.melody(tune(sc.rng, h, R12, 66, 83), h, 'canto', 0.55);
    const up = [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1], down = [6, 5, 4, 3, 2, 1, 0, 1, 2, 3, 4, 5];
    for (let b = 0; b < BARS; b++) {
      const at = b * 12, v = h.voicing(b, 62, true), L = [...v, v[0] + 12, v[1] + 12, v[2] + 12];
      (b < 8 ? up : down).forEach((k, i) => sc.add(at + i, 2, 'agua', L[k], i % 6 === 0 ? 0.42 : 0.3));
      for (const m of h.voicing(b, 55)) sc.add(at, 12, 'coro', m, 0.3);
      if (!boss) { sc.add(at, 5, 'baixo', h.bass(b, 38), 0.4); sc.add(at + 6, 5, 'baixo', h.bass(b, 38), 0.28); }
      if (sc.rng() < 0.6) sc.add(at + Math.floor(sc.rng() * 12), 1, 'gota', 84 + Math.floor(sc.rng() * 12), 0.3);
    }
    sc.drum('ganza', [[0, 0.14], [3, 0.08], [6, 0.12], [9, 0.08]]);
    return { h, base: { bpm: 92, steps: 12, swing: 0, root: h.root, scale: h.mode, echo: { steps: 3, feedback: 0.4, mix: 0.35 }, reverb: 0.45, kick: 'tambor', snare: 'caixa' } };
  },

  /** Sertão: baião em mixolídio, zabumba, triângulo e sanfona. */
  cap3: (sc, boss) => {
    const h = new Harm(55, MODES.mixolidio, [0, 0, 6, 0, 3, 3, 6, 0, 0, 0, 6, 0, 3, 4, 6, 0], 16);
    sc.melody(tune(sc.rng, h, R16.baiao, 67, 86), h, 'sanfona', 0.55);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16, r = h.bass(b, 36), f = h.fifth(b, 36);
      if (!boss) { sc.add(at, 3, 'baixo', r, 0.55); sc.add(at + 3, 5, 'baixo', f, 0.42); sc.add(at + 8, 3, 'baixo', r, 0.5); sc.add(at + 11, 3, 'baixo', f, 0.4); }
      const v = h.voicing(b, 55);
      for (const s of [4, 10, 12]) for (const m of v) sc.add(at + s, s === 10 ? 1 : 2, 'sanfona', m, 0.16);
    }
    sc.drum('zabumba', [[0, 1], [3, 0.72], [8, 0.95], [11, 0.68]]);
    sc.drum('zabumba', [[14, 0.55]], 0, (b) => b % 4 === 3);
    sc.drum('bacalhau', [[2, 0.4], [4, 0.6], [6, 0.4], [10, 0.4], [12, 0.6], [14, 0.4]]);
    for (let s = 0; s < 16; s++) sc.drum('triangulo', [[s, s % 4 === 2 ? 0.34 : s % 4 === 0 ? 0.24 : 0.16]], s % 4 === 2 ? 1 : 0);
    return { h, base: { bpm: 116, steps: 16, swing: 0.04, root: h.root, scale: h.mode, echo: { steps: 3, feedback: 0.15, mix: 0.08 }, reverb: 0.2, kick: 'zabumba', snare: 'bacalhau' } };
  },

  /** Cerrado: moda de viola em terças, rasqueado, palmas e sapateado de cateretê. */
  cap4: (sc, boss) => {
    const h = new Harm(57, MODES.jonio, [0, 3, 4, 0, 0, 5, 4, 0, 0, 3, 0, 4, 5, 3, 4, 0], 16);
    const mel = tune(sc.rng, h, R16.moda, 66, 83);
    sc.melody(mel, h, 'viola', 0.62);
    sc.melody(mel.map((n) => ({ ...n, deg: n.deg - 2 })), h, 'viola', 0.46);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16, v = h.voicing(b, 52);
      ([[0, 0.5, false], [4, 0.32, true], [6, 0.4, false], [8, 0.5, false], [12, 0.32, true], [14, 0.4, false]] as const)
        .forEach(([s, vel, upStroke]) => sc.strum(at + s, 2, 'viola', v, vel * 0.55, upStroke));
      if (!boss) { sc.add(at, 6, 'violao', h.bass(b, 40), 0.55); sc.add(at + 8, 6, 'violao', h.fifth(b, 40), 0.45); }
    }
    sc.drum('palma', [[4, 0.42], [12, 0.42]]);
    sc.drum('palma', [[10, 0.22]], 0, (b) => b % 2 === 1);
    sc.drum('zabumba', [[0, 0.32], [2, 0.18], [8, 0.32], [10, 0.18]]);
    return { h, base: { bpm: 100, steps: 16, swing: 0.12, root: h.root, scale: h.mode, echo: { steps: 4, feedback: 0.2, mix: 0.12 }, reverb: 0.25, gain: 1.4, kick: 'zabumba', snare: 'palma' } };
  },

  /** Selva Profunda: frígio, bordão grave, tambores tribais e uma ocarina no escuro. */
  cap5: (sc, boss) => {
    const h = new Harm(50, MODES.frigio, [0, 0, 1, 0, 0, 6, 1, 0], 16);
    // a melodia só entra depois de quatro compassos de tambor
    sc.melody(tune(sc.rng, h, R16.selva, 62, 79), h, 'ocarina', 0.6, (n) => n.s >= 4 * 16);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16;
      if (b % 4 === 0) { sc.add(at, 64, 'drone', 38, 0.55); sc.add(at, 64, 'drone', 45, 0.32); }
      if (!boss) { sc.add(at, 3, 'baixo', h.bass(b, 36), 0.45); sc.add(at + 6, 2, 'baixo', h.bass(b, 36), 0.35); }
    }
    sc.drum('tambor', [[0, 0.9], [3, 0.5], [6, 0.7], [10, 0.6], [12, 0.8]]);
    sc.drum('atabaque', [[2, 0.3], [5, 0.25], [8, 0.45], [11, 0.3], [14, 0.42], [15, 0.32]], 0, (b) => b % 4 !== 3);
    sc.drum('atabaque', [[2, 0.3], [8, 0.45], [12, 0.35], [13, 0.42], [14, 0.5], [15, 0.6]], 0, (b) => b % 4 === 3);
    sc.drum('ganza', [[0, 0.14], [2, 0.1], [4, 0.14], [6, 0.1], [8, 0.14], [10, 0.1], [12, 0.14], [14, 0.1]]);
    return { h, base: { bpm: 90, steps: 16, swing: 0.03, root: h.root, scale: h.mode, echo: { steps: 6, feedback: 0.3, mix: 0.2 }, reverb: 0.45, gain: 1.2, kick: 'tambor', snare: 'atabaque' } };
  },

  /** Pampa: milonga em 3-3-2 na menor harmônica, bordões de violão, bandoneon e bombo leguero. */
  cap6: (sc, boss) => {
    const h = new Harm(52, MODES.menorHarmonica, [0, 0, 3, 0, 4, 4, 0, 0, 0, 0, 3, 3, 0, 4, 0, 0], 16);
    const mel = tune(sc.rng, h, R16.milonga, 64, 81);
    sc.melody(mel, h, 'violao', 0.62, (n) => n.s < 8 * 16);
    sc.melody(mel, h, 'bandoneon', 0.5, (n) => n.s >= 8 * 16);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16, r = h.bass(b, 40);
      if (!boss) { sc.add(at, 6, 'violao', r, 0.6); sc.add(at + 6, 6, 'violao', h.fifth(b, 40), 0.45); sc.add(at + 12, 4, 'violao', r + 12, 0.5); }
      const v = h.voicing(b, 59);
      sc.strum(at + 3, 2, 'violao', v, 0.26, true); sc.strum(at + 9, 2, 'violao', v, 0.26, true); sc.strum(at + 14, 2, 'violao', v, 0.22, true);
      if (b >= 8) for (const m of h.voicing(b, 52)) sc.add(at, 16, 'pad', m, 0.22);
    }
    sc.drum('bombo', [[0, 0.55], [6, 0.35], [12, 0.45]]);
    sc.drum('bacalhau', [[12, 0.16]]);
    return { h, base: { bpm: 80, steps: 16, swing: 0, root: h.root, scale: h.mode, echo: { steps: 6, feedback: 0.25, mix: 0.15 }, reverb: 0.35, gain: 1.5, kick: 'bombo', snare: 'caixa' } };
  },

  /** Pantanal da Cuca: 6/8 em lídio, coro desafinado, caixinha de música e ecos que parecem outra voz. */
  cap7: (sc, boss) => {
    const h = new Harm(53, MODES.lidio, [0, 1, 5, 4, 0, 1, 4, 0], 12);
    const mel = tune(sc.rng, h, R12, 74, 91);
    sc.melody(mel, h, 'caixinha', 0.55);
    // a ilusão: na segunda volta a melodia reaparece meio compasso depois, uma oitava acima
    for (const n of mel) if (n.s >= 8 * 12) sc.add(n.s + 6, n.len, 'caixinha', h.midi(n.deg) + 12, 0.18);
    for (let b = 0; b < BARS; b++) {
      const at = b * 12;
      for (const m of h.voicing(b, 53, true)) sc.add(at, 12, 'coro', m, 0.42);
      if (!boss) sc.add(at, 10, 'baixo', h.bass(b, 38), 0.34);
      if (b % 2 === 0) sc.add(at, 12, 'sino', h.midi(h.chord(b)) + 24, 0.2);
      if (sc.rng() < 0.4) sc.add(at + Math.floor(sc.rng() * 12), 1, 'gota', 86 + Math.floor(sc.rng() * 10), 0.22);
    }
    sc.drum('ganza', [[0, 0.1], [3, 0.06], [6, 0.09], [9, 0.06]]);
    return { h, base: { bpm: 84, steps: 12, swing: 0, root: h.root, scale: h.mode, echo: { steps: 3, feedback: 0.5, mix: 0.45 }, reverb: 0.55, gain: 1.3, kick: 'tambor', snare: 'caixa' } };
  },

  /** Terra Sem Nome: tons inteiros, sinos esparsos e notas que vão sumindo. */
  cap8: (sc) => {
    const h = new Harm(48, MODES.tonsInteiros, [0, 0, 0, 0, 2, 2, 0, 0], 16);
    const mel = tune(sc.rng, h, R16.esparsa, 67, 84);
    // o esquecimento: na segunda volta somem mais notas, e as que ficam soam mais fracas
    for (const n of mel) {
      const late = n.s / sc.total;
      if (sc.rng() < (n.s < 8 * 16 ? 0.25 : 0.55)) continue;
      sc.add(n.s, n.len, 'sino', h.midi(n.deg), 0.6 * (1 - late * 0.5));
    }
    for (let b = 0; b < BARS; b++) {
      const at = b * 16;
      if (b % 4 === 0) sc.add(at, 64, 'drone', 36, 0.5);
      if (b % 2 === 0) { for (const m of h.voicing(b, 55)) sc.add(at, 32, 'coro', m, 0.26); sc.add(at, 1, 'coracao', 0, 0.5); }
    }
    return { h, base: { bpm: 64, steps: 16, swing: 0, root: h.root, scale: h.mode, echo: { steps: 8, feedback: 0.55, mix: 0.4 }, reverb: 0.65, gain: 2, kick: 'tambor', snare: 'caixa' } };
  },

  /** Torre dos Cem Andares: baque virado de maracatu, alfaias, gonguê, caixa e um clarim que sobe. */
  torre: (sc, boss) => {
    const h = new Harm(50, MODES.eolio, [0, 0, 6, 6, 5, 5, 6, 4, 0, 0, 6, 6, 5, 6, 4, 4], 16);
    sc.melody(tune(sc.rng, h, R16.maracatu, 62, 81), h, 'clarim', 0.55);
    for (let b = 0; b < BARS; b++) {
      const at = b * 16, r = h.bass(b, 36);
      for (const m of h.voicing(b, 50)) sc.add(at, 16, 'pad', m, 0.36);
      if (!boss) { sc.add(at, 4, 'baixo', r, 0.5); sc.add(at + 6, 2, 'baixo', r, 0.4); sc.add(at + 8, 4, 'baixo', r, 0.48); sc.add(at + 14, 2, 'baixo', h.fifth(b, 36), 0.4); }
    }
    sc.drum('alfaia', [[0, 1], [3, 0.6], [6, 0.8], [8, 0.9], [10, 0.5], [11, 0.7], [14, 0.8]]);
    sc.drum('gongue', [[0, 0.5], [4, 0.4], [7, 0.35], [12, 0.45]], 0);
    sc.drum('gongue', [[2, 0.3], [6, 0.3], [10, 0.3], [14, 0.3]], 1);
    for (let s = 0; s < 16; s++) sc.drum('caixa', [[s, [0, 3, 6, 8, 11, 14].includes(s) ? 0.3 : 0.1]]);
    return { h, base: { bpm: 104, steps: 16, swing: 0.02, root: h.root, scale: h.mode, echo: { steps: 3, feedback: 0.2, mix: 0.1 }, reverb: 0.3, gain: 0.85, kick: 'alfaia', snare: 'caixa' } };
  },
};

/** Camada de chefe: bumbo em todo tempo, caixa no contratempo com virada, baixo em colcheias e quintas graves. */
function bossLayer(sc: Score, h: Harm, base: Base): void {
  const st = sc.steps, beat = st === 12 ? 3 : 4;
  for (let b = 0; b < sc.bars; b++) {
    const at = b * st, r = h.bass(b, 36);
    for (let s = 0; s < st; s += beat) sc.add(at + s, 1, base.kick, 0, s === 0 ? 0.85 : 0.6);
    for (const s of st === 12 ? [6] : [4, 12]) sc.add(at + s, 1, base.snare, 0, 0.5);
    if (b % 4 === 3) for (let s = st - 4; s < st; s++) sc.add(at + s, 1, base.snare, 0, 0.25 + 0.1 * (s - st + 4));
    for (let s = 0; s < st; s += 2) sc.add(at + s, 2, 'baixo', s % 4 === 2 ? r + 12 : r, s === 0 ? 0.55 : 0.42);
    sc.add(at, st, 'drone', r + 12, 0.3);
    sc.add(at, st, 'drone', h.fifth(b, r + 7), 0.22);
  }
}

/** Semente de cada faixa: o mesmo nome dá sempre a mesma música. */
function seedOf(name: string): number {
  let x = 2166136261;
  for (let i = 0; i < name.length; i++) x = Math.imul(x ^ name.charCodeAt(i), 16777619);
  return x >>> 0;
}

/** Compõe a faixa. No modo chefe a melodia é a mesma, mais rápida e com a camada de chefe por cima. */
export function composeTrack(id: TrackId, boss = false): Song {
  const sc = new Score(id === 'cap2' || id === 'cap7' ? 12 : 16, BARS, makeRng(seedOf(id)));
  const { h, base } = ARRANGERS[id](sc, boss);
  // a camada de chefe não sorteia nada: a melodia e o resto saem iguais aos da faixa normal
  if (boss) bossLayer(sc, h, base);
  sc.notes.sort((a, b) => a.s - b.s || (a.d ?? 0) - (b.d ?? 0));
  return {
    key: boss ? `${id}:chefe` : id,
    bpm: boss ? Math.round(base.bpm * 1.18) : base.bpm,
    steps: base.steps, bars: BARS, swing: boss ? base.swing * 0.5 : base.swing,
    echo: base.echo, reverb: boss ? base.reverb * 0.7 : base.reverb, gain: boss ? 1 + ((base.gain ?? 1) - 1) * 0.5 : base.gain ?? 1,
    root: base.root, scale: base.scale, once: false, notes: sc.notes,
  };
}

/** Vinheta de vitória (fanfarra que sobe) ou de derrota (frase que desce), no tom da faixa que tocava. */
export function composeSting(kind: StingId, root = 60): Song {
  let r = root;
  while (r < 57) r += 12;
  while (r > 68) r -= 12;
  const sc = new Score(16, 2, makeRng(seedOf(kind)));
  if (kind === 'vitoria') {
    for (let s = 0; s < 6; s++) sc.add(s, 1, 'caixa', 0, 0.18 + s * 0.06);
    ([[0, 0, 2], [2, 4, 2], [4, 7, 2], [6, 12, 4], [10, 7, 2], [12, 12, 14]] as const).forEach(([s, i, len]) => sc.add(s, len, 'clarim', r + i, 0.6));
    ([[6, 4, 4], [10, 4, 2], [12, 7, 14]] as const).forEach(([s, i, len]) => sc.add(s, len, 'clarim', r + i, 0.32));
    for (const i of [0, 4, 7]) sc.add(12, 16, 'pad', r - 12 + i, 0.45);
    sc.add(12, 14, 'baixo', r - 24, 0.55);
    sc.add(12, 1, 'alfaia', 0, 0.9); sc.add(12, 1, 'triangulo', 1, 0.45); sc.add(6, 1, 'zabumba', 0, 0.6);
    return { key: kind, bpm: 132, steps: 16, bars: 2, swing: 0, echo: { steps: 3, feedback: 0.25, mix: 0.15 }, reverb: 0.35, gain: 1, root: r, scale: MODES.jonio, once: true, notes: sc.notes };
  }
  ([[0, 7, 3], [3, 5, 3], [6, 3, 3], [9, 2, 3], [12, 0, 10]] as const).forEach(([s, i, len]) => sc.add(s, len, 'bandoneon', r + i, 0.55));
  for (const i of [0, 3, 7]) sc.add(12, 11, 'pad', r - 12 + i, 0.4);
  sc.add(12, 11, 'drone', r - 24, 0.5);
  sc.add(0, 1, 'bombo', 0, 0.5); sc.add(12, 1, 'bombo', 0, 0.75);
  return { key: kind, bpm: 80, steps: 16, bars: 2, swing: 0, echo: { steps: 6, feedback: 0.35, mix: 0.25 }, reverb: 0.5, gain: 1, root: r, scale: MODES.eolio, once: true, notes: sc.notes };
}

/** Faixa de uma fase: a Torre tem a sua; as outras, a do capítulo. */
export function trackFor(stage: { id: string; chapter: number }): TrackId {
  if (isTowerId(stage.id)) return 'torre';
  const n = Math.round(stage.chapter);
  return n >= 1 && n <= 8 ? (`cap${n}` as TrackId) : 'acampamento';
}

/* ---------- cordas dedilhadas ---------- */

/**
 * Corda dedilhada (Karplus-Strong): um ruído curto que volta por um atraso do tamanho do período,
 * perdendo agudo a cada volta. Devolve as amostras e a frequência que saiu de fato (o período é inteiro),
 * para quem toca corrigir a afinação com a velocidade de leitura.
 */
export function pluck(freq: number, rate: number, seconds: number, o: { decay: number; bright: number; seed: number }): { data: Float32Array; freq: number } {
  const n = Math.max(1, Math.floor(rate * seconds)), out = new Float32Array(n);
  const len = Math.max(2, Math.round(rate / freq)), buf = new Float32Array(len), rng = makeRng(o.seed);
  let last = 0, mean = 0;
  for (let i = 0; i < len; i++) { last += o.bright * (rng() * 2 - 1 - last); buf[i] = last; mean += last; }
  mean /= len;
  let peak = 0;
  for (let i = 0; i < len; i++) { buf[i] -= mean; peak = Math.max(peak, Math.abs(buf[i])); }
  const norm = peak > 0 ? 0.9 / peak : 0;
  for (let i = 0, k = 0; i < n; i++) {
    const a = buf[k], b = buf[(k + 1) % len];
    out[i] = a * norm;
    buf[k] = o.decay * 0.5 * (a + b);
    k = (k + 1) % len;
  }
  return { data: out, freq: rate / len };
}
