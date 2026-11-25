/**
 * Andanças (docs/gdd/09): os companheiros que não estão com o herói saem por 1, 4 ou 8 horas para um capítulo já vencido
 * e voltam com ouro, Resina, Pó e às vezes uma gema. Contam com o relógio, inclusive com o jogo fechado.
 * As vagas vêm do Viveiro (Aldeia). Por dia, só as primeiras `WALK.dailyHours` horas rendem: é um motivo para voltar,
 * não um jeito de jogar sem jogar.
 */
import { COMPANIONS, ELEMENT_ORDER, type CompanionId } from '../data/content';
import { stageGold } from '../data/progression';
import { CHAPTERS } from '../data/stages';
import { clockNow, dayKey } from './daily';
import { addGem, type Profile, type Walk } from './profile';

export const WALK = {
  hours: [1, 4, 8] as const,
  /** Horas de Andança que rendem por dia, somando todas as vagas (o equivalente a umas duas fases). */
  dailyHours: 8,
  /** Por hora: fração do ouro de uma fase do nível do herói, Resina e Pó. */
  goldPerHour: 0.25, mataPerHour: 3, poPerHour: 0.5,
  /** Chance de gema por hora. */
  gemPerHour: 0.04,
};

export interface WalkReward { hours: number; paid: number; gold: number; mata: number; po: number; gem: boolean }

/** Vagas abertas pelo Viveiro (0 sem ele). */
export function walkSlots(p: Profile): number {
  return Math.max(0, Math.min(3, p.village.viveiro ?? 0));
}

/** Capítulos para onde dá para mandar alguém: os já vencidos. */
export function walkChapters(p: Profile): number[] {
  return CHAPTERS.filter((c) => p.stages[`${c.id}-12`]?.cleared).map((c) => c.id);
}

/** Companheiros que podem sair agora: resgatados, fora do lado do herói e que ainda não saíram. */
export function walkers(p: Profile): CompanionId[] {
  const out = new Set(p.andancas.slots.filter(Boolean).map((w) => w!.id));
  return (Object.keys(p.companions) as CompanionId[]).filter((id) => p.companions[id] && COMPANIONS[id] && id !== p.companion && !out.has(id));
}

/** Horas que ainda rendem hoje. */
export function walkHoursLeft(p: Profile, now: Date = clockNow()): number {
  return p.andancas.day === dayKey(now) ? Math.max(0, WALK.dailyHours - p.andancas.hours) : WALK.dailyHours;
}

export function sendWalk(p: Profile, slot: number, id: CompanionId, chapter: number, hours: number, now: Date = clockNow()): boolean {
  if (slot < 0 || slot >= walkSlots(p) || p.andancas.slots[slot]) return false;
  if (!walkers(p).includes(id) || !walkChapters(p).includes(chapter) || !(WALK.hours as readonly number[]).includes(hours)) return false;
  p.andancas.slots[slot] = { id, chapter, hours, start: now.getTime() };
  return true;
}

/** Fração do caminho já andada (1 = voltou). */
export function walkProgress(w: Walk, now: Date = clockNow()): number {
  return Math.max(0, Math.min(1, (now.getTime() - w.start) / (w.hours * 3_600_000)));
}

/** O que a Andança de uma vaga vai render, com o que ainda cabe no limite de hoje. */
export function walkYield(p: Profile, w: Walk, now: Date = clockNow()): WalkReward {
  const paid = Math.min(w.hours, walkHoursLeft(p, now)), temper = p.companions[w.id]?.temper;
  return {
    hours: w.hours, paid,
    gold: Math.round(stageGold(p.level) * WALK.goldPerHour * paid),
    mata: Math.round(WALK.mataPerHour * paid * (temper === 'guloso' ? 1.5 : 1)),
    po: Math.floor(WALK.poPerHour * paid),
    gem: false,
  };
}

/** Recebe o que o companheiro trouxe e libera a vaga. Nulo se ele ainda não voltou. */
export function collectWalk(p: Profile, slot: number, now: Date = clockNow()): WalkReward | null {
  const w = p.andancas.slots[slot];
  if (!w || walkProgress(w, now) < 1) return null;
  const out = walkYield(p, w, now), today = dayKey(now);
  if (p.andancas.day !== today) { p.andancas.day = today; p.andancas.hours = 0; }
  p.andancas.hours += out.paid;
  p.gold += out.gold; p.life.gold += out.gold;
  p.materials.mata += out.mata; p.materials.po += out.po;
  /* gema: a chance cresce com as horas pagas; o sorteio sai da partida e da vaga, para recarregar a página não mudar o resultado */
  const chance = Math.min(0.9, WALK.gemPerHour * out.paid * (p.companions[w.id]?.temper === 'curioso' ? 2 : 1));
  let v = 2166136261;
  for (const ch of `${p.seed}|${w.id}|${w.start}`) v = Math.imul(v ^ ch.charCodeAt(0), 16777619);
  if (((v >>> 0) % 10_000) / 10_000 < chance) { out.gem = true; addGem(p, { el: ELEMENT_ORDER[Math.max(0, Math.min(6, w.chapter - 1))], lvl: 1 }); }
  p.andancas.slots[slot] = null;
  return out;
}

/** Chama de volta quem saiu, sem render nada. */
export function cancelWalk(p: Profile, slot: number): boolean {
  if (!p.andancas.slots[slot]) return false;
  p.andancas.slots[slot] = null;
  return true;
}
