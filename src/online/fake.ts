/**
 * Servidor de mentira, guardado no próprio navegador. Só entra no servidor de desenvolvimento,
 * com `?nuvem=falsa` no endereço, para ver e testar as telas da conta sem um projeto Supabase.
 */
import type { Db, Tentativa } from '../server/tentativa';
import { SIM_VERSION } from '../sim/replay';
import type { Account, Backend, CloudSave, RankMode, RankRow } from './backend';

const KEY = 'encantados.nuvem-falsa.v1';
interface Store { account: Account | null; save: CloudSave | null }

function read(): Store {
  try { return { account: null, save: null, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Store> }; } catch { return { account: null, save: null }; }
}
function write(s: Store): void { localStorage.setItem(KEY, JSON.stringify(s)); }

const listeners: (() => void)[] = [];
const changed = () => { for (const fn of listeners) fn(); };

export const fakeBackend: Backend = {
  async account() { return read().account; },
  async signInGoogle() { const s = read(); s.account = { id: 'falso-1', email: 'voce@exemplo.com', apelido: s.account?.apelido ?? null }; write(s); changed(); },
  async signInEmail(email) { const s = read(); s.account = { id: 'falso-1', email, apelido: s.account?.apelido ?? null }; write(s); setTimeout(changed, 600); },
  async signOut() { const s = read(); s.account = null; write(s); },
  async setNickname(apelido) { const s = read(); if (!s.account) return 'Entre na conta antes.'; if (apelido.toLowerCase() === 'saci') return 'Esse apelido já tem dono.'; s.account.apelido = apelido; write(s); return null; },
  async getSave() { return read().save; },
  async putSave(perfil, base, meta) {
    const s = read(), cur = s.save?.rev ?? 0;
    if (cur !== base) return { ok: false, rev: cur };
    s.save = { rev: cur + 1, perfil: JSON.parse(JSON.stringify(perfil)), nivel: meta.nivel, tempoJogo: meta.tempoJogo, aparelho: meta.aparelho, atualizadoEm: new Date().toISOString() };
    write(s);
    return { ok: true, rev: cur + 1 };
  },
  async deleteAccount() { write({ account: null, save: null }); },
  onAuthChange(cb) { listeners.push(cb); },

  /* os rankings de mentira refazem a partida de verdade, com o mesmo código do servidor */
  async startAttempt(modo, heroi) {
    const s = read();
    if (!s.account?.apelido) throw new Error('Escolha um apelido antes.');
    const { iniciar } = await import('../server/tentativa');
    return iniciar(fakeDb(s.account.id), s.account.id, { modo, sim: SIM_VERSION, heroi }, new Date());
  },
  async submitAttempt(id, gravacao) {
    const s = read(), { enviar } = await import('../server/tentativa');
    /* o servidor de mentira não espera o relógio: finge que a tentativa abriu há uma hora */
    const rows = readRows(), t = rows.find((r) => r.id === id);
    if (t) { t.criada_em = new Date(Date.now() - 3600_000).toISOString(); writeRows(rows); }
    return enviar(fakeDb(s.account?.id ?? ''), s.account?.id ?? '', { id, gravacao }, new Date());
  },
  async ranking(modo, chave) { return board(modo, chave).slice(0, 20); },
  async myRank(modo, chave) {
    const me = read().account?.apelido, b = board(modo, chave), r = b.find((x) => x.apelido === me);
    return r ? { ...r, total: b.length } : null;
  },
};

/* ---------- tentativas de mentira ---------- */
const ROWS = 'encantados.nuvem-falsa.tentativas.v1';
interface Row extends Tentativa { venceu?: boolean; salas?: number; tempo_ms?: number; arma?: string; enviada_em?: string }
function readRows(): Row[] { try { return JSON.parse(localStorage.getItem(ROWS) ?? '[]') as Row[]; } catch { return []; } }
function writeRows(r: Row[]): void { localStorage.setItem(ROWS, JSON.stringify(r)); }

function fakeDb(me: string): Db {
  return {
    async hasRanked(j, modo, chave) { return readRows().some((r) => r.jogador === j && r.modo === modo && r.chave === chave && r.valendo); },
    async recentCount() { return 0; },
    async insert(row) { const rows = readRows(), t: Row = { ...row, id: `t${Date.now()}${rows.length}`, estado: 'aberta' }; rows.push(t); writeRows(rows); return t; },
    async get(id) { return readRows().find((r) => r.id === id && r.jogador === me) ?? null; },
    async close(id, d) {
      const rows = readRows(), t = rows.find((r) => r.id === id && r.estado === 'aberta');
      if (!t) return false;
      Object.assign(t, { estado: d.estado, venceu: d.venceu, salas: d.salas, tempo_ms: d.tempo_ms, arma: d.arma, enviada_em: d.enviada_em });
      writeRows(rows);
      return true;
    },
  };
}

/** Ranking de mentira: alguns rivais inventados e as tentativas verificadas deste navegador. */
function board(modo: RankMode, chave: string): RankRow[] {
  const total = modo === 'dia' ? 5 : 11, me = read().account?.apelido ?? 'Você';
  const rivals = ['Boitatá_RS', 'Mula Preta', 'Cuca77', 'Zé do Brejo', 'Iara_do_Norte', 'Matinta', 'Pisadeira', 'Caboclo'].map((apelido, i) => (
    { apelido, venceu: i < 5, salas: i < 5 ? total : total - 1 - (i % 3), tempo_ms: (modo === 'dia' ? 70_000 : 250_000) + i * 9_300, arma: ['arco', 'facao', 'cajado', 'zagaia', 'peixeiras', 'borduna'][i % 6] }));
  const mine = readRows().filter((r) => r.modo === modo && r.chave === chave && r.estado === 'verificada' && r.valendo)
    .map((r) => ({ apelido: me, venceu: !!r.venceu, salas: r.salas ?? 0, tempo_ms: r.tempo_ms ?? 0, arma: r.arma ?? 'facao' }));
  const order = (a: Omit<RankRow, 'posicao'>, b: Omit<RankRow, 'posicao'>) => Number(b.venceu) - Number(a.venceu) || b.salas - a.salas || a.tempo_ms - b.tempo_ms;
  const best = mine.sort(order).slice(0, 1);
  return [...rivals, ...best].sort(order).map((r, i) => ({ ...r, posicao: i + 1 }));
}
