/**
 * Capítulos e fases. As salas de cada fase são fixas: saem de uma semente por fase, então todo
 * jogador encontra a mesma sequência e os tempos são comparáveis.
 */
import { ARENA, type EliteMod, type EnemyKind, type SpawnDef } from './balance';
import type { CompanionId, ElementId } from './content';
import type { ItemType } from './items';
import { stageLevel } from './progression';
import { makeRng, pick, type Rng } from './rng';

export type RoomType = 'combat' | 'altar' | 'elite' | 'boss';

export interface RoomDef {
  type: RoomType;
  waves: SpawnDef[][];
  /** Variação do cenário. */
  bg: number;
  /** Poças: deixam todos Molhados e o herói mais lento. */
  puddles?: { x: number; y: number; r: number }[];
  /** Correnteza: empurra o herói e os inimigos na horizontal, em pixels por segundo. Negativo empurra para a esquerda. */
  current?: number;
}

export interface ChapterDef {
  id: number;
  name: string;
  /** Encantado que guarda a região. */
  encantado: string;
  element: ElementId;
  /** Capítulos ainda em construção aparecem trancados. */
  available: boolean;
}

export const CHAPTERS: ChapterDef[] = [
  { id: 1, name: 'Mata Atlântica', encantado: 'Curupira', element: 'natureza', available: true },
  { id: 2, name: 'Rios do Norte', encantado: 'Iara', element: 'agua', available: true },
];

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
  /** Posição no mapa do capítulo, de 0 a 1 em cada eixo. */
  map: { x: number; y: number };
}

interface Plan {
  name: string; intro: string; pool: EnemyKind[]; rooms: number;
  elite?: { kind: EnemyKind; mods: EliteMod[] };
  boss?: EnemyKind;
  named?: { unique: string; chance: number };
  rescue?: CompanionId;
  firstClear?: ItemType[];
  water?: boolean;
  current?: boolean;
}

const CH1: Plan[] = [
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

const CH2: Plan[] = [
  { name: 'A Margem', intro: 'A mata acaba num barranco. Na água rasa, alguma coisa morde.', pool: ['piranha', 'sapo'], rooms: 5, water: true, firstClear: ['manto'] },
  { name: 'Igapó', intro: 'Floresta alagada até o joelho. Olhe onde pisa: a areia se mexe.', pool: ['piranha', 'sapo', 'arraia'], rooms: 5, water: true, named: { unique: 'ferraoDeArraia', chance: 4 } },
  { name: 'A Gaiola no Galho', intro: 'Um grito de arara vem do alto de uma árvore afogada.', pool: ['piranha', 'arraia', 'sapo'], rooms: 5, water: true, rescue: 'arara' },
  { name: 'Correnteza', intro: 'O rio aperta e puxa. Quem para de andar é levado.', pool: ['jacare', 'piranha', 'sapo'], rooms: 6, water: true, current: true },
  { name: 'O Dono do Remanso', intro: 'Um tronco boiando abre os olhos. É o maior jacaré que você já viu.', pool: ['piranha', 'sapo', 'arraia'], rooms: 6, water: true, elite: { kind: 'jacare', mods: ['blindado'] } },
  { name: 'Conchas', intro: 'Enquanto o caramujo estiver vivo, nada perto dele se machuca direito.', pool: ['caramujo', 'piranha', 'arraia'], rooms: 6, water: true },
  { name: 'Água Parada', intro: 'Sapos por toda parte, e as bolhas que eles cospem não somem.', pool: ['sapo', 'caramujo', 'jacare'], rooms: 6, water: true, elite: { kind: 'sapo', mods: ['veloz', 'explosivo'] } },
  { name: 'Braço Morto', intro: 'Um braço de rio esquecido. Tudo o que vive aqui está junto.', pool: ['piranha', 'sapo', 'arraia', 'jacare', 'caramujo'], rooms: 6, water: true, elite: { kind: 'caramujo', mods: ['regenerador', 'vampirico'] } },
  { name: 'Furo Estreito', intro: 'A passagem é estreita e a água corre contra você.', pool: ['piranha', 'jacare', 'arraia', 'caramujo'], rooms: 7, water: true, current: true, elite: { kind: 'jacare', mods: ['veloz'] } },
  { name: 'Véspera', intro: 'Música ao longe, de uma festa na beira do rio.', pool: ['piranha', 'sapo', 'arraia', 'jacare', 'caramujo'], rooms: 7, water: true, elite: { kind: 'arraia', mods: ['veloz', 'explosivo'] } },
  { name: 'O Baile do Boto', intro: 'Um moço de chapéu branco dança sozinho. Ele não tira o chapéu.', pool: ['piranha', 'sapo', 'caramujo'], rooms: 5, water: true, boss: 'boto', named: { unique: 'denteDoBoto', chance: 3 } },
  { name: 'A Iara', intro: 'Ela canta, e os seus pés andam sozinhos na direção da água.', pool: ['piranha', 'arraia', 'sapo'], rooms: 4, water: true, boss: 'iara', named: { unique: 'escamaDaIara', chance: 2 } },
];

/** Caminho de cada capítulo no mapa: 12 pontos, de 0 a 1. */
const MAPS: Record<number, [number, number][]> = {
  1: [[0.1, 0.24], [0.33, 0.17], [0.56, 0.25], [0.8, 0.18], [0.88, 0.47], [0.64, 0.54], [0.4, 0.46], [0.16, 0.54], [0.12, 0.82], [0.36, 0.86], [0.6, 0.77], [0.85, 0.83]],
  2: [[0.08, 0.8], [0.26, 0.7], [0.19, 0.44], [0.36, 0.27], [0.56, 0.19], [0.75, 0.29], [0.67, 0.52], [0.46, 0.58], [0.5, 0.82], [0.71, 0.85], [0.88, 0.66], [0.9, 0.36]],
};

const COST: Record<EnemyKind, number> = {
  sauva: 1, cogumelo: 1.4, cuspidor: 1.8, urutau: 1.8, queixada: 2.6, tronco: 4,
  piranha: 1.1, sapo: 1.7, arraia: 2, caramujo: 2.4, jacare: 3.4,
  caipora: 99, curupira: 99, boto: 99, iara: 99,
};
const CAP: Partial<Record<EnemyKind, number>> = { queixada: 2, cuspidor: 3, tronco: 1, urutau: 3, cogumelo: 4, sapo: 3, arraia: 3, caramujo: 1, jacare: 2 };
const CHAMPION_MODS: EliteMod[] = ['veloz', 'vampirico', 'regenerador', 'explosivo'];

function place(rng: Rng, kind: EnemyKind, used: { x: number; y: number }[]): { x: number; y: number } {
  const w = ARENA.x1 - ARENA.x0, h = ARENA.y1 - ARENA.y0;
  for (let tries = 0; tries < 30; tries++) {
    let x = ARENA.x0 + w * (0.42 + rng() * 0.52), y = ARENA.y0 + 50 + rng() * (h - 100);
    if (kind === 'cuspidor' || kind === 'sapo') x = ARENA.x0 + w * (0.66 + rng() * 0.28);
    if (kind === 'urutau') { x = ARENA.x0 + w * (0.3 + rng() * 0.62); y = rng() < 0.5 ? ARENA.y0 + 34 + rng() * 40 : ARENA.y1 - 34 - rng() * 40; }
    if (kind === 'arraia') x = ARENA.x0 + w * (0.3 + rng() * 0.6);
    if (used.every((u) => Math.hypot(u.x - x, u.y - y) > 76)) { used.push({ x, y }); return { x: Math.round(x), y: Math.round(y) }; }
  }
  const p = { x: Math.round(ARENA.x0 + w * 0.75), y: Math.round(ARENA.y0 + h * rng()) };
  used.push(p);
  return p;
}

function wave(rng: Rng, pool: EnemyKind[], budget: number, used: { x: number; y: number }[], championChance: number): SpawnDef[] {
  const out: SpawnDef[] = [], count: Partial<Record<EnemyKind, number>> = {};
  let left = budget;
  for (let guard = 0; guard < 60 && left >= 0.9; guard++) {
    const options = pool.filter((k) => COST[k] <= left && (count[k] ?? 0) < (CAP[k] ?? 12));
    if (!options.length) break;
    const k = pick(rng, options);
    count[k] = (count[k] ?? 0) + 1; left -= COST[k];
    out.push({ kind: k, ...place(rng, k, used) });
  }
  if (!out.length) out.push({ kind: pool[0], ...place(rng, pool[0], used) });
  /* campeão: um inimigo comum mais forte, com um modificador */
  if (rng() < championChance) {
    const c = out[Math.floor(rng() * out.length)];
    if (c.kind !== 'caramujo') { c.champion = true; c.mods = [pick(rng, CHAMPION_MODS)]; }
  }
  return out;
}

function altarRooms(n: number): number[] {
  return n >= 7 ? [2, 5] : n >= 6 ? [1, 4] : [Math.max(1, Math.floor(n / 2))];
}

function buildRooms(plan: Plan, level: number, seed: number): RoomDef[] {
  const rng = makeRng(seed), rooms: RoomDef[] = [], altars = altarRooms(plan.rooms);
  const championChance = level <= 2 ? 0 : Math.min(0.6, 0.12 + level * 0.04);
  for (let i = 0; i < plan.rooms; i++) {
    const last = i === plan.rooms - 1, bg = (seed + i) % 3;
    const room: RoomDef = { type: 'combat', waves: [], bg };
    if (plan.water) {
      const n = 2 + Math.floor(rng() * 3);
      room.puddles = Array.from({ length: n }, () => ({
        x: Math.round(ARENA.x0 + 140 + rng() * (ARENA.x1 - ARENA.x0 - 280)), y: Math.round(ARENA.y0 + 80 + rng() * (ARENA.y1 - ARENA.y0 - 160)), r: Math.round(70 + rng() * 60),
      }));
      if (plan.current && !altars.includes(i)) room.current = (rng() < 0.5 ? -1 : 1) * Math.round(46 + rng() * 22);
    }
    if (altars.includes(i) && !last) { room.type = 'altar'; rooms.push(room); continue; }
    const budget = 5.5 + 1.25 * Math.min(level, 12) + (0.35 * Math.max(0, Math.min(level, 24) - 12) + i * 0.7) - (plan.boss ? 5 : 0);
    if (last && plan.boss) {
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.72), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      room.type = 'boss'; room.waves = [[{ kind: plan.boss, ...c, elite: true }]];
      room.current = undefined;
    } else if (last && plan.elite) {
      const used: { x: number; y: number }[] = [];
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      used.push(c);
      const adds = plan.pool.filter((k) => k !== plan.elite!.kind);
      room.type = 'elite';
      room.waves = [
        [{ kind: plan.elite.kind, ...c, elite: true, mods: plan.elite.mods }, ...wave(rng, adds, budget * 0.4, used, 0)],
        wave(rng, adds, budget * 0.45, [], 0),
      ];
    } else {
      const n = level >= 3 ? 3 : 2, share = n === 3 ? 0.44 : 0.62;
      room.waves = Array.from({ length: n }, (_, k) => wave(rng, plan.pool, budget * (share + k * 0.06), [], k > 0 ? championChance : 0));
    }
    rooms.push(room);
  }
  return rooms;
}

function buildChapter(chapter: number, plans: Plan[]): StageDef[] {
  return plans.map((plan, n) => {
    const index = (chapter - 1) * 12 + n, level = stageLevel(index), rooms = buildRooms(plan, level, 1000 + index * 77);
    const kinds = Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind))));
    const enemies = rooms.reduce((s, r) => s + r.waves.reduce((a, w) => a + w.length, 0), 0);
    /* calibrado para cerca de uma vez e meia o tempo de um jogador automático cuidadoso */
    const starTime = Math.round((enemies * 1.9 + rooms.length * 8 + (plan.elite ? 20 : 0) + (plan.boss ? 90 : 0)) / 5) * 5;
    const [x, y] = MAPS[chapter][n];
    return {
      id: `${chapter}-${n + 1}`, chapter, index, number: n + 1, name: plan.name, intro: plan.intro, level, rooms, starTime, kinds,
      final: plan.boss ? 'chefao' : plan.elite ? 'elite' : 'normal',
      named: plan.named, rescue: plan.rescue, firstClear: plan.firstClear, map: { x, y },
    };
  });
}

export const STAGES: StageDef[] = [...buildChapter(1, CH1), ...buildChapter(2, CH2)];

export const STAGE_BY_ID: ReadonlyMap<string, StageDef> = new Map(STAGES.map((s) => [s.id, s]));

export function stagesOf(chapter: number): StageDef[] {
  return STAGES.filter((s) => s.chapter === chapter);
}

export const ENEMY_NAMES: Record<EnemyKind, string> = {
  sauva: 'Saúva-Cinza', queixada: 'Queixada Sombria', cuspidor: 'Cuspidor', tronco: 'Tronco-Oco',
  urutau: 'Urutau', cogumelo: 'Cogumelo-Estouro', caipora: 'Caipora', curupira: 'Curupira',
  piranha: 'Piranha-Cinza', sapo: 'Sapo-Cururu', arraia: 'Arraia de Areia', caramujo: 'Caramujo-Concha', jacare: 'Jacaré de Lodo',
  boto: 'Boto', iara: 'Iara',
};

/** Como cada inimigo luta, em poucas palavras, para os avisos do mapa. */
export const ENEMY_HINT: Record<EnemyKind, string> = {
  sauva: 'Vem em bando e morde de perto.',
  queixada: 'Marca uma linha e avança. Fica tonta se bater.',
  cuspidor: 'Cospe de longe onde você está.',
  tronco: 'Lento e blindado. Só sente depois que bate.',
  urutau: 'Parece um galho até você chegar perto.',
  cogumelo: 'Corre até você e explode.',
  caipora: 'Duas investidas seguidas, depois cansa.',
  curupira: 'Some, deixa pegadas falsas e ataca do outro lado.',
  piranha: 'Rápida. Salta em linha reta para morder.',
  sapo: 'Cospe bolhas que viram poças.',
  arraia: 'Enterrada na areia. Atira o ferrão e some de novo.',
  caramujo: 'Protege os inimigos em volta. Mate primeiro.',
  jacare: 'Bote longo de frente, rabada se você fica atrás.',
  boto: 'Mergulha e sai debaixo de você.',
  iara: 'O canto te puxa para ela.',
};

export const MOD_NAMES: Record<EliteMod, string> = {
  blindado: 'Blindado', veloz: 'Veloz', vampirico: 'Vampírico', explosivo: 'Explosivo', regenerador: 'Regenerador',
};

export const MOD_HINT: Record<EliteMod, string> = {
  blindado: 'Recebe metade do dano, menos quando está caído ou preso.',
  veloz: 'Mais rápido e avisa por menos tempo.',
  vampirico: 'Recupera vida quando te acerta.',
  explosivo: 'Explode pouco depois de morrer.',
  regenerador: 'Recupera vida se ficar 3 s sem apanhar.',
};
