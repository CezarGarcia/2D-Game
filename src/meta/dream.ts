/**
 * Regras do Sonho (docs/gdd/09): a noite em andamento e tudo o que a move. Os números e o mapa estão em src/data/dream.ts.
 *
 * A noite fica em `p.dream.run`, guardada entre um nó e outro. Um nó de luta (combate, elite, provação, chefe)
 * ou de altar vira uma fase de uma sala só; Feira, Fonte e Causo são telas. Cada função aqui altera o perfil
 * recebido e devolve o que a tela precisa mostrar; quem chama decide quando salvar.
 */
import { AMULETS, AMULET_ORDER, AMULET_RARITY, type AmuletId, type AmuletRarity } from '../data/amulets';
import { ASPECTS, type AspectId } from '../data/aspects';
import { CORDEIS, CORDEL, cordelCost, cordelPrice, isFullCordel, type CordelId } from '../data/cordeis';
import { HURRY_SECONDS, cleanOmens, omenFoes, omenGrade, omenMemories, omenWeight, type OmenPick } from '../data/omens';
import { CAUSOS, CAUSO_ORDER, type CausoId, type DreamEffect } from '../data/causos';
import {
  AWAKENINGS, BLESSINGS, BLESSING_ORDER, BLESSING_WEIGHT, MAX_POTIONS, STAGE_ONLY_BLESSINGS, blessingCounts, patronTier, patronCounts,
  type BaseBlessingId, type BlessingId, type CompanionId, type ElementId, type SpellId,
} from '../data/content';
import { DREAM, dreamNight, isPanelNode, nextNodes, nodeStageId, type DreamNode, type Night, type NodeKind, type Trecho } from '../data/dream';
import { WEAPON_KINDS, type WeaponKind } from '../data/items';
import { stageGold, stageXp } from '../data/progression';
import { makeRng, type Rng } from '../data/rng';
import { CHAPTERS } from '../data/stages';
import { BUILDINGS, type BuildingId } from '../data/village';
import { redundantBlessing } from '../sim/world';
import type { Carry } from '../sim/types';
import { checkAchievements } from './achievements';
import { recordTally } from './life';
import { addXp, allItems, knownSpells, maxPotions, profileRng, type Profile } from './profile';
import type { StageOutcome } from './rewards';
import { readGrid, rodaWeights, spinGrid, type RodaRead, type RodaSymbol, type RodaWeights } from './roda';
import { deriveStats, referenceProfile, type HeroStats, type StatBoost } from './stats';

/* ---------- o estado de uma noite ---------- */

/** O que um efeito de causo vai dar de fato, já sorteado ao abrir o causo (para a tela dizer antes de o jogador escolher). */
export interface Resolved { effect: DreamEffect; blessing?: BlessingId; amulet?: AmuletId }

export type Pending =
  /** Escolher um amuleto (elite, provação ou chefe vencido). */
  | { kind: 'amuleto'; options: AmuletId[] }
  /** Escolher uma bênção (o Rancho, no começo da noite). */
  | { kind: 'bencao'; options: BlessingId[] }
  /** Na Feira: o que ainda está à venda (nulo = já levado). */
  | { kind: 'feira'; blessings: (BlessingId | null)[]; amulets: (AmuletId | null)[]; healed: boolean; rerolls: number; bought?: boolean }
  | { kind: 'fonte' }
  | { kind: 'causo'; id: CausoId; outcomes: Resolved[][] }
  /** Na Roda do Saci: os padrinhos da grade, a grade do último giro (nula antes do primeiro) e o que ainda dá para fazer. */
  | { kind: 'roda'; patrons: ElementId[]; grid: RodaSymbol[] | null; collected: boolean; spins: number; paid: number; free: number; pulos: number; assobios: number; last: RodaPayout | null };

/** O que um giro da Roda pagou, para a tela mostrar. */
export interface RodaPayout { lines: RodaRead['lines']; blessings: BlessingId[]; vintem: number; cursed: boolean; jackpot: boolean; forced: boolean }

export interface DreamRun {
  seed: number;
  /** Nível do herói nesta noite. */
  level: number;
  weapon: WeaponKind;
  spells: (SpellId | null)[];
  companion: CompanionId | null;
  supremo: ElementId | null;
  /** Padrinhos que podem aparecer (os já libertados quando a noite começou). */
  patrons: ElementId[];
  map: Night;
  /** Trecho atual, o nó em que o herói está (nulo = ainda na entrada do trecho) e se esse nó já foi resolvido. */
  trecho: number; at: number | null; done: boolean;
  /** Nós visitados, por trecho. */
  path: number[][];
  blessings: BlessingId[];
  amulets: AmuletId[];
  vintem: number;
  /** Como o herói está: fração da vida, poções, carga do Supremo, quedas que ainda pode ter e o azar do altar. */
  hpFrac: number; potions: number; charge: number; revives: number; altarDry: number;
  /** Maldições até o fim do trecho: fração a mais de vida e de dano dos monstros. */
  curse: { hp: number; damage: number };
  /** Lembranças juntadas até aqui (antes dos bônus de quem acorda). */
  earned: number;
  tally: { rooms: number; elites: number; bosses: number; trials: number; kills: number; time: number; causos: number; altars: number };
  pending: Pending | null;
  /** Conta os sorteios feitos fora das salas, para nenhum se repetir. */
  rolls: number;
  /** Uma sinergia de 7 já contou nesta noite. */
  seven: boolean;
  /** Presságios escolhidos, Cordéis equipados (com o nível de cada um) e o Aspecto da arma. */
  omens: OmenPick; cordeis: Partial<Record<CordelId, number>>; aspect: AspectId | null;
  /** Neste trecho: segundos de luta (Presságio Pressa), altares já visitados (cordel do Pavão) e se as Lembranças estão em dobro (Olhos da Roda). */
  clock: number; altars: number; doubled: boolean;
  /** Giros seguidos da Roda sem linha, na noite. */
  dry: number;
  /** Escolhas que esperam a atual ser resolvida. */
  later: Pending[];
}

/** Como a noite acabou e o que o jogador traz dela. */
export interface NightEnd {
  won: boolean;
  how: 'venceu' | 'caiu' | 'desistiu';
  memories: number; xp: number; gold: number; levels: number;
  /** Ganhou o ponto de talento da primeira vitória com esta arma. */
  talent: boolean;
  trechos: number; of: number;
  tally: DreamRun['tally'];
  blessings: BlessingId[]; amulets: AmuletId[];
  weapon: WeaponKind; level: number;
  /** Conquistas alcançadas ao acordar. */
  achievements: string[];
}

/** O que mudou ao resolver um nó de sala. */
export interface NodeResult {
  kind: NodeKind;
  won: boolean;
  vintem: number; memories: number;
  /** Provação: venceu a regra ou não (nulo = não era provação). */
  trial: boolean | null;
  /** A noite acabou aqui. */
  end: NightEnd | null;
}

/* ---------- consultas ---------- */

export function isDreamUnlocked(p: Profile): boolean { return !!p.stages[DREAM.unlock]?.cleared; }

/** Capítulos já vencidos (o chefão da fase 12 caiu): cenário e monstros que podem entrar no Sonho. */
export function dreamChapters(p: Profile): number[] {
  return CHAPTERS.filter((c) => p.stages[`${c.id}-12`]?.cleared).map((c) => c.id);
}

/** O que o jogador pode levar para o Sonho: as armas que tem, os feitiços que sabe e os companheiros que resgatou. */
export function nightOptions(p: Profile): { weapons: WeaponKind[]; spells: SpellId[]; companions: CompanionId[]; supremos: ElementId[] } {
  const owned = new Set(allItems(p).map((it) => it.type as string));
  return {
    weapons: WEAPON_KINDS.filter((w) => w === 'facao' || owned.has(w)),
    spells: knownSpells(p),
    companions: (Object.keys(p.companions) as CompanionId[]).filter((c) => p.companions[c]),
    supremos: p.supremos.slice(),
  };
}

export interface NightChoice { weapon: WeaponKind; spells: (SpellId | null)[]; companion: CompanionId | null; supremo: ElementId | null; omens?: OmenPick }

/** A escolha padrão: o que o herói está usando na campanha. */
export function defaultChoice(p: Profile): NightChoice {
  const o = nightOptions(p), w = p.equipped.arma?.type as WeaponKind | undefined;
  return {
    weapon: w && o.weapons.includes(w) ? w : 'facao',
    spells: [0, 1, 2].map((i) => (p.loadout[i] && o.spells.includes(p.loadout[i]!) ? p.loadout[i] : null)),
    companion: p.companion && o.companions.includes(p.companion) ? p.companion : null,
    supremo: p.supremo && o.supremos.includes(p.supremo) ? p.supremo : null,
  };
}

const profiles = new Map<string, Profile>();

/**
 * O herói do Sonho: o personagem de referência do nível (itens do nível, talentos de um caminho simples),
 * com a arma, os feitiços, o companheiro e o Supremo escolhidos. O inventário da campanha não entra.
 */
export function dreamProfile(level: number, c: NightChoice, aspect: AspectId | null = null): Profile {
  const key = JSON.stringify([level, c.weapon, c.spells, c.companion, c.supremo, aspect]), hit = profiles.get(key);
  if (hit) return hit;
  const agile = c.weapon === 'arco' || c.weapon === 'peixeiras';
  const p = referenceProfile(level, agile, c.weapon);
  const pts = p.attrs.forca + p.attrs.agilidade;
  if (c.weapon === 'cajado') { p.attrs.inteligencia = pts; p.attrs.forca = 0; p.attrs.agilidade = 0; }
  if (c.weapon === 'zagaia') { p.attrs.forca = Math.ceil(pts / 2); p.attrs.agilidade = Math.floor(pts / 2); }
  p.loadout = [0, 1, 2].map((i) => c.spells[i] ?? null);
  /* os feitiços acompanham o nível da noite, para não depender dos tomos gastos na campanha */
  const spellLevel = Math.min(10, 1 + Math.floor(level / 8));
  p.spellLevels = {};
  for (const id of p.loadout) if (id) p.spellLevels[id] = spellLevel;
  p.companions = c.companion ? { [c.companion]: { level: 1 } } : {};
  p.companion = c.companion;
  p.supremos = c.supremo ? [c.supremo] : [];
  p.supremo = c.supremo;
  p.potions = maxPotions(p);
  if (aspect && ASPECTS[aspect]?.weapon === c.weapon) p.aspects = { owned: [aspect], equipped: { [c.weapon]: aspect } };
  if (profiles.size > 12) profiles.clear();
  profiles.set(key, p);
  return p;
}

/** Nível do folheto equipado nesta noite (0 = não está). */
const cordelLevel = (run: DreamRun, id: CordelId) => run.cordeis?.[id] ?? 0;
/** O número do efeito de um folheto equipado, ou 0. */
export function cordel(run: DreamRun, id: CordelId): number {
  const lv = cordelLevel(run, id);
  return lv > 0 ? CORDEIS[id].values[Math.min(3, lv) - 1] : 0;
}
/** O que os Cordéis da noite somam aos números do herói. */
export function runBoost(run: DreamRun): StatBoost {
  return { hp: cordel(run, 'peleja') / 100, damage: cordel(run, 'valentao') / 100, cooldown: cordel(run, 'viola') / 100, crit: cordel(run, 'donzela') / 100, potions: cordel(run, 'sacoSemFundo') };
}

/** Presságio Esquecimento: o espaço de feitiço esquecido neste trecho (−1 = nenhum). Quem só tem um feitiço não esquece. */
export function forgottenSlot(run: DreamRun): number {
  if (!omenGrade(run.omens, 'esquecimento')) return -1;
  const slots = [0, 1, 2].filter((i) => run.spells[i]);
  if (slots.length < 2) return -1;
  let v = 2166136261;
  for (const ch of `${run.seed}|esquece|${run.trecho}`) v = Math.imul(v ^ ch.charCodeAt(0), 16777619);
  return slots[(v >>> 0) % slots.length];
}

/** O herói da noite. Com `inRoom`, é o que entra na sala: sem o feitiço que o Esquecimento levou neste trecho. */
export function runProfile(run: DreamRun, inRoom = false): Profile {
  const lost = inRoom ? forgottenSlot(run) : -1;
  return dreamProfile(run.level, { weapon: run.weapon, spells: run.spells.map((s, i) => (i === lost ? null : s)), companion: run.companion, supremo: run.supremo }, run.aspect ?? null);
}
export function runStats(run: DreamRun): HeroStats {
  return deriveStats(runProfile(run), run.blessings, run.amulets, runBoost(run));
}

export function currentTrecho(run: DreamRun): Trecho { return run.map.trechos[run.trecho]; }
export function currentNode(run: DreamRun): DreamNode | null { return run.at == null ? null : currentTrecho(run).nodes[run.at] ?? null; }

/** Nós que o herói pode escolher agora (vazio enquanto houver uma escolha em aberto ou um nó por resolver). */
export function reachable(run: DreamRun): number[] {
  if (run.pending || (run.at != null && !run.done)) return [];
  return nextNodes(currentTrecho(run), run.at);
}

const has = (run: DreamRun, a: AmuletId) => run.amulets.includes(a);
const village = (p: Profile, b: BuildingId) => p.village[b] ?? 0;

function rng(run: DreamRun, what: string): Rng {
  let v = 2166136261;
  const text = `${run.seed}|${what}|${run.rolls++}`;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return makeRng((v >>> 0) | 1);
}

/* ---------- sorteios fora das salas ---------- */

/** Bênçãos comuns que esta noite ainda pode receber fora dos altares (Feira, Causo, Rancho). */
export function offerable(run: DreamRun, o: { patron?: ElementId; tier?: number; maxTier?: number } = {}): BaseBlessingId[] {
  const have = blessingCounts(run.blessings), stats = runStats(run);
  return BLESSING_ORDER.filter((b) => {
    const d = BLESSINGS[b];
    if ((have[b] ?? 0) >= d.max) return false;
    if (d.patron && !run.patrons.includes(d.patron)) return false;
    if (o.patron && d.patron !== o.patron) return false;
    if (o.tier && d.tier !== o.tier) return false;
    if (o.maxTier && d.tier > o.maxTier) return false;
    if (b === 'parceria' && !run.companion) return false;
    if (STAGE_ONLY_BLESSINGS.includes(b)) return false;
    return have[b] ? true : !redundantBlessing(stats, b);
  });
}

function drawBlessings(run: DreamRun, r: Rng, n: number, o: Parameters<typeof offerable>[1] = {}, skip: BlessingId[] = []): BlessingId[] {
  const pool = offerable(run, o).filter((b) => !skip.includes(b)), out: BlessingId[] = [];
  while (out.length < n && pool.length) {
    let roll = r() * pool.reduce((s, b) => s + BLESSING_WEIGHT[BLESSINGS[b].tier], 0), at = 0;
    for (let i = 0; i < pool.length; i++) { roll -= BLESSING_WEIGHT[BLESSINGS[pool[i]].tier]; if (roll <= 0) { at = i; break; } }
    out.push(pool.splice(at, 1)[0]);
  }
  return out;
}

function drawAmulets(run: DreamRun, r: Rng, n: number, rarity?: AmuletRarity, skip: AmuletId[] = []): AmuletId[] {
  const pool = AMULET_ORDER.filter((a) => !run.amulets.includes(a) && !skip.includes(a) && (!rarity || AMULETS[a].rarity === rarity)), out: AmuletId[] = [];
  while (out.length < n && pool.length) {
    let roll = r() * pool.reduce((s, a) => s + AMULET_RARITY[AMULETS[a].rarity].weight, 0), at = 0;
    for (let i = 0; i < pool.length; i++) { roll -= AMULET_RARITY[AMULETS[pool[i]].rarity].weight; if (roll <= 0) { at = i; break; } }
    out.push(pool.splice(at, 1)[0]);
  }
  return out;
}

/* ---------- ganhar e perder coisas fora das salas ---------- */

/** Poções que o herói desta noite pode carregar. */
export function potionCap(run: DreamRun): number { return runStats(run).potions; }

function heal(run: DreamRun, frac: number): void { run.hpFrac = Math.max(0.01, Math.min(1, run.hpFrac + frac)); }

function seeAmulet(p: Profile, a: AmuletId): void { if (!p.dream.amuletsSeen.includes(a)) p.dream.amuletsSeen.push(a); }

function giveAmulet(p: Profile, run: DreamRun, a: AmuletId): void {
  if (run.amulets.includes(a)) return;
  run.amulets.push(a);
  seeAmulet(p, a);
  if (a === 'muiraquita') run.revives += 1;
}

/** Conta o que uma bênção nova muda nos registros (Despertar, Compadrio, sinergia de 7, o Almanaque). */
function noteBlessing(p: Profile, run: DreamRun, id: BlessingId): void {
  const d = BLESSINGS[id];
  p.life.blessings[id] = (p.life.blessings[id] ?? 0) + 1;
  if (d.kind === 'desperta') p.dream.awakened++;
  if (d.kind === 'compadrio') p.dream.compadrios++;
  if (!run.seven) {
    const n = patronCounts(run.blessings, null);
    if (run.patrons.some((el) => patronTier(n[el]) >= 3)) { run.seven = true; p.dream.synergy7++; }
  }
}

/** Dá uma bênção fora de uma sala (Feira, Causo, Fonte, Rancho). Devolve false se ela já está no máximo. */
function giveBlessing(p: Profile, run: DreamRun, id: BlessingId): boolean {
  const d = BLESSINGS[id], count = () => run.blessings.filter((b) => b === id).length;
  if (count() >= d.max) return false;
  const times = has(run, 'ferraduraVirada') && d.tier === 1 && d.kind === 'normal' ? 2 : 1;
  for (let i = 0; i < times && count() < d.max; i++) {
    run.blessings.push(id);
    noteBlessing(p, run, id);
    /* as que agem na hora */
    if (id === 'cura') { heal(run, 0.6); run.potions = potionCap(run); }
    if (id === 'cantil') run.potions = Math.min(potionCap(run), run.potions + 1);
  }
  return true;
}

/** Bênçãos que ainda podem subir de nível (na Fonte e na vigília da Pisadeira). */
export function upgradable(run: DreamRun): BaseBlessingId[] {
  const have = blessingCounts(run.blessings);
  return BLESSING_ORDER.filter((b) => (have[b] ?? 0) > 0 && (have[b] ?? 0) < BLESSINGS[b].max && b !== 'cura');
}

/** Abre uma escolha; se já há uma na tela, esta espera a vez. */
function ask(run: DreamRun, pend: Pending): void {
  if (run.pending) (run.later ??= []).push(pend); else run.pending = pend;
}
/** Fecha a escolha atual e abre a próxima que estiver esperando. */
function settle(run: DreamRun): void {
  run.pending = run.later?.shift() ?? null;
}

/* ---------- começar ---------- */

/** Dá para começar uma noite com esta escolha? */
export function validChoice(p: Profile, c: NightChoice): boolean {
  const o = nightOptions(p), spells = c.spells.filter(Boolean) as SpellId[];
  return o.weapons.includes(c.weapon) && spells.length > 0 && new Set(spells).size === spells.length && spells.every((s) => o.spells.includes(s))
    && (!c.companion || o.companions.includes(c.companion)) && (!c.supremo || o.supremos.includes(c.supremo));
}

/** Começa uma noite. A primeira de todas é curta: um trecho só. Devolve nulo se não puder. */
export function startNight(p: Profile, c: NightChoice, seed?: number): DreamRun | null {
  if (!isDreamUnlocked(p) || p.dream.run || !validChoice(p, c)) return null;
  const s = (seed ?? Math.floor(profileRng(p)() * 0x7fffffff)) | 1;
  const patrons = p.supremos.slice(), chapters = dreamChapters(p);
  const first = p.dream.nights === 0;
  /* a primeira noite de todas é só para conhecer o caminho: sem Presságios */
  const omens = first ? {} : cleanOmens(c.omens);
  const map = dreamNight(s, { chapters, patrons, level: p.level, short: first, roda: patrons.includes('tempestade'), noAltarStep: omenGrade(omens, 'semPadrinho') > 0 });
  const worn = equippedCordeis(p), aspectId = p.aspects.equipped[c.weapon];
  const run: DreamRun = {
    seed: s, level: p.level, weapon: c.weapon, spells: [0, 1, 2].map((i) => c.spells[i] ?? null), companion: c.companion, supremo: c.supremo, patrons,
    map, trecho: 0, at: null, done: false, path: map.trechos.map(() => []),
    blessings: [], amulets: [], vintem: 0, hpFrac: 1, potions: 0, charge: 0, revives: 0, altarDry: 0,
    curse: { hp: 0, damage: 0 }, earned: 0,
    tally: { rooms: 0, elites: 0, bosses: 0, trials: 0, kills: 0, time: 0, causos: 0, altars: 0 },
    pending: null, rolls: 0, seven: false,
    omens, cordeis: Object.fromEntries(worn.map((id) => [id, p.cordeis.levels[id] ?? 1])), aspect: aspectId && p.aspects.owned.includes(aspectId) && ASPECTS[aspectId].weapon === c.weapon ? aspectId : null,
    clock: 0, altars: 0, doubled: false, dry: 0, later: [],
  };
  run.potions = potionCap(run);
  run.vintem += cordel(run, 'cantador');
  run.revives += cordel(run, 'vaqueiro');
  /* o Rancho: vinténs, um amuleto comum e uma bênção comum à escolha */
  const rancho = village(p, 'rancho');
  if (rancho >= 1) run.vintem += 30;
  if (rancho >= 2) for (const a of drawAmulets(run, rng(run, 'rancho'), 1, 'comum')) giveAmulet(p, run, a);
  if (rancho >= 3) { const options = drawBlessings(run, rng(run, 'rancho-bencao'), 3, { tier: 1 }); if (options.length) ask(run, { kind: 'bencao', options }); }
  const gift = cordel(run, 'encantado');
  if (gift) { const options = drawBlessings(run, rng(run, 'cordel-bencao'), 3, { tier: gift }); if (options.length) ask(run, { kind: 'bencao', options }); }
  p.dream.run = run;
  return run;
}

/* ---------- entrar num nó ---------- */

export type Entered = { stage: string } | { panel: 'feira' | 'fonte' | 'causo' | 'roda' } | null;

/** O que a cena precisa para montar a sala do nó atual. */
export interface DreamContext {
  profile: Profile;
  amulets: AmuletId[];
  boost: StatBoost;
  carry: Carry;
  foes: { hp: number; damage: number; windup: number; eliteMods: number; bossHp: number; shell: number; resist?: number };
  /** Casca elemental (docs/gdd/11): no primeiro trecho, só no chefe; do segundo em diante, em toda elite e chefe. */
  shells: 'all' | undefined;
  /** Para o HUD: trecho, total de trechos e vinténs. */
  trecho: number; of: number; vintem: number;
}

export function dreamContext(run: DreamRun): DreamContext {
  const node = currentNode(run), trial = node?.kind === 'provacao' && has(run, 'chapeuDeCouro');
  return {
    profile: runProfile(run, true), amulets: run.amulets.slice(), boost: runBoost(run),
    carry: { blessings: run.blessings.slice(), hpFrac: Math.max(0.01, run.hpFrac * (trial ? 0.7 : 1)), potions: run.potions, altarDry: run.altarDry, revives: run.revives, supremo: run.charge },
    foes: runFoes(run), shells: node?.kind === 'chefe' || run.trecho >= 1 || omenGrade(run.omens, 'cascaGrossa') > 0 ? 'all' : undefined,
    trecho: run.trecho + 1, of: run.map.trechos.length, vintem: run.vintem,
  };
}

/** Passou do tempo do Presságio Pressa neste trecho? */
export function isLate(run: DreamRun): boolean {
  const g = omenGrade(run.omens, 'pressa');
  return g > 0 && (run.clock ?? 0) > HURRY_SECONDS[g];
}

/** Quanto os monstros da próxima sala estão mais fortes: a maldição do trecho, os Presságios e a Pressa. */
export function runFoes(run: DreamRun): DreamContext['foes'] {
  const o = omenFoes(run.omens);
  return { ...o, hp: o.hp * (1 + run.curse.hp), damage: o.damage * (1 + run.curse.damage) * (isLate(run) ? 1.5 : 1) };
}

/** Fase do nó em que o herói está (nulo se o nó é uma tela, não uma sala). */
export function currentStageId(run: DreamRun): string | null {
  const node = currentNode(run);
  if (!node || isPanelNode(node.kind)) return null;
  /* altar: F limita às comuns (Ferradura Virada); R pede rara ou melhor (cordel do Pavão, nos primeiros altares do trecho) */
  const flag = node.kind !== 'altar' ? '' : has(run, 'ferraduraVirada') ? 'F' : (run.altars ?? 0) < cordel(run, 'pavao') ? 'R' : '';
  return nodeStageId(run.map, currentTrecho(run), node, flag);
}

function resolve(run: DreamRun, r: Rng, effects: DreamEffect[]): Resolved[] {
  const got: BlessingId[] = [];
  return effects.map((effect) => {
    if (effect.t === 'bencao') { const b = drawBlessings(run, r, 1, { patron: effect.patron, tier: effect.tier }, got)[0] ?? drawBlessings(run, r, 1, { patron: effect.patron }, got)[0] ?? drawBlessings(run, r, 1, {}, got)[0]; if (b) got.push(b); return { effect, blessing: b }; }
    if (effect.t === 'subir') { const pool = upgradable(run); return { effect, blessing: pool.length ? pool[Math.floor(r() * pool.length)] : undefined }; }
    if (effect.t === 'esquecer') { const pool = run.blessings.filter((b) => BLESSINGS[b].kind === 'normal'); return { effect, blessing: pool.length ? pool[Math.floor(r() * pool.length)] : undefined }; }
    if (effect.t === 'amuleto') return { effect, amulet: drawAmulets(run, r, 1, effect.rarity)[0] ?? drawAmulets(run, r, 1)[0] };
    return { effect };
  });
}

function makeFeira(run: DreamRun, rerolls = 0): Pending {
  const r = rng(run, 'feira');
  const blessings: (BlessingId | null)[] = drawBlessings(run, r, 3, has(run, 'ferraduraVirada') ? { maxTier: 1 } : {});
  const amulets: (AmuletId | null)[] = drawAmulets(run, r, 2);
  return { kind: 'feira', blessings, amulets, healed: false, rerolls };
}

/** O herói vai para um nó ao alcance. Devolve a fase a jogar, a tela a abrir, ou nulo se não pode ir. */
export function enterNode(p: Profile, id: number): Entered {
  const run = p.dream.run;
  if (!run || !reachable(run).includes(id)) return null;
  const node = currentTrecho(run).nodes[id];
  run.at = id; run.done = false;
  run.path[run.trecho].push(id);
  if (node.kind === 'feira') { run.pending = makeFeira(run); return { panel: 'feira' }; }
  if (node.kind === 'fonte') { run.pending = { kind: 'fonte' }; return { panel: 'fonte' }; }
  if (node.kind === 'roda') { run.pending = makeRoda(run); return { panel: 'roda' }; }
  if (node.kind === 'causo') {
    const r = rng(run, 'causo');
    const fresh = CAUSO_ORDER.filter((c) => (!CAUSOS[c].needs || run.patrons.includes(CAUSOS[c].needs!)));
    const unseen = fresh.filter((c) => !p.dream.causosSeen.includes(c)), pool = unseen.length ? unseen : fresh;
    const cid = pool[Math.floor(r() * pool.length)] ?? 'matinta';
    run.pending = { kind: 'causo', id: cid, outcomes: CAUSOS[cid].choices.map((ch) => resolve(run, r, ch.effects)) };
    return { panel: 'causo' };
  }
  return { stage: currentStageId(run)! };
}

/* ---------- resolver uma sala ---------- */

function nextTrecho(run: DreamRun): void {
  run.trecho++; run.at = null; run.done = false;
  run.curse = { hp: 0, damage: 0 };
  run.clock = 0; run.altars = 0; run.doubled = false;
  run.vintem += cordel(run, 'cantador');
}

/** Aplica o resultado da sala do nó atual (combate, elite, provação, chefe ou altar). */
export function settleNode(p: Profile, o: StageOutcome, now: Date = new Date()): NodeResult | null {
  const run = p.dream.run, node = run ? currentNode(run) : null;
  if (!run || !node || run.done) return null;
  const kind = node.kind, out: NodeResult = { kind, won: o.won, vintem: 0, memories: 0, trial: null, end: null };
  recordTally(p, o);
  run.tally.kills += o.kills; run.tally.time += Math.max(0, o.time);
  run.clock = (run.clock ?? 0) + Math.max(0, o.time);
  /* bênçãos que a sala deu (altar, oferenda de baú): entram na noite e nos registros */
  const before = blessingCounts(run.blessings), after = (o.blessings ?? run.blessings).slice();
  run.blessings = after;
  const counted: Partial<Record<BlessingId, number>> = {};
  for (const id of after) { counted[id] = (counted[id] ?? 0) + 1; if (counted[id]! > (before[id] ?? 0)) noteBlessing(p, run, id); }
  if (o.left) { run.altarDry = o.left.altarDry; }

  if (kind === 'altar') {
    /* a Ferradura Virada sobe a bênção comum mais um nível */
    const chosen = after.find((id) => (counted[id] ?? 0) > (before[id] ?? 0) && after.lastIndexOf(id) === after.length - 1) ?? after[after.length - 1];
    if (chosen && has(run, 'ferraduraVirada') && BLESSINGS[chosen].tier === 1 && BLESSINGS[chosen].kind === 'normal' && run.blessings.filter((b) => b === chosen).length < BLESSINGS[chosen].max) { run.blessings.push(chosen); noteBlessing(p, run, chosen); }
    if (chosen === 'cura') run.potions = potionCap(run);
    if (o.left) { run.hpFrac = o.left.hpFrac; run.potions = Math.max(run.potions, Math.min(potionCap(run), o.left.potions)); }
    run.tally.altars++;
    run.altars = (run.altars ?? 0) + 1;
    run.done = true;
    return out;
  }
  if (!o.won) { out.end = wake(p, o.deaths > 0 ? 'caiu' : 'desistiu', now); return out; }

  if (o.left) {
    run.hpFrac = Math.max(0.01, Math.min(1, o.left.hpFrac)); run.charge = o.left.supremo; run.revives = o.left.revives;
    run.potions = Math.min(potionCap(run), o.left.potions + (has(run, 'moringa') ? 1 : 0));
  }
  run.tally.rooms++;
  if (has(run, 'estrelaDoBoi')) heal(run, 0.08);
  out.vintem = Math.round((DREAM.vintem[kind] ?? 0) * (has(run, 'peDeMeia') ? 1.5 : 1)) + (o.chests ?? 0) * DREAM.vintem.perChest + (o.hitsTaken === 0 ? cordel(run, 'saoSarue') : 0);
  run.vintem += out.vintem;
  let memories = DREAM.memories[kind] ?? 0;
  if (kind === 'provacao') {
    /* "três castigos" não tem regra além de vencer; as outras duas dependem de como o desafio da sala terminou */
    const passed = node.trial === 'tres' || o.trial === 'vencido';
    out.trial = passed;
    if (passed) { run.tally.trials++; p.dream.trials++; if (has(run, 'chapeuDeCouro')) memories *= 3; }
    else {
      memories = 0; run.hpFrac = Math.max(0.01, run.hpFrac * DREAM.trialFail);
      /* Presságio Juízo: perder a Provação acaba com a noite */
      if (omenGrade(run.omens, 'juizo')) { out.end = wake(p, 'caiu', now); return out; }
    }
  }
  if (run.doubled) memories *= 2;
  out.memories = memories;
  run.earned += memories;
  const r = rng(run, 'premio');
  const more = cordel(run, 'lampiao') + (has(run, 'balaio') ? 1 : 0);
  if (kind === 'elite') { run.tally.elites++; const options = drawAmulets(run, r, 2 + more); if (options.length) ask(run, { kind: 'amuleto', options }); }
  if (kind === 'provacao' && out.trial) { const rare = drawAmulets(run, r, 1, 'raro'), options = [...rare, ...drawAmulets(run, r, 1 + more, undefined, rare)]; if (options.length) ask(run, { kind: 'amuleto', options }); }
  run.done = true;
  if (kind === 'chefe') {
    run.tally.bosses++;
    p.dream.bestTrecho = Math.max(p.dream.bestTrecho, run.trecho + 1);
    if (run.trecho >= run.map.trechos.length - 1) { out.end = wake(p, 'venceu', now); return out; }
    run.hpFrac = has(run, 'velaBenta') ? 1 : Math.min(1, run.hpFrac + DREAM.bossHeal + cordel(run, 'boiMisterioso') / 100);
    const options = drawAmulets(run, r, 3 + more);
    if (options.length) ask(run, { kind: 'amuleto', options });
    nextTrecho(run);
  }
  return out;
}

/* ---------- escolhas em aberto ---------- */

/** Escolhe um dos amuletos oferecidos (ou nenhum, com índice −1). */
export function chooseAmulet(p: Profile, index: number): AmuletId | null {
  const run = p.dream.run, pend = run?.pending;
  if (!run || pend?.kind !== 'amuleto') return null;
  const a = pend.options[index] ?? null;
  if (a) giveAmulet(p, run, a);
  settle(run);
  return a;
}

/** Escolhe uma das bênçãos oferecidas fora de um altar (a do Rancho). */
export function chooseBlessingOffer(p: Profile, index: number): BlessingId | null {
  const run = p.dream.run, pend = run?.pending;
  if (!run || pend?.kind !== 'bencao') return null;
  const b = pend.options[index] ?? null;
  if (b) giveBlessing(p, run, b);
  settle(run);
  return b;
}

/* ---------- Feira ---------- */

export function feiraPrice(run: DreamRun, what: 'bencao' | 'amuleto' | 'cura' | 'trocar' | 'tirar', id?: BlessingId | AmuletId): number {
  const f = run.pending?.kind === 'feira' ? run.pending : null, goods = what === 'bencao' || what === 'amuleto';
  const off = (has(run, 'bolsaDeMascate') ? 0.75 : 1) * (has(run, 'dadoViciado') ? 0.5 : 1) * (1 - cordel(run, 'romanceFeira') / 100) * (1 + 0.3 * omenGrade(run.omens, 'feiraCara'))
    * (goods && f && !f.bought ? 1 - cordel(run, 'malasartes') / 100 : 1), P = DREAM.price;
  const base = what === 'bencao' ? P.blessing[BLESSINGS[id as BlessingId]?.tier ?? 1] ?? P.blessing[1]
    : what === 'amuleto' ? AMULET_RARITY[AMULETS[id as AmuletId]?.rarity ?? 'comum'].price
      : what === 'cura' ? P.heal : what === 'tirar' ? P.remove
        : P.reroll * (1 + (run.pending?.kind === 'feira' ? run.pending.rerolls : 0));
  return Math.max(1, Math.round(base * off));
}

function feira(p: Profile): { run: DreamRun; f: Extract<Pending, { kind: 'feira' }> } | null {
  const run = p.dream.run;
  return run && run.pending?.kind === 'feira' ? { run, f: run.pending } : null;
}

export function buyBlessing(p: Profile, index: number): boolean {
  const x = feira(p), id = x?.f.blessings[index];
  if (!x || !id) return false;
  const cost = feiraPrice(x.run, 'bencao', id);
  if (x.run.vintem < cost || !giveBlessing(p, x.run, id)) return false;
  x.run.vintem -= cost; x.f.blessings[index] = null; x.f.bought = true;
  return true;
}

export function buyAmulet(p: Profile, index: number): boolean {
  const x = feira(p), id = x?.f.amulets[index];
  if (!x || !id) return false;
  const cost = feiraPrice(x.run, 'amuleto', id);
  if (x.run.vintem < cost) return false;
  x.run.vintem -= cost; x.f.amulets[index] = null; x.f.bought = true;
  giveAmulet(p, x.run, id);
  return true;
}

/** Cura da Feira: uma vez por visita. */
export function buyHeal(p: Profile): boolean {
  const x = feira(p);
  if (!x || x.f.healed || x.run.hpFrac >= 1) return false;
  const cost = feiraPrice(x.run, 'cura');
  if (x.run.vintem < cost) return false;
  x.run.vintem -= cost; x.f.healed = true;
  heal(x.run, DREAM.feiraHeal);
  return true;
}

/** Troca o que está à venda. Cada troca na mesma visita custa mais. */
export function rerollFeira(p: Profile): boolean {
  const x = feira(p);
  if (!x) return false;
  const cost = feiraPrice(x.run, 'trocar');
  if (x.run.vintem < cost) return false;
  x.run.vintem -= cost;
  const fresh = makeFeira(x.run, x.f.rerolls + 1) as Extract<Pending, { kind: 'feira' }>;
  fresh.healed = x.f.healed; fresh.bought = x.f.bought;
  x.run.pending = fresh;
  return true;
}

/** Tira todas as cópias de uma bênção (para abrir caminho para outra build). */
export function removeBlessing(p: Profile, id: BlessingId): boolean {
  const x = feira(p);
  if (!x || !x.run.blessings.includes(id) || BLESSINGS[id].kind !== 'normal') return false;
  const cost = feiraPrice(x.run, 'tirar');
  if (x.run.vintem < cost) return false;
  x.run.vintem -= cost;
  /* a forma desperta sai junto com a bênção de que veio */
  x.run.blessings = x.run.blessings.filter((b) => b !== id && BLESSINGS[b].awakens !== id);
  return true;
}

/** Sai da Feira, da Fonte sem usar, ou fecha o que estiver aberto. */
export function leaveNode(p: Profile): boolean {
  const run = p.dream.run, pend = run?.pending;
  if (!run || !pend || pend.kind === 'causo' || pend.kind === 'amuleto' || pend.kind === 'bencao') return false;
  /* sair da Roda com um giro na mesa recebe o que ele pagou (e a sorte grande abre a escolha dela antes) */
  if (pend.kind === 'roda' && pend.grid && !pend.collected) { collectRoda(p); if (run.pending !== pend) return true; }
  run.done = true;
  settle(run);
  return true;
}

/* ---------- Fonte ---------- */

/** Quanto a Fonte cura nesta noite (a Figa Torta seca a Fonte; a Rede de Dormir enche tudo). */
export function fountainHeal(run: DreamRun): number {
  if (has(run, 'figaTorta')) return 0;
  const cut = Math.max(0, 1 - 0.5 * omenGrade(run.omens, 'poucasVelas'));
  return Math.min(1, (has(run, 'redeDeDormir') ? 1 : DREAM.fountainHeal + cordel(run, 'rezadeira') / 100) * cut);
}

/** Usa a Fonte: beber (cura e devolve as poções) ou fortalecer uma bênção que ainda pode subir. */
export function useFountain(p: Profile, what: 'beber' | 'subir', id?: BlessingId): boolean {
  const run = p.dream.run;
  if (!run || run.pending?.kind !== 'fonte') return false;
  if (what === 'subir') {
    if (!id || !upgradable(run).includes(id as BaseBlessingId) || !giveBlessing(p, run, id)) return false;
  } else { heal(run, fountainHeal(run)); run.potions = potionCap(run); }
  run.pending = null; run.done = true;
  return true;
}

/* ---------- Causo ---------- */

/** O que a escolha de um causo custa agora, e se dá para pagar. */
export function causoAffordable(run: DreamRun, outcomes: Resolved[]): boolean {
  let vintem = run.vintem, potions = run.potions;
  for (const o of outcomes) {
    const e = o.effect;
    if (e.t === 'vintem' && e.n < 0) { vintem += e.n; if (vintem < 0) return false; }
    if (e.t === 'pocao' && e.n < 0) { potions += e.n; if (potions < 0) return false; }
    if ((e.t === 'esquecer' || e.t === 'subir') && !o.blessing) return false;
  }
  return true;
}

export function chooseCauso(p: Profile, index: number): boolean {
  const run = p.dream.run, pend = run?.pending;
  if (!run || pend?.kind !== 'causo') return false;
  const outcomes = pend.outcomes[index];
  if (!outcomes || !causoAffordable(run, outcomes)) return false;
  for (const o of outcomes) {
    const e = o.effect;
    switch (e.t) {
      case 'vintem': run.vintem = Math.max(0, run.vintem + e.n); break;
      case 'vida': heal(run, e.frac); break;
      case 'pocao': run.potions = Math.max(0, Math.min(potionCap(run), run.potions + e.n)); break;
      case 'bencao': case 'subir': if (o.blessing) giveBlessing(p, run, o.blessing); break;
      case 'esquecer': if (o.blessing) { const at = run.blessings.lastIndexOf(o.blessing); if (at >= 0) run.blessings.splice(at, 1); } break;
      case 'amuleto': if (o.amulet) giveAmulet(p, run, o.amulet); break;
      case 'maldicao': run.curse.hp += e.hp ?? 0; run.curse.damage += e.damage ?? 0; break;
      case 'lembrancas': run.earned += e.n; break;
    }
  }
  run.vintem += cordel(run, 'matuto');
  if (!p.dream.causosSeen.includes(pend.id)) p.dream.causosSeen.push(pend.id);
  run.tally.causos++;
  run.pending = null; run.done = true;
  return true;
}

/* ---------- acordar ---------- */

/** Multiplicador das Lembranças ao acordar: o Mural da Aldeia e o Olho-de-Boi. */
export function memoryBonus(p: Profile, run: DreamRun): number {
  const worn = Object.keys(run.cordeis ?? {}) as CordelId[];
  return (1 + 0.1 * village(p, 'mural')) * (has(run, 'olhoDeBoi') ? 1.3 : 1) * (1 + cordel(run, 'princesa') / 100 + (isFullCordel(worn) ? CORDEL.fullBonus : 0)) * (1 + omenMemories(run.omens));
}

/** Encerra a noite e paga o que ela rendeu: Lembranças, e experiência e ouro da campanha por trecho completo. */
export function wake(p: Profile, how: NightEnd['how'], now: Date = new Date()): NightEnd {
  const run = p.dream.run!;
  const won = how === 'venceu', trechos = run.tally.bosses;
  const memories = Math.round(run.earned * memoryBonus(p, run));
  const xp = Math.round(stageXp(run.level) * DREAM.campaignShare * trechos), gold = Math.round(stageGold(run.level) * DREAM.campaignShare * trechos);
  const D = p.dream;
  D.memories += memories; D.total += memories; D.nights++;
  let talent = false;
  if (won) {
    D.wins++;
    D.bestWeight = Math.max(D.bestWeight ?? 0, omenWeight(run.omens));
    if (!D.weaponsWon.includes(run.weapon)) { D.weaponsWon.push(run.weapon); p.talentPoints += 1; talent = true; }
  }
  p.gold += gold; p.life.gold += gold;
  const up = addXp(p, xp);
  D.run = null;
  const end: NightEnd = {
    won, how, memories, xp, gold, levels: up.levels, talent, trechos, of: run.map.trechos.length, tally: run.tally,
    blessings: run.blessings.slice(), amulets: run.amulets.slice(), weapon: run.weapon, level: run.level, achievements: [],
  };
  end.achievements = checkAchievements(p, now);
  return end;
}

/** Desistir da noite pelo mapa: acorda com o que já juntou. */
export function abandonNight(p: Profile, now: Date = new Date()): NightEnd | null {
  return p.dream.run ? wake(p, 'desistiu', now) : null;
}

/* ---------- Aldeia ---------- */

/** Custo do próximo nível de uma construção, ou nulo se já está no máximo. */
export function buildCost(p: Profile, id: BuildingId): number | null {
  return BUILDINGS[id].levels[village(p, id)]?.cost ?? null;
}

export function build(p: Profile, id: BuildingId): boolean {
  const cost = buildCost(p, id);
  if (cost == null || p.dream.memories < cost) return false;
  p.dream.memories -= cost;
  p.village[id] = village(p, id) + 1;
  return true;
}

export { MAX_POTIONS };

/* ---------- Cordéis e Aspectos (entre as noites) ---------- */

/** Fôlego: o custo total de Cordéis que dá para equipar. */
export function breath(p: Profile): number {
  return CORDEL.breath + CORDEL.breathPerLevel * village(p, 'casaDeCordel');
}

/** Os folhetos equipados que o jogador de fato tem, na ordem, enquanto couberem no Fôlego. */
export function equippedCordeis(p: Profile): CordelId[] {
  const out: CordelId[] = [], max = breath(p);
  for (const id of p.cordeis.equipped) if (CORDEIS[id] && (p.cordeis.levels[id] ?? 0) > 0 && !out.includes(id) && cordelCost([...out, id]) <= max) out.push(id);
  return out;
}

/** Custo, em Lembranças, de comprar o folheto ou de subir um nível (nulo no nível máximo). */
export function cordelNext(p: Profile, id: CordelId): number | null {
  const lv = p.cordeis.levels[id] ?? 0;
  return lv >= 3 ? null : cordelPrice(id, lv + 1);
}

export function buyCordel(p: Profile, id: CordelId): boolean {
  const cost = cordelNext(p, id);
  if (cost == null || p.dream.memories < cost) return false;
  p.dream.memories -= cost;
  p.cordeis.levels[id] = (p.cordeis.levels[id] ?? 0) + 1;
  return true;
}

/** Equipa ou tira um folheto. Não equipa o que não cabe no Fôlego. */
export function toggleCordel(p: Profile, id: CordelId): boolean {
  if (!(p.cordeis.levels[id] ?? 0)) return false;
  const worn = equippedCordeis(p);
  if (worn.includes(id)) { p.cordeis.equipped = worn.filter((c) => c !== id); return true; }
  if (cordelCost([...worn, id]) > breath(p)) return false;
  p.cordeis.equipped = [...worn, id];
  return true;
}

export function buyAspect(p: Profile, id: AspectId): boolean {
  const a = ASPECTS[id];
  if (!a || p.aspects.owned.includes(id) || p.dream.memories < a.cost) return false;
  p.dream.memories -= a.cost;
  p.aspects.owned.push(id);
  p.aspects.equipped[a.weapon] = id;
  return true;
}

/** Põe um Aspecto comprado na arma dele, ou volta ao jeito padrão (nulo). */
export function equipAspect(p: Profile, weapon: WeaponKind, id: AspectId | null): boolean {
  if (id && (!p.aspects.owned.includes(id) || ASPECTS[id].weapon !== weapon)) return false;
  if (id) p.aspects.equipped[weapon] = id; else delete p.aspects.equipped[weapon];
  return true;
}

/* ---------- Roda do Saci ---------- */

type Roda = Extract<Pending, { kind: 'roda' }>;

function makeRoda(run: DreamRun): Roda {
  const r = rng(run, 'roda'), have = patronCounts(run.blessings, null);
  /* os padrinhos da grade: sorteados entre os libertados, puxando para os que o herói já segue */
  const left = run.patrons.slice(), patrons: ElementId[] = [];
  const n = Math.max(1, DREAM.roda.patrons - (omenGrade(run.omens, 'rodaViciada') ? 1 : 0));
  while (patrons.length < n && left.length) {
    let roll = r() * left.reduce((sum, el) => sum + 1 + have[el], 0), at = 0;
    for (let i = 0; i < left.length; i++) { roll -= 1 + have[left[i]]; if (roll <= 0) { at = i; break; } }
    patrons.push(left.splice(at, 1)[0]);
  }
  return {
    kind: 'roda', patrons, grid: null, collected: true, spins: 0, paid: 0, last: null,
    free: (has(run, 'moedaFurada') ? 2 : DREAM.roda.free) + cordel(run, 'fiadoSaci'),
    pulos: DREAM.roda.pulos + (has(run, 'cabacaDoSaci') ? 1 : 0) + cordel(run, 'mocaVento'),
    assobios: (has(run, 'apitoDeTaquara') ? 1 : 0) + cordel(run, 'assobiador'),
  };
}

function roda(p: Profile): { run: DreamRun; w: Roda } | null {
  const run = p.dream.run;
  return run && run.pending?.kind === 'roda' ? { run, w: run.pending } : null;
}

/** Pesos dos símbolos desta Roda (o painel de chances lê daqui). */
export function rodaWeightsOf(run: DreamRun, w: Roda): RodaWeights {
  return rodaWeights(w.patrons, patronCounts(run.blessings, null), omenGrade(run.omens, 'rodaViciada') ? 4 : 0);
}

/** Preço do próximo giro: 0 enquanto houver giro grátis, nulo quando não há mais giros. */
export function rodaCost(run: DreamRun, w: Roda): number | null {
  if (w.free > 0) return 0;
  const base = DREAM.roda.costs[w.paid];
  return base == null ? null : Math.max(1, Math.round(base * (has(run, 'dadoViciado') ? 0.5 : 1)));
}

/** Gira a Roda. O giro anterior precisa ter sido recebido. */
export function spinRoda(p: Profile): boolean {
  const x = roda(p);
  if (!x || (x.w.grid && !x.w.collected)) return false;
  const { run, w } = x, cost = rodaCost(run, w);
  if (cost == null || run.vintem < cost) return false;
  run.vintem -= cost;
  if (w.free > 0) w.free--; else w.paid++;
  const r = rng(run, 'giro'), weights = rodaWeightsOf(run, w);
  let grid = spinGrid(r, weights), forced = false;
  /* Galho de Arruda: o primeiro Olho do giro vira Gorro */
  if (has(run, 'galhoDeArruda')) { const at = grid.indexOf('olho'); if (at >= 0) grid[at] = 'gorro'; }
  /* azar com limite: depois de três giros sem linha, este fecha uma fileira de um padrinho */
  if ((run.dry ?? 0) >= DREAM.roda.pityAfter && !readGrid(grid, w.patrons).lines.length) {
    const row = Math.floor(r() * 3), el = w.patrons[Math.floor(r() * w.patrons.length)];
    grid = grid.slice(); for (let c = 0; c < 3; c++) grid[row * 3 + c] = el;
    forced = true;
  }
  w.grid = grid; w.collected = false; w.spins++;
  w.last = { lines: [], blessings: [], vintem: 0, cursed: false, jackpot: false, forced };
  p.dream.spins = (p.dream.spins ?? 0) + 1;
  return true;
}

/** Pulo: gira de novo uma coluna (0 a 2) do giro que está na mesa. */
export function rodaPulo(p: Profile, col: number): boolean {
  const x = roda(p);
  if (!x || !x.w.grid || x.w.collected || x.w.pulos <= 0 || col < 0 || col > 2) return false;
  x.w.grid = spinGrid(rng(x.run, 'pulo'), rodaWeightsOf(x.run, x.w), x.w.grid, [col, col + 3, col + 6]);
  x.w.pulos--;
  return true;
}

/** Assobio: troca o símbolo de uma casa (0 a 8) por um Gorro. */
export function rodaAssobio(p: Profile, cell: number): boolean {
  const x = roda(p);
  if (!x || !x.w.grid || x.w.collected || x.w.assobios <= 0 || cell < 0 || cell > 8 || x.w.grid[cell] === 'gorro') return false;
  x.w.grid = x.w.grid.slice(); x.w.grid[cell] = 'gorro';
  x.w.assobios--;
  return true;
}

/** Recebe o que o giro na mesa pagou. */
export function collectRoda(p: Profile): RodaPayout | null {
  const x = roda(p);
  if (!x || !x.w.grid || x.w.collected) return null;
  const { run, w } = x, read = readGrid(w.grid!, w.patrons), r = rng(run, 'premio-roda');
  const out: RodaPayout = { lines: read.lines, blessings: [], vintem: 0, cursed: false, jackpot: !!read.jackpot, forced: !!w.last?.forced };
  /* cada padrinho com linha dá uma bênção dele: comum ou melhor com uma linha, rara com duas, épica com três ou mais */
  for (const el of w.patrons) {
    const n = read.patrons[el] ?? 0;
    if (!n) continue;
    const want = n >= 3 ? [3, 2] : n === 2 ? [2, 3] : [];
    let b: BlessingId | undefined;
    for (const tier of want) { b = drawBlessings(run, r, 1, { patron: el, tier }, out.blessings)[0]; if (b) break; }
    b ??= drawBlessings(run, r, 1, { patron: el }, out.blessings)[0] ?? drawBlessings(run, r, 1, {}, out.blessings)[0];
    if (b && giveBlessing(p, run, b)) out.blessings.push(b);
  }
  if (read.vintem) { out.vintem = read.vintem * DREAM.roda.vintemPay; run.vintem += out.vintem; }
  if (read.olho) { out.cursed = true; run.curse.hp += DREAM.roda.curse.hp; run.curse.damage += DREAM.roda.curse.damage; run.doubled = true; }
  /* sorte grande: desperta na hora uma bênção à escolha (ou, sem nenhuma para despertar, mais vinténs) */
  if (read.jackpot) {
    p.dream.jackpots = (p.dream.jackpots ?? 0) + 1;
    const have = blessingCounts(run.blessings), forms: BlessingId[] = [];
    for (const [base, pair] of Object.entries(AWAKENINGS) as [BaseBlessingId, [BlessingId, BlessingId]][]) {
      if (!have[base] || pair.some((f) => have[f])) continue;
      forms.push(pair[Math.floor(r() * 2)]);
    }
    const mine = forms.filter((f) => BLESSINGS[BLESSINGS[f].awakens!].patron === read.jackpot), pool = (mine.length ? mine : forms).slice(0, 3);
    /* a escolha passa na frente da Roda, que volta à tela depois dela */
    if (pool.length) { (run.later ??= []).unshift(w); run.pending = { kind: 'bencao', options: pool }; }
    else { out.vintem += 150; run.vintem += 150; }
  }
  run.dry = read.lines.length ? 0 : (run.dry ?? 0) + 1;
  w.collected = true; w.last = out;
  return out;
}
