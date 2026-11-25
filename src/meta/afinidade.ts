/**
 * Leitura de uma fase para o jogador (docs/gdd/11): que elementos os monstros dela usam, a que são fracos,
 * a que resistem, e o Preparo do herói (ou de uma build salva) contra isso.
 * As fraquezas de um monstro só aparecem depois do primeiro encontro (um abate dele em `p.life.kills`).
 */
import { affinityOf, affinitySign, attackElement } from '../data/affinity';
import type { EnemyKind } from '../data/balance';
import { ELEMENTS, ELEMENT_ORDER, SPELLS, type ElementId, type SpellId } from '../data/content';
import type { StageDef } from '../data/stages';
import { killsOf } from './life';
import type { Profile } from './profile';

export type Seal = 'verde' | 'amarelo' | 'vermelho' | 'cinza';

export interface StageReading {
  /** Elementos dos golpes dos monstros, do mais comum ao mais raro. */
  threat: ElementId[];
  /** Fraquezas e resistências dos monstros já conhecidos, do mais comum ao mais raro. */
  weak: ElementId[]; resist: ElementId[];
  /** Monstros da fase que o jogador ainda não enfrentou. */
  unknown: number; total: number;
}

/** O herói já enfrentou este monstro? */
export function knows(p: Profile, kind: EnemyKind): boolean {
  return killsOf(p.life, kind) > 0;
}

export function readStage(p: Profile, stage: StageDef): StageReading {
  const kinds = stage.kinds.filter((k) => k !== 'boneco'), seen = kinds.filter((k) => knows(p, k));
  const t: Partial<Record<ElementId, number>> = {}, wk: Partial<Record<ElementId, number>> = {}, rs: Partial<Record<ElementId, number>> = {};
  for (const k of kinds) { const el = attackElement(k); if (el) t[el] = (t[el] ?? 0) + 1; }
  for (const k of seen) { const a = affinityOf(k); for (const e of a.weak) wk[e] = (wk[e] ?? 0) + 1; for (const e of a.resist) rs[e] = (rs[e] ?? 0) + 1; }
  const sorted = (m: Partial<Record<ElementId, number>>) => ELEMENT_ORDER.filter((e) => m[e]).sort((a, b) => m[b]! - m[a]!);
  return { threat: sorted(t), weak: sorted(wk), resist: sorted(rs), unknown: kinds.length - seen.length, total: kinds.length };
}

export interface Prep { seal: Seal; reason: string; /** Nota de ataque, de −1 (tudo resistido) a +1 (tudo na fraqueza). */ score: number }

/**
 * Preparo de um conjunto de feitiços contra uma fase. Cada feitiço vale +1 por monstro fraco ao elemento dele
 * e −1 por monstro que resiste; a média diz a cor do selo, e a frase diz o que mais pesa.
 */
export function prepFor(p: Profile, stage: StageDef, loadout: (SpellId | null)[]): Prep {
  const kinds = stage.kinds.filter((k) => k !== 'boneco' && knows(p, k)), spells = loadout.filter((s): s is SpellId => !!s);
  if (!kinds.length) return { seal: 'cinza', score: 0, reason: 'Você ainda não enfrentou os monstros desta fase.' };
  if (!spells.length) return { seal: 'amarelo', score: 0, reason: 'Nenhum feitiço equipado.' };
  const per = (el: ElementId) => kinds.reduce((n, k) => n + affinitySign(k, el), 0) / kinds.length;
  const els = spells.map((s) => SPELLS[s].element), score = els.reduce((n, el) => n + per(el), 0) / els.length;
  const bad = els.filter((el) => per(el) <= -0.5), good = els.filter((el) => per(el) >= 0.34);
  const count = (list: ElementId[], el: ElementId) => list.filter((x) => x === el).length;
  const name = (el: ElementId) => ELEMENTS[el].name;
  /* a fraqueza mais comum da fase que o herói não está usando */
  const weak: Partial<Record<ElementId, number>> = {};
  for (const k of kinds) for (const e of affinityOf(k).weak) weak[e] = (weak[e] ?? 0) + 1;
  const best = ELEMENT_ORDER.filter((e) => weak[e]).sort((a, b) => weak[b]! - weak[a]!)[0];
  if (bad.length >= Math.max(1, Math.ceil(els.length / 2)) && !good.length) {
    const el = bad[0], n = count(els, el);
    return { seal: 'vermelho', score, reason: `${n === els.length ? 'Seus feitiços são' : n === 1 ? 'Um feitiço seu é' : `${n} dos seus feitiços são`} de ${name(el)}, e esta fase resiste a ${name(el)}.` };
  }
  if (good.length) {
    const el = good[0];
    return { seal: bad.length ? 'amarelo' : 'verde', score, reason: bad.length ? `${name(el)} pega a fraqueza da fase, mas ela resiste a ${name(bad[0])}.` : `${name(el)} pega a fraqueza da fase.` };
  }
  if (best && !els.includes(best)) return { seal: 'amarelo', score, reason: `A fase é fraca a ${name(best)}, e você não tem feitiço de ${name(best)} equipado.` };
  return { seal: bad.length ? 'amarelo' : 'verde', score, reason: bad.length ? `A fase resiste a ${name(bad[0])}.` : 'Nada nesta fase resiste aos seus feitiços.' };
}

export const SEAL_COLOR: Record<Seal, string> = { verde: '#5fcb6a', amarelo: '#f2c14e', vermelho: '#ff6b55', cinza: '#9aa39a' };
export const SEAL_LABEL: Record<Seal, string> = { verde: 'Bem preparado', amarelo: 'Dá para melhorar', vermelho: 'Mal preparado', cinza: 'Sem informação' };

/**
 * Os feitiços que um jogador atento levaria para a fase, entre os que o herói já sabe: projétil e área do elemento
 * que mais pega as fraquezas dela, e um controle que ela não resista. É o que o jogador automático usa na calibração.
 */
export function adaptedLoadout(known: SpellId[], kinds: EnemyKind[], current: (SpellId | null)[]): (SpellId | null)[] {
  const foes = kinds.filter((k) => k !== 'boneco');
  if (!foes.length) return current.slice();
  const per = (el: ElementId) => foes.reduce((n, k) => n + affinitySign(k, el), 0) / foes.length;
  const byRole = (role: string) => known.filter((s) => SPELLS[s].role === role).sort((a, b) => per(SPELLS[b].element) - per(SPELLS[a].element) || SPELLS[a].unlock - SPELLS[b].unlock);
  const pickFor = (slot: number, role: string): SpellId | null => {
    const cur = current[slot];
    if (!cur) return null;
    const best = byRole(role)[0];
    /* só troca se o novo for de fato melhor contra esta fase */
    return best && per(SPELLS[best].element) > per(SPELLS[cur].element) ? best : cur;
  };
  return [pickFor(0, 'Projétil'), pickFor(1, 'Área'), pickFor(2, 'Controle')];
}
