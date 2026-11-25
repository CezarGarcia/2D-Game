/**
 * Save na nuvem (docs/gdd/12-online.md, seção 3).
 *
 * O navegador continua sendo onde o jogo salva; a nuvem é uma cópia que segue o jogador entre aparelhos.
 * Cada save na nuvem tem uma revisão. O navegador lembra a revisão que sincronizou por último e um resumo
 * (hash) do perfil naquele momento; com isso dá para saber, sem perguntar nada, quem mudou desde então:
 *
 * - só o navegador mudou → sobe;
 * - só a nuvem mudou (outro aparelho jogou) → desce;
 * - os dois mudaram → conflito: o jogador vê os dois (nível, tempo de jogo, quando) e escolhe. Nunca mistura.
 *
 * Um navegador novo, sem progresso, pega o da nuvem direto.
 */
import type { Account, Backend, CloudSave } from './backend';

export type OnlineStatus = 'desligado' | 'fora' | 'sem-apelido' | 'sincronizando' | 'em-dia' | 'pendente' | 'sem-rede' | 'conflito';

export interface SaveSummary { nivel: number; tempoJogo: number; quando: string | null; aparelho: string | null }
export interface Conflict { local: SaveSummary; cloud: SaveSummary; rev: number; perfil: unknown }

/** O mínimo que a sincronização precisa saber do perfil (para não depender das regras do jogo). */
export interface ProfileLike { version: number; level: number; stages: Record<string, unknown>; life?: { seconds?: number } }

export interface SyncHost {
  getProfile(): ProfileLike;
  /** Troca o perfil do jogo pelo que veio da nuvem (já pode ser de versão antiga: quem recebe migra). */
  replaceProfile(perfil: unknown): void;
  /** Dá para trocar o perfil agora? (Não no meio de uma fase.) */
  canReplace(): boolean;
}

export interface KeyStore { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void }

const META_KEY = 'encantados.nuvem.v1';
interface Meta { uid: string; rev: number; hash: string; at: string }

/** Resumo de 32 bits do texto (FNV-1a): só para saber se o perfil mudou. */
export function hashText(text: string): string {
  let v = 2166136261;
  for (let i = 0; i < text.length; i++) v = Math.imul(v ^ text.charCodeAt(i), 16777619);
  return (v >>> 0).toString(16);
}

/** Navegador sem progresso nenhum: pode receber o save da nuvem sem perguntar. */
export function isFresh(p: ProfileLike): boolean {
  return p.level <= 1 && Object.keys(p.stages ?? {}).length === 0;
}

/** "Chrome no Windows", para a tela de conflito dizer de onde veio cada save. */
export function deviceLabel(ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  const s = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
  return s ? `${b} no ${s}` : b;
}

export class CloudSync {
  status: OnlineStatus = 'fora';
  account: Account | null = null;
  conflict: Conflict | null = null;
  /** Quando sincronizou por último (ISO), e a última mensagem de erro. */
  lastSync: string | null = null;
  error: string | null = null;
  private listeners = new Set<() => void>();
  private running: Promise<void> | null = null;

  constructor(private api: Backend, private host: SyncHost, private store: KeyStore, private now: () => Date = () => new Date()) {
    const m = this.meta();
    this.lastSync = m?.at ?? null;
  }

  /** Avisa quando o login muda (entrou pelo link do e-mail, voltou do Google, saiu em outra aba). */
  onAuthChange(fn: () => void): void { this.api.onAuthChange(fn); }

  onChange(fn: () => void): () => void { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit(): void { for (const fn of this.listeners) { try { fn(); } catch { /* uma tela com defeito não derruba as outras */ } } }
  private set(status: OnlineStatus, error: string | null = null): void { this.status = status; this.error = error; this.emit(); }

  private meta(): Meta | null {
    try { const raw = this.store.get(META_KEY); return raw ? JSON.parse(raw) as Meta : null; } catch { return null; }
  }
  private remember(uid: string, rev: number): void {
    const at = this.now().toISOString(), hash = hashText(JSON.stringify(this.host.getProfile()));
    try { this.store.set(META_KEY, JSON.stringify({ uid, rev, hash, at })); } catch { /* sem armazenamento: só nesta sessão */ }
    this.lastSync = at;
  }

  private summary(p: ProfileLike, quando: string | null, aparelho: string | null): SaveSummary {
    return { nivel: p.level, tempoJogo: Math.round(p.life?.seconds ?? 0), quando, aparelho };
  }

  /** Lê a conta logada e sincroniza se der. */
  async refresh(): Promise<void> {
    try {
      this.account = await this.api.account();
    } catch {
      this.set('sem-rede', 'Sem conexão com o servidor.'); return;
    }
    if (!this.account) { this.set('fora'); return; }
    if (!this.account.apelido) { this.set('sem-apelido'); return; }
    await this.syncNow();
  }

  /** Sobe, desce ou abre o conflito. Duas chamadas ao mesmo tempo viram uma só. */
  syncNow(): Promise<void> {
    this.running ??= this.run().finally(() => { this.running = null; });
    return this.running;
  }

  private async run(): Promise<void> {
    const acc = this.account;
    if (!acc?.apelido || this.status === 'conflito') return;
    this.set('sincronizando');
    try {
      const local = this.host.getProfile(), hash = hashText(JSON.stringify(local)), meta = this.meta();
      const cloud = await this.api.getSave();
      const same = meta && meta.uid === acc.id;
      if (!cloud) { await this.push(acc, 0); return; }
      if (same && meta.rev === cloud.rev) {
        if (meta.hash !== hash) await this.push(acc, cloud.rev); else this.set('em-dia');
        return;
      }
      /* a nuvem mudou: se o navegador não mudou desde a última vez (ou está vazio), desce */
      if ((same && meta.hash === hash) || isFresh(local)) { this.pull(acc, cloud); return; }
      this.openConflict(local, cloud);
    } catch (err) {
      this.set('sem-rede', err instanceof Error ? err.message : 'Sem conexão com o servidor.');
    }
  }

  private async push(acc: Account, base: number): Promise<void> {
    const p = this.host.getProfile();
    const r = await this.api.putSave(p, base, { versao: p.version, nivel: p.level, tempoJogo: Math.round(p.life?.seconds ?? 0), aparelho: deviceLabel() });
    if (r.ok) { this.remember(acc.id, r.rev); this.set('em-dia'); return; }
    /* outro aparelho gravou no meio do caminho */
    const cloud = await this.api.getSave();
    if (cloud) this.openConflict(p, cloud); else this.set('pendente');
  }

  private pull(acc: Account, cloud: CloudSave): void {
    if (!this.host.canReplace()) { this.set('pendente'); return; }
    this.host.replaceProfile(cloud.perfil);
    this.remember(acc.id, cloud.rev);
    this.set('em-dia');
  }

  private openConflict(local: ProfileLike, cloud: CloudSave): void {
    const meta = this.meta();
    this.conflict = {
      local: this.summary(local, meta?.at ?? null, deviceLabel()),
      cloud: { nivel: cloud.nivel, tempoJogo: cloud.tempoJogo, quando: cloud.atualizadoEm, aparelho: cloud.aparelho },
      rev: cloud.rev, perfil: cloud.perfil,
    };
    this.set('conflito');
  }

  /** O jogador escolheu no conflito: manter o deste navegador (sobe por cima) ou usar o da nuvem. */
  async resolve(keep: 'local' | 'nuvem'): Promise<void> {
    const c = this.conflict, acc = this.account;
    if (!c || !acc) return;
    this.conflict = null;
    this.set('sincronizando');
    try {
      if (keep === 'nuvem') {
        this.host.replaceProfile(c.perfil);
        this.remember(acc.id, c.rev);
        this.set('em-dia');
      } else await this.push(acc, c.rev);
    } catch (err) {
      this.set('sem-rede', err instanceof Error ? err.message : 'Sem conexão com o servidor.');
    }
  }

  /** Sobe o perfil deste navegador por cima do que estiver na nuvem (depois de Recomeçar o jogo). */
  async forcePush(): Promise<void> {
    const acc = this.account;
    if (!acc?.apelido) return;
    this.set('sincronizando');
    try { const cloud = await this.api.getSave(); await this.push(acc, cloud?.rev ?? 0); }
    catch (err) { this.set('sem-rede', err instanceof Error ? err.message : 'Sem conexão com o servidor.'); }
  }

  /** O servidor, para os rankings (src/online/backend.ts). */
  get backend(): Backend { return this.api; }
  /** Logado e com apelido: pode jogar valendo. */
  get ranked(): boolean { return !!this.account?.apelido; }

  signInGoogle(): Promise<void> { return this.api.signInGoogle(); }
  signInEmail(email: string): Promise<void> { return this.api.signInEmail(email); }

  async setNickname(apelido: string): Promise<string | null> {
    const why = await this.api.setNickname(apelido);
    if (why) return why;
    if (this.account) this.account = { ...this.account, apelido };
    await this.syncNow();
    return null;
  }

  async signOut(): Promise<void> {
    await this.api.signOut();
    this.account = null; this.conflict = null;
    try { this.store.remove(META_KEY); } catch { /* nada */ }
    this.set('fora');
  }

  async deleteAccount(): Promise<void> {
    await this.api.deleteAccount();
    this.account = null; this.conflict = null;
    try { this.store.remove(META_KEY); } catch { /* nada */ }
    this.set('fora');
  }
}
