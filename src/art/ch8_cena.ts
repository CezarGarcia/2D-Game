// @ts-nocheck
/**
 * Cenário do Capítulo 8, "Terra Sem Nome": chão da arena, moldura e mapa.
 * Tudo é papel antigo apagado: rabiscos de lápis, manchas de borracha, lembranças desbotadas dos
 * capítulos anteriores e, nas bordas, o vazio branco que vai comendo o mundo.
 * A área jogável (x 120–1160, y 150–640 numa tela de 1280×720) só recebe detalhe de chão.
 * Determinístico pela semente (sem Math.random).
 */
import { OUT, TAU, cel, dot, el, ln, poly } from './characters';

function rng(s) { s = s >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };
const PI = Math.PI;
/* grafite */
function gr(a) { return 'rgba(52,46,62,' + a + ')'; }

/* ---------------- papel ---------------- */
/* textura de papel velho: manchas, anéis de umidade, fibras, pontinhos e vincos */
function paperTexture(g, W, H, R, k) {
  k = k == null ? 1 : k;
  let i;
  for (i = 0; i < 46; i++) { g.beginPath(); g.ellipse(R() * W, R() * H, 40 + R() * 160, 20 + R() * 70, R() * 3, 0, TAU); g.fillStyle = i % 2 ? 'rgba(110,92,60,' + 0.05 * k + ')' : 'rgba(255,252,238,' + 0.08 * k + ')'; g.fill(); }
  for (i = 0; i < 7; i++) {
    const x = R() * W, y = R() * H, r = 26 + R() * 60;
    g.beginPath(); g.ellipse(x, y, r, r * (0.7 + R() * 0.3), R() * 3, 0, TAU); g.fillStyle = 'rgba(150,120,70,' + 0.04 * k + ')'; g.fill();
    g.strokeStyle = 'rgba(130,100,60,' + 0.12 * k + ')'; g.lineWidth = 2 + R() * 2; g.stroke();
  }
  [['rgba(90,78,60,' + 0.13 * k + ')', 900], ['rgba(255,255,248,' + 0.28 * k + ')', 700]].forEach(function (f) {
    g.beginPath();
    for (let j = 0; j < f[1]; j++) { const x = R() * W, y = R() * H, a = R() * TAU, l = 2 + R() * 7; g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); }
    g.strokeStyle = f[0]; g.lineWidth = 0.8; g.stroke();
  });
  g.fillStyle = 'rgba(140,110,70,' + 0.22 * k + ')';
  for (i = 0; i < 260; i++) { g.beginPath(); g.arc(R() * W, R() * H, 0.5 + R() * 1.4, 0, TAU); g.fill(); }
}
/* vinco de dobra: uma linha escura e uma clara do lado */
function crease(g, x0, y0, x1, y1, a) {
  ln(g, [x0, y0, x1, y1], 'rgba(90,76,56,' + 0.16 * a + ')', 2.2);
  ln(g, [x0 + 2, y0 + 2, x1 + 2, y1 + 2], 'rgba(255,255,250,' + 0.35 * a + ')', 1.6);
}
/* mancha de borracha, com farelos */
function eraser(g, R, x, y, len, ang, wd, a) {
  const n = Math.max(4, Math.round(len / 7)), bend = (R() - 0.5) * 0.6;
  for (let i = 0; i <= n; i++) {
    const u = i / n, an = ang + bend * (u - 0.5), px = x + Math.cos(ang) * len * u + Math.cos(an + 1.57) * Math.sin(u * PI) * len * 0.08, py = y + Math.sin(ang) * len * u + Math.sin(an + 1.57) * Math.sin(u * PI) * len * 0.08;
    const r = wd * (0.6 + 0.4 * Math.sin(u * PI)), q = g.createRadialGradient(px, py, 0, px, py, r);
    q.addColorStop(0, 'rgba(255,253,246,' + 0.16 * a + ')'); q.addColorStop(1, 'rgba(255,253,246,0)'); g.fillStyle = q; g.fillRect(px - r, py - r, r * 2, r * 2);
  }
  for (let i = 0; i < 5; i++) { const u = R(), px = x + Math.cos(ang) * len * u + (R() - 0.5) * wd * 1.4, py = y + Math.sin(ang) * len * u + (R() - 0.5) * wd * 1.4; g.beginPath(); g.ellipse(px, py, 1.4 + R() * 1.4, 0.7, R() * 3, 0, TAU); g.fillStyle = 'rgba(120,108,100,' + 0.4 * a + ')'; g.fill(); }
}
/* rabiscos de lápis */
function spiral(g, x, y, r, turns, a, lw) { g.beginPath(); const n = turns * 24; for (let i = 0; i <= n; i++) { const t = i / n, an = t * turns * TAU, q = r * t; g[i ? 'lineTo' : 'moveTo'](x + Math.cos(an) * q, y + Math.sin(an) * q * 0.8); } g.strokeStyle = gr(a); g.lineWidth = lw || 1.2; g.lineCap = 'round'; g.stroke(); }
function scribblePatch(g, R, x, y, w, h, a) { g.beginPath(); g.moveTo(x, y); const n = 10 + Math.floor(R() * 10); for (let i = 0; i < n; i++) g.lineTo(x + (i % 2 ? w : 0) + (R() - 0.5) * 6, y + (i / n) * h + (R() - 0.5) * 4); g.strokeStyle = gr(a); g.lineWidth = 1.1; g.lineJoin = 'round'; g.stroke(); }
function handwriting(g, R, x, y, w, rows, a, cross) {
  for (let r = 0; r < rows; r++) {
    const yy = y + r * 16; g.beginPath(); let xx = x;
    while (xx < x + w * (0.6 + R() * 0.4)) { const wl = 16 + R() * 30; for (let i = 0; i <= wl; i += 1.5) { const p = xx + i; g[i ? 'lineTo' : 'moveTo'](p + Math.cos(i * 1.3) * 1.6, yy + Math.sin(i * 1.3) * 2.6 - (i % 9 < 1.5 ? 3 : 0)); } xx += wl + 6 + R() * 6; g.moveTo(xx, yy); }
    g.strokeStyle = gr(a); g.lineWidth = 1; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    if (cross && R() < 0.6) ln(g, [x - 4, yy + 1 + (R() - 0.5) * 3, xx - 4, yy - 1 + (R() - 0.5) * 3], gr(a * 1.2), 1.6);
  }
}
function doodle(g, R, x, y, s, a) {
  const t = Math.floor(R() * 5); g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = gr(a); g.lineWidth = 1.3 / s; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  if (t === 0) { for (let i = 0; i <= 5; i++) { const an = -PI / 2 + i * TAU * 2 / 5; g[i ? 'lineTo' : 'moveTo'](Math.cos(an) * 12, Math.sin(an) * 12); } }
  else if (t === 1) { g.ellipse(0, 0, 13, 11, 0, 0, TAU); g.moveTo(-6, 0); g.ellipse(0, 0, 6, 5, 0, PI, TAU); }
  else if (t === 2) { g.moveTo(-16, 4); g.quadraticCurveTo(0, -10, 14, 0); g.moveTo(8, -6); g.lineTo(14, 0); g.lineTo(6, 4); }
  else if (t === 3) { g.moveTo(-10, 10); g.lineTo(-10, -4); g.lineTo(0, -12); g.lineTo(10, -4); g.lineTo(10, 10); g.closePath(); g.moveTo(-3, 10); g.lineTo(-3, 3); g.lineTo(3, 3); g.lineTo(3, 10); }
  else { g.ellipse(0, -4, 7, 8, 0, 0, TAU); g.moveTo(0, 4); g.lineTo(0, 14); g.moveTo(-8, 8); g.lineTo(8, 8); g.moveTo(0, 14); g.lineTo(-6, 22); g.moveTo(0, 14); g.lineTo(6, 22); }
  g.stroke(); g.restore();
}
/* bolinha de papel amassado (objeto baixo de borda) */
function crumple(g, R, x, y, r) {
  g.beginPath(); g.ellipse(x + r * 0.35, y + r * 0.5, r * 1.1, r * 0.55, 0, 0, TAU); g.fillStyle = 'rgba(70,60,50,.22)'; g.fill();
  const P = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, q = r * (0.82 + R() * 0.3); P.push(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.9); }
  cel(g, function (c) { poly(c, P); }, '#efebe2', {
    k: r * 0.18, lw: 2, out: 'rgba(52,46,62,.85)', sh: 'rgba(80,70,90,.3)', hi: 'rgba(255,255,255,.5)', inn: function (c) {
      for (let i = 0; i < 7; i++) { const a = R() * TAU, b2 = a + 1 + R(); ln(c, [x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(b2) * r * 0.6, y + Math.sin(b2) * r * 0.6, x + Math.cos(a + 0.5) * r, y + Math.sin(a + 0.5) * r], i % 2 ? 'rgba(255,255,255,.7)' : 'rgba(80,70,90,.35)', 1); }
      for (let i = 0; i < 3; i++) ln(c, [x - r * 0.6, y - r * 0.3 + i * r * 0.3, x + r * 0.3, y - r * 0.2 + i * r * 0.32], gr(0.25), 0.8);
    },
  });
}
/* folha de papel rasgada caída no chão, com a ponta virada */
function sheetScrap(g, R, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); poly(g, [-22 * s + 4, -15 * s + 5, 24 * s + 4, -13 * s + 5, 20 * s + 4, 16 * s + 5, -18 * s + 4, 14 * s + 5]); g.fillStyle = 'rgba(70,60,50,.18)'; g.fill();
  const E = [-22 * s, -15 * s, 24 * s, -13 * s, 22 * s, -2 * s, 26 * s, 4 * s, 18 * s, 8 * s, 20 * s, 16 * s, -18 * s, 14 * s];
  cel(g, function (c) { poly(c, E); }, '#f1ede4', {
    k: 1.6, lw: 1.6, out: 'rgba(52,46,62,.75)', inn: function (c) {
      for (let i = 0; i < 4; i++) ln(c, [-18 * s, (-9 + i * 6) * s, (12 - R() * 12) * s, (-9 + i * 6) * s], 'rgba(90,110,140,.22)', 0.8);
      handwriting(c, R, -16 * s, -8 * s, 30 * s, 3, 0.25, false);
    },
  });
  cel(g, function (c) { poly(c, [24 * s, -13 * s, 22 * s, -2 * s, 14 * s, -9 * s]); }, '#dcd6ca', { k: 0.8, lw: 1.3, out: 'rgba(52,46,62,.75)' });
  g.restore();
}
/* lápis gasto (cinza, como tudo aqui) */
function pencil(g, x, y, l, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.ellipse(4, 7, l * 0.55, 4, 0, 0, TAU); g.fillStyle = 'rgba(60,50,40,.22)'; g.fill();
  cel(g, function (c) { poly(c, [-l / 2, -4, l / 2 - 12, -4, l / 2 - 12, 4, -l / 2, 4]); }, '#bdb6a8', { k: 1.4, lw: 1.8, out: 'rgba(40,36,48,.9)', inn: function (c) { ln(c, [-l / 2, -1.3, l / 2 - 12, -1.3], 'rgba(255,255,255,.35)', 1); ln(c, [-l / 2, 1.6, l / 2 - 12, 1.6], 'rgba(60,54,66,.3)', 1); } });
  cel(g, function (c) { poly(c, [l / 2 - 12, -4, l / 2, 0, l / 2 - 12, 4]); }, '#e2d9c4', { k: 0.8, lw: 1.6, out: 'rgba(40,36,48,.9)' });
  g.beginPath(); poly(g, [l / 2 - 4, -1.3, l / 2, 0, l / 2 - 4, 1.3]); g.fillStyle = '#3a3440'; g.fill();
  cel(g, function (c) { poly(c, [-l / 2 - 8, -4, -l / 2, -4, -l / 2, 4, -l / 2 - 8, 4]); }, '#d8d4dc', { k: 0.8, lw: 1.6, out: 'rgba(40,36,48,.9)' });
  g.restore();
}

/* ---------------- lembranças desbotadas (traço de lápis, sem cor) ---------------- */
function memo(g, fn, a) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); fn(g); g.fillStyle = 'rgba(246,243,235,' + 0.55 * a + ')'; g.fill();
  g.strokeStyle = gr(0.55 * a); g.lineWidth = 1.7; g.stroke();
  g.save(); g.translate(1.6, -1.2); g.beginPath(); fn(g); g.strokeStyle = gr(0.25 * a); g.lineWidth = 0.9; g.stroke(); g.restore();
  g.restore();
}
function memCactus(g, R, x, y, s, a) {
  memo(g, function (c) {
    c.moveTo(x - 7 * s, y); c.lineTo(x - 7 * s, y - 70 * s); c.quadraticCurveTo(x, y - 80 * s, x + 7 * s, y - 70 * s); c.lineTo(x + 7 * s, y);
    c.moveTo(x - 7 * s, y - 30 * s); c.lineTo(x - 20 * s, y - 30 * s); c.lineTo(x - 20 * s, y - 52 * s); c.quadraticCurveTo(x - 16 * s, y - 58 * s, x - 12 * s, y - 52 * s); c.lineTo(x - 12 * s, y - 38 * s); c.lineTo(x - 7 * s, y - 38 * s);
    c.moveTo(x + 7 * s, y - 40 * s); c.lineTo(x + 19 * s, y - 40 * s); c.lineTo(x + 19 * s, y - 60 * s); c.quadraticCurveTo(x + 23 * s, y - 66 * s, x + 27 * s, y - 60 * s); c.lineTo(x + 27 * s, y - 33 * s); c.lineTo(x + 7 * s, y - 33 * s);
  }, a);
  for (let i = 0; i < 9; i++) { const yy = y - 6 * s - i * 7 * s; ln(g, [x - 8 * s, yy, x - 11 * s, yy - 2 * s], gr(0.35 * a), 0.8); ln(g, [x + 8 * s, yy - 3 * s, x + 11 * s, yy - 5 * s], gr(0.35 * a), 0.8); }
  ln(g, [x, y - 4 * s, x, y - 70 * s], gr(0.3 * a), 1);
}
function memRoot(g, R, x, y, ang, len, w, a) {
  const n = 10, P = []; let an = ang, px = x, py = y; const ph = R() * 6;
  for (let i = 0; i <= n; i++) { P.push([px, py]); an = ang + Math.sin(ph + i * 0.9) * 0.4; px += Math.cos(an) * len / n; py += Math.sin(an) * len / n * 0.8; }
  for (let i = 0; i < n; i++) { const ww = w * (1 - i / (n + 1)); g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[i + 1][0], P[i + 1][1]); g.lineCap = 'round'; g.strokeStyle = gr(0.5 * a); g.lineWidth = ww; g.stroke(); }
  for (let i = 0; i < n; i++) { const ww = w * (1 - i / (n + 1)) - 2.6; if (ww <= 0.5) continue; g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[i + 1][0], P[i + 1][1]); g.strokeStyle = 'rgba(236,231,220,' + (0.9 * a + 0.1) + ')'; g.lineWidth = ww; g.stroke(); }
  for (let i = 1; i < n - 1; i += 2) ln(g, [P[i][0] - 2, P[i][1] - w * 0.15, P[i + 1][0] - 2, P[i + 1][1] - w * 0.15], gr(0.25 * a), 0.8);
}
function memRock(g, R, x, y, s, a) {
  const P = [x - 22 * s, y, x - 18 * s, y - 14 * s, x - 4 * s, y - 22 * s, x + 14 * s, y - 17 * s, x + 22 * s, y - 4 * s, x + 18 * s, y];
  memo(g, function (c) { poly(c, P); }, a);
  ln(g, [x - 4 * s, y - 20 * s, x - 1 * s, y - 10 * s, x + 6 * s, y - 6 * s], gr(0.35 * a), 1);
  for (let i = 0; i < 6; i++) ln(g, [x + (8 + i * 2) * s, y - (14 - i * 2) * s, x + (12 + i * 2) * s, y - (12 - i * 2) * s], gr(0.25 * a), 0.8);
}
function memPond(g, R, x, y, rx, ry, a) {
  memo(g, function (c) { for (let i = 0; i <= 24; i++) { const t = i / 24 * TAU, q = 1 + Math.sin(t * 3 + x) * 0.08; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(t) * rx * q, y + Math.sin(t) * ry * q); } c.closePath(); }, a);
  for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + (R() - 0.5) * rx * 0.6, y + (R() - 0.5) * ry * 0.5, rx * (0.2 + i * 0.12), ry * (0.2 + i * 0.1), 0, 0.3, 2.6); g.strokeStyle = gr(0.3 * a); g.lineWidth = 1; g.stroke(); }
}
function memGrass(g, R, x, y, s, a) {
  g.beginPath(); for (let i = 0; i < 9; i++) { const an = -PI / 2 + (i - 4) * 0.2 + (R() - 0.5) * 0.15, l = (18 + R() * 20) * s; g.moveTo(x + (i - 4) * 2 * s, y); g.quadraticCurveTo(x + Math.cos(an) * l * 0.4 + (i - 4) * 2 * s, y + Math.sin(an) * l * 0.6, x + Math.cos(an) * l + (i - 4) * 3 * s, y + Math.sin(an) * l); }
  g.strokeStyle = gr(0.5 * a); g.lineWidth = 1.3; g.lineCap = 'round'; g.stroke();
}
function memFence(g, R, x, y, n, s, a) { for (let i = 0; i < n; i++) { const xx = x + i * 22 * s, r = (9 + R() * 3) * s; memo(g, function (c) { c.ellipse(xx, y - r * 0.7 - (i % 2) * 6 * s, r * 1.15, r * 0.8, R() * 0.4, 0, TAU); }, a); } }
function memLeaf(g, R, x, y, r, a) { memo(g, function (c) { c.moveTo(x, y); c.arc(x, y, r, 0.12, TAU - 0.04); c.closePath(); }, a); ln(g, [x, y, x + r * 0.8, y - r * 0.3], gr(0.3 * a), 0.8); ln(g, [x, y, x - r * 0.6, y + r * 0.5], gr(0.3 * a), 0.8); }
function memTree(g, R, x, y, s, a) {
  memo(g, function (c) { c.moveTo(x - 6 * s, y); c.quadraticCurveTo(x - 4 * s, y - 30 * s, x - 14 * s, y - 50 * s); c.lineTo(x - 8 * s, y - 52 * s); c.quadraticCurveTo(x, y - 40 * s, x + 2 * s, y - 56 * s); c.lineTo(x + 8 * s, y - 55 * s); c.quadraticCurveTo(x + 4 * s, y - 30 * s, x + 7 * s, y); c.closePath(); }, a);
  for (let i = 0; i < 4; i++) { const cx = x + [-18, -4, 10, -8][i] * s, cy = y + [-58, -70, -60, -50][i] * s; memo(g, function (c) { c.ellipse(cx, cy, 14 * s, 10 * s, 0, 0, TAU); }, a * 0.8); }
}
/* árvore só de contorno rabiscado (para a moldura) */
function scribbleTree(g, R, x, y, h, s, a) {
  const lean = (R() - 0.5) * 30 * s, tx = x + lean, ty = y - h;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  /* tronco */
  [[-1, 0], [1, 0.5]].forEach(function (sd) {
    g.beginPath(); g.moveTo(x + sd[0] * 9 * s, y); g.bezierCurveTo(x + sd[0] * 7 * s + 4, y - h * 0.35, tx + sd[0] * 6 * s - 4, y - h * 0.65, tx + sd[0] * 5 * s, ty + 14 * s);
    g.strokeStyle = gr(a * 0.75); g.lineWidth = 2 * s; g.stroke();
  });
  for (let i = 0; i < 3; i++) { const u = 0.45 + i * 0.15, bx = lp2(x, tx, u), by = y - h * u, sd = i % 2 ? 1 : -1; ln(g, [bx, by, bx + sd * (20 + R() * 16) * s, by - (16 + R() * 10) * s], gr(a * 0.6), 1.6 * s); }
  /* copa: novelo de laçadas */
  const r = 46 * s; g.beginPath(); g.ellipse(tx, ty, r * 1.15, r * 0.85, 0, 0, TAU); g.fillStyle = 'rgba(250,248,242,' + 0.35 * a + ')'; g.fill();
  g.beginPath(); const n = 420;
  for (let i = 0; i <= n; i++) { const t = i / n, an = t * TAU * 2.3, q = r * (0.68 + 0.22 * Math.sin(t * 17)), lo = i * 0.42, px = tx + Math.cos(an) * q * 1.1 + Math.cos(lo) * r * 0.17, py = ty + Math.sin(an) * q * 0.8 + Math.sin(lo) * r * 0.17; g[i ? 'lineTo' : 'moveTo'](px, py); }
  g.strokeStyle = gr(a * 0.7); g.lineWidth = 1.5 * s; g.stroke();
  g.translate(2, -1.6); g.strokeStyle = gr(a * 0.3); g.lineWidth = 0.8; g.stroke();
  g.restore();
}
function lp2(a, b, k) { return a + (b - a) * k; }

/* ---------------- chão da arena ---------------- */
/** Chão da arena em 1280×720. 0: papel apagado com rabiscos; 1: lembranças desbotadas dos outros capítulos; 2: papel rachando em vazio branco nas bordas. */
export function paintGround(g, W, H, variant, seed) {
  const v = (((variant | 0) % 3) + 3) % 3, R = rng((seed || 31) + v * 7919);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky }, aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 40 + R() * (aw - 80), A.y0 + 30 + R() * (ah - 60)]; };
  const outA = function (pad) { for (let t = 0; t < 40; t++) { const x = R() * W, y = R() * H; if (x < A.x0 - pad || x > A.x1 + pad || y < A.y0 - pad || y > A.y1 + pad) return [x, y]; } return [20, 20]; };
  const C = [['#d0c6ad', '#c4b99d', '#ddd5c2'], ['#cbc6b9', '#bcb6a7', '#d9d5cb'], ['#d2cbba', '#c7beaa', '#e8e3d8']][v];
  let q = g.createRadialGradient(W * 0.5, H * 0.53, 40, W * 0.5, H * 0.5, W * 0.68);
  q.addColorStop(0, C[0]); q.addColorStop(0.62, C[1]); q.addColorStop(1, C[2]); g.fillStyle = q; g.fillRect(0, 0, W, H);
  paperTexture(g, W, H, R, 1);
  /* vincos de dobra atravessando a folha */
  crease(g, W * (0.3 + R() * 0.1), -10, W * (0.36 + R() * 0.1), H + 10, 1);
  crease(g, -10, H * (0.42 + R() * 0.12), W + 10, H * (0.48 + R() * 0.1), 0.8);
  if (v === 0) crease(g, W * 0.7, -10, W * 0.66, H + 10, 0.7);

  if (v === 0) {
    /* ---- papel apagado com rabiscos ---- */
    /* pauta de caderno, meio apagada */
    for (let y = 40; y < H; y += 34) { g.save(); g.setLineDash([60 + R() * 300, 20 + R() * 90]); g.lineDashOffset = R() * 300; ln(g, [0, y, W, y + (R() - 0.5) * 3], 'rgba(90,110,140,.1)', 1.2); g.restore(); }
    for (let i = 0; i < 7; i++) { const p = inA(); handwriting(g, R, p[0] - 80, p[1] - 10, 120 + R() * 120, 1 + Math.floor(R() * 3), 0.16, true); }
    for (let i = 0; i < 9; i++) { const p = inA(); spiral(g, p[0], p[1], 8 + R() * 16, 2 + Math.floor(R() * 3), 0.16); }
    for (let i = 0; i < 8; i++) { const p = inA(); scribblePatch(g, R, p[0], p[1], 20 + R() * 30, 14 + R() * 20, 0.14); }
    for (let i = 0; i < 9; i++) { const p = inA(); doodle(g, R, p[0], p[1], 0.8 + R() * 0.8, 0.17); }
    for (let i = 0; i < 12; i++) { const p = inA(); eraser(g, R, p[0], p[1], 50 + R() * 90, R() * TAU, 16 + R() * 16, 0.9); }
    /* borda: rabiscos maiores, bolinhas de papel, folhas rasgadas, lápis */
    for (let i = 0; i < 22; i++) { const p = outA(20); handwriting(g, R, p[0] - 60, p[1], 140, 2, 0.3, true); }
    for (let i = 0; i < 12; i++) { const p = outA(26); spiral(g, p[0], p[1], 14 + R() * 20, 3, 0.32, 1.4); }
    for (let i = 0; i < 10; i++) { const p = outA(20); doodle(g, R, p[0], p[1], 1.2 + R(), 0.35); }
    const items = [];
    for (let i = 0; i < 9; i++) { const p = outA(36), r = 14 + R() * 12; items.push({ y: p[1], d: function () { crumple(g, R, p[0], p[1], r); } }); }
    for (let i = 0; i < 6; i++) { const p = outA(46), s = 1 + R() * 0.6, rot = (R() - 0.5) * 1.2; items.push({ y: p[1], d: function () { sheetScrap(g, R, p[0], p[1], s, rot); } }); }
    items.push({ y: H - 40, d: function () { pencil(g, W * 0.82, H - 34 * ky, 120, -0.12); } });
    items.push({ y: 60, d: function () { pencil(g, W * 0.2, 56 * ky, 90, 0.2); } });
    items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.d(); });
  } else if (v === 1) {
    /* ---- lembranças dos outros capítulos, sem cor ---- */
    for (let i = 0; i < 5; i++) { const p = inA(); memPond(g, R, p[0], p[1], 60 + R() * 70, 22 + R() * 20, 0.35); }
    for (let i = 0; i < 26; i++) { const p = inA(); memLeaf(g, R, p[0], p[1], 5 + R() * 6, 0.35); }
    /* pegadas que somem */
    let fx = A.x0 + 60, fy = A.y1 - 60;
    for (let i = 0; i < 16; i++) { const al = 0.28 * (1 - i / 16); g.beginPath(); g.ellipse(fx, fy + (i % 2 ? -8 : 8), 5, 3, -0.5, 0, TAU); g.fillStyle = gr(al); g.fill(); fx += 46; fy -= 18; }
    for (let i = 0; i < 9; i++) { const p = inA(); eraser(g, R, p[0], p[1], 60 + R() * 80, R() * TAU, 18 + R() * 14, 0.8); }
    const items = [];
    const at = function (fn) { const p = outA(40); items.push({ y: p[1], d: function () { fn(p[0], p[1]); } }); };
    for (let i = 0; i < 4; i++) at(function (x, y) { memCactus(g, R, x, y + 30, 0.9 + R() * 0.4, 0.9); });
    for (let i = 0; i < 6; i++) at(function (x, y) { memRock(g, R, x, y, 1 + R() * 0.8, 0.9); });
    for (let i = 0; i < 8; i++) at(function (x, y) { memGrass(g, R, x, y, 0.9 + R() * 0.5, 0.9); });
    for (let i = 0; i < 3; i++) at(function (x, y) { memFence(g, R, x - 40, y, 4, 1, 0.85); });
    for (let i = 0; i < 4; i++) at(function (x, y) { memTree(g, R, x, y + 30, 0.9 + R() * 0.3, 0.85); });
    for (let i = 0; i < 3; i++) at(function (x, y) { memPond(g, R, x, y, 50 + R() * 30, 20 + R() * 10, 0.85); for (let j = 0; j < 4; j++) memLeaf(g, R, x + (R() - 0.5) * 60, y + (R() - 0.5) * 20, 6 + R() * 4, 0.85); });
    [[A.x0 - 40, A.y0 + 90, 0.3], [A.x1 + 40, A.y0 + 140, PI - 0.3], [A.x0 - 30, A.y1 - 30, -0.4], [A.x1 + 36, A.y1 - 60, PI + 0.4], [W * 0.4, A.y0 - 40, 1.2], [W * 0.7, A.y1 + 40, -1.6]].forEach(function (t) { items.push({ y: t[1] - 300, d: function () { memRoot(g, R, t[0], t[1], t[2], 120, 14, 0.9); memRoot(g, R, t[0], t[1], t[2] + 0.7, 80, 10, 0.9); } }); });
    items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.d(); });
    /* a borracha passou por cima de tudo */
    for (let i = 0; i < 14; i++) { const p = outA(10); eraser(g, R, p[0], p[1], 80 + R() * 120, R() * TAU, 22 + R() * 20, 1); }
  } else {
    /* ---- o papel rachando em vazio branco ---- */
    for (let i = 0; i < 6; i++) { const p = inA(); handwriting(g, R, p[0] - 60, p[1], 100 + R() * 80, 1 + Math.floor(R() * 2), 0.14, true); }
    for (let i = 0; i < 6; i++) { const p = inA(); eraser(g, R, p[0], p[1], 50 + R() * 70, R() * TAU, 16 + R() * 12, 0.8); }
    for (let i = 0; i < 6; i++) { const p = inA(); spiral(g, p[0], p[1], 8 + R() * 12, 2, 0.13); }
    /* contorno do que sobrou do papel: recua mais nos cantos */
    const ph = [R() * 6, R() * 6, R() * 6, R() * 6];
    const depth = function (side, t) { const corner = Math.pow(Math.abs(t - 0.5) * 2, 4), base = [96, 92, 66, 92][side] * (side === 2 ? ky : kx); return base * (0.55 + 0.3 * Math.sin(t * 9 + ph[side]) + 0.2 * Math.sin(t * 23 + ph[side] * 2)) + corner * base * 0.9; };
    const E = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; E.push([t * W, depth(0, t)]); }
    for (let i = 0; i <= 24; i++) { const t = i / 24; E.push([W - depth(1, t), t * H]); }
    for (let i = 0; i <= 40; i++) { const t = i / 40; E.push([W - t * W, H - depth(2, t)]); }
    for (let i = 0; i <= 24; i++) { const t = i / 24; E.push([depth(3, t), H - t * H]); }
    for (let i = 0; i < E.length; i++) { E[i][0] += (R() - 0.5) * 6; E[i][1] += (R() - 0.5) * 6; }
    const edgePath = function (c) { c.moveTo(E[0][0], E[0][1]); for (let i = 1; i < E.length; i++) c.lineTo(E[i][0], E[i][1]); c.closePath(); };
    /* rachaduras saindo da borda para dentro */
    for (let i = 0; i < 26; i++) {
      const e = E[Math.floor(R() * E.length)], cx = W / 2 - e[0], cy = H / 2 - e[1], m = Math.hypot(cx, cy) || 1;
      let x = e[0], y = e[1], an = Math.atan2(cy, cx) + (R() - 0.5) * 0.8; const L = 50 + R() * 110, P = [x, y];
      for (let j = 0; j < 8; j++) { an += (R() - 0.5) * 0.7; x += Math.cos(an) * L / 8; y += Math.sin(an) * L / 8; P.push(x, y); }
      ln(g, P, 'rgba(255,255,255,.75)', 3.4); ln(g, P, gr(0.75), 1.3);
      if (R() < 0.6) { const b = 2 + Math.floor(R() * 4), ba = an + (R() < 0.5 ? 0.8 : -0.8); ln(g, [P[b * 2], P[b * 2 + 1], P[b * 2] + Math.cos(ba) * L * 0.3, P[b * 2 + 1] + Math.sin(ba) * L * 0.3], gr(0.55), 1); }
    }
    /* o vazio branco */
    g.save(); g.beginPath(); g.rect(-10, -10, W + 20, H + 20); edgePath(g); g.fillStyle = '#fbfaf7'; g.fill('evenodd');
    q = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); q.addColorStop(0, 'rgba(236,232,246,0)'); q.addColorStop(1, 'rgba(236,232,246,.6)');
    g.clip('evenodd'); g.fillStyle = q; g.fillRect(0, 0, W, H);
    /* lascas de papel soltas, à deriva no vazio */
    for (let i = 0; i < 46; i++) {
      const e = E[Math.floor(R() * E.length)], cx = W / 2 - e[0], cy = H / 2 - e[1], m = Math.hypot(cx, cy) || 1, d = 10 + R() * 70, x = e[0] - cx / m * d, y = e[1] - cy / m * d, s = (4 + R() * 12) * (1 - d / 110), rot = R() * 6;
      g.save(); g.translate(x, y); g.rotate(rot);
      g.beginPath(); poly(g, [-s + 3, -s * 0.7 + 4, s + 3, -s * 0.5 + 4, s * 0.7 + 3, s * 0.8 + 4, -s * 0.8 + 3, s * 0.6 + 4]); g.fillStyle = 'rgba(120,110,140,.12)'; g.fill();
      g.beginPath(); poly(g, [-s, -s * 0.7, s, -s * 0.5, s * 0.7, s * 0.8, -s * 0.8, s * 0.6]); g.fillStyle = C[1]; g.fill(); g.strokeStyle = gr(0.55); g.lineWidth = 1; g.stroke();
      if (s > 8) ln(g, [-s * 0.6, 0, s * 0.5, 0.6], gr(0.3), 0.8);
      g.restore();
    }
    g.restore();
    /* borda rasgada: linha escura e fibra branca */
    g.save(); g.beginPath(); edgePath(g); g.strokeStyle = gr(0.7); g.lineWidth = 2.4; g.lineJoin = 'round'; g.stroke();
    g.translate(-2, -2); g.beginPath(); edgePath(g); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.4; g.stroke(); g.restore();
    /* sombra leve do papel para dentro, para a borda ter volume */
    q = g.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, W * 0.62); q.addColorStop(0, 'rgba(90,80,70,0)'); q.addColorStop(0.85, 'rgba(90,80,70,.08)'); q.addColorStop(1, 'rgba(90,80,70,0)');
    g.save(); g.beginPath(); edgePath(g); g.clip(); g.fillStyle = q; g.fillRect(0, 0, W, H); g.restore();
  }
  /* luz suave no meio da arena */
  q = g.createRadialGradient(W / 2, H * 0.55, H * 0.1, W / 2, H * 0.55, W * 0.5); q.addColorStop(0, 'rgba(255,252,240,.12)'); q.addColorStop(1, 'rgba(255,252,240,0)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* ---------------- moldura ---------------- */
/** Moldura por cima de tudo: contornos de árvores rabiscados e bordas que se apagam em branco. */
export function paintCanopy(g, W, H, seed) {
  const R = rng(seed || 77);
  /* árvores rabiscadas nas laterais e nos cantos */
  [[30, 330, 260, 1], [70, 700, 300, 1.15], [W - 34, 360, 270, 1.05], [W - 80, 720, 320, 1.2], [180, 120, 150, 0.8], [W - 210, 110, 140, 0.8], [W * 0.5 - 220, 70, 100, 0.6], [W * 0.5 + 260, 64, 96, 0.6]].forEach(function (t) { scribbleTree(g, R, t[0], t[1], t[2], t[3], 0.95); });
  /* folhas soltas penduradas no alto, como recortes */
  for (let i = 0; i < 9; i++) {
    const x = 60 + i * (W - 120) / 8 + (R() - 0.5) * 50, l = 18 + R() * 30 * (Math.abs(x / W - 0.5) * 2 + 0.3);
    ln(g, [x, -4, x + (R() - 0.5) * 6, l], gr(0.45), 1);
    g.save(); g.translate(x, l + 6); g.rotate((R() - 0.5) * 0.6);
    cel(g, function (c) { poly(c, [-6, -7, 6, -6, 7, 8, -5, 7]); }, '#f3f0e8', { k: 1, lw: 1.3, out: gr(0.75) });
    ln(g, [-3, -2, 4, -2], gr(0.35), 0.7); ln(g, [-3, 1.5, 3, 1.5], gr(0.35), 0.7);
    g.restore();
  }
  /* as bordas se apagam em branco */
  const fade = function (x0, y0, x1, y1, rx, ry, rw, rh) { const q = g.createLinearGradient(x0, y0, x1, y1); q.addColorStop(0, 'rgba(255,254,250,.97)'); q.addColorStop(0.45, 'rgba(255,254,250,.6)'); q.addColorStop(1, 'rgba(255,254,250,0)'); g.fillStyle = q; g.fillRect(rx, ry, rw, rh); };
  fade(0, 0, 0, 64, 0, 0, W, 64); fade(0, H, 0, H - 50, 0, H - 50, W, 50); fade(0, 0, 76, 0, 0, 0, 76, H); fade(W, 0, W - 76, 0, W - 76, 0, 76, H);
  for (let i = 0; i < 70; i++) {
    const side = i % 4; let x, y;
    if (side === 0) { x = R() * W; y = R() * 30; } else if (side === 1) { x = R() * W; y = H - R() * 24; } else if (side === 2) { x = R() * 34; y = R() * H; } else { x = W - R() * 34; y = R() * H; }
    const r = 30 + R() * 46, q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,254,250,.75)'); q.addColorStop(1, 'rgba(255,254,250,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  /* cantos quase inteiramente apagados */
  [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (p) { const q = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], 150); q.addColorStop(0, 'rgba(255,254,250,1)'); q.addColorStop(0.5, 'rgba(255,254,250,.55)'); q.addColorStop(1, 'rgba(255,254,250,0)'); g.fillStyle = q; g.fillRect(p[0] - 150, p[1] - 150, 300, 300); });
  /* fiapos de lápis escapando para o branco */
  for (let i = 0; i < 14; i++) { const p = [[R() * W, 10 + R() * 40], [R() * W, H - 10 - R() * 30], [10 + R() * 50, R() * H], [W - 10 - R() * 50, R() * H]][i % 4]; spiral(g, p[0], p[1], 6 + R() * 10, 2, 0.28, 1); }
}

/* ---------------- mapa ---------------- */
function spline(P, step) {
  const out = [], n = P.length; if (n < 2) return P.slice();
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push({ x: 0.5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3), y: 0.5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3) }); }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y }); return out;
}
function near(L, x, y) { let m = 1e12; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function nearIdx(L, x, y) { let m = 1e12, b = 0; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) { m = d; b = i; } } return b; }
/* lugar do vazio: a uma distância d da última fase, longe das outras e das bordas */
function spot(P, W, H, d, margin) {
  const n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1; let best = null, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; let s = 240;
    for (let j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    const edge = Math.min(x - margin, W - margin - x, y - margin, H - margin - y); if (edge < 0) s += edge * 8;
    s += (Math.cos(a) * vx + Math.sin(a) * vy) / vm * 40;
    if (s > bs) { bs = s; best = { x: x, y: y }; }
  }
  return best;
}
function defaultPoints(W, H) {
  const Q = [[0.08, 0.78], [0.18, 0.62], [0.13, 0.4], [0.25, 0.24], [0.38, 0.36], [0.33, 0.6], [0.46, 0.76], [0.58, 0.6], [0.55, 0.36], [0.67, 0.2], [0.8, 0.34], [0.86, 0.6]];
  return Q.map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
}
/* pequenos marcos de mapa antigo, em traço de pena */
function mapTree(g, x, y, s, a) { g.beginPath(); g.moveTo(x, y + 8 * s); g.lineTo(x, y); g.strokeStyle = 'rgba(70,56,40,' + a + ')'; g.lineWidth = 1.4; g.stroke(); g.beginPath(); g.arc(x, y - 4 * s, 6 * s, 0, TAU); g.fillStyle = 'rgba(160,150,120,' + a * 0.4 + ')'; g.fill(); g.stroke(); ln(g, [x - 3 * s, y - 2 * s, x + 2 * s, y - 7 * s], 'rgba(70,56,40,' + a * 0.6 + ')', 0.8); }
function mapPalm(g, x, y, s, a) { const col = 'rgba(70,56,40,' + a + ')'; g.beginPath(); g.moveTo(x, y + 8 * s); g.quadraticCurveTo(x + 2 * s, y, x + 1 * s, y - 6 * s); for (let i = 0; i < 5; i++) { const an = -PI + 0.3 + i * 0.6; g.moveTo(x + 1 * s, y - 6 * s); g.quadraticCurveTo(x + Math.cos(an) * 5 * s, y - 10 * s, x + Math.cos(an) * 9 * s, y - 6 * s + Math.abs(Math.cos(an)) * 3 * s); } g.strokeStyle = col; g.lineWidth = 1.3; g.stroke(); }
function mapCactus(g, x, y, s, a) { const col = 'rgba(70,56,40,' + a + ')'; g.beginPath(); g.moveTo(x, y + 8 * s); g.lineTo(x, y - 10 * s); g.moveTo(x, y - 1 * s); g.lineTo(x - 5 * s, y - 1 * s); g.lineTo(x - 5 * s, y - 7 * s); g.moveTo(x, y - 3 * s); g.lineTo(x + 5 * s, y - 3 * s); g.lineTo(x + 5 * s, y - 9 * s); g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round'; g.stroke(); }
function mapHill(g, x, y, s, a) { const col = 'rgba(70,56,40,' + a + ')'; g.beginPath(); g.moveTo(x - 14 * s, y + 4 * s); g.lineTo(x - 2 * s, y - 12 * s); g.lineTo(x + 12 * s, y + 4 * s); g.strokeStyle = col; g.lineWidth = 1.5; g.lineJoin = 'round'; g.stroke(); for (let i = 0; i < 4; i++) ln(g, [x + (1 + i * 2.6) * s, y - (8 - i * 3.6) * s, x + (-1 + i * 2.6) * s, y + (2) * s], 'rgba(70,56,40,' + a * 0.5 + ')', 0.8); }
function mapWave(g, x, y, s, a) { g.beginPath(); for (let j = 0; j < 2; j++) { g.moveTo(x - 10 * s, y + j * 6 * s); g.quadraticCurveTo(x - 5 * s, y - 4 * s + j * 6 * s, x, y + j * 6 * s); g.quadraticCurveTo(x + 5 * s, y + 4 * s + j * 6 * s, x + 10 * s, y + j * 6 * s); } g.strokeStyle = 'rgba(60,70,90,' + a + ')'; g.lineWidth = 1.2; g.stroke(); }
function mapMoon(g, x, y, s, a) { g.beginPath(); g.arc(x, y, 7 * s, 0.6, TAU - 0.6); g.quadraticCurveTo(x + 2 * s, y, x + Math.cos(0.6) * 7 * s, y + Math.sin(0.6) * 7 * s); g.strokeStyle = 'rgba(70,56,40,' + a + ')'; g.lineWidth = 1.4; g.stroke(); }
function mapFlame(g, x, y, s, a) { g.beginPath(); g.moveTo(x - 5 * s, y + 6 * s); g.quadraticCurveTo(x - 7 * s, y - 4 * s, x, y - 12 * s); g.quadraticCurveTo(x + 7 * s, y - 4 * s, x + 5 * s, y + 6 * s); g.closePath(); g.strokeStyle = 'rgba(70,56,40,' + a + ')'; g.lineWidth = 1.4; g.stroke(); }
function compass(g, x, y, r, a) {
  g.save(); g.globalAlpha = a; g.translate(x, y);
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.strokeStyle = 'rgba(70,56,40,.7)'; g.lineWidth = 1.4; g.stroke(); g.beginPath(); g.arc(0, 0, r * 0.8, 0, TAU); g.lineWidth = 0.8; g.stroke();
  for (let i = 0; i < 8; i++) { const an = i * PI / 4 - PI / 2, l = i % 2 ? r * 0.55 : r * 1.05; g.beginPath(); g.moveTo(Math.cos(an - 0.2) * r * 0.16, Math.sin(an - 0.2) * r * 0.16); g.lineTo(Math.cos(an) * l, Math.sin(an) * l); g.lineTo(Math.cos(an + 0.2) * r * 0.16, Math.sin(an + 0.2) * r * 0.16); g.closePath(); g.fillStyle = i % 2 ? 'rgba(200,188,160,.8)' : (i === 0 ? 'rgba(120,60,50,.75)' : 'rgba(90,72,52,.75)'); g.fill(); g.strokeStyle = 'rgba(60,46,32,.8)'; g.lineWidth = 0.9; g.stroke(); }
  dot(g, 0, 0, 2.4, 'rgba(60,46,32,.9)');
  g.restore();
}

/** Mapa do capítulo: mapa antigo que vai se apagando até o vazio do Esquecimento. Funciona em qualquer w×h. */
export function paintMap(c, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  const W = w / u, H = h / u, R = rng(808);
  let P = (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; });
  if (P.length < 2) P = defaultPoints(W, H);
  const last = P[P.length - 1], first = P[0];
  /* pergaminho */
  let q = c.createRadialGradient(W * 0.4, H * 0.45, 40, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6); q.addColorStop(0, '#dccfb0'); q.addColorStop(0.7, '#cbbb96'); q.addColorStop(1, '#a8946c'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  paperTexture(c, W, H, R, 1.3);
  crease(c, W / 3, 0, W / 3 + 6, H, 1.2); crease(c, W * 2 / 3, 0, W * 2 / 3 - 4, H, 1.2); crease(c, 0, H / 2, W, H / 2 + 5, 1.2);
  /* trilha e progresso (0 no começo, 1 no fim) */
  const C = []; for (let i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { const a = P[i], b = P[i + 1], kk = (R() - 0.5) * 0.3; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * kk, y: (a.y + b.y) / 2 + (b.x - a.x) * kk }); } }
  const T = spline(C, 6), prog = function (x, y) { return nearIdx(T, x, y) / Math.max(1, T.length - 1); };
  const V = spot(P, W, H, 150, 120);
  /* grade de mapa antigo */
  c.save(); c.setLineDash([2, 7]);
  for (let x = 80; x < W; x += 160) ln(c, [x, 0, x, H], 'rgba(90,72,52,.16)', 1);
  for (let y = 80; y < H; y += 160) ln(c, [0, y, W, y], 'rgba(90,72,52,.16)', 1);
  c.restore();
  /* um rio antigo atravessando o começo do mapa */
  const rv = []; for (let i = 0; i <= 30; i++) { const t = i / 30; rv.push({ x: -20 + t * W * 0.62, y: H * 0.92 - t * H * 0.95 + Math.sin(t * 9) * 30 }); }
  c.beginPath(); rv.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p.x, p.y); }); c.strokeStyle = 'rgba(80,100,120,.22)'; c.lineWidth = 14; c.stroke(); c.strokeStyle = 'rgba(70,90,110,.45)'; c.lineWidth = 1.4; c.stroke();
  c.save(); c.translate(0, 10); c.beginPath(); rv.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p.x, p.y); }); c.strokeStyle = 'rgba(70,90,110,.3)'; c.stroke(); c.restore();
  /* marcos dos capítulos anteriores, cada vez mais apagados */
  const MARKS = [mapTree, mapPalm, mapWave, mapCactus, mapFlame, mapTree, mapHill, mapMoon, mapWave];
  const cell = 52;
  for (let gy = 0; gy * cell < H + cell; gy++) for (let gx = 0; gx * cell < W + cell; gx++) {
    const x = (gx + 0.5 + (R() - 0.5) * 0.8) * cell, y = (gy + 0.5 + (R() - 0.5) * 0.8) * cell, keep = R(), kind = R();
    if (keep < 0.42) continue;
    if (near(P, x, y) < 62 || near(T, x, y) < 22 || Math.hypot(x - V.x, y - V.y) < 170 || x < 30 || y < 30 || x > W - 30 || y > H - 30) continue;
    const pr = prog(x, y), dl = Math.hypot(x - last.x, y - last.y), a = Math.max(0, 0.75 - pr * 0.7) * Math.min(1, dl / 260);
    if (a < 0.08) continue;
    const idx = Math.min(MARKS.length - 1, Math.floor(pr * 7 + kind * 2.2));
    MARKS[idx](c, x, y, 1.25 + R() * 0.55, a);
  }
  /* rosa dos ventos num canto livre, longe do fim */
  let cp = null, cb = -1;
  [[110, 110], [W - 110, 110], [110, H - 110], [W - 110, H - 110]].forEach(function (p) { const s = Math.min(near(P, p[0], p[1]), near(T, p[0], p[1]) * 1.4) + Math.hypot(p[0] - last.x, p[1] - last.y) * 0.4; if (s > cb) { cb = s; cp = p; } });
  compass(c, cp[0], cp[1], 46, 0.85);
  /* a trilha: tinta que vai sumindo e se quebrando perto do fim */
  for (let i = 0; i < T.length - 1; i++) {
    const t = i / (T.length - 1), a = 0.85 - t * 0.55;
    if (t > 0.6 && Math.sin(i * 0.9) + Math.sin(i * 0.37) > 2.2 - (t - 0.6) * 4) continue;
    c.beginPath(); c.moveTo(T[i].x, T[i].y); c.lineTo(T[i + 1].x, T[i + 1].y);
    c.strokeStyle = 'rgba(70,50,32,' + a * 0.35 + ')'; c.lineWidth = 9; c.stroke();
    if (i % 4 < 2) { c.strokeStyle = 'rgba(80,44,30,' + a + ')'; c.lineWidth = 3; c.stroke(); }
  }
  /* moldura de mapa e vinheta: a borda some do lado do vazio */
  q = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.56); q.addColorStop(0, 'rgba(70,46,24,0)'); q.addColorStop(1, 'rgba(70,46,24,.6)'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  c.save(); c.beginPath(); c.rect(18, 18, W - 36, H - 36); c.rect(28, 28, W - 56, H - 56); c.strokeStyle = 'rgba(60,40,24,.55)'; c.lineWidth = 1.6; c.stroke(); c.restore();
  /* o mundo se apaga perto do fim */
  const dd = Math.max(240, Math.hypot(last.x - first.x, last.y - first.y));
  q = c.createRadialGradient(last.x, last.y, 0, last.x, last.y, dd * 0.95);
  q.addColorStop(0, 'rgba(252,250,246,.8)'); q.addColorStop(0.35, 'rgba(252,250,246,.5)'); q.addColorStop(0.7, 'rgba(252,250,246,.14)'); q.addColorStop(1, 'rgba(252,250,246,0)'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) { const a = R() * TAU, d = 40 + R() * dd * 0.55, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; eraser(c, R, x, y, 90 + R() * 120, R() * TAU, 26 + R() * 24, 1); }
  /* o vazio do Esquecimento */
  q = c.createRadialGradient(V.x, V.y, 20, V.x, V.y, 200); q.addColorStop(0, 'rgba(255,255,255,1)'); q.addColorStop(0.5, 'rgba(255,255,255,.8)'); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(V.x - 200, V.y - 200, 400, 400);
  for (let i = 0; i < 16; i++) { const an = i * 0.9 + R() * 0.4, d = 86 + R() * 70, s = 5 + R() * 8; c.save(); c.translate(V.x + Math.cos(an) * d, V.y + Math.sin(an) * d * 0.7); c.rotate(an + 1.3); c.beginPath(); poly(c, [-s, -s * 0.6, s, -s * 0.5, s * 0.8, s * 0.7, -s * 0.7, s * 0.6]); c.fillStyle = '#d6c9a8'; c.fill(); c.strokeStyle = 'rgba(70,56,40,.5)'; c.lineWidth = 1; c.stroke(); c.restore(); }
  c.save(); c.translate(V.x, V.y);
  for (let j = 0; j < 3; j++) { c.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40, an = t * 7 + j * 2.09; c[i ? 'lineTo' : 'moveTo'](Math.cos(an) * (54 + t * 80), Math.sin(an) * (42 + t * 56)); } c.strokeStyle = 'rgba(120,110,140,.25)'; c.lineWidth = 1.4; c.stroke(); }
  c.beginPath(); for (let i = 0; i <= 36; i++) { const t = i / 36 * TAU, r = 1 + Math.sin(t * 5) * 0.06 + Math.sin(t * 11) * 0.04; c[i ? 'lineTo' : 'moveTo'](Math.cos(t) * 54 * r, Math.sin(t) * 42 * r); } c.closePath();
  c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 6; c.stroke(); c.strokeStyle = '#fbfaf6'; c.lineWidth = 3.6; c.stroke();
  q = c.createRadialGradient(4, 0, 2, 0, 0, 54); q.addColorStop(0, '#000'); q.addColorStop(0.7, '#0c0818'); q.addColorStop(1, '#2d2350'); c.fillStyle = q; c.fill();
  for (let i = 0; i < 14; i++) dot(c, (R() - 0.5) * 76, (R() - 0.5) * 54, 0.6 + R() * 0.9, 'rgba(255,255,255,' + (0.3 + R() * 0.5) + ')');
  [[6, -6], [21, -7]].forEach(function (e) { const gg = c.createRadialGradient(e[0], e[1], 0, e[0], e[1], 9); gg.addColorStop(0, 'rgba(255,61,138,.7)'); gg.addColorStop(1, 'rgba(255,61,138,0)'); c.fillStyle = gg; c.fillRect(e[0] - 9, e[1] - 9, 18, 18); c.beginPath(); c.ellipse(e[0], e[1], 2.8, 3.6, 0, 0, TAU); c.fillStyle = '#ffe0f0'; c.fill(); });
  c.restore();
  /* área limpa em volta de cada fase, para o medalhão */
  P.forEach(function (p, i) { const t = i / (P.length - 1); q = c.createRadialGradient(p.x, p.y, 20, p.x, p.y, 58); q.addColorStop(0, 'rgba(232,222,198,' + (0.75 - t * 0.2) + ')'); q.addColorStop(1, 'rgba(232,222,198,0)'); c.fillStyle = q; c.fillRect(p.x - 60, p.y - 60, 120, 120); });
  c.restore();
}
