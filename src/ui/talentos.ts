/**
 * Talentos: a teia inteira em tela cheia. Arrastar move, a roda do mouse aproxima.
 * Clique esquerdo põe ponto, clique direito tira. Toda explicação fica no tooltip do nó.
 */
import { paintTalentBackdrop } from '../art/backdrops';
import {
  SECTORS, SECTOR_ORDER, TALENTS, canAddTalent, canRemoveTalent, talentBlockReason, talentPos, talentReachable, talentSpent,
  type Sector, type TalentKind, type TalentNode,
} from '../data/talents';
import { FREE_RESPEC_LEVEL, addTalent, removeTalent, resetTalents, respecCost, talentFree, type Profile } from '../meta/profile';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { backdrop, br, h, num, s, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

/** Mundo da teia, em unidades dela. Na menor aproximação, o mundo ocupa exatamente a área da tela. */
const WORLD_H = 1076;
const FIT = MAIN_H / WORLD_H;
const WORLD_W = MAIN_W / FIT;
const CX = WORLD_W / 2, CY = WORLD_H / 2;
const MAX_ZOOM = 1.5;

const SIZE: Record<TalentKind, number> = { raiz: 64, comum: 58, chave: 60, ligacao: 52, joia: 70, dom: 88 };
const KIND_LABEL: Record<TalentKind, string> = { raiz: 'Raiz', comum: 'Talento', chave: 'Talento-chave', ligacao: 'Elo', joia: 'Joia', dom: 'Dom' };
const R_DOM = 540;

function nodeTip(p: Profile, n: TalentNode): TipSpec {
  const rank = p.talents[n.id] || 0, free = talentFree(p), sec = SECTORS[n.sector];
  const block = talentBlockReason(p.talents, n.id, free);
  const rows: TipRow[] = [];
  if (rank > 0) rows.push({ head: 'Agora' }, { icon: n.icon, text: br(n.desc(rank)), tone: 'ok' });
  if (rank < n.max) rows.push({ head: rank > 0 ? 'Próximo ponto' : n.max > 1 ? 'Com 1 ponto' : 'Efeito' }, { icon: n.icon, text: br(n.desc(rank + 1)) });
  if (n.max > 1 && rank + 1 < n.max) rows.push({ head: `Com ${n.max} pontos` }, { icon: n.icon, text: br(n.desc(n.max)), tone: 'dim' });
  if (block === 'Completo') rows.push('sep', { icon: 'check', text: 'Completo', tone: 'gold' });
  else if (block) rows.push('sep', { icon: 'cadeado', text: block, tone: 'bad' });
  const stuck = rank > 0 && !canRemoveTalent(p.talents, n.id);
  if (stuck) rows.push({ icon: 'cadeado', text: 'Outros talentos dependem deste', tone: 'dim' });
  return {
    title: n.name, color: sec.color, tag: `${rank}/${n.max}`,
    sub: `${KIND_LABEL[n.kind]} · ${sec.label}`, subColor: sec.color,
    icon: ui(n.icon, 40),
    rows,
    foot: [!block ? 'Clique: +1' : null, rank > 0 && !stuck ? 'Botão direito: −1' : null],
  };
}

export function renderTalentos(c: Ctx): HTMLElement {
  const p = c.p, ranks = p.talents, free = talentFree(p), spent = talentSpent(ranks), cost = respecCost(p);
  const web = c.st.web ?? { z: FIT, x: 0, y: 0 };

  const world = h('div', { class: 'web-world', style: `width:${WORLD_W}px;height:${WORLD_H}px` });
  const view = h('div', 'web-view', world);
  const clamp = () => {
    web.z = Math.max(FIT, Math.min(MAX_ZOOM, web.z));
    web.x = Math.min(0, Math.max(MAIN_W - WORLD_W * web.z, web.x));
    web.y = Math.min(0, Math.max(MAIN_H - WORLD_H * web.z, web.y));
  };
  const apply = () => {
    clamp();
    world.style.transform = `translate(${web.x}px,${web.y}px) scale(${web.z})`;
    c.st.web = web.z <= FIT + 0.001 ? null : web;
    view.classList.toggle('zoomed', web.z > FIT + 0.001);
  };
  const zoomAt = (px: number, py: number, factor: number) => {
    const wx = (px - web.x) / web.z, wy = (py - web.y) / web.z;
    web.z = Math.max(FIT, Math.min(MAX_ZOOM, web.z * factor));
    web.x = px - wx * web.z; web.y = py - wy * web.z;
    apply();
  };

  /* ---------- ligações ---------- */
  const lines: SVGElement[] = [];
  const posOf = new Map(TALENTS.map((n) => { const q = talentPos(n); return [n.id, { x: CX + q.x, y: CY + q.y }]; }));
  for (const n of TALENTS) {
    for (const l of n.links) {
      if (l <= n.id) continue;
      const a = posOf.get(n.id)!, b = posOf.get(l)!;
      const ra = ranks[n.id] || 0, rb = ranks[l] || 0;
      lines.push(s('line', {
        class: ra > 0 && rb > 0 ? 'on' : ra > 0 || rb > 0 ? 'half' : '',
        x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1),
        style: ra > 0 && rb > 0 ? `stroke:${SECTORS[n.sector].color}` : null,
      }));
    }
  }
  /* as raízes saem do centro */
  const roots = TALENTS.filter((n) => n.kind === 'raiz');
  for (const n of roots) {
    const a = posOf.get(n.id)!;
    lines.push(s('line', { class: (ranks[n.id] || 0) > 0 ? 'on' : 'half', x1: CX, y1: CY, x2: a.x.toFixed(1), y2: a.y.toFixed(1), style: (ranks[n.id] || 0) > 0 ? `stroke:${SECTORS[n.sector].color}` : null }));
  }

  /* ---------- nós ---------- */
  let dragged = false;
  const add = (n: TalentNode, many: boolean) => {
    if (dragged) return;
    let done = 0;
    while (addTalent(c.p, n.id)) { done++; if (!many) break; }
    if (done) c.commit(`tn-${n.id}`);
    else { const why = talentBlockReason(c.p.talents, n.id, talentFree(c.p)); if (why) c.toast(why, why === 'Completo' ? 'ok' : 'bad'); }
  };
  const remove = (n: TalentNode) => {
    if (!(c.p.talents[n.id] > 0)) return;
    if (removeTalent(c.p, n.id)) c.commit(`tn-${n.id}`);
    else c.toast('Outros talentos dependem deste', 'bad');
  };
  const nodes = TALENTS.map((n) => {
    const rank = ranks[n.id] || 0, q = posOf.get(n.id)!, size = SIZE[n.kind];
    const avail = canAddTalent(ranks, n.id, free), reach = talentReachable(ranks, n.id);
    const state = rank >= n.max ? 'has max' : rank > 0 ? 'has' : avail ? '' : reach ? 'wait' : 'far';
    return tip(h('button', {
      type: 'button', class: `tnode k-${n.kind} ${state}${avail ? ' avail' : ''}`.trim(),
      style: `left:${q.x.toFixed(1)}px;top:${q.y.toFixed(1)}px;--sz:${size}px;--sc:${SECTORS[n.sector].color}`,
      'aria-label': `${n.name}, ${rank} de ${n.max}`, 'data-fk': `tn-${n.id}`,
      onclick: (e: MouseEvent) => add(n, e.shiftKey),
      oncontextmenu: (e: MouseEvent) => { e.preventDefault(); remove(n); },
      onkeydown: (e: KeyboardEvent) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove(n); } },
    },
    h('span', 'tn-face', ui(n.icon, Math.round(size * 0.66))),
    n.max > 1 ? h('span', 'tn-rank', `${rank}/${n.max}`) : rank > 0 ? h('span', 'tn-rank one', '✓') : null),
    () => nodeTip(c.p, n));
  });

  /* ---------- nome de cada setor, na ponta do braço ---------- */
  const labels = SECTOR_ORDER.map((id: Sector) => {
    const sec = SECTORS[id], a = (sec.ang * Math.PI) / 180, right = Math.cos(a) > -0.01;
    const x = CX + Math.cos(a) * R_DOM + (right ? 62 : -62), y = CY + Math.sin(a) * R_DOM;
    const pts = TALENTS.filter((n) => n.sector === id).reduce((sum, n) => sum + (ranks[n.id] || 0), 0);
    return tip(h('div', { class: `sector${right ? '' : ' left'}`, style: `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--sc:${sec.color}`, tabindex: 0 },
      ui(id, 40), h('span', null, sec.label)),
    { title: sec.label, color: sec.color, tag: `${pts} pts`, icon: ui(id, 36), rows: [{ text: sec.desc }] });
  });

  world.append(
    backdrop('talentos', WORLD_W, WORLD_H, (g) => paintTalentBackdrop(g, WORLD_W, WORLD_H), 1),
    s('svg', { class: 'web-links', width: WORLD_W, height: WORLD_H, viewBox: `0 0 ${WORLD_W} ${WORLD_H}`, 'aria-hidden': 'true' }, lines),
    h('span', { class: 'web-heart', style: `left:${CX}px;top:${CY}px` }, ui('talentos', 44)),
    ...labels, ...nodes);
  apply();

  /* ---------- arrastar e aproximar ---------- */
  let drag: { sx: number; sy: number; ox: number; oy: number; moved: boolean } | null = null;
  view.addEventListener('pointerdown', (e) => { if (e.button === 0) { drag = { sx: e.clientX, sy: e.clientY, ox: web.x, oy: web.y, moved: false }; dragged = false; } });
  view.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const k = c.scale(), dx = (e.clientX - drag.sx) / k, dy = (e.clientY - drag.sy) / k;
    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true; dragged = true;
      try { view.setPointerCapture(e.pointerId); } catch { /* ponteiro já solto */ }
      view.classList.add('dragging');
      c.muteTips(true);
    }
    if (drag.moved) { web.x = drag.ox + dx; web.y = drag.oy + dy; apply(); }
  });
  const drop = () => {
    if (drag?.moved) { view.classList.remove('dragging'); c.muteTips(false); setTimeout(() => { dragged = false; }, 0); }
    drag = null;
  };
  view.addEventListener('pointerup', drop);
  view.addEventListener('pointercancel', drop);
  view.addEventListener('wheel', (e) => {
    e.preventDefault();
    const pt = c.point(e), r = view.getBoundingClientRect(), o = c.point({ clientX: r.left, clientY: r.top });
    zoomAt(pt.x - o.x, pt.y - o.y, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  const zoomBtn = (icon: string, label: string, factor: number) => tip(h('button', {
    type: 'button', class: 'round-btn', 'aria-label': label, onclick: () => zoomAt(MAIN_W / 2, MAIN_H / 2, factor),
  }, ui(icon, 26)), { title: label, rows: [{ text: 'A roda do mouse também aproxima. Arraste para mover.', tone: 'dim' }] });

  return h('div', 'talentos',
    view,
    tip(h('div', `web-points${free > 0 ? ' hot' : ''}`, ui('talentos', 40), h('span', null, h('small', null, 'Pontos'), h('b', null, free))), {
      title: 'Pontos de talento', tag: String(free), icon: ui('talentos', 36),
      rows: [
        { icon: 'check', text: 'Gastos', value: num(spent) },
        { icon: 'mais', text: 'Livres', value: num(free), tone: free > 0 ? 'gold' : 'dim' },
        'sep',
        { text: 'Um por nível. Chefões e baús de estrelas dão mais.', tone: 'dim' },
      ],
      foot: ['Clique: +1', 'Botão direito: −1'],
    }),
    h('div', 'web-tools',
      zoomBtn('mais', 'Aproximar', 1.3),
      zoomBtn('menos', 'Afastar', 1 / 1.3),
      tip(h('button', { type: 'button', class: 'round-btn', 'aria-label': 'Ver a teia inteira', 'data-fk': 'teia-centro', onclick: () => { web.z = FIT; web.x = 0; web.y = 0; apply(); } }, ui('alcance', 26)),
        { title: 'Teia inteira', rows: [{ text: 'Volta a enquadrar todos os talentos.', tone: 'dim' }] }),
      tip(h('button', {
        type: 'button', class: 'round-btn', disabled: spent === 0, 'aria-label': 'Redistribuir talentos', 'data-fk': 'teia-reset',
        onclick: () => c.confirm({
          title: 'Redistribuir talentos?', text: 'Todos os pontos voltam para você.', icon: 'reforjar',
          cost: cost > 0 ? [{ icon: 'ouro', amount: cost, have: p.gold }] : [], ok: 'Redistribuir',
          run: () => { if (resetTalents(c.p)) c.host.save(); else c.toast('Falta ouro', 'bad'); },
        }),
      }, ui('reforjar', 26)), {
        title: 'Redistribuir',
        rows: [
          { text: 'Devolve todos os pontos de talento.' },
          cost > 0 ? { icon: 'ouro', text: 'Custo', value: num(cost), tone: p.gold < cost ? 'bad' : undefined } : { icon: 'ouro', text: `Grátis até o nível ${FREE_RESPEC_LEVEL}`, tone: 'ok' },
        ],
      })));
}
