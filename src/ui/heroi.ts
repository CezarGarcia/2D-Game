/** Aba Herói: equipamento, atributos e mochila, com o detalhe e a comparação de itens. */
import { drawCapi, drawHero } from '../art/characters';
import {
  ITEM_TYPES, SLOTS, SLOT_LABEL, affixText, baseLabel, baseValue, itemScore, sellValue, UNIQUES,
  type Item, type Slot, type SlotGroup,
} from '../data/items';
import {
  ATTRS, FREE_RESPEC_LEVEL, INVENTORY_SIZE, MATERIAL_LABEL, allocAttr, dismantleItem, dismantleYield, equip, findItem,
  offhandWarning, resetAttrs, respecCost, sellItem, slotsFor, toggleLock, unequip, type Profile,
} from '../meta/profile';
import { damageReduction, deriveStats, totalAttrs } from '../meta/stats';
import { confirmStep, type Ctx, type InvSort } from './ctx';
import { br, btn, h, num, pct } from './dom';
import { fullName, itemCard, itemTile, rarColor } from './itens';

const GROUPS: { key: SlotGroup | 'todos'; label: string }[] = [
  { key: 'todos', label: 'Todos os espaços' }, { key: 'arma', label: 'Arma' }, { key: 'mao', label: 'Outra mão' },
  { key: 'cabeca', label: 'Cabeça' }, { key: 'peito', label: 'Peito' }, { key: 'maos', label: 'Mãos' }, { key: 'pes', label: 'Pés' },
  { key: 'anel', label: 'Anel' }, { key: 'amuleto', label: 'Amuleto' },
];
const SORTS: { key: InvSort; label: string }[] = [
  { key: 'novo', label: 'Mais novo' }, { key: 'raridade', label: 'Raridade' }, { key: 'nivel', label: 'Nível do item' },
];

export function slotName(slot: Slot): string {
  return slot === 'anel1' ? 'Anel (1º espaço)' : slot === 'anel2' ? 'Anel (2º espaço)' : SLOT_LABEL[slot];
}

export function respecLabel(p: Profile): string {
  const cost = respecCost(p);
  return cost > 0 ? `custa ${num(cost)} de ouro` : `grátis até o nível ${FREE_RESPEC_LEVEL}`;
}

/** Itens da mochila, já filtrados e ordenados como a tela mostra. */
function bagView(c: Ctx): Item[] {
  const list = c.p.inventory.filter((it) => c.st.heroFilter === 'todos' || ITEM_TYPES[it.type].group === c.st.heroFilter);
  const by: Record<InvSort, (a: Item, b: Item) => number> = {
    novo: (a, b) => b.id - a.id,
    raridade: (a, b) => b.rarity - a.rarity || itemScore(b) - itemScore(a) || b.id - a.id,
    nivel: (a, b) => b.ilvl - a.ilvl || b.rarity - a.rarity || b.id - a.id,
  };
  return list.sort(by[c.st.heroSort]);
}

/** Dica na mochila: o item serve agora e ganha do que está equipado (mesmo tipo) ou o espaço está vazio. */
function isBetter(p: Profile, item: Item): boolean {
  const needs = ITEM_TYPES[item.type].needs;
  if (needs && p.equipped.arma?.type !== needs) return false;
  return slotsFor(item.type).some((sl) => {
    const cur = p.equipped[sl];
    return !cur || (cur.type === item.type && itemScore(item) > itemScore(cur));
  });
}

/* ---------- coluna 1: retrato e equipamento ---------- */

function portrait(c: Ctx): HTMLElement {
  const W = 268, H = 168, p = c.p;
  const cv = h('canvas', { class: 'portrait', width: W * 2, height: H * 2, role: 'img', 'aria-label': 'Seu herói' });
  const weapon = p.equipped.arma?.type, capi = p.companion === 'capivara';
  c.animate(cv, (g, t) => {
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(8,14,8,.45)';
    g.beginPath(); g.ellipse(W / 2, H - 16, 84, 11, 0, 0, Math.PI * 2); g.fill();
    if (capi) { g.save(); g.translate(W / 2 - 78, H - 16); g.scale(1.35, 1.35); drawCapi(g, t, {}); g.restore(); }
    g.save(); g.translate(W / 2 - (capi ? -16 : 4), H - 18); g.scale(1.42, 1.42); drawHero(g, t, { weapon }); g.restore();
  });
  return h('div', 'portrait-box', cv, h('div', 'portrait-tag', h('b', null, `Nível ${p.level}`)));
}

function equipColumn(c: Ctx): HTMLElement {
  const p = c.p, warn = offhandWarning(p);
  return h('section', { class: 'panel col-equip', 'aria-label': 'Equipamento' },
    portrait(c),
    warn && h('p', 'warn-text small', warn),
    h('ul', { class: 'slots', 'data-sk': 'slots' }, SLOTS.map((slot) => {
      const it = p.equipped[slot], selected = !!it && c.st.heroSel === it.id;
      if (!it) return h('li', null, h('div', 'slot empty', h('span', { class: 'tile blank', style: '--tile:36px' }), h('span', 'slot-text', h('span', 'k', slotName(slot)), h('span', 'muted', 'vazio'))));
      return h('li', null, h('button', {
        type: 'button', class: `slot${selected ? ' sel' : ''}`, style: `--rar:${rarColor(it)}`, 'data-fk': `eq-${slot}`, 'aria-pressed': String(selected),
        onclick: () => { c.st.heroSel = selected ? null : it.id; c.st.armed = null; c.st.note = null; c.redraw(); },
      },
      itemTile(it, { size: 36 }),
      h('span', 'slot-text', h('span', 'k', slotName(slot)), h('span', 'slot-name', it.name)),
      it.plus > 0 && h('b', 'slot-plus num', `+${it.plus}`)));
    })),
  );
}

/* ---------- coluna 2: atributos ou detalhe do item ---------- */

function attrPanel(c: Ctx): HTMLElement {
  const p = c.p, total = totalAttrs(p), st = deriveStats(p), cost = respecCost(p);
  const spent = ATTRS.reduce((n, a) => n + p.attrs[a.key], 0);
  const add = (key: typeof ATTRS[number]['key'], n: number) => () => { if (allocAttr(p, key, n)) { c.st.armed = null; c.commit(); } };
  const derived: [string, string, string?][] = [
    ['Vida', num(st.maxHp)],
    ['Mana', num(st.maxMana)],
    ['Dano da arma', `${num(st.weaponDamage, 1)} × ${num(st.damageMult, 2)}`, 'Dano base da arma vezes o seu multiplicador de dano'],
    ['Velocidade de ataque', pct(st.attackSpeed)],
    ['Crítico', `${pct(st.critChance, 1)} de chance · ${pct(st.critMult)} de dano`],
    ['Defesa', `${num(st.defense, 1)} · corta ${pct(damageReduction(st.defense, p.level), 1)} do dano`, `Contra inimigos do seu nível (${p.level})`],
    ['Velocidade', num(st.moveSpeed)],
    ['Recarga da esquiva', `${num(st.dodgeCooldown, 2)} s`],
    ['Poder mágico', pct(st.spellPower)],
  ];
  return h('section', { class: 'panel col-mid', 'aria-label': 'Atributos' },
    h('div', { class: 'panel-scroll', 'data-sk': 'attrs' },
      h('header', 'panel-head',
        h('h2', 'title', 'Atributos'),
        h('span', `points${p.attrPoints > 0 ? ' hot' : ''}`, h('b', 'num', p.attrPoints), p.attrPoints === 1 ? ' ponto para distribuir' : ' pontos para distribuir')),
      h('ul', 'attrs', ATTRS.map((a) => h('li', null,
        h('div', 'attr-text', h('strong', null, a.label), h('span', 'muted small', a.desc)),
        h('b', 'attr-val num', total[a.key]),
        h('div', 'attr-btns',
          btn('+1', add(a.key, 1), { small: true, disabled: p.attrPoints < 1, fk: `attr-${a.key}`, label: `Mais 1 ponto em ${a.label}` }),
          btn('+5', add(a.key, 5), { small: true, disabled: p.attrPoints < 5, fk: `attr5-${a.key}`, label: `Mais 5 pontos em ${a.label}` }))))),
      h('div', 'respec',
        btn(c.st.armed === 'attrs' ? 'Confirmar: devolver todos os pontos' : 'Redistribuir', () => {
          if (!confirmStep(c, 'attrs')) return;
          c.st.note = resetAttrs(p) ? null : 'Falta ouro para redistribuir.';
          c.commit();
        }, { small: true, kind: c.st.armed === 'attrs' ? 'danger' : undefined, disabled: spent === 0 || p.gold < cost, fk: 'respec-attrs' }),
        h('span', 'muted small', spent === 0 ? 'Nenhum ponto distribuído ainda.' : `Devolve os ${num(spent)} pontos distribuídos: ${respecLabel(p)}.`)),
      h('h3', null, 'Números do herói'),
      h('dl', 'derived', derived.map(([k, v, tip]) => h('div', { title: tip }, h('dt', null, k), h('dd', 'num', v)))),
      h('p', 'muted small', `A redução da defesa vale contra inimigos do seu nível (${p.level}). Clique num item para ver o detalhe e comparar.`),
    ),
  );
}

type Mark = 'up' | 'down' | 'same' | 'none';
const MARK_TEXT: Record<Mark, string> = { up: '▲', down: '▼', same: '=', none: '' };
const MARK_LABEL: Record<Mark, string> = { up: 'melhor', down: 'pior', same: 'igual', none: '' };

function markLine(mark: Mark, text: string): HTMLElement {
  return h('li', `cmp-${mark}`, h('span', { class: 'mark', title: MARK_LABEL[mark] || null }, MARK_TEXT[mark]), h('span', null, text), mark !== 'none' && h('span', 'sr', ` (${MARK_LABEL[mark]})`));
}

/** Compara o item escolhido com o que está equipado no mesmo espaço. */
function comparison(item: Item, other: Item, slot: Slot): HTMLElement {
  const kind = ITEM_TYPES[item.type].base, same = kind === ITEM_TYPES[other.type].base && kind !== 'nenhum';
  const diff = Math.round((baseValue(item) - baseValue(other)) * 10) / 10;
  const mine = item.affixes.map((a) => {
    const o = other.affixes.find((x) => x.k === a.k);
    return markLine(!o || a.v > o.v ? 'up' : a.v < o.v ? 'down' : 'same', affixText(a) + (!o ? ' (novo)' : ''));
  });
  const theirs = other.affixes.map((a) => {
    const m = item.affixes.find((x) => x.k === a.k);
    return markLine(!m ? 'down' : 'none', affixText(a) + (!m ? ' (você perde)' : ''));
  });
  const effect = (it: Item) => (it.unique ? h('li', 'cmp-effect', h('span', 'mark', '◆'), h('span', null, UNIQUES[it.unique].effect)) : null);
  return h('div', 'compare',
    h('h3', null, `Comparado com ${slotName(slot)}: `, h('span', { style: `color:${rarColor(other)}` }, fullName(other))),
    same
      ? h('p', `cmp-base cmp-${diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'}`,
        h('span', 'mark', diff > 0 ? '▲' : diff < 0 ? '▼' : '='),
        h('b', 'num', diff === 0 ? 'Mesmo valor base' : `${diff > 0 ? '+' : '−'}${num(Math.abs(diff), 1)} de ${kind === 'dano' ? 'dano' : 'defesa'}`),
        h('span', 'muted num', ` (${num(baseValue(other), 1)} → ${num(baseValue(item), 1)})`))
      : (baseLabel(item) || baseLabel(other)) ? h('p', 'cmp-base', h('span', 'muted', `Este: ${br(baseLabel(item)) || 'sem valor base'} · Equipado: ${br(baseLabel(other)) || 'sem valor base'}`)) : null,
    h('div', 'cmp-cols',
      h('div', null, h('div', 'k', 'Este item'), h('ul', 'cmp-list', mine.length || item.unique ? [mine, effect(item)] : h('li', 'muted', 'Sem bônus'))),
      h('div', null, h('div', 'k', 'Equipado'), h('ul', 'cmp-list', theirs.length || other.unique ? [theirs, effect(other)] : h('li', 'muted', 'Sem bônus')))),
  );
}

function yieldText(item: Item): string {
  const y = dismantleYield(item);
  return (Object.keys(y) as (keyof typeof y)[]).filter((k) => y[k] > 0).map((k) => `${num(y[k])} ${MATERIAL_LABEL[k]}`).join(' e ');
}

function itemPanel(c: Ctx, item: Item, slot: Slot | null): HTMLElement {
  const p = c.p, options = slotsFor(item.type), inBag = slot === null;
  const view = bagView(c), index = view.findIndex((i) => i.id === item.id);
  /** Depois de vender ou desmontar, passa para o vizinho na mochila, para limpar itens em sequência. */
  const selectNeighbour = () => { const rest = bagView(c); c.st.heroSel = rest.length ? rest[Math.min(Math.max(index, 0), rest.length - 1)].id : null; };
  const careful = item.rarity >= 2 || item.plus > 0 || !!item.unique;
  const close = () => c.redraw(closeHeroi(c) || undefined);
  const needs = ITEM_TYPES[item.type].needs;
  const mismatch = needs && p.equipped.arma?.type !== needs ? `Atenção: ${ITEM_TYPES[item.type].label.toLowerCase()} só funciona com ${ITEM_TYPES[needs].label.toLowerCase()} equipado.` : null;

  const actions: (HTMLElement | false | null)[] = [];
  if (inBag) {
    for (const sl of options) {
      actions.push(btn(options.length > 1 ? `Equipar no ${slotName(sl)}` : 'Equipar', () => {
        if (equip(p, item.id, sl)) { c.st.note = `${fullName(item)} equipado.`; c.st.armed = null; c.commit(); }
      }, { kind: 'primary', fk: `equipar-${sl}` }));
    }
    actions.push(btn(c.st.armed === 'vender' ? `Confirmar venda: +${num(sellValue(item))} de ouro` : `Vender · +${num(sellValue(item))} de ouro`, () => {
      if (careful && !confirmStep(c, 'vender')) return;
      const v = sellItem(p, item.id);
      if (v > 0) { c.st.note = `Vendeu ${fullName(item)} por ${num(v)} de ouro.`; selectNeighbour(); }
      c.st.armed = null; c.commit();
    }, { disabled: !!item.locked, kind: c.st.armed === 'vender' ? 'danger' : undefined, fk: 'vender' }));
    actions.push(btn(c.st.armed === 'desmontar' ? `Confirmar: desmontar por ${yieldText(item)}` : `Desmontar · ${yieldText(item)}`, () => {
      if (careful && !confirmStep(c, 'desmontar')) return;
      const text = yieldText(item);
      if (dismantleItem(p, item.id)) { c.st.note = `Desmontou ${fullName(item)}: ${text}.`; selectNeighbour(); }
      c.st.armed = null; c.commit();
    }, { disabled: !!item.locked, kind: c.st.armed === 'desmontar' ? 'danger' : undefined, fk: 'desmontar' }));
  } else {
    const full = p.inventory.length >= INVENTORY_SIZE;
    actions.push(btn('Desequipar', () => {
      if (unequip(p, slot)) { c.st.note = `${fullName(item)} voltou para a mochila.`; c.commit(); }
    }, { disabled: slot === 'arma' || full, fk: 'desequipar' }));
    if (slot === 'arma') actions.push(h('p', 'muted small', 'A arma não pode ficar vazia: equipe outra por cima.'));
    else if (full) actions.push(h('p', 'warn-text small', 'A mochila está cheia.'));
  }
  actions.push(btn(item.locked ? 'Destravar' : 'Travar', () => { toggleLock(p, item.id); c.st.armed = null; c.commit(); },
    { fk: 'travar', title: 'Item travado não pode ser vendido, desmontado nem consumido em fusão' }));

  return h('section', { class: 'panel col-mid item-detail', 'aria-label': 'Detalhe do item' },
    h('div', { class: 'panel-scroll', 'data-sk': `item-${item.id}` },
      h('header', 'panel-head',
        h('span', 'eyebrow', inBag ? 'Na mochila' : `Em uso · ${slotName(slot)}`),
        btn('Fechar', close, { small: true, kind: 'quiet', fk: 'fechar-item', title: 'Esc' })),
      itemCard(item),
      mismatch && h('p', 'warn-text small', mismatch),
      inBag && options.map((sl) => {
        const other = p.equipped[sl];
        return other ? comparison(item, other, sl) : h('p', 'cmp-empty', h('span', 'mark', '▲'), ` ${slotName(sl)} está vazio: equipar só soma.`);
      }),
      item.locked && inBag && h('p', 'muted small', 'Item travado: destrave para vender ou desmontar.'),
    ),
    h('div', 'panel-foot actions', actions),
  );
}

/* ---------- coluna 3: mochila ---------- */

function bagColumn(c: Ctx): HTMLElement {
  const p = c.p, view = bagView(c);
  const empty = Math.max(0, (c.st.heroFilter === 'todos' ? INVENTORY_SIZE : Math.ceil(Math.max(view.length, 1) / 8) * 8) - view.length);
  const select = <T extends string>(label: string, fk: string, value: T, options: { key: T; label: string }[], set: (v: T) => void) =>
    h('label', 'field', h('span', 'k', label), h('select', {
      'data-fk': fk, onchange: (e: Event) => { set((e.target as HTMLSelectElement).value as T); c.redraw(); },
    }, options.map((o) => h('option', { value: o.key, selected: o.key === value }, o.label))));

  return h('section', { class: 'panel col-bag', 'aria-label': 'Mochila' },
    h('header', 'panel-head',
      h('h2', 'title', 'Mochila'),
      h('span', `points${p.inventory.length >= INVENTORY_SIZE ? ' hot' : ''}`, h('b', 'num', `${p.inventory.length}/${INVENTORY_SIZE}`), ' espaços')),
    h('div', 'bag-tools',
      select('Espaço', 'bag-filter', c.st.heroFilter, GROUPS, (v) => { c.st.heroFilter = v; }),
      select('Ordenar por', 'bag-sort', c.st.heroSort, SORTS, (v) => { c.st.heroSort = v; })),
    h('div', { class: 'bag-scroll', 'data-sk': 'bag' },
      h('div', 'bag-grid',
        view.map((it) => itemTile(it, {
          fk: `inv-${it.id}`, selected: c.st.heroSel === it.id, better: isBetter(p, it),
          onClick: () => { c.st.heroSel = c.st.heroSel === it.id ? null : it.id; c.st.armed = null; c.st.note = null; c.redraw(); },
        })),
        Array.from({ length: empty }, () => h('span', { class: 'tile blank', 'aria-hidden': 'true' }))),
      view.length === 0 && h('p', 'muted', c.st.heroFilter === 'todos' ? 'A mochila está vazia. Vença fases para ganhar itens.' : 'Nenhum item deste espaço na mochila.')),
    h('p', { class: 'note', role: 'status' }, c.st.note ?? h('span', 'muted', h('span', 'legend-up', '▲'), ' melhor que o equipado · clique num item para ver o detalhe')),
  );
}

export function renderHeroi(c: Ctx): HTMLElement {
  const found = c.st.heroSel != null ? findItem(c.p, c.st.heroSel) : null;
  if (!found) c.st.heroSel = null;
  return h('div', 'tab-heroi', equipColumn(c), found ? itemPanel(c, found.item, found.slot) : attrPanel(c), bagColumn(c));
}

/** Fecha o detalhe do item (Esc). Devolve a chave de foco do item que estava aberto, ou null se não havia nada. */
export function closeHeroi(c: Ctx): string | null {
  const id = c.st.heroSel;
  if (id == null) return null;
  const f = findItem(c.p, id);
  c.st.heroSel = null; c.st.armed = null;
  return !f ? '' : f.slot ? `eq-${f.slot}` : `inv-${id}`;
}
