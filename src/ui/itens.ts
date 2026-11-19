/** Peças de interface para mostrar itens: o quadradinho da mochila e o bloco de descrição. */
import { ITEM_TYPES, RARITIES, UNIQUES, affixText, baseLabel, type Item } from '../data/items';
import { br, h, icon, s } from './dom';

export function rarColor(item: Item): string {
  return RARITIES[item.rarity].color;
}

export function fullName(item: Item): string {
  return item.plus > 0 ? `${item.name} +${item.plus}` : item.name;
}

/** "Raro · Facão · nível do item 5" */
export function typeLine(item: Item): string {
  return `${RARITIES[item.rarity].label} · ${ITEM_TYPES[item.type].label} · nível do item ${item.ilvl}`;
}

export function lockIcon(size = 12): SVGElement {
  return s('svg', { class: 'lock-ico', viewBox: '0 0 12 12', width: size, height: size, 'aria-hidden': 'true' },
    s('path', { d: 'M3.6 5.2V3.9a2.4 2.4 0 0 1 4.8 0v1.3', fill: 'none', 'stroke-width': 1.5 }),
    s('rect', { x: 2, y: 5.2, width: 8, height: 5.6, rx: 1.3 }));
}

export interface TileOpts {
  fk?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  /** Seta verde: melhor que o equipado. */
  better?: boolean;
  /** Marca de item em uso. */
  worn?: boolean;
  size?: number;
  title?: string;
}

export function itemTile(item: Item, o: TileOpts = {}): HTMLElement {
  const size = o.size ?? 52;
  const kids = [
    icon('item', item.type, Math.round(size * 0.72)),
    item.plus > 0 && h('span', 'tile-plus', `+${item.plus}`),
    item.locked && h('span', { class: 'tile-lock', title: 'Travado' }, lockIcon(11)),
    o.better && h('span', { class: 'tile-up', title: 'Melhor que o equipado' }, '▲'),
    o.worn && h('span', 'tile-worn', 'em uso'),
  ];
  const label = `${fullName(item)}, ${RARITIES[item.rarity].label}, ${ITEM_TYPES[item.type].label}${item.locked ? ', travado' : ''}`;
  const attrs = {
    class: `tile${o.selected ? ' sel' : ''}${item.unique ? ' named' : ''}`,
    style: `--rar:${rarColor(item)};--tile:${size}px`,
    title: o.title ?? fullName(item),
  };
  if (!o.onClick) return h('span', { ...attrs, role: 'img', 'aria-label': label }, kids);
  return h('button', {
    ...attrs, type: 'button', 'aria-label': label, 'aria-pressed': o.selected == null ? null : String(o.selected),
    disabled: o.disabled, 'data-fk': o.fk, onclick: o.onClick,
  }, kids);
}

/** Cabeçalho (ícone, nome na cor da raridade, tipo) e as linhas do item. */
export function itemCard(item: Item, compact = false): HTMLElement {
  const base = baseLabel(item), unique = item.unique ? UNIQUES[item.unique] : null, note = ITEM_TYPES[item.type].note;
  return h('div', { class: `item-card${compact ? ' compact' : ''}`, style: `--rar:${rarColor(item)}` },
    h('div', 'item-head',
      itemTile(item, { size: compact ? 40 : 56 }),
      h('div', 'item-title',
        h('strong', 'item-name', fullName(item)),
        h('span', 'item-type', typeLine(item)),
        unique && h('span', 'chip named-chip', 'Item com nome'),
      ),
    ),
    base && h('p', 'item-base', br(base)),
    item.affixes.length > 0 && h('ul', 'affixes', item.affixes.map((a) => h('li', null, affixText(a)))),
    !base && item.affixes.length === 0 && h('p', 'muted', 'Sem bônus.'),
    unique && h('p', 'unique-effect', h('b', null, 'Efeito: '), unique.effect),
    !compact && note && h('p', 'type-note', note),
  );
}

/** Linha curta para listas: ícone, nome, raridade e valor base. */
export function itemRow(item: Item, extra?: Node | string | null): HTMLElement {
  const base = baseLabel(item);
  return h('div', { class: `item-row${item.unique ? ' named' : ''}`, style: `--rar:${rarColor(item)}` },
    itemTile(item, { size: 40 }),
    h('div', 'item-title',
      h('strong', 'item-name', fullName(item)),
      h('span', 'item-type', [RARITIES[item.rarity].label, ITEM_TYPES[item.type].label, base ? br(base) : item.affixes.map(affixText).join(', ')].filter(Boolean).join(' · ')),
    ),
    extra ? h('span', 'item-extra', extra) : null,
  );
}
