// Função do Supabase (Deno): abre e recebe tentativas de ranking.
// Toda a regra está em _shared/servidor.js, gerado por `npm run build:server` a partir de src/server/tentativa.ts
// (o mesmo código que os testes rodam). Aqui só há o login, o banco e a resposta.
//
// Chamada pelo jogo com o token do jogador:
//   { acao: 'iniciar', modo, sim, heroi? }  →  { id, modo, chave, valendo, heroi }
//   { acao: 'enviar', id, gravacao }        →  { estado, valendo, venceu?, salas?, tempo_ms?, motivo? }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { Recusa, enviar, iniciar } from '../_shared/servidor.js';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ erro: 'Use POST.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!, auth = req.headers.get('Authorization') ?? '';
    // quem está chamando: o token do jogador, conferido pelo próprio Supabase
    const asUser = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
    const { data: who } = await asUser.auth.getUser();
    const jogador = who.user?.id;
    if (!jogador) return json({ erro: 'Entre na conta para jogar valendo.' }, 401);

    // o banco, com a chave do servidor: só esta função escreve em `tentativas`
    const sb = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: nick } = await sb.from('jogadores').select('id').eq('id', jogador).maybeSingle();
    if (!nick) return json({ erro: 'Escolha um apelido antes.' }, 403);

    const db = {
      async hasRanked(j: string, modo: string, chave: string) {
        const { count, error } = await sb.from('tentativas').select('id', { count: 'exact', head: true }).eq('jogador', j).eq('modo', modo).eq('chave', chave).eq('valendo', true);
        if (error) throw error;
        return (count ?? 0) > 0;
      },
      async recentCount(j: string, since: Date) {
        const { count, error } = await sb.from('tentativas').select('id', { count: 'exact', head: true }).eq('jogador', j).gt('criada_em', since.toISOString());
        if (error) throw error;
        return count ?? 0;
      },
      async insert(row: Record<string, unknown>) {
        let { data, error } = await sb.from('tentativas').insert(row).select().single();
        // duas abas abrindo a primeira tentativa do dia ao mesmo tempo: a segunda vira treino
        if (error?.code === '23505') ({ data, error } = await sb.from('tentativas').insert({ ...row, valendo: false }).select().single());
        if (error) throw error;
        return data;
      },
      async get(id: string) {
        const { data, error } = await sb.from('tentativas').select('id, jogador, modo, chave, sim, heroi, estado, valendo, criada_em').eq('id', id).maybeSingle();
        if (error) throw error;
        return data;
      },
      async close(id: string, d: Record<string, unknown>) {
        const { data, error } = await sb.from('tentativas').update(d).eq('id', id).eq('estado', 'aberta').select('id');
        if (error) throw error;
        return (data?.length ?? 0) === 1;
      },
    };

    const body = await req.json().catch(() => ({}));
    const now = new Date();
    // deno-lint-ignore no-explicit-any
    if (body.acao === 'iniciar') return json(await iniciar(db as any, jogador, body, now));
    // deno-lint-ignore no-explicit-any
    if (body.acao === 'enviar') return json(await enviar(db as any, jogador, body, now));
    return json({ erro: 'Ação desconhecida.' }, 400);
  } catch (err) {
    if (err instanceof Recusa) return json({ erro: err.message }, err.status);
    console.error(err);
    return json({ erro: 'O servidor tropeçou. Tente de novo.' }, 500);
  }
});
