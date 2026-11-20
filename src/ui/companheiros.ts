/**
 * Companheiros: dezesseis cartões numa grade, com retrato animado. Clique escolhe quem vai para a fase.
 * Um filtro de elemento no topo; quem ainda não foi resgatado aparece em silhueta, com o lugar do resgate.
 */
import { paintHeroBackdrop } from '../art/backdrops';
import { COMPANIONS, COMPANION_ORDER, ELEMENTS, ELEMENT_ORDER, type CompanionId, type ElementId } from '../data/content';
import { setCompanion } from '../meta/profile';
import { MAIN_H, MAIN_W, unseen, type Ctx } from './ctx';
import { backdrop, h, hdCanvas, keycap, num, stat, ui } from './dom';
import { drawFigure } from './retratos';
import { tip } from './tip';

/** Ícone do bônus passivo de cada companheiro. */
const PASSIVE_ICON: Record<CompanionId, string> = {
  capivara: 'vida', onca: 'critico', arara: 'ouro', botinho: 'cura', tatu: 'defesa', carcara: 'velAtaque', loboguara: 'movimento', tamandua: 'dano',
  vagalume: 'mana', preguica: 'pocao', sucuri: 'cipo', graxaim: 'ouro', coruja: 'magia', jacarezinho: 'elite', tuiuiu: 'recarga', mico: 'sorte',
};

const PW = 122, PH = 116;

function portrait(c: Ctx, id: CompanionId, owned: boolean): HTMLCanvasElement {
  const { cv } = hdCanvas(PW, PH, 'comp-cv');
  const draw = (g: CanvasRenderingContext2D, t: number) => {
    g.clearRect(0, 0, PW, PH);
    g.save(); g.fillStyle = 'rgba(8,14,8,.4)'; g.beginPath(); g.ellipse(PW / 2, PH - 12, 40, 7, 0, 0, Math.PI * 2); g.fill(); g.restore();
    drawFigure(g, id, { x: 4, y: 2, w: PW - 8, h: PH - 8 }, t, 0.92, ELEMENTS[COMPANIONS[id].element].color);
    if (!owned) {
      /* silhueta: pinta de escuro só onde há desenho */
      g.save(); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#0d1410'; g.fillRect(0, 0, PW, PH); g.restore();
    }
  };
  if (owned) c.animate(cv, draw);
  else { const g = cv.getContext('2d'); if (g) { try { draw(g, 0); } catch { /* sem retrato */ } } }
  return cv;
}

export function renderCompanheiros(c: Ctx): HTMLElement {
  const p = c.p, st = c.st, fresh = new Set(unseen('companheiros', COMPANION_ORDER.filter((id) => p.companions[id])));
  const owned = COMPANION_ORDER.filter((id) => p.companions[id]).length;
  const list = COMPANION_ORDER.filter((id) => !st.compFilter || COMPANIONS[id].element === st.compFilter);

  const cards = list.map((id) => {
    const def = COMPANIONS[id], own = !!p.companions[id], active = own && p.companion === id, el = ELEMENTS[def.element];
    const card = h(own ? 'button' : 'div', {
      type: own ? 'button' : null, class: `comp${own ? '' : ' missing'}${active ? ' active' : ''}`, tabindex: own ? null : 0, style: `--ec:${el.color}`,
      'aria-label': `${def.name}${own ? (active ? ', vai com você' : '') : `, ainda não resgatado: ${def.where}`}`, 'aria-pressed': own ? String(active) : null, 'data-fk': `comp-${id}`,
      onclick: own ? () => { if (setCompanion(c.p, active ? null : id)) c.commit(`comp-${id}`); } : null,
    },
    h('span', 'comp-pic', portrait(c, id, own), h('span', 'comp-el', ui(def.element, 22)),
      own && h('span', 'comp-skill', keycap('F'), stat('recarga', `${num(def.cooldown)}s`, { size: 18 }))),
    h('span', 'comp-name', own ? def.name : '???'),
    own
      ? h('span', 'comp-row', ui(PASSIVE_ICON[id], 24), h('span', null, def.passive))
      : h('span', 'comp-where', ui('gaiola', 22), h('span', null, def.where)),
    active && h('span', 'comp-flag', ui('check', 18)),
    own && fresh.has(id) && h('span', 'new-tag', 'Novo'));
    return tip(card, () => ({
      title: def.name, color: active ? '#f2c14e' : el.color, icon: ui(def.element, 36),
      sub: `${el.name} · ${own ? (active ? 'Vai com você' : 'Fica no acampamento') : 'Na gaiola'}`, subColor: own ? (active ? '#f2c14e' : undefined) : '#ff7b6b',
      rows: [
        !own && { icon: 'gaiola', text: `Resgate: ${def.where}`, tone: 'gold' as const },
        { head: 'Sempre' },
        { icon: PASSIVE_ICON[id], text: def.passive, tone: 'ok' as const },
        { head: `Tecla F · ${def.activeName}` },
        { icon: 'companheiro', text: def.active },
        { icon: 'recarga', text: 'Recarga', value: `${num(def.cooldown)} s` },
        'sep' as const,
        { icon: 'vida', text: 'Vida', value: num(def.hp) },
        { icon: 'dano', text: def.fly ? 'Dano por bicada, de longe' : 'Dano por golpe', value: num(def.damage) },
      ],
      foot: [own ? (active ? 'Clique: deixar no acampamento' : 'Clique: levar') : null],
    }));
  });

  const chip = (el: ElementId | null) => {
    const on = st.compFilter === el, n = COMPANION_ORDER.filter((id) => !el || COMPANIONS[id].element === el);
    const got = n.filter((id) => p.companions[id]).length;
    return tip(h('button', {
      type: 'button', class: `comp-chip${on ? ' on' : ''}`, style: el ? `--ec:${ELEMENTS[el].color}` : null, 'aria-pressed': String(on), 'data-fk': `filtro-${el ?? 'todos'}`,
      'aria-label': el ? `Só ${ELEMENTS[el].name}` : 'Todos', onclick: () => { st.compFilter = el; c.redraw(`filtro-${el ?? 'todos'}`); },
    }, el ? ui(el, 28) : ui('companheiros', 28), h('b', null, `${got}/${n.length}`)),
    { title: el ? ELEMENTS[el].name : 'Todos', color: el ? ELEMENTS[el].color : undefined, rows: [{ icon: 'companheiro', text: 'Resgatados', value: `${got} / ${n.length}` }] });
  };

  return h('div', 'companheiros',
    backdrop('companheiros', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H)),
    h('div', { class: 'comp-filter', role: 'group', 'aria-label': `Filtrar por elemento. ${owned} de ${COMPANION_ORDER.length} resgatados` }, chip(null), ELEMENT_ORDER.map((el) => chip(el))),
    h('div', { class: `comp-list${list.length <= 8 ? ' one-row' : ''}`, style: `--cols:${Math.min(8, Math.max(1, list.length))}` }, cards));
}
