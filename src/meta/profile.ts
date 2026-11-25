/**
 * Perfil do jogador: tudo o que é salvo entre partidas, e as operações que o alteram
 * (subir de nível, distribuir pontos, equipar, forjar). As funções alteram o perfil recebido;
 * quem chama decide quando salvar.
 */
import { MAX_POTIONS, MAX_SPELL_LEVEL, SPELLS, SPELL_ORDER, type CompanionId, type ElementId, type SpellId } from '../data/content';
import {
  AFFIXES, GEM_MAX, ITEM_TYPES, MAX_RARITY, RARITIES, canHoldGem, gemKey, makeItem, rollAffix, sellValue, type Gem, type Item, type ItemType, type Slot, SLOTS,
} from '../data/items';
import { MAX_LEVEL_CAMPAIGN, xpNeeded } from '../data/progression';
import { makeRng, type Rng } from '../data/rng';
import { canAddTalent, canRemoveTalent, talentSpent, talentsConnected, type TalentRanks } from '../data/talents';

export type AttrKey = 'forca' | 'agilidade' | 'inteligencia' | 'vitalidade' | 'espirito' | 'sorte';
export const ATTRS: { key: AttrKey; label: string; desc: string; perPoint: string }[] = [
  { key: 'forca', label: 'Força', desc: 'Faz o facão bater mais forte.', perPoint: '+1,2% de dano com facão' },
  { key: 'agilidade', label: 'Agilidade', desc: 'Faz o arco bater mais forte, os golpes saírem mais rápido e os críticos acontecerem mais.', perPoint: '+1,2% de dano com arco, +0,4% de velocidade de ataque, +0,15% de crítico' },
  { key: 'inteligencia', label: 'Inteligência', desc: 'Faz os feitiços causarem mais dano e curarem mais.', perPoint: '+1,2% de poder dos feitiços' },
  { key: 'vitalidade', label: 'Vitalidade', desc: 'Dá mais vida e um pouco de defesa. É o que te mantém de pé.', perPoint: '+12 de vida, +0,2 de defesa' },
  { key: 'espirito', label: 'Espírito', desc: 'Dá mais mana para lançar feitiços e faz eles recarregarem mais rápido.', perPoint: '+3 de mana, feitiços 0,5% mais rápidos' },
  { key: 'sorte', label: 'Sorte', desc: 'Faz os baús darem itens mais raros e rende mais ouro.', perPoint: '+0,3% de chance de raridade maior, +0,2% de ouro' },
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

export interface Materials { mata: number; po: number; lagrima: number; tomo: number }
export const MATERIAL_LABEL: Record<keyof Materials, string> = { mata: 'Resina', po: 'Pó de Assombro', lagrima: 'Lágrima de Encantado', tomo: 'Tomo' };
/** Para que serve cada material, em uma linha. */
export const MATERIAL_USE: Record<keyof Materials, string> = {
  mata: 'Aprimora e reforja itens. Vem das fases e de desmontar itens.',
  po: 'Encanta itens: troca um bônus por outro. Vem de desmontar itens raros.',
  lagrima: 'Funde itens até Mítico. Só os chefões dão.',
  tomo: 'Sobe o nível dos feitiços. Vem de elites e chefões.',
};

/** Contadores de longo prazo: alimentam as conquistas, o Almanaque e o bônus de conhecer o inimigo. */
export interface LifeStats {
  /** Monstros derrotados, por tipo. */
  kills: Record<string, number>;
  elites: number; champions: number; bosses: number;
  /** Partidas (fase, Torre ou expedição), vitórias, vitórias sem cair e quedas. */
  runs: number; wins: number; flawless: number; deaths: number;
  /** Vitórias por tipo de arma. */
  winsBy: Record<string, number>;
  perfects: number; parries: number;
  casts: number; castsBy: Record<string, number>; reactions: number; supremos: number; potions: number;
  /** Baús abertos, potes quebrados e Mães-do-Ouro alcançadas. */
  chests: number; pots: number; wisps: number;
  /** Vezes que cada bênção foi escolhida. */
  blessings: Record<string, number>;
  towerFloors: number; expeditions: number; forges: number;
  /** Fases vencidas pela Caçada automática. */
  autoWins: number;
  /** Maior golpe já dado e segundos de combate. */
  maxHit: number; seconds: number;
  /** Ouro ganho em toda a jornada. */
  gold: number;
}

export function newLife(): LifeStats {
  return {
    kills: {}, elites: 0, champions: 0, bosses: 0, runs: 0, wins: 0, flawless: 0, deaths: 0, winsBy: {},
    perfects: 0, parries: 0, casts: 0, castsBy: {}, reactions: 0, supremos: 0, potions: 0, chests: 0, pots: 0, wisps: 0, blessings: {},
    towerFloors: 0, expeditions: 0, forges: 0, autoWins: 0, maxHit: 0, seconds: 0, gold: 0,
  };
}

/** Filtro de saque: o que é desmontado sozinho ao sair de uma fase. */
export interface LootFilter {
  /** Raridade mais alta desmontada na hora (−1 = desligado; 0 = Comum; 1 = Incomum; 2 = Raro). */
  dismantle: number;
}

/** Uma build salva: o que o herói veste e como distribuiu os pontos. */
export interface Build {
  name: string;
  /** Identificador do item em cada espaço. */
  equipped: Partial<Record<Slot, number>>;
  attrs: Record<AttrKey, number>;
  talents: TalentRanks;
  loadout: (SpellId | null)[];
  supremo: ElementId | null;
  companion: CompanionId | null;
}
export const BUILD_SLOTS = 3;

/** Versão atual do perfil salvo. Cada mudança de formato ganha um passo em `STEPS`. */
export const PROFILE_VERSION = 2;

export interface Profile {
  version: number;
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
  /** Nível de cada feitiço (1 se não estiver aqui). */
  spellLevels: Partial<Record<SpellId, number>>;
  /** Encantados libertados, que podem ser chamados como Supremo. */
  supremos: ElementId[];
  supremo: ElementId | null;
  companions: Partial<Record<CompanionId, { level: number }>>;
  companion: CompanionId | null;
  potions: number;
  stages: Record<string, StageRecord>;
  /** Baús de estrelas já abertos. */
  starChests: number;
  curupiraFreed: boolean;
  /** Gemas guardadas, por `elemento:nível`. */
  gems: Record<string, number>;
  tower: TowerRecord;
  /** Já viu o final (venceu o Esquecimento). */
  credits: boolean;
  /** Missões do dia, descanso e expedições (src/meta/daily.ts). */
  daily: DailyRecord;
  nextItemId: number;
  seed: number;
  /** Contadores de longo prazo (src/meta/life.ts). */
  life: LifeStats;
  /** Conquistas alcançadas: o dia em que veio e se o prêmio já foi pego (src/meta/achievements.ts). */
  achievements: Record<string, { day: string; claimed: boolean }>;
  /** Itens com nome já encontrados, para o Almanaque (continuam lá depois de vendidos). */
  uniquesFound: string[];
  lootFilter: LootFilter;
  builds: (Build | null)[];
}

export interface MissionState {
  kind: string;
  /** Elemento, capítulo, tipo de arma ou limite de golpes, conforme a missão. */
  param?: string | number;
  target: number;
  progress: number;
  claimed: boolean;
  reward: { gold: number; mata: number; po: number; tomo: number };
}

export interface DailyRecord {
  /** Dia (AAAA-MM-DD, hora local) das missões e expedições guardadas. */
  day: string;
  /** Semente fixa do sorteio diário (a do perfil muda a cada sorteio). */
  seed: number;
  missions: MissionState[];
  /** Baú das três missões já aberto hoje. */
  chest: boolean;
  /** Expedições de hoje (identificadores) e o que já pagou. */
  expeditions: string[];
  expRuns: number;
  expFirst: number[];
  /** Último dia em que o jogador apareceu, para o descanso. */
  lastSeen: string;
  /** XP de descanso guardado: dobra a experiência até acabar. */
  rest: number;
  /** Dias fora na última volta (só para avisar). */
  restDays: number;
  /** Trocas de missão já usadas hoje. */
  rerolls: number;
}

export interface TowerRecord {
  /** Andar mais alto já vencido. */
  best: number;
  /** Próximo andar de partida (sempre 1 + múltiplo de 10). */
  checkpoint: number;
  /** Semana (ano-semana) e o melhor andar dela, para o ranking semanal. */
  week: string; weekBest: number; weekTime: number;
}

const SAVE_KEY = 'encantados.save.v1';

export function newProfile(seed = (Date.now() & 0x7fffffff) | 1): Profile {
  const p: Profile = {
    version: PROFILE_VERSION, level: 1, xp: 0, gold: 40,
    attrs: { forca: 0, agilidade: 0, inteligencia: 0, vitalidade: 0, espirito: 0, sorte: 0 }, attrPoints: 0,
    talents: {}, talentPoints: 0,
    inventory: [], equipped: {},
    materials: { mata: 0, po: 0, lagrima: 0, tomo: 0 },
    loadout: ['dardo', null, null],
    spellLevels: {}, supremos: [], supremo: null,
    companions: {}, companion: null, potions: MAX_POTIONS,
    stages: {}, starChests: 0, curupiraFreed: false,
    gems: {}, tower: { best: 0, checkpoint: 1, week: '', weekBest: 0, weekTime: 0 }, credits: false,
    daily: { day: '', seed: Math.imul(seed, 2654435761) >>> 0 || 1, missions: [], chest: false, expeditions: [], expRuns: 0, expFirst: [], lastSeen: '', rest: 0, restDays: 0, rerolls: 0 },
    nextItemId: 1, seed,
    life: newLife(), achievements: {}, uniquesFound: [], lootFilter: { dismantle: -1 }, builds: [null, null, null],
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
      if (p && typeof p.version === 'number' && p.version >= 1 && p.version <= PROFILE_VERSION && typeof p.level === 'number') return migrate(p);
    }
  } catch { /* sem armazenamento ou save corrompido: começa do zero */ }
  return newProfile();
}

/**
 * Passos de migração, em ordem: `STEPS[n]` leva um save da versão n para a n + 1.
 * Um passo só acrescenta ou converte o que mudou naquela versão; o que é só campo novo com valor
 * padrão não precisa de passo, porque `migrate` completa o save com os padrões de `newProfile`.
 */
const STEPS: Record<number, (p: Profile) => void> = {
  /* v1 → v2: contadores de longo prazo. O que dá para saber do save antigo entra como ponto de partida. */
  1: (p) => {
    const life = newLife(), stages = Object.values(p.stages ?? {});
    life.wins = stages.reduce((n, r) => n + (r.clears || 0), 0);
    life.runs = life.wins;
    life.towerFloors = p.tower?.best ?? 0;
    p.life = life;
    p.uniquesFound = Array.from(new Set([...(p.inventory ?? []), ...Object.values(p.equipped ?? {})].map((it) => it?.unique).filter((u): u is string => !!u)));
  },
};

/** Completa um save antigo com o que foi criado depois e corrige o que deixou de valer. */
export function migrate(saved: Profile): Profile {
  const old = { ...saved };
  for (let v = old.version; v < PROFILE_VERSION; v++) { STEPS[v]?.(old); old.version = v + 1; }
  const base = newProfile(old.seed);
  const p: Profile = {
    ...base, ...old, version: PROFILE_VERSION,
    materials: { ...base.materials, ...old.materials }, tower: { ...base.tower, ...(old.tower ?? {}) }, gems: { ...(old.gems ?? {}) }, daily: { ...base.daily, ...(old.daily ?? {}) },
    life: { ...base.life, ...(old.life ?? {}) }, achievements: { ...(old.achievements ?? {}) }, uniquesFound: [...(old.uniquesFound ?? [])],
    lootFilter: { ...base.lootFilter, ...(old.lootFilter ?? {}) },
    builds: Array.from({ length: BUILD_SLOTS }, (_, i) => old.builds?.[i] ?? null),
  };
  if (!talentsConnected(p.talents)) p.talents = {};
  if (p.curupiraFreed && !p.supremos.includes('natureza')) p.supremos = [...p.supremos, 'natureza'];
  if (!p.supremo && p.supremos.length) p.supremo = p.supremos[0];
  p.potions = maxPotions(p);
  return p;
}

export function maxPotions(p: Profile): number {
  return MAX_POTIONS + (p.talents.cantilCheio ? 1 : 0);
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
  return { mata: 1 + item.rarity + Math.floor(item.ilvl / 4) + Math.floor(item.plus / 2), po: item.rarity, lagrima: 0, tomo: 0 };
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

/** Multiplicador do custo em ouro do ferreiro (talento Pechincha). */
export function forgeDiscount(p: Profile): number {
  return 1 - 0.04 * (p.talents.pechincha || 0);
}

export interface UpgradeInfo { possible: boolean; reason?: string; gold: number; mata: number; chance: number }

export function upgradeInfo(p: Profile, item: Item): UpgradeInfo {
  const max = RARITIES[item.rarity].maxPlus;
  const gold = Math.round((20 + 12 * item.ilvl * (item.plus + 1)) * forgeDiscount(p)), mata = 2 + item.plus;
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
  const gold = Math.round(40 * (m.rarity + 1) * (1 + m.ilvl * 0.25) * forgeDiscount(p)), chance = FUSE_CHANCE[m.rarity], lagrima = m.rarity + 1 === MAX_RARITY ? 1 : 0;
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

/** Itens da mochila que servem de consumo para fundir o item principal. */
export function fuseCandidates(p: Profile, mainId: number): Item[] {
  const f = findItem(p, mainId);
  if (!f) return [];
  const m = f.item;
  return p.inventory.filter((i) => i.id !== mainId && !i.locked && i.rarity === m.rarity && ITEM_TYPES[i.type].group === ITEM_TYPES[m.type].group);
}

/** Todos os itens do herói: equipados primeiro, depois a mochila. */
export function allItems(p: Profile): Item[] {
  const eq = SLOTS.map((s) => p.equipped[s]).filter((i): i is Item => !!i);
  return [...eq, ...p.inventory];
}

/* ---------- encantar: troca um bônus por outro ---------- */

export interface EnchantInfo { possible: boolean; reason?: string; gold: number; po: number }

export function enchantInfo(p: Profile, item: Item): EnchantInfo {
  const n = item.enchants ?? 0;
  const gold = Math.round((30 + 10 * item.ilvl) * (1 + n * 0.5) * forgeDiscount(p)), po = Math.min(64, 2 ** n);
  if (!item.affixes.length) return { possible: false, reason: 'Este item não tem bônus para trocar.', gold, po };
  if (p.gold < gold) return { possible: false, reason: 'Falta ouro.', gold, po };
  if (p.materials.po < po) return { possible: false, reason: `Falta ${MATERIAL_LABEL.po}.`, gold, po };
  return { possible: true, gold, po };
}

/** Sorteia de novo o bônus de posição `index`. Os outros ficam como estão. */
export function enchantItem(p: Profile, id: number, index: number, rng: Rng = profileRng(p)): { done: boolean; reason?: string } {
  const f = findItem(p, id);
  if (!f) return { done: false, reason: 'Item não encontrado.' };
  const info = enchantInfo(p, f.item);
  if (!info.possible) return { done: false, reason: info.reason };
  if (!f.item.affixes[index]) return { done: false, reason: 'Escolha o bônus a trocar.' };
  p.gold -= info.gold; p.materials.po -= info.po;
  f.item.affixes[index] = rollAffix(rng, f.item.ilvl, f.item.affixes.map((a) => a.k));
  f.item.enchants = (f.item.enchants ?? 0) + 1;
  return { done: true };
}

/* ---------- reforjar: traz o item para o seu nível ---------- */

export interface ReforgeInfo { possible: boolean; reason?: string; gold: number; mata: number; toLevel: number }

export function reforgeInfo(p: Profile, item: Item): ReforgeInfo {
  const gain = p.level - item.ilvl;
  const gold = Math.round(25 * Math.max(0, gain) * (1 + item.rarity * 0.5) * forgeDiscount(p)), mata = 3 * Math.max(0, gain);
  const base = { gold, mata, toLevel: p.level };
  if (gain <= 0) return { ...base, possible: false, reason: 'O item já está no seu nível.' };
  if (p.gold < gold) return { ...base, possible: false, reason: 'Falta ouro.' };
  if (p.materials.mata < mata) return { ...base, possible: false, reason: `Falta ${MATERIAL_LABEL.mata}.` };
  return { ...base, possible: true };
}

/** Uma cópia do item como ele ficaria no nível dado: valor base e bônus que dependem de nível sobem juntos. */
export function reforgedPreview(item: Item, level: number): Item {
  const affixes = item.affixes.map((a) => {
    const d = AFFIXES[a.k], was = d.max(item.ilvl), now = d.max(level);
    return { k: a.k, v: now > was ? Math.max(a.v, Math.round((a.v * now) / was)) : a.v };
  });
  return { ...item, ilvl: level, affixes };
}

export function reforgeItem(p: Profile, id: number): { done: boolean; reason?: string } {
  const f = findItem(p, id);
  if (!f) return { done: false, reason: 'Item não encontrado.' };
  const info = reforgeInfo(p, f.item);
  if (!info.possible) return { done: false, reason: info.reason };
  p.gold -= info.gold; p.materials.mata -= info.mata;
  const next = reforgedPreview(f.item, info.toLevel);
  f.item.ilvl = next.ilvl; f.item.affixes = next.affixes;
  return { done: true };
}

/* ---------- nível dos feitiços e Supremo ---------- */

export function spellLevel(p: Profile, id: SpellId): number {
  return Math.max(1, Math.min(MAX_SPELL_LEVEL, p.spellLevels[id] ?? 1));
}

export interface SpellUpgradeInfo { possible: boolean; reason?: string; gold: number; tomos: number }

export function spellUpgradeInfo(p: Profile, id: SpellId): SpellUpgradeInfo {
  const lv = spellLevel(p, id);
  const tomos = Math.max(1, lv - (p.talents.estudioso ? 1 : 0)), gold = 40 * lv;
  const base = { gold, tomos };
  if (!knownSpells(p).includes(id)) return { ...base, possible: false, reason: `Aprende no nível ${SPELLS[id].unlock}.` };
  if (lv >= MAX_SPELL_LEVEL) return { ...base, possible: false, reason: 'Nível máximo.' };
  if (p.materials.tomo < tomos) return { ...base, possible: false, reason: `Faltam tomos.` };
  if (p.gold < gold) return { ...base, possible: false, reason: 'Falta ouro.' };
  return { ...base, possible: true };
}

export function upgradeSpell(p: Profile, id: SpellId): boolean {
  const info = spellUpgradeInfo(p, id);
  if (!info.possible) return false;
  p.gold -= info.gold; p.materials.tomo -= info.tomos;
  p.spellLevels[id] = spellLevel(p, id) + 1;
  return true;
}

export function setSupremo(p: Profile, el: ElementId | null): boolean {
  if (el && !p.supremos.includes(el)) return false;
  p.supremo = el;
  return true;
}

export function refillPotions(p: Profile): void {
  p.potions = maxPotions(p);
}

/* ---------- gemas ---------- */

export function gemCount(p: Profile, g: Gem): number { return p.gems[gemKey(g)] ?? 0; }
export function addGem(p: Profile, g: Gem, n = 1): void { const k = gemKey(g); p.gems[k] = (p.gems[k] ?? 0) + n; if (p.gems[k] <= 0) delete p.gems[k]; }
/** Gemas guardadas, das mais fortes para as mais fracas. */
export function gemList(p: Profile): { gem: Gem; count: number }[] {
  return Object.entries(p.gems).filter(([, n]) => n > 0).map(([k, count]) => { const [el, lvl] = k.split(':'); return { gem: { el: el as ElementId, lvl: Number(lvl) }, count }; })
    .sort((a, b) => b.gem.lvl - a.gem.lvl || a.gem.el.localeCompare(b.gem.el));
}
export const GEM_SOCKET_COST = (lvl: number) => 30 * lvl;
export const GEM_REMOVE_COST = (lvl: number) => 60 * lvl;
export const GEM_FUSE_COST = (lvl: number) => 80 * lvl * lvl;

/** Encaixa uma gema guardada no item. A que estava no item volta para a bolsa. */
export function socketGem(p: Profile, itemId: number, g: Gem): { done: boolean; reason?: string } {
  const f = findItem(p, itemId);
  if (!f) return { done: false, reason: 'Item não encontrado.' };
  if (!canHoldGem(f.item)) return { done: false, reason: 'Anéis, amuletos e aljavas não têm encaixe.' };
  if (gemCount(p, g) < 1) return { done: false, reason: 'Você não tem essa gema.' };
  const cost = GEM_SOCKET_COST(g.lvl) + (f.item.gem ? GEM_REMOVE_COST(f.item.gem.lvl) : 0);
  if (p.gold < cost) return { done: false, reason: 'Falta ouro.' };
  p.gold -= cost;
  if (f.item.gem) addGem(p, f.item.gem);
  addGem(p, g, -1);
  f.item.gem = { ...g };
  return { done: true };
}
/** Tira a gema do item (custa ouro, a gema não se perde). */
export function unsocketGem(p: Profile, itemId: number): { done: boolean; reason?: string } {
  const f = findItem(p, itemId);
  if (!f || !f.item.gem) return { done: false, reason: 'Sem gema.' };
  const cost = GEM_REMOVE_COST(f.item.gem.lvl);
  if (p.gold < cost) return { done: false, reason: 'Falta ouro.' };
  p.gold -= cost; addGem(p, f.item.gem); delete f.item.gem;
  return { done: true };
}
/** Funde 3 gemas iguais numa do nível seguinte. */
export function fuseGems(p: Profile, g: Gem): { done: boolean; reason?: string } {
  if (g.lvl >= GEM_MAX) return { done: false, reason: 'Já está no nível máximo.' };
  if (gemCount(p, g) < 3) return { done: false, reason: 'Precisa de 3 gemas iguais.' };
  const cost = GEM_FUSE_COST(g.lvl);
  if (p.gold < cost) return { done: false, reason: 'Falta ouro.' };
  p.gold -= cost; addGem(p, g, -3); addGem(p, { el: g.el, lvl: g.lvl + 1 });
  return { done: true };
}

/* ---------- builds salvas ---------- */

const attrSum = (a: Record<AttrKey, number>) => ATTRS.reduce((n, k) => n + (a[k.key] || 0), 0);

/** Guarda o que o herói veste e como distribuiu os pontos no espaço `index`. */
export function saveBuild(p: Profile, index: number, name?: string): Build | null {
  if (index < 0 || index >= BUILD_SLOTS) return null;
  const equipped: Partial<Record<Slot, number>> = {};
  for (const slot of SLOTS) { const it = p.equipped[slot]; if (it) equipped[slot] = it.id; }
  const b: Build = {
    name: (name ?? p.builds[index]?.name ?? `Build ${index + 1}`).trim().slice(0, 18) || `Build ${index + 1}`,
    equipped, attrs: { ...p.attrs }, talents: { ...p.talents }, loadout: p.loadout.slice(0, 3), supremo: p.supremo, companion: p.companion,
  };
  p.builds[index] = b;
  return b;
}

export interface BuildResult {
  /** Itens da build que não estão mais com o herói (vendidos, desmontados ou fundidos). */
  missing: number;
  /** Os pontos da build não cabem mais nos pontos do herói: atributos ou talentos ficaram como estavam. */
  attrsKept: boolean; talentsKept: boolean;
}

/**
 * Veste uma build salva. Trocar é grátis: os pontos foram pagos quando a build foi montada.
 * O que não existir mais é pulado, e o resultado diz o que ficou de fora.
 */
export function applyBuild(p: Profile, index: number): BuildResult | null {
  const b = p.builds[index];
  if (!b) return null;
  const res: BuildResult = { missing: 0, attrsKept: false, talentsKept: false };
  /* equipamento: tira o que não é da build e veste o que é, na ordem dos espaços (a arma primeiro) */
  for (const slot of SLOTS) {
    const want = b.equipped[slot], cur = p.equipped[slot];
    if (cur && cur.id === want) continue;
    if (want == null) { if (cur && slot !== 'arma') { delete p.equipped[slot]; p.inventory.push(cur); } continue; }
    const found = findItem(p, want);
    if (!found) { res.missing++; continue; }
    if (found.slot && found.slot !== slot) {
      /* está em outro espaço (anéis trocados): passa pela mochila */
      delete p.equipped[found.slot]; p.inventory.push(found.item);
    }
    if (!equip(p, want, slot)) res.missing++;
  }
  /* atributos: os pontos da build têm que caber no total do herói */
  const total = attrSum(p.attrs) + p.attrPoints, need = attrSum(b.attrs);
  if (need <= total) { p.attrs = { ...b.attrs }; p.attrPoints = total - need; } else res.attrsKept = true;
  if (talentsConnected(b.talents) && talentSpent(b.talents) <= p.talentPoints) p.talents = { ...b.talents }; else res.talentsKept = true;
  const known = knownSpells(p);
  p.loadout = [0, 1, 2].map((i) => { const sp = b.loadout[i] ?? null; return sp && known.includes(sp) ? sp : null; });
  if (!p.loadout.some(Boolean)) p.loadout[0] = known[0] ?? null;
  p.supremo = b.supremo && p.supremos.includes(b.supremo) ? b.supremo : p.supremo;
  p.companion = b.companion && p.companions[b.companion] ? b.companion : b.companion === null ? null : p.companion;
  p.potions = maxPotions(p);
  return res;
}

export function clearBuild(p: Profile, index: number): void {
  if (index >= 0 && index < BUILD_SLOTS) p.builds[index] = null;
}

/** A build do espaço `index` é a que o herói está usando agora? */
export function buildMatches(p: Profile, index: number): boolean {
  const b = p.builds[index];
  if (!b) return false;
  for (const slot of SLOTS) if ((p.equipped[slot]?.id ?? null) !== (b.equipped[slot] ?? null)) return false;
  if (ATTRS.some((k) => (p.attrs[k.key] || 0) !== (b.attrs[k.key] || 0))) return false;
  const keys = new Set([...Object.keys(p.talents), ...Object.keys(b.talents)]);
  for (const k of keys) if ((p.talents[k] || 0) !== (b.talents[k] || 0)) return false;
  return [0, 1, 2].every((i) => (p.loadout[i] ?? null) === (b.loadout[i] ?? null)) && p.supremo === b.supremo && p.companion === b.companion;
}

/** Semana atual no formato ano-semana, para o ranking semanal da Torre. */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear(), w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-${String(w).padStart(2, '0')}`;
}
