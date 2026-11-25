/**
 * Roda as migrações do Supabase num Postgres de verdade (PGlite, dentro do Node), com um esboço do que o
 * Supabase dá pronto: os papéis anon e authenticated, a tabela auth.users e a função auth.uid().
 */
import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import contas from '../supabase/migrations/20261125000001_contas_e_saves.sql?raw';

const SUPABASE_STUB = `
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
`;
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222';

let db: PGlite;
async function as(uid: string | null): Promise<void> {
  await db.exec('reset role');
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
}
async function save(perfil: unknown, base: number): Promise<{ ok: boolean; rev: number }> {
  const r = await db.query<{ ok: boolean; rev: string }>('select * from salvar_solo($1, $2, 6, 10, 3600, $3)', [JSON.stringify(perfil), base, 'teste']);
  return { ok: r.rows[0].ok, rev: Number(r.rows[0].rev) };
}

describe('banco do Supabase: contas e saves', () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(SUPABASE_STUB);
    await db.exec(contas);
    await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}')`);
  }, 60_000);

  it('apelido: formato, único sem diferenciar maiúsculas, e só o próprio', async () => {
    await as(A);
    await db.query('insert into jogadores (id, apelido) values ($1, $2)', [A, 'Caipora 77']);
    await as(B);
    await expect(db.query('insert into jogadores (id, apelido) values ($1, $2)', [B, 'caipora 77'])).rejects.toThrow();
    await expect(db.query('insert into jogadores (id, apelido) values ($1, $2)', [B, 'x'])).rejects.toThrow();
    await expect(db.query('insert into jogadores (id, apelido) values ($1, $2)', [A, 'Outro'])).rejects.toThrow();
    await db.query('insert into jogadores (id, apelido) values ($1, $2)', [B, 'Iara']);
    const r = await db.query<{ apelido: string }>('select apelido from jogadores order by apelido');
    expect(r.rows.map((x) => x.apelido)).toEqual(['Caipora 77', 'Iara']);
  });

  it('o save só sobe com a revisão certa e cada um só lê o seu', async () => {
    await as(A);
    expect(await save({ level: 3 }, 5)).toEqual({ ok: false, rev: 0 });
    expect(await save({ level: 3 }, 0)).toEqual({ ok: true, rev: 1 });
    expect(await save({ level: 4 }, 1)).toEqual({ ok: true, rev: 2 });
    /* outro aparelho, ainda na revisão 1: conflito */
    expect(await save({ level: 9 }, 1)).toEqual({ ok: false, rev: 2 });
    const mine = await db.query<{ perfil: { level: number } }>('select perfil from saves');
    expect(mine.rows).toHaveLength(1);
    expect(mine.rows[0].perfil.level).toBe(4);
    /* escrever direto na tabela, sem a função, não passa */
    await expect(db.query(`update saves set perfil = '{"level":99}'`)).resolves.toMatchObject({ affectedRows: 0 });
    await as(B);
    expect((await db.query('select * from saves')).rows).toHaveLength(0);
    await as(null);
    await expect(save({ level: 1 }, 0)).rejects.toThrow();
  });

  it('apagar a conta leva o jogador e o save', async () => {
    await as(A);
    await db.query('select apagar_minha_conta()');
    await db.exec('reset role');
    expect((await db.query(`select * from jogadores where id = '${A}'`)).rows).toHaveLength(0);
    expect((await db.query(`select * from saves where jogador = '${A}'`)).rows).toHaveLength(0);
    expect((await db.query(`select * from jogadores where id = '${B}'`)).rows).toHaveLength(1);
  });
});
