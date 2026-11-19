/**
 * Utilidades das telas de menu: criação de elementos, ícones em canvas e formatação de números.
 * Nada aqui conhece regra de jogo.
 */
import { drawItemIcon, drawMiscIcon } from '../art/icons';

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

export interface BtnOpts {
  kind?: 'primary' | 'danger' | 'quiet';
  small?: boolean;
  disabled?: boolean;
  /** Chave para devolver o foco ao botão depois de redesenhar a tela. Por padrão, o próprio texto. */
  fk?: string;
  title?: string;
  pressed?: boolean;
  cls?: string;
  label?: string;
}

export function btn(label: Child, onClick: () => void, o: BtnOpts = {}): HTMLButtonElement {
  const cls = ['btn', o.kind, o.small && 'small', o.cls].filter(Boolean).join(' ');
  return h('button', {
    type: 'button', class: cls, disabled: o.disabled, title: o.title, 'aria-label': o.label,
    'aria-pressed': o.pressed == null ? null : String(o.pressed),
    'data-fk': o.fk ?? (typeof label === 'string' ? label : null),
    onclick: onClick,
  }, label);
}

/** Faz um grupo de SVG funcionar como botão: foco por Tab, Enter e Espaço ativam. */
export function svgButton(el: SVGElement, label: string, fk: string, onActivate: () => void, pressed?: boolean): SVGElement {
  apply(el, { tabindex: 0, role: 'button', 'aria-label': label, 'data-fk': fk, 'aria-pressed': pressed == null ? null : String(pressed) });
  el.addEventListener('click', onActivate);
  el.addEventListener('keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k === 'Enter' || k === ' ') { e.preventDefault(); onActivate(); }
  });
  return el;
}

/** Ícone desenhado por código, com o dobro da resolução para ficar nítido. */
export function icon(kind: 'item' | 'misc', key: string, size: number): HTMLCanvasElement {
  const cv = h('canvas', { class: 'ico', width: size * 2, height: size * 2, style: `width:${size}px;height:${size}px`, 'aria-hidden': 'true' });
  const g = cv.getContext('2d');
  if (g) {
    g.scale(2, 2);
    try { (kind === 'item' ? drawItemIcon : drawMiscIcon)(g, key, size); } catch { /* um ícone com defeito não pode derrubar o menu */ }
  }
  return cv;
}

const STAR_PATH = 'M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.7l-6.3 3.5 1.3-7.1L1.8 9.2l7.1-.9z';

export function star(on: boolean, size = 18, extra = ''): SVGElement {
  return s('svg', { class: `star ${on ? 'on' : 'off'} ${extra}`, viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true' },
    s('path', { d: STAR_PATH }));
}

export function stars(list: boolean[], size = 18, fresh: boolean[] = []): HTMLElement {
  const n = list.filter(Boolean).length;
  return h('span', { class: 'stars', role: 'img', 'aria-label': `${n} de ${list.length} estrelas` }, list.map((on, i) => star(on, size, fresh[i] ? 'fresh' : '')));
}

/* ---------- formatação ---------- */

export function num(n: number, digits = 0): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
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

export function plural(n: number, one: string, many: string): string {
  return `${num(n)} ${n === 1 ? one : many}`;
}
