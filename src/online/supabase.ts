/**
 * O servidor de verdade: Supabase (contas, banco e funções). A biblioteca só é baixada
 * quando o jogo tem endereço do Supabase configurado e alguém abre a parte online.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { SIM_VERSION } from '../sim/replay';
import type { Account, AttemptResult, AttemptStart, Backend, CloudSave, MyRank, RankRow } from './backend';

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
export const SUPABASE_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';
/** O jogo foi publicado com servidor? Sem ele, tudo continua só no navegador. */
export const ONLINE_CONFIGURED = !!(SUPABASE_URL && SUPABASE_KEY);

let client: Promise<SupabaseClient> | null = null;
function sb(): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'encantados.conta.v1' },
  }));
  return client;
}

/** Volta para a mesma página depois do login (o endereço do jogo, sem o que veio do link). */
function here(): string { return location.origin + location.pathname; }

export const supabaseBackend: Backend = {
  async account(): Promise<Account | null> {
    const c = await sb(), { data } = await c.auth.getSession(), u = data.session?.user;
    if (!u) return null;
    const { data: row } = await c.from('jogadores').select('apelido').eq('id', u.id).maybeSingle();
    return { id: u.id, email: u.email ?? null, apelido: (row as { apelido?: string } | null)?.apelido ?? null };
  },
  async signInGoogle() {
    const { error } = await (await sb()).auth.signInWithOAuth({ provider: 'google', options: { redirectTo: here() } });
    if (error) throw error;
  },
  async signInEmail(email) {
    const { error } = await (await sb()).auth.signInWithOtp({ email, options: { emailRedirectTo: here() } });
    if (error) throw error;
  },
  async signOut() { await (await sb()).auth.signOut(); },
  async setNickname(apelido) {
    const c = await sb(), { data } = await c.auth.getUser(), id = data.user?.id;
    if (!id) return 'Entre na conta antes.';
    const { error } = await c.from('jogadores').upsert({ id, apelido }, { onConflict: 'id' });
    if (!error) return null;
    return error.code === '23505' ? 'Esse apelido já tem dono.' : error.code === '23514' ? 'De 3 a 16 letras, números, espaço ou _.' : 'Não deu para salvar agora. Tente de novo.';
  },
  async getSave(): Promise<CloudSave | null> {
    const c = await sb();
    const { data, error } = await c.from('saves').select('rev, perfil, nivel, tempo_jogo, aparelho, atualizado_em').eq('mundo', 'solo').maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const d = data as { rev: number; perfil: unknown; nivel: number; tempo_jogo: number; aparelho: string | null; atualizado_em: string };
    return { rev: Number(d.rev), perfil: d.perfil, nivel: d.nivel, tempoJogo: d.tempo_jogo, aparelho: d.aparelho, atualizadoEm: d.atualizado_em };
  },
  async putSave(perfil, base, meta) {
    const { data, error } = await (await sb()).rpc('salvar_solo', { perfil, base_rev: base, versao: meta.versao, nivel: meta.nivel, tempo_jogo: meta.tempoJogo, aparelho: meta.aparelho });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { ok: boolean; rev: number };
    return { ok: !!row.ok, rev: Number(row.rev) };
  },
  async deleteAccount() {
    const c = await sb(), { error } = await c.rpc('apagar_minha_conta');
    if (error) throw error;
    await c.auth.signOut();
  },
  onAuthChange(cb) { void sb().then((c) => c.auth.onAuthStateChange(() => cb())); },

  async startAttempt(modo, heroi) { return call<AttemptStart>({ acao: 'iniciar', modo, sim: SIM_VERSION, heroi }); },
  async submitAttempt(id, gravacao) { return call<AttemptResult>({ acao: 'enviar', id, gravacao }); },
  async ranking(modo, chave) {
    const { data, error } = await (await sb()).rpc('ranking', { p_modo: modo, p_chave: chave, p_sim: SIM_VERSION, p_limite: 20 });
    if (error) throw error;
    return ((data ?? []) as RankRow[]).map((r) => ({ ...r, posicao: Number(r.posicao) }));
  },
  async myRank(modo, chave) {
    const { data, error } = await (await sb()).rpc('minha_posicao', { p_modo: modo, p_chave: chave, p_sim: SIM_VERSION });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as MyRank | null | undefined;
    return row ? { ...row, posicao: Number(row.posicao), total: Number(row.total) } : null;
  },
};

/** Chama a função `tentativa` e devolve a resposta, ou lança com a mensagem que o servidor mandou. */
async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await (await sb()).functions.invoke('tentativa', { body });
  if (!error) return data as T;
  let msg = 'Sem conexão com o servidor.';
  try { const j = await (error as { context?: Response }).context?.json() as { erro?: string } | undefined; if (j?.erro) msg = j.erro; } catch { /* fica a mensagem padrão */ }
  throw new Error(msg);
}
