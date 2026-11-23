/**
 * Retorno diário (docs/gdd/07-online-e-economia.md): as missões do dia, o bônus de descanso e as
 * expedições. Aqui ficam os números e a geração das expedições; as regras que mexem no perfil
 * estão em src/meta/daily.ts.
 *
 * Uma expedição se reconstrói só pelo identificador (dia, posição, capítulo, até que fase o jogador
 * chegou, nível e modificador), para a cena do jogo poder abri-la sem conhecer o perfil.
 */
import { ARENA, isBossKind, isMonster, type EliteMod, type EnemyKind } from './balance';
import { MONSTERS } from './bestiary';
import { stageGold, stageXp } from './progression';
import { makeRng, pick, type Rng } from './rng';
import { CHAPTERS, STAGES, TERRAIN, wave, type RoomDef, type StageDef } from './stages';

/* ---------- missões ---------- */

export type MissionKind =
  | 'vencer' | 'monstros' | 'elemento' | 'feiticos' | 'semPocao' | 'capitulo' | 'esquivas' | 'elite'
  | 'estrelas' | 'torre' | 'forja' | 'expedicao' | 'poucosGolpes' | 'supremo' | 'reacoes' | 'arma';

export interface MissionDef {
  icon: string;
  /** Alvos possíveis, do mais fácil ao mais difícil. Em `poucosGolpes` o alvo é sempre 1 e o limite vai no parâmetro. */
  targets: number[];
  weight: number;
  /** Missões do mesmo grupo não saem no mesmo dia. */
  group: string;
  /** Material extra além de ouro e resina. */
  bonus?: { po?: number; tomo?: number };
}

export const MISSIONS: Record<MissionKind, MissionDef> = {
  vencer: { icon: 'mapa', targets: [2, 3, 4], weight: 10, group: 'vencer' },
  monstros: { icon: 'dano', targets: [50, 80, 120], weight: 10, group: 'monstros' },
  elemento: { icon: 'magia', targets: [10, 16, 24], weight: 9, group: 'feitico' },
  feiticos: { icon: 'feiticos', targets: [20, 35, 50], weight: 6, group: 'feitico' },
  semPocao: { icon: 'pocao', targets: [1], weight: 7, group: 'estilo', bonus: { po: 1 } },
  capitulo: { icon: 'seta', targets: [1, 2], weight: 8, group: 'vencer' },
  esquivas: { icon: 'esquiva', targets: [5, 8, 12], weight: 8, group: 'esquiva', bonus: { po: 1 } },
  elite: { icon: 'elite', targets: [1, 2], weight: 7, group: 'elite', bonus: { tomo: 1 } },
  estrelas: { icon: 'estrela', targets: [1, 2], weight: 7, group: 'estilo' },
  torre: { icon: 'torre', targets: [3, 5, 8], weight: 7, group: 'torre', bonus: { tomo: 1 } },
  forja: { icon: 'ferreiro', targets: [2, 3], weight: 6, group: 'forja' },
  expedicao: { icon: 'expedicao', targets: [1, 2], weight: 8, group: 'expedicao', bonus: { po: 1 } },
  poucosGolpes: { icon: 'defesa', targets: [1], weight: 5, group: 'esquiva' },
  supremo: { icon: 'supremo', targets: [2, 3], weight: 6, group: 'supremo' },
  reacoes: { icon: 'reacao', targets: [5, 10, 15], weight: 6, group: 'feitico' },
  arma: { icon: 'item', targets: [1, 2], weight: 6, group: 'arma' },
};

export const MISSION_ORDER = Object.keys(MISSIONS) as MissionKind[];
export const MISSIONS_PER_DAY = 3;
/** Limite de golpes da missão "vença levando poucos golpes", pelo tamanho da fase. */
export const FEW_HITS = 8;

/** Ouro e materiais de uma missão, no nível do jogador e no grau de dificuldade (0, 1, 2). */
export function missionReward(level: number, tier: number, def: MissionDef): { gold: number; mata: number; po: number; tomo: number } {
  return {
    gold: Math.round((stageGold(level) * (0.9 + 0.35 * tier)) / 5) * 5,
    mata: 3 + Math.floor(level / 6) + 2 * tier,
    po: def.bonus?.po ?? 0,
    tomo: def.bonus?.tomo ?? 0,
  };
}

/** Baú das três missões. */
export function chestReward(level: number): { gold: number; mata: number; po: number; tomo: number } {
  return { gold: Math.round((stageGold(level) * 2.5) / 5) * 5, mata: 8 + Math.floor(level / 4), po: 2, tomo: 1 };
}

/* ---------- bônus de descanso ---------- */

/** XP de descanso por dia inteiro fora: o de três fases no nível do jogador. */
export const REST_STAGES_PER_DAY = 3;
/** Acumula até três dias. */
export const REST_MAX_DAYS = 3;
export function restPerDay(level: number): number { return REST_STAGES_PER_DAY * stageXp(level); }
export function restCap(level: number): number { return REST_MAX_DAYS * restPerDay(level); }

/* ---------- expedições ---------- */

export type ExpModId = 'veloz' | 'vampirico' | 'explosivo' | 'campeoes' | 'cheia' | 'correnteza' | 'breu' | 'lua' | 'miragem' | 'esquecimento' | 'horda' | 'raizes';

export interface ExpModDef {
  name: string;
  desc: string;
  icon: string;
  /** Multiplica o ouro e a resina. */
  reward: number;
  /** Capítulos em que o terreno já faz isso (o modificador não sai neles). */
  skip?: number[];
  /** Nível mínimo do jogador (o Esquecimento pesa para quem tem poucos feitiços). */
  minLevel?: number;
}

export const EXP_MODS: Record<ExpModId, ExpModDef> = {
  veloz: { name: 'Monstros velozes', desc: 'Todos os monstros andam e atacam mais rápido.', icon: 'movimento', reward: 1.2 },
  vampirico: { name: 'Sede de sangue', desc: 'Os monstros recuperam vida quando acertam você.', icon: 'roubo', reward: 1.15 },
  explosivo: { name: 'Estouro', desc: 'Todo monstro explode pouco depois de morrer. Golpeie e saia de perto.', icon: 'explosao', reward: 1.2 },
  campeoes: { name: 'Campeões', desc: 'Cada onda traz um campeão: mais vida e um modificador de elite.', icon: 'elite', reward: 1.2 },
  cheia: { name: 'Cheia', desc: 'Poças por toda a sala: todos ficam Molhados e você anda mais devagar.', icon: 'agua', reward: 1.1, skip: [2] },
  correnteza: { name: 'Correnteza', desc: 'A água corre pela sala e arrasta quem para de andar.', icon: 'correnteza', reward: 1.15, skip: [2] },
  breu: { name: 'Noite fechada', desc: 'Escuro: só há luz em volta do herói.', icon: 'sombra', reward: 1.2, skip: [5] },
  lua: { name: 'Lua cheia', desc: 'A lua enche durante cada sala e deixa os monstros mais fortes.', icon: 'lua', reward: 1.15, skip: [6] },
  miragem: { name: 'Miragem', desc: 'Cópias falsas dos monstros em cada onda. Somem com um golpe.', icon: 'encanto', reward: 1.1, skip: [7] },
  esquecimento: { name: 'Esquecimento', desc: 'De tanto em tanto tempo um feitiço é apagado até a sala acabar.', icon: 'credito', reward: 1.25, skip: [8], minLevel: 8 },
  horda: { name: 'Horda', desc: 'Quatro monstros a cada três: ondas maiores.', icon: 'caveira', reward: 1.25 },
  raizes: { name: 'Raízes fundas', desc: 'Os monstros se curam se ficarem 3 s sem apanhar.', icon: 'regeneracao', reward: 1.1 },
};
export const EXP_MOD_ORDER = Object.keys(EXP_MODS) as ExpModId[];

export const EXPEDITIONS_PER_DAY = 2;
/** Vitórias em expedição que pagam ouro e material por dia. */
export const EXP_REWARDED_RUNS = 3;
/** Cada posição do dia: a curta e a travessia, que termina num elite. */
export const EXP_SLOTS = [
  { name: 'Trilha', rooms: 2, elite: false },
  { name: 'Travessia', rooms: 3, elite: true },
] as const;

/** Ouro, resina e pó de uma vitória em expedição (antes do bônus da primeira do dia). */
export function expeditionBase(level: number, slot: number, mod: ExpModId): { xp: number; gold: number; mata: number; po: number } {
  const k = EXP_MODS[mod].reward * (slot === 1 ? 1.4 : 1);
  return {
    xp: Math.round(stageXp(level) * (slot === 1 ? 0.75 : 0.55)),
    gold: Math.round(stageGold(level) * 0.7 * k),
    mata: Math.round((5 + Math.floor(level / 3)) * k),
    po: 1 + slot,
  };
}

const LEGACY_BOSSES: EnemyKind[] = ['caipora', 'curupira', 'boto', 'iara'];

/** Monstros comuns das fases de um capítulo até a de número `upto` (só salas comuns, sem elite nem chefe). */
export function expeditionPool(chapter: number, upto: number): EnemyKind[] {
  const kinds = new Set<EnemyKind>();
  for (const s of STAGES) {
    if (s.chapter !== chapter || s.number > upto) continue;
    for (const r of s.rooms) if (r.type === 'combat') for (const w of r.waves) for (const sp of w) if (!isBossKind(sp.kind) && !LEGACY_BOSSES.includes(sp.kind)) kinds.add(sp.kind);
  }
  return [...kinds];
}

const PREFIX = 'exp-';
export function isExpeditionId(id: string): boolean { return id.startsWith(PREFIX); }

export interface ExpeditionKey { day: string; slot: number; chapter: number; upto: number; level: number; mod: ExpModId }

/** `day` no formato AAAA-MM-DD. */
export function expeditionId(k: ExpeditionKey): string {
  return `${PREFIX}${k.day.replace(/-/g, '')}-${k.slot}-${k.chapter}-${k.upto}-${k.level}-${k.mod}`;
}

export function parseExpeditionId(id: string): ExpeditionKey | null {
  const m = /^exp-(\d{4})(\d{2})(\d{2})-(\d)-(\d)-(\d{1,2})-(\d{1,2})-([a-z]+)$/.exec(id);
  if (!m) return null;
  const k = { day: `${m[1]}-${m[2]}-${m[3]}`, slot: Number(m[4]), chapter: Number(m[5]), upto: Number(m[6]), level: Number(m[7]), mod: m[8] as ExpModId };
  if (!EXP_MODS[k.mod] || !EXP_SLOTS[k.slot] || !CHAPTERS.some((c) => c.id === k.chapter) || k.upto < 1 || k.level < 1) return null;
  return expeditionPool(k.chapter, k.upto).length ? k : null;
}

function hash(text: string): number {
  let v = 2166136261;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return v >>> 0;
}

/** Aplica o modificador do dia a uma sala já montada. */
function applyMod(room: RoomDef, mod: ExpModId, rng: Rng): void {
  const all = room.waves.flat();
  const addMod = (m: EliteMod) => { for (const sp of all) if (!sp.mods?.includes(m)) sp.mods = [...(sp.mods ?? []), m]; };
  switch (mod) {
    case 'veloz': addMod('veloz'); break;
    case 'vampirico': addMod('vampirico'); break;
    case 'explosivo': addMod('explosivo'); break;
    case 'raizes': addMod('regenerador'); break;
    case 'campeoes':
      for (const w of room.waves) { const c = w.find((sp) => !sp.elite && !sp.champion && sp.kind !== 'caramujo'); if (c) { c.champion = true; c.mods = [...(c.mods ?? []), pick(rng, ['veloz', 'vampirico', 'regenerador', 'explosivo'] as EliteMod[])]; } }
      break;
    case 'cheia':
      room.puddles = Array.from({ length: 4 + Math.floor(rng() * 2) }, () => ({
        x: Math.round(ARENA.x0 + 140 + rng() * (ARENA.x1 - ARENA.x0 - 280)), y: Math.round(ARENA.y0 + 80 + rng() * (ARENA.y1 - ARENA.y0 - 160)), r: Math.round(80 + rng() * 50),
      }));
      break;
    case 'correnteza': room.current = (rng() < 0.5 ? -1 : 1) * Math.round(48 + rng() * 16); break;
    case 'breu': room.dark = true; break;
    case 'lua': room.moon = true; break;
    case 'miragem': room.illusions = 2; break;
    case 'esquecimento': room.erase = true; break;
    case 'horda': break;
  }
}

/** Monta a expedição como uma fase curta. Devolve nulo se o identificador não vale. */
export function expeditionStage(id: string): StageDef | null {
  const k = parseExpeditionId(id);
  if (!k) return null;
  const slot = EXP_SLOTS[k.slot], pool = expeditionPool(k.chapter, k.upto), rng = makeRng(hash(id) | 1), level = k.level;
  const chapter = CHAPTERS.find((c) => c.id === k.chapter)!, terrain = TERRAIN[k.chapter];
  const championChance = level <= 2 ? 0 : Math.min(0.6, 0.12 + level * 0.04);
  const rooms: RoomDef[] = [];
  for (let i = 0; i < slot.rooms; i++) {
    const last = i === slot.rooms - 1, room: RoomDef = { type: 'combat', waves: [], bg: (hash(id) + i) % 3, artChapter: k.chapter };
    if (terrain) Object.assign(room, terrain(rng, 6));
    if (k.chapter === 2) room.puddles = [{ x: 500 + Math.round(rng() * 300), y: 300 + Math.round(rng() * 200), r: 90 }];
    const budget = (5.5 + 1.25 * Math.min(level, 12) + 0.35 * Math.max(0, Math.min(level, 24) - 12) + i * 0.7) * (k.mod === 'horda' ? 1.33 : 1);
    if (last && slot.elite) {
      /* o elite é o monstro mais caro do capítulo, com um modificador */
      const kind = pool.reduce((a, b) => (enemyCost(b) > enemyCost(a) ? b : a), pool[0]);
      const c = { x: Math.round(ARENA.x0 + (ARENA.x1 - ARENA.x0) * 0.75), y: Math.round((ARENA.y0 + ARENA.y1) / 2) };
      const adds = pool.length > 1 ? pool.filter((p) => p !== kind) : pool;
      room.type = 'elite';
      room.waves = [
        [{ kind, ...c, elite: true, mods: [pick(rng, ['blindado', 'veloz', 'regenerador', 'vampirico'] as EliteMod[])] }, ...wave(rng, adds, budget * 0.4, [c], 0)],
        wave(rng, adds, budget * 0.45, [], 0),
      ];
    } else {
      const n = level >= 3 ? 3 : 2, share = n === 3 ? 0.44 : 0.62;
      room.waves = Array.from({ length: n }, (_, w) => wave(rng, pool, budget * (share + w * 0.06), [], w > 0 ? championChance : 0));
    }
    applyMod(room, k.mod, rng);
    rooms.push(room);
  }
  const enemies = rooms.reduce((s, r) => s + r.waves.reduce((a, w) => a + w.length, 0), 0);
  return {
    id, chapter: k.chapter, index: -1, number: 0,
    name: `${slot.name} · ${chapter.name}`, intro: EXP_MODS[k.mod].desc,
    level, rooms, starTime: Math.round((enemies * 1.9 + rooms.length * 8 + (slot.elite ? 20 : 0)) / 5) * 5,
    kinds: Array.from(new Set(rooms.flatMap((r) => r.waves.flat().map((s) => s.kind)))),
    final: slot.elite ? 'elite' : 'normal', map: { x: 0, y: 0 },
  };
}

/* custo de cada monstro, só para escolher o elite da travessia (protetores não viram elite) */
const LEGACY_COST: Partial<Record<EnemyKind, number>> = { sauva: 1, cogumelo: 1.4, cuspidor: 1.8, urutau: 1.8, queixada: 2.6, piranha: 1.1, sapo: 1.7, arraia: 2, caramujo: 0, jacare: 3.4 };
function enemyCost(k: EnemyKind): number {
  if (isMonster(k)) return MONSTERS[k].arch === 'protetor' ? 0 : MONSTERS[k].cost;
  return LEGACY_COST[k] ?? 1;
}
