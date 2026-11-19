/**
 * As 12 fases do Capítulo 1 (Mata Atlântica). As salas de cada fase são fixas: saem de uma
 * semente por fase, então todo jogador encontra a mesma sequência e os tempos são comparáveis.
 */
import { ARENA, type EliteMod, type EnemyKind, type SpawnDef } from './balance';
import type { CompanionId } from './content';
import type { ItemType } from './items';
import { stageLevel } from './progression';
import { makeRng, pick, type Rng } from './rng';

export type RoomType = 'combat' | 'altar' | 'elite' | 'boss';
export interface RoomDef { type: RoomType; waves: SpawnDef[][]; bg: number }

export interface StageDef {
  id: string;
  chapter: number;
  /** Índice global da fase (0 = 1-1). */
  index: number;
  number: number;
  name: string;
  intro: string;
  level: number;
  rooms: RoomDef[];
  /** Tempo-alvo da terceira estrela, em segundos. */
  starTime: number;
  kinds: EnemyKind[];
  final: 'normal' | 'elite' | 'chefao';
  /** Item com nome que só cai aqui, e a chance em porcento. */
  named?: { unique: string; chance: number };
  rescue?: CompanionId;
  /** Itens garantidos na primeira vitória. */
  firstClear?: ItemType[];
}

interface Plan {
  name: string; intro: string; pool: EnemyKind[]; rooms: number;
  elite?: { kind: EnemyKind; mods: EliteMod[] };
  boss?: EnemyKind;
  named?: { unique: string; chance: number };
  rescue?: CompanionId;
  firstClear?: ItemType[];
}

const PLANS: Plan[] = [
  { name: 'A Trilha', intro: 'Saúvas cinzentas tomaram a trilha de entrada da mata.', pool: ['sauva'], rooms: 4, firstClear: ['escudo'] },
  { name: 'O Formigueiro', intro: 'O chão está furado de túneis, e algo cospe das moitas.', pool: ['sauva', 'cuspidor'], rooms: 5, named: { unique: 'mandibulaDaRainha', chance: 4 }, firstClear: ['arco', 'aljava'] },
  { name: 'Rastro de Queixada', intro: 'Marcas fundas de casco. Elas correm em linha reta, e não param.', pool: ['sauva', 'cuspidor', 'queixada'], rooms: 5 },
  { name: 'A Gaiola', intro: 'Alguém prendeu um bicho numa gaiola de cipó no fim da trilha.', pool: ['sauva', 'queixada', 'cogumelo'], rooms: 5, rescue: 'capivara' },
  { name: 'O Tronco que Anda', intro: 'Um toco velho se levantou. Ele só sente golpe depois que bate.', pool: ['sauva', 'cogumelo', 'cuspidor'], rooms: 5, elite: { kind: 'tronco', mods: ['blindado'] } },
  { name: 'Galhos que Olham', intro: 'Nem todo galho quebrado é galho. Alguns abrem os olhos.', pool: ['urutau', 'sauva', 'cuspidor'], rooms: 6 },
  { name: 'Chuva de Esporos', intro: 'Os cogumelos incham quando chegam perto. Não deixe chegarem.', pool: ['cogumelo', 'urutau', 'queixada'], rooms: 6, elite: { kind: 'queixada', mods: ['veloz'] } },
  { name: 'Mata Fechada', intro: 'A mata fecha. Tudo o que você já enfrentou está aqui junto.', pool: ['sauva', 'cuspidor', 'queixada', 'cogumelo', 'urutau'], rooms: 6, elite: { kind: 'tronco', mods: ['blindado', 'regenerador'] } },
  { name: 'A Toca', intro: 'Um miado fraco vem de dentro. Não caia, ou o filhote foge.', pool: ['urutau', 'queixada', 'cogumelo', 'sauva'], rooms: 6, elite: { kind: 'sauva', mods: ['veloz', 'vampirico'] }, rescue: 'onca' },
  { name: 'Clareira Antiga', intro: 'Pedras de um tempo em que ainda lembravam do guardião.', pool: ['sauva', 'cuspidor', 'queixada', 'cogumelo', 'urutau'], rooms: 7, elite: { kind: 'queixada', mods: ['veloz', 'explosivo'] } },
  { name: 'O Chamado da Caipora', intro: 'Ela vem montada, e a mata abre caminho para ela.', pool: ['sauva', 'queixada', 'urutau', 'cogumelo'], rooms: 5, boss: 'caipora', named: { unique: 'presaDaCaipora', chance: 3 } },
  { name: 'O Curupira', intro: 'As pegadas apontam para o lado errado. Leia o aviso, não o rastro.', pool: ['sauva', 'urutau', 'cogumelo'], rooms: 4, boss: 'curupira', named: { unique: 'coroaDeCipo', chance: 2 } },
];

const COST: Record<EnemyKind, number> = { sauva: 1, cogumelo: 1.4, cuspidor: 1.8, urutau: 1.8, queixada: 2.6, tronco: 4, caipora: 99, curupira: 99 };
const CAP: Partial<Record<EnemyKind, number>> = { queixada: 1, cuspidor: 2, tronco: 1, urutau: 3, cogumelo: 3 };

function place(rng: Rng, kind: EnemyKind, used: { x: number; y: number }[]): { x: number; y: number } {
  const w = ARENA.x1 - ARENA.x0, h = ARENA.y1 - ARENA.y0;
  for (let tries = 0; tries < 30; tries++) {
    let x = ARENA.x0 + w * (0.48 + rng() * 0.46), y = ARENA.y0 + 50 + rng() * (h - 100);
    if (kind === 'cuspidor') x = ARENA.x0 + w * (0.72 + rng() * 0.22);
    if (kind === 'urutau') { x = ARENA.x0 + w * (0.3 + rng() * 0.62); y = rng() < 0.5 ? ARENA.y0 + 34 + rng() * 40 : ARENA.y1 - 34 - rng() * 40; }
    if (used.every((u) => Math.hypot(u.x - x, u.y - y) > 80)) { used.push({ x, y }); return { x: Math.round(x), y: Math.round(y) }; }
  }
  const p = { x: Math.round(ARENA.x0 + w * 0.75), y: Math.round(ARENA.y0 + h * rng()) };
  used.push(p);
  return p;
}

function wave(rng: Rng, pool: EnemyKind[], budget: number, used: { x: number; y: number }[]): SpawnDef[] {
  const out: SpawnDef[] = [], count: Partial<Record<EnemyKind, number>> = {};
  let left = budget;
  for (let guard = 0; guard < 40 && left >= 1; guard++) {
    const options = pool.filter((k) => COST[k] <= left && (count[k] ?? 0) < (CAP[k] ?? 9));
    if (!options.length) break;
    const k = pick(rng, options);
    count[k] = (count[k] ?? 0) + 1; left -= COST[k];
    out.push({ kind: k, ...place(rng, k, used) });
  }
  if (!out.length) out.push({ kind: pool[0], ...place(rng, pool[0], used) });
  return out;
}

function buildRooms(plan: Plan, level: number, seed: number): RoomDef[] {
  const rng = makeRng(seed), rooms: RoomDef[] = [];
  const altarAt = plan.rooms >= 5 ? Math.floor(plan.rooms / 2) : -1;
  for (let i = 0; i < plan.rooms; i++) {
    const last = i === plan.rooms - 1, bg = (seed + i) % 3;
    if (i === altarAt) { rooms.push({ type: 'altar', waves: [], bg }); continue; }
    const budget = 3.4 + level * 1.15 + i * 0.6;
    if (last && plan.boss) {
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.72), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      rooms.push({ type: 'boss', waves: [[{ kind: plan.boss, ...c, elite: true }]], bg });
    } else if (last && plan.elite) {
      const used: { x: number; y: number }[] = [];
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      used.push(c);
      rooms.push({ type: 'elite', waves: [[{ kind: plan.elite.kind, ...c, elite: true, mods: plan.elite.mods }, ...wave(rng, plan.pool.filter((k) => k !== plan.elite!.kind), budget * 0.45, used)]], bg });
    } else {
      const n = budget > 10 ? 3 : 2, share = n === 3 ? 0.42 : 0.6;
      const waves = Array.from({ length: n }, (_, k) => wave(rng, plan.pool, budget * (share + k * 0.05), []));
      rooms.push({ type: 'combat', waves, bg });
    }
  }
  return rooms;
}

export const STAGES: StageDef[] = PLANS.map((plan, i) => {
  const level = stageLevel(i), rooms = buildRooms(plan, level, 1000 + i * 77);
  const kinds = Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind))));
  /* cerca de duas vezes e meia o tempo de um jogador automático com equipamento de referência */
  const starTime = Math.round(rooms.reduce((s, r) => s + (r.type === 'combat' ? 26 + r.waves.length * 16 : r.type === 'elite' ? 70 : r.type === 'boss' ? 170 : 8), 0) * 0.5 / 5) * 5;
  return {
    id: `1-${i + 1}`, chapter: 1, index: i, number: i + 1, name: plan.name, intro: plan.intro, level, rooms, starTime, kinds,
    final: plan.boss ? 'chefao' : plan.elite ? 'elite' : 'normal',
    named: plan.named, rescue: plan.rescue, firstClear: plan.firstClear,
  };
});

export const STAGE_BY_ID: ReadonlyMap<string, StageDef> = new Map(STAGES.map((s) => [s.id, s]));

export const ENEMY_NAMES: Record<EnemyKind, string> = {
  sauva: 'Saúva-Cinza', queixada: 'Queixada Sombria', cuspidor: 'Cuspidor', tronco: 'Tronco-Oco',
  urutau: 'Urutau', cogumelo: 'Cogumelo-Estouro', caipora: 'Caipora', curupira: 'Curupira',
};

export const MOD_NAMES: Record<EliteMod, string> = {
  blindado: 'Blindado', veloz: 'Veloz', vampirico: 'Vampírico', explosivo: 'Explosivo', regenerador: 'Regenerador',
};
