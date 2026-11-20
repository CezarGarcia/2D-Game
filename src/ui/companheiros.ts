/** Companheiros: um cartão com retrato animado para cada um. Clique escolhe quem vai para a fase. */
import { paintHeroBackdrop } from '../art/backdrops';
import { COMPANIONS, COMPANION_ORDER, type CompanionId } from '../data/content';
import { setCompanion } from '../meta/profile';
import { MAIN_H, MAIN_W, unseen, type Ctx } from './ctx';
import { backdrop, h, hdCanvas, keycap, num, stat, ui } from './dom';
import { drawCompanion } from './retratos';
import { tip } from './tip';

/** Ícone do bônus passivo e escala do retrato de cada companheiro. */
const LOOK: Record<CompanionId, { icon: string; scale: number; dx: number }> = {
  capivara: { icon: 'vida', scale: 3.3, dx: -8 },
  onca: { icon: 'critico', scale: 2.9, dx: -4 },
  arara: { icon: 'ouro', scale: 3.4, dx: 0 },
};

function portrait(c: Ctx, id: CompanionId, owned: boolean): HTMLCanvasElement {
  const W = 300, H = 230, look = LOOK[id];
  const { cv } = hdCanvas(W, H, 'comp-cv');
  const draw = (g: CanvasRenderingContext2D, t: number) => {
    g.clearRect(0, 0, W, H);
    g.save(); g.translate(W / 2 + look.dx, H - 44); g.scale(look.scale, look.scale); drawCompanion(g, id, t); g.restore();
    if (!owned) {
      /* silhueta: pinta de escuro só onde há desenho */
      g.save(); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#0d1410'; g.fillRect(0, 0, W, H); g.restore();
    }
    g.save(); g.globalCompositeOperation = 'destination-over';
    g.fillStyle = 'rgba(8,14,8,.4)'; g.beginPath(); g.ellipse(W / 2, H - 40, 84, 13, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  };
  if (owned) c.animate(cv, draw);
  else { const g = cv.getContext('2d'); if (g) { try { draw(g, 0); } catch { /* sem retrato */ } } }
  return cv;
}

export function renderCompanheiros(c: Ctx): HTMLElement {
  const p = c.p, fresh = new Set(unseen('companheiros', COMPANION_ORDER.filter((id) => p.companions[id])));
  const cards = COMPANION_ORDER.map((id) => {
    const def = COMPANIONS[id], own = !!p.companions[id], active = own && p.companion === id, look = LOOK[id];
    const el = h(own ? 'button' : 'div', {
      type: own ? 'button' : null, class: `comp${own ? '' : ' missing'}${active ? ' active' : ''}`, tabindex: own ? null : 0,
      'aria-label': `${def.name}${own ? (active ? ', vai com você' : '') : ', ainda não resgatado'}`, 'aria-pressed': own ? String(active) : null, 'data-fk': `comp-${id}`,
      onclick: own ? () => { if (setCompanion(c.p, active ? null : id)) c.commit(`comp-${id}`); } : null,
    },
    h('span', 'comp-pic', portrait(c, id, own), !own && h('span', 'comp-cage', ui('gaiola', 72))),
    h('span', 'comp-name', own ? def.name : '???'),
    own
      ? [
        h('span', 'comp-row', stat(look.icon, def.passive, { size: 30, tone: 'ok' })),
        h('span', 'comp-skill', keycap('F'), h('span', null, def.activeName), stat('recarga', `${num(def.cooldown)} s`, { size: 22 })),
      ]
      : h('span', 'comp-where', ui('cadeado', 26), def.where),
    active && h('span', 'comp-flag', ui('check', 22), 'Vai com você'),
    own && fresh.has(id) && h('span', 'new-tag', 'Novo'));
    return tip(el, () => ({
      title: def.name, color: active ? '#f2c14e' : undefined,
      sub: own ? (active ? 'Vai com você' : 'Fica no acampamento') : 'Na gaiola', subColor: own ? (active ? '#f2c14e' : undefined) : '#ff7b6b',
      rows: [
        !own && { icon: 'gaiola', text: `Resgate: ${def.where}`, tone: 'gold' as const },
        { head: 'Sempre' },
        { icon: look.icon, text: def.passive, tone: 'ok' as const },
        { head: `Tecla F · ${def.activeName}` },
        { icon: 'companheiro', text: def.active },
        { icon: 'recarga', text: 'Recarga', value: `${num(def.cooldown)} s` },
        'sep' as const,
        { icon: 'vida', text: 'Vida', value: num(def.hp) },
        { icon: 'dano', text: 'Dano por golpe', value: num(def.damage) },
      ],
      foot: [own ? (active ? 'Clique: deixar no acampamento' : 'Clique: levar') : null],
    }));
  });
  return h('div', 'companheiros',
    backdrop('companheiros', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H)),
    h('div', 'comp-list', cards));
}
