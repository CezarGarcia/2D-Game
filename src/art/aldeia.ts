/**
 * A Aldeia (docs/gdd/09): o acampamento que vai ganhando cor. Cada construção é desenhada cinza enquanto
 * não existe e colorida depois de construída, com mais enfeite a cada nível.
 * Tudo aqui é desenho: onde cada construção fica (`VILLAGE_SPOTS`) e como ela é.
 */
import type { BuildingId } from '../data/village';

type G = CanvasRenderingContext2D;
const INK = '#1c0f0a';

/** Centro da base de cada construção, na tela de 1196×674 da área principal. */
export const VILLAGE_SPOTS: Record<BuildingId, { x: number; y: number }> = {
  mural: { x: 170, y: 330 }, casaDeFarinha: { x: 430, y: 318 }, casaDeCordel: { x: 690, y: 334 },
  rancho: { x: 140, y: 548 }, viveiro: { x: 410, y: 560 }, barracaDoSaci: { x: 668, y: 556 },
};

function shape(c: G, pts: number[], fill: string, lw = 3): void {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
  if (lw) { c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function rect(c: G, x: number, y: number, w: number, h: number, fill: string, lw = 3, r = 4): void {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = fill; c.fill();
  if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function disc(c: G, x: number, y: number, r: number, fill: string, lw = 3): void {
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function line(c: G, pts: number[], col: string, lw: number): void {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = lw + 3; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
}
function shadow(c: G, x: number, y: number, rx: number): void {
  c.beginPath(); c.ellipse(x, y + 4, rx, rx * 0.2, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(20,12,6,.3)'; c.fill();
}
/** Casa de taipa com telhado: a base de quase toda construção. */
function hut(c: G, x: number, y: number, w: number, h: number, wall: string, roof: string, thatch = false): void {
  shadow(c, x, y, w * 0.62);
  rect(c, x - w / 2, y - h, w, h, wall);
  shape(c, [x - w / 2 - 16, y - h + 4, x, y - h - (thatch ? 62 : 50), x + w / 2 + 16, y - h + 4], roof);
  if (thatch) for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * 22, y - h + 2); c.lineTo(x + i * 9, y - h - 44); c.strokeStyle = 'rgba(60,34,10,.5)'; c.lineWidth = 2; c.stroke(); }
}

const DRAW: Record<BuildingId, (c: G, x: number, y: number, lv: number) => void> = {
  /* Rancho do Andarilho: cabana de palha com rede */
  rancho(c, x, y, lv) {
    hut(c, x, y, 120, 62, '#e3c48f', '#c9972f', true);
    rect(c, x - 16, y - 44, 32, 44, '#5a3320');
    line(c, [x + 66, y - 50, x + 122, y - 50], '#8a5a34', 4);
    line(c, [x + 122, y - 80, x + 122, y], '#8a5a34', 6);
    c.beginPath(); c.moveTo(x + 62, y - 48); c.quadraticCurveTo(x + 92, y - 14, x + 122, y - 48); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = '#e0523a'; c.stroke();
    if (lv >= 2) { disc(c, x - 78, y - 14, 12, '#b5613a'); rect(c, x - 83, y - 32, 10, 10, '#b5613a'); }
    if (lv >= 3) { line(c, [x - 40, y - 114, x - 40, y - 150], '#8a5a34', 3); shape(c, [x - 40, y - 150, x - 12, y - 142, x - 40, y - 132], '#e0523a', 2.5); }
  },
  /* Mural do Almanaque: um muro pintado, com um livro aberto */
  mural(c, x, y, lv) {
    shadow(c, x, y, 92);
    rect(c, x - 82, y - 96, 164, 96, '#efe3c4');
    shape(c, [x - 90, y - 96, x + 90, y - 96, x + 82, y - 112, x - 82, y - 112], '#b8431f');
    const cols = ['#5fbf5a', '#4aa8ea', '#ffd23f', '#ff7a2a', '#c99a5a', '#9a6aff', '#ff7ad9'];
    for (let i = 0; i < 3 + lv * 2 && i < 7; i++) disc(c, x - 60 + i * 20, y - 66, 8, cols[i], 2);
    shape(c, [x - 30, y - 22, x, y - 30, x + 30, y - 22, x + 30, y - 46, x, y - 54, x - 30, y - 46], '#f6e9c8', 2.5);
    line(c, [x, y - 54, x, y - 30], '#8a5a34', 2);
  },
  /* Casa de Farinha: casa com roda de ralar e forno */
  casaDeFarinha(c, x, y, lv) {
    hut(c, x, y, 150, 70, '#f0d9a0', '#a8492a');
    rect(c, x - 60, y - 50, 34, 50, '#5a3320');
    rect(c, x + 4, y - 50, 40, 28, '#3a2014', 3, 3);
    disc(c, x + 104, y - 34, 32, '#c9a26b'); disc(c, x + 104, y - 34, 7, '#5a3320');
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; line(c, [x + 104, y - 34, x + 104 + Math.cos(a) * 28, y - 34 + Math.sin(a) * 28], '#8a5a34', 3); }
    if (lv >= 2) for (let i = 0; i < 2; i++) { rect(c, x - 122 + i * 26, y - 22, 22, 22, '#e8c48e', 2.5, 6); }
    if (lv >= 3) { rect(c, x + 34, y - 132, 16, 34, '#8d8a84'); c.beginPath(); c.arc(x + 46, y - 146, 9, 0, 7); c.arc(x + 58, y - 160, 7, 0, 7); c.fillStyle = 'rgba(240,235,220,.75)'; c.fill(); }
  },
  /* Casa de Cordel: banca com um varal de folhetos */
  casaDeCordel(c, x, y, lv) {
    hut(c, x, y, 110, 60, '#e9d6a8', '#3d7a4a');
    rect(c, x - 40, y - 30, 80, 12, '#8a5a34');
    line(c, [x - 96, y - 86, x - 96, y], '#8a5a34', 5); line(c, [x + 96, y - 86, x + 96, y], '#8a5a34', 5);
    c.beginPath(); c.moveTo(x - 96, y - 84); c.quadraticCurveTo(x, y - 66, x + 96, y - 84); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    const n = 3 + lv, cols = ['#f6e9c8', '#f2c14e', '#ffb0a0', '#bfe6ff', '#d9c7ff', '#c8f7a0', '#f6e9c8', '#f2c14e'];
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, px = x - 96 + 192 * t, py = y - 84 + 18 * (1 - Math.pow(2 * t - 1, 2)); rect(c, px - 9, py, 18, 24, cols[i % cols.length], 2, 2); }
  },
  /* Viveiro: cercado com poleiro e casinha */
  viveiro(c, x, y, lv) {
    shadow(c, x, y, 96);
    rect(c, x - 86, y - 40, 172, 40, 'rgba(120,160,80,.55)', 0, 8);
    for (let i = 0; i <= 8; i++) line(c, [x - 86 + i * 21.5, y - 48, x - 86 + i * 21.5, y], '#c9a26b', 4);
    line(c, [x - 90, y - 34, x + 90, y - 34], '#c9a26b', 4); line(c, [x - 90, y - 14, x + 90, y - 14], '#c9a26b', 4);
    line(c, [x + 40, y - 110, x + 40, y - 30], '#8a5a34', 5); line(c, [x + 14, y - 96, x + 66, y - 96], '#8a5a34', 5);
    rect(c, x - 62, y - 86, 48, 40, '#e3c48f'); shape(c, [x - 70, y - 86, x - 38, y - 112, x - 6, y - 86], '#b8431f'); disc(c, x - 38, y - 64, 9, '#3a2014', 2);
    for (let i = 0; i < lv; i++) { disc(c, x + 22 + i * 18, y - 104, 7, ['#e8452c', '#4aa8ea', '#ffd23f'][i], 2); shape(c, [x + 28 + i * 18, y - 104, x + 36 + i * 18, y - 102, x + 28 + i * 18, y - 99], '#f2a531', 1.5); }
  },
  /* Barraca do Saci: lona vermelha listrada, com um cata-vento */
  barracaDoSaci(c, x, y, lv) {
    shadow(c, x, y, 80);
    line(c, [x - 62, y - 70, x - 62, y], '#8a5a34', 5); line(c, [x + 62, y - 70, x + 62, y], '#8a5a34', 5);
    rect(c, x - 62, y - 40, 124, 40, '#8a5a34');
    for (let i = 0; i < 6; i++) shape(c, [x - 72 + i * 24, y - 70, x - 48 + i * 24, y - 70, x - 40 + i * 20.6 - 4, y - 112, x - 60 + i * 20.6 - 4, y - 112], i % 2 ? '#f6e9c8' : '#e0344c', 2.5);
    line(c, [x, y - 112, x, y - 150], '#8a5a34', 3);
    const cols = ['#ffd23f', '#e0344c', '#4aa8ea', '#5fbf5a'];
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + 0.4; shape(c, [x, y - 150, x + Math.cos(a) * 22, y - 150 + Math.sin(a) * 22, x + Math.cos(a + 1.1) * 13, y - 150 + Math.sin(a + 1.1) * 13], cols[i], 2); }
    for (let i = 0; i < lv; i++) disc(c, x - 36 + i * 36, y - 52, 9, ['#d98a4a', '#e0344c', '#9a6aff'][i], 2);
  },
};

/** Desenha uma construção. Sem nível, sai cinza e apagada: é o que o Esquecimento deixou. */
export function drawBuilding(c: G, id: BuildingId, x: number, y: number, level: number): void {
  c.save();
  if (level <= 0) c.filter = 'grayscale(1) brightness(.72) contrast(.9)';
  DRAW[id](c, x, y, Math.max(1, level));
  c.restore();
}

/** O chão da Aldeia: céu, morros, um rio e a praça de terra batida. `color` (0 a 1) é quanto da aldeia já foi construído. */
export function paintVillage(c: G, W: number, H: number, levels: Partial<Record<BuildingId, number>>, color: number): void {
  const mix = (gray: string, col: string) => `color-mix(in srgb, ${col} ${Math.round(color * 100)}%, ${gray})`;
  const sky = c.createLinearGradient(0, 0, 0, H * 0.5);
  sky.addColorStop(0, mix('#8d949c', '#7fc4f0')); sky.addColorStop(1, mix('#c9c9c4', '#fbe9b8'));
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  /* sol */
  c.beginPath(); c.arc(W * 0.62, 84, 46, 0, Math.PI * 2); c.fillStyle = mix('#e4e2da', '#fff3b0'); c.fill();
  /* morros ao fundo */
  const hill = (y: number, amp: number, col: string, seed: number) => {
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 20) c.lineTo(x, y + Math.sin(x * 0.006 + seed) * amp + Math.sin(x * 0.017 + seed * 2) * amp * 0.35);
    c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill();
  };
  hill(170, 34, mix('#9a9c94', '#8fbf7a'), 1); hill(214, 26, mix('#868880', '#6fae5c'), 3);
  /* chão */
  const ground = c.createLinearGradient(0, 230, 0, H);
  ground.addColorStop(0, mix('#8c8c82', '#8fc46a')); ground.addColorStop(1, mix('#6f6f66', '#5c9a48'));
  c.fillStyle = ground; c.fillRect(0, 236, W, H - 236);
  /* rio que corta a aldeia e some atrás do painel */
  c.beginPath(); c.moveTo(W * 0.5, 236);
  c.bezierCurveTo(W * 0.56, 300, W * 0.74, 380, W * 0.7, 470); c.bezierCurveTo(W * 0.68, 560, W * 0.8, 620, W * 0.84, H);
  c.lineTo(W * 0.74, H); c.bezierCurveTo(W * 0.7, 620, W * 0.6, 560, W * 0.62, 470); c.bezierCurveTo(W * 0.66, 390, W * 0.5, 300, W * 0.46, 236); c.closePath();
  c.fillStyle = mix('#a4a8aa', '#6fc0ea'); c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(28,15,10,.35)'; c.stroke();
  /* praça de terra batida e trilhas */
  c.beginPath(); c.ellipse(410, 440, 330, 76, 0, 0, Math.PI * 2); c.fillStyle = mix('#a09a8e', '#d9b87a'); c.fill();
  c.strokeStyle = mix('#8f897e', '#c39a5a'); c.lineWidth = 16; c.lineCap = 'round';
  for (const s of Object.values(VILLAGE_SPOTS)) { c.beginPath(); c.moveTo(410, 440); c.lineTo(s.x, s.y - 6); c.stroke(); }
  /* fogueira no meio da praça */
  c.beginPath(); c.ellipse(410, 446, 30, 9, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(40,24,12,.5)'; c.fill();
  c.beginPath(); c.moveTo(396, 446); c.quadraticCurveTo(398, 416, 410, 400); c.quadraticCurveTo(424, 418, 424, 446); c.closePath(); c.fillStyle = mix('#bdb8ae', '#ff9a3a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
  /* árvores espalhadas */
  const tree = (x: number, y: number, s: number) => {
    c.fillStyle = '#5a3320'; c.fillRect(x - 4 * s, y - 30 * s, 8 * s, 30 * s);
    c.beginPath(); c.arc(x, y - 44 * s, 26 * s, 0, 7); c.arc(x - 18 * s, y - 32 * s, 18 * s, 0, 7); c.arc(x + 18 * s, y - 32 * s, 18 * s, 0, 7);
    c.fillStyle = mix('#7d8078', '#3f9a4a'); c.fill(); c.lineWidth = 2.5; c.strokeStyle = 'rgba(28,15,10,.55)'; c.stroke();
  };
  for (const [x, y, s] of [[40, 300, 1.1], [300, 268, 0.9], [560, 276, 1], [820, 300, 1.2], [30, 640, 1.3], [270, 650, 1], [540, 660, 1.2], [780, 600, 1.1], [860, 430, 0.9]] as const) tree(x, y, s);
  /* as construções, das de trás para as da frente */
  for (const id of (Object.keys(VILLAGE_SPOTS) as BuildingId[]).sort((a, b) => VILLAGE_SPOTS[a].y - VILLAGE_SPOTS[b].y)) drawBuilding(c, id, VILLAGE_SPOTS[id].x, VILLAGE_SPOTS[id].y, levels[id] ?? 0);
}
