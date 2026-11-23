/**
 * Herói, em três colunas:
 * - o boneco com o equipamento em volta e os atributos embaixo;
 * - a mochila com itens grandes, filtros e o ganho de Poder escrito em cada item;
 * - o painel do item escolhido, que compara com o equipado lado a lado (ou as estatísticas).
 * Clique escolhe; clique de novo (ou o botão Equipar) equipa. Botão direito abre o menu rápido.
 */
import { paintHeroBackdrop } from '../art/backdrops';
import { drawHero } from '../art/characters';
import { ELEMENTS, ELEMENT_ORDER } from '../data/content';
import { ITEM_TYPES, RARITIES, SETS, SLOT_LABEL, UNIQUES, WEAPON_KINDS, affixText, baseLabel, canHoldGem, gemText, itemScore, sellValue, type Item, type ItemType, type Slot } from '../data/items';
import { equipBest, junkItems, junkValue, planUpgrades, sellJunk } from '../meta/mochila';
import {
  ATTRS, ATTR_BASE, ATTR_PER_LEVEL, FREE_RESPEC_LEVEL, INVENTORY_SIZE, allocAttr, dismantleItem, dismantleYield, equip, findItem, inventoryFull, offhandWarning,
  resetAttrs, respecCost, sellItem, toggleLock, unequip, type AttrKey, type Profile,
} from '../meta/profile';
import { BASE_MOVE_SPEED, activeItems, attrEffects, damageReduction, deriveStats, powerOf, setCounts, totalAttrs } from '../meta/stats';
import { MAIN_H, MAIN_W, VIEW_H, VIEW_W, type Ctx, type InvFilter, type InvSort } from './ctx';
import { backdrop, br, h, hdCanvas, num, pct, signed, ui } from './dom';
import { AFFIX_ICON, SET_STEPS, compareTable, emptyTile, fullName, gemTile, itemTile, itemTip, powerDelta, rarColor, targetSlot, typeLine } from './itens';
import { drawFigure } from './retratos';
import { tip, type TipRow } from './tip';

const LEFT: Slot[] = ['cabeca', 'peito', 'maos', 'pes'];
const RIGHT: Slot[] = ['arma', 'mao', 'anel1', 'anel2', 'amuleto'];
const GHOST: Record<Slot, ItemType> = { arma: 'facao', mao: 'escudo', cabeca: 'chapeu', peito: 'gibao', maos: 'luvas', pes: 'alpercatas', anel1: 'anel', anel2: 'anel', amuleto: 'amuleto' };
const ATTR_COLOR: Record<AttrKey, string> = { forca: '#E4572E', agilidade: '#8FE36A', inteligencia: '#3FA7E0', vitalidade: '#D9A441', espirito: '#5FBF8E', sorte: '#B98CFF' };
const SORTS: { id: InvSort; icon: string; label: string; short: string }[] = [
  { id: 'poder', icon: 'poder', label: 'Ganho de Poder', short: 'Poder' }, { id: 'novo', icon: 'novo', label: 'Mais novos', short: 'Novos' },
  { id: 'raridade', icon: 'coroa', label: 'Raridade', short: 'Raros' }, { id: 'nivel', icon: 'xp', label: 'Nível', short: 'Nível' }, { id: 'tipo', icon: 'item', label: 'Tipo', short: 'Tipo' },
];
const FILTERS: { id: InvFilter; label: string; icon?: string; item?: ItemType }[] = [
  { id: 'tudo', label: 'Tudo' }, { id: 'armas', label: 'Armas', item: 'facao' }, { id: 'armaduras', label: 'Roupas', item: 'gibao' },
  { id: 'joias', label: 'Joias', item: 'anel' }, { id: 'melhores', label: 'Melhores' },
];
const TYPE_ORDER = Object.keys(ITEM_TYPES);
const GROUPS: Record<'armas' | 'armaduras' | 'joias', string[]> = { armas: ['arma', 'mao'], armaduras: ['cabeca', 'peito', 'maos', 'pes'], joias: ['anel', 'amuleto'] };

/** Último clique num item, para o segundo clique equipar. */
let lastClick = { id: -1, t: 0 };

function sorted(items: Item[], by: InvSort, gain: Map<number, number>): Item[] {
  const list = items.slice();
  if (by === 'novo') return list.reverse();
  if (by === 'poder') return list.sort((a, b) => (gain.get(b.id) ?? 0) - (gain.get(a.id) ?? 0) || b.rarity - a.rarity || b.ilvl - a.ilvl);
  if (by === 'raridade') return list.sort((a, b) => b.rarity - a.rarity || itemScore(b) - itemScore(a));
  if (by === 'nivel') return list.sort((a, b) => b.ilvl - a.ilvl || b.rarity - a.rarity);
  return list.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || b.rarity - a.rarity || itemScore(b) - itemScore(a));
}

function passes(it: Item, f: InvFilter, gain: Map<number, number>): boolean {
  if (f === 'tudo') return true;
  if (f === 'melhores') return (gain.get(it.id) ?? 0) > 0;
  return GROUPS[f].includes(ITEM_TYPES[it.type].group);
}

/** Escolhe um item; o segundo clique rápido no mesmo item equipa (ou tira, se já estiver equipado). */
function pick(c: Ctx, it: Item, slot: Slot | null): void {
  const now = performance.now(), again = lastClick.id === it.id && now - lastClick.t < 500 && c.st.heroSel === it.id;
  lastClick = { id: it.id, t: now };
  if (again) { if (slot) takeOff(c, slot); else wear(c, it); return; }
  c.st.heroSel = it.id; c.st.heroPane = 'item'; c.st.menu = null;
  c.redraw(slot ? `slot-${slot}` : `item-${it.id}`);
}

function wear(c: Ctx, it: Item): void {
  const before = powerOf(deriveStats(c.p));
  if (!equip(c.p, it.id, targetSlot(c.p, it))) return;
  const d = powerOf(deriveStats(c.p)) - before;
  c.st.heroSel = it.id;
  if (d !== 0) c.toast(`${signed(d)} de Poder`, d > 0 ? 'ok' : 'bad');
  c.commit('equipar');
}

function takeOff(c: Ctx, slot: Slot): void {
  if (slot === 'arma') { c.toast('A arma só sai trocando por outra', 'bad'); return; }
  if (inventoryFull(c.p)) { c.toast('Mochila cheia', 'bad'); return; }
  if (unequip(c.p, slot)) c.commit();
}

function openMenu(c: Ctx, it: Item, e: MouseEvent): void {
  const pt = c.point(e);
  c.st.menu = { id: it.id, x: pt.x, y: pt.y };
  c.redraw('menu-0');
}

/* ---------- boneco e equipamento ---------- */

function slotTile(c: Ctx, slot: Slot, target: Slot | null): HTMLElement {
  const p = c.p, it = p.equipped[slot], warn = slot === 'mao' ? offhandWarning(p) : null, aim = target === slot ? ' target' : '';
  if (!it) {
    return tip(h('div', { class: `slot${aim}`, tabindex: 0, 'aria-label': `${SLOT_LABEL[slot]}, vazio` }, emptyTile(GHOST[slot], 64)),
      { title: SLOT_LABEL[slot], sub: 'Vazio', rows: [{ text: 'Escolha um item na mochila para equipar.', tone: 'dim' }] });
  }
  return h('div', `slot${warn ? ' warn' : ''}${aim}`,
    itemTile(it, {
      size: 64, fk: `slot-${slot}`, selected: c.st.heroSel === it.id,
      onClick: () => pick(c, it, slot),
      onMenu: (e) => openMenu(c, it, e),
      tipSpec: () => itemTip(c.p, it, { where: 'equipado', slot, extra: warn ? [{ icon: 'cadeado', text: warn, tone: 'bad' }] : undefined, foot: ['Clique: detalhes', 'Botão direito: opções'] }),
    }),
    warn && h('span', 'slot-warn', '!'));
}

function attrsBlock(c: Ctx): HTMLElement {
  const p = c.p, total = totalAttrs(p), fx = attrEffects(p), pts = p.attrPoints, cost = respecCost(p);
  const spent = ATTRS.reduce((n, a) => n + p.attrs[a.key], 0);
  const add = (key: AttrKey, e: MouseEvent) => {
    const n = e.shiftKey ? Math.min(5, c.p.attrPoints) : 1;
    if (allocAttr(c.p, key, n)) c.commit(`attr-${key}`);
  };
  return h('div', 'hero-attrs',
    h('div', 'ha-top',
      h('span', 'ha-title', 'Atributos'),
      tip(h('span', `points${pts > 0 ? ' hot' : ''}`, ui('mais', 20), h('b', null, pts)), {
        title: 'Pontos de atributo', tag: String(pts),
        rows: [{ text: `Você ganha ${ATTR_PER_LEVEL} a cada nível. Clique num atributo para gastar.`, tone: 'dim' }],
      }),
      tip(h('button', {
        type: 'button', class: 'mini-btn', disabled: spent === 0, 'aria-label': 'Redistribuir atributos', 'data-fk': 'attr-reset',
        onclick: () => c.confirm({
          title: 'Redistribuir atributos?', text: 'Todos os pontos voltam para você.', icon: 'reforjar',
          cost: cost > 0 ? [{ icon: 'ouro', amount: cost, have: p.gold }] : [], ok: 'Redistribuir',
          run: () => { if (resetAttrs(c.p)) c.host.save(); else c.toast('Falta ouro', 'bad'); },
        }),
      }, ui('reforjar', 22)), {
        title: 'Redistribuir',
        rows: [
          { text: 'Devolve todos os pontos de atributo.' },
          cost > 0 ? { icon: 'ouro', text: 'Custo', value: num(cost), tone: p.gold < cost ? 'bad' : undefined } : { icon: 'ouro', text: `Grátis até o nível ${FREE_RESPEC_LEVEL}`, tone: 'ok' },
        ],
      })),
    h('div', 'ha-grid', ATTRS.map((a) => {
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
      const kids = [ui(a.key, 30), h('span', 'ha-nums', h('b', null, total[a.key]), h('span', null, a.label)), pts > 0 && h('span', 'attr-plus', '+')];
      const spec = () => ({ title: a.label, color: ATTR_COLOR[a.key], tag: String(total[a.key]), icon: ui(a.key, 36), rows, foot: pts > 0 ? ['Clique: +1', 'Shift+clique: +5'] : [] });
      return tip(pts > 0
        ? h('button', { type: 'button', class: 'ha can', style: `--ac:${ATTR_COLOR[a.key]}`, 'aria-label': `${a.label} ${total[a.key]}, somar ponto`, 'data-fk': `attr-${a.key}`, onclick: (e: MouseEvent) => add(a.key, e) }, kids)
        : h('div', { class: 'ha', style: `--ac:${ATTR_COLOR[a.key]}`, tabindex: 0, 'data-fk': `attr-${a.key}` }, kids), spec);
    })));
}

function dollPanel(c: Ctx, target: Slot | null): HTMLElement {
  const p = c.p, W = 212, H = 300;
  const { cv } = hdCanvas(W, H, 'hero-cv');
  const wt = p.equipped.arma?.type, weapon = wt && (WEAPON_KINDS as string[]).includes(wt) ? wt : 'facao', pet = p.companion && p.companions[p.companion] ? p.companion : null;
  c.animate(cv, (g, t) => {
    g.clearRect(0, 0, W, H);
    const fx = W / 2 + 6, fy = H - 18;
    g.fillStyle = 'rgba(8,14,8,.42)';
    g.beginPath(); g.ellipse(fx, fy + 4, 70, 11, 0, 0, Math.PI * 2); g.fill();
    if (pet) drawFigure(g, pet, { x: -6, y: fy - 78, w: 86, h: 90 }, t, 0.9);
    g.save(); g.translate(fx, fy); g.scale(2.55, 2.55); drawHero(g, t, { weapon }); g.restore();
  });
  const power = powerOf(deriveStats(p));
  return h('section', { class: 'panel hero-doll', 'aria-label': 'Equipamento e atributos' },
    tip(h('div', 'hd-power', ui('poder', 30), h('b', null, num(power)), h('span', null, 'Poder')), { title: 'Poder', icon: ui('poder', 36), rows: [{ text: 'Resume o dano e a resistência do herói. Os números verdes na mochila dizem quanto cada item soma.' }] }),
    h('div', 'hd-body',
      h('div', 'doll-col', LEFT.map((s) => slotTile(c, s, target))),
      h('div', 'hd-mid', cv),
      h('div', 'doll-col', RIGHT.map((s) => slotTile(c, s, target)))),
    attrsBlock(c));
}

/* ---------- mochila ---------- */

function bagPanel(c: Ctx, gain: Map<number, number>): HTMLElement {
  const p = c.p, f = c.st.invFilter;
  const items = sorted(p.inventory.filter((it) => passes(it, f, gain)), c.st.invSort, gain);
  const ups = p.inventory.filter((it) => (gain.get(it.id) ?? 0) > 0).length;
  const plan = planUpgrades(p), junk = junkItems(p);
  const cells: HTMLElement[] = items.map((it) => itemTile(it, {
    size: 64, fk: `item-${it.id}`, gain: gain.get(it.id), selected: c.st.heroSel === it.id,
    onClick: () => pick(c, it, null),
    onMenu: (e) => openMenu(c, it, e),
    tipSpec: () => itemTip(c.p, it, { where: 'mochila', foot: ['Clique: detalhes', 'Clique duplo: equipar', 'Botão direito: opções'] }),
  }));
  if (f === 'tudo') for (let i = items.length; i < INVENTORY_SIZE; i++) cells.push(emptyTile(null, 64));
  return h('section', { class: 'panel bag2', 'aria-label': 'Mochila' },
    h('div', 'bag2-top',
      tip(h('span', `bag-count${p.inventory.length >= INVENTORY_SIZE ? ' full' : ''}`, ui('item', 26), h('b', null, `${p.inventory.length}/${INVENTORY_SIZE}`)), {
        title: 'Mochila', tag: `${p.inventory.length}/${INVENTORY_SIZE}`, rows: [{ text: 'Cheia, os itens novos são vendidos na hora.', tone: 'dim' }],
      }),
      h('div', 'bag2-acts',
        tip(h('button', {
          type: 'button', class: 'btn small primary', disabled: !plan.length, 'data-fk': 'equipar-melhores',
          onclick: () => { const d = equipBest(c.p); c.st.heroSel = null; c.st.heroPane = 'stats'; if (d) c.toast(`${signed(d)} de Poder`); c.commit('equipar-melhores'); },
        }, ui('poder', 20), 'Equipar melhores'), {
          title: 'Equipar melhores', rows: plan.length
            ? [{ text: `Faz ${plan.length} ${plan.length === 1 ? 'troca' : 'trocas'} que aumentam o Poder.` }, { text: 'Não troca o tipo de arma.', tone: 'dim' }]
            : [{ text: 'Nada na mochila aumenta o Poder agora.', tone: 'dim' }],
        }),
        tip(h('button', {
          type: 'button', class: 'btn small', disabled: !junk.length, 'data-fk': 'vender-sobras',
          onclick: () => c.confirm({
            title: `Vender ${junk.length} ${junk.length === 1 ? 'sobra' : 'sobras'}?`, text: 'Itens Comuns e Incomuns que não aumentam o Poder.', icon: 'vender', ok: `Vender por ${num(junkValue(junk))}`,
            run: () => { const r = sellJunk(c.p); if (r.count) { c.toast(`+${num(r.gold)} de ouro`); c.st.heroSel = null; c.host.save(); } },
          }),
        }, ui('vender', 20), 'Vender sobras'), {
          title: 'Vender sobras', rows: junk.length
            ? [{ text: `${junk.length} ${junk.length === 1 ? 'item Comum ou Incomum' : 'itens Comuns ou Incomuns'} que não aumentam o Poder.` }, { icon: 'ouro', text: 'Ouro', value: `+${num(junkValue(junk))}`, tone: 'ok' }, { text: 'Itens travados, de conjunto, com nome, com gema ou aprimorados ficam.', tone: 'dim' }]
            : [{ text: 'Nenhuma sobra na mochila.', tone: 'dim' }],
        }))),
    h('div', 'bag2-bar',
      h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar' }, FILTERS.map((x) => h('button', {
        type: 'button', class: `chip${f === x.id ? ' on' : ''}${x.id === 'melhores' && ups ? ' hot' : ''}`, 'aria-pressed': String(f === x.id), 'data-fk': `filtro-${x.id}`,
        onclick: () => { c.st.invFilter = x.id; c.redraw(`filtro-${x.id}`); },
      }, x.icon ? ui(x.icon, 18) : null, x.label, x.id === 'melhores' && h('b', null, ups)))),
      (() => {
        const i = SORTS.findIndex((x) => x.id === c.st.invSort), cur = SORTS[Math.max(0, i)], next = SORTS[(Math.max(0, i) + 1) % SORTS.length];
        return tip(h('button', {
          type: 'button', class: 'chip sort', 'aria-label': `Ordenar: ${cur.label}. Clique para ${next.label}`, 'data-fk': 'ordenar',
          onclick: () => { c.st.invSort = next.id; c.redraw('ordenar'); },
        }, ui(cur.icon, 18), cur.short), { title: `Ordenado por: ${cur.label}`, rows: [{ text: `Clique para ordenar por ${next.label.toLowerCase()}.`, tone: 'dim' }] });
      })()),
    cells.length
      ? h('div', 'bag2-grid', cells)
      : h('div', 'bag2-empty', ui(f === 'melhores' ? 'poder' : 'item', 48), f === 'melhores' ? 'Nada na mochila aumenta o Poder agora.' : 'Nenhum item deste tipo.'));
}

/* ---------- painel da direita ---------- */

function statsPane(p: Profile): HTMLElement {
  const st = deriveStats(p), dr = damageReduction(st.defense, p.level);
  const list: { icon: string; label: string; value: string; extra?: string; text: string; more?: TipRow[] }[] = [
    { icon: 'vida', label: 'Vida', value: num(st.maxHp), text: 'Quanto dano você aguenta antes de cair.' },
    { icon: 'mana', label: 'Mana', value: num(st.maxMana), text: `Gasta para lançar feitiços. Volta ${num(st.manaRegen, 1)} por segundo.` },
    { icon: 'dano', label: 'Dano', value: num(st.weaponDamage * st.damageMult, 1), text: 'Dano de cada golpe da arma, antes do crítico.' },
    { icon: 'velAtaque', label: 'Vel. ataque', value: pct(st.attackSpeed), text: 'Rapidez dos golpes. 100% é o normal.' },
    { icon: 'critico', label: 'Crítico', value: pct(st.critChance, 1), text: 'Chance de um golpe sair crítico.' },
    { icon: 'danoCritico', label: 'Dano crítico', value: pct(st.critMult), text: 'Quanto o golpe crítico causa, comparado ao normal.' },
    {
      icon: 'defesa', label: 'Defesa', value: num(st.defense, 1), extra: `−${pct(dr)}`, text: `Corta ${pct(dr)} do dano de monstros do seu nível.`,
      more: [{ head: 'Resistência a elementos' }, ...ELEMENT_ORDER.map((el): TipRow => ({ icon: el, text: ELEMENTS[el].name, value: pct(st.res[el]), color: st.res[el] > 0 ? ELEMENTS[el].color : undefined, tone: st.res[el] > 0 ? undefined : 'dim' }))],
    },
    { icon: 'movimento', label: 'Movimento', value: pct(st.moveSpeed / BASE_MOVE_SPEED), text: 'Rapidez para andar. 100% é o normal.' },
    { icon: 'magia', label: 'Poder mágico', value: pct(st.spellPower), text: 'Multiplica o dano e a cura dos feitiços.' },
    { icon: 'recarga', label: 'Recarga', value: `−${pct(1 - st.cooldownMult)}`, text: 'Quanto mais rápido os feitiços voltam.' },
    { icon: 'ouro', label: 'Ouro', value: `+${pct(st.goldMult - 1)}`, text: 'Ouro a mais em toda fase.' },
    { icon: 'xp', label: 'Experiência', value: `+${pct(st.xpMult - 1)}`, text: 'Experiência a mais em toda fase.' },
  ];
  return h('div', 'side-stats', list.map((s) => tip(
    h('div', { class: 'stat-cell', tabindex: 0 }, ui(s.icon, 30), h('span', 'stat-nums', h('b', null, s.value), h('span', 'stat-label', s.label, s.extra && h('i', null, ` ${s.extra}`)))),
    { title: s.label, tag: s.extra ? `${s.value} (${s.extra})` : s.value, icon: ui(s.icon, 36), rows: [{ text: s.text }, ...(s.more ?? [])] })));
}

/** Efeitos que não cabem na tabela: item com nome, gema, conjunto e o aviso de que só serve com outra arma. */
function extras(p: Profile, it: Item): HTMLElement[] {
  const out: HTMLElement[] = [], u = it.unique ? UNIQUES[it.unique] : null, def = ITEM_TYPES[it.type];
  if (u) out.push(h('div', 'dt-line gold', ui('estrela', 20), h('span', null, u.effect)));
  if (it.gem) out.push(h('div', { class: 'dt-line', style: `color:${ELEMENTS[it.gem.el].color}` }, gemTile(it.gem, 22), h('span', null, gemText(it))));
  else if (canHoldGem(it)) out.push(h('div', 'dt-line dim', h('span', 'gem-empty'), h('span', null, 'Encaixe de gema vazio')));
  const set = it.set ? SETS[it.set] : null;
  if (set) {
    const have = setCounts(activeItems(p))[set.key] ?? 0;
    out.push(h('div', 'dt-line set', ui('conjunto', 20), h('span', null, set.name), h('b', null, `${have}/${set.pieces.length}`)));
    SET_STEPS.forEach((n, i) => out.push(h('div', `dt-line small ${have >= n ? 'ok' : 'dim'}`, ui(have >= n ? 'check' : 'cadeado', 16), h('span', null, `${n} peças: ${set.bonus[i]}`))));
  }
  if (def.note && def.group === 'arma') out.push(h('div', 'dt-line dim small', h('span', null, def.note)));
  return out;
}

function actionRow(c: Ctx, it: Item, inBag: boolean): HTMLElement {
  const precious = it.rarity >= 2 || it.plus > 0 || !!it.unique || !!it.set;
  const y = dismantleYield(it);
  const sell = () => {
    const go = () => { const v = sellItem(c.p, it.id); if (v > 0) { c.toast(`+${num(v)} de ouro`); c.st.heroSel = null; c.host.save(); } };
    if (precious) c.confirm({ title: `Vender ${fullName(it)}?`, text: `${RARITIES[it.rarity].label}. Não dá para desfazer.`, icon: 'vender', ok: `Vender por ${num(sellValue(it))}`, danger: true, run: go });
    else { go(); c.commit('detalhe-vender'); }
  };
  const scrap = () => {
    const go = () => { const got = dismantleItem(c.p, it.id); if (got) { c.toast(`+${num(got.mata)} de resina${got.po ? `, +${num(got.po)} de pó` : ''}`); c.st.heroSel = null; c.host.save(); } };
    if (precious) c.confirm({ title: `Desmontar ${fullName(it)}?`, text: `Vira ${num(y.mata)} de resina${y.po ? ` e ${num(y.po)} de pó` : ''}.`, icon: 'desmontar', ok: 'Desmontar', danger: true, run: go });
    else { go(); c.commit('detalhe-desmontar'); }
  };
  const lock = h('button', {
    type: 'button', class: `mini-btn big${it.locked ? ' on' : ''}`, 'aria-label': it.locked ? 'Destravar' : 'Travar', 'aria-pressed': String(!!it.locked), 'data-fk': 'detalhe-travar',
    onclick: () => { toggleLock(c.p, it.id); c.commit('detalhe-travar'); },
  }, ui('cadeado', 24));
  tip(lock, { title: it.locked ? 'Destravar' : 'Travar', rows: [{ text: 'Item travado não é vendido, desmontado nem consumido na fusão.', tone: 'dim' }] });
  if (!inBag) {
    const f = findItem(c.p, it.id), slot = f?.slot ?? null;
    return h('div', 'dt-acts',
      h('button', { type: 'button', class: 'btn', disabled: !slot || slot === 'arma' || inventoryFull(c.p), 'data-fk': 'detalhe-tirar', onclick: () => slot && takeOff(c, slot) },
        ui('fechar', 20), slot === 'arma' ? 'A arma só sai trocando' : 'Tirar'),
      lock);
  }
  const sellBtn = tip(h('button', { type: 'button', class: 'mini-btn big', disabled: !!it.locked, 'aria-label': 'Vender', 'data-fk': 'detalhe-vender', onclick: sell }, ui('vender', 24)),
    { title: 'Vender', rows: [{ icon: 'ouro', text: 'Ouro', value: `+${num(sellValue(it))}`, tone: 'ok' }] });
  const scrapBtn = tip(h('button', { type: 'button', class: 'mini-btn big', disabled: !!it.locked, 'aria-label': 'Desmontar', 'data-fk': 'detalhe-desmontar', onclick: scrap }, ui('desmontar', 24)),
    { title: 'Desmontar', rows: [{ icon: 'resina', text: 'Resina', value: `+${num(y.mata)}`, tone: 'ok' }, y.po > 0 ? { icon: 'po', text: 'Pó de Assombro', value: `+${num(y.po)}`, tone: 'ok' } : null] });
  return h('div', 'dt-acts',
    h('button', { type: 'button', class: 'btn primary', 'data-fk': 'equipar', onclick: () => wear(c, it) }, ui('check', 22), 'Equipar'),
    lock, sellBtn, scrapBtn);
}

function itemPane(c: Ctx): HTMLElement {
  const p = c.p, f = c.st.heroSel != null ? findItem(p, c.st.heroSel) : null;
  if (!f) {
    return h('div', 'dt-none', ui('item', 56),
      h('b', null, 'Escolha um item'),
      h('span', null, 'Clique num item da mochila para ver o que ele faz e comparar com o que você está usando.'),
      h('span', 'dim', 'Os números verdes nos itens mostram quanto Poder você ganha ao equipar.'));
  }
  const it = f.item, inBag = !f.slot;
  const head = h('div', 'dt-head',
    itemTile(it, { size: 64, level: false }),
    h('div', 'dt-name', h('b', { style: `color:${rarColor(it)}` }, fullName(it)), h('span', { style: `color:${rarColor(it)}` }, typeLine(it))),
    h('button', { type: 'button', class: 'mini-btn', 'aria-label': 'Fechar detalhes', 'data-fk': 'detalhe-fechar', onclick: () => { c.st.heroSel = null; c.st.heroPane = 'stats'; c.redraw(); } }, ui('fechar', 18)));
  if (!inBag) {
    const def = ITEM_TYPES[it.type], base = baseLabel(it);
    return h('div', 'dt',
      head,
      h('div', 'dt-badge eq', ui('check', 20), `Equipado · ${SLOT_LABEL[f.slot!]}`),
      h('div', 'dt-scroll',
        base && h('div', 'dt-line hot', ui(def.base === 'dano' ? 'dano' : 'defesa', 20), h('span', null, br(base))),
        it.affixes.map((a) => h('div', 'dt-line', ui(AFFIX_ICON[a.k], 20), h('span', null, br(affixText(a))))),
        extras(p, it)),
      actionRow(c, it, false));
  }
  const slot = targetSlot(p, it), other = p.equipped[slot], dp = powerDelta(p, it), now = powerOf(deriveStats(p));
  const needs = ITEM_TYPES[it.type].needs, weapon = p.equipped.arma;
  const warns: string[] = [];
  if (needs && (!weapon || weapon.type !== needs)) warns.push(`Só funciona com ${ITEM_TYPES[needs].label.toLowerCase()}.`);
  if (ITEM_TYPES[it.type].group === 'arma' && weapon && weapon.type !== it.type) warns.push(`Troca o estilo: ${ITEM_TYPES[weapon.type].label} → ${ITEM_TYPES[it.type].label}.`);
  const rows = compareTable(it, other);
  return h('div', 'dt',
    head,
    h('div', `dt-power ${dp > 0 ? 'ok' : dp < 0 ? 'bad' : 'dim'}`,
      ui('poder', 30),
      h('div', null, h('b', null, dp === 0 ? 'Igual' : `${dp > 0 ? '▲' : '▼'} ${signed(dp)}`), h('span', null, `Poder ${num(now)} → ${num(now + dp)}`))),
    warns.map((w) => h('div', 'dt-warn', ui('cadeado', 18), h('span', null, w))),
    h('div', 'dt-scroll',
      h('div', 'cmp',
        h('div', 'cmp-head', h('span', null, other ? `No lugar de` : `${SLOT_LABEL[slot]} vazio`),
          h('span', 'cmp-col', itemTile(it, { size: 30, level: false })),
          h('span', 'cmp-col', other ? itemTile(other, { size: 30, level: false }) : emptyTile(GHOST[slot], 30))),
        rows.map((r) => h('div', `cmp-row ${r.tone}`,
          ui(r.icon, 18), h('span', 'cmp-label', r.label),
          h('b', 'cmp-col mine', r.mine ?? '—'), h('span', 'cmp-col theirs', r.theirs ?? '—')))),
      extras(p, it)),
    actionRow(c, it, true));
}

function sidePanel(c: Ctx): HTMLElement {
  const pane = c.st.heroPane;
  return h('section', { class: 'panel hero-side', 'aria-label': pane === 'item' ? 'Item escolhido' : 'Estatísticas' },
    h('div', { class: 'seg', role: 'tablist' },
      h('button', { type: 'button', role: 'tab', class: pane === 'item' ? 'on' : '', 'aria-selected': String(pane === 'item'), 'data-fk': 'aba-item', onclick: () => { c.st.heroPane = 'item'; c.redraw('aba-item'); } }, ui('item', 20), 'Item'),
      h('button', { type: 'button', role: 'tab', class: pane === 'stats' ? 'on' : '', 'aria-selected': String(pane === 'stats'), 'data-fk': 'aba-stats', onclick: () => { c.st.heroPane = 'stats'; c.redraw('aba-stats'); } }, ui('poder', 20), 'Estatísticas')),
    pane === 'item' ? itemPane(c) : statsPane(c.p));
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
    acts.push({ icon: 'check', label: 'Equipar', rows: [], run: () => { close(); wear(c, it); } });
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
      run: guard('vender', () => { const v = sellItem(c.p, it.id); if (v > 0) c.toast(`+${num(v)} de ouro`); if (c.st.heroSel === it.id) c.st.heroSel = null; c.commit(); }),
    }, {
      icon: armed('desmontar') ? 'check' : 'desmontar', label: armed('desmontar') ? 'Confirmar' : 'Desmontar', off: !!it.locked, cls: armed('desmontar') ? 'armed' : '',
      rows: [{ icon: 'resina', text: 'Resina', value: `+${num(y.mata)}`, tone: 'ok' }, y.po > 0 ? { icon: 'po', text: 'Pó de Assombro', value: `+${num(y.po)}`, tone: 'ok' } : null],
      run: guard('desmontar', () => { const got = dismantleItem(c.p, it.id); if (got) c.toast(`+${num(got.mata)} de resina${got.po ? `, +${num(got.po)} de pó` : ''}`); if (c.st.heroSel === it.id) c.st.heroSel = null; c.commit(); }),
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
  const p = c.p;
  if (c.st.heroSel != null && !findItem(p, c.st.heroSel)) c.st.heroSel = null;
  if (c.st.heroSel == null && c.st.heroPane === 'item' && !p.inventory.length) c.st.heroPane = 'stats';
  const gain = new Map<number, number>();
  for (const it of p.inventory) gain.set(it.id, powerDelta(p, it));
  const selInBag = c.st.heroSel != null ? p.inventory.find((i) => i.id === c.st.heroSel) : undefined;
  const target = selInBag ? targetSlot(p, selInBag) : null;
  return h('div', 'heroi',
    backdrop('heroi', MAIN_W, MAIN_H, (g) => paintHeroBackdrop(g, MAIN_W, MAIN_H)),
    dollPanel(c, target),
    bagPanel(c, gain),
    sidePanel(c));
}
