/**
 * Telas de menu do jogo: acampamento (mapa, herói, ferreiro, talentos, feitiços, companheiros) e
 * resultado da fase. É HTML por cima do canvas, num palco de 1280×720 que amplia junto com o jogo.
 * Nenhuma regra mora aqui: as telas leem o perfil, chamam as funções de src/meta e pedem para salvar.
 */
import './ui.css';
import { COMPANION_ORDER } from '../data/content';
import { xpNeeded } from '../data/progression';
import { ATTR_PER_LEVEL, MATERIAL_LABEL, MATERIAL_USE, knownSpells, talentFree, type Materials } from '../meta/profile';
import { claimableCount, restInfo, touchDay } from '../meta/daily';
import { isForgeUnlocked, isTowerUnlocked, type StageRewards } from '../meta/rewards';
import { deriveStats, powerOf } from '../meta/stats';
import { renderCompanheiros } from './companheiros';
import { renderDiario } from './diario';
import { HUD_H, MAT_ICON, VIEW_H, VIEW_W, forgetSeen, markSeen, newState, unseen, type ConfirmSpec, type Ctx, type Tab } from './ctx';
import { compact, h, num, stat, ui } from './dom';
import { renderFeiticos } from './feiticos';
import { renderFerreiro } from './ferreiro';
import { renderHeroi, renderItemMenu } from './heroi';
import type { UiController, UiHost } from './host';
import { defaultStage, dismissStory, pendingStory, renderMapa } from './mapa';
import { renderResultado } from './resultado';
import { renderTalentos } from './talentos';
import { renderTorre } from './torre';
import { mountTips, tip } from './tip';

/* a Torre e o Diário ficam por último para as teclas 1 a 6 continuarem como eram */
const TABS: { id: Tab; label: string }[] = [
  { id: 'mapa', label: 'Mapa' }, { id: 'heroi', label: 'Herói' }, { id: 'ferreiro', label: 'Ferreiro' },
  { id: 'talentos', label: 'Talentos' }, { id: 'feiticos', label: 'Feitiços' }, { id: 'companheiros', label: 'Companheiros' },
  { id: 'torre', label: 'Torre' }, { id: 'diario', label: 'Diário' },
];
/* o que abre cada aba trancada */
const TAB_LOCK: Partial<Record<Tab, string>> = { ferreiro: 'Abre ao vencer a fase 1-2', torre: 'Abre ao libertar o Curupira (fase 1-12)' };
const TOAST_MS = 2200;

type Draw = (g: CanvasRenderingContext2D, t: number) => void;

export function mountUi(root: HTMLElement, host: UiHost): UiController {
  root.classList.add('enc-ui');
  root.hidden = true;

  let st = newState();
  let mode: 'camp' | 'results' = 'camp';
  let results: { stageId: string; rewards: StageRewards } | null = null;
  let scale = 1;
  let shownTab: string | null = null;

  /* ---------- palco de tamanho fixo, ampliado para caber na janela (igual ao canvas do jogo) ---------- */
  const view = h('div', 'enc-view');
  const stage = h('div', 'enc-stage', view);
  const tips = mountTips(stage, VIEW_W, VIEW_H, () => scale);
  stage.appendChild(tips.el);
  root.replaceChildren(stage);

  const layout = () => {
    const w = window.innerWidth || VIEW_W, hgt = window.innerHeight || VIEW_H;
    scale = Math.max(0.1, Math.min(w / VIEW_W, hgt / VIEW_H));
    stage.style.transform = `translate(${Math.round((w - VIEW_W * scale) / 2)}px,${Math.round((hgt - VIEW_H * scale) / 2)}px) scale(${scale})`;
  };
  layout();
  window.addEventListener('resize', layout);

  /* ---------- canvas animados (herói, bigorna, companheiros) ---------- */
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
    redraw: (focus) => render(focus),
    commit: (focus) => { host.save(); render(focus); },
    go: (tab) => showCamp(tab),
    animate: (cv, draw) => {
      anims.set(cv, draw);
      paint(cv, draw, performance.now() / 1000);
      if (!still && !raf) raf = requestAnimationFrame(tick);
    },
    toast: (text, tone = 'ok') => {
      st.toast = { text, tone, at: performance.now() };
      view.querySelector('.toast-layer')?.replaceChildren(...toastNodes());
    },
    confirm: (spec) => { st.confirm = spec; st.options = false; st.menu = null; render('confirm-no'); },
    point: (e) => {
      const r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale };
    },
    scale: () => scale,
    muteTips: (on) => tips.mute(on),
    still,
  };

  /* ---------- HUD ---------- */
  function hud(): HTMLElement {
    const p = host.getProfile(), need = xpNeeded(p.level);
    const mats = Object.keys(MATERIAL_LABEL) as (keyof Materials)[];
    return h('header', 'hud',
      tip(h('div', 'hud-level',
        h('span', 'lvl-medal', p.level),
        h('span', 'xp',
          h('span', 'xp-bar', h('i', { style: `width:${Math.min(100, (p.xp / need) * 100)}%` })),
          h('span', 'xp-text', `${num(p.xp)} / ${num(need)}`))),
      () => ({
        title: `Nível ${p.level}`, icon: ui('xp', 36),
        rows: [
          { icon: 'xp', text: 'Experiência', value: `${num(p.xp)} / ${num(need)}` },
          'sep',
          { head: 'A cada nível' },
          { icon: 'forca', text: 'Pontos de atributo', value: `+${ATTR_PER_LEVEL}`, tone: 'ok' },
          { icon: 'talentos', text: 'Ponto de talento', value: '+1', tone: 'ok' },
        ],
      })),
      restBadge(),
      tip(stat('poder', num(powerOf(deriveStats(p))), { size: 26, cls: 'hud-power' }), {
        title: 'Poder', icon: ui('poder', 36),
        rows: [{ text: 'Resume o dano e a resistência do herói. Compare com o poder pedido por cada fase no mapa.' }],
      }),
      h('div', 'hud-gap'),
      h('div', 'hud-res',
        tip(stat('ouro', compact(p.gold), { size: 26, cls: 'gold' }), { title: 'Ouro', color: '#f2c14e', icon: ui('ouro', 36), rows: [{ text: 'Paga o ferreiro e o nível dos feitiços. Vem das fases e de vender itens.' }, { icon: 'ouro', text: 'Você tem', value: num(p.gold) }] }),
        mats.map((k) => tip(stat(MAT_ICON[k], compact(p.materials[k]), { size: 26 }), {
          title: MATERIAL_LABEL[k], icon: ui(MAT_ICON[k], 36),
          rows: [{ text: MATERIAL_USE[k] }, { icon: MAT_ICON[k], text: 'Você tem', value: num(p.materials[k]) }],
        }))),
      tip(h('button', {
        type: 'button', class: `round-btn hud-gear${st.options ? ' on' : ''}`, 'aria-label': 'Opções', 'aria-expanded': String(st.options), 'data-fk': 'opcoes',
        onclick: () => { st.options = !st.options; st.menu = null; render(st.options ? 'recomecar' : 'opcoes'); },
      }, ui('opcoes', 28)), { title: 'Opções' }),
    );
  }

  /** Descanso guardado: experiência em dobro até acabar. */
  function restBadge(): HTMLElement | null {
    const r = restInfo(host.getProfile());
    if (r.pool <= 0) return null;
    return tip(h('button', { type: 'button', class: 'hud-rest', 'aria-label': `Descanso: ${num(r.pool)} de experiência em dobro`, onclick: () => showCamp('diario') }, ui('descanso', 30), h('b', null, 'x2')), {
      title: 'Descanso', tag: 'XP x2', color: '#cdb8ff', icon: ui('descanso', 36),
      rows: [
        { icon: 'xp', text: 'Experiência em dobro', value: num(r.pool), tone: 'ok' },
        r.days > 0 ? { icon: 'relogio', text: `Você ficou ${r.days} ${r.days === 1 ? 'dia' : 'dias'} fora` } : null,
        { text: 'A experiência das próximas fases vem dobrada até acabar.', tone: 'dim' },
      ],
      foot: ['Clique: ver o diário'],
    });
  }

  function optionsMenu(): HTMLElement {
    return h('div', { class: 'pop options', role: 'menu' },
      tip(h('button', {
        type: 'button', class: 'pop-btn danger', role: 'menuitem', 'data-fk': 'recomecar',
        onclick: () => ctx.confirm({
          title: 'Recomeçar o jogo?', text: 'Apaga todo o progresso.', icon: 'caveira', ok: 'Apagar tudo', danger: true,
          run: () => { host.resetGame(); forgetSeen(); st = newState(); showCamp('mapa'); },
        }),
      }, ui('fechar', 30), h('span', null, 'Recomeçar')), { title: 'Recomeçar o jogo', color: '#ff7b6b', rows: [{ text: 'Apaga nível, itens, talentos e estrelas. Pede confirmação.', tone: 'dim' }] }));
  }

  /* ---------- barra de ícones ---------- */
  function badges(): Partial<Record<Tab, { n: number | string; why: string }>> {
    const p = host.getProfile(), free = talentFree(p), out: Partial<Record<Tab, { n: number | string; why: string }>> = {};
    if (p.attrPoints > 0) out.heroi = { n: p.attrPoints, why: `${p.attrPoints} ${p.attrPoints === 1 ? 'ponto de atributo' : 'pontos de atributo'} para gastar` };
    if (free > 0) out.talentos = { n: free, why: `${free} ${free === 1 ? 'ponto de talento' : 'pontos de talento'} para gastar` };
    const spells = unseen('feiticos', knownSpells(p)).length + unseen('supremos', p.supremos).length;
    if (spells > 0) out.feiticos = { n: '!', why: spells === 1 ? 'Feitiço novo' : 'Feitiços novos' };
    if (unseen('companheiros', COMPANION_ORDER.filter((id) => p.companions[id])).length > 0) out.companheiros = { n: '!', why: 'Companheiro novo' };
    const daily = claimableCount(p);
    if (daily > 0) out.diario = { n: daily, why: daily === 1 ? 'Recompensa para pegar' : `${daily} recompensas para pegar` };
    return out;
  }

  function dock(): HTMLElement {
    const p = host.getProfile(), bd = badges();
    const shut: Partial<Record<Tab, boolean>> = { ferreiro: !isForgeUnlocked(p), torre: !isTowerUnlocked(p) };
    return h('nav', { class: 'dock', 'aria-label': 'Acampamento' }, TABS.map((t, i) => {
      const b = bd[t.id], locked = !!shut[t.id], on = st.tab === t.id;
      return tip(h('button', {
        type: 'button', class: `dock-btn${on ? ' on' : ''}${locked ? ' locked' : ''}`, 'aria-current': on ? 'page' : null,
        'aria-label': t.label + (b ? `, ${b.why}` : ''), 'data-fk': `tab-${t.id}`, onclick: () => showCamp(t.id),
      },
      h('span', 'dock-ico', ui(t.id, 42)),
      h('span', 'dock-label', t.label),
      b && !on && h('span', 'dock-badge', b.n),
      locked && h('span', 'dock-lock', ui('cadeado', 22))),
      () => ({
        title: t.label, tag: `Tecla ${i + 1}`,
        rows: [b ? { icon: 'novo', text: b.why, tone: 'gold' } : null, locked ? { icon: 'cadeado', text: TAB_LOCK[t.id] ?? 'Trancado', tone: 'bad' } : null],
      }));
    }));
  }

  function tabContent(): HTMLElement {
    switch (st.tab) {
      case 'heroi': return renderHeroi(ctx);
      case 'ferreiro': return renderFerreiro(ctx);
      case 'talentos': return renderTalentos(ctx);
      case 'feiticos': return renderFeiticos(ctx);
      case 'companheiros': return renderCompanheiros(ctx);
      case 'torre': return renderTorre(ctx);
      case 'diario': return renderDiario(ctx);
      default: return renderMapa(ctx);
    }
  }

  /* ---------- janelinha de confirmação e avisos ---------- */
  function confirmDialog(spec: ConfirmSpec): HTMLElement {
    const cancel = () => { st.confirm = null; render(); };
    const short = (spec.cost ?? []).some((cst) => cst.have < cst.amount);
    return h('div', { class: 'modal-back', onclick: (e: Event) => { if (e.target === e.currentTarget) cancel(); } },
      h('div', { class: `modal${spec.danger ? ' danger' : ''}`, role: 'alertdialog', 'aria-modal': 'true', 'aria-label': spec.title },
        spec.icon && h('div', 'modal-ico', ui(spec.icon, 64)),
        h('div', 'modal-title', spec.title),
        spec.text && h('div', 'modal-text', spec.text),
        spec.cost && h('div', 'modal-cost', spec.cost.length
          ? spec.cost.map((cst) => stat(cst.icon, num(cst.amount), { size: 30, tone: cst.have < cst.amount ? 'bad' : '' }))
          : h('span', 'free', 'Grátis')),
        h('div', 'modal-actions',
          h('button', { type: 'button', class: 'btn', 'data-fk': 'confirm-no', onclick: cancel }, 'Cancelar'),
          h('button', {
            type: 'button', class: `btn ${spec.danger ? 'danger' : 'primary'}`, disabled: short, 'data-fk': 'confirm-ok',
            onclick: () => { st.confirm = null; spec.run(); render(); },
          }, spec.ok))));
  }

  function toastNodes(): HTMLElement[] {
    const t = st.toast;
    if (!t) return [];
    const age = performance.now() - t.at;
    if (age > TOAST_MS) { st.toast = null; return []; }
    return [h('div', { class: `toast ${t.tone}`, role: 'status', style: `animation-delay:-${Math.round(age)}ms` }, t.text)];
  }

  function camp(): HTMLElement {
    const enter = shownTab !== st.tab;
    shownTab = st.tab;
    /* virou o dia com o jogo aberto: missões novas e descanso */
    if (touchDay(host.getProfile())) host.save();
    const blocked = !!st.confirm;
    return h('div', `camp tab-${st.tab}`,
      h('div', { class: 'camp-in', inert: blocked },
        hud(),
        dock(),
        h('main', { class: `main main-${st.tab}${enter ? ' enter' : ''}`, style: `top:${HUD_H}px` }, tabContent()),
        st.options && h('div', { class: 'pop-back', onclick: () => { st.options = false; render('opcoes'); } }),
        st.options && optionsMenu(),
        st.menu && st.tab === 'heroi' && renderItemMenu(ctx),
        h('div', { class: 'toast-layer', 'aria-live': 'polite' }, toastNodes())),
      st.confirm && confirmDialog(st.confirm));
  }

  /* ---------- remonta a tela, guardando o foco ---------- */
  function render(focus?: string): void {
    if (root.hidden) return;
    const active = document.activeElement;
    const had = active instanceof Element && view.contains(active);
    const fk = focus ?? (had ? active.closest('[data-fk]')?.getAttribute('data-fk') : null);
    anims.clear();

    if (mode === 'results' && results) { shownTab = null; view.replaceChildren(renderResultado(ctx, results.stageId, results.rewards)); }
    else view.replaceChildren(camp());
    st.forgeFx = null;

    tips.quiet(true);
    if (fk) view.querySelector<HTMLElement>(`[data-fk="${fk}"]`)?.focus({ preventScroll: true });
    tips.quiet(false);
    tips.refresh();
  }

  /** Ao sair de uma aba, o que era novidade nela passa a contar como visto. */
  function seeTab(tab: Tab): void {
    const p = host.getProfile();
    if (tab === 'feiticos') { markSeen('feiticos', knownSpells(p)); markSeen('supremos', p.supremos); }
    if (tab === 'companheiros') markSeen('companheiros', COMPANION_ORDER.filter((id) => p.companions[id]));
  }

  function showCamp(tab: Tab = 'mapa'): void {
    const opening = root.hidden || mode !== 'camp';
    if (!opening && st.tab !== tab) seeTab(st.tab);
    mode = 'camp'; results = null;
    if (st.tab !== tab || opening) { st.menu = null; st.options = false; st.confirm = null; st.forgeFx = null; st.spellSel = null; st.toast = null; }
    st.tab = tab;
    if (tab === 'mapa' && (opening || !st.mapSel)) {
      const def = defaultStage(host.getProfile());
      st.mapSel = def.id; st.chapter = def.chapter;
    }
    root.hidden = false;
    layout();
    render(opening ? undefined : `tab-${tab}`);
  }

  function showResults(stageId: string, rewards: StageRewards): void {
    if (!root.hidden && mode === 'camp') seeTab(st.tab);
    mode = 'results'; results = { stageId, rewards };
    st.confirm = null; st.options = false; st.menu = null;
    root.hidden = false;
    layout();
    render('res-principal');
  }

  function hide(): void {
    if (!root.hidden && mode === 'camp') seeTab(st.tab);
    root.hidden = true;
    anims.clear();
    tips.hide();
    view.replaceChildren();
    shownTab = null;
  }

  /* ---------- teclado ---------- */
  document.addEventListener('keydown', (e) => {
    if (root.hidden || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (st.confirm) { st.confirm = null; render(); e.preventDefault(); return; }
      if (st.options) { st.options = false; render('opcoes'); e.preventDefault(); return; }
      if (st.menu) { st.menu = null; render(); e.preventDefault(); return; }
      if (mode !== 'camp') return;
      if (st.tab === 'ferreiro' && st.forgeSel != null) { st.forgeSel = null; st.forgeFodder = []; st.forgeAffix = null; render(); e.preventDefault(); return; }
      if (st.tab === 'feiticos' && st.spellSel) { st.spellSel = null; render(); e.preventDefault(); return; }
      if (st.tab === 'mapa' && pendingStory(host.getProfile()) != null) { dismissStory(host.getProfile()); render(); e.preventDefault(); }
      return;
    }
    if (mode === 'camp' && !st.confirm && e.key.length === 1 && e.key >= '1' && e.key <= String(TABS.length)) {
      showCamp(TABS[Number(e.key) - 1].id);
      e.preventDefault();
    }
  });
  /* o menu do navegador não tem lugar dentro do jogo */
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    showCamp, showResults, hide,
    get visible() { return !root.hidden; },
  };
}
