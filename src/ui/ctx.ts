/**
 * Estado das telas (o que está selecionado, filtros, avisos) e o contexto que cada tela recebe.
 * Nada disto é salvo: é só memória de interface.
 */
import type { SlotGroup } from '../data/items';
import type { Profile } from '../meta/profile';
import type { CampTab, UiHost } from './host';

export type InvSort = 'raridade' | 'nivel' | 'novo';

export interface ForgeResult {
  ok: boolean;
  title: string;
  text: string;
}

export interface UiState {
  tab: CampTab;
  mapSel: string | null;
  heroSel: number | null;
  heroFilter: SlotGroup | 'todos';
  heroSort: InvSort;
  /** Ação à espera do segundo clique de confirmação. */
  armed: string | null;
  note: string | null;
  forgeMode: 'aprimorar' | 'fundir';
  forgeSel: number | null;
  forgeFodder: number[];
  forgeResult: ForgeResult | null;
  talentSel: string | null;
  confirmReset: boolean;
}

export function newState(): UiState {
  return {
    tab: 'mapa', mapSel: null, heroSel: null, heroFilter: 'todos', heroSort: 'novo', armed: null, note: null,
    forgeMode: 'aprimorar', forgeSel: null, forgeFodder: [], forgeResult: null, talentSel: null, confirmReset: false,
  };
}

export interface Ctx {
  host: UiHost;
  /** Perfil atual, lido do jogo no momento do uso. */
  readonly p: Profile;
  st: UiState;
  /** Redesenha a tela sem salvar (mudou só a seleção). `focus` é a chave do elemento que recebe o foco. */
  redraw(focus?: string): void;
  /** Salva o perfil e redesenha (mudou o perfil). */
  commit(): void;
  go(tab: CampTab): void;
  /** Mantém um canvas animado enquanto ele estiver na tela. */
  animate(canvas: HTMLCanvasElement, draw: (g: CanvasRenderingContext2D, t: number) => void): void;
}

/**
 * Botões de ação perigosa pedem dois cliques: o primeiro arma, o segundo executa.
 * Devolve true quando é hora de executar.
 */
export function confirmStep(c: Ctx, key: string): boolean {
  if (c.st.armed === key) { c.st.armed = null; return true; }
  c.st.armed = key;
  c.redraw();
  return false;
}
