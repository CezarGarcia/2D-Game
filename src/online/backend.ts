/**
 * O que o jogo pede ao servidor, separado de quem atende: o Supabase no jogo publicado
 * e um falso nos testes. Nada aqui conhece regra de jogo.
 */

/** Save guardado na nuvem, com o resumo que a tela de conflito mostra. */
export interface CloudSave { rev: number; perfil: unknown; nivel: number; tempoJogo: number; aparelho: string | null; atualizadoEm: string }

export interface Account { id: string; email: string | null; apelido: string | null }

export interface Backend {
  /** Conta logada (com o apelido, se já escolheu), ou nulo. */
  account(): Promise<Account | null>;
  signInGoogle(): Promise<void>;
  /** Manda o link mágico por e-mail. */
  signInEmail(email: string): Promise<void>;
  signOut(): Promise<void>;
  /** Escolhe ou troca o apelido. Devolve o motivo se não deu ('em uso', 'formato'). */
  setNickname(apelido: string): Promise<string | null>;
  getSave(): Promise<CloudSave | null>;
  /** Grava se a nuvem ainda estiver em `base` (0 = primeiro save). Senão, `ok` falso e a revisão atual. */
  putSave(perfil: unknown, base: number, meta: { versao: number; nivel: number; tempoJogo: number; aparelho: string }): Promise<{ ok: boolean; rev: number }>;
  deleteAccount(): Promise<void>;
  /** Chamado quando o login muda (entrou pelo link, saiu em outra aba). */
  onAuthChange(cb: () => void): void;
}

/** Apelido: 3 a 16 letras, números, espaço ou _. A mesma regra do banco. */
export const NICK_RE = /^[A-Za-z0-9À-ÖØ-öø-ÿ_ ]{3,16}$/;

/** Palavras que não podem aparecer no apelido (lista curta; o resto se resolve por denúncia, depois). */
const BLOCKED = ['porra', 'caralho', 'buceta', 'puta', 'merda', 'viado', 'cuzao', 'arrombado', 'fdp', 'nazi', 'hitler'];

/** Motivo para recusar um apelido, ou nulo se ele pode ser usado. */
export function nicknameProblem(apelido: string): string | null {
  const a = apelido.trim();
  if (a !== apelido) return 'Sem espaço no começo ou no fim.';
  if (!NICK_RE.test(a)) return 'De 3 a 16 letras, números, espaço ou _.';
  const plain = a.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');
  if (BLOCKED.some((w) => plain.includes(w))) return 'Escolha outro apelido.';
  return null;
}

/** Um servidor que só é carregado quando alguém o usa (para o de mentira não entrar no jogo publicado). */
export function lazyBackend(load: () => Promise<Backend>): Backend {
  let b: Promise<Backend> | null = null;
  const get = () => (b ??= load());
  return {
    account: () => get().then((x) => x.account()),
    signInGoogle: () => get().then((x) => x.signInGoogle()),
    signInEmail: (e) => get().then((x) => x.signInEmail(e)),
    signOut: () => get().then((x) => x.signOut()),
    setNickname: (a) => get().then((x) => x.setNickname(a)),
    getSave: () => get().then((x) => x.getSave()),
    putSave: (p, base, meta) => get().then((x) => x.putSave(p, base, meta)),
    deleteAccount: () => get().then((x) => x.deleteAccount()),
    onAuthChange: (cb) => { void get().then((x) => x.onAuthChange(cb)); },
  };
}
