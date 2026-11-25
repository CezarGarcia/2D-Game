/**
 * Regras do Sonho (docs/gdd/09): a noite em andamento e tudo o que a move. Os números e o mapa estão em src/data/dream.ts.
 *
 * A noite fica em `p.dream.run`, guardada entre um nó e outro. Um nó de luta (combate, elite, provação, chefe)
 * ou de altar vira uma fase de uma sala só; Feira, Fonte e Causo são telas. Cada função aqui altera o perfil
 * recebido e devolve o que a tela precisa mostrar; quem chama decide quando salvar.
 */
import { AMULETS, AMULET_ORDER, AMULET_RARITY, type AmuletId, type AmuletRarity } from '../data/amulets';
import { CAUSOS, CAUSO_ORDER, type CausoId, type DreamEffect } from '../data/causos';
import {
  BLESSINGS, BLESSING_ORDER, BLESSING_WEIGHT, MAX_POTIONS, STAGE_ONLY_BLESSINGS, blessingCounts, patronTier, patronCounts,
  type BaseBlessingId, type BlessingId, type CompanionId, type ElementId, type SpellId,
} from '../data/content';
import { DREAM, dreamNight, nextNodes, nodeStageId, type DreamNode, type Night, type NodeKind, type Trecho } from '../data/dream';
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
import { deriveStats, referenceProfile, type HeroStats } from './stats';

/* ---------- o estado de uma noite ---------- */

/** O que um efeito de causo vai dar de fato, já sorteado ao abrir o causo (para a tela dizer antes de o jogador escolher). */
export interface Resolved { effect: DreamEffect; blessing?: BlessingId; amulet?: AmuletId }

export type Pending =
  /** Escolher um amuleto (elite, provação ou chefe vencido). */
  | { kind: 'amuleto'; options: AmuletId[] }
  /** Escolher uma bênção (o Rancho, no começo da noite). */
  | { kind: 'bencao'; options: BlessingId[] }
  /** Na Feira: o que ainda está à venda (nulo = já levado). */
  | { kind: 'feira'; blessings: (BlessingId | null)[]; amulets: (AmuletId | null)[]; healed: boolean; rerolls: number }
  | { kind: 'fonte' }
  | { kind: 'causo'; id: CausoId; outcomes: Resolved[][] };

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

export interface NightChoice { weapon: WeaponKind; spells: (SpellId | null)[]; companion: CompanionId | null; supremo: ElementId | null }

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
export function dreamProfile(level: number, c: NightChoice): Profile {
  const key = JSON.stringify([level, c]), hit = profiles.get(key);
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
  if (profiles.size > 12) profiles.clear();
  profiles.set(key, p);
  return p;
}

export function runProfile(run: DreamRun): Profile {
  return dreamProfile(run.level, { weapon: run.weapon, spells: run.spells, companion: run.companion, supremo: run.supremo });
}
export function runStats(run: DreamRun): HeroStats {
  return deriveStats(runProfile(run), run.blessings, run.amulets);
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
  const map = dreamNight(s, { chapters, patrons, level: p.level, short: p.dream.nights === 0 });
  const run: DreamRun = {
    seed: s, level: p.level, weapon: c.weapon, spells: [0, 1, 2].map((i) => c.spells[i] ?? null), companion: c.companion, supremo: c.supremo, patrons,
    map, trecho: 0, at: null, done: false, path: map.trechos.map(() => []),
    blessings: [], amulets: [], vintem: 0, hpFrac: 1, potions: 0, charge: 0, revives: 0, altarDry: 0,
    curse: { hp: 0, damage: 0 }, earned: 0,
    tally: { rooms: 0, elites: 0, bosses: 0, trials: 0, kills: 0, time: 0, causos: 0, altars: 0 },
    pending: null, rolls: 0, seven: false,
  };
  run.potions = potionCap(run);
  /* o Rancho: vinténs, um amuleto comum e uma bênção comum à escolha */
  const rancho = village(p, 'rancho');
  if (rancho >= 1) run.vintem += 30;
  if (rancho >= 2) for (const a of drawAmulets(run, rng(run, 'rancho'), 1, 'comum')) giveAmulet(p, run, a);
  if (rancho >= 3) { const options = drawBlessings(run, rng(run, 'rancho-bencao'), 3, { tier: 1 }); if (options.length) run.pending = { kind: 'bencao', options }; }
  p.dream.run = run;
  return run;
}

/* ---------- entrar num nó ---------- */

export type Entered = { stage: string } | { panel: 'feira' | 'fonte' | 'causo' } | null;

/** O que a cena precisa para montar a sala do nó atual. */
export interface DreamContext {
  profile: Profile;
  amulets: AmuletId[];
  carry: Carry;
  foes: { hp: number; damage: number };
  /** Para o HUD: trecho, total de trechos e vinténs. */
  trecho: number; of: number; vintem: number;
}

export function dreamContext(run: DreamRun): DreamContext {
  const node = currentNode(run), trial = node?.kind === 'provacao' && has(run, 'chapeuDeCouro');
  return {
    profile: runProfile(run), amulets: run.amulets.slice(),
    carry: { blessings: run.blessings.slice(), hpFrac: Math.max(0.01, run.hpFrac * (trial ? 0.7 : 1)), potions: run.potions, altarDry: run.altarDry, revives: run.revives, supremo: run.charge },
    foes: { hp: 1 + run.curse.hp, damage: 1 + run.curse.damage },
    trecho: run.trecho + 1, of: run.map.trechos.length, vintem: run.vintem,
  };
}

/** Fase do nó em que o herói está (nulo se o nó é uma tela, não uma sala). */
export function currentStageId(run: DreamRun): string | null {
  const node = currentNode(run);
  if (!node || node.kind === 'feira' || node.kind === 'fonte' || node.kind === 'causo') return null;
  return nodeStageId(run.map, currentTrecho(run), node, node.kind === 'altar' && has(run, 'ferraduraVirada') ? 'F' : '');
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
}

/** Aplica o resultado da sala do nó atual (combate, elite, provação, chefe ou altar). */
export function settleNode(p: Profile, o: StageOutcome, now: Date = new Date()): NodeResult | null {
  const run = p.dream.run, node = run ? currentNode(run) : null;
  if (!run || !node || run.done) return null;
  const kind = node.kind, out: NodeResult = { kind, won: o.won, vintem: 0, memories: 0, trial: null, end: null };
  recordTally(p, o);
  run.tally.kills += o.kills; run.tally.time += Math.max(0, o.time);
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
    run.done = true;
    return out;
  }
  if (!o.won) { out.end = wake(p, o.deaths > 0 ? 'caiu' : 'desistiu', now); return out; }

  if (o.left) {
    run.hpFrac = Math.max(0.01, Math.min(1, o.left.hpFrac)); run.charge = o.left.supremo; run.revives = o.left.revives;
    run.potions = Math.min(potionCap(run), o.left.potions + (has(run, 'moringa') ? 1 : 0));
  }
  run.tally.rooms++;
  out.vintem = Math.round((DREAM.vintem[kind] ?? 0) * (has(run, 'peDeMeia') ? 1.5 : 1)) + (o.chests ?? 0) * DREAM.vintem.perChest;
  run.vintem += out.vintem;
  let memories = DREAM.memories[kind] ?? 0;
  if (kind === 'provacao') {
    /* "três castigos" não tem regra além de vencer; as outras duas dependem de como o desafio da sala terminou */
    const passed = node.trial === 'tres' || o.trial === 'vencido';
    out.trial = passed;
    if (passed) { run.tally.trials++; p.dream.trials++; if (has(run, 'chapeuDeCouro')) memories *= 3; }
    else { memories = 0; run.hpFrac = Math.max(0.01, run.hpFrac * DREAM.trialFail); }
  }
  out.memories = memories;
  run.earned += memories;
  const r = rng(run, 'premio');
  if (kind === 'elite') { run.tally.elites++; const options = drawAmulets(run, r, 2); if (options.length) run.pending = { kind: 'amuleto', options }; }
  if (kind === 'provacao' && out.trial) { const options = [...drawAmulets(run, r, 1, 'raro'), ...drawAmulets(run, r, 1)].filter((a, i, all) => all.indexOf(a) === i); if (options.length) run.pending = { kind: 'amuleto', options }; }
  run.done = true;
  if (kind === 'chefe') {
    run.tally.bosses++;
    p.dream.bestTrecho = Math.max(p.dream.bestTrecho, run.trecho + 1);
    if (run.trecho >= run.map.trechos.length - 1) { out.end = wake(p, 'venceu', now); return out; }
    run.hpFrac = has(run, 'velaBenta') ? 1 : Math.min(1, run.hpFrac + DREAM.bossHeal);
    const options = drawAmulets(run, r, 3);
    if (options.length) run.pending = { kind: 'amuleto', options };
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
  run.pending = null;
  return a;
}

/** Escolhe uma das bênçãos oferecidas fora de um altar (a do Rancho). */
export function chooseBlessingOffer(p: Profile, index: number): BlessingId | null {
  const run = p.dream.run, pend = run?.pending;
  if (!run || pend?.kind !== 'bencao') return null;
  const b = pend.options[index] ?? null;
  if (b) giveBlessing(p, run, b);
  run.pending = null;
  return b;
}

/* ---------- Feira ---------- */

export function feiraPrice(run: DreamRun, what: 'bencao' | 'amuleto' | 'cura' | 'trocar' | 'tirar', id?: BlessingId | AmuletId): number {
  const off = has(run, 'bolsaDeMascate') ? 0.75 : 1, P = DREAM.price;
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
  x.run.vintem -= cost; x.f.blessings[index] = null;
  return true;
}

export function buyAmulet(p: Profile, index: number): boolean {
  const x = feira(p), id = x?.f.amulets[index];
  if (!x || !id) return false;
  const cost = feiraPrice(x.run, 'amuleto', id);
  if (x.run.vintem < cost) return false;
  x.run.vintem -= cost; x.f.amulets[index] = null;
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
  fresh.healed = x.f.healed;
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
  const run = p.dream.run;
  if (!run || !run.pending || run.pending.kind === 'causo' || run.pending.kind === 'amuleto' || run.pending.kind === 'bencao') return false;
  run.pending = null; run.done = true;
  return true;
}

/* ---------- Fonte ---------- */

/** Quanto a Fonte cura nesta noite (a Figa Torta seca a Fonte; a Rede de Dormir enche tudo). */
export function fountainHeal(run: DreamRun): number {
  return has(run, 'figaTorta') ? 0 : has(run, 'redeDeDormir') ? 1 : DREAM.fountainHeal;
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
  if (!p.dream.causosSeen.includes(pend.id)) p.dream.causosSeen.push(pend.id);
  run.tally.causos++;
  run.pending = null; run.done = true;
  return true;
}

/* ---------- acordar ---------- */

/** Multiplicador das Lembranças ao acordar: o Mural da Aldeia e o Olho-de-Boi. */
export function memoryBonus(p: Profile, run: DreamRun): number {
  return (1 + 0.1 * village(p, 'mural')) * (has(run, 'olhoDeBoi') ? 1.3 : 1);
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
