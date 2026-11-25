/**
 * Desafios com ranking (docs/gdd/12-online.md):
 *
 * - **Desafio do Dia** (`desafio-AAAAMMDD`): o dia decide tudo, igual para todo mundo: capítulo, monstros,
 *   modificador, arma, feitiços, companheiro e Supremo. O herói é o de referência do nível (equipamento igual).
 * - **Desafio dos Encantados** (`encantados`): os oito Encantados seguidos, com um altar a cada dois.
 *   O jogador escolhe arma, feitiços, companheiro e Supremo; o equipamento é o de referência.
 *
 * Nenhum dos dois depende do save, então o servidor consegue refazer a partida só com a gravação e a escolha do herói.
 * O dia vale no horário de Brasília, para o ranking virar à meia-noite para todos ao mesmo tempo.
 */
import type { WeaponKind } from './items';
import { COMPANIONS, ELEMENT_ORDER, SPELLS, type CompanionId, type ElementId, type SpellId } from './content';
import { EXP_MODS, EXP_MOD_ORDER, applyExpMod, expeditionPool, type ExpModId } from './daily';
import { ARENA, type EliteMod } from './balance';
import { makeRng, pick } from './rng';
import { CHAPTERS, STAGE_BY_ID, TERRAIN, wave, type RoomDef, type StageDef } from './stages';

/** Herói de um desafio: o resto (atributos, equipamento, talentos) é o de referência do nível. */
export interface HeroSpec {
  level: number;
  weapon: WeaponKind;
  spells: (SpellId | null)[];
  companion: CompanionId | null;
  supremo: ElementId | null;
}

export const WEAPONS: WeaponKind[] = ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'];
const SPELL_IDS = Object.keys(SPELLS) as SpellId[];

function hash(text: string): number {
  let v = 2166136261;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return v >>> 0;
}

/** Semente fixa de um desafio: a mesma para todo mundo. */
export function challengeSeed(id: string): number {
  return (hash(`semente|${id}`) | 1) >>> 0;
}

/** Dia no horário de Brasília (UTC−3, sem horário de verão), no formato AAAA-MM-DD. */
export function brDay(d: Date = new Date()): string {
  const t = new Date(d.getTime() - 3 * 3600_000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/** Quanto falta para o próximo dia de Brasília, em segundos. */
export function secondsToNextBrDay(d: Date = new Date()): number {
  const t = d.getTime() - 3 * 3600_000, next = Math.floor(t / 86400_000 + 1) * 86400_000;
  return Math.ceil((next - t) / 1000);
}

/* ---------- Desafio do Dia ---------- */

const DAILY = 'desafio-';
export function isDailyChallengeId(id: string): boolean { return id.startsWith(DAILY); }
export function dailyChallengeId(day: string): string { return DAILY + day.replace(/-/g, ''); }

export interface DailyDef {
  id: string;
  day: string;
  chapter: number;
  level: number;
  mod: ExpModId;
  element: ElementId;
  spec: HeroSpec;
}

/** Tudo o que o dia decide. */
export function dailyChallenge(day: string): DailyDef {
  const id = dailyChallengeId(day), rng = makeRng(hash(`dia|${day}`) | 1);
  const chapter = 1 + Math.floor(rng() * CHAPTERS.length);
  const mid = STAGE_BY_ID.get(`${chapter}-6`), level = mid?.level ?? chapter * 7;
  const mod = pick(rng, EXP_MOD_ORDER.filter((m) => m !== 'horda'));
  const element = pick(rng, ELEMENT_ORDER);
  const own = SPELL_IDS.filter((s) => SPELLS[s].element === element).sort((a, b) => SPELLS[a].unlock - SPELLS[b].unlock);
  const spells: SpellId[] = [];
  const bag = own.slice();
  while (spells.length < 3 && bag.length) spells.push(bag.splice(Math.floor(rng() * bag.length), 1)[0]);
  const companion = pick(rng, Object.keys(COMPANIONS) as CompanionId[]);
  return { id, day, chapter, level, mod, element, spec: { level, weapon: pick(rng, WEAPONS), spells, companion, supremo: element } };
}

/** O Desafio do Dia como fase: três salas de combate, um altar no meio e uma elite no fim. */
export function dailyChallengeStage(id: string): StageDef | null {
  const m = /^desafio-(\d{4})(\d{2})(\d{2})$/.exec(id);
  if (!m) return null;
  const def = dailyChallenge(`${m[1]}-${m[2]}-${m[3]}`), rng = makeRng(hash(`salas|${id}`) | 1);
  const pool = expeditionPool(def.chapter, 12), terrain = TERRAIN[def.chapter];
  if (!pool.length) return null;
  const rooms: RoomDef[] = [];
  for (let i = 0; i < 4; i++) {
    const room: RoomDef = { type: 'combat', waves: [], bg: i % 3, artChapter: def.chapter };
    if (terrain) Object.assign(room, terrain(rng, 6));
    const budget = 6 + 1.25 * Math.min(def.level, 12) + 0.35 * Math.max(0, Math.min(def.level, 24) - 12) + i * 0.9;
    if (i === 3) {
      const kind = pool[pool.length - 1], c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      room.type = 'elite';
      room.waves = [[{ kind, ...c, elite: true, mods: [pick(rng, ['blindado', 'veloz', 'regenerador', 'vampirico'] as EliteMod[])] }, ...wave(rng, pool, budget * 0.4, [c], 0)], wave(rng, pool, budget * 0.5, [], 0.2)];
    } else {
      room.waves = [0, 1, 2].map((w) => wave(rng, pool, budget * (0.44 + w * 0.06), [], w > 0 ? 0.15 : 0));
    }
    applyExpMod(room, def.mod, rng);
    rooms.push(room);
    if (i === 1) rooms.push({ type: 'altar', waves: [], bg: 0, artChapter: def.chapter });
  }
  const chapter = CHAPTERS.find((c) => c.id === def.chapter)!;
  const enemies = rooms.reduce((s, r) => s + r.waves.reduce((a, w) => a + w.length, 0), 0);
  return {
    id, chapter: def.chapter, index: -1, number: 0,
    name: `Desafio do Dia · ${chapter.name}`, intro: EXP_MODS[def.mod].desc,
    level: def.level, rooms, starTime: Math.round((enemies * 1.9 + rooms.length * 8 + 20) / 5) * 5,
    kinds: Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind)))), final: 'elite', map: { x: 0, y: 0 },
  };
}

/* ---------- Desafio dos Encantados ---------- */

export const ENCANTADOS_ID = 'encantados';
/** Nível dos chefes e do herói no Desafio dos Encantados. */
export const ENCANTADOS_LEVEL = 45;
/** As salas de chefe, na ordem dos capítulos: os sete Encantados e o Esquecimento. */
const BOSS_ROOMS = ['1-12', '2-12', '3-12', '4-12', '5-12', '6-12', '7-12', '8-12'];
/** Capítulo de cada chefe do desafio, na ordem. */
export const BOSSES_BY_CHAPTER = BOSS_ROOMS.map((id) => Number(id.split('-')[0]));

export function isEncantadosId(id: string): boolean { return id === ENCANTADOS_ID; }

export function encantadosStage(): StageDef {
  const rooms: RoomDef[] = [];
  BOSS_ROOMS.forEach((sid, i) => {
    const st = STAGE_BY_ID.get(sid)!, boss = st.rooms[st.rooms.length - 1];
    rooms.push({ ...JSON.parse(JSON.stringify(boss)) as RoomDef, level: ENCANTADOS_LEVEL, artChapter: st.chapter });
    if (i % 2 === 1 && i < BOSS_ROOMS.length - 1) rooms.push({ type: 'altar', waves: [], bg: 0, artChapter: st.chapter, level: ENCANTADOS_LEVEL });
  });
  return {
    id: ENCANTADOS_ID, chapter: 8, index: -1, number: 0,
    name: 'Desafio dos Encantados', intro: 'Os oito, um depois do outro. Um altar a cada dois.',
    level: ENCANTADOS_LEVEL, rooms, starTime: 600,
    kinds: Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind)))), final: 'chefao', map: { x: 0, y: 0 },
  };
}

/** Capítulos cuja arte o desafio usa. */
export function challengeChapters(stage: StageDef): number[] {
  return Array.from(new Set(stage.rooms.map((r) => r.artChapter ?? stage.chapter)));
}
