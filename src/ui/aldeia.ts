/**
 * A Aldeia (docs/gdd/09): a cena das construções, com os Encantados libertados em volta da fogueira.
 * Clicar numa construção abre o painel dela à direita. O Viveiro também cuida das Andanças e mostra
 * o Temperamento e o Laço de cada companheiro.
 */
import { VILLAGE_SPOTS, paintVillage } from '../art/aldeia';
import { COMPANIONS, COMPANION_ORDER, ELEMENTS, ELEMENT_ORDER, PATRONS, type CompanionId } from '../data/content';
import { CHAPTERS } from '../data/stages';
import { BOND, TEMPERS, bondLevel, bondNext } from '../data/tempers';
import { BUILDINGS, BUILDING_ORDER, type BuildingId } from '../data/village';
import { WALK, cancelWalk, collectWalk, sendWalk, walkChapters, walkHoursLeft, walkProgress, walkSlots, walkYield, walkers } from '../meta/andancas';
import { clockNow } from '../meta/daily';
import { build, buildCost, rerollTemper } from '../meta/dream';
import { MAIN_H, MAIN_W, type Ctx } from './ctx';
import { backdrop, h, hdCanvas, num, ui, type Child } from './dom';
import { FREED, drawFigure } from './retratos';
import { tip, type TipRow } from './tip';

/** Onde cada Encantado libertado fica, em volta da fogueira. */
const SEATS = [{ x: 300, y: 470 }, { x: 520, y: 474 }, { x: 250, y: 420 }, { x: 572, y: 424 }, { x: 352, y: 404 }, { x: 468, y: 404 }, { x: 410, y: 500 }];

const hoursText = (n: number) => `${n} ${n === 1 ? 'hora' : 'horas'}`;
function left(ms: number): string {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min` : `${m} min`;
}

function buildingPanel(c: Ctx, id: BuildingId): Child[] {
  const p = c.p, b = BUILDINGS[id], lv = p.village[id] ?? 0, cost = buildCost(p, id), can = cost != null && p.dream.memories >= cost;
  return [
    h('div', 'vp-head', h('span', `vp-ico${lv ? ' has' : ''}`, ui(b.icon, 40)), h('div', null, h('b', null, b.name), h('span', null, b.about))),
    h('div', 'vp-levels', b.levels.map((l, i) => h('div', `vp-level${i < lv ? ' done' : i === lv ? ' next' : ''}`, h('i', null, i < lv ? ui('check', 16) : i + 1), h('span', null, l.desc), i >= lv && h('em', null, ui('lembranca', 16), num(l.cost))))),
    cost != null
      ? h('button', { type: 'button', class: `btn${can ? ' primary' : ''} vp-build`, disabled: !can, 'data-fk': `vila-${id}`, onclick: () => { if (build(c.p, id)) { c.toast(`${b.name}: nível ${lv + 1}`); c.commit(`vila-${id}`); } } }, lv ? 'Melhorar' : 'Construir', h('span', 'vp-cost', ui('lembranca', 22), num(cost)))
      : h('div', 'vp-max', ui('check', 22), 'No nível máximo'),
  ];
}

function viveiroPanel(c: Ctx): Child[] {
  const p = c.p, st = c.st.dream, slots = walkSlots(p), now = clockNow(), free = walkers(p), chapters = walkChapters(p), hoursLeft = walkHoursLeft(p, now);
  if (!slots) return [h('div', 'vp-note', 'Construa o Viveiro para abrir as Andanças: os companheiros que não estão com você saem e voltam com material.')];
  const w = st.walk;
  if (!w.id || !free.includes(w.id)) w.id = free[0] ?? null;
  if (!chapters.includes(w.chapter)) w.chapter = chapters[chapters.length - 1] ?? 1;
  const cycle = <T,>(list: T[], cur: T): T => list[(list.indexOf(cur) + 1) % list.length];
  let setup = false;
  const rows = Array.from({ length: slots }, (_, i) => {
    const out = p.andancas.slots[i];
    if (out) {
      const prog = walkProgress(out, now), done = prog >= 1, y = walkYield(p, out, now);
      const { cv } = hdCanvas(150, 12, 'walk-bar');
      let fired = false;
      c.animate(cv, (g) => {
        const k = walkProgress(out, clockNow());
        g.clearRect(0, 0, 150, 12); g.fillStyle = '#130d09'; g.beginPath(); g.roundRect(0, 0, 150, 12, 6); g.fill();
        g.fillStyle = k >= 1 ? '#86e07a' : '#f2c14e'; g.beginPath(); g.roundRect(1.5, 1.5, Math.max(6, 147 * k), 9, 4.5); g.fill();
        if (k >= 1 && !done && !fired) { fired = true; c.redraw(); }
      });
      const rewards: TipRow[] = [{ icon: 'ouro', text: 'Ouro', value: num(y.gold) }, { icon: 'resina', text: 'Resina', value: num(y.mata) }, y.po ? { icon: 'po', text: 'Pó de Assombro', value: num(y.po) } : null,
        { icon: 'gema', text: 'Às vezes, uma gema', tone: 'dim' }, y.paid < out.hours ? { text: `Só ${hoursText(y.paid)} rendem: o limite de hoje acabou.`, tone: 'warn' } : null];
      return tip(h('div', `walk busy${done ? ' ready' : ''}`,
        h('span', { class: 'walk-who', style: `--ec:${ELEMENTS[COMPANIONS[out.id].element].color}` }, ui(COMPANIONS[out.id].element, 22)),
        h('div', 'walk-mid', h('b', null, COMPANIONS[out.id].name), h('span', null, `${CHAPTERS[out.chapter - 1].name} · ${done ? 'voltou' : `faltam ${left(out.start + out.hours * 3_600_000 - now.getTime())}`}`), cv),
        done
          ? h('button', { type: 'button', class: 'btn small primary', 'data-fk': `walk-pegar-${i}`, onclick: () => { const r = collectWalk(c.p, i); if (r) { c.toast(`+${num(r.gold)} de ouro, +${num(r.mata)} de Resina${r.po ? `, +${r.po} de Pó` : ''}${r.gem ? ' e uma gema!' : ''}`); c.commit(); } } }, 'Receber')
          : h('button', { type: 'button', class: 'btn small', 'data-fk': `walk-chamar-${i}`, 'aria-label': 'Chamar de volta', onclick: () => c.confirm({ title: 'Chamar de volta?', text: `${COMPANIONS[out.id].name} volta agora, sem trazer nada.`, icon: 'companheiros', ok: 'Chamar', danger: true, run: () => { cancelWalk(c.p, i); c.host.save(); } }) }, ui('fechar', 18))),
      { title: `Andança: ${COMPANIONS[out.id].name}`, icon: ui('companheiros', 36), sub: `${hoursText(out.hours)} em ${CHAPTERS[out.chapter - 1].name}`, rows: rewards });
    }
    if (setup || !w.id) return h('div', 'walk empty', h('span', null, w.id ? 'Vaga livre' : 'Ninguém para sair agora'));
    setup = true;
    const id: CompanionId = w.id;
    return h('div', 'walk setup',
      tip(h('button', { type: 'button', class: 'chip', 'data-fk': 'walk-quem', onclick: () => { w.id = cycle(free, id); c.redraw('walk-quem'); } }, ui(COMPANIONS[id].element, 20), COMPANIONS[id].name.split(/[ -]/)[0]), { title: 'Quem vai', rows: [{ text: 'Só sai quem não está com você. Clique para trocar.' }] }),
      tip(h('button', { type: 'button', class: 'chip', 'data-fk': 'walk-onde', onclick: () => { w.chapter = cycle(chapters, w.chapter); c.redraw('walk-onde'); } }, ui(CHAPTERS[w.chapter - 1].element ?? 'mapa', 20), `Cap. ${w.chapter}`), { title: CHAPTERS[w.chapter - 1].name, rows: [{ text: 'O capítulo decide o elemento da gema que pode vir. Clique para trocar.' }] }),
      tip(h('button', { type: 'button', class: 'chip', 'data-fk': 'walk-horas', onclick: () => { w.hours = cycle([...WALK.hours], w.hours as 1 | 4 | 8); c.redraw('walk-horas'); } }, ui('relogio', 20), `${w.hours} h`), { title: 'Quanto tempo', rows: [{ text: 'Conta com o relógio, mesmo com o jogo fechado. Clique para trocar.' }] }),
      h('button', { type: 'button', class: 'btn small primary', 'data-fk': 'walk-enviar', onclick: () => { if (sendWalk(c.p, i, id, w.chapter, w.hours)) { c.toast(`${COMPANIONS[id].name} saiu por ${hoursText(w.hours)}`); c.commit('walk-quem'); } } }, 'Enviar'));
  });
  return [
    h('div', 'vp-sub', ui('relogio', 20), 'Andanças', tip(h('span', { class: `vp-hours${hoursLeft ? '' : ' out'}`, tabindex: 0 }, `${hoursLeft} h rendem hoje`), { title: 'Limite do dia', rows: [{ text: `Por dia, só as primeiras ${WALK.dailyHours} horas de Andança rendem, somando todas as vagas. É mais ou menos o que duas fases dão.` }] })),
    h('div', 'walks', rows),
  ];
}

function roster(c: Ctx): Child[] {
  const p = c.p, mine = COMPANION_ORDER.filter((id) => p.companions[id]);
  if (!mine.length) return [];
  const can = p.dream.memories >= BOND.reroll;
  return [
    h('div', 'vp-sub', ui('companheiros', 20), 'Companheiros'),
    h('div', 'mates', mine.map((id: CompanionId) => {
      const m = p.companions[id]!, t = m.temper ? TEMPERS[m.temper] : null, lv = bondLevel(m.bond), next = bondNext(m.bond);
      return tip(h('div', `mate${p.companion === id ? ' on' : ''}`,
        h('span', { class: 'walk-who', style: `--ec:${ELEMENTS[COMPANIONS[id].element].color}` }, ui(COMPANIONS[id].element, 20)),
        h('div', 'mate-mid', h('b', null, COMPANIONS[id].name), h('span', null, t ? ui(t.icon, 15) : null, t ? t.name : 'Sem temperamento', h('i', 'mate-bond', [1, 2, 3, 4, 5].map((n) => h('u', n <= lv ? 'on' : null))))),
        h('button', { type: 'button', class: 'mate-roll', disabled: !can, 'data-fk': `mate-${id}`, 'aria-label': 'Sortear outro temperamento', onclick: () => { const got = rerollTemper(c.p, id); if (got) { c.toast(`${COMPANIONS[id].name} agora é ${TEMPERS[got].name}`); c.commit(`mate-${id}`); } } }, ui('trocar', 16), BOND.reroll)),
      { title: COMPANIONS[id].name, color: ELEMENTS[COMPANIONS[id].element].color, sub: p.companion === id ? 'Está com você' : undefined, subColor: '#86e07a', rows: [
        t ? { icon: t.icon, text: `${t.name}: ${t.desc}` } : null,
        { icon: 'companheiro', text: `Laço ${lv} de 5`, value: lv > 1 ? `+${Math.round(BOND.perLevel * (lv - 1) * 100)}% de dano e vida` : undefined, tone: lv > 1 ? 'ok' : undefined },
        next != null ? { text: `Mais ${next} ${next === 1 ? 'fase' : 'fases'} com você para o próximo nível.`, tone: 'dim' } : { text: 'Laço no máximo.', tone: 'dim' },
        'sep', { icon: 'trocar', text: 'Sortear outro temperamento', value: `${BOND.reroll} Lembranças` },
      ] });
    })),
  ];
}

export function renderAldeia(c: Ctx): HTMLElement {
  const p = c.p, st = c.st.dream, sel: BuildingId = BUILDINGS[st.building] ? st.building : 'rancho';
  const total = BUILDING_ORDER.reduce((n, id) => n + BUILDINGS[id].levels.length, 0), have = BUILDING_ORDER.reduce((n, id) => n + (p.village[id] ?? 0), 0);
  const key = `aldeia-${BUILDING_ORDER.map((id) => p.village[id] ?? 0).join('')}`;
  const spots = BUILDING_ORDER.map((id) => {
    const b = BUILDINGS[id], lv = p.village[id] ?? 0, s = VILLAGE_SPOTS[id], cost = buildCost(p, id), can = cost != null && p.dream.memories >= cost;
    return tip(h('button', { type: 'button', class: `vspot${sel === id ? ' on' : ''}${lv ? ' has' : ''}${can ? ' can' : ''}`, style: `left:${s.x}px;top:${s.y}px`, 'aria-pressed': String(sel === id), 'data-fk': `spot-${id}`, onclick: () => { st.building = id; c.redraw(`spot-${id}`); } },
      h('span', 'vspot-plate', h('b', null, b.name), h('span', 'vila-pips', b.levels.map((_, i) => h('i', i < lv ? 'on' : null)))), can && h('i', 'vspot-up', ui('mais', 16))),
    { title: b.name, icon: ui(b.icon, 36), tag: `${lv}/${b.levels.length}`, sub: lv ? b.about : 'Ainda sem cor: não foi construída', rows: cost != null ? [{ icon: 'lembranca', text: b.levels[lv].desc, value: num(cost) }] : [{ text: 'No nível máximo.', tone: 'dim' }] });
  });
  /* os Encantados libertados, em volta da fogueira */
  const folk = p.supremos.map((el, i) => {
    const seat = SEATS[i % SEATS.length], figure = FREED[ELEMENT_ORDER.indexOf(el)], W = 96, H = 112, { cv } = hdCanvas(W, H, 'vfolk-cv');
    c.animate(cv, (g, t) => { g.clearRect(0, 0, W, H); drawFigure(g, figure, { x: 0, y: 0, w: W, h: H }, t + i, 0.96, ELEMENTS[el].color); });
    return tip(h('div', { class: 'vfolk', style: `left:${seat.x}px;top:${seat.y}px;z-index:${Math.round(seat.y)}`, tabindex: 0 }, cv), { title: PATRONS[el].name, color: ELEMENTS[el].color, sub: 'Libertado', rows: [{ text: PATRONS[el].style }] });
  });
  return h('div', 'aldeia',
    backdrop(key, MAIN_W, MAIN_H, (g) => paintVillage(g, MAIN_W, MAIN_H, p.village, have / total)),
    folk, spots,
    h('div', 'aldeia-top',
      h('button', { type: 'button', class: 'btn small', 'data-fk': 'aldeia-voltar', onclick: () => { st.village = false; c.redraw('aldeia-abrir'); } }, ui('seta', 20), 'Voltar ao Sonho'),
      h('span', 'aldeia-name', 'Aldeia'),
      tip(h('span', 'aldeia-count', ui('descanso', 22), `${have}/${total}`), { title: 'Melhorias da Aldeia', rows: [{ text: 'Cada construção devolve cor a um pedaço da aldeia e melhora alguma coisa do jogo.' }] }),
      h('span', 'ss-mem', ui('lembranca', 28), h('b', null, num(p.dream.memories)))),
    h('aside', { class: 'panel aldeia-panel', 'aria-label': BUILDINGS[sel].name }, buildingPanel(c, sel), sel === 'viveiro' ? [viveiroPanel(c), roster(c)] : null));
}
