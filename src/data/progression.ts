/**
 * Fórmulas de progressão do documento de design (docs/gdd/01-progressao-e-dificuldade.md).
 * São valores iniciais: ajustar aqui, não espalhar números pelo código.
 */
import { fpow } from '../sim/fmath';

export const MAX_LEVEL_CAMPAIGN = 60;
export const STAGE_COUNT = 96;

/** XP para subir do nível `level` para `level + 1`. */
export function xpNeeded(level: number): number {
  const stagesAtLevel = 0.45 + 0.085 * fpow(level, 1.2);
  return Math.round((stagesAtLevel * stageXp(level)) / 5) * 5;
}

/** Nível dos monstros da fase de índice `i` (0 = fase 1-1, 95 = fase 8-12). */
export function stageLevel(i: number): number {
  /* O começo sobe rápido: um nível por fase no Capítulo 1 e quase isso no 2. Depois a subida fica mais lenta. */
  if (i < 12) return 1 + i;
  if (i < 24) return 13 + Math.round(((i - 12) * 10) / 11);
  return 24 + Math.round(((i - 24) * 36) / 71);
}

export function stageXp(level: number): number {
  return 20 + 12 * level;
}

export function stageGold(level: number): number {
  return 30 + 8 * level;
}

/** Multiplicador de XP conforme a diferença entre o nível do personagem e o da fase. */
export function xpMultiplier(playerLevel: number, level: number): number {
  const diff = playerLevel - level;
  if (diff <= -3) return Math.min(1.3, 1 + 0.1 * (-diff - 2));
  if (diff <= 2) return 1;
  const table: Record<number, number> = { 3: 0.85, 4: 0.7, 5: 0.55, 6: 0.4, 7: 0.25 };
  return table[diff] ?? 0.1;
}

/** O ouro cai mais devagar que o XP, para fases antigas continuarem úteis. */
export function goldMultiplier(playerLevel: number, level: number): number {
  const diff = playerLevel - level;
  return diff <= 4 ? 1 : Math.max(0.3, 1 - 0.1 * (diff - 4));
}

/**
 * Modificadores de combate pela diferença de nível entre personagem e monstro.
 * Estar abaixo pesa muito (4% por nível, até 40%); estar acima ajuda pouco (2%, até 10%).
 */
export function levelCombatModifiers(playerLevel: number, monsterLevel: number): { dealt: number; taken: number } {
  const diff = playerLevel - monsterLevel;
  if (diff < 0) {
    const pen = Math.min(0.4, 0.04 * -diff);
    return { dealt: 1 - pen, taken: 1 + pen };
  }
  const bonus = Math.min(0.1, 0.02 * diff);
  return { dealt: 1 + bonus, taken: 1 - bonus };
}

export const FIRST_CLEAR_XP_BONUS = 1.5;
export const BOSS_STAGE_XP_BONUS = 2;
