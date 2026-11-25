/**
 * Afinidades elementais (docs/gdd/11): a que elemento cada monstro é fraco e a quais resiste.
 *
 * A base é a Roda dos elementos: um monstro é fraco ao elemento que vence o dele, e resiste ao próprio
 * elemento e ao que o dele vence. Por cima da Roda, alguns monstros têm exceções escritas à mão,
 * para as fases de um mesmo capítulo pedirem coisas diferentes.
 * A simulação lê `affinityOf` no dano ao inimigo (src/sim/core.ts); a tela lê no mapa e no Bestiário.
 */
import type { EnemyKind } from './balance';
import { BOSSES, MONSTERS } from './bestiary';
import { ELEMENT_ORDER, type ElementId } from './content';

/** A Roda: cada elemento e os que ele vence. Sombra e Encanto se desfazem um ao outro. */
export const BEATS: Record<ElementId, ElementId[]> = {
  agua: ['fogo'], fogo: ['natureza'], natureza: ['terra'], terra: ['tempestade'], tempestade: ['agua'],
  sombra: ['encanto'], encanto: ['sombra'],
};

export const AFFINITY = {
  /** Dano no monstro: fraco e resistente. O bônus é maior que o castigo, e nada é imune. */
  weak: 1.5, resist: 0.65,
  /** Teimosia nunca tira mais que esta parte do castigo. */
  maxTeimosia: 0.6,
  /** Resistência do herói: do pior (itens que cobram uma fraqueza) ao teto. */
  minRes: -0.5, maxRes: 0.75,
  /** Casca elemental: tamanho em fração da vida (elite e chefe), dano a menos enquanto existe e quanto cada golpe tira dela. */
  shell: { elite: 0.22, boss: 0.14, guard: 0.3, weak: 3, resist: 0.5 },
  /** Casca quebrada: segundos Exposto, dano a mais nesse tempo e segundos até a Casca voltar. */
  exposed: { seconds: 4.5, bonus: 0.5, regrow: 16 },
};

export interface Affinity { weak: ElementId[]; resist: ElementId[] }
const NONE: Affinity = { weak: [], resist: [] };

/** Fraquezas e resistências que a Roda dá a um monstro do elemento `el`. */
export function wheelAffinity(el: ElementId | null): Affinity {
  if (!el) return NONE;
  const weak = ELEMENT_ORDER.filter((x) => BEATS[x].includes(el));
  return { weak, resist: [el, ...BEATS[el]].filter((x) => !weak.includes(x)) };
}

/** Capítulos 1 e 2 só ensinam: os monstros de lá têm fraqueza, mas não resistem a nada. */
const TEACH: Partial<Record<EnemyKind, ElementId>> = {
  sauva: 'natureza', queixada: 'natureza', cuspidor: 'natureza', tronco: 'natureza', urutau: 'natureza', cogumelo: 'natureza', caipora: 'natureza', curupira: 'natureza',
  piranha: 'agua', sapo: 'agua', arraia: 'agua', caramujo: 'agua', jacare: 'agua', boto: 'agua', iara: 'agua',
};

/**
 * Exceções à Roda: `weak` soma fraquezas (e tira o elemento das resistências), `resist` soma resistências,
 * `only` troca tudo pelo que está escrito.
 */
const EXTRA: Partial<Record<EnemyKind, { weak?: ElementId[]; resist?: ElementId[]; only?: boolean }>> = {
  /* 1 · Mata: formiga afoga, e o que é de pau queima */
  sauva: { weak: ['agua'] },
  /* 2 · Rios: a casca racha, e veneno pega bem em bicho de lodo */
  caramujo: { weak: ['terra'] }, sapo: { weak: ['natureza'] }, arraia: { weak: ['natureza'] },
  /* 3 · Sertão */
  calango: { weak: ['natureza'] }, urubu: { weak: ['agua'] }, mandacaru: { weak: ['fogo'], resist: ['natureza'] }, corposeco: { weak: ['fogo'] },
  /* 4 · Cerrado */
  seriema: { weak: ['tempestade'] }, cupinzeiro: { weak: ['tempestade'] },
  /* 5 · Selva: o que voa não tem terra para aterrar o raio */
  morcego: { weak: ['tempestade', 'fogo'] }, aranha: { weak: ['fogo'] }, totem: { weak: ['agua'] },
  /* 6 · Pampa: a noite teme o fogo */
  fatuo: { weak: ['agua'], resist: ['fogo'] }, almapenada: { weak: ['fogo'], resist: ['natureza', 'terra'] }, espantalho: { weak: ['fogo'] }, queroquero: { weak: ['tempestade'] },
  boibarroso: { weak: ['terra'] }, lobisomem: { weak: ['fogo'] }, teiniagua: { weak: ['agua'] },
  /* 7 · Pantanal */
  ariranha: { resist: ['agua'] }, cururu: { weak: ['tempestade'] }, soco: { weak: ['tempestade'] }, tracaja: { weak: ['terra'] },
};

const cache = new Map<string, Affinity>();

/** Elemento de um tipo de monstro ou chefe (nulo para os sem elemento). */
export function kindElement(kind: EnemyKind): ElementId | null {
  return (MONSTERS as Record<string, { element: ElementId | null }>)[kind]?.element ?? (BOSSES as Record<string, { element: ElementId | null }>)[kind]?.element ?? TEACH[kind] ?? null;
}

/** Elemento dos golpes de um monstro. Os dos capítulos 1 e 2 batem sem elemento, embora tenham fraqueza. */
export function attackElement(kind: EnemyKind): ElementId | null {
  return (MONSTERS as Record<string, { element: ElementId | null }>)[kind]?.element ?? (BOSSES as Record<string, { element: ElementId | null }>)[kind]?.element ?? null;
}

/** Fraquezas e resistências de um tipo de monstro. */
export function affinityOf(kind: EnemyKind): Affinity {
  const hit = cache.get(kind);
  if (hit) return hit;
  const el = kindElement(kind), teach = TEACH[kind] != null, x = EXTRA[kind] ?? {};
  const base = x.only ? NONE : wheelAffinity(el);
  const weak = [...new Set([...base.weak, ...(x.weak ?? [])])];
  const resist = [...new Set([...(teach ? [] : base.resist), ...(x.resist ?? [])])].filter((e) => !weak.includes(e));
  const out = { weak: ELEMENT_ORDER.filter((e) => weak.includes(e)), resist: ELEMENT_ORDER.filter((e) => resist.includes(e)) };
  cache.set(kind, out);
  return out;
}

/** +1 fraco, −1 resiste, 0 neutro. `extraWeak` é a fraqueza sorteada de quem não tem elemento (elites da Terra Sem Nome). */
export function affinitySign(kind: EnemyKind, el: ElementId, extraWeak: ElementId | null = null): -1 | 0 | 1 {
  if (extraWeak === el) return 1;
  const a = affinityOf(kind);
  return a.weak.includes(el) ? 1 : a.resist.includes(el) ? -1 : 0;
}

/** Multiplicador do dano de um elemento num monstro. Faro aumenta o bônus; Teimosia diminui o castigo, sem zerar. */
export function affinityMult(sign: -1 | 0 | 1, faro = 0, teimosia = 0): number {
  if (sign > 0) return 1 + (AFFINITY.weak - 1) * (1 + Math.max(0, faro));
  if (sign < 0) return 1 - (1 - AFFINITY.resist) * (1 - Math.max(0, Math.min(AFFINITY.maxTeimosia, teimosia)));
  return 1;
}

/** O que uma lista de monstros (os de uma fase) soma: elementos que usam, fraquezas e resistências, do mais comum ao mais raro. */
export function stageAffinity(kinds: EnemyKind[]): { threat: ElementId[]; weak: ElementId[]; resist: ElementId[]; count: (el: ElementId) => { weak: number; resist: number } } {
  const t: Partial<Record<ElementId, number>> = {}, wk: Partial<Record<ElementId, number>> = {}, rs: Partial<Record<ElementId, number>> = {};
  for (const k of kinds) {
    const el = (MONSTERS as Record<string, { element: ElementId | null }>)[k]?.element ?? (BOSSES as Record<string, { element: ElementId | null }>)[k]?.element ?? null, a = affinityOf(k);
    if (el) t[el] = (t[el] ?? 0) + 1;
    for (const e of a.weak) wk[e] = (wk[e] ?? 0) + 1;
    for (const e of a.resist) rs[e] = (rs[e] ?? 0) + 1;
  }
  const sorted = (m: Partial<Record<ElementId, number>>) => ELEMENT_ORDER.filter((e) => m[e]).sort((a, b) => m[b]! - m[a]!);
  return { threat: sorted(t), weak: sorted(wk), resist: sorted(rs), count: (el) => ({ weak: wk[el] ?? 0, resist: rs[el] ?? 0 }) };
}

/**
 * Quem tem Casca elemental numa fase (docs/gdd/11, "onde aperta e onde não"):
 * - campanha, capítulos 1 e 2: ninguém;
 * - campanha, capítulos 3 a 8: só o chefe das fases 11 e 12;
 * - campanha com Presságios ligados: toda elite e todo chefe;
 * - Torre: o chefe do andar a partir do 21, toda elite a partir do 51.
 * O Sonho decide por nó, em src/meta/dream.ts.
 */
export function stageShells(stage: { id: string; chapter: number; number: number; index: number }, omenWeight = 0): 'boss' | 'all' | undefined {
  if (stage.id.startsWith('torre-')) { const floor = Number(stage.id.split('-')[1]) || 0; return floor > 50 ? 'all' : floor > 20 ? 'boss' : undefined; }
  if (stage.index < 0) return undefined;
  if (omenWeight > 0) return 'all';
  return stage.chapter >= 3 && stage.number >= 11 ? 'boss' : undefined;
}

/** Elemento das Cascas de um bloco de dez andares da Torre: muda toda semana, para a build do ranking não ser sempre a mesma. */
export function towerElement(week: string, floor: number): ElementId {
  let v = 2166136261;
  for (const ch of `${week}|${Math.floor((Math.max(1, floor) - 1) / 10)}`) v = Math.imul(v ^ ch.charCodeAt(0), 16777619);
  return ELEMENT_ORDER[(v >>> 0) % ELEMENT_ORDER.length];
}
