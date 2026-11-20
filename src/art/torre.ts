// @ts-nocheck
/** Torre dos Cem Andares: chão da arena, moldura e fundo da tela da Torre. PROVISÓRIO. */
export const TORRE = {
  ground(c, W, H, variant) { const g = c.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7); g.addColorStop(0, ['#3a3448', '#34303e', '#2e3440'][variant % 3]); g.addColorStop(1, '#121018'); c.fillStyle = g; c.fillRect(0, 0, W, H); },
  canopy() {},
  /** Fundo da tela da Torre no acampamento (w×h); a torre fica no centro, a interface desenha os andares por cima. */
  backdrop(c, w, h) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#1a1830'); g.addColorStop(1, '#0a0a12'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = '#2a2638'; c.fillRect(w * 0.38, h * 0.08, w * 0.24, h * 0.92); },
};
