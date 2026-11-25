/**
 * Presságios (docs/gdd/09): a dificuldade que o jogador escolhe antes de dormir, em troca de mais Lembranças.
 * Cada Presságio tem de 1 a 3 graus e cada grau pesa de 1 a 3 pontos; a soma é o Peso da noite.
 * Os de combate também valem nas fases da campanha já vencidas com 3 estrelas, onde melhoram o saque.
 */

export type OmenId = 'luaCheia' | 'fome' | 'maoPesada' | 'bando' | 'chefeTeimoso' | 'poucasVelas' | 'feiraCara' | 'rodaViciada' | 'semPadrinho' | 'pressa' | 'esquecimento' | 'juizo';

export interface OmenDef {
  id: OmenId;
  name: string;
  icon: string;
  /** Quantos graus tem, e quanto cada grau pesa. */
  grades: number; weight: number;
  /** O que faz no grau dado. */
  desc: (grade: number) => string;
  /** Só mexe nos monstros: vale também nas fases da campanha. */
  combat: boolean;
}

/** Graus escolhidos de cada Presságio (ausente ou 0 = desligado). */
export type OmenPick = Partial<Record<OmenId, number>>;

/** Segundos de luta por trecho no Presságio Pressa, por grau. */
export const HURRY_SECONDS = [0, 300, 240, 180];

/** Quanto cada grau dos Presságios de combate muda nos monstros (calibrado com tests/calib-sonho.ts). */
export const OMEN_FOES = { hp: 0.12, damage: 0.1, haste: 0.07, bossHp: 0.3 };
const pc = (frac: number) => Math.round(frac * 100);

const O = (id: OmenId, name: string, icon: string, grades: number, weight: number, combat: boolean, desc: (g: number) => string): OmenDef => ({ id, name, icon, grades, weight, combat, desc });

export const OMENS: Record<OmenId, OmenDef> = {
  luaCheia: O('luaCheia', 'Lua Cheia', 'lua', 3, 1, true, (g) => `Os monstros têm ${pc(OMEN_FOES.hp * g)}% mais vida`),
  fome: O('fome', 'Fome', 'dano', 3, 2, true, (g) => `Os monstros causam ${pc(OMEN_FOES.damage * g)}% mais dano`),
  maoPesada: O('maoPesada', 'Mão Pesada', 'velAtaque', 3, 1, true, (g) => `Os monstros atacam ${pc(OMEN_FOES.haste * g)}% mais rápido`),
  bando: O('bando', 'Bando', 'elite', 2, 2, true, (g) => `Elites ganham ${g === 1 ? 'um modificador' : 'dois modificadores'} a mais`),
  chefeTeimoso: O('chefeTeimoso', 'Chefe Teimoso', 'coroa', 1, 3, true, () => `Os chefes têm ${pc(OMEN_FOES.bossHp)}% mais vida`),
  poucasVelas: O('poucasVelas', 'Poucas Velas', 'cura', 2, 1, false, (g) => (g === 1 ? 'As Fontes curam a metade' : 'As Fontes não curam: só devolvem as poções')),
  feiraCara: O('feiraCara', 'Feira Cara', 'vender', 3, 1, false, (g) => `Os preços da Feira ficam ${30 * g}% maiores`),
  rodaViciada: O('rodaViciada', 'Roda Viciada', 'roda', 1, 2, false, () => 'A Roda do Saci tem um padrinho a menos e mais Olhos'),
  semPadrinho: O('semPadrinho', 'Sem Padrinho', 'altar', 1, 2, false, () => 'O passo de altares de cada trecho vira combate'),
  pressa: O('pressa', 'Pressa', 'relogio', 3, 1, false, (g) => `Passou de ${HURRY_SECONDS[g] / 60} min de luta num trecho, os monstros causam 50% mais dano até o fim dele`),
  esquecimento: O('esquecimento', 'Esquecimento', 'olho', 1, 3, false, () => 'Em cada trecho, um dos seus feitiços fica esquecido'),
  juizo: O('juizo', 'Juízo', 'caveira', 1, 2, false, () => 'Perder uma Provação acaba com a noite'),
};

export const OMEN_ORDER = Object.keys(OMENS) as OmenId[];

export const OMEN = {
  /** Lembranças a mais por ponto de Peso, e o teto. */
  memoriesPerPoint: 0.08, maxBonus: 2,
  /** Marcos de Peso (contam para as conquistas). */
  marks: [8, 16, 24, 32],
  /** Na campanha: Peso máximo, e o que cada ponto dá no saque. */
  campaignMax: 10, rarityPerPoint: 0.04, goldPerPoint: 0.03,
};

export function omenGrade(pick: OmenPick | undefined, id: OmenId): number {
  return Math.max(0, Math.min(OMENS[id].grades, Math.floor(pick?.[id] ?? 0)));
}

export function omenWeight(pick: OmenPick | undefined): number {
  let n = 0;
  for (const id of OMEN_ORDER) n += omenGrade(pick, id) * OMENS[id].weight;
  return n;
}

/** Tira o que não existe e, se `combatOnly`, os Presságios que só fazem sentido no Sonho. */
export function cleanOmens(pick: OmenPick | undefined, combatOnly = false): OmenPick {
  const out: OmenPick = {};
  for (const id of OMEN_ORDER) { const g = omenGrade(pick, id); if (g > 0 && (!combatOnly || OMENS[id].combat)) out[id] = g; }
  return out;
}

/** O que os Presságios de combate fazem com os monstros (vai em `StageConfig.foes`). */
export function omenFoes(pick: OmenPick | undefined): { hp: number; damage: number; windup: number; eliteMods: number; bossHp: number } {
  return {
    hp: 1 + OMEN_FOES.hp * omenGrade(pick, 'luaCheia'),
    damage: 1 + OMEN_FOES.damage * omenGrade(pick, 'fome'),
    windup: 1 / (1 + OMEN_FOES.haste * omenGrade(pick, 'maoPesada')),
    eliteMods: omenGrade(pick, 'bando'),
    bossHp: omenGrade(pick, 'chefeTeimoso') ? 1 + OMEN_FOES.bossHp : 1,
  };
}

/** Lembranças a mais pelo Peso da noite (0,08 por ponto, até +200%). */
export function omenMemories(pick: OmenPick | undefined): number {
  return Math.min(OMEN.maxBonus, OMEN.memoriesPerPoint * omenWeight(pick));
}
