/**
 * Gravação de uma partida para o servidor refazer.
 *
 * A simulação é determinística: com a mesma configuração (fase, semente, herói) e os mesmos comandos,
 * chega sempre ao mesmo resultado (as contas vêm de ./fmath). Então, para o ranking, o jogo não manda
 * o tempo nem os pontos: manda os comandos de cada quadro e as escolhas feitas fora do passo
 * (bênção do altar, oferenda do baú). O servidor monta a mesma configuração, refaz e confere.
 *
 * Os comandos passam por `quantize` antes de entrar na simulação, ao vivo e na gravação, para que
 * o que foi jogado e o que foi gravado sejam exatamente iguais.
 *
 * Formato: só os quadros em que o comando muda, em inteiros de tamanho variável, e o resultado em base64.
 */
import type { BlessingId } from '../data/content';
import type { HeroStats } from '../meta/stats';
import type { Input, StageConfig, World } from './types';
import { chooseBlessing, chooseOffer, createWorld, step } from './world';
import { TICK } from '../data/balance';

export const REPLAY_FORMAT = 1;
/** Limite de quadros refeitos: 40 minutos de jogo. */
export const MAX_TICKS = 60 * 60 * 40;

/** Escolha feita entre dois passos. `kind`: a = altar, o = oferenda de baú. */
export interface Pick { t: number; kind: 'a' | 'o'; i: number }

export interface Replay {
  format: number;
  /** Quantos passos a partida teve. */
  ticks: number;
  /** Comandos codificados (base64). */
  data: string;
  picks: Pick[];
}

/* ---------- comandos em inteiros ---------- */

const BUTTONS = ['attackPressed', 'attackHeld', 'altHeld', 'dodgePressed', 's0', 's1', 's2', 'petPressed', 'potionPressed', 'supremoPressed'] as const;

/** Arredonda o comando para a forma que a gravação guarda: movimento em milésimos e mira em pixels. */
export function quantize(i: Input): Input {
  return {
    mx: Math.round(Math.max(-1, Math.min(1, i.mx)) * 1000) / 1000, my: Math.round(Math.max(-1, Math.min(1, i.my)) * 1000) / 1000,
    aimX: Math.round(i.aimX), aimY: Math.round(i.aimY),
    attackPressed: !!i.attackPressed, attackHeld: !!i.attackHeld, altHeld: !!i.altHeld, dodgePressed: !!i.dodgePressed,
    spell: [!!i.spell[0], !!i.spell[1], !!i.spell[2]], petPressed: !!i.petPressed, potionPressed: !!i.potionPressed, supremoPressed: !!i.supremoPressed,
  };
}

function toInts(i: Input): number[] {
  let bits = 0;
  const b = [i.attackPressed, i.attackHeld, i.altHeld, i.dodgePressed, i.spell[0], i.spell[1], i.spell[2], i.petPressed, i.potionPressed, i.supremoPressed];
  b.forEach((on, k) => { if (on) bits |= 1 << k; });
  return [Math.round(i.mx * 1000), Math.round(i.my * 1000), Math.round(i.aimX), Math.round(i.aimY), bits];
}

function fromInts(v: number[]): Input {
  const bit = (k: number) => (v[4] & (1 << k)) !== 0;
  return {
    mx: v[0] / 1000, my: v[1] / 1000, aimX: v[2], aimY: v[3],
    attackPressed: bit(0), attackHeld: bit(1), altHeld: bit(2), dodgePressed: bit(3),
    spell: [bit(4), bit(5), bit(6)], petPressed: bit(7), potionPressed: bit(8), supremoPressed: bit(9),
  };
}
void BUTTONS;

/* ---------- inteiros de tamanho variável ---------- */

class Writer {
  private bytes: number[] = [];
  uint(n: number): void { let v = n >>> 0; while (v >= 0x80) { this.bytes.push((v & 0x7f) | 0x80); v >>>= 7; } this.bytes.push(v); }
  int(n: number): void { this.uint(n >= 0 ? n * 2 : -n * 2 - 1); }
  base64(): string {
    let s = '';
    for (let i = 0; i < this.bytes.length; i += 0x8000) s += String.fromCharCode(...this.bytes.slice(i, i + 0x8000));
    return btoa(s);
  }
}

class Reader {
  private pos = 0;
  constructor(private bytes: Uint8Array) {}
  get done(): boolean { return this.pos >= this.bytes.length; }
  uint(): number {
    let v = 0, shift = 0, b = 0;
    do {
      if (this.pos >= this.bytes.length) throw new Error('gravação cortada');
      b = this.bytes[this.pos++]; v += (b & 0x7f) * 2 ** shift; shift += 7;
      if (shift > 35) throw new Error('número grande demais na gravação');
    } while (b & 0x80);
    return v;
  }
  int(): number { const u = this.uint(); return u % 2 === 0 ? u / 2 : -(u + 1) / 2; }
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------- gravador ---------- */

/**
 * Grava ao lado da partida: chame `pick` antes de aplicar uma escolha e `input` com o comando já
 * quantizado, logo antes de cada `step`.
 */
export class Recorder {
  private w = new Writer();
  private last = [0, 0, 0, 0, 0];
  private lastT = 0;
  private picks: Pick[] = [];
  ticks = 0;

  input(i: Input): void {
    const v = toInts(i);
    let mask = 0;
    for (let k = 0; k < 5; k++) if (v[k] !== this.last[k]) mask |= 1 << k;
    if (mask || this.ticks === 0) {
      this.w.uint(this.ticks - this.lastT); this.w.uint(mask);
      for (let k = 0; k < 5; k++) if (mask & (1 << k)) this.w.int(v[k] - this.last[k]);
      this.last = v; this.lastT = this.ticks;
    }
    this.ticks++;
  }

  pick(kind: 'a' | 'o', i: number): void { this.picks.push({ t: this.ticks, kind, i }); }

  finish(): Replay {
    return { format: REPLAY_FORMAT, ticks: this.ticks, data: this.w.base64(), picks: this.picks.slice() };
  }
}

/** Desfaz a gravação em um comando por quadro. */
export function decodeInputs(r: Replay): Input[] {
  if (r.format !== REPLAY_FORMAT) throw new Error(`formato de gravação desconhecido: ${r.format}`);
  if (!(r.ticks >= 0 && r.ticks <= MAX_TICKS)) throw new Error('partida longa demais');
  const rd = new Reader(fromBase64(r.data)), out: Input[] = [];
  let cur = [0, 0, 0, 0, 0], t = 0;
  while (!rd.done) {
    const gap = rd.uint(), mask = rd.uint(), at = t + gap;
    if (at > r.ticks) throw new Error('comando depois do fim da partida');
    while (out.length < at) out.push(fromInts(cur));
    cur = cur.slice();
    for (let k = 0; k < 5; k++) if (mask & (1 << k)) cur[k] += rd.int();
    t = at;
  }
  while (out.length < r.ticks) out.push(fromInts(cur));
  return out;
}

/**
 * Refaz a partida e devolve o mundo no fim. Quem chama monta a configuração (a mesma que o jogo usou)
 * e o `restat`, que recalcula o herói depois de uma bênção.
 */
export function replayRun(cfg: StageConfig, r: Replay, restat: (b: BlessingId[]) => HeroStats): World {
  const inputs = decodeInputs(r), w = createWorld(cfg);
  const picks = [...r.picks].sort((a, b) => a.t - b.t);
  let p = 0;
  for (let t = 0; t < inputs.length; t++) {
    while (p < picks.length && picks[p].t === t) {
      const k = picks[p++];
      if (k.kind === 'a') chooseBlessing(w, k.i, restat); else chooseOffer(w, k.i, restat);
    }
    step(w, inputs[t], TICK);
    w.events.length = 0;
    if (w.phase === 'won' || w.phase === 'lost') break;
  }
  return w;
}

/** Resultado que o ranking guarda, tirado do mundo refeito (nunca do que o jogo diz). */
export interface RunResult { won: boolean; time: number; ticks: number; rooms: number; kills: number; hitsTaken: number; deaths: number }

export function resultOf(w: World): RunResult {
  return { won: w.phase === 'won', time: Math.round(w.time * 1000) / 1000, ticks: w.tick, rooms: w.roomsCleared, kills: w.kills, hitsTaken: w.hitsTaken, deaths: w.deaths };
}

export { SIM_VERSION } from 'virtual:sim-version';
