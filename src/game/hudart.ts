/**
 * Molduras do HUD da fase, desenhadas uma vez em canvas: placas de madeira no mesmo estilo dos menus do acampamento
 * (src/ui/ui.css). Durante a luta só as partes que mudam (barras, recargas) são redesenhadas por cima.
 */
import type Phaser from 'phaser';

/** As texturas saem com o dobro da resolução lógica, como o resto da arte. */
const HD = 2;
type G = CanvasRenderingContext2D;

const WOOD_HI = '#7a4a2a', WOOD = '#5a3520', WOOD_LO = '#3a2014', EDGE = '#1c0f0a', RIM = '#b98352', TROUGH = '#140b07';

function rr(g: G, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Placa de madeira: borda escura, filete claro, degradê e veios. */
function plate(g: G, x: number, y: number, w: number, h: number, r: number, o: { rim?: string; alpha?: number; grain?: boolean } = {}): void {
  g.save();
  g.globalAlpha = o.alpha ?? 1;
  rr(g, x, y, w, h, r); g.fillStyle = EDGE; g.fill();
  rr(g, x + 2, y + 2, w - 4, h - 4, Math.max(1, r - 2));
  const q = g.createLinearGradient(0, y, 0, y + h);
  q.addColorStop(0, WOOD_HI); q.addColorStop(0.35, WOOD); q.addColorStop(1, WOOD_LO);
  g.fillStyle = q; g.fill();
  g.save(); g.clip();
  if (o.grain !== false) {
    g.globalAlpha = (o.alpha ?? 1) * 0.16; g.strokeStyle = '#1c0f0a'; g.lineWidth = 1;
    for (let i = 0; i < h / 7; i++) { const yy = y + 6 + i * 7 + (i % 3); g.beginPath(); g.moveTo(x, yy); g.bezierCurveTo(x + w * 0.3, yy - 2, x + w * 0.6, yy + 2.4, x + w, yy - 1); g.stroke(); }
    g.globalAlpha = o.alpha ?? 1;
  }
  /* luz no topo e sombra embaixo, por dentro */
  g.fillStyle = 'rgba(255,225,170,.16)'; g.fillRect(x, y + 2, w, 3);
  g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x, y + h - 6, w, 4);
  g.restore();
  rr(g, x + 2.5, y + 2.5, w - 5, h - 5, Math.max(1, r - 2.5)); g.strokeStyle = o.rim ?? RIM; g.lineWidth = 1.5; g.globalAlpha = (o.alpha ?? 1) * 0.75; g.stroke();
  g.restore();
}

/** Calha escura onde uma barra enche. */
function trough(g: G, x: number, y: number, w: number, h: number, r: number): void {
  rr(g, x - 2, y - 2, w + 4, h + 4, r + 2); g.fillStyle = EDGE; g.fill();
  rr(g, x, y, w, h, r); g.fillStyle = TROUGH; g.fill();
  g.save(); g.clip(); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(x, y, w, 3); g.restore();
}

function make(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: G) => void): void {
  if (scene.textures.exists(key)) return;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w * HD); cv.height = Math.ceil(h * HD);
  const g = cv.getContext('2d')!;
  g.scale(HD, HD);
  draw(g);
  scene.textures.addCanvas(key, cv);
}

/** Medidas que a cena usa para encaixar as barras nas calhas. */
export const VITALS = { w: 336, h: 86, hp: { x: 46, y: 12, w: 230, h: 26 }, mana: { x: 46, y: 50, w: 184, h: 16 }, potion: { x: 300, y: 43, r: 24 } };
export const SLOT = 60;
export const CARD = { w: 272, h: 262 };
export const TIER_COLORS = ['#9BE7C0', '#6AA5FF', '#BC8CFF', '#FFB238'];

export function bakeHud(scene: Phaser.Scene): void {
  make(scene, 'hud_vitals', VITALS.w, VITALS.h, (g) => {
    plate(g, 0, 0, VITALS.w, VITALS.h, 12);
    trough(g, VITALS.hp.x, VITALS.hp.y, VITALS.hp.w, VITALS.hp.h, 6);
    trough(g, VITALS.mana.x, VITALS.mana.y, VITALS.mana.w, VITALS.mana.h, 5);
    /* nicho redondo da poção */
    const p = VITALS.potion;
    g.beginPath(); g.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2); g.fillStyle = EDGE; g.fill();
    g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fillStyle = '#2a1810'; g.fill();
    g.beginPath(); g.arc(p.x, p.y, p.r - 1.5, 0, Math.PI * 2); g.strokeStyle = 'rgba(185,131,82,.7)'; g.lineWidth = 1.5; g.stroke();
  });
  /* espaço de ação: fundo escuro com moldura; a cena pinta a recarga e o brilho por cima */
  make(scene, 'hud_slot', SLOT, SLOT, (g) => {
    rr(g, 0, 0, SLOT, SLOT, 11); g.fillStyle = EDGE; g.fill();
    rr(g, 2, 2, SLOT - 4, SLOT - 4, 9);
    const q = g.createLinearGradient(0, 0, 0, SLOT); q.addColorStop(0, '#4a2c1a'); q.addColorStop(1, '#22130b');
    g.fillStyle = q; g.fill();
    rr(g, 5, 5, SLOT - 10, SLOT - 10, 7);
    const q2 = g.createRadialGradient(SLOT / 2, SLOT * 0.42, 4, SLOT / 2, SLOT / 2, SLOT * 0.6); q2.addColorStop(0, '#3b2a1c'); q2.addColorStop(1, '#170d08');
    g.fillStyle = q2; g.fill();
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,225,170,.12)'; rr(g, 4, 3.5, SLOT - 8, 3, 1.5); g.fill();
  });
  make(scene, 'hud_key', 44, 20, (g) => {
    rr(g, 0, 0, 44, 20, 8); g.fillStyle = 'rgba(20,11,7,.86)'; g.fill();
    rr(g, 1, 1, 42, 18, 7); g.strokeStyle = 'rgba(185,131,82,.55)'; g.lineWidth = 1.2; g.stroke();
  });
  /* cartas de bênção, uma por raridade */
  TIER_COLORS.forEach((color, i) => make(scene, `hud_card${i + 1}`, CARD.w, CARD.h, (g) => {
    const { w, h } = CARD;
    g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 14; g.shadowOffsetY = 6; rr(g, 6, 4, w - 12, h - 14, 16); g.fillStyle = EDGE; g.fill(); g.restore();
    rr(g, 6, 4, w - 12, h - 14, 16); g.fillStyle = color; g.fill();
    plate(g, 10, 8, w - 20, h - 22, 13, { rim: color });
    /* faixa da raridade */
    g.save(); rr(g, 10, 8, w - 20, h - 22, 13); g.clip();
    const q = g.createLinearGradient(0, 8, 0, 44); q.addColorStop(0, color); q.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.9; g.fillStyle = color; g.fillRect(10, 8, w - 20, 30);
    g.globalAlpha = 0.25; g.fillStyle = '#000'; g.fillRect(10, 35, w - 20, 3);
    g.globalAlpha = 0.18; g.fillStyle = q; g.fillRect(10, 38, w - 20, 90);
    g.restore();
    /* medalhão do ícone */
    const cx = w / 2, cy = 92;
    g.beginPath(); g.arc(cx, cy, 43, 0, Math.PI * 2); g.fillStyle = EDGE; g.fill();
    g.beginPath(); g.arc(cx, cy, 40, 0, Math.PI * 2); g.fillStyle = color; g.fill();
    const q3 = g.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 36); q3.addColorStop(0, '#fff6dc'); q3.addColorStop(1, '#e2c88e');
    g.beginPath(); g.arc(cx, cy, 35, 0, Math.PI * 2); g.fillStyle = q3; g.fill();
    g.strokeStyle = 'rgba(60,30,10,.55)'; g.lineWidth = 1.5; g.stroke();
  }));
}

/** Placa de madeira do tamanho pedido (títulos, relógio, avisos). Gerada uma vez por tamanho; devolve a chave da textura. */
export function plateTexture(scene: Phaser.Scene, w: number, h: number, gold = false): string {
  const key = `hud_plate_${Math.round(w)}x${Math.round(h)}${gold ? 'g' : ''}`;
  make(scene, key, w, h, (g) => plate(g, 0, 0, w, h, Math.min(12, h / 2.6), gold ? { rim: '#f2c14e' } : { alpha: 0.94 }));
  return key;
}

export const HUD_SCALE = 1 / HD;
