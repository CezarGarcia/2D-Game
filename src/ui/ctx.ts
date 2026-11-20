/**
 * Estado das telas (o que está selecionado, ordenação, avisos) e o contexto que cada tela recebe.
 * Nada disto é salvo no perfil: é só memória de interface.
 */
import type { ElementId, SpellId } from '../data/content';
import type { Profile } from '../meta/profile';
import type { CampTab, UiHost } from './host';

/** Tamanho lógico da tela, igual ao do canvas do jogo. */
export const VIEW_W = 1280;
export const VIEW_H = 720;
/** Área das telas do acampamento: ao lado da barra de ícones e abaixo do HUD. */
export const DOCK_W = 84;
export const HUD_H = 46;
export const MAIN_W = VIEW_W - DOCK_W;
export const MAIN_H = VIEW_H - HUD_H;

export type InvSort = 'novo' | 'raridade' | 'nivel' | 'tipo';
export type ForgeMode = 'aprimorar' | 'fundir' | 'encantar' | 'reforjar' | 'gemas';
/** Abas do acampamento: as do contrato com o jogo e a Torre, que só a interface conhece. */
export type Tab = CampTab | 'torre';

export interface CostLine { icon: string; amount: number; have: number }

export interface ConfirmSpec {
  title: string;
  /** Uma linha curta, opcional. */
  text?: string;
  icon?: string;
  /** Custo em ícone + número. Vazio = grátis. */
  cost?: CostLine[];
  ok: string;
  danger?: boolean;
  run(): void;
}

export interface ItemMenu {
  id: number;
  /** Posição no palco, em pixels lógicos. */
  x: number; y: number;
  /** Ação perigosa à espera do segundo clique. */
  armed?: 'vender' | 'desmontar';
}

export interface ForgeFx { ok: boolean; text: string; sub?: string; color?: string }

export interface UiState {
  tab: Tab;
  chapter: number;
  mapSel: string | null;
  invSort: InvSort;
  menu: ItemMenu | null;
  forgeMode: ForgeMode;
  forgeSel: number | null;
  forgeFodder: number[];
  forgeAffix: number | null;
  /** Animação do último golpe do martelo; some depois de mostrada uma vez. */
  forgeFx: ForgeFx | null;
  /** Enquadramento da teia de talentos (nulo = teia inteira). */
  web: { z: number; x: number; y: number } | null;
  spellSel: SpellId | null;
  /** Aba de elemento aberta na tela de feitiços (nulo = a do primeiro feitiço equipado). */
  spellEl: ElementId | null;
  /** Filtro de elemento na tela de companheiros (nulo = todos). */
  compFilter: ElementId | null;
  /** Cartão de história de capítulo aberto no mapa. */
  story: number | null;
  options: boolean;
  confirm: ConfirmSpec | null;
  toast: { text: string; tone: 'ok' | 'bad'; at: number } | null;
}

export function newState(): UiState {
  return {
    tab: 'mapa', chapter: 1, mapSel: null, invSort: 'novo', menu: null,
    forgeMode: 'aprimorar', forgeSel: null, forgeFodder: [], forgeAffix: null, forgeFx: null,
    web: null, spellSel: null, spellEl: null, compFilter: null, story: null, options: false, confirm: null, toast: null,
  };
}

export interface Ctx {
  host: UiHost;
  /** Perfil atual, lido do jogo no momento do uso. */
  readonly p: Profile;
  st: UiState;
  /** Remonta a tela sem salvar (mudou só a seleção). `focus` é a chave do elemento que recebe o foco. */
  redraw(focus?: string): void;
  /** Salva o perfil e remonta a tela (mudou o perfil). */
  commit(focus?: string): void;
  go(tab: Tab): void;
  /** Mantém um canvas animado enquanto ele estiver na tela. */
  animate(canvas: HTMLCanvasElement, draw: (g: CanvasRenderingContext2D, t: number) => void): void;
  /** Aviso curto que some sozinho. */
  toast(text: string, tone?: 'ok' | 'bad'): void;
  /** Pede confirmação numa janelinha. */
  confirm(spec: ConfirmSpec): void;
  /** Converte a posição do mouse para pixels lógicos do palco. */
  point(e: { clientX: number; clientY: number }): { x: number; y: number };
  /** Ampliação atual do palco. */
  scale(): number;
  /** Esconde os tooltips enquanto algo é arrastado. */
  muteTips(on: boolean): void;
  /** Verdadeiro quando o jogador pediu menos movimento. */
  readonly still: boolean;
}

/** Ícone de cada material (chaves de src/art/uiicons.ts). */
export const MAT_ICON = { mata: 'resina', po: 'po', lagrima: 'lagrima', tomo: 'tomo' } as const;

/* ---------- novidades já vistas (para a bolinha de aviso da barra de ícones) ---------- */

const SEEN_KEY = 'encantados.ui.vistos.v1';
export type SeenKind = 'feiticos' | 'companheiros' | 'supremos' | 'capitulos';
type Seen = Record<SeenKind, string[]>;

function readSeen(): Seen {
  const base: Seen = { feiticos: ['dardo'], companheiros: [], supremos: [], capitulos: [] };
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) { const v = JSON.parse(raw) as Partial<Seen>; for (const k of Object.keys(base) as SeenKind[]) if (Array.isArray(v[k])) base[k] = v[k]!.map(String); }
  } catch { /* sem armazenamento: tudo conta como visto só nesta sessão */ }
  return base;
}

let seen: Seen | null = null;

/** Itens de `ids` que o jogador ainda não viu na tela correspondente. */
export function unseen(kind: SeenKind, ids: readonly string[]): string[] {
  seen ??= readSeen();
  const known = seen[kind];
  return ids.filter((id) => !known.includes(id));
}

export function markSeen(kind: SeenKind, ids: readonly string[]): void {
  seen ??= readSeen();
  const fresh = ids.filter((id) => !seen![kind].includes(id));
  if (!fresh.length) return;
  seen[kind].push(...fresh);
  try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch { /* fica só na memória */ }
}

export function forgetSeen(): void {
  seen = null;
  try { localStorage.removeItem(SEEN_KEY); } catch { /* nada a apagar */ }
}
