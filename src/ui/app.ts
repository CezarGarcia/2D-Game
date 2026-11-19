/**
 * Telas de menu do jogo: acampamento (mapa, herói, ferreiro, talentos, feitiços, companheiros) e
 * resultado da fase. É HTML por cima do canvas. Nenhuma regra mora aqui: as telas leem o perfil,
 * chamam as funções de src/meta e pedem para salvar.
 */
import './ui.css';
import { xpNeeded } from '../data/progression';
import { MATERIAL_LABEL, talentFree, type Materials } from '../meta/profile';
import { isForgeUnlocked, type StageRewards } from '../meta/rewards';
import { deriveStats, powerOf } from '../meta/stats';
import { renderCompanheiros } from './companheiros';
import { newState, type Ctx } from './ctx';
import { btn, h, icon, num } from './dom';
import { renderFeiticos } from './feiticos';
import { closeFerreiro, renderFerreiro } from './ferreiro';
import { closeHeroi, renderHeroi } from './heroi';
import type { CampTab, UiController, UiHost } from './host';
import { lockIcon } from './itens';
import { defaultStage, renderMapa } from './mapa';
import { renderResultado } from './resultado';
import { closeTalentos, renderTalentos } from './talentos';

const TABS: { id: CampTab; label: string }[] = [
  { id: 'mapa', label: 'Mapa' }, { id: 'heroi', label: 'Herói' }, { id: 'ferreiro', label: 'Ferreiro' },
  { id: 'talentos', label: 'Talentos' }, { id: 'feiticos', label: 'Feitiços' }, { id: 'companheiros', label: 'Companheiros' },
];
const MAT_ICON: Record<keyof Materials, string> = { mata: 'material', po: 'po', lagrima: 'lagrima' };

type Draw = (g: CanvasRenderingContext2D, t: number) => void;

export function mountUi(root: HTMLElement, host: UiHost): UiController {
  root.classList.add('enc-ui');
  root.hidden = true;

  let st = newState();
  let mode: 'camp' | 'results' = 'camp';
  let results: { stageId: string; rewards: StageRewards } | null = null;

  /* ---------- canvas animados (retrato do herói, companheiros) ---------- */
  const anims = new Map<HTMLCanvasElement, Draw>();
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  const paint = (cv: HTMLCanvasElement, draw: Draw, t: number) => {
    const g = cv.getContext('2d');
    if (!g) return;
    try { draw(g, t); } catch (err) { anims.delete(cv); console.warn('Desenho do menu falhou:', err); }
  };
  const tick = (ms: number) => {
    raf = 0;
    if (root.hidden) return;
    for (const [cv, draw] of anims) paint(cv, draw, ms / 1000);
    if (anims.size) raf = requestAnimationFrame(tick);
  };

  const ctx: Ctx = {
    host,
    get p() { return host.getProfile(); },
    get st() { return st; },
    set st(v) { st = v; },
    redraw: (focus?: string) => render(focus),
    commit: () => { host.save(); render(); },
    go: (tab) => showCamp(tab),
    animate: (cv, draw) => {
      anims.set(cv, draw);
      paint(cv, draw, performance.now() / 1000);
      if (!still && !raf) raf = requestAnimationFrame(tick);
    },
  };

  /* ---------- barra superior ---------- */
  function topbar(): HTMLElement {
    const p = host.getProfile(), need = xpNeeded(p.level), free = talentFree(p), forge = isForgeUnlocked(p);
    const badge: Partial<Record<CampTab, number>> = { heroi: p.attrPoints, talentos: free };
    const badgeLabel: Partial<Record<CampTab, string>> = { heroi: 'pontos de atributo para distribuir', talentos: 'pontos de talento livres' };
    return h('header', 'top',
      h('div', 'top-row',
        h('div', 'brand', 'Encantados'),
        h('div', 'level',
          h('span', 'level-n', 'Nível ', h('b', 'num', p.level)),
          h('div', { class: 'bar', role: 'img', 'aria-label': `${p.xp} de ${need} de XP para o próximo nível` }, h('i', { style: `width:${Math.min(100, (p.xp / need) * 100)}%` })),
          h('span', 'num small muted', `${num(p.xp)}/${num(need)} XP`)),
        h('ul', { class: 'res', 'aria-label': 'Recursos' },
          h('li', { title: 'Ouro' }, icon('misc', 'ouro', 24), h('span', 'res-text', h('span', 'k', 'Ouro'), h('b', 'num', num(p.gold)))),
          (Object.keys(MATERIAL_LABEL) as (keyof Materials)[]).map((k) =>
            h('li', { title: MATERIAL_LABEL[k] }, icon('misc', MAT_ICON[k], 24), h('span', 'res-text', h('span', 'k', MATERIAL_LABEL[k]), h('b', 'num', num(p.materials[k])))))),
        h('div', { class: 'power', title: 'Poder: resume dano e resistência do seu herói' }, h('span', 'k', 'Poder'), h('b', 'num', num(powerOf(deriveStats(p))))),
        btn('Apagar progresso', () => { st.confirmReset = true; render('cancelar-apagar'); }, { small: true, kind: 'quiet', fk: 'apagar' })),
      h('nav', { class: 'tabs', 'aria-label': 'Acampamento' }, TABS.map((t, i) => {
        const n = badge[t.id] ?? 0;
        return h('button', {
          type: 'button', class: `tab${st.tab === t.id ? ' on' : ''}${n > 0 ? ' has-badge' : ''}`, 'aria-current': st.tab === t.id ? 'page' : null,
          'data-fk': `tab-${t.id}`, onclick: () => showCamp(t.id),
        },
        h('kbd', { 'aria-hidden': 'true' }, i + 1), h('span', null, t.label),
        n > 0 && h('span', { class: 'badge num', title: badgeLabel[t.id] }, n, h('span', 'sr', ` ${badgeLabel[t.id]}`)),
        t.id === 'ferreiro' && !forge && h('span', { class: 'tab-lock', title: 'Abre ao vencer a fase 1-2' }, lockIcon(12), h('span', 'sr', ' (fechado)')));
      })),
    );
  }

  function tabContent(): HTMLElement {
    switch (st.tab) {
      case 'heroi': return renderHeroi(ctx);
      case 'ferreiro': return renderFerreiro(ctx, isForgeUnlocked(host.getProfile()));
      case 'talentos': return renderTalentos(ctx);
      case 'feiticos': return renderFeiticos(ctx);
      case 'companheiros': return renderCompanheiros(ctx);
      default: return renderMapa(ctx);
    }
  }

  function resetDialog(): HTMLElement {
    const cancel = () => { st.confirmReset = false; render('apagar'); };
    return h('div', { class: 'modal-back', onclick: (e: Event) => { if (e.target === e.currentTarget) cancel(); } },
      h('div', { class: 'modal panel', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'enc-reset-title', 'aria-describedby': 'enc-reset-text' },
        h('h2', { class: 'title', id: 'enc-reset-title' }, 'Apagar todo o progresso?'),
        h('p', { id: 'enc-reset-text' }, 'Nível, itens, talentos, estrelas e companheiros serão apagados, e o jogo recomeça da fase 1-1. Não dá para desfazer.'),
        h('div', 'actions',
          btn('Cancelar', cancel, { fk: 'cancelar-apagar' }),
          btn('Apagar tudo e recomeçar', () => {
            host.resetGame();
            st = newState();
            showCamp('mapa');
          }, { kind: 'danger', fk: 'confirmar-apagar' }))));
  }

  function camp(): HTMLElement {
    return h('div', 'camp',
      h('div', { class: 'camp-in', inert: st.confirmReset },
        topbar(),
        h('main', { class: `main main-${st.tab}`, tabindex: -1, 'data-fk': 'main' }, tabContent())),
      st.confirmReset && resetDialog());
  }

  /* ---------- redesenho, guardando foco e rolagem ---------- */
  function render(focus?: string): void {
    if (root.hidden) return;
    const active = document.activeElement;
    const had = active instanceof Element && root.contains(active);
    const fk = focus ?? (had ? active.closest('[data-fk]')?.getAttribute('data-fk') : null);
    const scroll = new Map<string, number>();
    root.querySelectorAll<HTMLElement>('[data-sk]').forEach((el) => scroll.set(el.dataset.sk ?? '', el.scrollTop));
    anims.clear();

    root.replaceChildren(mode === 'results' && results ? renderResultado(ctx, results.stageId, results.rewards) : camp());

    root.querySelectorAll<HTMLElement>('[data-sk]').forEach((el) => { const y = scroll.get(el.dataset.sk ?? ''); if (y) el.scrollTop = y; });
    if (fk || had) {
      const target = fk ? root.querySelector<HTMLElement>(`[data-fk="${fk}"]`) : null;
      target?.focus();
      if (!target || document.activeElement !== target) root.querySelector<HTMLElement>('[data-fk="main"], [data-fk="voltar"]')?.focus();
    }
  }

  function showCamp(tab: CampTab = 'mapa'): void {
    const opening = root.hidden || mode !== 'camp';
    mode = 'camp'; results = null;
    if (st.tab !== tab || opening) { st.armed = null; st.note = null; st.forgeResult = null; }
    st.tab = tab;
    if (tab === 'mapa' && (opening || !st.mapSel)) st.mapSel = defaultStage(host.getProfile());
    root.hidden = false;
    render();
    if (opening) root.querySelector<HTMLElement>('[data-fk="main"]')?.focus();
  }

  function showResults(stageId: string, rewards: StageRewards): void {
    mode = 'results'; results = { stageId, rewards };
    st.confirmReset = false;
    root.hidden = false;
    render();
    root.querySelector<HTMLElement>('.results-foot .btn.primary')?.focus();
  }

  function hide(): void {
    root.hidden = true;
    anims.clear();
    root.replaceChildren();
  }

  /* ---------- teclado ---------- */
  function closeDetail(): string | null {
    if (st.armed) { st.armed = null; return ''; }
    switch (st.tab) {
      case 'heroi': return closeHeroi(ctx);
      case 'ferreiro': return closeFerreiro(ctx);
      case 'talentos': return closeTalentos(ctx);
      default: return null;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (root.hidden || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target instanceof HTMLElement ? e.target : null;
    const field = !!t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    if (e.key === 'Escape') {
      if (st.confirmReset) { st.confirmReset = false; render('apagar'); e.preventDefault(); return; }
      if (mode !== 'camp') return;
      const back = closeDetail();
      if (back !== null) { render(back || undefined); e.preventDefault(); }
      return;
    }
    if (mode === 'camp' && !field && !st.confirmReset && e.key.length === 1 && e.key >= '1' && e.key <= '6') {
      showCamp(TABS[Number(e.key) - 1].id);
      e.preventDefault();
    }
  });

  return {
    showCamp, showResults, hide,
    get visible() { return !root.hidden; },
  };
}
