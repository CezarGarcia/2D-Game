/**
 * Retorno diário: missões do dia, bônus de descanso e expedições. Os números estão em src/data/daily.ts.
 *
 * O dia é o do relógio local (AAAA-MM-DD) e vira à meia-noite. A hora vem de `clockNow()`, que os
 * testes trocam com `setClock`. Todas as funções que dependem do dia aceitam a data como argumento.
 */
import { ELEMENTS, SPELLS, blessingCounts, type ElementId, type SpellId } from '../data/content';
import {
  EXPEDITIONS_PER_DAY, EXP_MODS, EXP_MOD_ORDER, EXP_REWARDED_RUNS, EXP_SLOTS, FEW_HITS, MISSIONS, MISSIONS_PER_DAY, MISSION_ORDER,
  chestReward, expeditionBase, expeditionId, expeditionStage, isExpeditionId, missionReward, parseExpeditionId, restCap, restPerDay,
  type ExpModId, type MissionKind,
} from '../data/daily';
import { ELEMENT_ORDER } from '../data/content';
import { ITEM_TYPES, makeItem, rollRarity, sellValue, type Gem, type ItemType } from '../data/items';
import { xpMultiplier } from '../data/progression';
import { makeRng, type Rng } from '../data/rng';
import { CHAPTERS, STAGES, stagesOf, type StageDef } from '../data/stages';
import { findStage, isTowerId } from '../data/tower';
import { addGem, addItem, addXp, allItems, knownSpells, profileRng, refillPotions, type MissionState, type Profile } from './profile';
import { applyOutcome, isForgeUnlocked, isTowerUnlocked, isUnlocked, recordOf, type StageOutcome, type StageRewards } from './rewards';
import { deriveStats } from './stats';

/* ---------- relógio ---------- */

let source: () => Date = () => new Date();
/** Troca a fonte da hora (testes). Sem argumento, volta ao relógio do sistema. */
export function setClock(fn?: () => Date): void { source = fn ?? (() => new Date()); }
export function clockNow(): Date { return source(); }

/** Dia local no formato AAAA-MM-DD. */
export function dayKey(d: Date = clockNow()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dias entre duas chaves de dia (b − a). */
export function daysBetween(a: string, b: string): number {
  const t = (k: string) => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
}

/** Milissegundos até a próxima meia-noite local. */
export function msToMidnight(now: Date = clockNow()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}

function hash(text: string): number {
  let v = 2166136261;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return v >>> 0;
}

function dayRng(p: Profile, day: string, what: string): Rng {
  return makeRng(hash(`${day}|${p.daily.seed}|${what}`) | 1);
}

/* ---------- virada do dia e descanso ---------- */

/**
 * Atualiza o dia: guarda o descanso de quem ficou fora e sorteia as missões novas.
 * Devolve verdadeiro se o perfil mudou (quem chama salva).
 */
export function touchDay(p: Profile, now: Date = clockNow()): boolean {
  const d = p.daily, today = dayKey(now);
  let changed = false;
  if (!d.lastSeen) { d.lastSeen = today; changed = true; }
  else if (d.lastSeen !== today) {
    const away = daysBetween(d.lastSeen, today) - 1;
    if (away >= 1) {
      d.rest = Math.min(restCap(p.level), d.rest + Math.min(away, 30) * restPerDay(p.level));
      d.restDays = away;
    }
    d.lastSeen = today;
    changed = true;
  }
  if (d.day !== today) { rollDay(p, today); changed = true; }
  if (!d.expeditions.length && expeditionsUnlocked(p)) { d.expeditions = makeExpeditions(p, today); changed = d.expeditions.length > 0 || changed; }
  return changed;
}

function rollDay(p: Profile, day: string): void {
  const d = p.daily;
  d.day = day; d.chest = false; d.expRuns = 0; d.expFirst = [];
  d.missions = pickMissions(p, day);
  d.expeditions = expeditionsUnlocked(p) ? makeExpeditions(p, day) : [];
}

export interface RestInfo { pool: number; cap: number; perDay: number; days: number }

export function restInfo(p: Profile): RestInfo {
  return { pool: Math.round(p.daily.rest), cap: restCap(p.level), perDay: restPerDay(p.level), days: p.daily.restDays };
}

/** Gasta o descanso: a experiência ganha vem de novo, até o descanso acabar. */
function spendRest(p: Profile, r: StageRewards): number {
  const bonus = Math.min(Math.round(p.daily.rest), r.xp);
  if (bonus <= 0) return 0;
  p.daily.rest = Math.max(0, p.daily.rest - bonus);
  if (p.daily.rest <= 0) p.daily.restDays = 0;
  const up = addXp(p, bonus);
  r.xp += bonus; r.levels += up.levels; r.spells.push(...up.spells);
  return bonus;
}

/* ---------- missões ---------- */

interface Option { kind: MissionKind; params: (string | number | undefined)[] }

function ownedWeapons(p: Profile): ItemType[] {
  return Array.from(new Set(allItems(p).filter((it) => ITEM_TYPES[it.type].group === 'arma').map((it) => it.type)));
}
function knownElements(p: Profile): ElementId[] {
  return Array.from(new Set(knownSpells(p).map((s) => SPELLS[s].element)));
}

/** O que o jogador consegue fazer hoje, com o que já abriu. */
export function missionOptions(p: Profile): Option[] {
  const els = knownElements(p), weapons = ownedWeapons(p), forge = isForgeUnlocked(p), tower = isTowerUnlocked(p);
  const cleared = CHAPTERS.filter((ch) => stagesOf(ch.id).some((s) => recordOf(p, s.id).cleared)).map((ch) => ch.id);
  const elite = STAGES.some((s) => s.final !== 'normal' && isUnlocked(p, s)) || tower || forge;
  const out: Option[] = [
    { kind: 'vencer', params: [undefined] },
    { kind: 'monstros', params: [undefined] },
    { kind: 'feiticos', params: [undefined] },
    { kind: 'elemento', params: els },
    { kind: 'semPocao', params: [undefined] },
    { kind: 'esquivas', params: [undefined] },
    { kind: 'estrelas', params: [undefined] },
    { kind: 'poucosGolpes', params: [FEW_HITS] },
  ];
  if (cleared.length) out.push({ kind: 'capitulo', params: cleared });
  if (elite) out.push({ kind: 'elite', params: [undefined] });
  if (tower) out.push({ kind: 'torre', params: [undefined] });
  if (forge) out.push({ kind: 'forja', params: [undefined] }, { kind: 'expedicao', params: [undefined] });
  if (p.supremos.length) out.push({ kind: 'supremo', params: [undefined] });
  if (els.length >= 2) out.push({ kind: 'reacoes', params: [undefined] });
  if (weapons.length >= 2) out.push({ kind: 'arma', params: weapons });
  return out.sort((a, b) => MISSION_ORDER.indexOf(a.kind) - MISSION_ORDER.indexOf(b.kind));
}

/** Três missões de grupos diferentes, sorteadas pelo dia e pela semente do perfil. */
export function pickMissions(p: Profile, day: string): MissionState[] {
  const rng = dayRng(p, day, 'missoes'), pool = missionOptions(p), out: MissionState[] = [], groups = new Set<string>();
  while (out.length < MISSIONS_PER_DAY) {
    const left = pool.filter((o) => !groups.has(MISSIONS[o.kind].group));
    if (!left.length) break;
    let roll = rng() * left.reduce((s, o) => s + MISSIONS[o.kind].weight, 0), at = left[0];
    for (const o of left) { roll -= MISSIONS[o.kind].weight; if (roll <= 0) { at = o; break; } }
    const def = MISSIONS[at.kind], tier = Math.floor(rng() * def.targets.length), param = at.params[Math.floor(rng() * at.params.length)];
    groups.add(def.group);
    out.push({ kind: at.kind, ...(param != null ? { param } : {}), target: def.targets[tier], progress: 0, claimed: false, reward: missionReward(p.level, tier, def) });
  }
  return out;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Texto da missão, curto. */
export function missionText(m: MissionState): string {
  const n = m.target;
  switch (m.kind as MissionKind) {
    case 'vencer': return `Vença ${n} ${plural(n, 'fase', 'fases')}`;
    case 'monstros': return `Derrote ${n} monstros`;
    case 'elemento': return `Lance ${n} feitiços de ${ELEMENTS[m.param as ElementId]?.name ?? '?'}`;
    case 'feiticos': return `Lance ${n} feitiços`;
    case 'semPocao': return 'Vença uma fase sem usar poção';
    case 'capitulo': return n === 1 ? `Repita uma fase do capítulo ${m.param}` : `Repita ${n} fases do capítulo ${m.param}`;
    case 'esquivas': return `Faça ${n} esquivas perfeitas`;
    case 'elite': return n === 1 ? 'Vença uma fase com elite ou chefão' : `Vença ${n} fases com elite ou chefão`;
    case 'estrelas': return n === 1 ? 'Vença uma fase com 2 estrelas' : `Vença ${n} fases com 2 estrelas`;
    case 'torre': return `Suba ${n} andares da Torre`;
    case 'forja': return `Use o ferreiro ${n} vezes`;
    case 'expedicao': return n === 1 ? 'Vença uma expedição' : `Vença ${n} expedições`;
    case 'poucosGolpes': return `Vença levando até ${m.param} golpes`;
    case 'supremo': return `Chame o Supremo ${n} vezes`;
    case 'reacoes': return `Cause ${n} reações de elementos`;
    case 'arma': return `Vença ${n === 1 ? 'uma fase' : `${n} fases`} com ${weaponWith(m.param as ItemType)}`;
    default: return '?';
  }
}

function weaponWith(t: ItemType): string {
  const label = ITEM_TYPES[t]?.label.toLowerCase() ?? '?';
  return t === 'peixeiras' ? `as ${label}` : t === 'borduna' || t === 'zagaia' ? `a ${label}` : `o ${label}`;
}

/** Uma linha de ajuda para o tooltip. */
export function missionHint(m: MissionState): string {
  switch (m.kind as MissionKind) {
    case 'capitulo': return `Só vale fase de ${CHAPTERS.find((c) => c.id === m.param)?.name ?? '?'} que você já venceu antes.`;
    case 'elemento': return 'Equipe um feitiço desse elemento na tela de feitiços.';
    case 'semPocao': return 'Qualquer fase, expedição ou subida da Torre vencida conta.';
    case 'estrelas': return 'Na mesma vitória: vencer, sem cair ou no tempo-alvo. Vale fase do mapa.';
    case 'esquivas': return 'Esquive no último instante, quando a marca vermelha vai estourar.';
    case 'poucosGolpes': return 'Golpes que você leva, contados até a fase acabar.';
    case 'elite': return 'Fases com elite ou chefão no fim, a Travessia das expedições e subidas da Torre.';
    case 'forja': return 'Aprimorar, fundir, encantar ou reforjar. Falhar também conta.';
    case 'torre': return 'Andares vencidos em qualquer subida.';
    case 'supremo': return 'Tecla T quando a carga do Encantado enche.';
    case 'reacoes': return 'Um elemento em cima de um inimigo já tomado por outro.';
    case 'arma': return 'Troque a arma no herói antes de jogar.';
    default: return 'Vale qualquer fase, expedição ou subida da Torre.';
  }
}

export function missionDone(m: MissionState): boolean { return m.progress >= m.target; }

/** Missões prontas e o baú, para a bolinha da barra de ícones. */
export function claimableCount(p: Profile): number {
  const d = p.daily;
  return d.missions.filter((m) => missionDone(m) && !m.claimed).length + (chestReady(p) ? 1 : 0);
}

export function chestReady(p: Profile): boolean {
  const d = p.daily;
  return !d.chest && d.missions.length > 0 && d.missions.every(missionDone);
}

export type Reward = { gold: number; mata: number; po: number; tomo: number; gem?: Gem };

function give(p: Profile, r: Reward): void {
  p.gold += r.gold; p.materials.mata += r.mata; p.materials.po += r.po; p.materials.tomo += r.tomo;
  if (r.gem) addGem(p, r.gem);
}

export function claimMission(p: Profile, index: number): Reward | null {
  const m = p.daily.missions[index];
  if (!m || m.claimed || !missionDone(m)) return null;
  m.claimed = true;
  give(p, m.reward);
  return { ...m.reward };
}

/** Baú das três missões: ouro, materiais e uma gema do capítulo mais adiantado. */
export function chestPreview(p: Profile): Reward {
  const top = CHAPTERS.filter((ch) => stagesOf(ch.id).some((s) => isUnlocked(p, s))).length || 1;
  return { ...chestReward(p.level), gem: { el: 'natureza', lvl: Math.min(4, 1 + Math.floor((top - 1) / 2)) } };
}

export function claimChest(p: Profile): Reward | null {
  if (!chestReady(p)) return null;
  const r = chestPreview(p), rng = profileRng(p);
  r.gem = { el: ELEMENT_ORDER[Math.floor(rng() * ELEMENT_ORDER.length)], lvl: r.gem!.lvl };
  p.daily.chest = true;
  give(p, r);
  return r;
}

function bump(p: Profile, kind: MissionKind, n: number, test?: (m: MissionState) => boolean): void {
  if (n <= 0) return;
  for (const m of p.daily.missions) if (m.kind === kind && !missionDone(m) && (!test || test(m))) m.progress = Math.min(m.target, m.progress + n);
}

/** Uma ação no ferreiro (aprimorar, fundir, encantar ou reforjar). */
export function recordForge(p: Profile, now: Date = clockNow()): void {
  touchDay(p, now);
  bump(p, 'forja', 1);
}

/* ---------- contagem da partida ---------- */

/** O que a cena conta durante a fase, além do que a simulação já guarda. */
export interface RunTally {
  potions: number;
  casts: number;
  castsBy: Partial<Record<ElementId, number>>;
  supremos: number;
  reactions: number;
}

export function newTally(): RunTally { return { potions: 0, casts: 0, castsBy: {}, supremos: 0, reactions: 0 }; }

/** Soma um evento da simulação à contagem. */
export function countEvent(t: RunTally, e: { type: string; kind?: string }): void {
  if (e.type === 'potion') t.potions++;
  else if (e.type === 'cast' && e.kind && e.kind in SPELLS) {
    const el = SPELLS[e.kind as SpellId].element;
    t.casts++; t.castsBy[el] = (t.castsBy[el] ?? 0) + 1;
  } else if (e.type === 'supremo' && e.kind && e.kind in ELEMENTS) t.supremos++;
  else if (e.type === 'reaction') t.reactions++;
}

interface RunContext { stage: StageDef | undefined; wasCleared: boolean; weapon: ItemType }

function trackStage(p: Profile, o: StageOutcome, r: StageRewards, ctx: RunContext): number[] {
  const before = p.daily.missions.map(missionDone), t = o.tally;
  const stage = ctx.stage, campaign = !!stage && stage.index >= 0, exp = isExpeditionId(o.stageId);
  const runStars = stage && campaign ? [true, o.deaths === 0, o.time <= stage.starTime].filter(Boolean).length : 0;
  const won = o.won;
  bump(p, 'vencer', won ? 1 : 0);
  bump(p, 'monstros', o.kills);
  bump(p, 'esquivas', o.perfects);
  if (t) {
    bump(p, 'feiticos', t.casts);
    for (const el of Object.keys(t.castsBy) as ElementId[]) bump(p, 'elemento', t.castsBy[el] ?? 0, (m) => m.param === el);
    bump(p, 'supremo', t.supremos);
    bump(p, 'reacoes', t.reactions);
    bump(p, 'semPocao', won && t.potions === 0 ? 1 : 0);
  }
  bump(p, 'capitulo', won && campaign && ctx.wasCleared ? 1 : 0, (m) => m.param === stage?.chapter);
  bump(p, 'elite', won && !!stage && stage.final !== 'normal' ? 1 : 0);
  bump(p, 'estrelas', won && runStars >= 2 ? 1 : 0);
  bump(p, 'torre', r.tower?.floors ?? 0);
  bump(p, 'expedicao', won && exp ? 1 : 0);
  bump(p, 'poucosGolpes', won ? 1 : 0, (m) => o.hitsTaken <= Number(m.param ?? FEW_HITS));
  bump(p, 'arma', won ? 1 : 0, (m) => m.param === ctx.weapon);
  return p.daily.missions.map((m, i) => (missionDone(m) && !before[i] ? i : -1)).filter((i) => i >= 0);
}

/* ---------- expedições ---------- */

/** As expedições abrem com o ferreiro (fase 1-2): são o caminho do material de forja. */
export function expeditionsUnlocked(p: Profile): boolean { return isForgeUnlocked(p); }

/** Capítulos com pelo menos duas fases vencidas, e a fase mais adiantada de cada um. */
function expeditionChapters(p: Profile): { chapter: number; upto: number }[] {
  const out: { chapter: number; upto: number }[] = [];
  for (const ch of CHAPTERS) {
    const won = stagesOf(ch.id).filter((s) => recordOf(p, s.id).cleared);
    if (won.length >= 2) out.push({ chapter: ch.id, upto: Math.max(...won.map((s) => s.number)) });
  }
  return out;
}

/** Nível da expedição: o do jogador, sem passar da fase mais difícil já liberada nem ficar abaixo do capítulo. */
export function expeditionLevel(p: Profile, chapter: number): number {
  const open = STAGES.filter((s) => isUnlocked(p, s)), top = open.length ? Math.max(...open.map((s) => s.level)) : 1;
  const min = stagesOf(chapter)[0]?.level ?? 1;
  return Math.max(min, Math.min(p.level, Math.max(min, top), 60));
}

export function makeExpeditions(p: Profile, day: string): string[] {
  const chapters = expeditionChapters(p);
  if (!chapters.length) return [];
  const rng = dayRng(p, day, 'expedicoes'), used = new Set<number>(), mods = new Set<ExpModId>(), out: string[] = [];
  for (let slot = 0; slot < EXPEDITIONS_PER_DAY; slot++) {
    /* metade das vezes o capítulo mais adiantado; a outra expedição tenta um capítulo diferente */
    const free = chapters.filter((c) => !used.has(c.chapter)), list = free.length ? free : chapters;
    const ch = slot === 0 && rng() < 0.5 ? list[list.length - 1] : list[Math.floor(rng() * list.length)];
    used.add(ch.chapter);
    const fit = EXP_MOD_ORDER.filter((m) => !mods.has(m) && !(EXP_MODS[m].skip ?? []).includes(ch.chapter) && p.level >= (EXP_MODS[m].minLevel ?? 0));
    const mod = fit[Math.floor(rng() * fit.length)] ?? 'veloz';
    mods.add(mod);
    out.push(expeditionId({ day, slot, chapter: ch.chapter, upto: ch.upto, level: expeditionLevel(p, ch.chapter), mod }));
  }
  return out;
}

export interface ExpeditionInfo {
  id: string; slot: number; stage: StageDef; mod: ExpModId; chapter: number; level: number;
  /** Já venceu esta hoje (a primeira vitória paga em dobro). */
  firstDone: boolean;
}

export function expeditionsToday(p: Profile, now: Date = clockNow()): ExpeditionInfo[] {
  touchDay(p, now);
  return p.daily.expeditions.map((id) => {
    const k = parseExpeditionId(id), stage = expeditionStage(id);
    return k && stage ? { id, slot: k.slot, stage, mod: k.mod, chapter: k.chapter, level: k.level, firstDone: p.daily.expFirst.includes(k.slot) } : null;
  }).filter((e): e is ExpeditionInfo => !!e);
}

export function expeditionRunsLeft(p: Profile): number { return Math.max(0, EXP_REWARDED_RUNS - p.daily.expRuns); }

export interface ExpeditionResult { slot: number; mod: ExpModId; first: boolean; rewarded: boolean; runsLeft: number }

function blankRewards(won: boolean): StageRewards {
  return {
    won, xp: 0, gold: 0, xpMult: 1, goldMult: 1, firstClear: false, items: [], soldOverflow: [], named: null, namedChance: 0,
    materials: { mata: 0, po: 0, lagrima: 0, tomo: 0 }, stars: [false, false, false], newStars: 0, bestTime: false,
    levels: 0, spells: [], rescued: null, supremo: null, gems: [], credits: false, talentPoints: 0, starChest: null,
  };
}

/** Resultado de uma expedição. Só as de hoje pagam ouro e material, e só as três primeiras vitórias. */
export function applyExpeditionOutcome(p: Profile, o: StageOutcome): { rewards: StageRewards; result: ExpeditionResult } {
  const k = parseExpeditionId(o.stageId)!, stage = expeditionStage(o.stageId)!, d = p.daily;
  const stats = deriveStats(p), bl = blessingCounts(o.blessings ?? []), rng = profileRng(p);
  const today = d.expeditions.includes(o.stageId), rewarded = today && d.expRuns < EXP_REWARDED_RUNS;
  const first = o.won && today && !d.expFirst.includes(k.slot);
  const progress = o.won ? 1 : (Math.max(0, o.roomsCleared) / stage.rooms.length) * 0.4;
  const base = expeditionBase(k.level, k.slot, k.mod), xpMult = xpMultiplier(p.level, k.level);
  const r = blankRewards(o.won);
  r.xpMult = xpMult;
  r.xp = Math.round(base.xp * xpMult * progress * stats.xpMult * (1 + 0.25 * (bl.sabedoria ?? 0)));
  let gold = rewarded ? Math.round(base.gold * progress * stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0)) * (first ? 1.5 : 1)) : 0;
  if (o.won && rewarded) {
    const mat = p.talents.catador ? 1.5 : 1;
    r.materials.mata = Math.round(base.mata * (first ? 2 : 1) * mat);
    r.materials.po = Math.round(base.po * mat);
    r.materials.tomo = first ? 1 : 0;
    d.expRuns++;
  }
  if (first) {
    d.expFirst.push(k.slot);
    const it = makeItem(p.nextItemId++, rng, k.level, Math.max(k.slot, rollRarity(rng, k.chapter, stats.luck)), undefined, k.chapter);
    if (addItem(p, it)) r.items.push(it);
    else { const g = sellValue(it); gold += g; r.soldOverflow.push({ item: it, gold: g }); }
  }
  r.gold = gold;
  p.gold += gold;
  p.materials.mata += r.materials.mata; p.materials.po += r.materials.po; p.materials.tomo += r.materials.tomo;
  const up = addXp(p, r.xp);
  r.levels = up.levels; r.spells = up.spells;
  refillPotions(p);
  return { rewards: r, result: { slot: k.slot, mod: k.mod, first, rewarded: o.won && rewarded, runsLeft: expeditionRunsLeft(p) } };
}

/* ---------- fim de fase ---------- */

export interface DailyNews {
  /** Experiência a mais pelo descanso, e o que sobrou dele. */
  rest: number; restLeft: number;
  /** Missões que ficaram prontas nesta partida (índices). */
  missions: number[];
  expedition?: ExpeditionResult;
}

export type SettledRewards = StageRewards & { daily?: DailyNews };

/** Aplica o resultado de qualquer partida (fase, Torre ou expedição) e o que ele muda no diário. */
export function settleStage(p: Profile, o: StageOutcome, now: Date = clockNow()): SettledRewards {
  touchDay(p, now);
  const stage = findStage(o.stageId), wasCleared = !isTowerId(o.stageId) && recordOf(p, o.stageId).cleared;
  const weapon = p.equipped.arma?.type ?? 'facao';
  let expedition: ExpeditionResult | undefined, r: StageRewards;
  if (isExpeditionId(o.stageId) && stage) { const res = applyExpeditionOutcome(p, o); r = res.rewards; expedition = res.result; }
  else r = applyOutcome(p, o);
  const rest = spendRest(p, r);
  const missions = trackStage(p, o, r, { stage, wasCleared, weapon });
  return Object.assign(r, { daily: { rest, restLeft: Math.round(p.daily.rest), missions, expedition } });
}

export { EXP_SLOTS };
