/**
 * Tooltip único da interface. Qualquer elemento ganha um com `tip(el, spec)`.
 * Aparece na hora ao passar o mouse (segue o cursor e nunca sai da tela) e também quando o
 * elemento recebe foco pelo teclado (ancorado ao lado dele).
 */
import { h, ui, type Child } from './dom';

export type Tone = 'ok' | 'bad' | 'dim' | 'gold' | 'warn' | 'hot';

export interface TipLine {
  /** Chave de ícone de src/art/uiicons.ts. */
  icon?: string;
  /** Ícone já pronto (por exemplo, o de um item). */
  node?: Node;
  text: Child;
  /** Valor alinhado à direita. */
  value?: Child;
  tone?: Tone;
  /** Cor livre do texto (raridade, elemento, setor). */
  color?: string;
}

export type TipRow = TipLine | { head: string } | 'sep' | null | false | undefined;

export interface TipSpec {
  title: string;
  /** Cor do título e do filete da moldura. */
  color?: string;
  sub?: string;
  subColor?: string;
  /** Texto pequeno no canto direito do título ("2/5", "Nv 7"). */
  tag?: string;
  icon?: Node | null;
  rows?: TipRow[];
  /** Dicas de clique, no rodapé: "Clique: equipar". */
  foot?: (string | null | false | undefined)[];
}

type Source = TipSpec | (() => TipSpec | null);

const specs = new WeakMap<Element, Source>();

/** Liga um tooltip ao elemento. A função é chamada só na hora de mostrar. */
export function tip<T extends Element>(el: T, spec: Source): T {
  specs.set(el, spec);
  el.setAttribute('data-tip', '');
  return el;
}

function line(r: TipLine): HTMLElement {
  return h('div', { class: `tip-row ${r.tone ?? ''}`.trim(), style: r.color ? `color:${r.color}` : null },
    r.node ?? (r.icon ? ui(r.icon, 20) : h('span', 'tip-nob')),
    h('span', 'tip-text', r.text),
    r.value != null && r.value !== false && h('b', 'tip-val', r.value));
}

function build(spec: TipSpec): HTMLElement[] {
  const rows = (spec.rows ?? []).filter((r): r is Exclude<TipRow, null | false | undefined> => !!r);
  /* separador nunca abre, fecha nem se repete */
  const clean = rows.filter((r, i) => r !== 'sep' || (i > 0 && i < rows.length - 1 && rows[i - 1] !== 'sep'));
  const foot = (spec.foot ?? []).filter((f): f is string => !!f);
  const parts: (HTMLElement | false)[] = [
    h('div', 'tip-head',
      spec.icon ?? null,
      h('div', 'tip-titles',
        h('div', { class: 'tip-title', style: spec.color ? `color:${spec.color}` : null }, spec.title),
        spec.sub && h('div', { class: 'tip-sub', style: spec.subColor ? `color:${spec.subColor}` : null }, spec.sub)),
      spec.tag && h('div', 'tip-tag', spec.tag)),
    clean.length > 0 && h('div', 'tip-body', clean.map((r) =>
      r === 'sep' ? h('div', 'tip-sep') : 'head' in r ? h('div', 'tip-h', r.head) : line(r))),
    foot.length > 0 && h('div', 'tip-foot', foot.map((f) => {
      const i = f.indexOf(':');
      return h('span', null, i > 0 ? [h('b', null, f.slice(0, i)), f.slice(i)] : f);
    })),
  ];
  return parts.filter((n): n is HTMLElement => !!n);
}

export interface Tips {
  /** Elemento do tooltip; fica por cima de tudo dentro do palco. */
  el: HTMLElement;
  /** Depois de remontar a tela: mostra de novo o tooltip do que estiver sob o cursor ou com foco. */
  refresh(): void;
  hide(): void;
  /** Enquanto verdadeiro, nenhum tooltip aparece (arrastando a teia, menu aberto). */
  mute(on: boolean): void;
  /** Enquanto verdadeiro, foco posto pelo programa (ao remontar a tela) não abre tooltip. */
  quiet(on: boolean): void;
}

/**
 * Liga os tooltips a um palco de tamanho lógico fixo (w × h). `scale()` devolve a ampliação atual
 * do palco, para converter a posição do mouse.
 */
export function mountTips(stage: HTMLElement, w: number, hgt: number, scale: () => number): Tips {
  const el = h('div', { class: 'tip', role: 'tooltip', hidden: true });
  let owner: Element | null = null;
  let mouse: { x: number; y: number } | null = null;
  let byFocus = false;
  let muted = false;
  let quiet = false;

  const hide = () => { owner = null; el.hidden = true; };

  const find = (t: EventTarget | null): Element | null => {
    const start = t instanceof Element ? t : null;
    const hit = start?.closest('[data-tip]') ?? null;
    return hit && stage.contains(hit) && specs.has(hit) ? hit : null;
  };

  const place = (x: number, y: number, anchor?: DOMRect) => {
    const tw = el.offsetWidth, th = el.offsetHeight, pad = 8;
    let left: number, top: number;
    if (anchor) {
      const k = scale(), sr = stage.getBoundingClientRect();
      const ax = (anchor.left - sr.left) / k, ay = (anchor.top - sr.top) / k, aw = anchor.width / k, ah = anchor.height / k;
      left = ax + aw + 10; top = ay;
      if (left + tw > w - pad) left = ax - tw - 10;
      if (left < pad) { left = Math.min(w - tw - pad, Math.max(pad, ax)); top = ay + ah + 10; if (top + th > hgt - pad) top = ay - th - 10; }
    } else {
      left = x + 18; top = y + 22;
      if (left + tw > w - pad) left = x - tw - 14;
      if (top + th > hgt - pad) top = y - th - 14;
    }
    left = Math.max(pad, Math.min(w - tw - pad, left));
    top = Math.max(pad, Math.min(hgt - th - pad, top));
    el.style.transform = `translate(${Math.round(left)}px,${Math.round(top)}px)`;
  };

  const toStage = (e: { clientX: number; clientY: number }) => {
    const r = stage.getBoundingClientRect(), k = scale();
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };

  const show = (target: Element, focus: boolean): boolean => {
    const src = specs.get(target);
    let spec: TipSpec | null = null;
    try { spec = typeof src === 'function' ? src() : src ?? null; } catch (err) { console.warn('Tooltip falhou:', err); }
    if (!spec || muted) { hide(); return false; }
    owner = target; byFocus = focus;
    el.replaceChildren(...build(spec));
    el.style.setProperty('--tipc', spec.color ?? '#c9a15a');
    el.hidden = false;
    if (focus) place(0, 0, target.getBoundingClientRect());
    else if (mouse) place(mouse.x, mouse.y);
    return true;
  };

  stage.addEventListener('mouseover', (e) => {
    mouse = toStage(e);
    const t = find(e.target);
    if (t === owner && !byFocus) return;
    if (t) show(t, false); else if (!byFocus) hide();
  });
  stage.addEventListener('mousemove', (e) => {
    mouse = toStage(e);
    if (owner && !byFocus && !el.hidden) place(mouse.x, mouse.y);
  });
  stage.addEventListener('mouseleave', () => { mouse = null; if (!byFocus) hide(); });
  stage.addEventListener('focusin', (e) => {
    if (quiet) return;
    const t = find(e.target);
    let visible = false;
    try { visible = e.target instanceof Element && e.target.matches(':focus-visible'); } catch { /* navegador antigo */ }
    if (t && visible) show(t, true);
  });
  stage.addEventListener('focusout', () => { if (byFocus) hide(); });

  return {
    el,
    hide,
    mute(on) { muted = on; if (on) hide(); },
    quiet(on) { quiet = on; },
    refresh() {
      const keepFocus = byFocus && owner !== null;
      if (muted) { hide(); return; }
      if (mouse) {
        const r = stage.getBoundingClientRect(), k = scale();
        const under = find(document.elementFromPoint(r.left + mouse.x * k, r.top + mouse.y * k));
        if (under) { show(under, false); return; }
      }
      const f = find(document.activeElement);
      let visible = false;
      try { visible = !!f && document.activeElement!.matches(':focus-visible'); } catch { /* navegador antigo */ }
      if (f && visible && keepFocus) show(f, true); else hide();
    },
  };
}
