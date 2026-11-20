// @ts-nocheck
/* Cenário do Capítulo 3, "Sertão": chão da arena (terra rachada, leito de rio seco, lajedo com ossada),
   moldura por cima (galhos secos, cactos, pedras) e o mapa ilustrado visto de cima.
   A área jogável (x 120–1160, y 150–640 numa tela de 1280×720) só recebe detalhe de chão.
   Tudo determinístico pela semente (sem Math.random). */
import { OUT, TAU, cap, cel, dot, el, ln, poly } from './characters';

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };
const PI = Math.PI;

/* ---------------- peças de chão ---------------- */
function blobPath(g, x, y, rx, ry, rot, r) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i], py = Math.sin(a) * ry * r[i]; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
function radii(R, n, j) { const r = []; for (let i = 0; i < n; i++) r.push(1 - j + R() * j * 2); return r; }
function pebble(g, x, y, r, col) {
  g.beginPath(); g.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.66, 0, 0, TAU); g.fillStyle = 'rgba(60,34,16,.25)'; g.fill();
  g.beginPath(); g.ellipse(x, y, r, r * 0.68, 0, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(50,30,16,.6)'; g.lineWidth = 1; g.stroke();
  g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.24, r * 0.36, r * 0.2, 0, 0, TAU); g.fillStyle = 'rgba(255,250,230,.35)'; g.fill();
}
/* rede de rachaduras: grade sacudida, cada placa com um tom, fendas escuras com borda clara */
function cracks(g, R, x0, y0, x1, y1, cell, al, mask) {
  const nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1, P = [];
  for (let j = 0; j <= ny; j++) { P.push([]); for (let i = 0; i <= nx; i++) P[j].push([x0 + (i + (R() - 0.5) * 0.7) * cell, y0 + (j + (R() - 0.5) * 0.7) * cell * 0.82]); }
  const ok = function (p) { return !mask || mask(p[0], p[1]); };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = P[j][i], b = P[j][i + 1], c = P[j + 1][i + 1], d = P[j + 1][i], cx = (a[0] + c[0]) / 2, cy = (a[1] + c[1]) / 2;
    if (!ok([cx, cy])) continue;
    const tone = R();
    g.beginPath(); poly(g, [a[0], a[1], b[0], b[1], c[0], c[1], d[0], d[1]]);
    g.fillStyle = tone < 0.5 ? 'rgba(255,236,196,' + (0.06 + tone * 0.12) * al + ')' : 'rgba(110,70,36,' + ((tone - 0.5) * 0.18) * al + ')'; g.fill();
    /* placa levemente levantada nas bordas: brilho em cima à esquerda */
    g.beginPath(); g.moveTo(d[0] + 3, d[1] - 3); g.lineTo(a[0] + 3, a[1] + 3); g.lineTo(b[0] - 3, b[1] + 3); g.strokeStyle = 'rgba(255,240,210,' + 0.22 * al + ')'; g.lineWidth = 1.6; g.stroke();
  }
  const edge = function (p, q, w) {
    if (!ok(p) && !ok(q)) return;
    const mx = (p[0] + q[0]) / 2 + (R() - 0.5) * cell * 0.18, my = (p[1] + q[1]) / 2 + (R() - 0.5) * cell * 0.18;
    g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(mx, my); g.lineTo(q[0], q[1]);
    g.strokeStyle = 'rgba(58,32,16,' + 0.62 * al + ')'; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    g.save(); g.translate(0.9, 1.1); g.strokeStyle = 'rgba(255,232,190,' + 0.2 * al + ')'; g.lineWidth = 0.9; g.stroke(); g.restore();
  };
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    if (i < nx && R() > 0.06) edge(P[j][i], P[j][i + 1], 1.4 + R() * 2.2);
    if (j < ny && R() > 0.06) edge(P[j][i], P[j + 1][i], 1.4 + R() * 2.2);
    /* fenda menor cortando a placa */
    if (i < nx && j < ny && R() < 0.35) { const a = P[j][i], c = P[j + 1][i + 1]; const m = [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2]; if (ok(m)) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(m[0] + (R() - 0.5) * 10, m[1] + (R() - 0.5) * 10); g.strokeStyle = 'rgba(58,32,16,' + 0.45 * al + ')'; g.lineWidth = 1.1; g.stroke(); } }
  }
}
/* tufinho de capim seco, bem rente ao chão */
function tuft(g, R, x, y, s) {
  for (let j = 0; j < 6; j++) { const a = -PI / 2 + (j - 2.5) * 0.32 + (R() - 0.5) * 0.2, l = (6 + R() * 6) * s; ln(g, [x + (j - 2.5) * 1.2, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.7], j % 2 ? 'rgba(170,130,70,.85)' : 'rgba(210,176,104,.85)', 1.3); }
}
function leafDry(g, x, y, s, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(-4 * s, 0); g.quadraticCurveTo(0, -2.8 * s, 4.6 * s, 0); g.quadraticCurveTo(0, 2.8 * s, -4 * s, 0); g.closePath();
  g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(50,30,14,.6)'; g.lineWidth = 0.9; g.stroke(); ln(g, [-3.4 * s, 0, 4 * s, 0], 'rgba(60,36,16,.4)', 0.6);
  g.restore();
}
function twig(g, x, y, l, a) {
  const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * 0.6, mx = x + Math.cos(a) * l * 0.55, my = y + Math.sin(a) * l * 0.33;
  ln(g, [x, y, ex, ey], 'rgba(40,24,12,.75)', 3.2); ln(g, [x, y, ex, ey], '#9a8064', 1.5);
  ln(g, [mx, my, mx + Math.cos(a + 0.7) * l * 0.3, my + Math.sin(a + 0.7) * l * 0.2], 'rgba(40,24,12,.75)', 2.4); ln(g, [mx, my, mx + Math.cos(a + 0.7) * l * 0.3, my + Math.sin(a + 0.7) * l * 0.2], '#9a8064', 1);
}

/* ---------------- objetos altos (só fora da área de jogo) ---------------- */
const CAC = '#6f9662', CAC2 = '#557a4c', CACL = 'rgba(220,240,190,.22)';
function cactusArm(g, pts, r, col) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = OUT; g.lineWidth = r * 2 + 3; g.stroke(); g.strokeStyle = col; g.lineWidth = r * 2; g.stroke();
  g.strokeStyle = 'rgba(20,50,24,.35)'; g.lineWidth = r * 0.6; g.save(); g.translate(r * 0.45, 0); g.stroke(); g.restore();
  g.strokeStyle = CACL; g.lineWidth = r * 0.5; g.save(); g.translate(-r * 0.4, 0); g.stroke(); g.restore();
  g.setLineDash([1.2, 4.6]); g.strokeStyle = 'rgba(250,246,220,.8)'; g.lineWidth = 1.6; g.stroke(); g.setLineDash([]);
}
/* mandacaru em pé: tronco e braços em candelabro */
function mandacaru(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 26 * s, y + 3 * s, 46 * s, 10 * s, 0.1, 0, TAU); g.fillStyle = 'rgba(70,40,16,.3)'; g.fill();
  const h = (100 + R() * 40) * s, r = 9 * s, arms = [];
  for (let j = 0; j < 2 + Math.floor(R() * 3); j++) { const sd = j % 2 ? 1 : -1, ay = y - h * (0.3 + R() * 0.3), ex = sd * (18 + R() * 12) * s; arms.push([[x, ay], [x + ex, ay - 4 * s], [x + ex, ay - (30 + R() * 34) * s]]); }
  arms.forEach(function (a, n) { if (n % 2) cactusArm(g, a, r * 0.75, CAC2); });
  cactusArm(g, [[x, y - r], [x, y - h]], r, CAC);
  arms.forEach(function (a, n) { if (!(n % 2)) cactusArm(g, a, r * 0.75, CAC); });
  /* flor branca no alto */
  if (R() < 0.5) { dot(g, x, y - h - r * 0.7, 3.4 * s, '#f6f0e0'); dot(g, x, y - h - r * 0.7, 1.4 * s, '#ffd23f'); }
}
/* xique-xique: touceira de braços curtos espalhados */
function xique(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 8 * s, y + 2 * s, 40 * s, 10 * s, 0, 0, TAU); g.fillStyle = 'rgba(70,40,16,.3)'; g.fill();
  const n = 5 + Math.floor(R() * 3), L = [];
  for (let j = 0; j < n; j++) { const a = -PI / 2 + (j - (n - 1) / 2) * 0.42 + (R() - 0.5) * 0.3, l = (22 + R() * 22) * s, mx = x + Math.cos(a) * l * 0.6, my = y + Math.sin(a) * l * 0.4; L.push([[x + (j - n / 2) * 3 * s, y], [mx, my], [mx + Math.cos(a * 0.6 - 0.6) * l * 0.2, my - l * 0.6]]); }
  L.sort(function (p, q) { return Math.abs(q[2][0] - x) - Math.abs(p[2][0] - x); }).forEach(function (p, j) { cactusArm(g, p, 5 * s, j % 2 ? '#7f9e74' : '#6c8c66'); });
}
/* macambira: roseta de folhas pontudas */
function macambira(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 30 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(70,40,16,.28)'; g.fill();
  for (let j = 0; j < 11; j++) {
    const a = PI + 0.15 + (j / 10) * (PI - 0.3), l = (20 + R() * 12) * s, ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * 0.9;
    cel(g, function (c) { c.moveTo(x - 4 * s, y); c.quadraticCurveTo((x + ex) / 2 - 3 * s, (y + ey) / 2, ex, ey); c.quadraticCurveTo((x + ex) / 2 + 3 * s, (y + ey) / 2, x + 4 * s, y); c.closePath(); }, j % 2 ? '#7b8f5c' : '#8a9a66', { k: 1, lw: 1.6, inn: function (c) { dot(c, ex, ey + 2, 2.2 * s, '#b0503a'); } });
  }
}
function boulder(g, R, x, y, s, col) {
  g.beginPath(); g.ellipse(x + 8 * s, y + 2 * s, 30 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(60,34,16,.32)'; g.fill();
  const a = R() * 4;
  cel(g, function (c) { poly(c, [x - 24 * s, y, x - 20 * s, y - 14 * s - a, x - 6 * s, y - 24 * s, x + 12 * s, y - 20 * s + a, x + 24 * s, y - 6 * s, x + 22 * s, y]); }, col || '#a8957a', {
    k: 3, lw: 2.4, sh: 'rgba(60,30,20,.35)', hi: 'rgba(255,240,210,.3)', inn: function (c) { ln(c, [x - 4 * s, y - 22 * s, x - 1 * s, y - 12 * s, x + 6 * s, y - 6 * s], 'rgba(60,40,24,.4)', 1.2); c.fillStyle = 'rgba(200,190,150,.35)'; c.beginPath(); c.ellipse(x + 8 * s, y - 16 * s, 5 * s, 2 * s, 0.4, 0, TAU); c.fill(); },
  });
}
/* garrancho: arbusto seco de galhos finos */
function garrancho(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 6 * s, y + 2 * s, 34 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(70,40,16,.24)'; g.fill();
  const br = function (x0, y0, a, l, d) {
    const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l;
    ln(g, [x0, y0, x1, y1], OUT, d * 1.3 + 1.8); ln(g, [x0, y0, x1, y1], d > 1.6 ? '#7a634e' : '#9a8068', d * 1.3);
    if (l > 8 * s) { br(x1, y1, a - 0.45 - R() * 0.3, l * 0.68, d * 0.7); br(x1, y1, a + 0.35 + R() * 0.3, l * 0.62, d * 0.7); }
    else if (R() < 0.5) leafDry(g, x1, y1, 0.8 * s, a, R() < 0.5 ? '#b08a44' : '#8a7a3a');
  };
  for (let j = 0; j < 4; j++) br(x + (j - 1.5) * 4 * s, y, -PI / 2 + (j - 1.5) * 0.4, (18 + R() * 10) * s, 2.4);
}
/* caveira de boi vista de cima, deitada no chão */
function skull(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.ellipse(3, 4, 22, 9, 0, 0, TAU); g.fillStyle = 'rgba(60,34,16,.3)'; g.fill();
  /* chifres */
  [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(-6, sd * 6); g.quadraticCurveTo(-10, sd * 22, 2, sd * 26); g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 6.4; g.stroke(); g.strokeStyle = '#d9cdb0'; g.lineWidth = 4; g.stroke(); });
  cel(g, function (c) { c.moveTo(-10, -8); c.quadraticCurveTo(-4, -11, 2, -6); c.lineTo(16, -4); c.quadraticCurveTo(21, 0, 16, 4); c.lineTo(2, 6); c.quadraticCurveTo(-4, 11, -10, 8); c.quadraticCurveTo(-13, 0, -10, -8); c.closePath(); }, '#ece2c8', {
    k: 1.6, lw: 2, sh: 'rgba(90,60,30,.35)', inn: function (c) { c.fillStyle = '#3a2618'; c.beginPath(); c.ellipse(-1, -4.6, 2.6, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-1, 4.6, 2.6, 2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15, -1.4, 1.4, 1, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(15, 1.4, 1.4, 1, 0, 0, TAU); c.fill(); ln(c, [4, 0, 12, 0], 'rgba(90,60,30,.4)', 1); },
  });
  g.restore();
}
function bone(g, x, y, l, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  cel(g, function (c) { cap(c, -l / 2, 0, l / 2, 0, 1.8); el(c, -l / 2, -1.4, 2.2, 2.2); el(c, -l / 2, 1.4, 2.2, 2.2); el(c, l / 2, -1.4, 2.2, 2.2); el(c, l / 2, 1.4, 2.2, 2.2); }, '#e4d8bc', { k: 0.6, lw: 1.4 });
  g.restore();
}
function ribs(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  ln(g, [-20, 0, 20, 0], OUT, 5); ln(g, [-20, 0, 20, 0], '#e4d8bc', 3);
  for (let j = 0; j < 6; j++) { const x0 = -16 + j * 6.4; [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(x0, 0); g.quadraticCurveTo(x0 + 6, sd * 10, x0 + 3, sd * 16); g.strokeStyle = OUT; g.lineWidth = 3.6; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#ddd0b2'; g.lineWidth = 1.8; g.stroke(); }); }
  g.restore();
}
/* laje de pedra chata no chão */
function slab(g, R, x, y, rx, ry, col) {
  const r = radii(R, 9, 0.18), rot = R() * 0.8 - 0.4;
  g.beginPath(); blobPath(g, x + 3, y + 5, rx, ry, rot, r); g.fillStyle = 'rgba(60,34,16,.22)'; g.fill();
  g.beginPath(); blobPath(g, x, y, rx, ry, rot, r); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(50,34,22,.65)'; g.lineWidth = 2; g.stroke();
  g.save(); g.beginPath(); blobPath(g, x, y, rx, ry, rot, r); g.clip();
  g.beginPath(); blobPath(g, x - 4, y - 5, rx, ry, rot, r); g.fillStyle = 'rgba(255,248,226,.14)'; g.fill();
  for (let j = 0; j < 3; j++) { const a = R() * TAU; ln(g, [x + Math.cos(a) * rx * 0.2, y + Math.sin(a) * ry * 0.2, x + Math.cos(a) * rx, y + Math.sin(a) * ry], 'rgba(50,34,22,.4)', 1.2); }
  for (let j = 0; j < 6; j++) dot(g, x + (R() - 0.5) * rx * 1.4, y + (R() - 0.5) * ry * 1.2, 3 + R() * 5, R() < 0.5 ? 'rgba(170,170,120,.25)' : 'rgba(90,70,50,.15)');
  g.restore();
}

/** Chão da arena. 0 terra rachada com cascalho, 1 leito de rio seco, 2 lajedo de pedra com ossada. */
export function paintGround(g, W, H, a, seed) {
  const v = (((a | 0) % 3) + 3) % 3, R = rng((seed || 31) + v * 7919);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky };
  const aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 40 + R() * (aw - 80), A.y0 + 30 + R() * (ah - 60)]; };
  const BASE = [['#d6aa6c', '#c08d54', '#7f5534'], ['#cfac78', '#b48a58', '#78573a'], ['#c8a67c', '#a98962', '#6c5440']][v];
  let q = g.createRadialGradient(W * 0.5, H * 0.52, 60, W * 0.5, H * 0.5, W * 0.72);
  q.addColorStop(0, BASE[0]); q.addColorStop(0.55, BASE[1]); q.addColorStop(1, BASE[2]);
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (let j = 0; j < 40; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 60 + R() * 140, 24 + R() * 50, R() * 3, 0, TAU); g.fillStyle = j % 2 ? 'rgba(255,230,180,.08)' : 'rgba(110,60,30,.08)'; g.fill(); }
  const items = [];
  const edge = function (n, fn, sMin, sMax, tall) {
    for (let j = 0; j < n; j++) {
      let side = Math.floor(R() * 4), x, y;
      if (tall && side === 1) side = j % 2 ? 0 : 2 + (j % 4 === 0 ? 1 : 0);
      if (side === 0) { x = R() * W; y = A.y0 - 22 - R() * 70; }
      else if (tall && side >= 2) { x = side === 2 ? A.x0 - 60 - R() * 60 : A.x1 + 60 + R() * 60; y = A.y0 + R() * ah; }
      else if (side === 1) { x = R() * W; y = A.y1 + 46 + R() * 34; }
      else if (side === 2) { x = A.x0 - 30 - R() * 80; y = A.y0 + R() * ah; }
      else { x = A.x1 + 30 + R() * 80; y = A.y0 + R() * ah; }
      const s = sMin + R() * (sMax - sMin);
      items.push({ y: y, d: function () { fn(x, y, s); } });
    }
  };
  const LEAF = ['#b08a44', '#9a6a34', '#c4a050', '#7a5a2c', '#8a7a3a'];
  const GRAV = ['#a8957a', '#8f7c66', '#c4b090', '#7a6a58', '#b49a72'];
  let bed = null;
  if (v === 0) {
    /* ---- terra rachada ---- */
    cracks(g, R, -40, -40, W + 40, H + 40, 66, 1);
    for (let j = 0; j < 260; j++) pebble(g, R() * W, R() * H, 1.4 + R() * 2.6, GRAV[Math.floor(R() * 5)]);
    for (let j = 0; j < 7; j++) { const p = inA(); for (let m = 0; m < 26; m++) pebble(g, p[0] + (R() - 0.5) * 90, p[1] + (R() - 0.5) * 50, 1.6 + R() * 2.6, GRAV[Math.floor(R() * 5)]); }
  } else if (v === 1) {
    /* ---- leito de rio seco atravessando a arena ---- */
    const p1 = R() * 6, cy = function (x) { return H * 0.5 + Math.sin(x * 0.0042 + p1) * 120 * ky + Math.sin(x * 0.011) * 26 * ky; }, hw = function (x) { return (86 + Math.sin(x * 0.009 + 2) * 22) * ky; };
    bed = function (x, y) { return Math.abs(y - cy(x)) - hw(x); };
    cracks(g, R, -40, -40, W + 40, H + 40, 58, 1, function (x, y) { return bed(x, y) > 6; });
    /* areia do leito */
    const band = function (k, col) { g.beginPath(); for (let x = -20; x <= W + 20; x += 16) g[x < -10 ? 'moveTo' : 'lineTo'](x, cy(x) - hw(x) * k); for (let x = W + 20; x >= -20; x -= 16) g.lineTo(x, cy(x) + hw(x) * k); g.closePath(); g.fillStyle = col; g.fill(); };
    band(1.12, 'rgba(110,70,36,.28)'); band(1, '#dcc394'); band(0.72, '#e4cfa2'); band(0.3, 'rgba(240,226,190,.6)');
    /* marcas da correnteza na areia */
    for (let j = 0; j < 46; j++) { const x = R() * W, y = cy(x) + (R() - 0.5) * hw(x) * 1.5, l = 30 + R() * 50; g.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, xx = x + u * l; g[i ? 'lineTo' : 'moveTo'](xx, y + (cy(xx) - cy(x)) + Math.sin(u * 5 + j) * 2.4); } g.strokeStyle = 'rgba(150,110,60,.3)'; g.lineWidth = 1.4; g.lineCap = 'round'; g.stroke(); }
    /* barranco: placas de lama enroladas nas margens */
    [-1, 1].forEach(function (sd) {
      g.beginPath(); for (let x = -20; x <= W + 20; x += 12) g[x < -10 ? 'moveTo' : 'lineTo'](x, cy(x) + sd * hw(x)); g.strokeStyle = 'rgba(80,46,22,.55)'; g.lineWidth = 3; g.stroke();
      for (let x = 0; x < W; x += 22 + R() * 18) { const y = cy(x) + sd * (hw(x) - 4), r = radii(R, 7, 0.25); g.beginPath(); blobPath(g, x, y, 9 + R() * 6, 5 + R() * 3, R() * 3, r); g.fillStyle = '#b8895a'; g.fill(); g.strokeStyle = 'rgba(70,40,20,.7)'; g.lineWidth = 1.2; g.stroke(); g.beginPath(); g.ellipse(x - 2, y - 1.6, 4, 1.6, 0, 0, TAU); g.fillStyle = 'rgba(255,236,200,.35)'; g.fill(); }
    });
    /* seixos redondos no leito */
    for (let j = 0; j < 150; j++) { const x = R() * W, y = cy(x) + (R() - 0.5) * hw(x) * 1.7; pebble(g, x, y, 2 + R() * 5.4, ['#b7ab98', '#9a9080', '#c9bda6', '#857a6c'][Math.floor(R() * 4)]); }
    for (let j = 0; j < 120; j++) pebble(g, R() * W, R() * H, 1.4 + R() * 2.4, GRAV[Math.floor(R() * 5)]);
    /* galho seco trazido pela última cheia */
    for (let j = 0; j < 6; j++) { const x = A.x0 + R() * aw, y = cy(x) + (R() - 0.5) * hw(x); twig(g, x, y, 26 + R() * 24, R() * TAU); }
  } else {
    /* ---- lajedo de pedra, cascalho e ossada ---- */
    cracks(g, R, -40, -40, W + 40, H + 40, 80, 0.7);
    for (let j = 0; j < 9; j++) { const p = inA(); slab(g, R, p[0], p[1], 70 + R() * 80, 34 + R() * 34, ['#ab9a80', '#9c8b74', '#b5a488'][j % 3]); }
    [[W * 0.06, H * 0.5, 120, 200], [W * 0.95, H * 0.45, 110, 180], [W * 0.5, -10, 260, 80], [W * 0.4, H + 10, 220, 70]].forEach(function (b) { slab(g, R, b[0], b[1], b[2], b[3], '#9a8a70'); });
    for (let j = 0; j < 340; j++) pebble(g, R() * W, R() * H, 1.4 + R() * 2.8, GRAV[Math.floor(R() * 5)]);
    /* ossada: tudo rente ao chão */
    const sk = [A.x0 + aw * (0.16 + R() * 0.1), A.y1 - 60 - R() * 40];
    skull(g, sk[0], sk[1], 1.1, -0.3);
    ribs(g, sk[0] - 70, sk[1] - 10, 1.1, 0.25);
    for (let j = 0; j < 8; j++) { const p = inA(); bone(g, p[0], p[1], 10 + R() * 10, R() * TAU); }
    skull(g, A.x1 - aw * 0.12, A.y0 + 50, 0.8, 2.6);
    ribs(g, A.x1 - aw * 0.22, A.y0 + 40, 0.8, -0.4);
  }
  /* detalhes de chão em todas */
  for (let j = 0; j < 46; j++) { const x = R() * W, y = R() * H; if (bed && bed(x, y) < 0) continue; tuft(g, R, x, y, 0.8 + R() * 0.5); }
  for (let j = 0; j < 40; j++) leafDry(g, R() * W, R() * H, 0.9 + R() * 0.6, R() * TAU, LEAF[Math.floor(R() * 5)]);
  for (let j = 0; j < 8; j++) { const x = R() * W, y = R() * H; twig(g, x, y, 14 + R() * 14, R() * TAU); }
  /* borda: cactos, macambiras, pedras e garranchos */
  edge(v === 2 ? 5 : 7, function (x, y, s) { mandacaru(g, R, x, y, s); }, 0.75, 1.05, true);
  edge(8, function (x, y, s) { xique(g, R, x, y, s); }, 0.8, 1.2);
  edge(6, function (x, y, s) { macambira(g, R, x, y, s); }, 0.8, 1.2);
  edge(v === 2 ? 14 : 8, function (x, y, s) { boulder(g, R, x, y, s, R() < 0.5 ? '#a8957a' : '#9a8a74'); }, 0.9, 1.7);
  edge(8, function (x, y, s) { garrancho(g, R, x, y, s); }, 0.9, 1.4);
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  /* sol forte: luz quente no meio, borda escurecida */
  q = g.createRadialGradient(W * 0.46, H * 0.4, 40, W * 0.46, H * 0.4, W * 0.5); q.addColorStop(0, 'rgba(255,240,190,.14)'); q.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
  q = g.createRadialGradient(W / 2, H / 2, H * 0.44, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(50,24,8,.5)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* ---------------- moldura ---------------- */
/* galho seco: ramifica afinando, com poucas folhinhas secas */
function branch(g, R, x, y, a, l, w, depth, shadow) {
  const bend = (R() - 0.5) * 0.5, x1 = x + Math.cos(a) * l, y1 = y + Math.sin(a) * l, mx = x + Math.cos(a + bend) * l * 0.5, my = y + Math.sin(a + bend) * l * 0.5;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, x1, y1); g.lineCap = 'round';
  if (shadow) { g.strokeStyle = 'rgba(40,20,6,.22)'; g.lineWidth = w + 2; g.stroke(); }
  else { g.strokeStyle = OUT; g.lineWidth = w + 3; g.stroke(); g.strokeStyle = depth > 2 ? '#6a5442' : '#80684f'; g.lineWidth = w; g.stroke(); g.save(); g.translate(-w * 0.18, -w * 0.22); g.strokeStyle = 'rgba(230,210,180,.25)'; g.lineWidth = Math.max(1, w * 0.25); g.stroke(); g.restore(); }
  if (depth <= 0 || l < 14) { if (!shadow && R() < 0.6) leafDry(g, x1, y1, 1.2, a, R() < 0.5 ? '#b08a44' : '#9a7a3a'); return; }
  const n = 2 + (R() < 0.3 ? 1 : 0);
  for (let j = 0; j < n; j++) branch(g, R, x1, y1, a + (j - (n - 1) / 2) * (0.5 + R() * 0.3) + (R() - 0.5) * 0.3, l * (0.6 + R() * 0.15), w * 0.66, depth - 1, shadow);
}
/** Moldura por cima de tudo: galhos secos nos cantos de cima, cactos entrando pelos lados e pedras embaixo. */
export function paintCanopy(g, W, H, seed) {
  const B = [[-10, 30, 0.3, 96, 12], [W + 10, 24, PI - 0.28, 100, 13], [W * 0.36, -12, 1.35, 48, 7], [W * 0.7, -12, 1.8, 50, 7]];
  B.forEach(function (b, n) { const R1 = rng((seed || 77) + n * 31); g.save(); g.translate(14, 22); branch(g, R1, b[0], b[1], b[2], b[3], b[4], 3, true); g.restore(); });
  B.forEach(function (b, n) { const R1 = rng((seed || 77) + n * 31); branch(g, R1, b[0], b[1], b[2], b[3], b[4], 3, false); });
  const R = rng((seed || 77) + 5);
  /* braços de mandacaru grandes entrando pelos lados, cortados pela borda */
  [[-8, H * 0.86, 1], [W + 8, H * 0.84, -1], [-8, H * 0.2, 1]].forEach(function (m, n) {
    const x = m[0], y = m[1], sd = m[2], r = n === 2 ? 11 : 14;
    g.save(); g.translate(16, 18); g.beginPath(); g.moveTo(x - sd * 10, y + 200); g.lineTo(x - sd * 10, y + 10); g.lineTo(x + sd * 40, y + 4); g.lineTo(x + sd * 44, y - 80 + n * 30); g.strokeStyle = 'rgba(40,20,6,.22)'; g.lineWidth = r * 2 + 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.restore();
    cactusArm(g, [[x - sd * 10, y + 200], [x - sd * 10, y + 10], [x + sd * 40, y + 4], [x + sd * 44, y - 80 + n * 30]], r, CAC);
  });
  /* pedras e xique-xique nos cantos de baixo */
  [[70, H + 6, 2.4], [210, H + 22, 1.6], [W - 90, H + 8, 2.6], [W - 250, H + 24, 1.5], [W * 0.5 + 40, H + 30, 1.3]].forEach(function (p) { boulder(g, R, p[0], p[1], p[2], R() < 0.5 ? '#9a8a74' : '#8a7a66'); });
  xique(g, R, 140, H + 10, 1.5); xique(g, R, W - 170, H + 12, 1.6);
  macambira(g, R, W * 0.5 - 140, H + 14, 1.4);
  /* calor do sol no alto */
  const q = g.createLinearGradient(0, 0, 0, 120); q.addColorStop(0, 'rgba(255,236,170,.22)'); q.addColorStop(1, 'rgba(255,236,170,0)'); g.fillStyle = q; g.fillRect(0, 0, W, 120);
}

/* ---------------- mapa ---------------- */
function spline(P, step) {
  const out = [], n = P.length;
  if (n < 2) return P.slice();
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push({ x: 0.5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3), y: 0.5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3) }); }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y });
  return out;
}
function near(L, x, y) { let m = 1e12; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function strokeL(g, L, col, lw, dash) { if (L.length < 2) return; g.beginPath(); g.moveTo(L[0].x, L[0].y); for (let i = 1; i < L.length; i++) g.lineTo(L[i].x, L[i].y); g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; if (dash) g.setLineDash(dash); g.stroke(); if (dash) g.setLineDash([]); }
function norm(L, i) { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; }
function repel(C, P, d) { C.forEach(function (q) { P.forEach(function (p) { let dx = q.x - p.x, dy = q.y - p.y, m = Math.hypot(dx, dy); if (m < d) { if (m < 1) { dx = 1; dy = 0; m = 1; } q.x = p.x + dx / m * d; q.y = p.y + dy / m * d; } }); }); }
function trailOf(P, R, wob) { if (P.length < 2) return P.slice(); const C = []; for (let i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { const a = P[i], b = P[i + 1], k = (R() - 0.5) * wob; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * k, y: (a.y + b.y) / 2 + (b.x - a.x) * k }); } } return spline(C, 6); }
function spot(P, W, H, d, margin) {
  const n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1; let best = null, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; let s = 240;
    for (let j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    const e = Math.min(x - margin, W - margin - x, y - margin, H - margin - y); if (e < 0) s += e * 8;
    s += (Math.cos(a) * vx + Math.sin(a) * vy) / vm * 40;
    if (s > bs) { bs = s; best = { x: x, y: y }; }
  }
  return best;
}
function radial(g, x, y, r, rgb, a, op) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)'); g.save(); if (op) g.globalCompositeOperation = op; g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
/* moita da caatinga vista de cima: lóbulos com contorno, luz e brilho */
function scrub(g, x, y, r, pal, R) {
  const L = [], a0 = R() * TAU, n = 5 + (R() * 3 | 0);
  for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; L.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * (0.45 + R() * 0.16)]); }
  L.push([x, y, r * 0.6]);
  const discs = function (grow, dx, dy, k, col) { g.beginPath(); L.forEach(function (q) { const rr = q[2] * k + grow, xx = q[0] + dx * q[2], yy = q[1] + dy * q[2]; g.moveTo(xx + rr, yy); g.arc(xx, yy, rr, 0, TAU); }); g.fillStyle = col; g.fill(); };
  g.beginPath(); g.ellipse(x + r * 0.35, y + r * 0.45, r, r * 0.9, 0, 0, TAU); g.fillStyle = 'rgba(80,40,14,.3)'; g.fill();
  discs(2.2, 0, 0, 1, pal[2]); discs(0, 0, 0, 1, pal[0]); discs(0, -0.2, -0.25, 0.64, pal[1]); discs(0, -0.32, -0.38, 0.24, pal[3]);
}
/* árvore seca vista de cima: galhos em estrela */
function deadTree(g, x, y, r, R) {
  g.beginPath(); g.ellipse(x + r * 0.4, y + r * 0.5, r * 0.9, r * 0.7, 0, 0, TAU); g.fillStyle = 'rgba(80,40,14,.18)'; g.fill();
  for (let j = 0; j < 6; j++) { const a = R() * TAU, l = r * (0.7 + R() * 0.4), ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l; ln(g, [x, y, ex, ey], '#2e1c10', 4.4); ln(g, [x, y, ex, ey], '#8a6f56', 2.4); const b = a + (R() - 0.5) * 1.4, mx = (x + ex) / 2, my = (y + ey) / 2; ln(g, [mx, my, mx + Math.cos(b) * l * 0.4, my + Math.sin(b) * l * 0.4], '#2e1c10', 3); ln(g, [mx, my, mx + Math.cos(b) * l * 0.4, my + Math.sin(b) * l * 0.4], '#8a6f56', 1.4); }
  dot(g, x, y, 4, '#5a4434');
}
/* mandacaru visto de cima: coroas com gomos em estrela */
function cactusTop(g, x, y, r, R) {
  const crowns = [[x, y, r]]; const n = 1 + Math.floor(R() * 3);
  for (let j = 0; j < n; j++) { const a = R() * TAU; crowns.push([x + Math.cos(a) * r * 1.5, y + Math.sin(a) * r * 1.2, r * 0.72]); }
  g.beginPath(); g.ellipse(x + r * 1.2, y + r * 1.1, r * 1.8, r * 1.1, 0.5, 0, TAU); g.fillStyle = 'rgba(80,40,14,.28)'; g.fill();
  crowns.forEach(function (q) { ln(g, [x, y, q[0], q[1]], '#1e3220', q[2] * 1.2 + 2); ln(g, [x, y, q[0], q[1]], '#5f8a56', q[2] * 1.2); });
  crowns.forEach(function (q) {
    g.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, rr = q[2] * (i % 2 ? 0.8 : 1); g[i ? 'lineTo' : 'moveTo'](q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); } g.closePath();
    g.fillStyle = '#6f9a62'; g.fill(); g.strokeStyle = '#1e3220'; g.lineWidth = 2; g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ln(g, [q[0], q[1], q[0] + Math.cos(a) * q[2] * 0.9, q[1] + Math.sin(a) * q[2] * 0.9], 'rgba(30,60,30,.5)', 1); }
    dot(g, q[0] - q[2] * 0.25, q[1] - q[2] * 0.25, q[2] * 0.3, 'rgba(220,240,190,.35)');
  });
}
function xiqueTop(g, x, y, r, R) {
  g.beginPath(); g.ellipse(x + 4, y + 5, r * 1.4, r, 0, 0, TAU); g.fillStyle = 'rgba(80,40,14,.24)'; g.fill();
  for (let j = 0; j < 6; j++) { const a = R() * TAU, l = r * (0.6 + R() * 0.6); ln(g, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], '#1e3220', 7.4); ln(g, [x, y, x + Math.cos(a) * l, y + Math.sin(a) * l], j % 2 ? '#7f9e74' : '#6c8c66', 4.6); dot(g, x + Math.cos(a) * l, y + Math.sin(a) * l, 1.2, '#f2eedc'); }
}
function rockTop(g, x, y, s, R) {
  const r = radii(R, 8, 0.22);
  g.beginPath(); blobPath(g, x + 4 * s, y + 5 * s, 14 * s, 10 * s, 0, r); g.fillStyle = 'rgba(80,40,14,.3)'; g.fill();
  cel(g, function (c) { blobPath(c, x, y, 14 * s, 10 * s, R() * 2, r); }, '#a39582', { k: 2.4 * s, lw: 2, sh: 'rgba(60,30,20,.35)', hi: 'rgba(255,240,210,.35)' });
}
/* casa de taipa com telhado de duas águas, vista de cima */
function house(g, x, y, s, R) {
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(-0.08);
  g.beginPath(); g.rect(-20, -12, 46, 32); g.fillStyle = 'rgba(80,40,14,.3)'; g.fill();
  cel(g, function (c) { poly(c, [-26, -20, 26, -20, 26, 0, -26, 0]); }, '#c0623a', { k: 2, lw: 2.2, inn: function (c) { for (let i = -24; i < 26; i += 4) ln(c, [i, -20, i, 0], 'rgba(90,30,10,.45)', 1); } });
  cel(g, function (c) { poly(c, [-26, 0, 26, 0, 26, 18, -26, 18]); }, '#a8502e', { k: 2, lw: 2.2, inn: function (c) { for (let i = -24; i < 26; i += 4) ln(c, [i, 0, i, 18], 'rgba(70,20,6,.45)', 1); } });
  ln(g, [-26, 0, 26, 0], '#5a2410', 2.2);
  /* cerca de varas */
  g.beginPath(); g.moveTo(-40, 30); g.lineTo(40, 32); g.lineTo(44, -26); g.strokeStyle = '#3a2414'; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = '#a07e58'; g.lineWidth = 1.6; g.stroke();
  for (let i = 0; i <= 8; i++) dot(g, -40 + i * 10, 30 + i * 0.25, 2.2, '#5a3a22');
  g.restore();
}
function skullTop(g, x, y, s, rot) { skull(g, x, y, s * 0.6, rot); }
/* açude seco: fundo rachado, poça no meio */
function acude(g, x, y, r, R) {
  const rr = radii(R, 11, 0.16);
  g.beginPath(); blobPath(g, x, y, r * 1.18, r * 0.86, 0.2, rr); g.fillStyle = 'rgba(110,64,30,.3)'; g.fill();
  g.beginPath(); blobPath(g, x, y, r, r * 0.72, 0.2, rr); g.fillStyle = '#c99e68'; g.fill(); g.strokeStyle = 'rgba(80,46,22,.6)'; g.lineWidth = 2.4; g.stroke();
  g.save(); g.beginPath(); blobPath(g, x, y, r, r * 0.72, 0.2, rr); g.clip();
  cracks(g, R, x - r, y - r, x + r, y + r, 18, 1.1);
  g.beginPath(); blobPath(g, x + r * 0.1, y + r * 0.05, r * 0.36, r * 0.24, 0.2, radii(R, 9, 0.2)); g.fillStyle = '#5f9a96'; g.fill(); g.strokeStyle = 'rgba(230,250,240,.6)'; g.lineWidth = 1.4; g.stroke();
  g.restore();
}
/* o redemoinho do Saci visto de cima: braços de poeira em espiral, folhas e o gorro vermelho no olho */
function sacisLair(g, x, y, R0, R) {
  radial(g, x, y, R0 * 1.5, '120,70,30', 0.3);
  radial(g, x, y, R0 * 1.2, '240,222,180', 0.75);
  g.beginPath(); g.ellipse(x, y, R0 * 1.12, R0 * 0.92, 0, 0, TAU); g.strokeStyle = 'rgba(120,80,40,.25)'; g.lineWidth = 10; g.stroke();
  for (let arm = 0; arm < 5; arm++) {
    const a0 = arm * TAU / 5;
    for (let pass = 0; pass < 2; pass++) {
      g.beginPath();
      for (let i = 0; i <= 60; i++) { const u = i / 60, a = a0 + u * 4.2, r = R0 * (0.12 + u * 0.95); g[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r * 0.82); }
      g.strokeStyle = pass ? 'rgba(255,244,214,.8)' : 'rgba(110,70,34,.4)'; g.lineWidth = pass ? 7 : 18; g.lineCap = 'round'; g.save(); if (!pass) g.translate(3, 4); g.stroke(); g.restore();
    }
  }
  for (let i = 0; i < 40; i++) { const u = R(), a = R() * TAU, r = R0 * (0.2 + u * 0.95); leafDry(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.82, 1.3, a + PI / 2, ['#b08a44', '#9a6a34', '#c4a050', '#7a5a2c'][i % 4]); }
  for (let i = 0; i < 70; i++) { const a = R() * TAU, r = R0 * (0.15 + R() * 1.05); dot(g, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.82, 1 + R() * 1.4, 'rgba(110,70,36,.5)'); }
  /* olho do redemoinho com o gorro do Saci e olhos rosa */
  radial(g, x, y, R0 * 0.34, '70,40,20', 0.7);
  g.save(); g.translate(x, y); g.scale(1.7, 1.7);
  cel(g, function (c) { c.moveTo(-10, 4); c.bezierCurveTo(-11, -6, -3, -12, 3, -10); c.quadraticCurveTo(-6, -15, -16, -10); c.quadraticCurveTo(-13, -5, -10, 4); c.moveTo(-10, 4); c.bezierCurveTo(-8, -8, 6, -12, 10, 4); c.quadraticCurveTo(0, 1, -10, 4); c.closePath(); }, '#e0322a', { k: 2, lw: 2.2, sh: 'rgba(80,0,10,.38)', hi: 'rgba(255,200,170,.35)' });
  dot(g, -16, -10, 2.4, '#f2efe6');
  [[-3.4, 9], [3.6, 9]].forEach(function (e) { dot(g, e[0], e[1], 3, '#1e1416'); dot(g, e[0], e[1], 2.2, '#ff3d8a'); dot(g, e[0] - 0.4, e[1] - 0.4, 1, '#ffe0f0'); });
  g.restore();
}

/** Mapa do Sertão, visto de cima. `points` são as 12 fases em pixels do canvas. */
export function paintMap(c, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  const W = w / u, H = h / u, P = (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; }), R = rng(3301);
  let g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#d2a66a'); g.addColorStop(0.5, '#c4935a'); g.addColorStop(1, '#b07f4c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 140, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(255,230,180,.1)' : 'rgba(110,60,26,.1)'; c.fill(); }
  /* terra rachada clarinha no mapa todo */
  cracks(c, R, -20, -20, W + 20, H + 20, 46, 0.45);
  /* leito de rio seco cruzando o mapa */
  const RV = [[-0.06, 0.3], [0.12, 0.34], [0.26, 0.5], [0.42, 0.46], [0.58, 0.58], [0.72, 0.52], [0.84, 0.32], [0.94, 0.22], [1.08, 0.18]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
  repel(RV.slice(1, -1), P, 70);
  const river = spline(RV, 8), trail = trailOf(P, R, 0.22), lair = P.length ? spot(P, W, H, 150, 120) : { x: W * 0.86, y: H * 0.7 };
  strokeL(c, river, 'rgba(110,64,30,.35)', 50); strokeL(c, river, '#dcc394', 40); strokeL(c, river, '#e8d6ac', 24);
  for (let i = 0; i < river.length; i += 3) { const n = norm(river, i), o = (R() - 0.5) * 30; dot(c, river[i].x + n.x * o, river[i].y + n.y * o, 1.6 + R() * 2.4, ['#b7ab98', '#9a9080', '#c9bda6'][i % 3]); }
  [-1, 1].forEach(function (sd) { c.beginPath(); for (let i = 0; i < river.length; i++) { const n = norm(river, i); c[i ? 'lineTo' : 'moveTo'](river[i].x + n.x * 20 * sd, river[i].y + n.y * 20 * sd); } c.strokeStyle = 'rgba(90,50,24,.45)'; c.lineWidth = 2; c.stroke(); });
  /* clareiras das fases */
  P.forEach(function (p) { [[74, 58, 'rgba(226,196,140,.3)'], [56, 44, 'rgba(236,210,160,.32)'], [40, 31, 'rgba(244,224,180,.3)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); }); });
  /* trilha de terra vermelha */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(70,30,10,.4)', 26); strokeL(c, trail, '#8a4a26', 18); strokeL(c, trail, '#c27a48', 13);
    c.save(); c.translate(-1.2, -1.4); strokeL(c, trail, '#dca070', 5); c.restore();
    strokeL(c, trail, 'rgba(110,50,20,.5)', 2.2, [3, 15]);
    /* pedras de passagem onde a trilha cruza o leito */
    for (let i = 0; i < trail.length; i += 4) if (near(river, trail[i].x, trail[i].y) < 18) rockTop(c, trail[i].x, trail[i].y, 0.6, R);
  }
  /* açude e casinha */
  const free = function (x, y, d) { return near(P, x, y) > d && near(trail, x, y) > d * 0.5 && near(river, x, y) > d * 0.5 && Math.hypot(x - lair.x, y - lair.y) > 190 && x > 50 && x < W - 50 && y > 50 && y < H - 50; };
  const placed = [];
  for (let t = 0; t < 60 && placed.length < 1; t++) { const x = W * (0.2 + R() * 0.6), y = H * (0.2 + R() * 0.6); if (free(x, y, 110)) { acude(c, x, y, 54, R); placed.push({ x: x, y: y }); } }
  for (let t = 0; t < 60 && placed.length < 3; t++) { const x = W * (0.1 + R() * 0.8), y = H * (0.1 + R() * 0.8); if (free(x, y, 80) && near(placed, x, y) > 160) { house(c, x, y, 1.1, R); placed.push({ x: x, y: y }); } }
  /* ossadas e pedras soltas */
  for (let i = 0; i < 40; i++) { const x = R() * W, y = R() * H; if (near(P, x, y) > 60 && near(trail, x, y) > 24 && near(placed, x, y) > 70) rockTop(c, x, y, 0.5 + R() * 0.7, R); }
  for (let i = 0; i < 5; i++) { const x = R() * W, y = R() * H; if (near(P, x, y) > 60 && near(trail, x, y) > 24 && near(placed, x, y) > 70) skullTop(c, x, y, 1, R() * TAU); }
  /* vegetação: caatinga em grade sacudida */
  const PAL = [['#8a8f5e', '#a3a46c', '#3a3220', '#c4c08a'], ['#7a8654', '#94a064', '#33301e', '#b6bc82'], ['#9a8a5a', '#b4a26a', '#3e3220', '#d0bc88'], ['#6f7f56', '#879866', '#2c301e', '#a9b886']];
  const TR = [], cell = 44;
  for (let gy = -1; gy * cell < H + cell; gy++) for (let gx = -1; gx * cell < W + cell; gx++) {
    const tx = (gx + 0.5 + (R() - 0.5) * 0.9) * cell, ty = (gy + 0.5 + (R() - 0.5) * 0.9) * cell, tr = 12 + R() * 11, kind = R(), keep = R();
    if (keep < 0.3) continue;
    if (near(P, tx, ty) < 56 + tr * 0.7 || near(trail, tx, ty) < 13 + tr * 0.9 || near(river, tx, ty) < 22 + tr * 0.6 || near(placed, tx, ty) < 70 + tr) continue;
    if (Math.hypot(tx - lair.x, ty - lair.y) < 150) continue;
    TR.push([tx, ty, tr, kind]);
  }
  TR.sort(function (a, b) { return a[1] - b[1]; });
  TR.forEach(function (q) { if (q[3] < 0.14) cactusTop(c, q[0], q[1], q[2] * 0.5, R); else if (q[3] < 0.24) xiqueTop(c, q[0], q[1], q[2] * 0.8, R); else if (q[3] < 0.36) deadTree(c, q[0], q[1], q[2], R); else scrub(c, q[0], q[1], q[2] * 0.9, PAL[(q[3] * 97 | 0) % 4], R); });
  /* flores amarelas nas clareiras */
  P.forEach(function (p) { for (let j = 0; j < 6; j++) { const a = R() * TAU, d = 42 + R() * 20; dot(c, p.x + Math.cos(a) * d, p.y + 4 + Math.sin(a) * d * 0.78, 1.7, j % 3 ? '#f4e9b8' : '#ffd23f'); } });
  sacisLair(c, lair.x, lair.y, 118, R);
  /* sol forte em cima, bordas escuras */
  radial(c, W * 0.2, H * 0.08, W * 0.6, '255,240,190', 0.16, 'lighter');
  g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.56); g.addColorStop(0, 'rgba(50,20,6,0)'); g.addColorStop(0.6, 'rgba(50,20,6,.25)'); g.addColorStop(1, 'rgba(40,16,4,.85)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}
