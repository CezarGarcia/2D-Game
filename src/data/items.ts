/**
 * Itens: tipos, raridades, bônus e geração. Segue docs/gdd/04-itens-e-forja.md.
 * Nada aqui guarda estado; as funções recebem e devolvem dados.
 */
import type { ElementId } from './content';
import { pick, type Rng } from './rng';

export type Slot = 'arma' | 'mao' | 'cabeca' | 'peito' | 'maos' | 'pes' | 'anel1' | 'anel2' | 'amuleto';
export const SLOTS: Slot[] = ['arma', 'mao', 'cabeca', 'peito', 'maos', 'pes', 'anel1', 'anel2', 'amuleto'];
export const SLOT_LABEL: Record<Slot, string> = {
  arma: 'Arma', mao: 'Outra mão', cabeca: 'Cabeça', peito: 'Peito', maos: 'Mãos', pes: 'Pés', anel1: 'Anel', anel2: 'Anel', amuleto: 'Amuleto',
};

export type ItemType = 'facao' | 'arco' | 'borduna' | 'peixeiras' | 'zagaia' | 'cajado'
  | 'escudo' | 'aljava' | 'chapeu' | 'gibao' | 'couraca' | 'manto' | 'luvas' | 'alpercatas' | 'anel' | 'amuleto';
export type WeaponKind = 'facao' | 'arco' | 'borduna' | 'peixeiras' | 'zagaia' | 'cajado';
export const WEAPON_KINDS: WeaponKind[] = ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'];
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
  borduna: { label: 'Borduna', group: 'arma', base: 'dano', b0: 12.8, perLevel: 4.8, note: 'Força. Dois golpes lentos e largos. Segure o botão direito para o golpe carregado, que racha a armadura.', names: ['Borduna de Pau-Ferro', 'Tacape Entalhado', 'Borduna do Guerreiro'] },
  peixeiras: { label: 'Peixeiras', group: 'arma', base: 'dano', b0: 4.6, perLevel: 1.7, note: 'Agilidade. Cinco cortes muito rápidos. Depois de uma esquiva perfeita, o próximo golpe é crítico.', names: ['Peixeiras de Feira', 'Par de Peixeiras', 'Peixeiras do Cangaço'] },
  zagaia: { label: 'Zagaia', group: 'arma', base: 'dano', b0: 8.6, perLevel: 3.2, note: 'Força e Agilidade. Alcance longo. Segure o botão direito para uma estocada que atravessa a fila.', names: ['Zagaia de Taquara', 'Lança de Caçador', 'Zagaia de Ferro'] },
  cajado: { label: 'Cajado', group: 'arma', base: 'dano', b0: 6, perLevel: 2.2, note: 'Inteligência. Dispara um orbe com o último elemento usado. Feitiços recarregam 20% mais rápido.', names: ['Cajado de Cabaça', 'Bordão do Pajé', 'Cajado de Aroeira'] },
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
  | 'critico' | 'danoCritico' | 'velAtaque' | 'defesa' | 'resNatureza' | 'danoNatureza' | 'recarga' | 'ouro' | 'rouboVida'
  | 'danoFeitico' | 'resTudo' | 'movimento';

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
  danoFeitico: { text: pct('dano de feitiço'), min: () => 4, max: () => 10 },
  resTudo: { text: pct('resistência a todos os elementos'), min: () => 3, max: () => 8 },
  movimento: { text: pct('velocidade de movimento'), min: () => 2, max: () => 6 },
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
  /** Quantas vezes já foi encantado; o custo dobra a cada vez. */
  enchants?: number;
  /** Gema encaixada (um encaixe por item de arma ou armadura). */
  gem?: Gem;
  /** Chave em SETS, se for peça de conjunto. */
  set?: string;
}

/* ---------- gemas ---------- */

export interface Gem { el: ElementId; lvl: number }
export const GEM_MAX = 6;
/** Na arma: dano extra do elemento (feitiços e golpes) e chance de aplicar o efeito. Na armadura: resistência. */
export const GEM_WEAPON_DAMAGE = [0, 4, 7, 11, 16, 22, 30];
export const GEM_STATUS_CHANCE = [0, 8, 11, 14, 17, 20, 25];
export const GEM_RESIST = [0, 4, 7, 10, 14, 18, 24];
export const GEM_NAMES: Record<ElementId, string> = {
  natureza: 'Esmeralda', agua: 'Água-marinha', tempestade: 'Citrino', fogo: 'Rubi', terra: 'Ágata', sombra: 'Ametista', encanto: 'Quartzo-rosa',
};
export const GEM_LEVEL_NAMES = ['', 'Lasca', 'Pedra', 'Lapidada', 'Brilhante', 'Perfeita', 'Encantada'];
export function gemKey(g: Gem): string { return `${g.el}:${g.lvl}`; }
export function gemName(g: Gem): string { return `${GEM_NAMES[g.el]} ${GEM_LEVEL_NAMES[g.lvl]}`; }
export function canHoldGem(item: Item): boolean { return ITEM_TYPES[item.type].base !== 'nenhum'; }
export function gemText(item: Item): string {
  if (!item.gem) return '';
  const g = item.gem, w = ITEM_TYPES[item.type].group === 'arma';
  return w ? `+${GEM_WEAPON_DAMAGE[g.lvl]}% de dano de ${ELEMENT_LABEL[g.el]}, ${GEM_STATUS_CHANCE[g.lvl]}% de chance de aplicar o efeito` : `+${GEM_RESIST[g.lvl]}% de resistência a ${ELEMENT_LABEL[g.el]}`;
}
const ELEMENT_LABEL: Record<ElementId, string> = { natureza: 'Natureza', agua: 'Água', tempestade: 'Tempestade', fogo: 'Fogo', terra: 'Terra', sombra: 'Sombra', encanto: 'Encanto' };

/* ---------- conjuntos ---------- */

export interface SetDef {
  key: string; name: string;
  /** Capítulo em que cai (0 = Torre). */
  chapter: number;
  pieces: ItemType[];
  bonus: [string, string, string];
}
/** Seis peças cada; bônus com 2, 4 e 6 peças equipadas. Os efeitos estão em src/meta/stats.ts. */
export const SETS: Record<string, SetDef> = {
  mateiro: { key: 'mateiro', name: 'Mateiro', chapter: 1, pieces: ['chapeu', 'gibao', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+8% de vida', 'Veneno dura 50% mais e causa 25% mais dano', 'Esquiva perfeita solta espinhos em volta'] },
  ribeirinho: { key: 'ribeirinho', name: 'Ribeirinho', chapter: 2, pieces: ['chapeu', 'manto', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+12% de mana', 'Inimigos Molhados recebem 15% mais dano', 'Esquiva perfeita molha todos em volta e cura 5% da vida'] },
  vaqueiro: { key: 'vaqueiro', name: 'Vaqueiro', chapter: 3, pieces: ['chapeu', 'gibao', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+10% de velocidade de movimento', 'A esquiva deixa poeira que cega quem estiver nela', 'Esquiva perfeita solta um redemoinho'] },
  tropeiro: { key: 'tropeiro', name: 'Tropeiro', chapter: 4, pieces: ['chapeu', 'couraca', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+8% de dano', 'Golpes críticos deixam Queimando', 'Inimigos Queimando explodem ao cair'] },
  seringueiro: { key: 'seringueiro', name: 'Seringueiro', chapter: 5, pieces: ['chapeu', 'couraca', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+12% de defesa', '+25% de dano contra blindados', 'A cada 10 golpes, o chão treme em volta de você'] },
  lunar: { key: 'lunar', name: 'Peão da Lua', chapter: 6, pieces: ['chapeu', 'gibao', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+6% de velocidade de ataque', 'Derrotar um inimigo cura 2% da vida', 'A cada 20 s de luta, 5 s de fúria: +40% de dano e roubo de vida'] },
  benzedeira: { key: 'benzedeira', name: 'Benzedeira', chapter: 7, pieces: ['chapeu', 'manto', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+10% de dano de feitiço', 'Efeitos de elemento duram o dobro', 'Reações causam 60% mais dano e adiantam 1 s as recargas'] },
  lembranca: { key: 'lembranca', name: 'Lembrança', chapter: 8, pieces: ['chapeu', 'manto', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+4 em todos os atributos', '+15% de resistência a todos os elementos', 'O Supremo carrega duas vezes mais rápido'] },
  andarilho: { key: 'andarilho', name: 'Andarilho da Torre', chapter: 0, pieces: ['chapeu', 'gibao', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+10% de ouro', '+15% de experiência', 'O altar oferece uma bênção a mais'] },
  sentinela: { key: 'sentinela', name: 'Sentinela da Torre', chapter: 0, pieces: ['chapeu', 'couraca', 'luvas', 'alpercatas', 'anel', 'amuleto'], bonus: ['+10% de vida', '+10% de defesa', 'O primeiro golpe de cada sala não causa dano'] },
};
export function setsOfChapter(chapter: number): SetDef[] { return Object.values(SETS).filter((x) => x.chapter === chapter); }

export function makeSetItem(id: number, rng: Rng, setKey: string, ilvl: number, rarity: number): Item {
  const def = SETS[setKey], type = pick(rng, def.pieces), it = makeItem(id, rng, ilvl, Math.max(2, rarity), type);
  const part: Record<string, string> = { chapeu: 'Chapéu', gibao: 'Gibão', couraca: 'Couraça', manto: 'Manto', luvas: 'Luvas', alpercatas: 'Botas', anel: 'Anel', amuleto: 'Amuleto' };
  it.name = `${part[type] ?? ITEM_TYPES[type].label} do ${def.name}`.replace('do Peão', 'do Peão').replace('do Benzedeira', 'da Benzedeira').replace('do Sentinela', 'da Sentinela').replace('do Lembrança', 'da Lembrança').replace('do Andarilho da Torre', 'do Andarilho');
  it.set = setKey;
  return it;
}

export interface UniqueDef { name: string; type: ItemType; rarity: number; effect: string; affixes: AffixKey[] }
/** Itens com nome. Cada um só cai de uma fase específica. Os efeitos estão em src/meta/stats.ts e na simulação. */
export const UNIQUES: Record<string, UniqueDef> = {
  mandibulaDaRainha: { name: 'Mandíbula da Saúva-Rainha', type: 'anel', rarity: 2, effect: 'Seus golpes de arma têm 12% de chance de envenenar.', affixes: ['dano', 'agilidade'] },
  presaDaCaipora: { name: 'Presa da Caipora', type: 'amuleto', rarity: 3, effect: 'Depois de uma esquiva perfeita, +25% de velocidade de ataque por 4 s.', affixes: ['critico', 'velAtaque', 'forca'] },
  coroaDeCipo: { name: 'Coroa de Cipó', type: 'chapeu', rarity: 4, effect: 'Inimigos presos ou lentos por Natureza recebem +30% de dano.', affixes: ['danoNatureza', 'vitalidade', 'recarga', 'vida'] },
  ferraoDeArraia: { name: 'Ferrão de Arraia', type: 'facao', rarity: 3, effect: 'Seus golpes de arma têm 15% de chance de prender o inimigo por 1 s.', affixes: ['dano', 'critico', 'agilidade'] },
  denteDoBoto: { name: 'Dente do Boto', type: 'anel', rarity: 3, effect: 'Seus golpes críticos deixam o inimigo Molhado.', affixes: ['critico', 'danoCritico', 'sorte'] },
  escamaDaIara: { name: 'Escama da Iara', type: 'amuleto', rarity: 4, effect: 'Poças e correnteza não te atrapalham, e você anda 12% mais rápido.', affixes: ['vida', 'espirito', 'recarga', 'resNatureza'] },
  maoDoCorpoSeco: { name: 'Mão do Corpo-Seco', type: 'luvas', rarity: 3, effect: 'Com menos de metade da vida, o roubo de vida dobra e ganha +5%.', affixes: ['rouboVida', 'forca', 'vida'] },
  alpercatasDoRedemoinho: { name: 'Alpercatas do Redemoinho', type: 'alpercatas', rarity: 4, effect: 'A esquiva vira um redemoinho que puxa e fere os inimigos em volta.', affixes: ['movimento', 'agilidade', 'critico', 'vida'] },
  cachimboDoSaci: { name: 'Cachimbo do Saci', type: 'amuleto', rarity: 4, effect: 'Feitiços de Tempestade têm 25% de chance de não entrar em recarga.', affixes: ['danoFeitico', 'inteligencia', 'recarga', 'espirito'] },
  crinaDaMula: { name: 'Crina da Mula', type: 'anel', rarity: 3, effect: 'A esquiva deixa um rastro de fogo no chão.', affixes: ['dano', 'movimento', 'forca'] },
  olhoDoBoitata: { name: 'Olho do Boitatá', type: 'chapeu', rarity: 4, effect: 'Feitiços de Fogo causam +30% de dano, e quem cai queimando passa o fogo adiante.', affixes: ['danoFeitico', 'inteligencia', 'vida', 'resTudo'] },
  couroDoCapelobo: { name: 'Couro do Capelobo', type: 'couraca', rarity: 3, effect: 'Elites e chefões causam 20% menos dano a você.', affixes: ['defesa', 'vitalidade', 'vida'] },
  garraDoMapinguari: { name: 'Garra do Mapinguari', type: 'borduna', rarity: 4, effect: 'O golpe carregado atordoa por 1 s e deixa Rachado por 8 s.', affixes: ['dano', 'forca', 'danoCritico', 'vida'] },
  pedraDaTeiniagua: { name: 'Pedra da Teiniaguá', type: 'anel', rarity: 3, effect: 'Golpes críticos deixam Amaldiçoado.', affixes: ['critico', 'sorte', 'danoCritico'] },
  denteDoLobisomem: { name: 'Dente do Lobisomem', type: 'peixeiras', rarity: 4, effect: 'Com menos de metade da vida: +30% de velocidade de ataque e 5% de roubo de vida.', affixes: ['velAtaque', 'agilidade', 'critico', 'dano'] },
  toucaDaPisadeira: { name: 'Touca da Pisadeira', type: 'chapeu', rarity: 3, effect: 'Inimigos dormindo, atordoados ou presos recebem +40% de dano.', affixes: ['danoFeitico', 'espirito', 'vida'] },
  colherDaCuca: { name: 'Colher da Cuca', type: 'cajado', rarity: 4, effect: 'Cada poção bebida solta uma Poção Borbulhante em volta de você.', affixes: ['danoFeitico', 'inteligencia', 'recarga', 'mana'] },
  ecoDosSete: { name: 'Eco dos Sete', type: 'amuleto', rarity: 4, effect: '+1 nível em todos os feitiços.', affixes: ['danoFeitico', 'resTudo', 'espirito', 'vida'] },
  fioDoEsquecimento: { name: 'Fio do Esquecimento', type: 'zagaia', rarity: 5, effect: '30% de chance de um feitiço não gastar mana nem entrar em recarga.', affixes: ['dano', 'danoFeitico', 'critico', 'resTudo'] },
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
  2: [58, 30, 10, 2, 0, 0],
  3: [52, 33, 12.5, 2.3, 0.2, 0],
  4: [45, 35, 16, 3.6, 0.4, 0],
  5: [39, 35.5, 19, 5.5, 1, 0],
  6: [33, 36, 22, 7.5, 1.5, 0],
  7: [29, 35.5, 24.5, 9.2, 1.8, 0],
  8: [25, 35, 27, 11, 2, 0],
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

const DROP_TYPES: ItemType[] = ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado', 'escudo', 'aljava', 'chapeu', 'gibao', 'couraca', 'manto', 'luvas', 'alpercatas', 'anel', 'amuleto'];

/** Armas que o jogador ainda não viu caem só a partir do capítulo em que aparecem. */
export const WEAPON_FROM: Record<WeaponKind, number> = { facao: 1, arco: 1, borduna: 3, peixeiras: 3, zagaia: 4, cajado: 4 };

export function makeItem(id: number, rng: Rng, ilvl: number, rarity: number, type?: ItemType, chapter = 8): Item {
  const pool = DROP_TYPES.filter((x) => !(x in WEAPON_FROM) || WEAPON_FROM[x as WeaponKind] <= chapter);
  const t = type ?? pick(rng, pool), def = ITEM_TYPES[t];
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
  return Math.round(baseValue(item) * 4 + item.affixes.length * (6 + item.ilvl) + (item.unique ? 20 + item.ilvl * 2 : 0) + (item.set ? 10 + item.ilvl : 0) + (item.gem ? item.gem.lvl * 6 : 0) + item.rarity * 3);
}

export function sellValue(item: Item): number {
  return Math.round((6 + item.ilvl * 4) * (1 + item.rarity * 0.8) * (1 + item.plus * 0.15));
}
