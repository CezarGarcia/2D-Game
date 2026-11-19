/**
 * Números do combate. Tudo que define "como o jogo se sente" fica aqui.
 * Distâncias em pixels do mundo (tela lógica de 1280×720), tempos em segundos.
 * Vida e dano dos monstros estão no valor do nível 1 e sobem com o nível da fase.
 */

export const VIEW = { w: 1280, h: 720 };

/** Área em que personagens podem andar. */
export const ARENA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

export const TICK = 1 / 60;
export const WAVE_DELAY = 1.2;

export const PLAYER = {
  radius: 16,
  hurtInvuln: 0.6,
  hurtStun: 0.18,
  manaPerHit: 3,
  inputBuffer: 0.15,

  /** Sequência de três golpes do facão. `mult` multiplica o dano da arma. */
  combo: [
    { windup: 0.07, total: 0.3, mult: 1, lunge: 150, range: 88, arc: 1.15 },
    { windup: 0.07, total: 0.3, mult: 1, lunge: 150, range: 88, arc: 1.15 },
    { windup: 0.12, total: 0.46, mult: 1.65, lunge: 230, range: 98, arc: 1.35 },
  ],
  /** Tempo, depois de um golpe, em que o próximo clique continua a sequência. */
  comboWindow: 0.45,

  dodge: { duration: 0.3, speed: 560, iframes: 0.25 },
  /** Um golpe evitado até este tempo depois do início da esquiva conta como esquiva perfeita. */
  perfectWindow: 0.2,
  perfectBonus: 1.5,
  perfectDuration: 3,

  /** Escudo: defender corta parte do dano; defender no instante certo apara. */
  shield: { parryWindow: 0.2, blockReduce: 0.6, parryStun: 1.6, moveMult: 0.45 },
  contragolpe: 2.5,

  /** Arco: disparo rápido e tiro carregado. */
  bow: { interval: 0.42, speed: 920, range: 720, mult: 0.9, shotSlow: 0.5, chargeTime: 0.9, chargeMult: 2.6, chargeMoveMult: 0.3 },

  /** Talentos e itens com efeito em combate. */
  sedeDeBriga: { perStack: 0.04, max: 5, duration: 6 },
  execucaoBelow: 0.25,
  rolamentoMult: 0.8,
  sangueQuente: { below: 0.35, bonus: 0.4 },
  jabutiInvuln: 2,
  mandibulaChance: 0.12,
  presa: { bonus: 0.25, duration: 4 },
  coroaBonus: 0.3,

  /** O herói pode cair uma vez por fase e continuar da sala atual com esta fração da vida. */
  revives: 1,
  reviveHp: 0.5,
  potionCooldown: 1,
};

export type EnemyKind = 'sauva' | 'queixada' | 'cuspidor' | 'tronco' | 'urutau' | 'cogumelo' | 'caipora' | 'curupira';
/** Modificadores de elite (docs/gdd/05). */
export type EliteMod = 'blindado' | 'veloz' | 'vampirico' | 'explosivo' | 'regenerador';

export interface SpawnDef { kind: EnemyKind; x: number; y: number; elite?: boolean; mods?: EliteMod[] }

export const ENEMY = {
  spawnTime: 0.7,
  sauva: { radius: 16, hp: 34, speed: 125, biteRange: 58, windup: 0.5, biteRadius: 44, biteOffset: 38, damage: 14, recover: 0.55 },
  queixada: {
    radius: 28, hp: 125, speed: 80, aimTime: 1.15, lockAt: 0.75, chargeSpeed: 780, lineWidth: 60,
    damage: 34, stun: 2.6, stunDamageMult: 1.5, cooldown: 1.6, minRange: 180,
  },
  cuspidor: { radius: 22, hp: 66, interval: 2.6, flight: 0.95, splash: 46, damage: 18, range: 700, lead: 0.25 },
  /** Valores de monstro comum; como elite, a vida é multiplicada por ELITE.hp. */
  tronco: { radius: 36, hp: 104, speed: 58, slamRange: 125, windup: 1.3, slamRadius: 108, slamOffset: 62, damage: 66, exposed: 2.2, armor: 0.5 },
  urutau: {
    radius: 16, hp: 34, revealRange: 175, revealTime: 0.45, hover: 1.1, hoverDist: 210, flySpeed: 165,
    aimTime: 0.55, dashSpeed: 640, dashLen: 320, lineWidth: 46, damage: 16, recover: 1.0,
  },
  cogumelo: { radius: 15, hp: 28, speed: 108, fuseRange: 80, fuse: 0.85, blastRadius: 98, damage: 26, cloud: 3, cloudTick: 4, cloudEvery: 0.5 },
  caipora: {
    radius: 30, hp: 950, speed: 95, aimTime: 0.85, lockAt: 0.55, chargeSpeed: 840, lineWidth: 64, damage: 38,
    skid: 0.45, tired: 2.3, tiredDamageMult: 1.3, cooldown: 1.2, callAt: [0.6, 0.3], callTime: 1.0,
  },
  curupira: {
    radius: 22, hp: 2700, speed: 90, idle: 1.1,
    rastro: { vanish: 0.55, dist: 340, aim: 0.75, speed: 920, len: 560, width: 56, damage: 30, recover: 1.1 },
    assobio: { cast: 1.0, clones: 2, volleyAt: 1.4, life: 5.5, thornSpeed: 430, thornDamage: 14, burstRadius: 84, burstDelay: 0.5, burstDamage: 20, stagger: 0.7 },
    mataViva: { cast: 0.5, lines: 3, delay: 1.15, width: 54, damage: 28, slow: 1.2 },
    estouro: { cast: 0.5, lanes: 3, delay: 1.2, width: 64, speed: 940, damage: 32 },
    investida: { aim: 0.68, lockAt: 0.45, speed: 880, width: 62, damage: 36, count: 3, exposed: 3, exposedMult: 1.5 },
    phases: [0.66, 0.33], roar: 1.2, shrink: 70,
    posture: { max: 100, parry: 35, perfect: 14, hit: 4, spell: 5, decayAfter: 3, decay: 5, downed: 4, downedMult: 2 },
    enrageAt: 240, enrageMult: 1.5,
  },
};

/** Elites: mais vida, mais dano, maiores. */
export const ELITE = { hp: 5, damage: 1.5, scale: 1.25 };
export const MOD = {
  veloz: { speed: 1.35, windup: 0.8 },
  vampirico: { heal: 0.15 },
  explosivo: { delay: 0.95, radius: 112, damage: 30 },
  regenerador: { after: 3, perSecond: 0.02 },
};

/** Multiplicadores de vida e dano dos monstros pelo nível da fase (nível 1 = 1). */
export function enemyHpMult(level: number): number {
  return (1 + 0.18 * level) / 1.18;
}
export function enemyDamageMult(level: number): number {
  return (1 + 0.12 * level) / 1.12;
}
