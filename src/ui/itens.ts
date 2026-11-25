/** Peças para mostrar itens: o quadradinho com moldura de raridade e o tooltip com comparação. */
import { ELEMENTS, type ElementId } from '../data/content';
import {
  GEM_LEVEL_NAMES, ITEM_TYPES, RARITIES, SETS, SLOT_LABEL, UNIQUES, affixText, baseLabel, baseValue, canHoldGem, gemName, gemText, sellValue,
  type Affix, type AffixKey, type Gem, type Item, type Slot,
} from '../data/items';
import { bestSlot } from '../meta/mochila';
import { slotsFor, type Profile } from '../meta/profile';
import { activeItems, setCounts } from '../meta/stats';
import { br, gemIcon, h, itemIcon, num, signed, ui } from './dom';
import { tip, type TipRow, type TipSpec } from './tip';

/** Ícone de cada bônus de item. */
export const AFFIX_ICON: Record<AffixKey, string> = {
  forca: 'forca', agilidade: 'agilidade', inteligencia: 'inteligencia', vitalidade: 'vitalidade', espirito: 'espirito', sorte: 'sorte',
  vida: 'vida', mana: 'mana', dano: 'dano', critico: 'critico', danoCritico: 'danoCritico', velAtaque: 'velAtaque', defesa: 'defesa',
  resNatureza: 'resistencia', danoNatureza: 'natureza', recarga: 'recarga', ouro: 'ouro', rouboVida: 'roubo',
  danoFeitico: 'magia', resTudo: 'resistencia', movimento: 'movimento',
  faro: 'critico', teimosia: 'perfurar', pacto: 'furia',
};

/** Faixas de bônus dos conjuntos: peças equipadas para cada uma. */
export const SET_STEPS = [2, 4, 6] as const;
const SET_COLOR = '#5fe0b0';

/** Gema com o nível no canto: na bolsa, no encaixe e no resultado. */
export function gemTile(g: Gem, size = 44, cls = ''): HTMLElement {
  return h('span', { class: `gem-tile ${cls}`.trim(), style: `--gc:${ELEMENTS[g.el].color};--gem:${size}px` },
    gemIcon(g.el, Math.round(size * 0.82)), h('b', 'gem-lv', g.lvl));
}

/** Nome curto da gema com o nível ("Rubi Lapidada · Nv 3"). */
export function gemLabel(g: Gem): string {
  return `${gemName(g)} · Nv ${g.lvl}`;
}

export { GEM_LEVEL_NAMES };

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
  if (!p.inventory.some((i) => i.id === item.id)) return slotsFor(item.type)[0];
  return bestSlot(p, item).slot;
}

/** Quanto o Poder muda se o item da mochila for equipado (no melhor espaço). */
export function powerDelta(p: Profile, item: Item): number {
  if (!p.inventory.some((i) => i.id === item.id)) return 0;
  return bestSlot(p, item).delta;
}

/** Chave de um afixo para somar e comparar: o tipo e, nos de elemento, o elemento. */
const affixId = (a: Affix): string => (a.el ? `${a.k}|${a.el}` : a.k);
const splitId = (id: string): [AffixKey, ElementId | undefined] => { const [k, el] = id.split('|'); return [k as AffixKey, el as ElementId | undefined]; };

/** Valor e nome de um bônus separados, para tabelas ("+8", "Espírito"). */
export function affixParts(k: AffixKey, v: number, el?: ElementId): { value: string; label: string } {
  const text = affixText({ k, v, el }), m = /^([+−-]?[\d.,]+%?)\s+(?:de |na |no )?(.*)$/.exec(text);
  return m ? { value: br(m[1]), label: m[2].charAt(0).toUpperCase() + m[2].slice(1) } : { value: '', label: text };
}

export interface CompareLine { icon: string; label: string; mine: string | null; theirs: string | null; tone: 'ok' | 'bad' | 'dim' }

/** Linhas da tabela "este × equipado": dano ou defesa base e cada bônus dos dois itens. */
export function compareTable(item: Item, other: Item | null | undefined): CompareLine[] {
  const rows: CompareLine[] = [];
  const tA = ITEM_TYPES[item.type], tB = other ? ITEM_TYPES[other.type] : null;
  const bases = new Set([tA.base, tB?.base].filter((b) => b && b !== 'nenhum'));
  for (const b of bases) {
    const mine = tA.base === b ? baseValue(item) : 0, theirs = other && tB?.base === b ? baseValue(other) : 0;
    rows.push({ icon: b === 'dano' ? 'dano' : 'defesa', label: b === 'dano' ? 'Dano' : 'Defesa', mine: mine ? br(num(mine, 1)) : null, theirs: theirs ? br(num(theirs, 1)) : null, tone: mine > theirs ? 'ok' : mine < theirs ? 'bad' : 'dim' });
  }
  /* um afixo de elemento só se compara com o mesmo afixo do mesmo elemento */
  const a = new Map<string, number>(), o = new Map<string, number>();
  for (const x of item.affixes) a.set(affixId(x), (a.get(affixId(x)) ?? 0) + x.v);
  for (const x of other?.affixes ?? []) o.set(affixId(x), (o.get(affixId(x)) ?? 0) + x.v);
  for (const id of new Set([...a.keys(), ...o.keys()])) {
    const [k, el] = splitId(id), va = a.get(id) ?? 0, vo = o.get(id) ?? 0, label = affixParts(k, va || vo, el).label;
    rows.push({ icon: el && k !== 'pacto' ? el : AFFIX_ICON[k], label, mine: va ? affixParts(k, va, el).value : null, theirs: vo ? affixParts(k, vo, el).value : null, tone: va > vo ? 'ok' : va < vo ? 'bad' : 'dim' });
  }
  return rows;
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
  /** Selo com a mudança de Poder (só aparece se for ganho). */
  gain?: number;
  /** Item escolhido na tela. */
  selected?: boolean;
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
    o.gain != null && o.gain > 0 ? h('span', 'tile-gain', `▲${num(o.gain)}`) : o.better && h('span', 'tile-up', '▲'),
    o.seal && h('span', 'tile-seal'),
    o.equipped && h('span', 'tile-eq', 'E'),
    item.set && h('span', 'tile-set', ui('conjunto', Math.max(14, Math.round(size * 0.3)))),
    item.gem && h('span', { class: 'tile-gem', style: `--gc:${ELEMENTS[item.gem.el].color}` }, gemIcon(item.gem.el, Math.max(14, Math.round(size * 0.3)))),
  ];
  const label = `${fullName(item)}, ${RARITIES[item.rarity].label}, ${ITEM_TYPES[item.type].label}${item.set ? `, conjunto ${SETS[item.set]?.name ?? ''}` : ''}${item.gem ? `, ${gemName(item.gem)}` : ''}${item.locked ? ', travado' : ''}`;
  const attrs: Record<string, unknown> = {
    class: `tile r${item.rarity}${item.unique ? ' named' : ''}${o.gain != null && o.gain > 0 ? ' up' : ''}${o.selected ? ' sel' : ''} ${o.cls ?? ''}`.trim(),
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
  const sum = new Map<string, number>();
  for (const a of item.affixes) sum.set(affixId(a), (sum.get(affixId(a)) ?? 0) + a.v);
  for (const a of other.affixes) sum.set(affixId(a), (sum.get(affixId(a)) ?? 0) - a.v);
  for (const [id, d] of sum) {
    if (!d) continue;
    const [k, el] = splitId(id), text = affixText({ k, v: Math.abs(d), el });
    rows.push({ icon: AFFIX_ICON[k], text: `${d > 0 ? '▲' : '▼'} ${d > 0 ? text : flip(text)}`, tone: d > 0 ? 'ok' : 'bad' });
  }
  return rows;
}

/** Nome do conjunto e as três faixas de bônus, acesas pelas peças equipadas agora. */
function setRows(p: Profile, item: Item): TipRow[] {
  const def = item.set ? SETS[item.set] : null;
  if (!def) return [];
  const have = setCounts(activeItems(p))[def.key] ?? 0;
  return [
    'sep',
    { icon: 'conjunto', text: def.name, value: `${have}/${def.pieces.length}`, color: SET_COLOR },
    ...SET_STEPS.map((n, i): TipRow => ({ icon: have >= n ? 'check' : 'cadeado', text: `${n}: ${def.bonus[i]}`, tone: have >= n ? 'ok' : 'dim' })),
  ];
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
  if (item.gem) rows.push({ node: gemTile(item.gem, 24), text: gemText(item), color: ELEMENTS[item.gem.el].color });
  else if (canHoldGem(item)) rows.push({ node: h('span', 'gem-empty'), text: 'Encaixe vazio', tone: 'dim' });
  rows.push(...setRows(p, item));
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
    sub: typeLine(item) + (unique ? ' · Item com nome' : item.set ? ' · Conjunto' : ''), subColor: rarColor(item),
    icon: itemTile(item, { size: 44, level: false }),
    rows,
    foot: o.foot ?? (o.where === 'mochila' ? ['Clique: equipar', 'Botão direito: opções'] : o.where === 'equipado' ? [o.slot === 'arma' ? null : 'Clique: tirar', 'Botão direito: opções'] : []),
  };
}
