/**
 * Estado das telas (o que está selecionado, ordenação, avisos) e o contexto que cada tela recebe.
 * Nada disto é salvo no perfil: é só memória de interface.
 */
import type { AchievementGroup } from '../data/achievements';
import type { EnemyKind } from '../data/balance';
import type { CompanionId, ElementId, SpellId } from '../data/content';
import type { BrewId } from '../data/brews';
import type { BuildingId } from '../data/village';
import type { OmenPick } from '../data/omens';
import type { NightChoice, NightEnd } from '../meta/dream';
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

export type InvSort = 'novo' | 'raridade' | 'nivel' | 'tipo' | 'poder';
export type InvFilter = 'tudo' | 'armas' | 'armaduras' | 'joias' | 'melhores';
export type ForgeMode = 'aprimorar' | 'fundir' | 'encantar' | 'reforjar' | 'gemas';
/** Abas do acampamento: as do contrato com o jogo e a Torre e o Diário, que só a interface conhece. */
export type Tab = CampTab | 'torre' | 'diario' | 'almanaque' | 'sonho';

/** Seções do Almanaque. */
export type AlmTab = 'conquistas' | 'bestiario' | 'itens' | 'sonho';

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
  invFilter: InvFilter;
  /** Item escolhido na tela do herói (na mochila ou equipado). */
  heroSel: number | null;
  /** Painel da direita na tela do herói. */
  heroPane: 'item' | 'stats';
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
  /** Almanaque: seção aberta, grupo de conquistas, capítulo e bicho escolhidos no bestiário. */
  alm: { tab: AlmTab; group: AchievementGroup | null; chapter: number; kind: EnemyKind | null };
  /** Caçada automática: repetições e velocidade escolhidas no mapa. */
  huntRuns: number; huntSpeed: number;
  /** Janelinha das builds salvas (tela do herói). */
  builds: boolean;
  /** O Sonho: a escolha de quem vai sonhar, o resumo de quem acabou de acordar e o modo de tirar bênção na Feira. */
  dream: {
    choice: NightChoice | null; end: NightEnd | null; removing: boolean;
    /** Aba aberta antes da noite e os Presságios marcados para a próxima. */
    tab: 'heroi' | 'cordeis' | 'pressagios'; omens: OmenPick;
    /** Roda do Saci: o que animar no próximo desenho (tudo, ou só uma coluna) e se o próximo clique numa casa é um Assobio. */
    rolled: 'all' | number | null; whistle: boolean;
    /** A cena da Aldeia aberta, a construção escolhida nela e a Andança que está sendo montada. */
    village: boolean; building: BuildingId; walk: { id: CompanionId | null; chapter: number; hours: number };
    /** Momento de exagero a mostrar no próximo desenho (sorte grande, Despertar): título, linha de baixo e cor. */
    moment: { title: string; sub: string; color: string } | null;
  };
  /** Presságios marcados para a próxima fase da campanha, e se a janelinha deles está aberta. */
  omens: OmenPick; omenOpen: boolean;
  /** Garrafada escolhida para a próxima fase (gasta ao entrar), e se a janelinha delas está aberta. */
  brew: BrewId | null; brewOpen: boolean;
  options: boolean;
  confirm: ConfirmSpec | null;
  toast: { text: string; tone: 'ok' | 'bad'; at: number } | null;
}

export function newState(): UiState {
  return {
    tab: 'mapa', chapter: 1, mapSel: null, invSort: 'poder', invFilter: 'tudo', heroSel: null, heroPane: 'stats', menu: null,
    forgeMode: 'aprimorar', forgeSel: null, forgeFodder: [], forgeAffix: null, forgeFx: null,
    web: null, spellSel: null, spellEl: null, compFilter: null,
    alm: { tab: 'conquistas', group: null, chapter: 1, kind: null }, huntRuns: 3, huntSpeed: 2, builds: false, dream: { choice: null, end: null, removing: false, tab: 'heroi', omens: {}, rolled: null, whistle: false, village: false, building: 'rancho', walk: { id: null, chapter: 1, hours: 4 }, moment: null }, omens: {}, omenOpen: false, brew: null, brewOpen: false,
    options: false, confirm: null, toast: null,
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
