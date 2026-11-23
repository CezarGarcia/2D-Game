/**
 * O contexto de áudio do jogo, dividido entre os efeitos e a música, e os volumes escolhidos nas opções.
 */

let ctx: AudioContext | null = null;

/** Cria o contexto na primeira chamada. Navegadores só deixam tocar depois de um gesto do jogador. */
export function audioContext(): AudioContext | null {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    // com a aba escondida o som para; volta quando o jogador voltar
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) void ctx.suspend().catch(() => undefined);
      else void ctx.resume().catch(() => undefined);
    });
  } catch {
    ctx = null;
  }
  return ctx;
}

/* ---------- volumes ---------- */

const KEY = 'encantados.som.v1';

/** De 0 a 1. */
export interface Volumes { musica: number; efeitos: number }

export const DEFAULT_VOLUMES: Volumes = { musica: 0.5, efeitos: 1 };

export function loadVolumes(): Volumes {
  const v = { ...DEFAULT_VOLUMES };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<Volumes>;
      for (const k of Object.keys(v) as (keyof Volumes)[]) {
        const x = o[k];
        if (typeof x === 'number' && Number.isFinite(x)) v[k] = Math.max(0, Math.min(1, x));
      }
    }
  } catch { /* sem armazenamento: fica o padrão */ }
  return v;
}

export function saveVolumes(v: Volumes): void {
  try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* fica só nesta sessão */ }
}
