/** Herói: o personagem no meio, o equipamento em volta, atributos e estatísticas dos lados, mochila embaixo. */
import { paintHeroBackdrop } from '../art/backdrops';
import { drawHero } from '../art/characters';
import { ITEM_TYPES, SLOT_LABEL, itemScore, sellValue, type Item, type ItemType, type Slot } from '../data/items';
import {
  ATTRS, ATTR_BASE, ATTR_PER_LEVEL, FREE_RESPEC_LEVEL, INVENTORY_SIZE, allocAttr, dismantleItem, dismantleYield, equip, findItem, inventoryFull, offhandWarning,
  resetAttrs, respecCost, sellItem, toggleLock, unequip, type AttrKey, type Profile,
} from '../meta/profile';
import { BASE_MOVE_SPEED, attrEffects, damageReduction, deriveStats, powerOf, totalAttrs } from '../meta/stats';
import { MAIN_H, MAIN_W, VIEW_H, VIEW_W, type Ctx, type InvSort } from './ctx';
import { backdrop, h, hdCanvas, num, pct, stat, ui } from './dom';
import { emptyTile, fullName, itemTile, itemTip, powerDelta, rarColor } from './itens';
import { drawCompanion } from './retratos';
import { tip, type TipRow } from './tip';

const LEFT: Slot[] = ['cabeca', 'peito', 'maos', 'pes'];
const RIGHT: Slot[] = ['arma', 'mao', 'anel1', 'anel2', 'amuleto'];
const GHOST: Record<Slot, ItemType> = { arma: 'facao', mao: 'escudo', cabeca: 'chapeu', peito: 'gibao', maos: 'luvas', pes: 'alpercatas', anel1: 'anel', anel2: 'anel', amuleto: 'amuleto' };
const ATTR_COLOR: Record<AttrKey, string> = { forca: '#E4572E', agilidade: '#8FE36A', inteligencia: '#3FA7E0', vitalidade: '#D9A441', espirito: '#5FBF8E', sorte: '#B98CFF' };
const SORTS: { id: InvSort; icon: string; label: string }[] = [
  { id: 'novo', icon: 'novo', label: 'Mais novos' }, { id: 'raridade', icon: 'coroa', label: 'Raridade' },
  { id: 'nivel', icon: 'xp', label: 'Nível' }, { id: 'tipo', icon: 'item', label: 'Tipo' },
];
const TYPE_ORDER = Object.keys(ITEM_TYPES);

function sorted(items: Item[], by: InvSort): Item[] {
  const list = items.slice();
  if (by === 'novo') return list.reverse();
  if (by === 'raridade') return list.sort((a, b) => b.rarity - a.rarity || itemScore(b) - itemScore(a));
  if (by === 'nivel') return list.sort((a, b) => b.ilvl - a.ilvl || b.rarity - a.rarity);
  return list.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || b.rarity - a.rarity || itemScore(b) - itemScore(a));
}

/* ---------- atributos ---------- */

function attrsPanel(c: Ctx): HTMLElement {
  const p = c.p, total = totalAttrs(p), fx = attrEffects(p), pts = p.attrPoints, cost = respecCost(p);
  const spent = ATTRS.reduce((n, a) => n + p.attrs[a.key], 0);
  const add = (key: AttrKey, e: MouseEvent) => {
    const n = e.shiftKey ? Math.min(5, c.p.attrPoints) : 1;
    if (allocAttr(c.p, key, n)) c.commit(`attr-${key}`);
  };
  return h('section', { class: 'panel attrs', 'aria-label': 'Atributos' },
    h('div', 'panel-top',
      tip(h('span', `points${pts > 0 ? ' hot' : ''}`, ui('mais', 24), h('b', null, pts)), {
        title: 'Pontos de atributo', tag: String(pts),
        rows: [{ text: `Você ganha ${ATTR_PER_LEVEL} a cada nível. Gaste nos atributos abaixo.`, tone: 'dim' }],
      }),
      tip(h('button', {
        type: 'button', class: 'round-btn', disabled: spent === 0, 'aria-label': 'Redistribuir atributos', 'data-fk': 'attr-reset',
        onclick: () => c.confirm({
          title: 'Redistribuir atributos?', text: 'Todos os pontos voltam para você.', icon: 'reforjar',
          cost: cost > 0 ? [{ icon: 'ouro', amount: cost, have: p.gold }] : [], ok: 'Redistribuir',
          run: () => { if (resetAttrs(c.p)) c.host.save(); else c.toast('Falta ouro', 'bad'); },
        }),
      }, ui('reforjar', 26)), {
        title: 'Redistribuir',
        rows: [
          { text: 'Devolve todos os pontos de atributo.' },
          cost > 0 ? { icon: 'ouro', text: 'Custo', value: num(cost), tone: p.gold < cost ? 'bad' : undefined } : { icon: 'ouro', text: `Grátis até o nível ${FREE_RESPEC_LEVEL}`, tone: 'ok' },
        ],
      })),
    h('div', 'attr-grid', ATTRS.map((a) => {
      const rows: TipRow[] = [
        { text: a.desc },
        { head: 'Rendendo agora' },
        ...fx[a.key].map((t): TipRow => ({ icon: a.key, text: t, tone: 'ok' })),
        { head: 'Cada ponto dá' },
        ...a.perPoint.split(', ').map((t): TipRow => ({ icon: 'mais', text: t })),
        'sep',
        { text: 'Seus pontos', value: num(p.attrs[a.key]), tone: 'dim' },
        { text: 'Base', value: num(ATTR_BASE), tone: 'dim' },
        total[a.key] - ATTR_BASE - p.attrs[a.key] !== 0 ? { text: 'Itens e talentos', value: `+${num(total[a.key] - ATTR_BASE - p.attrs[a.key])}`, tone: 'dim' } : null,
      ];
      const kids = [
        ui(a.key, 50),
        h('b', 'attr-val', total[a.key]),
        h('span', 'attr-label', a.label),
        pts > 0 && h('span', 'attr-plus', '+'),
      ];
      const spec = () => ({ title: a.label, color: ATTR_COLOR[a.key], tag: String(total[a.key]), icon: ui(a.key, 36), rows, foot: pts > 0 ? ['Clique: +1', 'Shift+clique: +5'] : [] });
      return tip(pts > 0
        ? h('button', { type: 'button', class: 'attr can', style: `--ac:${ATTR_COLOR[a.key]}`, 'aria-label': `${a.label} ${total[a.key]}, somar ponto`, 'data-fk': `attr-${a.key}`, onclick: (e: MouseEvent) => add(a.key, e) }, kids)
        : h('div', { class: 'attr', style: `--ac:${ATTR_COLOR[a.key]}`, tabindex: 0, 'data-fk': `attr-${a.key}` }, kids), spec);
    })));
}

/* ---------- estatísticas ---------- */

function statsPanel(p: Profile): HTMLElement {
  const st = deriveStats(p), dr = damageReduction(st.defense, p.level);
  const list: { icon: string; label: string; value: string; extra?: string; text: string }[] = [
    { icon: 'vida', label: 'Vida', value: num(st.maxHp), text: 'Quanto dano você aguenta antes de cair.' },
    { icon: 'mana', label: 'Mana', value: num(st.maxMana), text: `Gasta para lançar feitiços. Volta ${num(st.manaRegen, 1)} por segundo.` },
    { icon: 'dano', label: 'Dano', value: num(st.weaponDamage * st.damageMult, 1), text: 'Dano de cada golpe da arma, antes do crítico.' },
    { icon: 'velAtaque', label: 'Vel. ataque', value: pct(st.attackSpeed), text: 'Rapidez dos golpes. 100% é o normal.' },
    { icon: 'critico', label: 'Crítico', value: pct(st.critChance, 1), text: 'Chance de um golpe sair crítico.' },
    { icon: 'danoCritico', label: 'Dano crítico', value: pct(st.critMult), text: 'Quanto o golpe crítico causa, comparado ao normal.' },
    { icon: 'defesa', label: 'Defesa', value: num(st.defense, 1), extra: `−${pct(dr)}`, text: `Corta ${pct(dr)} do dano de monstros do seu nível.` },
    { icon: 'movimento', label: 'Movimento', value: pct(st.moveSpeed / BASE_MOVE_SPEED), text: 'Rapidez para andar. 100% é o normal.' },
    { icon: 'magia', label: 'Poder mágico', value: pct(st.spellPower), text: 'Multiplica o dano e a cura dos feitiços.' },
    { icon: 'recarga', label: 'Recarga', value: `−${pct(1 - st.cooldownMult)}`, text: 'Quanto mais rápido os feitiços voltam.' },
    { icon: 'ouro', label: 'Ouro', value: `+${pct(st.goldMult - 1)}`, text: 'Ouro a mais em toda fase.' },
    { icon: 'xp', label: 'Experiência', value: `+${pct(st.xpMult - 1)}`, text: 'Experiência a mais em toda fase.' },
  ];
  return h('section', { class: 'panel stats', 'aria-label': 'Estatísticas' },
    h('div', 'stat-grid', list.map((s) => tip(
      h('div', { class: 'stat-cell', tabindex: 0 }, ui(s.icon, 34), h('span', 'stat-nums', h('b', null, s.value), h('span', 'stat-label', s.label, s.extra && h('i', null, ` ${s.extra}`)))),
      { title: s.label, tag: s.extra ? `${s.value} (${s.extra})` : s.value, icon: ui(s.icon, 36), rows: [{ text: s.text }] }))));
}

/* ---------- boneco e equipamento ---------- */

function slotTile(c: Ctx, slot: Slot): HTMLElement {
  const p = c.p, it = p.equipped[slot], warn = slot === 'mao' ? offhandWarning(p) : null;
  if (!it) {
    return tip(h('div', { class: 'slot', tabindex: 0, 'aria-label': `${SLOT_LABEL[slot]}, vazio` }, emptyTile(GHOST[slot], 72)),
      { title: SLOT_LABEL[slot], sub: 'Vazio', rows: [{ text: 'Clique num item da mochila para equipar.', tone: 'dim' }] });
  }
  const take = () => {
    if (slot === 'arma') { c.toast('A arma só sai trocando por outra', 'bad'); return; }
    if (inventoryFull(c.p)) { c.toast('Mochila cheia', 'bad'); return; }
    if (unequip(c.p, slot)) c.commit();
  };
  return h('div', `slot${warn ? ' warn' : ''}`,
    itemTile(it, {
      size: 72, fk: `slot-${slot}`, onClick: take,
      onMenu: (e) => { const pt = c.point(e); c.st.menu = { id: it.id, x: pt.x, y: pt.y }; c.redraw('menu-0'); },
      tipSpec: () => itemTip(c.p, it, { where: 'equipado', slot, extra: warn ? [{ icon: 'cadeado', text: warn, tone: 'bad' }] : undefined }),
    }),
    warn && h('span', 'slot-warn', '!'));
}

function doll(c: Ctx): HTMLElement {
  const p = c.p, W = 330, H = 430;
  const { cv } = hdCanvas(W, H, 'hero-cv');
  const weapon = p.equipped.arma?.type === 'arco' ? 'arco' : 'facao', pet = p.companion && p.companions[p.companion] ? p.companion : null;
  c.animate(cv, (g, t) => {
    g.clearRect(0, 0, W, H);
    const fx = W / 2, fy = H - 22;
    g.fillStyle = 'rgba(8,14,8,.42)';
    g.beginPath(); g.ellipse(fx, fy + 4, 96, 15, 0, 0, Math.PI * 2); g.fill();
    if (pet) { g.save(); g.translate(fx - 108, fy + 14); g.scale(1.7, 1.7); drawCompanion(g, pet, t); g.restore(); }
    g.save(); g.translate(fx - 4, fy); g.scale(3.5, 3.5); drawHero(g, t, { weapon }); g.restore();
  });
  return h('section', { class: 'doll', 'aria-label': 'Equipamento' },
    h('div', 'doll-col', LEFT.map((s) => slotTile(c, s))),
    h('div', 'doll-mid',
      tip(h('div', 'plate', stat('poder', num(powerOf(deriveStats(p))), { size: 30 })), { title: 'Poder', icon: ui('poder', 36), rows: [{ text: 'Resume o dano e a resistência do herói.' }] }), cv),
    h('div', 'doll-col', RIGHT.map((s) => slotTile(c, s))));
}

/* ---------- mochila ---------- */

function bag(c: Ctx): HTMLElement {
  const p = c.p, items = sorted(p.inventory, c.st.invSort);
  const cells: HTMLElement[] = items.map((it) => itemTile(it, {
    size: 50, fk: `item-${it.id}`, better: powerDelta(p, it) > 0,
    onClick: () => { if (equip(c.p, it.id)) c.commit(); },
    onMenu: (e) => { const pt = c.point(e); c.st.menu = { id: it.id, x: pt.x, y: pt.y }; c.redraw('menu-0'); },
    tipSpec: () => itemTip(c.p, it, { where: 'mochila' }),
  }));
  for (let i = items.length; i < INVENTORY_SIZE; i++) cells.push(emptyTile(null, 50));
  return h('section', { class: 'panel bag', 'aria-label': 'Mochila' },
    h('div', 'bag-top',
      tip(h('span', `bag-count${p.inventory.length >= INVENTORY_SIZE ? ' full' : ''}`, ui('item', 24), h('b', null, `${p.inventory.length}/${INVENTORY_SIZE}`)), {
        title: 'Mochila', tag: `${p.inventory.length}/${INVENTORY_SIZE}`,
        rows: [{ text: 'Cheia, os itens novos são vendidos na hora.', tone: 'dim' }],
        foot: ['Clique: equipar', 'Botão direito: opções'],
      }),
      h('div', { class: 'sorts', role: 'group', 'aria-label': 'Ordenar' }, SORTS.map((s) => tip(h('button', {
        type: 'button', class: `mini-btn${c.st.invSort === s.id ? ' on' : ''}`, 'aria-pressed': String(c.st.invSort === s.id), 'aria-label': `Ordenar: ${s.label}`, 'data-fk': `sort-${s.id}`,
        onclick: () => { c.st.invSort = s.id; c.redraw(); },
      }, ui(s.icon, 22)), { title: `Ordenar: ${s.label}` })))),
    h('div', 'bag-grid', cells));
}

/* ---------- menu do item (clique direito) ---------- */

export function renderItemMenu(c: Ctx): HTMLElement | null {
  const m = c.st.menu, p = c.p, f = m ? findItem(p, m.id) : null;
  if (!m || !f) { c.st.menu = null; return null; }
  const it = f.item, close = () => { c.st.menu = null; };
  const precious = it.rarity >= 2 || it.plus > 0 || !!it.unique;
  const y = dismantleYield(it);
  type Act = { icon: string; label: string; run: () => void; off?: boolean; cls?: string; rows: TipRow[] };
  const acts: Act[] = [];
  if (f.slot) {
    acts.push({ icon: 'fechar', label: 'Tirar', off: f.slot === 'arma' || inventoryFull(p), rows: [{ text: f.slot === 'arma' ? 'A arma só sai trocando por outra.' : 'Volta para a mochila.', tone: 'dim' }], run: () => { close(); if (unequip(c.p, f.slot!)) c.commit(); else c.redraw(); } });
  } else {
    acts.push({ icon: 'check', label: 'Equipar', rows: [], run: () => { close(); if (equip(c.p, it.id)) c.commit(); else c.redraw(); } });
  }
  acts.push({ icon: 'cadeado', label: it.locked ? 'Destravar' : 'Travar', cls: it.locked ? 'on' : '', rows: [{ text: 'Item travado não é vendido, desmontado nem consumido na fusão.', tone: 'dim' }], run: () => { toggleLock(c.p, it.id); c.commit('menu-1'); } });
  if (!f.slot) {
    const armed = (k: 'vender' | 'desmontar') => m.armed === k;
    const guard = (k: 'vender' | 'desmontar', go: () => void) => () => {
      if (precious && !armed(k)) { m.armed = k; c.redraw(`menu-${k === 'vender' ? 2 : 3}`); return; }
      close(); go();
    };
    acts.push({
      icon: armed('vender') ? 'check' : 'vender', label: armed('vender') ? 'Confirmar' : 'Vender', off: !!it.locked, cls: armed('vender') ? 'armed' : '',
      rows: [{ icon: 'ouro', text: 'Ouro', value: `+${num(sellValue(it))}`, tone: 'ok' }],
      run: guard('vender', () => { const v = sellItem(c.p, it.id); if (v > 0) c.toast(`+${num(v)} de ouro`); c.commit(); }),
    }, {
      icon: armed('desmontar') ? 'check' : 'desmontar', label: armed('desmontar') ? 'Confirmar' : 'Desmontar', off: !!it.locked, cls: armed('desmontar') ? 'armed' : '',
      rows: [{ icon: 'resina', text: 'Resina', value: `+${num(y.mata)}`, tone: 'ok' }, y.po > 0 ? { icon: 'po', text: 'Pó de Assombro', value: `+${num(y.po)}`, tone: 'ok' } : null],
      run: guard('desmontar', () => { const got = dismantleItem(c.p, it.id); if (got) c.toast(`+${num(got.mata)} de resina${got.po ? `, +${num(got.po)} de pó` : ''}`); c.commit(); }),
    });
  }
  const w = acts.length * 92 + 16, left = Math.max(8, Math.min(VIEW_W - w - 8, m.x - 40)), top = m.y > 150 ? m.y - 118 : Math.min(VIEW_H - 110, m.y + 18);
  return h('div', 'menu-layer',
    h('div', { class: 'pop-back', onclick: () => { close(); c.redraw(); }, oncontextmenu: (e: Event) => { e.preventDefault(); close(); c.redraw(); } }),
    h('div', { class: 'pop item-menu', role: 'menu', 'aria-label': fullName(it), style: `left:${Math.round(left)}px;top:${Math.round(top)}px;--rar:${rarColor(it)}` },
      acts.map((a, i) => tip(h('button', {
        type: 'button', class: `pop-btn ${a.cls ?? ''}`.trim(), role: 'menuitem', disabled: a.off, 'data-fk': `menu-${i}`, onclick: a.run,
      }, ui(a.icon, 36), h('span', null, a.label)), { title: a.label, sub: fullName(it), subColor: rarColor(it), rows: a.rows }))));
}

export function renderHeroi(c: Ctx): HTMLElement {
  return h('div', 'heroi',
    backdrop('heroi', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H)),
    attrsPanel(c),
    doll(c),
    statsPanel(c.p),
    bag(c));
}
