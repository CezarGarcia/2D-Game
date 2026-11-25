/**
 * Aspectos de arma (docs/gdd/09): cada arma tem o jeito padrão e mais dois Aspectos, comprados com Lembranças.
 * Um Aspecto muda o golpe próprio da arma (aparar, tiro carregado, golpe carregado, estocada, último corte, orbe)
 * e vale no Sonho e na campanha. A simulação lê `HeroStats.aspect` nesses golpes (src/sim/player.ts e core.ts).
 */
import type { ElementId } from './content';
import type { WeaponKind } from './items';

export type AspectId =
  | 'facaoCurupira' | 'facaoVaqueiro'
  | 'arcoIara' | 'arcoCarcara'
  | 'bordunaMapinguari' | 'bordunaPaje'
  | 'zagaiaBoitata' | 'zagaiaPescador'
  | 'peixeirasSaci' | 'peixeirasLampiao'
  | 'cajadoCuca' | 'cajadoBenzedeira';

export interface AspectDef {
  id: AspectId;
  weapon: WeaponKind;
  /** "do Curupira", "do Vaqueiro"... */
  name: string;
  desc: string;
  /** Elemento que dá a cor (e o selo) do Aspecto. */
  element: ElementId | null;
  /** Lembranças para comprar. */
  cost: number;
}

const A = (id: AspectId, weapon: WeaponKind, name: string, element: ElementId | null, cost: number, desc: string): AspectDef => ({ id, weapon, name, element, cost, desc });

export const ASPECTS: Record<AspectId, AspectDef> = {
  facaoCurupira: A('facaoCurupira', 'facao', 'do Curupira', 'natureza', 120, 'Aparar um golpe solta espinhos em volta: ferem e prendem por 1 s quem estiver perto.'),
  facaoVaqueiro: A('facaoVaqueiro', 'facao', 'do Vaqueiro', null, 180, 'Aparar um golpe dá uma investida curta na direção da mira, que fere quem estiver no caminho.'),
  arcoIara: A('arcoIara', 'arco', 'da Iara', 'agua', 120, 'O tiro carregado molha o alvo e quem estiver em volta dele.'),
  arcoCarcara: A('arcoCarcara', 'arco', 'do Carcará', 'tempestade', 180, 'O tiro carregado marca o alvo: ele recebe 25% mais dano por 5 s.'),
  bordunaMapinguari: A('bordunaMapinguari', 'borduna', 'do Mapinguari', 'terra', 120, 'O golpe carregado abre uma fenda em linha, que fere e atordoa por 1 s.'),
  bordunaPaje: A('bordunaPaje', 'borduna', 'do Pajé', 'encanto', 180, 'O golpe carregado cura 3% da vida por inimigo acertado (até 12%).'),
  zagaiaBoitata: A('zagaiaBoitata', 'zagaia', 'do Boitatá', 'fogo', 120, 'A estocada deixa um rastro de fogo no chão.'),
  zagaiaPescador: A('zagaiaPescador', 'zagaia', 'do Pescador', 'agua', 180, 'A estocada puxa para perto os inimigos que acerta e os deixa molhados.'),
  peixeirasSaci: A('peixeirasSaci', 'peixeiras', 'do Saci', 'tempestade', 120, 'A esquiva perfeita deixa um redemoinho que gira em volta de você.'),
  peixeirasLampiao: A('peixeirasLampiao', 'peixeiras', 'de Lampião', null, 180, 'O último corte da sequência arremessa as duas peixeiras, que atravessam a fila.'),
  cajadoCuca: A('cajadoCuca', 'cajado', 'da Cuca', 'encanto', 120, 'O orbe do cajado alterna entre os elementos dos seus três feitiços.'),
  cajadoBenzedeira: A('cajadoBenzedeira', 'cajado', 'da Benzedeira', 'natureza', 180, 'O orbe do cajado estoura ao acertar e fere também quem está em volta.'),
};

export const ASPECT_ORDER = Object.keys(ASPECTS) as AspectId[];

export function aspectsOf(weapon: WeaponKind): AspectId[] {
  return ASPECT_ORDER.filter((id) => ASPECTS[id].weapon === weapon);
}
