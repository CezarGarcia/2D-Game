/**
 * Perfil do jogador: tudo o que é salvo entre partidas, e as operações que o alteram
 * (subir de nível, distribuir pontos, equipar, forjar). As funções alteram o perfil recebido;
 * quem chama decide quando salvar.
 */
import { MAX_POTIONS, SPELLS, SPELL_ORDER, type CompanionId, type SpellId } from '../data/content';
import {
  ITEM_TYPES, MAX_RARITY, RARITIES, makeItem, rollAffix, sellValue, type Item, type ItemType, type Slot, SLOTS,
} from '../data/items';
import { MAX_LEVEL_CAMPAIGN, xpNeeded } from '../data/progression';
import { makeRng, type Rng } from '../data/rng';
import { canAddTalent, canRemoveTalent, talentSpent, type TalentRanks } from '../data/talents';

export type AttrKey = 'forca' | 'agilidade' | 'inteligencia' | 'vitalidade' | 'espirito' | 'sorte';
export const ATTRS: { key: AttrKey; label: string; desc: string }[] = [
  { key: 'forca', label: 'Força', desc: '+1,2% de dano com facão por ponto' },
  { key: 'agilidade', label: 'Agilidade', desc: '+1,2% de dano com arco, +0,4% de velocidade de ataque e +0,15% de crítico por ponto' },
  { key: 'inteligencia', label: 'Inteligência', desc: '+1,2% de dano de feitiço por ponto' },
  { key: 'vitalidade', label: 'Vitalidade', desc: '+12 de vida e +0,2 de defesa por ponto' },
  { key: 'espirito', label: 'Espírito', desc: '+3 de mana e −0,5% na recarga de feitiços por ponto (limite de 40%)' },
  { key: 'sorte', label: 'Sorte', desc: 'Mais chance de raridade alta nos baús e +0,2% de ouro por ponto' },
];
export const ATTR_BASE = 5;
export const ATTR_PER_LEVEL = 3;
export const INVENTORY_SIZE = 40;
/** Até este nível, redistribuir atributos e talentos é grátis. */
export const FREE_RESPEC_LEVEL = 15;

export interface StageRecord {
  cleared: boolean;
  stars: [boolean, boolean, boolean];
  bestTime: number | null;
  /** Pontos percentuais somados à chance do item com nome, por tentativas sem sucesso. */
  pity: number;
  clears: number;
}

export interface Materials { mata: number; po: number; lagrima: number }
export const MATERIAL_LABEL: Record<keyof Materials, string> = { mata: 'Resina da Mata', po: 'Pó de Assombro', lagrima: 'Lágrima de Encantado' };

export interface Profile {
  version: 1;
  level: number; xp: number; gold: number;
  /** Pontos distribuídos em cada atributo (sem contar a base). */
  attrs: Record<AttrKey, number>;
  attrPoints: number;
  talents: TalentRanks;
  /** Total de pontos de talento já ganhos. */
  talentPoints: number;
  inventory: Item[];
  equipped: Partial<Record<Slot, Item>>;
  materials: Materials;
  loadout: (SpellId | null)[];
  companions: Partial<Record<CompanionId, { level: number }>>;
  companion: CompanionId | null;
  potions: number;
  stages: Record<string, StageRecord>;
  /** Baús de estrelas do capítulo já abertos (0 a 3). */
  starChests: number;
  curupiraFreed: boolean;
  nextItemId: number;
  seed: number;
}

const SAVE_KEY = 'encantados.save.v1';

export function newProfile(seed = (Date.now() & 0x7fffffff) | 1): Profile {
  const p: Profile = {
    version: 1, level: 1, xp: 0, gold: 40,
    attrs: { forca: 0, agilidade: 0, inteligencia: 0, vitalidade: 0, espirito: 0, sorte: 0 }, attrPoints: 0,
    talents: {}, talentPoints: 0,
    inventory: [], equipped: {},
    materials: { mata: 0, po: 0, lagrima: 0 },
    loadout: ['dardo', null, null],
    companions: {}, companion: null, potions: MAX_POTIONS,
    stages: {}, starChests: 0, curupiraFreed: false,
    nextItemId: 1, seed,
  };
  const start: [ItemType, string][] = [['facao', 'Facão de Mato'], ['gibao', 'Gibão de Couro'], ['chapeu', 'Chapéu de Couro']];
  for (const [type, name] of start) {
    const it = makeItem(p.nextItemId++, makeRng(1), 1, 0, type);
    it.name = name;
    p.equipped[ITEM_TYPES[type].group as Slot] = it;
  }
  return p;
}

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Profile;
      if (p && p.version === 1 && typeof p.level === 'number') return { ...newProfile(p.seed), ...p };
    }
  } catch { /* sem armazenamento ou save corrompido: começa do zero */ }
  return newProfile();
}

export function saveProfile(p: Profile): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); return true; } catch { return false; }
}

export function wipeSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* nada a apagar */ }
}

/** Sorteio ligado ao perfil: avança a semente, para o resultado não se repetir ao recarregar. */
export function profileRng(p: Profile): Rng {
  const rng = makeRng(p.seed);
  return () => { const v = rng(); p.seed = (p.seed * 1103515245 + 12345) & 0x7fffffff; return v; };
}

/* ---------- nível e feitiços ---------- */

export function knownSpells(p: Profile): SpellId[] {
  return SPELL_ORDER.filter((id) => SPELLS[id].unlock <= p.level);
}

export function addXp(p: Profile, amount: number): { levels: number; spells: SpellId[] } {
  const before = knownSpells(p);
  let levels = 0;
  p.xp += Math.max(0, Math.round(amount));
  while (p.level < MAX_LEVEL_CAMPAIGN && p.xp >= xpNeeded(p.level)) {
    p.xp -= xpNeeded(p.level);
    p.level++; levels++;
    p.attrPoints += ATTR_PER_LEVEL;
    p.talentPoints += 1;
  }
  const spells = knownSpells(p).filter((s) => !before.includes(s));
  for (const s of spells) { const free = p.loadout.indexOf(null); if (free >= 0 && !p.loadout.includes(s)) p.loadout[free] = s; }
  return { levels, spells };
}

export function setLoadout(p: Profile, index: number, spell: SpellId | null): boolean {
  if (index < 0 || index > 2) return false;
  if (spell && !knownSpells(p).includes(spell)) return false;
  const other = spell ? p.loadout.indexOf(spell) : -1;
  if (other >= 0 && other !== index) p.loadout[other] = p.loadout[index];
  p.loadout[index] = spell;
  return true;
}

export function setCompanion(p: Profile, id: CompanionId | null): boolean {
  if (id && !p.companions[id]) return false;
  p.companion = id;
  return true;
}

/* ---------- atributos e talentos ---------- */

export function allocAttr(p: Profile, key: AttrKey, n = 1): boolean {
  if (p.attrPoints < n || n < 1) return false;
  p.attrs[key] += n; p.attrPoints -= n;
  return true;
}

export function respecCost(p: Profile): number {
  return p.level <= FREE_RESPEC_LEVEL ? 0 : 50 * p.level;
}

export function resetAttrs(p: Profile): boolean {
  const cost = respecCost(p);
  if (p.gold < cost) return false;
  p.gold -= cost;
  let back = 0;
  for (const a of ATTRS) { back += p.attrs[a.key]; p.attrs[a.key] = 0; }
  p.attrPoints += back;
  return true;
}

export function talentFree(p: Profile): number {
  return p.talentPoints - talentSpent(p.talents);
}

export function addTalent(p: Profile, id: string): boolean {
  if (!canAddTalent(p.talents, id, talentFree(p))) return false;
  p.talents[id] = (p.talents[id] || 0) + 1;
  return true;
}

export function removeTalent(p: Profile, id: string): boolean {
  if (!canRemoveTalent(p.talents, id)) return false;
  p.talents[id]--;
  if (p.talents[id] <= 0) delete p.talents[id];
  return true;
}

export function resetTalents(p: Profile): boolean {
  const cost = respecCost(p);
  if (p.gold < cost) return false;
  p.gold -= cost;
  p.talents = {};
  return true;
}

/* ---------- inventário ---------- */

export function slotsFor(type: ItemType): Slot[] {
  const g = ITEM_TYPES[type].group;
  return g === 'anel' ? ['anel1', 'anel2'] : [g as Slot];
}

export function findItem(p: Profile, id: number): { item: Item; slot: Slot | null } | null {
  const inv = p.inventory.find((i) => i.id === id);
  if (inv) return { item: inv, slot: null };
  for (const s of SLOTS) { const it = p.equipped[s]; if (it && it.id === id) return { item: it, slot: s }; }
  return null;
}

export function inventoryFull(p: Profile): boolean {
  return p.inventory.length >= INVENTORY_SIZE;
}

/** Coloca o item na mochila. Devolve false se não couber. */
export function addItem(p: Profile, item: Item): boolean {
  if (inventoryFull(p)) return false;
  p.inventory.push(item);
  return true;
}

/** Equipa um item da mochila. O que estava no espaço volta para a mochila. */
export function equip(p: Profile, id: number, slot?: Slot): boolean {
  const idx = p.inventory.findIndex((i) => i.id === id);
  if (idx < 0) return false;
  const item = p.inventory[idx], options = slotsFor(item.type);
  const target = slot && options.includes(slot) ? slot : options.find((s) => !p.equipped[s]) ?? options[0];
  const old = p.equipped[target];
  p.inventory.splice(idx, 1);
  if (old) p.inventory.push(old);
  p.equipped[target] = item;
  return true;
}

export function unequip(p: Profile, slot: Slot): boolean {
  const it = p.equipped[slot];
  if (!it || inventoryFull(p) || slot === 'arma') return false;
  delete p.equipped[slot];
  p.inventory.push(it);
  return true;
}

/** Aviso quando o item equipado na outra mão não combina com a arma. */
export function offhandWarning(p: Profile): string | null {
  const off = p.equipped.mao, weapon = p.equipped.arma;
  if (!off) return null;
  const needs = ITEM_TYPES[off.type].needs;
  return needs && (!weapon || weapon.type !== needs) ? `${ITEM_TYPES[off.type].label} só funciona com ${ITEM_TYPES[needs].label.toLowerCase()}.` : null;
}

export function sellItem(p: Profile, id: number): number {
  const idx = p.inventory.findIndex((i) => i.id === id);
  if (idx < 0 || p.inventory[idx].locked) return 0;
  const v = sellValue(p.inventory[idx]);
  p.inventory.splice(idx, 1);
  p.gold += v;
  return v;
}

export function dismantleYield(item: Item): Materials {
  return { mata: 1 + item.rarity + Math.floor(item.ilvl / 4) + Math.floor(item.plus / 2), po: item.rarity, lagrima: 0 };
}

export function dismantleItem(p: Profile, id: number): Materials | null {
  const idx = p.inventory.findIndex((i) => i.id === id);
  if (idx < 0 || p.inventory[idx].locked) return null;
  const y = dismantleYield(p.inventory[idx]);
  p.inventory.splice(idx, 1);
  p.materials.mata += y.mata; p.materials.po += y.po;
  return y;
}

export function toggleLock(p: Profile, id: number): boolean {
  const f = findItem(p, id);
  if (!f) return false;
  f.item.locked = !f.item.locked;
  return true;
}

/* ---------- ferreiro ---------- */

export interface UpgradeInfo { possible: boolean; reason?: string; gold: number; mata: number; chance: number }

export function upgradeInfo(p: Profile, item: Item): UpgradeInfo {
  const max = RARITIES[item.rarity].maxPlus;
  const gold = 20 + 12 * item.ilvl * (item.plus + 1), mata = 2 + item.plus;
  const base = item.plus < 5 ? 1 : Math.max(0.3, 1 - (item.plus - 4) * 0.07);
  const chance = Math.min(1, base + (item.pity ?? 0) / 100);
  if (item.plus >= max) return { possible: false, reason: `${RARITIES[item.rarity].label} vai só até +${max}. Suba a raridade para continuar.`, gold, mata, chance };
  if (p.gold < gold) return { possible: false, reason: 'Falta ouro.', gold, mata, chance };
  if (p.materials.mata < mata) return { possible: false, reason: `Falta ${MATERIAL_LABEL.mata}.`, gold, mata, chance };
  return { possible: true, gold, mata, chance };
}

/** Aprimora o item. Falhar gasta o custo, nunca destrói, e soma 5 pontos à próxima chance. */
export function upgradeItem(p: Profile, id: number, rng: Rng = profileRng(p)): { done: boolean; success: boolean; reason?: string } {
  const f = findItem(p, id);
  if (!f) return { done: false, success: false, reason: 'Item não encontrado.' };
  const info = upgradeInfo(p, f.item);
  if (!info.possible) return { done: false, success: false, reason: info.reason };
  p.gold -= info.gold; p.materials.mata -= info.mata;
  if (rng() < info.chance) { f.item.plus++; f.item.pity = 0; return { done: true, success: true }; }
  f.item.pity = (f.item.pity ?? 0) + 5;
  return { done: true, success: false };
}

export const FUSE_CHANCE = [1, 0.9, 0.75, 0.5, 0.25];

export interface FuseInfo { possible: boolean; reason?: string; gold: number; chance: number; lagrima: number }

export function fuseInfo(p: Profile, mainId: number, fodderIds: number[]): FuseInfo {
  const main = findItem(p, mainId);
  const none: FuseInfo = { possible: false, gold: 0, chance: 0, lagrima: 0 };
  if (!main) return { ...none, reason: 'Escolha o item principal.' };
  const m = main.item;
  if (m.rarity >= MAX_RARITY) return { ...none, reason: 'Já está na raridade máxima.' };
  const gold = Math.round(40 * (m.rarity + 1) * (1 + m.ilvl * 0.25)), chance = FUSE_CHANCE[m.rarity], lagrima = m.rarity + 1 === MAX_RARITY ? 1 : 0;
  const info: FuseInfo = { possible: false, gold, chance, lagrima };
  if (m.unique) return { ...info, reason: 'Itens com nome não podem ser fundidos.' };
  if (fodderIds.length !== 2 || fodderIds[0] === fodderIds[1] || fodderIds.includes(mainId)) return { ...info, reason: 'Escolha 2 outros itens para consumir.' };
  for (const id of fodderIds) {
    const it = p.inventory.find((i) => i.id === id);
    if (!it) return { ...info, reason: 'Os itens consumidos precisam estar na mochila.' };
    if (it.locked) return { ...info, reason: 'Um dos itens está travado.' };
    if (it.rarity !== m.rarity) return { ...info, reason: `Os três precisam ser ${RARITIES[m.rarity].label}.` };
    if (ITEM_TYPES[it.type].group !== ITEM_TYPES[m.type].group) return { ...info, reason: 'Os três precisam ser do mesmo espaço de equipamento.' };
  }
  if (p.gold < gold) return { ...info, reason: 'Falta ouro.' };
  if (p.materials.lagrima < lagrima) return { ...info, reason: `Falta ${MATERIAL_LABEL.lagrima}.` };
  return { ...info, possible: true };
}

/** Funde 3 itens. Sucesso: o principal sobe uma raridade e ganha um bônus. Falha: perde só um dos consumidos. */
export function fuseItems(p: Profile, mainId: number, fodderIds: number[], rng: Rng = profileRng(p)): { done: boolean; success: boolean; reason?: string } {
  const info = fuseInfo(p, mainId, fodderIds);
  if (!info.possible) return { done: false, success: false, reason: info.reason };
  const m = findItem(p, mainId)!.item;
  p.gold -= info.gold; p.materials.lagrima -= info.lagrima;
  if (rng() < info.chance) {
    p.inventory = p.inventory.filter((i) => !fodderIds.includes(i.id));
    m.rarity++;
    m.affixes.push(rollAffix(rng, m.ilvl, m.affixes.map((a) => a.k)));
    return { done: true, success: true };
  }
  p.inventory = p.inventory.filter((i) => i.id !== fodderIds[0]);
  return { done: true, success: false };
}

export function refillPotions(p: Profile): void {
  p.potions = MAX_POTIONS;
}
