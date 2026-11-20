/**
 * Utilidades das telas de menu: criação de elementos, ícones em canvas e formatação de números.
 * Nada aqui conhece regra de jogo.
 */
import { drawItemIcon } from '../art/icons';
import { drawUiIcon } from '../art/uiicons';

export type Child = Node | string | number | null | undefined | false | Child[];
export type Attrs = Record<string, unknown> | string | null;

const SVG_NS = 'http://www.w3.org/2000/svg';

function apply(el: Element, attrs: Attrs | undefined): void {
  if (!attrs) return;
  if (typeof attrs === 'string') { el.setAttribute('class', attrs); return; }
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

function append(el: Node, kids: Child[]): void {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** Cria um elemento HTML. O segundo argumento é um objeto de atributos ou só o nome da classe. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Attrs, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  apply(el, attrs);
  append(el, kids);
  return el;
}

/** Cria um elemento SVG. */
export function s(tag: string, attrs?: Attrs, ...kids: Child[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, attrs);
  append(el, kids);
  return el;
}

/* ---------- ícones ---------- */

/** Resolução interna dos ícones e retratos: o dobro, para continuarem nítidos com a tela ampliada. */
export const HD = 2;

const iconCache = new Map<string, HTMLCanvasElement>();

function baked(kind: 'ui' | 'item', key: string, size: number): HTMLCanvasElement {
  const id = `${kind}:${key}:${size}`;
  let cv = iconCache.get(id);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = cv.height = size * HD;
    const g = cv.getContext('2d');
    if (g) {
      g.scale(HD, HD);
      try { (kind === 'item' ? drawItemIcon : drawUiIcon)(g, key, size); } catch { /* um ícone com defeito não pode derrubar o menu */ }
    }
    iconCache.set(id, cv);
  }
  return cv;
}

function iconCanvas(kind: 'ui' | 'item', key: string, size: number, cls: string): HTMLCanvasElement {
  const cv = h('canvas', { class: `ico ${cls}`.trim(), width: size * HD, height: size * HD, style: `width:${size}px;height:${size}px`, 'aria-hidden': 'true' });
  cv.getContext('2d')?.drawImage(baked(kind, key, size), 0, 0);
  return cv;
}

/** Ícone da interface (chaves de src/art/uiicons.ts). */
export function ui(key: string, size = 24, cls = ''): HTMLCanvasElement {
  return iconCanvas('ui', key, size, cls);
}

/** Ícone de um tipo de item. */
export function itemIcon(type: string, size = 40, cls = ''): HTMLCanvasElement {
  return iconCanvas('item', type, size, cls);
}

/** Canvas com o dobro da resolução, já escalado para desenhar em pixels lógicos. */
export function hdCanvas(w: number, hgt: number, cls = ''): { cv: HTMLCanvasElement; g: CanvasRenderingContext2D | null } {
  const cv = h('canvas', { class: cls, width: w * HD, height: hgt * HD, style: `width:${w}px;height:${hgt}px`, 'aria-hidden': 'true' });
  const g = cv.getContext('2d');
  g?.setTransform(HD, 0, 0, HD, 0, 0);
  return { cv, g };
}

const backdropCache = new Map<string, HTMLCanvasElement>();

/**
 * Fundo pintado de uma tela. Pinta uma vez e reaproveita o mesmo canvas nas próximas vezes,
 * porque a pintura pode ser cara e a tela é remontada a cada clique.
 */
export function backdrop(key: string, w: number, hgt: number, paint: (g: CanvasRenderingContext2D) => void, res = 1.5): HTMLCanvasElement {
  let cv = backdropCache.get(key);
  if (!cv) {
    cv = h('canvas', { class: 'backdrop', width: Math.round(w * res), height: Math.round(hgt * res), style: `width:${w}px;height:${hgt}px`, 'aria-hidden': 'true' });
    const g = cv.getContext('2d');
    if (g) {
      g.setTransform(res, 0, 0, res, 0, 0);
      try { paint(g); } catch (err) { console.warn('Fundo do menu falhou:', err); }
    }
    backdropCache.set(key, cv);
  }
  return cv;
}

/* ---------- peças pequenas ---------- */

const STAR_PATH = 'M12 1.6l3.2 6.6 7.2.9-5.3 5 1.4 7.2L12 17.8l-6.5 3.5 1.4-7.2-5.3-5 7.2-.9z';

export function star(on: boolean, size = 18, extra = ''): SVGElement {
  return s('svg', { class: `star ${on ? 'on' : 'off'} ${extra}`.trim(), viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' },
    s('path', { d: STAR_PATH }));
}

/** Ícone + número, a peça básica da interface. `tone` pinta o número (falta = vermelho). */
export function stat(iconKey: string, value: Child, o: { size?: number; tone?: string; cls?: string } = {}): HTMLElement {
  return h('span', `stat ${o.tone ?? ''} ${o.cls ?? ''}`.trim(), ui(iconKey, o.size ?? 22), h('b', null, value));
}

/** Tecla desenhada (Q, E, R, T, F). */
export function keycap(k: string): HTMLElement {
  return h('kbd', 'key', k);
}

/* ---------- formatação ---------- */

export function num(n: number, digits = 0): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

/** Número com sinal: "+12", "−3". */
export function signed(n: number, digits = 0): string {
  return `${n < 0 ? '−' : '+'}${num(Math.abs(n), digits)}`;
}

/** Fração (0,25) como porcentagem ("25%"). */
export function pct(frac: number, digits = 0): string {
  return `${num(frac * 100, digits)}%`;
}

/** Segundos como mm:ss. */
export function clock(sec: number): string {
  const t = Math.max(0, Math.round(sec)), m = Math.floor(t / 60), r = t % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Troca o ponto decimal por vírgula nos textos que vêm prontos da camada de dados. */
export function br(text: string): string {
  return text.replace(/(\d)\.(\d)/g, '$1,$2');
}

/** Números grandes cabem no HUD: 12.345 vira "12,3 mil". */
export function compact(n: number): string {
  if (n >= 1_000_000) return `${num(n / 1_000_000, 1)} mi`;
  if (n >= 100_000) return `${num(Math.floor(n / 1000))} mil`;
  return num(n);
}
