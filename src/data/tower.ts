/**
 * Torre dos Cem Andares (docs/gdd/01 e 07). Cada andar é uma sala; uma corrida sobe 10 andares a partir
 * do último marco (1, 11, 21…), com uma sala de altar no meio e um chefe no décimo andar.
 * O nível e os monstros sobem com o andar e passam pelos capítulos em ordem. Os andares são fixos
 * (saem de uma semente por andar), para o tempo do ranking ser comparável.
 */
import { ARENA, isBossKind } from './balance';
import { BOSSES, type BossKind } from './bestiary';
import { expeditionStage, isExpeditionId } from './daily';
import { dreamStage, isDreamId } from './dream';
import { makeRng } from './rng';
import { isTrainingId, trainingStage } from './training';
import { STAGES, STAGE_BY_ID, TERRAIN, wave, type RoomDef, type StageDef } from './stages';

export const TOWER_FLOORS = 100;
export const FLOORS_PER_RUN = 10;

export function towerLevel(floor: number): number {
  return Math.min(60, 3 + Math.round(floor * 0.57));
}
export function towerChapter(floor: number): number {
  return Math.min(8, 1 + Math.floor((floor - 1) / 12.5));
}

/** Monstros comuns de um capítulo (sem chefes). */
function poolOf(chapter: number): StageDef['kinds'] {
  const kinds = new Set<StageDef['kinds'][number]>();
  for (const s of STAGES) if (s.chapter === chapter) for (const k of s.kinds) if (!isBossKind(k) && !['caipora', 'curupira', 'boto', 'iara'].includes(k)) kinds.add(k);
  return [...kinds];
}

const CHAPTER_BOSSES: Record<number, BossKind[] | string[]> = {
  1: ['caipora', 'curupira'], 2: ['boto', 'iara'], 3: ['corposeco', 'saci'], 4: ['mula', 'boitata'],
  5: ['capelobo', 'mapinguari'], 6: ['teiniagua', 'lobisomem'], 7: ['pisadeira', 'cuca'], 8: ['ecos', 'esquecimento'],
};

function floorRoom(floor: number): RoomDef {
  const rng = makeRng(90001 + floor * 131), chapter = towerChapter(floor), level = towerLevel(floor);
  const room: RoomDef = { type: 'combat', waves: [], bg: floor % 3, level, floor, artChapter: chapter };
  const t = TERRAIN[chapter];
  if (floor % 10 === 0) {
    const list = CHAPTER_BOSSES[chapter], kind = list[(floor / 10) % 2 === 1 ? 0 : 1] as StageDef['kinds'][number];
    room.type = 'boss';
    room.waves = [[{ kind, x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.72), y: Math.round((ARENA.y0 + ARENA.y1) / 2), elite: true }]];
    if (t) { const tt = t(rng, 11); if (tt.dark) room.dark = true; if (tt.moon) room.moon = true; }
    return room;
  }
  if (t) Object.assign(room, t(rng, 6));
  if (chapter === 2) room.puddles = [{ x: 500 + Math.round(rng() * 300), y: 300 + Math.round(rng() * 200), r: 90 }];
  const budget = 8 + floor * 0.16, pool = poolOf(chapter);
  room.waves = [wave(rng, pool, budget, [], 0.2), wave(rng, pool, budget * 1.1, [], 0.35)];
  return room;
}

/** Uma corrida da Torre como se fosse uma fase: 10 andares e um altar depois do quinto. */
export function towerRun(start: number): StageDef {
  const first = Math.max(1, Math.min(TOWER_FLOORS - FLOORS_PER_RUN + 1, start));
  const rooms: RoomDef[] = [];
  for (let f = first; f < first + FLOORS_PER_RUN; f++) {
    rooms.push(floorRoom(f));
    if (f === first + 4) rooms.push({ type: 'altar', waves: [], bg: 0, artChapter: towerChapter(f), level: towerLevel(f) });
  }
  const last = first + FLOORS_PER_RUN - 1, enemies = rooms.reduce((a, r) => a + r.waves.flat().length, 0);
  return {
    id: `torre-${first}`, chapter: 0, index: -1, number: first,
    name: `Torre · andares ${first} a ${last}`, intro: 'Dez andares e um chefe no último. Cair encerra a subida, mas os andares vencidos ficam.',
    level: towerLevel(last), rooms, starTime: Math.round((enemies * 1.9 + rooms.length * 8 + 90) / 5) * 5,
    kinds: Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind)))), final: 'chefao', map: { x: 0, y: 0 },
  };
}

export function isTowerId(id: string): boolean { return id.startsWith('torre-'); }

/** Fase, corrida da Torre ou expedição pelo identificador. */
export function findStage(id: string): StageDef | undefined {
  if (isTrainingId(id)) return trainingStage(id);
  if (isDreamId(id)) return dreamStage(id) ?? undefined;
  return isTowerId(id) ? towerRun(Number(id.slice(6))) : isExpeditionId(id) ? expeditionStage(id) ?? undefined : STAGE_BY_ID.get(id);
}

/** Capítulos cuja arte uma fase usa (a Torre mistura). */
export function artChaptersOf(stage: StageDef): number[] {
  return Array.from(new Set(stage.rooms.map((r) => r.artChapter ?? stage.chapter)));
}

export { BOSSES };
