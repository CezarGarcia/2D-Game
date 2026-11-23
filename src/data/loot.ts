/**
 * Achados dentro da fase: baús, moedas, orbes, potes, a Mãe-do-Ouro e os desafios (docs/gdd/05).
 * São bônus: ninguém precisa deles para vencer. O ouro é uma fração do ouro base da fase
 * (`stageGold`), para valer o mesmo em qualquer nível.
 */
import type { BlessingId } from './content';

export type ChestTier = 'madeira' | 'bronze' | 'dourado' | 'encantado';
export const CHEST_ORDER: ChestTier[] = ['madeira', 'bronze', 'dourado', 'encantado'];

/** O que vem no baú além das moedas. */
export type ChestPrize = 'nada' | 'cura' | 'efeito' | 'oferenda';

export interface ChestDef {
  name: string;
  color: string;
  /** Ouro total do baú, em fração do ouro base da fase. */
  gold: number;
  /** Em quantas moedas esse ouro sai. */
  coins: number;
  /** Peso de cada prêmio no sorteio. */
  prize: Record<ChestPrize, number>;
  /** Oferenda: quantas bênçãos para escolher e até que grau (1 = Comum, 2 = Rara). */
  offer: number;
  offerTier: 1 | 2;
}

export const CHESTS: Record<ChestTier, ChestDef> = {
  madeira: { name: 'Baú de madeira', color: '#d29a5a', gold: 0.03, coins: 3, prize: { nada: 50, cura: 20, efeito: 30, oferenda: 0 }, offer: 2, offerTier: 1 },
  bronze: { name: 'Baú de bronze', color: '#e3884a', gold: 0.06, coins: 4, prize: { nada: 25, cura: 15, efeito: 45, oferenda: 15 }, offer: 2, offerTier: 1 },
  dourado: { name: 'Baú dourado', color: '#ffd23f', gold: 0.1, coins: 6, prize: { nada: 0, cura: 0, efeito: 50, oferenda: 50 }, offer: 3, offerTier: 1 },
  encantado: { name: 'Baú encantado', color: '#c99cff', gold: 0.2, coins: 8, prize: { nada: 0, cura: 0, efeito: 0, oferenda: 100 }, offer: 3, offerTier: 2 },
};

/** Chance de baú por morte e a raridade de cada um. Chefão de sala final e elite da fase 11 sempre deixam baú. */
export const CHEST_DROP = {
  monster: { chance: 0.022, tiers: { madeira: 75, bronze: 25, dourado: 0, encantado: 0 } },
  champion: { chance: 0.08, tiers: { madeira: 30, bronze: 60, dourado: 10, encantado: 0 } },
  elite: { chance: 0.3, tiers: { madeira: 0, bronze: 50, dourado: 40, encantado: 10 } },
  /** Cada morte sem baú soma isto à chance (azar com limite, como o item com nome). */
  pity: 0.0002,
  /** Baús fechados no chão ao mesmo tempo. */
  maxOnFloor: 3,
} satisfies Record<string, unknown>;

/** Baú que fica para trás quando a sala ou a fase acaba abre sozinho; o prêmio vira ouro (fração do ouro do baú). */
export const FLUSH_BONUS: Record<ChestPrize, number> = { nada: 0, cura: 0.5, efeito: 0.5, oferenda: 1 };

/** Fruta do baú: cura uma parte da vida. */
export const CHEST_HEAL = 0.1;

/** Bênçãos que o baú não oferece (a fruta já vem no próprio baú). */
export const OFFER_EXCLUDE: BlessingId[] = ['cura'];

/** Moedas e orbes soltos pelos monstros. `value` é a fração do ouro base da fase por moeda. */
export const DROPS = {
  coin: { value: 0.008, monster: 0.1, champion: 2, elite: 3 },
  /** Orbes: chance por morte, e quanto devolvem (fração da vida e da mana máximas). O de vida é raro e pequeno. */
  orb: { life: 0, mana: 0.03, heal: 0.04, manaGain: 0.25 },
};

/** Moedas e orbes no chão: saltam, esperam um instante e depois correm para o herói. */
export const PICKUP = { delay: 0.45, magnet: 120, pull: 1100, grab: 24, open: 46 };

/** Potes de barro: quebram com qualquer golpe e soltam moedas. */
export const POTS = { max: 2, coins: 2, value: 0.008, orb: 0.3, life: 0.25 };

/** Mãe-do-Ouro: bola de fogo dourada que foge; quem acerta a tempo ganha um baú dourado. */
export const WISP = { chance: 0.12, perStage: 1, duration: 9, hits: 4, speed: 215, radius: 24, hitCd: 0.18 };

/** Desafio da sala: vencer tomando poucos golpes, ou depressa. O prêmio é um baú dourado. */
export const CHALLENGE = { chance: 0.25, perStage: 1, hits: 2, time: { base: 12, perEnemy: 2.4 } };

export type BuffId = 'furia' | 'vento' | 'jabuti' | 'mana' | 'elemento' | 'ima';
export const BUFF_ORDER: BuffId[] = ['furia', 'vento', 'jabuti', 'mana', 'elemento', 'ima'];

export interface BuffDef {
  name: string;
  desc: string;
  color: string;
  /** Segundos de luta (o relógio para entre as salas). */
  duration: number;
  /** O número do efeito; o significado está em `desc`. */
  power: number;
}

/** Efeitos de baú: valem por alguns segundos de luta. Pegar o mesmo de novo renova o tempo. */
export const BUFFS: Record<BuffId, BuffDef> = {
  furia: { name: 'Fúria da Onça', desc: '+15% de dano', color: '#ff8a3a', duration: 15, power: 0.15 },
  vento: { name: 'Pés de Vento', desc: '+20% de velocidade; a esquiva recarrega 40% mais rápido', color: '#9be7ff', duration: 15, power: 0.2 },
  jabuti: { name: 'Carapaça de Jabuti', desc: 'Absorve dano igual a 15% da vida', color: '#c9a26b', duration: 20, power: 0.15 },
  mana: { name: 'Chuva de Mana', desc: 'Mana volta 3× mais rápido e feitiços custam metade', color: '#5cb8ff', duration: 15, power: 0.5 },
  elemento: { name: 'Golpe Elemental', desc: 'Golpes de arma têm 35% de chance de aplicar um elemento', color: '#ffe066', duration: 15, power: 0.35 },
  ima: { name: 'Ímã de Ouro', desc: 'Puxa as moedas de longe, moedas valem 50% mais e todo inimigo derrotado solta uma', color: '#f2c14e', duration: 30, power: 0.5 },
};

export const CHEST_PRIZE_LABEL: Record<ChestPrize, string> = { nada: 'Ouro', cura: 'Fruta do mato', efeito: 'Efeito', oferenda: 'Oferenda' };

