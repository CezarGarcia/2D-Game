// @ts-nocheck
/**
 * Fundos pintados das telas de menu. Cada função pinta o canvas inteiro (0,0)–(w,h).
 * PROVISÓRIO: gradientes simples até a arte final entrar.
 */

/** Mapa ilustrado de um capítulo. `points` são as fases em pixels do canvas, na ordem; a trilha passa por elas. */
export function paintChapterMap(c, w, h, chapter, points) {
  const g = c.createLinearGradient(0, 0, 0, h);
  if (chapter === 2) { g.addColorStop(0, '#12303A'); g.addColorStop(1, '#0B1C22'); } else { g.addColorStop(0, '#18382A'); g.addColorStop(1, '#0D1F17'); }
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(233,226,200,.35)'; c.lineWidth = 6; c.setLineDash([4, 14]); c.lineCap = 'round';
  c.beginPath(); points.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke(); c.setLineDash([]);
}

/** Fundo da tela do herói: clareira com luz no centro, onde o personagem fica. */
export function paintHeroBackdrop(c, w, h) {
  const g = c.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#2C5A40'); g.addColorStop(1, '#0D1F17');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

/** Fundo do ferreiro: forja com brasa. */
export function paintForgeBackdrop(c, w, h) {
  const g = c.createRadialGradient(w / 2, h * 0.7, 20, w / 2, h * 0.7, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#5A2E1C'); g.addColorStop(1, '#140D0B');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

/** Fundo da teia de talentos: céu noturno da mata. O desenho é centrado em (w/2, h/2). */
export function paintTalentBackdrop(c, w, h) {
  const g = c.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7);
  g.addColorStop(0, '#1B2D3A'); g.addColorStop(1, '#070D12');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

/** Bigorna com martelo, para o centro da tela do ferreiro. Centrada em (0,0), cerca de 200 px de largura. `t` anima a brasa. */
export function drawAnvil(c, t) {
  c.fillStyle = '#3A3F45'; c.fillRect(-90, -30, 180, 40); c.fillRect(-50, 10, 100, 50);
}
