/**
 * Temperamento e Laço dos companheiros (docs/gdd/09).
 * O Temperamento é sorteado quando o companheiro é resgatado e muda um pouco como ele luta ou o que traz das Andanças.
 * O Laço sobe de 1 a 5 conforme o companheiro acompanha o herói, e deixa ele mais forte.
 */
export type TemperId = 'brabo' | 'manso' | 'ligeiro' | 'guloso' | 'curioso' | 'leal' | 'sortudo' | 'medroso';

export interface TemperDef { id: TemperId; name: string; icon: string; desc: string }

export const TEMPERS: Record<TemperId, TemperDef> = {
  brabo: { id: 'brabo', name: 'Brabo', icon: 'furia', desc: '+15% de dano, −10% de vida' },
  manso: { id: 'manso', name: 'Manso', icon: 'vida', desc: '+20% de vida, −10% de dano' },
  ligeiro: { id: 'ligeiro', name: 'Ligeiro', icon: 'recarga', desc: 'A habilidade recarrega 15% mais rápido' },
  guloso: { id: 'guloso', name: 'Guloso', icon: 'resina', desc: '+50% de Resina nas Andanças' },
  curioso: { id: 'curioso', name: 'Curioso', icon: 'gema', desc: 'O dobro de chance de trazer uma gema das Andanças' },
  leal: { id: 'leal', name: 'Leal', icon: 'companheiro', desc: 'O Laço sobe duas vezes mais rápido' },
  sortudo: { id: 'sortudo', name: 'Sortudo', icon: 'sorte', desc: '+10 de Sorte quando está com você' },
  medroso: { id: 'medroso', name: 'Medroso', icon: 'esquiva', desc: 'Volta rápido depois de cair, mas causa 10% menos dano' },
};
export const TEMPER_ORDER = Object.keys(TEMPERS) as TemperId[];

export const BOND = {
  /** Fases (ou trechos do Sonho) juntos para chegar a cada nível de Laço, do 1 ao 5. */
  steps: [0, 4, 12, 28, 60],
  /** Dano e vida do companheiro a mais, por nível de Laço acima do primeiro. */
  perLevel: 0.03,
  /** Lembranças para sortear outro Temperamento. */
  reroll: 40,
};

/** Nível de Laço (1 a 5) para um total de fases juntos. */
export function bondLevel(played = 0): number {
  let lv = 1;
  for (let i = 1; i < BOND.steps.length; i++) if (played >= BOND.steps[i]) lv = i + 1;
  return lv;
}
/** Quantas fases faltam para o próximo nível de Laço (nulo no máximo). */
export function bondNext(played = 0): number | null {
  const lv = bondLevel(played);
  return lv >= BOND.steps.length ? null : BOND.steps[lv] - played;
}
