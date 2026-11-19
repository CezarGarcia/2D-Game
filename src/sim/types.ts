/** Tipos da simulação de combate. */
import type { EliteMod, EnemyKind } from '../data/balance';
import type { BlessingId, CompanionId, SpellId } from '../data/content';
import type { RoomDef } from '../data/stages';
import type { HeroStats } from '../meta/stats';

export interface Input {
  /** Direção de movimento, de -1 a 1 em cada eixo. */
  mx: number; my: number;
  /** Ponto do mundo para onde o jogador mira. */
  aimX: number; aimY: number;
  attackPressed: boolean; attackHeld: boolean;
  /** Golpe próprio da arma: defender (escudo) ou carregar o tiro (arco). */
  altHeld: boolean;
  dodgePressed: boolean;
  /** Feitiços dos espaços Q, E e R. */
  spell: [boolean, boolean, boolean];
  petPressed: boolean;
  potionPressed: boolean;
}

export const NO_INPUT: Input = {
  mx: 0, my: 0, aimX: 0, aimY: 0, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false,
  spell: [false, false, false], petPressed: false, potionPressed: false,
};

export type Telegraph =
  | { shape: 'circle'; x: number; y: number; r: number; t: number; dur: number }
  | { shape: 'line'; x: number; y: number; x2: number; y2: number; w: number; t: number; dur: number };

export type PlayerState = 'idle' | 'attack' | 'dodge' | 'hurt' | 'dead' | 'block' | 'charge';

export interface Player {
  x: number; y: number; vx: number; vy: number; kx: number; ky: number;
  aim: number; facing: 1 | -1;
  hp: number; mana: number;
  state: PlayerState; stateT: number;
  combo: number; comboT: number; hitDone: boolean;
  dodgeCharges: number; dodgeTimer: number; iframes: number; hurtInv: number;
  /** Recarga restante e recarga total de cada espaço de feitiço. */
  cds: [number, number, number]; cdMax: [number, number, number];
  perfectT: number; perfectUsed: boolean;
  dx: number; dy: number; rolled: number[];
  moving: boolean; walk: number;
  bufAttack: number; bufDodge: number; bufSpell: [number, number, number];
  /** Tempo desde que começou a defender. */
  blockT: number;
  /** Carga do tiro do arco, de 0 a 1. */
  charge: number; shotCd: number;
  contraT: number; presaT: number; cascaT: number; slowT: number;
  stacks: number; stackT: number; jabutiUsed: boolean;
  potions: number; potionCd: number;
}

export type EnemyState =
  | 'spawn' | 'chase' | 'windup' | 'recover' | 'stagger' | 'roam' | 'aim' | 'charge' | 'stunned' | 'idle' | 'spit' | 'exposed'
  | 'perched' | 'reveal' | 'hover' | 'dash' | 'fuse' | 'skid' | 'tired' | 'call'
  | 'vanish' | 'cast' | 'volley' | 'roar' | 'downed' | 'clone';

export interface Enemy {
  id: number; kind: EnemyKind; elite: boolean; mods: EliteMod[];
  x: number; y: number; kx: number; ky: number;
  hp: number; maxHp: number; radius: number;
  /** Multiplicadores de dano, velocidade e tempo de aviso deste inimigo. */
  dmg: number; speedMult: number; windupMult: number;
  state: EnemyState; stateT: number;
  facing: 1 | -1; dirX: number; dirY: number;
  tele: Telegraph | null;
  cd: number; flag: boolean; count: number;
  flash: number; sinceHit: number;
  poisonT: number; poisonTick: number; slowT: number; rootT: number; stunT: number;
  walk: number; moving: boolean;
  /** Tempo restante atacando o companheiro em vez do herói. */
  aggroPet: number;
  /** Não pode ser atingido nem mirado (urutau camuflado, chefão sumido). */
  hidden: boolean;
  /** Cópia ilusória do Curupira. */
  fake: boolean;
  /** Dados de chefão. */
  phase: number; posture: number; pattern: string; step: number; calls: number;
  ax: number; ay: number;
}

export type ProjectileKind = 'thorn' | 'arrow' | 'cipo' | 'seed' | 'ethorn' | 'stampede';

export interface Projectile {
  id: number; kind: ProjectileKind;
  x: number; y: number; vx: number; vy: number; dist: number; range: number;
  damage: number; pierce: boolean; hit: number[]; charged: boolean;
  /** Projéteis em arco (semente do Cuspidor). */
  sx: number; sy: number; tx: number; ty: number; t: number; dur: number;
  tele: Telegraph | null;
  owner: number;
}

/** Golpe com atraso marcado no chão que não pertence a um inimigo vivo. */
export interface Hazard {
  id: number;
  kind: 'blast' | 'roots' | 'lane' | 'burst';
  tele: Telegraph;
  damage: number;
  slow: number;
}

/** Efeito que fica no chão por um tempo. */
export interface Zone {
  id: number;
  kind: 'sementes' | 'broto' | 'cloud';
  x: number; y: number; r: number; t: number; dur: number; tick: number; power: number;
}

export interface Companion {
  id: CompanionId;
  x: number; y: number;
  hp: number; maxHp: number;
  state: 'follow' | 'attack' | 'pounce' | 'down';
  stateT: number;
  cd: number; atkCd: number; tauntT: number;
  facing: 1 | -1; walk: number; moving: boolean;
  target: number; flash: number;
  sx: number; sy: number;
}

export type SimEventType =
  | 'swing' | 'hit' | 'kill' | 'hurt' | 'death' | 'revive' | 'dodge' | 'perfect' | 'parry' | 'block' | 'cast' | 'shoot' | 'spawn' | 'wave'
  | 'roomClear' | 'roomStart' | 'altar' | 'blessing' | 'win' | 'lose'
  | 'bite' | 'charge' | 'crash' | 'spit' | 'splat' | 'slam' | 'telegraph' | 'reveal' | 'explode' | 'hazard'
  | 'sementes' | 'cipo' | 'heal' | 'potion' | 'pet' | 'petHurt' | 'petDown' | 'taunt'
  | 'phase' | 'vanish' | 'appear' | 'footprints' | 'whistle' | 'cloneBurst' | 'downed' | 'call' | 'jabuti' | 'shrink' | 'enrage' | 'stack';

export interface SimEvent {
  type: SimEventType;
  x: number; y: number;
  value?: number; crit?: boolean; kind?: string; id?: number; ang?: number; armored?: boolean; x2?: number; y2?: number; text?: string;
}

export interface StageConfig {
  stageId: string;
  /** Nível dos monstros. */
  level: number;
  rooms: RoomDef[];
  stats: HeroStats;
  seed: number;
}

export type Phase = 'fight' | 'cleared' | 'altar' | 'dead' | 'won' | 'lost';

export interface Arena { x0: number; y0: number; x1: number; y1: number }

export interface World {
  cfg: StageConfig;
  stats: HeroStats;
  time: number; tick: number;
  phase: Phase;
  room: number;
  arena: Arena;
  player: Player;
  pet: Companion | null;
  enemies: Enemy[];
  projectiles: Projectile[];
  hazards: Hazard[];
  zones: Zone[];
  events: SimEvent[];
  wave: number; waveTimer: number;
  nextId: number; rng: number;
  /** Multiplicadores pela diferença de nível entre o herói e a fase. */
  dealt: number; taken: number;
  blessings: BlessingId[];
  /** Bênçãos oferecidas na sala de altar atual. */
  altar: BlessingId[] | null;
  revives: number; deaths: number; deadT: number;
  kills: number; perfects: number; hitsTaken: number; roomsCleared: number;
  /** Tempo de luta contra o chefão, para a fúria. */
  bossTime: number;
  spells: (SpellId | null)[];
}
