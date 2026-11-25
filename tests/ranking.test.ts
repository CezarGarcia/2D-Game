/**
 * O servidor dos rankings de ponta a ponta, sem o Supabase: o código de src/server/tentativa.ts sobre as
 * migrações de verdade num Postgres dentro do Node (PGlite), com partidas gravadas pelo jogador automático.
 */
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { TICK } from '../src/data/balance';
import { ENCANTADOS_ID, brDay, challengeSeed, dailyChallenge, dailyChallengeId, type HeroSpec } from '../src/data/challenge';
import { findStage } from '../src/data/tower';
import { challengeProfile } from '../src/meta/challenge';
import { deriveStats } from '../src/meta/stats';
import { MAX_PER_HOUR, Recusa, cleanEncantadosSpec, enviar, iniciar, refazer, type Db, type Modo, type Tentativa } from '../src/server/tentativa';
import { Recorder, SIM_VERSION, quantize, type Replay } from '../src/sim/replay';
import { createWorld, step } from '../src/sim/world';
import contas from '../supabase/migrations/20261125000001_contas_e_saves.sql?raw';
import rankings from '../supabase/migrations/20261125000002_rankings.sql?raw';
import { HUMAN, PERFECT, makeBot } from './bot';

const STUB = `
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;
const U = (n: number) => `${String(n).repeat(8)}-1111-1111-1111-111111111111`;

let pg: PGlite;

/** O mesmo que a função do Supabase faz com a chave service_role. */
function dbOf(): Db {
  const one = async (sql: string, args: unknown[]) => (await pg.query<Tentativa>(sql, args)).rows[0] ?? null;
  return {
    hasRanked: async (j, m, c) => !!(await one('select id from tentativas where jogador = $1 and modo = $2 and chave = $3 and valendo limit 1', [j, m, c])),
    recentCount: async (j, since) => Number((await pg.query<{ n: string }>('select count(*) n from tentativas where jogador = $1 and criada_em > $2', [j, since.toISOString()])).rows[0].n),
    insert: async (r) => (await one('insert into tentativas (jogador, modo, chave, sim, heroi, valendo, criada_em) values ($1, $2, $3, $4, $5, $6, $7) returning *', [r.jogador, r.modo, r.chave, r.sim, JSON.stringify(r.heroi), r.valendo, r.criada_em]))!,
    get: (id) => one('select * from tentativas where id = $1', [id]),
    close: async (id, d) => (await pg.query(`update tentativas set estado = $2, venceu = $3, salas = $4, tempo_ms = $5, arma = $6, motivo = $7, gravacao = $8, enviada_em = $9 where id = $1 and estado = 'aberta'`,
      [id, d.estado, d.venceu ?? null, d.salas ?? null, d.tempo_ms ?? null, d.arma ?? null, d.motivo ?? null, d.gravacao ? JSON.stringify(d.gravacao) : null, d.enviada_em])).affectedRows === 1,
  };
}

/** Joga o desafio com o jogador automático, gravando. `stopAt` abandona depois de tantos segundos. */
function play(modo: Modo, chave: string, spec: HeroSpec, bot = HUMAN, seed = 3, stopAt = 900): Replay {
  const st = findStage(modo === 'dia' ? dailyChallengeId(chave) : ENCANTADOS_ID)!, prof = challengeProfile(spec);
  const w = createWorld({ stageId: st.id, level: st.level, rooms: st.rooms, stats: deriveStats(prof), seed: challengeSeed(st.id), ranked: true });
  const b = makeBot(prof, { ...bot, seed }), rec = new Recorder();
  while (w.phase !== 'won' && w.phase !== 'lost' && rec.ticks < 60 * stopAt) {
    const altar = w.phase === 'altar', before = w.blessings.length, inp = quantize(b(w));
    if (altar && (w.phase !== 'altar' || w.blessings.length !== before)) rec.pick('a', 0);
    rec.input(inp); step(w, inp, TICK); w.events.length = 0;
  }
  return rec.finish();
}

async function as(uid: string | null): Promise<void> {
  await pg.exec('reset role');
  await pg.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  if (uid) await pg.exec('set role authenticated');
}

const DAY = '2026-12-04', NOW = new Date('2026-12-04T15:00:00Z'), LATER = new Date('2026-12-04T15:10:00Z');

describe('servidor dos rankings', () => {
  let rep: Replay;
  beforeAll(async () => {
    pg = new PGlite();
    await pg.exec(STUB); await pg.exec(contas); await pg.exec(rankings);
    for (let i = 1; i <= 4; i++) { await pg.exec(`insert into auth.users (id) values ('${U(i)}')`); await pg.query('insert into jogadores (id, apelido) values ($1, $2)', [U(i), `Jogador ${i}`]); }
    expect(brDay(NOW)).toBe(DAY);
    rep = play('dia', DAY, dailyChallenge(DAY).spec);
  }, 120_000);

  it('a primeira tentativa do dia vale; o servidor refaz e guarda o resultado dele', async () => {
    const db = dbOf();
    const a = await iniciar(db, U(1), { modo: 'dia', sim: SIM_VERSION }, NOW);
    expect(a.valendo).toBe(true);
    expect(a.heroi).toEqual(dailyChallenge(DAY).spec);
    const r = await enviar(db, U(1), { id: a.id, gravacao: rep }, LATER);
    expect(r.estado).toBe('verificada');
    expect(typeof r.venceu).toBe('boolean');
    /* a segunda do dia é treino, e enviar duas vezes não passa */
    const b = await iniciar(db, U(1), { modo: 'dia', sim: SIM_VERSION }, NOW);
    expect(b.valendo).toBe(false);
    await expect(enviar(db, U(1), { id: a.id, gravacao: rep }, LATER)).rejects.toBeInstanceOf(Recusa);
    /* a tentativa de outro jogador não é sua */
    await expect(enviar(db, U(2), { id: b.id, gravacao: rep }, LATER)).rejects.toBeInstanceOf(Recusa);
  }, 60_000);

  it('recusa versão antiga, gravação adulterada, apressada ou fora do prazo', async () => {
    const db = dbOf();
    await expect(iniciar(db, U(2), { modo: 'dia', sim: 'velha' }, NOW)).rejects.toMatchObject({ status: 409 });
    await expect(iniciar(db, U(2), { modo: 'outro', sim: SIM_VERSION }, NOW)).rejects.toMatchObject({ status: 400 });
    const a = await iniciar(db, U(2), { modo: 'dia', sim: SIM_VERSION }, NOW);
    /* mandar a gravação antes de o tempo de jogo ter passado */
    expect((await enviar(db, U(2), { id: a.id, gravacao: rep }, new Date(NOW.getTime() + 3000))).estado).toBe('rejeitada');
    /* a tentativa valendo foi gasta: não dá para tentar de novo valendo */
    const b = await iniciar(db, U(2), { modo: 'dia', sim: SIM_VERSION }, NOW);
    expect(b.valendo).toBe(false);
    expect((await enviar(db, U(2), { id: b.id, gravacao: { ...rep, data: rep.data.slice(0, 200) + '!!!' } }, LATER)).estado).toBe('rejeitada');
    const c = await iniciar(db, U(2), { modo: 'dia', sim: SIM_VERSION }, NOW);
    expect((await enviar(db, U(2), { id: c.id, gravacao: rep }, new Date(NOW.getTime() + 3 * 3600_000))).estado).toBe('rejeitada');
    const d = await iniciar(db, U(2), { modo: 'dia', sim: SIM_VERSION }, NOW);
    expect((await enviar(db, U(2), { id: d.id, gravacao: { ...rep, ticks: 1e9 } }, LATER)).estado).toBe('rejeitada');
  }, 60_000);

  it('uma gravação cortada vale o que o servidor refez, não o que o jogo diria', async () => {
    const db = dbOf(), short = play('dia', DAY, dailyChallenge(DAY).spec, HUMAN, 3, 8);
    const a = await iniciar(db, U(3), { modo: 'dia', sim: SIM_VERSION }, NOW);
    const r = await enviar(db, U(3), { id: a.id, gravacao: short }, LATER);
    expect(r).toMatchObject({ estado: 'verificada', venceu: false });
  }, 60_000);

  it('o ranking ordena por vencer, salas e tempo, e mostra só apelido e resultado', async () => {
    /* procura uma partida vencida entre algumas sementes do jogador automático */
    const db = dbOf(), spec = dailyChallenge(DAY).spec;
    let best = play('dia', DAY, spec, HUMAN, 5);
    for (const [bot, seed] of [[PERFECT, 1], [HUMAN, 7], [PERFECT, 4], [HUMAN, 11]] as const) { if (refazer({ modo: 'dia', chave: DAY, heroi: spec }, best).venceu) break; best = play('dia', DAY, spec, bot, seed); }
    const a = await iniciar(db, U(4), { modo: 'dia', sim: SIM_VERSION }, NOW);
    const r4 = await enviar(db, U(4), { id: a.id, gravacao: best }, LATER);
    expect(r4.venceu).toBe(true);
    await as(null); await pg.exec('set role anon');
    const top = (await pg.query<{ apelido: string; venceu: boolean; posicao: string }>('select * from ranking($1, $2, $3)', ['dia', DAY, SIM_VERSION])).rows;
    expect(top[0].apelido).toBe('Jogador 4');
    expect(top.map((x) => Number(x.posicao))).toEqual(top.map((_, i) => i + 1));
    /* o jogador 2 só teve tentativa rejeitada valendo: fica fora */
    expect(top.map((x) => x.apelido)).not.toContain('Jogador 2');
    expect(Object.keys(top[0])).not.toContain('jogador');
    /* anônimo não lê a tabela nem escreve nela */
    expect((await pg.query('select * from tentativas')).rows).toHaveLength(0);
    await expect(pg.query(`update tentativas set venceu = true, tempo_ms = 1`)).resolves.toMatchObject({ affectedRows: 0 });
    await as(U(3));
    const me = (await pg.query<{ posicao: string; total: string }>('select * from minha_posicao($1, $2, $3)', ['dia', DAY, SIM_VERSION])).rows[0];
    expect(Number(me.total)).toBe(top.length);
    expect(Number(me.posicao)).toBeGreaterThan(1);
    /* cada um só lê as próprias tentativas, e não muda nenhuma */
    expect((await pg.query<{ jogador: string }>('select jogador from tentativas')).rows.every((x) => x.jogador === U(3))).toBe(true);
    await expect(pg.query(`update tentativas set venceu = true, tempo_ms = 1`)).resolves.toMatchObject({ affectedRows: 0 });
    await as(null);
  }, 60_000);

  it('Desafio dos Encantados: herói conferido, e vale a melhor tentativa', async () => {
    const db = dbOf();
    expect(cleanEncantadosSpec({ weapon: 'arco', spells: ['dardo', 'sementes', null], companion: 'onca', supremo: 'natureza', level: 99 })?.level).toBe(50);
    expect(cleanEncantadosSpec({ weapon: 'espada', spells: [null, null, null] })).toBeNull();
    expect(cleanEncantadosSpec({ weapon: 'arco', spells: ['dardo', 'dardo', null] })).toBeNull();
    expect(cleanEncantadosSpec({ weapon: 'arco', spells: ['dardo'], companion: 'dragao' })).toBeNull();
    await expect(iniciar(db, U(1), { modo: 'encantados', sim: SIM_VERSION, heroi: { weapon: 'laser' } }, NOW)).rejects.toMatchObject({ status: 400 });
    const spec = { weapon: 'arco', spells: ['dardo', 'sementes', 'cipo'], companion: 'onca', supremo: 'natureza' };
    const a = await iniciar(db, U(1), { modo: 'encantados', sim: SIM_VERSION, heroi: spec }, NOW);
    const g = play('encantados', 'geral', a.heroi, HUMAN, 2, 40);
    const r = await enviar(db, U(1), { id: a.id, gravacao: g }, LATER);
    expect(r.estado).toBe('verificada');
    const top = (await pg.query<{ apelido: string; arma: string }>('select * from ranking($1, $2, $3)', ['encantados', 'geral', SIM_VERSION])).rows;
    expect(top).toHaveLength(1);
    expect(top[0]).toMatchObject({ apelido: 'Jogador 1', arma: 'arco' });
  }, 120_000);

  it('segura quem abre tentativas demais', async () => {
    const db = dbOf();
    await pg.query(`insert into tentativas (jogador, modo, chave, sim, heroi, criada_em) select $1, 'encantados', 'geral', 'x', '{}'::jsonb, $3 from generate_series(1, $2)`, [U(4), MAX_PER_HOUR, new Date(NOW.getTime() - 60_000).toISOString()]);
    await expect(iniciar(db, U(4), { modo: 'dia', sim: SIM_VERSION }, NOW)).rejects.toMatchObject({ status: 429 });
  });
});
