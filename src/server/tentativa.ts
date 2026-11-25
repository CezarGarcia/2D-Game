/**
 * O lado do servidor dos rankings (docs/gdd/12-online.md): abrir uma tentativa, receber a gravação,
 * refazer a partida e guardar o resultado. Nada aqui confia no que o jogo diz que aconteceu.
 *
 * É TypeScript puro, sem nada do Supabase: quem fala com o banco é o `Db` que vem de fora. Assim o mesmo
 * código roda nos testes (com um Postgres dentro do Node) e na função do Supabase (supabase/functions/tentativa),
 * que recebe este arquivo empacotado por `npm run build:server`.
 */
import { ENCANTADOS_ID, WEAPONS, brDay, challengeSeed, dailyChallenge, dailyChallengeId, type HeroSpec } from '../data/challenge';
import { COMPANIONS, ELEMENT_ORDER, SPELLS, type BlessingId, type CompanionId, type ElementId, type SpellId } from '../data/content';
import { findStage } from '../data/tower';
import { ENCANTADOS_HERO_LEVEL, challengeProfile } from '../meta/challenge';
import { deriveStats } from '../meta/stats';
import { MAX_TICKS, SIM_VERSION, replayRun, resultOf, type Replay } from '../sim/replay';

export type Modo = 'dia' | 'encantados';

export interface Tentativa {
  id: string; jogador: string; modo: Modo; chave: string; sim: string; heroi: HeroSpec;
  estado: 'aberta' | 'verificada' | 'rejeitada'; valendo: boolean; criada_em: string;
}

/** O que o servidor precisa do banco. */
export interface Db {
  /** Há tentativa valendo deste jogador neste dia? */
  hasRanked(jogador: string, modo: Modo, chave: string): Promise<boolean>;
  /** Tentativas abertas pelo jogador desde `since` (para segurar abuso). */
  recentCount(jogador: string, since: Date): Promise<number>;
  insert(row: { jogador: string; modo: Modo; chave: string; sim: string; heroi: HeroSpec; valendo: boolean; criada_em: string }): Promise<Tentativa>;
  get(id: string): Promise<Tentativa | null>;
  /** Fecha a tentativa. Só vale se ela ainda estiver aberta; devolve se fechou. */
  close(id: string, data: { estado: 'verificada' | 'rejeitada'; enviada_em: string; venceu?: boolean; salas?: number; tempo_ms?: number; arma?: string; motivo?: string; gravacao?: Replay }): Promise<boolean>;
}

export class Recusa extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Tentativas por hora, por jogador. */
export const MAX_PER_HOUR = 40;
/** Uma tentativa aberta vale por duas horas. */
export const OPEN_FOR_MS = 2 * 3600_000;

const SPELL_IDS = new Set(Object.keys(SPELLS));
const COMPANION_IDS = new Set(Object.keys(COMPANIONS));

/** Herói do Desafio dos Encantados: confere o formato do que o jogo mandou (o equipamento é igual para todos). */
export function cleanEncantadosSpec(raw: unknown): HeroSpec | null {
  const r = raw as Partial<HeroSpec> | null;
  if (!r || typeof r !== 'object') return null;
  if (!WEAPONS.includes(r.weapon as never)) return null;
  if (!Array.isArray(r.spells) || r.spells.length !== 3) return null;
  const spells = r.spells.map((s) => (s === null ? null : typeof s === 'string' && SPELL_IDS.has(s) ? s as SpellId : undefined));
  if (spells.includes(undefined)) return null;
  if (new Set(spells.filter(Boolean)).size !== spells.filter(Boolean).length) return null;
  const companion = r.companion === null || r.companion === undefined ? null : COMPANION_IDS.has(r.companion) ? r.companion as CompanionId : undefined;
  const supremo = r.supremo === null || r.supremo === undefined ? null : ELEMENT_ORDER.includes(r.supremo as ElementId) ? r.supremo as ElementId : undefined;
  if (companion === undefined || supremo === undefined) return null;
  return { level: ENCANTADOS_HERO_LEVEL, weapon: r.weapon!, spells: spells as (SpellId | null)[], companion, supremo };
}

/** Abre uma tentativa. No Desafio do Dia, o servidor decide o dia e o herói. */
export async function iniciar(db: Db, jogador: string, body: { modo?: unknown; sim?: unknown; heroi?: unknown }, now: Date): Promise<{ id: string; modo: Modo; chave: string; valendo: boolean; heroi: HeroSpec }> {
  if (body.sim !== SIM_VERSION) throw new Recusa(409, 'O jogo foi atualizado. Recarregue a página para entrar no ranking.');
  if (body.modo !== 'dia' && body.modo !== 'encantados') throw new Recusa(400, 'Modo desconhecido.');
  if (await db.recentCount(jogador, new Date(now.getTime() - 3600_000)) >= MAX_PER_HOUR) throw new Recusa(429, 'Muitas tentativas em pouco tempo. Espere um pouco.');
  const modo: Modo = body.modo;
  let chave: string, heroi: HeroSpec, valendo: boolean;
  if (modo === 'dia') {
    chave = brDay(now); heroi = dailyChallenge(chave).spec;
    valendo = !(await db.hasRanked(jogador, modo, chave));
  } else {
    const spec = cleanEncantadosSpec(body.heroi);
    if (!spec) throw new Recusa(400, 'Herói inválido.');
    chave = 'geral'; heroi = spec; valendo = true;
  }
  const row = await db.insert({ jogador, modo, chave, sim: SIM_VERSION, heroi, valendo, criada_em: now.toISOString() });
  return { id: row.id, modo, chave, valendo: row.valendo, heroi };
}

/** Refaz a partida de uma tentativa e devolve o resultado. Lança se a gravação não presta. */
export function refazer(t: Pick<Tentativa, 'modo' | 'chave' | 'heroi'>, gravacao: Replay): { venceu: boolean; salas: number; tempo_ms: number; ticks: number } {
  const stage = findStage(t.modo === 'dia' ? dailyChallengeId(t.chave) : ENCANTADOS_ID);
  if (!stage) throw new Error('fase desconhecida');
  const prof = challengeProfile(t.heroi);
  const w = replayRun({ stageId: stage.id, level: stage.level, rooms: stage.rooms, stats: deriveStats(prof), seed: challengeSeed(stage.id), ranked: true }, gravacao, (b: BlessingId[]) => deriveStats(prof, b));
  const r = resultOf(w);
  /* partida abandonada no meio conta como queda */
  return { venceu: r.won, salas: r.rooms, tempo_ms: Math.round(r.time * 1000), ticks: r.ticks };
}

function looksLikeReplay(g: unknown): g is Replay {
  const r = g as Replay | null;
  return !!r && typeof r === 'object' && typeof r.format === 'number' && Number.isInteger(r.ticks) && r.ticks >= 0 && r.ticks <= MAX_TICKS
    && typeof r.data === 'string' && r.data.length < 400_000 && Array.isArray(r.picks) && r.picks.length < 200
    && r.picks.every((p) => p && Number.isInteger(p.t) && (p.kind === 'a' || p.kind === 'o') && Number.isInteger(p.i) && p.i >= 0 && p.i < 8);
}

/** Recebe a gravação de uma tentativa aberta, refaz e fecha. */
export async function enviar(db: Db, jogador: string, body: { id?: unknown; gravacao?: unknown }, now: Date): Promise<{ estado: 'verificada' | 'rejeitada'; valendo: boolean; venceu?: boolean; salas?: number; tempo_ms?: number; motivo?: string }> {
  if (typeof body.id !== 'string') throw new Recusa(400, 'Tentativa sem identificador.');
  const t = await db.get(body.id);
  if (!t || t.jogador !== jogador) throw new Recusa(404, 'Tentativa não encontrada.');
  if (t.estado !== 'aberta') throw new Recusa(409, 'Essa tentativa já foi enviada.');
  const reject = async (motivo: string) => { await db.close(t.id, { estado: 'rejeitada', enviada_em: now.toISOString(), motivo }); return { estado: 'rejeitada' as const, valendo: t.valendo, motivo }; };
  if (t.sim !== SIM_VERSION) return reject('O jogo foi atualizado no meio da tentativa.');
  const age = now.getTime() - new Date(t.criada_em).getTime();
  if (age > OPEN_FOR_MS) return reject('A tentativa passou do prazo.');
  if (!looksLikeReplay(body.gravacao)) return reject('Gravação malformada.');
  /* ninguém joga mais rápido do que o relógio: a partida não pode ter mais tempo de jogo do que passou desde que abriu */
  if (body.gravacao.ticks / 60 > age / 1000 + 5) return reject('A partida durou mais do que o tempo que passou.');
  let r: ReturnType<typeof refazer>;
  try { r = refazer(t, body.gravacao); } catch (err) { return reject(`Não deu para refazer: ${err instanceof Error ? err.message : 'erro'}`); }
  const ok = await db.close(t.id, { estado: 'verificada', enviada_em: now.toISOString(), venceu: r.venceu, salas: r.salas, tempo_ms: r.tempo_ms, arma: t.heroi.weapon, gravacao: body.gravacao });
  if (!ok) throw new Recusa(409, 'Essa tentativa já foi enviada.');
  return { estado: 'verificada', valendo: t.valendo, venceu: r.venceu, salas: r.salas, tempo_ms: r.tempo_ms };
}

export { SIM_VERSION };
