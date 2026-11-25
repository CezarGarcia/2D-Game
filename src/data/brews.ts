/**
 * Garrafadas (docs/gdd/11): um preparo por fase, escolhido no painel antes de entrar e pago em material na hora de sair.
 * - de proteção: resistência a um elemento, para a fase toda;
 * - de têmpera: os golpes de arma passam a ser daquele elemento (pegam fraqueza, sofrem resistência e gastam a Casca).
 * O efeito entra no herói por `StatBoost` (src/meta/stats.ts). Valem na campanha e na Torre; o Sonho tem a economia dele.
 */
import { ELEMENTS, ELEMENT_ORDER, type ElementId } from './content';

export type BrewKind = 'res' | 'arma';
export type BrewId = `${BrewKind}-${ElementId}`;

export interface BrewDef {
  id: BrewId;
  kind: BrewKind;
  el: ElementId;
  name: string;
  desc: string;
  /** Material gasto ao entrar na fase com ela. */
  cost: { mata?: number; po?: number };
}

export const BREW = {
  /** Resistência que a garrafada de proteção dá. */
  res: 0.3,
  cost: { res: { mata: 10 }, arma: { po: 4 } } as Record<BrewKind, BrewDef['cost']>,
};

const HERB: Record<ElementId, string> = { natureza: 'Arruda', agua: 'Jurubeba', tempestade: 'Carqueja', fogo: 'Babosa', terra: 'Barbatimão', sombra: 'Guiné', encanto: 'Alecrim' };

export const BREWS = {} as Record<BrewId, BrewDef>;
for (const el of ELEMENT_ORDER) {
  const n = ELEMENTS[el].name;
  BREWS[`res-${el}`] = { id: `res-${el}`, kind: 'res', el, name: `Garrafada de ${HERB[el]}`, desc: `+${Math.round(BREW.res * 100)}% de resistência a ${n} nesta fase`, cost: BREW.cost.res };
  BREWS[`arma-${el}`] = { id: `arma-${el}`, kind: 'arma', el, name: `Têmpera de ${n}`, desc: `Nesta fase, os golpes de arma são de ${n}`, cost: BREW.cost.arma };
}
export const BREW_ORDER = Object.keys(BREWS) as BrewId[];

export function isBrewId(id: unknown): id is BrewId {
  return typeof id === 'string' && id in BREWS;
}
