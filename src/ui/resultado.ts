/** Resultado da fase: faixa de vitória ou derrota, estrelas, XP, ganhos e os itens saltando em fila. */
import { paintHeroBackdrop } from '../art/backdrops';
import { COMPANIONS, ELEMENTS, SPELLS, SUPREMOS } from '../data/content';
import { xpNeeded } from '../data/progression';
import { STAGES, type StageDef } from '../data/stages';
import { ATTR_PER_LEVEL, MATERIAL_LABEL, talentFree, type Materials } from '../meta/profile';
import { isUnlocked, recordOf, type StageRewards } from '../meta/rewards';
import { MAT_ICON, VIEW_H, VIEW_W, type Ctx } from './ctx';
import { backdrop, clock, h, num, pct, star, ui, type Child } from './dom';
import type { CampTab } from './host';
import { itemTile, itemTip } from './itens';
import { tip, type TipRow, type TipSpec } from './tip';

/** Número que sobe de zero até o valor, para dar gosto de ganho. */
function countUp(c: Ctx, to: number, delay: number, prefix = '+'): HTMLElement {
  const el = h('b', 'count', `${prefix}${num(c.still ? to : 0)}`);
  if (c.still || to <= 0) { el.textContent = `${prefix}${num(to)}`; return el; }
  const dur = 700;
  let start = 0;
  const step = (ms: number) => {
    if (!start) start = ms + delay;
    const k = Math.max(0, Math.min(1, (ms - start) / dur));
    el.textContent = `${prefix}${num(Math.round(to * (1 - Math.pow(1 - k, 3))))}`;
    if (k < 1 && (el.isConnected || ms - start < 100)) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
  return el;
}

export function renderResultado(c: Ctx, stageId: string, r: StageRewards): HTMLElement {
  const p = c.p;
  const stage: StageDef = STAGES.find((st) => st.id === stageId) ?? STAGES[0];
  const rec = recordOf(p, stage.id), next = STAGES[stage.index + 1] as StageDef | undefined;
  const nextOpen = r.won && !!next && isUnlocked(p, next);
  const need = xpNeeded(p.level), endFrac = Math.min(1, p.xp / need);
  const startFrac = r.levels > 0 ? 0 : Math.max(0, Math.min(endFrac, (p.xp - r.xp) / need));
  const goals: Child[] = ['Vencer', 'Sem cair', clock(stage.starTime)];

  /* ---------- estrelas ---------- */
  let stamped = 0;
  const stars = h('div', { class: 'res-stars', role: 'img', 'aria-label': `${r.stars.filter(Boolean).length} de 3 estrelas` }, r.stars.map((on, i) => {
    const delay = on && r.won ? 350 + 320 * stamped++ : 0;
    return tip(h('div', { class: `res-star${on ? ' on' : ''}${on && r.won ? ' stamp' : ''}`, style: `animation-delay:${delay}ms`, tabindex: 0 },
      star(on, i === 1 ? 92 : 74), h('span', null, i === 2 && ui('relogio', 18), goals[i])),
    { title: ['Vencer a fase', 'Vencer sem cair', `Vencer em até ${clock(stage.starTime)}`][i], color: on ? '#f2c14e' : undefined, sub: on ? 'Conquistada' : 'Ainda não', subColor: on ? '#f2c14e' : '#b9b2a3' });
  }));

  /* ---------- experiência ---------- */
  const fill = h('i', { style: `width:${(c.still ? endFrac : startFrac) * 100}%` });
  if (!c.still) requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${endFrac * 100}%`; }));
  const xp = h('div', 'res-xp',
    h('span', 'lvl-medal big', p.level),
    h('div', 'res-xp-mid',
      h('div', 'xp-bar big', fill),
      h('div', 'res-xp-text', h('span', null, `${num(p.xp)} / ${num(need)}`),
        r.xpMult < 1 && h('span', 'warn', `Fase fácil: ${pct(r.xpMult)} da experiência`))),
    r.levels > 0 && tip(h('div', 'level-up', h('b', null, `Nível ${p.level}!`), h('span', null, ui('forca', 20), `+${ATTR_PER_LEVEL * r.levels}`, ui('talentos', 20), `+${r.levels}`)),
      { title: `Nível ${p.level}!`, color: '#f2c14e', rows: [{ icon: 'forca', text: 'Pontos de atributo', value: `+${ATTR_PER_LEVEL * r.levels}`, tone: 'ok' }, { icon: 'talentos', text: 'Pontos de talento', value: `+${r.levels}`, tone: 'ok' }] }));

  /* ---------- ganhos em ícone + número ---------- */
  const gain = (icon: string, amount: number, i: number, spec: TipSpec): HTMLElement =>
    tip(h('div', { class: 'gain', style: `animation-delay:${500 + i * 90}ms`, tabindex: 0 }, ui(icon, 40), countUp(c, amount, 500 + i * 90)), spec);
  const mats = (Object.keys(r.materials) as (keyof Materials)[]).filter((k) => r.materials[k] > 0);
  const gains = h('div', 'res-gains',
    gain('xp', r.xp, 0, { title: 'Experiência', tag: `+${num(r.xp)}`, rows: [r.firstClear ? { icon: 'novo', text: 'Bônus de primeira vitória', tone: 'ok' } : null, r.xpMult < 1 ? { icon: 'xp', text: 'Fase abaixo do seu nível', value: pct(r.xpMult), tone: 'warn' } : null, !r.won ? { text: 'Parte da experiência das salas vencidas.', tone: 'dim' } : null] }),
    gain('ouro', r.gold, 1, { title: 'Ouro', color: '#f2c14e', tag: `+${num(r.gold)}`, rows: [r.goldMult < 1 ? { icon: 'ouro', text: 'Fase abaixo do seu nível', value: pct(r.goldMult), tone: 'warn' } : null, r.soldOverflow.length ? { icon: 'vender', text: 'Inclui itens vendidos (mochila cheia)', tone: 'dim' } : null] }),
    mats.map((k, i) => gain(MAT_ICON[k], r.materials[k], 2 + i, { title: MATERIAL_LABEL[k], tag: `+${num(r.materials[k])}`, rows: [{ icon: MAT_ICON[k], text: 'Você tem', value: num(p.materials[k]) }] })));

  /* ---------- itens ---------- */
  const tiles = [
    ...r.items.map((it, i) => h('div', { class: `loot${it.unique ? ' named' : ''}`, style: `animation-delay:${900 + i * 130}ms` },
      itemTile(it, { size: 68, onClick: () => undefined, tipSpec: () => itemTip(c.p, it, { where: 'mochila', foot: [] }) }),
      it.unique && h('span', 'loot-star', star(true, 26)))),
    ...r.soldOverflow.map((so, i) => h('div', { class: 'loot sold', style: `animation-delay:${900 + (r.items.length + i) * 130}ms` },
      itemTile(so.item, { size: 68, onClick: () => undefined, tipSpec: () => itemTip(c.p, so.item, { where: 'outro', noSell: true, extra: [{ icon: 'vender', text: 'Mochila cheia: vendido', value: `+${num(so.gold)}`, tone: 'warn' }] }) }),
      h('span', 'loot-sold', ui('ouro', 26)))),
  ];

  /* ---------- novidades ---------- */
  const news: HTMLElement[] = [];
  const note = (icon: Node, label: string, to: CampTab | null, spec: TipSpec, cls = '') => {
    const kids = [icon, h('span', null, label)];
    news.push(tip(to
      ? h('button', { type: 'button', class: `news ${cls}`.trim(), style: `animation-delay:${1300 + news.length * 120}ms`, onclick: () => c.go(to) }, kids)
      : h('div', { class: `news ${cls}`.trim(), style: `animation-delay:${1300 + news.length * 120}ms`, tabindex: 0 }, kids), spec));
  };
  if (r.named) note(star(true, 30), 'Item com nome!', 'heroi', itemTip(p, r.named, { where: 'mochila', foot: ['Clique: ver no herói'] }), 'gold');
  if (r.rescued) { const d = COMPANIONS[r.rescued]; note(ui('companheiro', 34), `${d.name} resgatada!`, 'companheiros', { title: d.name, color: '#f2c14e', sub: 'Novo companheiro', rows: [{ icon: 'companheiro', text: d.passive, tone: 'ok' }, { text: `${d.activeName}: ${d.active}` }], foot: ['Clique: ver companheiros'] }, 'gold'); }
  if (r.supremo) { const d = SUPREMOS[r.supremo]; note(ui('supremo', 34), `Supremo: ${d.name}`, 'feiticos', { title: d.name, color: ELEMENTS[r.supremo].color, sub: 'Supremo liberado · tecla T', rows: [{ text: d.desc }], foot: ['Clique: ver feitiços'] }, 'gold'); }
  for (const sp of r.spells) note(ui(sp, 34), 'Feitiço novo', 'feiticos', { title: SPELLS[sp].name, color: ELEMENTS[SPELLS[sp].element].color, sub: `${SPELLS[sp].role} · ${ELEMENTS[SPELLS[sp].element].name}`, rows: [{ text: SPELLS[sp].desc }], foot: ['Clique: ver feitiços'] });
  if (r.starChest) {
    const rows: TipRow[] = [{ icon: 'ouro', text: 'Ouro', value: `+${num(r.starChest.gold)}`, tone: 'ok' }, { icon: 'resina', text: 'Resina', value: `+${num(r.starChest.mata)}`, tone: 'ok' }, r.starChest.talent ? { icon: 'talentos', text: 'Ponto de talento', value: '+1', tone: 'ok' } : null];
    note(ui('bau', 34), 'Baú de estrelas', null, { title: `Baú de ${r.starChest.stars} estrelas`, color: '#f2c14e', rows }, 'gold');
  }
  if (r.talentPoints > 0) note(ui('talentos', 34), `+${r.talentPoints} talento`, 'talentos', { title: 'Ponto de talento', rows: [{ text: 'Prêmio por vencer o chefão pela primeira vez.' }], foot: ['Clique: ver talentos'] });
  if (r.bestTime && rec.bestTime != null) note(ui('relogio', 34), `Recorde ${clock(rec.bestTime)}`, null, { title: 'Novo melhor tempo', tag: clock(rec.bestTime), rows: [{ icon: 'relogio', text: 'Tempo da 3ª estrela', value: clock(stage.starTime) }] });
  if (p.attrPoints > 0) note(ui('heroi', 34), `${p.attrPoints} ${p.attrPoints === 1 ? 'ponto' : 'pontos'}`, 'heroi', { title: 'Pontos de atributo', tag: String(p.attrPoints), rows: [{ text: 'Você tem pontos de atributo para gastar.' }], foot: ['Clique: ver herói'] }, 'hot');
  const free = talentFree(p);
  if (free > 0 && r.talentPoints === 0) note(ui('talentos', 34), `${free} ${free === 1 ? 'talento' : 'talentos'}`, 'talentos', { title: 'Pontos de talento', tag: String(free), rows: [{ text: 'Você tem pontos de talento para gastar.' }], foot: ['Clique: ver talentos'] }, 'hot');

  const again = () => c.host.startStage(stage.id);
  return h('div', `results ${r.won ? 'won' : 'lost'}`,
    backdrop('resultado', VIEW_W, VIEW_H, (g) => paintHeroBackdrop(g, VIEW_W, VIEW_H)),
    h('div', 'res-shade'),
    h('div', 'res-banner', h('h1', null, r.won ? 'Vitória!' : 'Derrota'), h('span', null, `${stage.id} · ${stage.name}`)),
    stars,
    h('div', 'res-panel', xp, gains),
    tiles.length > 0 && h('div', 'res-loot', tiles),
    news.length > 0 && h('div', 'res-news', news.slice(0, 7)),
    h('div', 'res-actions',
      h('button', { type: 'button', class: 'btn big', 'data-fk': 'res-mapa', onclick: () => c.go('mapa') }, ui('mapa', 30), 'Mapa'),
      h('button', { type: 'button', class: `btn big${nextOpen ? '' : ' primary'}`, 'data-fk': nextOpen ? 'res-de-novo' : 'res-principal', onclick: again }, ui('reforjar', 30), r.won ? 'Jogar de novo' : 'Tentar de novo'),
      nextOpen && next && tip(h('button', { type: 'button', class: 'btn big primary', 'data-fk': 'res-principal', onclick: () => c.host.startStage(next.id) }, 'Próxima fase', ui('seta', 30)),
        { title: `${next.id} · ${next.name}`, tag: `Nv ${next.level}` })));
}
