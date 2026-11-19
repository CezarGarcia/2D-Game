/** Aba Companheiros: quem já está com você, quem falta resgatar, e quem vai para a luta. */
import { drawCapi } from '../art/characters';
import { drawOnca } from '../art/characters2';
import { COMPANIONS, COMPANION_ORDER, type CompanionId } from '../data/content';
import { setCompanion } from '../meta/profile';
import type { Ctx } from './ctx';
import { btn, h, num } from './dom';

function picture(c: Ctx, id: CompanionId, owned: boolean): HTMLElement {
  const W = 200, H = 120;
  const cv = h('canvas', { width: W * 2, height: H * 2, 'aria-hidden': 'true' });
  c.animate(cv, (g, t) => {
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,14,8,.45)';
    g.beginPath(); g.ellipse(W / 2, H - 22, 62, 9, 0, 0, Math.PI * 2); g.fill();
    if (id === 'capivara') { g.save(); g.translate(W / 2 - 10, H - 22); g.scale(2.4, 2.4); drawCapi(g, owned ? t : 0, {}); g.restore(); return; }
    if (id === 'onca') { g.save(); g.translate(W / 2 - 6, H - 22); g.scale(2.2, 2.2); drawOnca(g, owned ? t : 0, {}); g.restore(); return; }
    /* ainda sem desenho próprio: uma pegada */
    g.fillStyle = owned ? '#E0A848' : '#51604d';
    const cx = W / 2, cy = H / 2 + 4;
    g.beginPath(); g.ellipse(cx, cy + 12, 22, 17, 0, 0, Math.PI * 2); g.fill();
    for (const [dx, dy] of [[-26, -8], [-10, -22], [10, -22], [26, -8]]) { g.beginPath(); g.ellipse(cx + dx, cy + dy, 8, 10, dx * 0.012, 0, Math.PI * 2); g.fill(); }
  });
  return h('div', `comp-pic${owned ? '' : ' off'}`, cv);
}

export function renderCompanheiros(c: Ctx): HTMLElement {
  const p = c.p;
  const take = (id: CompanionId | null) => () => { if (setCompanion(c.p, id)) c.commit(); };
  return h('div', 'tab-companheiros',
    h('header', 'comp-head',
      h('div', null, h('h1', 'title', 'Companheiros'), h('p', 'muted', 'Um companheiro vai com você para a fase: dá um bônus passivo e tem uma habilidade própria.')),
      btn(p.companion ? 'Ir sem companheiro' : 'Indo sem companheiro', take(null), { pressed: p.companion === null, disabled: p.companion === null, fk: 'comp-nenhum' })),
    h('div', 'comp-list', COMPANION_ORDER.map((id) => {
      const def = COMPANIONS[id], own = p.companions[id], active = p.companion === id;
      return h('article', `panel comp${own ? '' : ' missing'}${active ? ' active' : ''}`,
        picture(c, id, !!own),
        h('div', 'comp-body',
          h('div', 'comp-title', h('h2', 'title', def.name), h('span', 'chip', def.element), own && h('span', 'chip', `Nível ${own.level}`), active && h('span', 'chip hot', 'Vai com você')),
          own
            ? [
              h('dl', 'comp-info',
                h('div', null, h('dt', null, 'Passivo'), h('dd', null, def.passive)),
                h('div', null, h('dt', null, `Habilidade · ${def.activeName}`), h('dd', null, def.active, h('span', 'muted num', ` Recarga de ${num(def.cooldown, 1)} s.`))),
                h('div', null, h('dt', null, 'Em combate'), h('dd', 'num', `${num(def.hp)} de vida · ${num(def.damage)} de dano por golpe`))),
              h('div', 'actions', active
                ? h('span', 'ok-text', 'Vai com você na próxima fase.')
                : btn('Levar', take(id), { kind: 'primary', fk: `levar-${id}` })),
            ]
            : [
              h('p', 'comp-where', h('span', 'k', 'Como conseguir'), def.where),
              h('dl', 'comp-info dim',
                h('div', null, h('dt', null, 'Passivo'), h('dd', null, def.passive)),
                h('div', null, h('dt', null, `Habilidade · ${def.activeName}`), h('dd', null, def.active))),
            ]));
    })),
  );
}
