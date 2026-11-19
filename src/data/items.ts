/**
 * Itens: tipos, raridades, bônus e geração. Segue docs/gdd/04-itens-e-forja.md.
 * Nada aqui guarda estado; as funções recebem e devolvem dados.
 */
import { pick, type Rng } from './rng';

export type Slot = 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes' | 'anel1' | 'anel2' | 'amuleto';
export const SLOTS: Slot[] = ['arma', 'mao', 'cabeca', 'peito', 'maos', 'pes', 'anel1', 'anel2', 'amuleto'];
export const SLOT_LABEL: Record<Slot, string> = {
  arma: 'Arma', mao: 'Outra mão', cabeca: 'Cabeça', peito: 'Peito', maos: 'Mãos', pes: 'Pés', anel1: 'Anel', anel2: 'Anel', amuleto: 'Amuleto',
};

export type ItemType = 'facao' | 'arco' | 'escudo' | 'aljava' | 'chapeu' | 'gibao' | 'couraca' | 'manto' | 'luvas' | 'alpercatas' | 'anel' | 'amuleto';
export type WeaponKind = 'facao' | 'arco';
/** Onde o tipo pode ser equipado. Anéis servem nos dois espaços de anel. */
export type SlotGroup = 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes' | 'anel' | 'amuleto';

export interface ItemTypeDef {
  label: string;
  group: SlotGroup;
  /** O que o valor base do item representa. */
  base: 'dano' | 'defesa' | 'nenhum';
  /** Valor base no nível 0 e ganho por nível de item. */
  b0: number; perLevel: number;
  /** Só tem efeito junto desta arma (escudo com facão, aljava com arco). */
  needs?: WeaponKind;
  note?: string;
  names: string[];
}

export const ITEM_TYPES: Record<ItemType, ItemTypeDef> = {
  facao: { label: 'Facão', group: 'arma', base: 'dano', b0: 8, perLevel: 3, note: 'Sequência de 3 golpes. Com escudo, apara.', names: ['Facão de Mato', 'Facão do Vaqueiro', 'Facão de Aroeira', 'Terçado'] },
  arco: { label: 'Arco', group: 'arma', base: 'dano', b0: 7, perLevel: 2.7, note: 'Ataca de longe. Segure para o tiro carregado.', names: ['Arco de Ipê', 'Arco de Pau-d’Arco', 'Arco do Mateiro'] },
  escudo: { label: 'Escudo', group: 'mao', base: 'defesa', b0: 4, perLevel: 1.6, needs: 'facao', note: 'Permite defender e aparar. Só funciona com facão.', names: ['Escudo de Couro Cru', 'Broquel de Jatobá', 'Escudo do Tropeiro'] },
  aljava: { label: 'Aljava', group: 'mao', base: 'nenhum', b0: 0, perLevel: 0, needs: 'arco', note: '+8% de dano com arco. Só funciona com arco.', names: ['Aljava de Penas', 'Aljava de Couro', 'Aljava do Caçador'] },
  chapeu: { label: 'Chapéu', group: 'cabeca', base: 'defesa', b0: 3, perLevel: 1.2, names: ['Chapéu de Couro', 'Chapéu de Palha', 'Chapéu do Andarilho'] },
  gibao: { label: 'Gibão', group: 'peito', base: 'defesa', b0: 6, perLevel: 2.2, note: 'Armadura média: +3% de crítico.', names: ['Gibão de Couro', 'Gibão do Sertão'] },
  couraca: { label: 'Couraça', group: 'peito', base: 'defesa', b0: 8.4, perLevel: 3.1, note: 'Armadura pesada: mais defesa, esquiva 20% mais curta.', names: ['Couraça de Casca', 'Peitoral de Ferro Velho'] },
  manto: { label: 'Manto', group: 'peito', base: 'defesa', b0: 3.6, perLevel: 1.3, note: 'Armadura leve: +20% de mana e feitiços 10% mais rápidos.', names: ['Manto de Algodão', 'Poncho de Lã'] },
  luvas: { label: 'Luvas', group: 'maos', base: 'defesa', b0: 2, perLevel: 0.9, names: ['Luvas de Vaqueiro', 'Braçadeiras de Cipó'] },
  alpercatas: { label: 'Calçado', group: 'pes', base: 'defesa', b0: 2, perLevel: 0.9, names: ['Alpercatas Ligeiras', 'Botinas de Couro'] },
  anel: { label: 'Anel', group: 'anel', base: 'nenhum', b0: 0, perLevel: 0, names: ['Anel de Tucum', 'Anel de Osso', 'Anel de Cobre'] },
  amuleto: { label: 'Amuleto', group: 'amuleto', base: 'nenhum', b0: 0, perLevel: 0, names: ['Figa de Guiné', 'Patuá', 'Dente de Onça'] },
};

export interface RarityDef { label: string; mult: number; affixes: number; maxPlus: number; color: string }
export const RARITIES: RarityDef[] = [
  { label: 'Comum', mult: 1.0, affixes: 0, maxPlus: 3, color: '#A0A6B4' },
  { label: 'Incomum', mult: 1.1, affixes: 1, maxPlus: 6, color: '#4FC98A' },
  { label: 'Raro', mult: 1.22, affixes: 2, maxPlus: 9, color: '#6AA5FF' },
  { label: 'Épico', mult: 1.36, affixes: 3, maxPlus: 12, color: '#BC8CFF' },
  { label: 'Lendário', mult: 1.52, affixes: 4, maxPlus: 15, color: '#F2B13C' },
  { label: 'Mítico', mult: 1.7, affixes: 4, maxPlus: 15, color: '#FF6B88' },
];
export const MAX_RARITY = RARITIES.length - 1;

export type AffixKey = 'forca' | 'agilidade' | 'inteligencia' | 'vitalidade' | 'espirito' | 'sorte' | 'vida' | 'mana' | 'dano'
  | 'critico' | 'danoCritico' | 'velAtaque' | 'defesa' | 'resNatureza' | 'danoNatureza' | 'recarga' | 'ouro' | 'rouboVida';

interface AffixDef { text: (v: number) => string; min: (l: number) => number; max: (l: number) => number }
const pct = (label: string) => (v: number) => `+${v}% de ${label}`;
const flat = (label: string) => (v: number) => `+${v} de ${label}`;
export const AFFIXES: Record<AffixKey, AffixDef> = {
  forca: { text: flat('Força'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  agilidade: { text: flat('Agilidade'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  inteligencia: { text: flat('Inteligência'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  vitalidade: { text: flat('Vitalidade'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  espirito: { text: flat('Espírito'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  sorte: { text: flat('Sorte'), min: (l) => 1 + Math.floor(l * 0.25), max: (l) => 2 + Math.floor(l * 0.5) },
  vida: { text: flat('vida'), min: (l) => 8 + l * 4, max: (l) => 14 + l * 7 },
  mana: { text: flat('mana'), min: (l) => 4 + l, max: (l) => 8 + l * 2 },
  dano: { text: pct('dano'), min: () => 3, max: () => 8 },
  critico: { text: pct('chance de crítico'), min: () => 2, max: () => 5 },
  danoCritico: { text: pct('dano crítico'), min: () => 8, max: () => 20 },
  velAtaque: { text: pct('velocidade de ataque'), min: () => 3, max: () => 8 },
  defesa: { text: pct('defesa'), min: () => 4, max: () => 10 },
  resNatureza: { text: pct('resistência a Natureza'), min: () => 5, max: () => 15 },
  danoNatureza: { text: pct('dano de Natureza'), min: () => 5, max: () => 12 },
  recarga: { text: (v) => `−${v}% na recarga de feitiços`, min: () => 3, max: () => 8 },
  ouro: { text: pct('ouro'), min: () => 5, max: () => 15 },
  rouboVida: { text: pct('roubo de vida'), min: () => 1, max: () => 3 },
};
export const AFFIX_KEYS = Object.keys(AFFIXES) as AffixKey[];

export interface Affix { k: AffixKey; v: number }

export interface Item {
  id: number;
  type: ItemType;
  name: string;
  /** Nível do item: o nível da fase em que caiu. */
  ilvl: number;
  /** Índice em RARITIES. */
  rarity: number;
  /** Aprimoramento, de 0 ao máximo da raridade. */
  plus: number;
  affixes: Affix[];
  /** Chave em UNIQUES, se for um item com nome. */
  unique?: string;
  locked?: boolean;
  /** Bônus de chance acumulado por falhas de aprimoramento, em pontos percentuais. */
  pity?: number;
}

export interface UniqueDef { name: string; type: ItemType; rarity: number; effect: string; affixes: AffixKey[] }
/** Itens com nome do Capítulo 1. Cada um só cai de uma fase específica. */
export const UNIQUES: Record<string, UniqueDef> = {
  mandibulaDaRainha: { name: 'Mandíbula da Saúva-Rainha', type: 'anel', rarity: 2, effect: 'Seus golpes de arma têm 12% de chance de envenenar.', affixes: ['dano', 'agilidade'] },
  presaDaCaipora: { name: 'Presa da Caipora', type: 'amuleto', rarity: 3, effect: 'Depois de uma esquiva perfeita, +25% de velocidade de ataque por 4 s.', affixes: ['critico', 'velAtaque', 'forca'] },
  coroaDeCipo: { name: 'Coroa de Cipó', type: 'chapeu', rarity: 4, effect: 'Inimigos presos ou lentos por Natureza recebem +30% de dano.', affixes: ['danoNatureza', 'vitalidade', 'recarga', 'vida'] },
};

/** Dano (arma) ou defesa (armadura) do item, já com raridade e aprimoramento. Zero para anéis e amuletos. */
export function baseValue(item: Item): number {
  const t = ITEM_TYPES[item.type];
  if (t.base === 'nenhum') return 0;
  return Math.round((t.b0 + t.perLevel * item.ilvl) * RARITIES[item.rarity].mult * (1 + 0.04 * item.plus) * 10) / 10;
}

export function baseLabel(item: Item): string {
  const t = ITEM_TYPES[item.type];
  const v = String(baseValue(item)).replace('.', ',');
  return t.base === 'dano' ? `${v} de dano` : t.base === 'defesa' ? `${v} de defesa` : '';
}

export function affixText(a: Affix): string {
  return AFFIXES[a.k].text(a.v);
}

export function rollAffix(rng: Rng, ilvl: number, exclude: AffixKey[] = []): Affix {
  const pool = AFFIX_KEYS.filter((k) => !exclude.includes(k));
  const k = pick(rng, pool), d = AFFIXES[k], lo = d.min(ilvl), hi = Math.max(lo, d.max(ilvl));
  return { k, v: lo + Math.floor(rng() * (hi - lo + 1)) };
}

/** Chance de cada raridade nos baús, por capítulo (dificuldade normal). */
export const DROP_TABLE: Record<number, number[]> = {
  1: [70, 25, 5, 0, 0, 0],
  2: [60, 30, 9, 1, 0, 0],
};

/** Sorteia a raridade. Cada ponto de Sorte desloca 0,3 ponto percentual de Comum para as raridades acima. */
export function rollRarity(rng: Rng, chapter: number, luck: number): number {
  const base = DROP_TABLE[chapter] ?? DROP_TABLE[1];
  const shift = Math.min(base[0] - 20, luck * 0.3);
  const table = base.slice();
  table[0] -= shift; table[1] += shift * 0.7; table[2] += shift * 0.25; table[3] += shift * 0.05;
  let x = rng() * 100;
  for (let i = 0; i < table.length; i++) { x -= table[i]; if (x < 0) return i; }
  return 0;
}

const DROP_TYPES: ItemType[] = ['facao', 'arco', 'escudo', 'aljava', 'chapeu', 'gibao', 'couraca', 'manto', 'luvas', 'alpercatas', 'anel', 'amuleto'];

export function makeItem(id: number, rng: Rng, ilvl: number, rarity: number, type?: ItemType): Item {
  const t = type ?? pick(rng, DROP_TYPES), def = ITEM_TYPES[t];
  const affixes: Affix[] = [];
  const n = RARITIES[rarity].affixes + (def.base === 'nenhum' && t !== 'aljava' ? 1 : 0);
  for (let i = 0; i < n; i++) affixes.push(rollAffix(rng, ilvl, affixes.map((a) => a.k)));
  return { id, type: t, name: pick(rng, def.names), ilvl, rarity, plus: 0, affixes };
}

export function makeUnique(id: number, rng: Rng, key: string, ilvl: number): Item {
  const u = UNIQUES[key];
  const affixes = u.affixes.map((k) => { const d = AFFIXES[k], lo = d.min(ilvl), hi = Math.max(lo, d.max(ilvl)); return { k, v: lo + Math.floor(rng() * (hi - lo + 1)) }; });
  return { id, type: u.type, name: u.name, ilvl, rarity: u.rarity, plus: 0, affixes, unique: key };
}

/** Número único para comparar dois itens do mesmo tipo. */
export function itemScore(item: Item): number {
  return Math.round(baseValue(item) * 4 + item.affixes.length * (6 + item.ilvl) + (item.unique ? 20 + item.ilvl * 2 : 0) + item.rarity * 3);
}

export function sellValue(item: Item): number {
  return Math.round((6 + item.ilvl * 4) * (1 + item.rarity * 0.8) * (1 + item.plus * 0.15));
}
