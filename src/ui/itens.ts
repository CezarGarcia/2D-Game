/** Peças para mostrar itens: o quadradinho com moldura de raridade e o tooltip com comparação. */
import { AFFIXES, ITEM_TYPES, RARITIES, SLOT_LABEL, UNIQUES, affixText, baseLabel, baseValue, sellValue, type AffixKey, type Item, type Slot } from '../data/items';
import { equip, slotsFor, type Profile } from '../meta/profile';
import { deriveStats, powerOf } from '../meta/stats';
import { br, h, itemIcon, num, signed, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

/** Ícone de cada bônus de item. */
export const AFFIX_ICON: Record<AffixKey, string> = {
  forca: 'forca', agilidade: 'agilidade', inteligencia: 'inteligencia', vitalidade: 'vitalidade', espirito: 'espirito', sorte: 'sorte',
  vida: 'vida', mana: 'mana', dano: 'dano', critico: 'critico', danoCritico: 'danoCritico', velAtaque: 'velAtaque', defesa: 'defesa',
  resNatureza: 'resistencia', danoNatureza: 'natureza', recarga: 'recarga', ouro: 'ouro', rouboVida: 'roubo',
};

export function rarColor(item: Item): string {
  return RARITIES[item.rarity].color;
}

export function fullName(item: Item): string {
  return item.plus > 0 ? `${item.name} +${item.plus}` : item.name;
}

/** "Raro · Facão · Nv 5" */
export function typeLine(item: Item): string {
  return `${RARITIES[item.rarity].label} · ${ITEM_TYPES[item.type].label} · Nv ${item.ilvl}`;
}

/** Espaço onde o item da mochila entraria se fosse equipado agora. */
export function targetSlot(p: Profile, item: Item): Slot {
  const options = slotsFor(item.type);
  return options.find((sl) => !p.equipped[sl]) ?? options[0];
}

/** Quanto o Poder muda se o item da mochila for equipado. */
export function powerDelta(p: Profile, item: Item): number {
  if (!p.inventory.some((i) => i.id === item.id)) return 0;
  const trial: Profile = { ...p, inventory: p.inventory.slice(), equipped: { ...p.equipped } };
  if (!equip(trial, item.id)) return 0;
  return powerOf(deriveStats(trial)) - powerOf(deriveStats(p));
}

/* ---------- quadradinho ---------- */

export interface TileOpts {
  size?: number;
  cls?: string;
  fk?: string;
  /** Sem `onClick`, o quadradinho é só figura. */
  onClick?: (e: MouseEvent) => void;
  onMenu?: (e: MouseEvent) => void;
  /** Seta verde: aumenta o Poder. */
  better?: boolean;
  /** Mostra o nível do item no canto. */
  level?: boolean;
  /** Selo verde no canto de cima: dá para fazer agora. */
  seal?: boolean;
  /** Marca de item equipado. */
  equipped?: boolean;
  tipSpec?: () => TipSpec | null;
}

export function itemTile(item: Item, o: TileOpts = {}): HTMLElement {
  const size = o.size ?? 52;
  const kids = [
    itemIcon(item.type, Math.round(size * 0.74)),
    item.plus > 0 && h('span', 'tile-plus', `+${item.plus}`),
    o.level !== false && h('span', 'tile-lv', item.ilvl),
    item.locked && h('span', 'tile-lock', ui('cadeado', 16)),
    o.better && h('span', 'tile-up', '▲'),
    o.seal && h('span', 'tile-seal'),
    o.equipped && h('span', 'tile-eq', 'E'),
  ];
  const label = `${fullName(item)}, ${RARITIES[item.rarity].label}, ${ITEM_TYPES[item.type].label}${item.locked ? ', travado' : ''}`;
  const attrs: Record<string, unknown> = {
    class: `tile r${item.rarity}${item.unique ? ' named' : ''} ${o.cls ?? ''}`.trim(),
    style: `--rar:${rarColor(item)};--tile:${size}px`,
    'aria-label': label,
  };
  const el = o.onClick
    ? h('button', { ...attrs, type: 'button', 'data-fk': o.fk, onclick: o.onClick, oncontextmenu: o.onMenu ? (e: MouseEvent) => { e.preventDefault(); o.onMenu!(e); } : null }, kids)
    : h('span', { ...attrs, role: 'img' }, kids);
  if (o.tipSpec) tip(el, o.tipSpec);
  return el;
}

/** Espaço vazio, com a silhueta do tipo de item que cabe ali. */
export function emptyTile(type: string | null, size = 52, cls = ''): HTMLElement {
  return h('span', { class: `tile blank ${cls}`.trim(), style: `--tile:${size}px` }, type && itemIcon(type, Math.round(size * 0.7), 'ghost'));
}

/* ---------- tooltip ---------- */

/** Troca o sinal do começo do texto de um bônus ("+3 de Força" vira "−3 de Força"). */
function flip(text: string): string {
  return text.startsWith('+') ? `−${text.slice(1)}` : text.startsWith('−') ? `+${text.slice(1)}` : text;
}

function compareRows(item: Item, other: Item): TipRow[] {
  const rows: TipRow[] = [];
  const tA = ITEM_TYPES[item.type], tB = ITEM_TYPES[other.type];
  if (tA.base !== 'nenhum' && tA.base === tB.base) {
    const d = Math.round((baseValue(item) - baseValue(other)) * 10) / 10;
    if (d !== 0) rows.push({ icon: tA.base === 'dano' ? 'dano' : 'defesa', text: `${d > 0 ? '▲' : '▼'} ${signed(d, 1)} de ${tA.base === 'dano' ? 'dano' : 'defesa'}`, tone: d > 0 ? 'ok' : 'bad' });
  }
  const sum = new Map<AffixKey, number>();
  for (const a of item.affixes) sum.set(a.k, (sum.get(a.k) ?? 0) + a.v);
  for (const a of other.affixes) sum.set(a.k, (sum.get(a.k) ?? 0) - a.v);
  for (const [k, d] of sum) {
    if (!d) continue;
    const text = AFFIXES[k].text(Math.abs(d));
    rows.push({ icon: AFFIX_ICON[k], text: `${d > 0 ? '▲' : '▼'} ${d > 0 ? text : flip(text)}`, tone: d > 0 ? 'ok' : 'bad' });
  }
  return rows;
}

export interface ItemTipOpts {
  /** Onde o item está: muda a comparação e as dicas de clique. */
  where?: 'mochila' | 'equipado' | 'outro';
  slot?: Slot;
  /** Linhas a mais antes do rodapé (custos do ferreiro, por exemplo). */
  extra?: TipRow[];
  foot?: (string | null | false | undefined)[];
  /** Não mostra valor de venda. */
  noSell?: boolean;
}

export function itemTip(p: Profile, item: Item, o: ItemTipOpts = {}): TipSpec {
  const def = ITEM_TYPES[item.type], base = baseLabel(item), unique = item.unique ? UNIQUES[item.unique] : null;
  const rows: TipRow[] = [];
  if (base) rows.push({ icon: def.base === 'dano' ? 'dano' : 'defesa', text: br(base), tone: 'hot' });
  for (const a of item.affixes) rows.push({ icon: AFFIX_ICON[a.k], text: affixText(a) });
  if (unique) rows.push({ icon: 'estrela', text: unique.effect, tone: 'gold' });
  if (def.note) rows.push({ text: def.note, tone: 'dim' });
  if ((item.pity ?? 0) > 0) rows.push({ icon: 'aprimorar', text: `+${num(item.pity ?? 0)}% na próxima forja`, tone: 'ok' });

  if (o.where === 'mochila') {
    const slot = targetSlot(p, item), other = p.equipped[slot];
    const needs = def.needs, weapon = p.equipped.arma;
    if (needs && (!weapon || weapon.type !== needs)) rows.push('sep', { icon: 'cadeado', text: `Só funciona com ${ITEM_TYPES[needs].label.toLowerCase()}`, tone: 'bad' });
    const dp = powerDelta(p, item);
    rows.push('sep', { head: other ? `No lugar de ${fullName(other)}` : `${SLOT_LABEL[slot]} vazio` });
    if (other) rows.push(...compareRows(item, other));
    rows.push({ icon: 'poder', text: 'Poder', value: dp === 0 ? '=' : `${dp > 0 ? '▲' : '▼'} ${signed(dp)}`, tone: dp > 0 ? 'ok' : dp < 0 ? 'bad' : 'dim' });
  }
  if (o.extra?.length) rows.push('sep', ...o.extra);
  if (!o.noSell) rows.push('sep', { icon: 'vender', text: item.locked ? 'Travado' : 'Venda', value: item.locked ? null : num(sellValue(item)), tone: 'dim' });

  return {
    title: fullName(item), color: rarColor(item),
    sub: typeLine(item) + (unique ? ' · Item com nome' : ''), subColor: rarColor(item),
    icon: itemTile(item, { size: 44, level: false }),
    rows,
    foot: o.foot ?? (o.where === 'mochila' ? ['Clique: equipar', 'Botão direito: opções'] : o.where === 'equipado' ? [o.slot === 'arma' ? null : 'Clique: tirar', 'Botão direito: opções'] : []),
  };
}
