/**
 * Números do protótipo de sensação. Tudo que define "como o jogo se sente" fica aqui.
 * Distâncias em pixels do mundo (tela lógica de 1280×720), tempos em segundos.
 */

export const VIEW = { w: 1280, h: 720 };

/** Área em que personagens podem andar. */
export const ARENA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

export const PLAYER = {
  radius: 16,
  maxHp: 300,
  maxMana: 80,
  manaRegen: 2,
  manaPerHit: 3,
  speed: 250,
  critChance: 0.05,
  critMult: 1.5,
  hurtInvuln: 0.6,
  hurtStun: 0.18,

  /** Sequência de três golpes do facão. */
  combo: [
    { windup: 0.07, total: 0.3, damage: 12, lunge: 150, range: 88, arc: 1.15 },
    { windup: 0.07, total: 0.3, damage: 12, lunge: 150, range: 88, arc: 1.15 },
    { windup: 0.12, total: 0.46, damage: 20, lunge: 230, range: 98, arc: 1.35 },
  ],
  /** Tempo, depois de um golpe, em que o próximo clique continua a sequência. */
  comboWindow: 0.45,

  dodge: { duration: 0.3, speed: 560, iframes: 0.25, cooldown: 1.2 },
  /** Um golpe evitado até este tempo depois do início da esquiva conta como esquiva perfeita. */
  perfectWindow: 0.2,
  perfectBonus: 1.5,
  perfectDuration: 3,

  /** Dardo de Espinho (Natureza). */
  spell: { cost: 12, cooldown: 2.5, count: 3, spread: 0.2, speed: 640, range: 560, damage: 10, poisonTick: 3, poisonEvery: 0.5, poisonDuration: 3 },

  inputBuffer: 0.15,
};

export type EnemyKind = 'sauva' | 'queixada' | 'cuspidor' | 'tronco';

export const ENEMY = {
  spawnTime: 0.7,
  sauva: { radius: 16, hp: 30, speed: 125, biteRange: 58, windup: 0.5, biteRadius: 44, biteOffset: 38, damage: 14, recover: 0.55 },
  queixada: {
    radius: 28, hp: 95, speed: 80, aimTime: 1.15, lockAt: 0.75, chargeSpeed: 780, lineWidth: 60,
    damage: 34, stun: 2.6, stunDamageMult: 1.5, cooldown: 1.6, minRange: 180,
  },
  cuspidor: { radius: 22, hp: 55, interval: 2.6, flight: 0.95, splash: 46, damage: 18, range: 700, lead: 0.25 },
  tronco: {
    radius: 36, hp: 430, speed: 58, slamRange: 125, windup: 1.3, slamRadius: 108, slamOffset: 62,
    damage: 100, exposed: 2.2, armor: 0.5,
  },
};

export interface SpawnDef { kind: EnemyKind; x: number; y: number; elite?: boolean }

/** As três ondas da sala do protótipo. */
export const WAVES: SpawnDef[][] = [
  [
    { kind: 'sauva', x: 980, y: 300 },
    { kind: 'sauva', x: 1040, y: 400 },
    { kind: 'sauva', x: 970, y: 500 },
  ],
  [
    { kind: 'queixada', x: 1040, y: 380 },
    { kind: 'cuspidor', x: 1090, y: 580 },
    { kind: 'sauva', x: 900, y: 240 },
    { kind: 'sauva', x: 930, y: 540 },
  ],
  [
    { kind: 'tronco', x: 1020, y: 380, elite: true },
    { kind: 'sauva', x: 900, y: 250 },
    { kind: 'sauva', x: 900, y: 530 },
  ],
];

export const WAVE_DELAY = 1.3;
export const TICK = 1 / 60;
