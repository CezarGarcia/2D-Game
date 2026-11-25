/**
 * Servidor de mentira, guardado no próprio navegador. Só entra no servidor de desenvolvimento,
 * com `?nuvem=falsa` no endereço, para ver e testar as telas da conta sem um projeto Supabase.
 */
import type { Account, Backend, CloudSave } from './backend';

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
};
