// @ts-nocheck
/* Cenário do Capítulo 4, "Cerrado em chamas": chão das arenas (3 variações), moldura por cima e mapa ilustrado.
   Tudo determinístico pela semente. A área jogável (x 120–1160, y 150–640 em 1280×720) só recebe detalhe de chão. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, FIRE, FIRE_P, EMB, EMB2, rng, lp, flamePath, flame, fire, halo, puff, spark, bz, tube } from './ch4_util';

const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

/* ---------------- peças do chão ---------------- */
function blobPath(g, x, y, rx, ry, rot, r) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i], py = Math.sin(a) * ry * r[i]; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
function blobR(R, n, j) { const r = []; for (let i = 0; i < n; i++) r.push(1 - j + R() * j * 2); return r; }
function patch(g, R, x, y, rx, ry, col) { g.beginPath(); blobPath(g, x, y, rx, ry, R() * 0.6 - 0.3, blobR(R, 10, 0.22)); g.fillStyle = col; g.fill(); }
/* capim baixo: risquinhos agrupados, desenhados em lote (rápido) */
function lowGrass(g, R, x, y, rx, ry, n, cols, shadow) {
  const B = [];
  for (let i = 0; i < n; i++) { const a = R() * TAU, d = Math.sqrt(R()); const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d, l = 4 + R() * 6 * (1 - d * 0.5), lean = (R() - 0.5) * 5; B.push([px, py, lean, l, (R() * cols.length) | 0]); }
  g.lineCap = 'round';
  g.beginPath(); B.forEach(function (b) { g.moveTo(b[0] + 1, b[1] + 1); g.lineTo(b[0] + b[2] + 1, b[1] - b[3] + 1); }); g.strokeStyle = shadow || 'rgba(60,30,12,.45)'; g.lineWidth = 2.4; g.stroke();
  cols.forEach(function (col, ci) { g.beginPath(); B.forEach(function (b) { if (b[4] === ci) { g.moveTo(b[0], b[1]); g.lineTo(b[0] + b[2], b[1] - b[3]); } }); g.strokeStyle = col; g.lineWidth = 1.5; g.stroke(); });
}
function pebble(g, x, y, r, col) {
  g.beginPath(); g.ellipse(x + 1, y + 1.4, r, r * 0.66, 0, 0, TAU); g.fillStyle = 'rgba(30,14,8,.35)'; g.fill();
  g.beginPath(); g.ellipse(x, y, r, r * 0.68, 0, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(30,14,8,.7)'; g.lineWidth = 1.1; g.stroke();
  g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r * 0.36, r * 0.2, 0, 0, TAU); g.fillStyle = 'rgba(255,230,200,.3)'; g.fill();
}
function leaf(g, x, y, s, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(-6 * s, 0); g.quadraticCurveTo(0, -4 * s, 7 * s, 0); g.quadraticCurveTo(0, 4 * s, -6 * s, 0); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,20,8,.6)'; g.lineWidth = 1; g.stroke();
  ln(g, [-5 * s, 0, 6 * s, 0], 'rgba(40,20,8,.4)', 0.7); g.restore();
}
function crack(g, R, x, y, len, col) {
  let px = x, py = y, a = R() * TAU; g.beginPath(); g.moveTo(px, py);
  for (let i = 0; i < 5; i++) { a += (R() - 0.5) * 1.2; px += Math.cos(a) * len / 5; py += Math.sin(a) * len / 5 * 0.6; g.lineTo(px, py); }
  g.strokeStyle = col; g.lineWidth = 1.3; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
}
/* touceira alta de capim (vista de frente), só nas bordas */
function tuft(g, R, x, y, s, burned) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 20 * s, 5 * s, 0, 0, TAU); g.fillStyle = 'rgba(30,14,6,.32)'; g.fill();
  const n = 11, C = burned ? ['#2a2220', '#3a302c', '#1e1816'] : ['#e0b452', '#c9963a', '#a8782c'];
  for (let pass = 0; pass < 2; pass++) for (let j = 0; j < n; j++) {
    const an = -1.57 + (j - (n - 1) / 2) * 0.16 + (R() - 0.5) * 0.1, l = (burned ? 14 + R() * 12 : 28 + R() * 26) * s, bx = x + (j - (n - 1) / 2) * 2 * s, ex = bx + Math.cos(an) * l, ey = y + Math.sin(an) * l;
    g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + Math.cos(an) * l * 0.4, y + Math.sin(an) * l * 0.66, ex, ey); g.lineCap = 'round';
    if (pass === 0) { g.strokeStyle = '#2a160a'; g.lineWidth = 4 * s; } else { g.strokeStyle = C[j % 3]; g.lineWidth = 2 * s; }
    g.stroke();
    if (pass === 1 && !burned && j % 3 === 1) { dot(g, ex, ey, 2.2 * s, '#5a3a10'); dot(g, ex, ey, 1.5 * s, '#ffd84a'); }
    if (pass === 1 && burned && j % 4 === 1) dot(g, ex, ey, 1.4 * s, EMB);
  }
}
/* cupinzeiro de beira (vista de frente) */
function mound(g, x, y, s, burned) {
  g.beginPath(); g.ellipse(x + 8 * s, y + 2 * s, 30 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(30,14,6,.38)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 22 * s, y); c.bezierCurveTo(x - 20 * s, y - 20 * s, x - 14 * s, y - 34 * s, x - 6 * s, y - 50 * s); c.quadraticCurveTo(x - 2 * s, y - 56 * s, x + 2 * s, y - 50 * s); c.bezierCurveTo(x + 6 * s, y - 40 * s, x + 10 * s, y - 42 * s, x + 13 * s, y - 34 * s); c.bezierCurveTo(x + 18 * s, y - 20 * s, x + 22 * s, y - 8 * s, x + 22 * s, y); c.quadraticCurveTo(x, y + 4 * s, x - 22 * s, y); c.closePath(); }, burned ? '#5a3e34' : '#b06a42', {
    k: 3, lw: 2.4, inn: function (c) {
      [[-16, -10, 16, -12], [-13, -24, 13, -24], [-9, -38, 6, -38]].forEach(function (q) { c.beginPath(); c.moveTo(x + q[0] * s, y + q[1] * s); c.quadraticCurveTo(x, y + (q[1] + 3) * s, x + q[2] * s, y + q[3] * s); c.strokeStyle = 'rgba(70,30,14,.35)'; c.lineWidth = 1.4; c.stroke(); });
      [[-6, -18], [6, -30], [-2, -42], [10, -12]].forEach(function (q) { dot(c, x + q[0] * s, y + q[1] * s, 1.6 * s, burned ? EMB : '#3a1a0c'); });
      if (burned) { c.fillStyle = 'rgba(20,10,8,.45)'; c.fillRect(x - 30 * s, y - 60 * s, 60 * s, 26 * s); }
    },
  });
}
function rock(g, x, y, s, col) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 1 * s, 22 * s, 6 * s, 0, 0, TAU); g.fillStyle = 'rgba(30,14,6,.32)'; g.fill();
  cel(g, function (c) { poly(c, [x - 17 * s, y, x - 14 * s, y - 11 * s, x - 3 * s, y - 17 * s, x + 11 * s, y - 13 * s, x + 18 * s, y - 2 * s, x + 16 * s, y]); }, col || '#8a6a58', {
    k: 2.2, inn: function (c) { ln(c, [x + 3 * s, y - 13 * s, x + 6 * s, y - 6 * s, x + 4 * s, y - 2 * s], 'rgba(40,20,14,.4)', 1.1); c.fillStyle = 'rgba(40,20,10,.3)'; c.fillRect(x - 20 * s, y - 3 * s, 40 * s, 4 * s); },
  });
}
/* árvore torta do cerrado, de casca grossa, com copa baixa (vista de frente, nas bordas) */
function crookedTree(g, R, x, y, s, burned) {
  g.beginPath(); g.ellipse(x + 20 * s, y + 4 * s, 56 * s, 13 * s, 0, 0, TAU); g.fillStyle = 'rgba(30,14,6,.36)'; g.fill();
  const BK = burned ? '#2e2624' : '#5a4a40', lean = (R() - 0.5) * 0.5;
  const tx = x + lean * 40 * s, ty = y - 74 * s;
  cel(g, function (c) {
    c.moveTo(x - 12 * s, y); c.bezierCurveTo(x - 6 * s, y - 26 * s, x - 18 * s + lean * 20 * s, y - 46 * s, tx - 7 * s, ty);
    c.lineTo(tx - 30 * s, ty - 18 * s); c.lineTo(tx - 25 * s, ty - 24 * s); c.lineTo(tx - 2 * s, ty - 8 * s); c.lineTo(tx + 4 * s, ty - 30 * s); c.lineTo(tx + 11 * s, ty - 28 * s); c.lineTo(tx + 8 * s, ty - 6 * s); c.lineTo(tx + 30 * s, ty - 16 * s); c.lineTo(tx + 32 * s, ty - 10 * s);
    c.lineTo(tx + 8 * s, ty + 4 * s); c.bezierCurveTo(x + 10 * s + lean * 20 * s, y - 40 * s, x + 4 * s, y - 24 * s, x + 13 * s, y); c.quadraticCurveTo(x, y + 4 * s, x - 12 * s, y); c.closePath();
  }, BK, {
    k: 3, lw: 2.6, inn: function (c) {
      for (let j = 0; j < 9; j++) { const yy = y - 6 * s - j * 8 * s, xx = lp(x, tx, j / 9); ln(c, [xx - 9 * s, yy, xx - 2 * s, yy - 3 * s, xx + 3 * s, yy + 1 * s, xx + 9 * s, yy - 2 * s], burned ? 'rgba(80,60,50,.5)' : 'rgba(25,14,10,.55)', 1.3); }
      if (burned) { [[0.3, EMB], [0.6, '#ffb04a']].forEach(function (q) { const xx = lp(x, tx, q[0]), yy = lp(y, ty, q[0]); ln(c, [xx - 5 * s, yy, xx + 4 * s, yy - 2 * s], q[1], 1.6); }); }
    },
  });
  if (burned) { for (let j = 0; j < 3; j++) puff(g, tx + (j - 1) * 14 * s, ty - 34 * s - j * 12 * s, (9 + j * 4) * s, 0.22 - j * 0.05, 'rgba(70,64,62,'); return; }
  /* copa: tufos de folha grossa, oliva com algumas folhas secas */
  const L = []; for (let j = 0; j < 9; j++) L.push([tx + (R() - 0.5) * 80 * s, ty - 22 * s - R() * 34 * s, (16 + R() * 12) * s]);
  g.fillStyle = 'rgba(30,14,6,.3)'; L.forEach(function (q) { g.beginPath(); g.arc(q[0] + 10 * s, q[1] + 12 * s, q[2], 0, TAU); g.fill(); });
  g.fillStyle = OUT; L.forEach(function (q) { g.beginPath(); g.arc(q[0], q[1], q[2] + 2.6, 0, TAU); g.fill(); });
  [['#4f5a2a', 0, 0, 1], ['#6a7434', -0.18, -0.22, 0.76], ['#8d9446', -0.32, -0.38, 0.46]].forEach(function (p) { g.fillStyle = p[0]; L.forEach(function (q) { g.beginPath(); g.arc(q[0] + q[2] * p[1], q[1] + q[2] * p[2], q[2] * p[3], 0, TAU); g.fill(); }); });
  L.forEach(function (q, j) { if (j % 3 === 0) { g.beginPath(); g.ellipse(q[0] + q[2] * 0.3, q[1] - q[2] * 0.1, q[2] * 0.3, q[2] * 0.16, 0.5, 0, TAU); g.fillStyle = '#c9a040'; g.fill(); } });
}
/* buriti: palmeira de leque, das veredas */
function buriti(g, R, x, y, s) {
  const Ht = (y < 200 ? 150 : 170) * s, top = y - Ht;
  g.beginPath(); g.ellipse(x + 30 * s, y + 4 * s, 50 * s, 10 * s, 0, 0, TAU); g.fillStyle = 'rgba(10,20,10,.3)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 9 * s, y); c.lineTo(x - 6 * s, top); c.lineTo(x + 6 * s, top); c.lineTo(x + 9 * s, y); c.closePath(); }, '#6a5a4a', {
    k: 2.4, lw: 2.4, inn: function (c) { for (let j = 0; j < 16; j++) ln(c, [x - 9 * s, y - j * Ht / 16, x + 9 * s, y - j * Ht / 16 - 3 * s], 'rgba(30,20,14,.45)', 1.2); },
  });
  /* leques */
  const F = []; for (let j = 0; j < 11; j++) F.push(-PI + 0.1 + j * (PI - 0.2) / 10 + (R() - 0.5) * 0.16);
  F.push(0.4, PI - 0.4);
  F.forEach(function (a, j) {
    const L = (60 + R() * 22) * s, ex = x + Math.cos(a) * L, ey = top + Math.sin(a) * L * 0.8 + 10 * s;
    g.beginPath(); g.moveTo(x, top); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, top + Math.sin(a) * L * 0.4 - 8 * s, ex, ey); g.strokeStyle = OUT; g.lineWidth = 4 * s; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#7a8a3a'; g.lineWidth = 2 * s; g.stroke();
    /* folha em leque na ponta */
    g.save(); g.translate(ex, ey); g.rotate(a + PI / 2);
    for (let p2 = 0; p2 < 2; p2++) { g.beginPath(); for (let m = 0; m < 9; m++) { const b = -1.1 + m * 0.275, l = 26 * s; g.moveTo(0, 0); g.lineTo(Math.sin(b) * l, -Math.cos(b) * l); } g.strokeStyle = p2 ? (j % 2 ? '#5f8a34' : '#4a7a2e') : '#1a2a10'; g.lineWidth = p2 ? 3 * s : 5.6 * s; g.stroke(); }
    g.restore();
  });
  /* cachos de frutos */
  [[-8, 8], [8, 10]].forEach(function (q) { for (let m = 0; m < 4; m++) dot(g, x + q[0] * s + (m % 2) * 3 * s, top + q[1] * s + m * 3 * s, 2.6 * s, m % 2 ? '#7a3a1a' : '#9a4a22'); });
}
/* toco queimado, ainda em brasa */
function stump(g, x, y, s) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 18 * s, 5 * s, 0, 0, TAU); g.fillStyle = 'rgba(10,6,4,.4)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 12 * s, y); c.lineTo(x - 10 * s, y - 20 * s); c.lineTo(x - 4 * s, y - 26 * s); c.lineTo(x, y - 20 * s); c.lineTo(x + 5 * s, y - 28 * s); c.lineTo(x + 10 * s, y - 18 * s); c.lineTo(x + 12 * s, y); c.closePath(); }, '#2a2220', { k: 1.6, lw: 2.2, inn: function (c) { ln(c, [x - 6 * s, y - 4 * s, x - 3 * s, y - 14 * s], EMB, 1.6); ln(c, [x + 4 * s, y - 6 * s, x + 6 * s, y - 16 * s], '#ffb04a', 1.2); } });
  halo(g, x, y - 12 * s, 22 * s, '255,120,40', 0.22);
  puff(g, x + 2 * s, y - 38 * s, 7 * s, 0.22, 'rgba(80,72,70,'); puff(g, x + 8 * s, y - 54 * s, 10 * s, 0.14, 'rgba(80,72,70,');
}
function emberDot(g, x, y, r) { halo(g, x, y, r * 4, '255,120,40', 0.35); dot(g, x, y, r, EMB); dot(g, x, y, r * 0.5, EMB2); }

/** Chão da arena do Cerrado. `variant`: 0 capim dourado e terra vermelha · 1 queimada, cinzas e brasas · 2 veredas com buritis. */
export function paintGround(g, W, H, variant, seed) {
  const v = (((variant | 0) % 3) + 3) % 3, R = rng((seed || 31) * 13 + v * 7919 + 4);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky }, aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 40 + R() * (aw - 80), A.y0 + 30 + R() * (ah - 60)]; };
  const BASE = [['#b86c40', '#9c5634', '#5e3020'], ['#6e4a34', '#523626', '#1c120c'], ['#a88a4c', '#8a7038', '#4a3a1c']][v];
  let q = g.createRadialGradient(W * 0.48, H * 0.55, 60, W * 0.5, H * 0.5, W * 0.72);
  q.addColorStop(0, BASE[0]); q.addColorStop(0.55, BASE[1]); q.addColorStop(1, BASE[2]); g.fillStyle = q; g.fillRect(0, 0, W, H);
  const items = [];
  const edge = function (n, fn, sMin, sMax) {
    for (let j = 0; j < n; j++) {
      const side = Math.floor(R() * 4); let x, y;
      if (side === 0) { x = A.x0 - 40 + R() * (aw + 80); y = A.y0 - 22 - R() * 60; }
      else if (side === 1) { x = A.x0 - 40 + R() * (aw + 80); y = A.y1 + 46 + R() * 30; }
      else if (side === 2) { x = A.x0 - 30 - R() * 70; y = A.y0 + R() * ah; }
      else { x = A.x1 + 30 + R() * 70; y = A.y0 + R() * ah; }
      const s = sMin + R() * (sMax - sMin); items.push({ y: y, d: function () { fn(x, y, s); } });
    }
  };
  const GOLD = ['#e0b452', '#c9963a', '#f0d27a', '#a8782c'];
  if (v === 0) {
    for (let j = 0; j < 36; j++) patch(g, R, R() * W, R() * H, 70 + R() * 140, 26 + R() * 50, j % 2 ? 'rgba(220,140,90,.12)' : 'rgba(90,40,20,.12)');
    /* trilhas de terra nua mais clara */
    for (let j = 0; j < 7; j++) { const p = inA(); patch(g, R, p[0], p[1], 120 + R() * 140, 20 + R() * 20, 'rgba(226,150,100,.14)'); }
    /* manchas de capim dourado baixo */
    for (let j = 0; j < 22; j++) { const p = inA(), rx = 50 + R() * 90, ry = 20 + R() * 34; patch(g, R, p[0], p[1], rx * 1.05, ry * 1.1, 'rgba(200,150,60,.22)'); lowGrass(g, R, p[0], p[1], rx, ry, 70 + (rx * 0.8 | 0), GOLD); }
    /* fora da área: capim mais fechado */
    for (let j = 0; j < 40; j++) { const x = R() * W, top = R() < 0.5, y = top ? R() * A.y0 : A.y1 + R() * (H - A.y1); lowGrass(g, R, x, y, 60 + R() * 60, 16 + R() * 20, 90, GOLD); }
    for (let j = 0; j < 24; j++) { const p = inA(); crack(g, R, p[0], p[1], 20 + R() * 30, 'rgba(70,30,14,.4)'); }
    for (let j = 0; j < 70; j++) pebble(g, R() * W, R() * H, 1.6 + R() * 2.8, ['#7a3a22', '#8e4a2c', '#5e2c1a', '#a26a4a'][j % 4]);
    for (let j = 0; j < 500; j++) { g.beginPath(); g.arc(R() * W, R() * H, 0.7 + R() * 1, 0, TAU); g.fillStyle = R() < 0.5 ? 'rgba(70,30,14,.3)' : 'rgba(255,214,170,.22)'; g.fill(); }
    for (let j = 0; j < 26; j++) leaf(g, R() * W, R() * H, 0.8 + R() * 0.5, R() * 6, ['#b08a3a', '#8a6a2a', '#c9a24a', '#6a7434'][j % 4]);
    edge(22, function (x, y, s) { tuft(g, R, x, y, s, false); }, 0.8, 1.3); edge(5, function (x, y, s) { mound(g, x, y, s, false); }, 0.8, 1.2); edge(6, function (x, y, s) { rock(g, x, y, s); }, 0.8, 1.3);
    [[A.x0 - 56, A.y0 + 120, 1.2], [A.x1 + 60, A.y0 + 60, 1.1], [A.x1 + 50, A.y1 - 30, 1.25], [A.x0 - 40, A.y1 + 30, 1.1], [W * 0.36, A.y0 - 40, 0.9], [W * 0.7, A.y0 - 46, 1]].forEach(function (t) { items.push({ y: t[1], d: function () { crookedTree(g, R, t[0], t[1], t[2], false); } }); });
  } else if (v === 1) {
    for (let j = 0; j < 30; j++) patch(g, R, R() * W, R() * H, 70 + R() * 140, 26 + R() * 50, j % 2 ? 'rgba(150,110,90,.1)' : 'rgba(10,6,4,.16)');
    /* manchas queimadas: carvão com borda de cinza */
    for (let j = 0; j < 14; j++) { const p = j < 10 ? inA() : [R() * W, R() * H], rx = 60 + R() * 110, ry = 24 + R() * 40, rr = blobR(R, 11, 0.25), rot = R() * 0.6 - 0.3;
      g.beginPath(); blobPath(g, p[0], p[1], rx * 1.12, ry * 1.16, rot, rr); g.fillStyle = 'rgba(170,160,150,.2)'; g.fill();
      g.beginPath(); blobPath(g, p[0], p[1], rx, ry, rot, rr); g.fillStyle = 'rgba(16,10,8,.5)'; g.fill();
      lowGrass(g, R, p[0], p[1], rx * 0.8, ry * 0.8, 40, ['#1a1210', '#2a201c'], 'rgba(0,0,0,0)'); }
    /* um pouco de capim que escapou */
    for (let j = 0; j < 6; j++) { const p = inA(); lowGrass(g, R, p[0], p[1], 40 + R() * 40, 14 + R() * 14, 50, GOLD); }
    for (let j = 0; j < 36; j++) { const x = R() * W, top = R() < 0.5, y = top ? R() * A.y0 : A.y1 + R() * (H - A.y1); lowGrass(g, R, x, y, 60 + R() * 60, 16 + R() * 20, 60, ['#2a201c', '#3a2e28', '#1a1210'], 'rgba(0,0,0,0)'); }
    for (let j = 0; j < 20; j++) { const p = inA(); crack(g, R, p[0], p[1], 20 + R() * 30, 'rgba(10,6,4,.45)'); }
    /* cinza clara e brasas */
    for (let j = 0; j < 700; j++) { g.beginPath(); g.arc(R() * W, R() * H, 0.7 + R() * 1.3, 0, TAU); g.fillStyle = R() < 0.6 ? 'rgba(210,204,196,.32)' : 'rgba(10,6,4,.35)'; g.fill(); }
    for (let j = 0; j < 44; j++) { const p = j < 30 ? inA() : [R() * W, R() * H]; emberDot(g, p[0], p[1], 1.2 + R() * 1.4); }
    for (let j = 0; j < 40; j++) pebble(g, R() * W, R() * H, 1.6 + R() * 2.6, ['#3a2a24', '#4a3a32', '#2a201c'][j % 3]);
    for (let j = 0; j < 30; j++) leaf(g, R() * W, R() * H, 0.8 + R() * 0.5, R() * 6, ['#2a201c', '#3a2e28', '#6a4a30'][j % 3]);
    edge(14, function (x, y, s) { tuft(g, R, x, y, s, true); }, 0.9, 1.3); edge(8, function (x, y, s) { stump(g, x, y, s); }, 0.9, 1.4); edge(4, function (x, y, s) { mound(g, x, y, s, true); }, 0.8, 1.1); edge(4, function (x, y, s) { rock(g, x, y, s, '#4a3a34'); }, 0.8, 1.2);
    [[A.x0 - 54, A.y0 + 100, 1.2], [A.x1 + 58, A.y0 + 140, 1.15], [A.x0 - 46, A.y1 + 20, 1.1], [W * 0.6, A.y0 - 42, 1]].forEach(function (t) { items.push({ y: t[1], d: function () { crookedTree(g, R, t[0], t[1], t[2], true); } }); });
  } else {
    for (let j = 0; j < 34; j++) patch(g, R, R() * W, R() * H, 70 + R() * 140, 26 + R() * 50, j % 2 ? 'rgba(110,140,60,.12)' : 'rgba(60,40,20,.12)');
    /* vereda: córrego com capim verde e úmido ao longo do alto */
    const p1 = R() * 6, p2 = R() * 6, sh = function (x) { return (88 + 16 * Math.sin(x * 0.006 + p1) + 7 * Math.sin(x * 0.021 + p2)) * ky; }, P = []; for (let x = -20; x <= W + 20; x += 16) P.push([x, sh(x)]);
    const path = function (dy) { g.moveTo(P[0][0], P[0][1] + dy); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1] + dy); };
    g.beginPath(); path(0); g.strokeStyle = 'rgba(70,120,50,.55)'; g.lineWidth = 110; g.lineJoin = 'round'; g.stroke();
    g.beginPath(); path(0); g.strokeStyle = 'rgba(60,110,50,.6)'; g.lineWidth = 64; g.stroke();
    g.beginPath(); path(0); g.strokeStyle = '#3a5a3a'; g.lineWidth = 30; g.stroke();
    g.beginPath(); path(-1); g.strokeStyle = '#2f6f80'; g.lineWidth = 22; g.stroke();
    g.beginPath(); path(-3); g.strokeStyle = 'rgba(190,236,240,.35)'; g.lineWidth = 2; g.setLineDash([22, 18]); g.stroke(); g.setLineDash([]);
    for (let j = 0; j < 36; j++) { const x = R() * W, y = sh(x) + (R() - 0.5) * 70; lowGrass(g, R, x, y, 40 + R() * 40, 12 + R() * 10, 60, ['#6aa040', '#4f8a34', '#8ab84a']); }
    /* capim verde da vereda entrando na arena e capim dourado */
    for (let j = 0; j < 10; j++) { const p = inA(); patch(g, R, p[0], p[1], 60 + R() * 80, 22 + R() * 26, 'rgba(90,140,60,.2)'); lowGrass(g, R, p[0], p[1], 56 + R() * 60, 20 + R() * 20, 80, ['#6aa040', '#4f8a34', '#8ab84a', '#c9b04a']); }
    for (let j = 0; j < 14; j++) { const p = inA(), rx = 50 + R() * 80, ry = 20 + R() * 28; lowGrass(g, R, p[0], p[1], rx, ry, 70 + (rx * 0.6 | 0), GOLD); }
    for (let j = 0; j < 30; j++) { const x = R() * W, y = A.y1 + R() * (H - A.y1); lowGrass(g, R, x, y, 60 + R() * 60, 16 + R() * 20, 80, GOLD); }
    /* poças úmidas */
    for (let j = 0; j < 5; j++) { const p = inA(); patch(g, R, p[0], p[1], 40 + R() * 50, 14 + R() * 14, 'rgba(50,80,60,.22)'); }
    for (let j = 0; j < 450; j++) { g.beginPath(); g.arc(R() * W, R() * H, 0.7 + R() * 1, 0, TAU); g.fillStyle = R() < 0.5 ? 'rgba(50,40,16,.3)' : 'rgba(255,236,170,.2)'; g.fill(); }
    for (let j = 0; j < 40; j++) pebble(g, R() * W, A.y0 + R() * (H - A.y0), 1.6 + R() * 2.6, ['#7a5a3a', '#8a6a4a', '#5e4a32'][j % 3]);
    for (let j = 0; j < 22; j++) leaf(g, R() * W, A.y0 + R() * (H - A.y0), 0.8 + R() * 0.5, R() * 6, ['#6a8a34', '#b08a3a', '#4f7a2e'][j % 3]);
    for (let j = 0; j < 7; j++) { const x = 60 + j * (W - 120) / 6 + (R() - 0.5) * 60; items.push({ y: sh(x) + 30, d: function () { buriti(g, R, x, sh(x) + 30, 0.55 + R() * 0.12); } }); }
    [[A.x0 - 60, A.y0 + 200, 0.95], [A.x1 + 62, A.y0 + 250, 1], [A.x0 - 50, A.y1 + 40, 0.9], [A.x1 + 50, A.y1 + 30, 0.95]].forEach(function (t) { items.push({ y: t[1], d: function () { buriti(g, R, t[0], t[1], t[2]); } }); });
    edge(16, function (x, y, s) { tuft(g, R, x, y, s, false); }, 0.8, 1.2); edge(3, function (x, y, s) { mound(g, x, y, s, false); }, 0.8, 1.1);
  }
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  q = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, v === 1 ? 'rgba(10,4,2,.62)' : 'rgba(30,12,4,.5)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* ---------------- moldura por cima ---------------- */
function branch(g, R, x0, y0, x1, y1, w, leaves) {
  const mx = (x0 + x1) / 2 + (R() - 0.5) * 60, my = (y0 + y1) / 2 + (R() - 0.5) * 50;
  const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10, v2 = 1 - u; pts.push([v2 * v2 * x0 + 2 * v2 * u * mx + u * u * x1 + Math.sin(u * 9 + x0) * 5, v2 * v2 * y0 + 2 * v2 * u * my + u * u * y1 + Math.cos(u * 7 + y0) * 4]); }
  const pass = function (col, k, dx, dy) { for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(pts[i][0] + dx, pts[i][1] + dy); g.lineTo(pts[i + 1][0] + dx, pts[i + 1][1] + dy); g.strokeStyle = col; g.lineWidth = Math.max(2, w * (1 - i / 13) * k); g.lineCap = 'round'; g.stroke(); } };
  pass('rgba(20,8,4,.3)', 1.1, 10, 14); pass(OUT, 1, 0, 0); pass('#5a4a40', 0.78, 0, 0); pass('rgba(180,150,120,.25)', 0.22, -1, -w * 0.18);
  /* casca grossa: rachas */
  for (let i = 1; i < 9; i++) { const p = pts[i], ww = w * (1 - i / 13) * 0.35; ln(g, [p[0] - ww, p[1] - ww * 0.6, p[0] + ww * 0.4, p[1] + ww], 'rgba(20,10,6,.6)', 1.4); }
  if (leaves) for (let i = 3; i <= 10; i += 2) { const p = pts[i]; leafCluster(g, R, p[0] + (R() - 0.5) * 20, p[1] + (R() - 0.5) * 16, 0.8 + R() * 0.5); }
  return pts;
}
function leafCluster(g, R, x, y, s) {
  for (let j = 0; j < 6; j++) {
    const a = j * 1.047 + R() * 0.5, l = (16 + R() * 8) * s;
    g.save(); g.translate(x, y); g.rotate(a);
    cel(g, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -l * 0.42, l, 0); c.quadraticCurveTo(l * 0.5, l * 0.42, 0, 0); c.closePath(); }, ['#5a6a2a', '#6f7c34', '#8a8a3a', '#b8903a'][(j + (x | 0)) % 4], { k: 1.2, lw: 1.8, sh: 'rgba(20,30,10,.4)', inn: function (c) { ln(c, [0, 0, l * 0.9, 0], 'rgba(30,40,14,.45)', 1); } });
    g.restore();
  }
}
function tallGrass(g, R, x, base, h, n, dense) {
  for (let pass = 0; pass < 2; pass++) for (let j = 0; j < n; j++) {
    const bx = x + (j - n / 2) * (dense ? 3.4 : 5) + Math.sin(j * 7.3) * 3, l = h * (0.6 + 0.4 * Math.abs(Math.sin(j * 2.7 + x))), an = -PI / 2 + Math.sin(j * 1.9 + x) * 0.35, ex = bx + Math.cos(an) * l, ey = base + Math.sin(an) * l;
    g.beginPath(); g.moveTo(bx, base); g.quadraticCurveTo(bx + Math.cos(an) * l * 0.3, base + Math.sin(an) * l * 0.6, ex, ey); g.lineCap = 'round';
    if (!pass) { g.strokeStyle = '#2a160a'; g.lineWidth = 5; } else { g.strokeStyle = ['#e0b452', '#c9963a', '#a8782c', '#f0d27a'][j % 4]; g.lineWidth = 2.6; }
    g.stroke();
    if (pass && j % 5 === 2) { dot(g, ex, ey, 2.4, '#5a3a10'); dot(g, ex, ey, 1.6, '#ffd84a'); }
  }
}
function smoke(g, x, y, r, a, warm) {
  const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, (warm ? 'rgba(120,80,60,' : 'rgba(90,80,78,') + a + ')'); q.addColorStop(0.6, (warm ? 'rgba(110,74,56,' : 'rgba(84,76,74,') + a * 0.5 + ')'); q.addColorStop(1, 'rgba(80,70,68,0)');
  g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2);
}
/** Moldura do cerrado em chamas: fumaça nas bordas, galhos tortos de casca grossa nos cantos e capim alto embaixo. */
export function paintCanopy(g, W, H, seed) {
  const R = rng((seed || 77) * 7 + 404);
  /* fumaça e calor nas bordas */
  [[0, 0, 300, 0.5, 1], [W, 0, 320, 0.5, 1], [W * 0.5, -60, 260, 0.35, 0], [W * 0.25, -40, 200, 0.3, 0], [W * 0.75, -50, 220, 0.3, 1], [0, H, 260, 0.35, 0], [W, H, 260, 0.35, 0], [-40, H * 0.5, 180, 0.3, 0], [W + 40, H * 0.45, 180, 0.3, 1]].forEach(function (s) { smoke(g, s[0], s[1], s[2], s[3], s[4]); });
  /* galhos tortos entrando pelos cantos de cima */
  branch(g, R, -20, 150, 200, 24, 26, true); branch(g, R, -10, 40, 140, -10, 18, true);
  branch(g, R, W + 20, 120, W - 230, 20, 28, true); branch(g, R, W + 10, 260, W - 90, 150, 16, true);
  branch(g, R, W * 0.45, -14, W * 0.58, 40, 12, true);
  /* tufos de folha grossa nos cantos */
  [[40, 30, 1.3], [120, 70, 1], [W - 50, 40, 1.35], [W - 160, 64, 1], [W * 0.52, 26, 0.9], [20, 200, 1], [W - 24, 220, 1.05]].forEach(function (l) { leafCluster(g, R, l[0], l[1], l[2]); });
  /* capim alto na borda de baixo e nos cantos */
  for (let x = -10; x < W + 20; x += 30) { const d = Math.abs(x / W - 0.5) * 2, h = 34 + d * d * 80 + R() * 14; tallGrass(g, R, x, H + 6, h, 7, true); }
  tallGrass(g, R, 20, H * 0.82, 90, 9, false); tallGrass(g, R, W - 20, H * 0.8, 96, 9, false);
  /* cinzas e fagulhas no ar, só nas bordas */
  for (let j = 0; j < 70; j++) {
    const side = j % 4; let x, y;
    if (side === 0) { x = R() * W; y = R() * 110; } else if (side === 1) { x = R() * W; y = H - R() * 60; } else if (side === 2) { x = R() * 100; y = R() * H; } else { x = W - R() * 100; y = R() * H; }
    if (j % 3 === 0) { dot(g, x, y, 1.6, 'rgba(255,150,60,.85)'); dot(g, x, y, 0.8, 'rgba(255,230,160,.9)'); } else dot(g, x, y, 1.3, 'rgba(210,200,190,.5)');
  }
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
function strokeL(c, L, col, lw, dash) { if (L.length < 2) return; c.beginPath(); c.moveTo(L[0].x, L[0].y); for (let i = 1; i < L.length; i++) c.lineTo(L[i].x, L[i].y); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.stroke(); if (dash) c.setLineDash([]); }
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
function radial(c, x, y, r, rgb, a, op) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); if (op) c.globalCompositeOperation = op; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
function vignette(c, W, H, a, rgb, inner) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (inner || 0.34), W / 2, H / 2, Math.hypot(W, H) * 0.56); g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
/* copa vista de cima: tufos; pal = [base, luz, contorno, brilho] */
function crown(c, x, y, r, pal, R) {
  const L = [], a0 = R() * TAU, n = 4 + (R() * 3 | 0);
  for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; L.push([x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.5, r * (0.46 + R() * 0.16)]); } L.push([x, y, r * 0.6]);
  c.beginPath(); c.ellipse(x + r * 0.35, y + r * 0.45, r * 1.05, r * 0.9, 0, 0, TAU); c.fillStyle = 'rgba(40,20,6,.3)'; c.fill();
  /* tronco torto aparecendo */
  ln(c, [x + r * 0.1, y + r * 0.2, x + r * 0.5, y + r * 0.9], OUT, 5); ln(c, [x + r * 0.1, y + r * 0.2, x + r * 0.5, y + r * 0.9], '#5a4636', 2.6);
  const disc = function (grow, dx, dy, k, col) { c.beginPath(); L.forEach(function (q) { const rr = q[2] * k + grow, px = q[0] + dx * q[2], py = q[1] + dy * q[2]; c.moveTo(px + rr, py); c.arc(px, py, rr, 0, TAU); }); c.fillStyle = col; c.fill(); };
  disc(2.2, 0, 0, 1, pal[2]); disc(0, 0, 0, 1, pal[0]); disc(0, -0.2, -0.25, 0.64, pal[1]); disc(0, -0.32, -0.38, 0.24, pal[3]);
}
function palmTop(c, x, y, r, R) {
  c.beginPath(); c.ellipse(x + r * 0.4, y + r * 0.5, r, r * 0.86, 0, 0, TAU); c.fillStyle = 'rgba(10,30,10,.3)'; c.fill();
  for (let p = 0; p < 2; p++) { c.beginPath(); for (let i = 0; i < 11; i++) { const a = i * TAU / 11 + R() * 0.2; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.strokeStyle = p ? '#6aa040' : '#1a3010'; c.lineWidth = p ? 3 : 5.4; c.lineCap = 'round'; c.stroke(); }
  for (let i = 0; i < 11; i++) { const a = i * TAU / 11 + 0.3; dot(c, x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, 3.6, i % 2 ? '#4f8a34' : '#5f9a3a'); }
  dot(c, x, y, r * 0.2, '#7a3a1a');
}
function termite(c, x, y, s) { c.beginPath(); c.ellipse(x + 5 * s, y + 4 * s, 9 * s, 5 * s, 0, 0, TAU); c.fillStyle = 'rgba(40,16,6,.35)'; c.fill(); cel(c, function (p) { p.moveTo(x - 6 * s, y + 3 * s); p.quadraticCurveTo(x - 5 * s, y - 8 * s, x, y - 13 * s); p.quadraticCurveTo(x + 5 * s, y - 8 * s, x + 6 * s, y + 3 * s); p.quadraticCurveTo(x, y + 5 * s, x - 6 * s, y + 3 * s); p.closePath(); }, '#b0663e', { k: 1.4, lw: 1.6 }); }
/* covil: o Boitatá enrolado num campo queimado (visto de cima) */
function lairSnake(c, x, y, s, R) {
  c.save(); c.translate(x, y); c.scale(s, s);
  /* espiral de gomos, de fora para dentro */
  const S = []; for (let i = 0; i <= 46; i++) { const u = i / 46, a = 0.4 + u * TAU * 1.55, r = 66 - u * 46; S.push([Math.cos(a) * r, Math.sin(a) * r * 0.82, 15 - u * 2]); }
  /* chamas nas juntas */
  /* cauda que afina */
  const T = []; for (let i = 0; i <= 8; i++) { const a = 0.4 - i * 0.12, r = 66 + i * 1.2; T.push([Math.cos(a) * r, Math.sin(a) * r * 0.82, Math.max(3, 14 - i * 1.4)]); }
  cel(c, tube(T), '#6a6362', { k: 2, lw: 2.4 });
  c.save(); c.translate(T[8][0], T[8][1]); c.rotate(-PI / 2 - 0.9); flame(c, 0, 2, 3.4, 12, 0, FIRE_P, true, 1.8); c.restore();
  cel(c, tube(S), '#6f6766', {
    k: 3, sh: 'rgba(20,8,8,.4)', hi: 'rgba(255,200,180,.18)', lw: 2.6, inn: function (p) {
      for (let i = 2; i < S.length - 1; i += 2) { const a = Math.atan2(S[i + 1][1] - S[i - 1][1], S[i + 1][0] - S[i - 1][0]) + PI / 2, r = S[i][2]; ln(p, [S[i][0] - Math.cos(a) * r, S[i][1] - Math.sin(a) * r, S[i][0] + Math.cos(a) * r, S[i][1] + Math.sin(a) * r], 'rgba(30,10,10,.6)', 2.6); ln(p, [S[i][0] - Math.cos(a) * r, S[i][1] - Math.sin(a) * r, S[i][0] + Math.cos(a) * r, S[i][1] + Math.sin(a) * r], '#ff7a4a', 1); }
      p.fillStyle = 'rgba(255,255,255,.1)'; p.beginPath(); S.forEach(function (q, i) { p[i ? 'lineTo' : 'moveTo'](q[0] - 3, q[1] - q[2] * 0.4); }); p.lineWidth = 4; p.strokeStyle = 'rgba(255,255,255,.14)'; p.stroke();
    },
  });
  /* fogo rosa-alaranjado nas juntas, por cima das escamas */
  for (let i = 2; i < S.length - 2; i += 3) { const q = S[i], a = Math.atan2(q[1], q[0]); c.save(); c.translate(q[0] + Math.cos(a) * q[2] * 0.5, q[1] + Math.sin(a) * q[2] * 0.5); halo(c, 0, -4, 12, '255,110,80', 0.35); flame(c, 0, 2, 3.8, 11 + (i % 2) * 4, -2 + (i % 3), FIRE_P, true, 1.8); c.restore(); }
  /* cabeça erguida no meio */
  const hx = S[S.length - 1][0] + 8, hy = S[S.length - 1][1] - 12;
  c.save(); c.translate(hx, hy); c.scale(1.5, 1.5); c.translate(-hx, -hy);
  halo(c, hx, hy, 30, '255,90,110', 0.3);
  [[-10, -6, 20], [-4, -12, 24], [4, -14, 20]].forEach(function (q, n) { flame(c, hx + q[0], hy + q[1], 5, q[2], -6, n % 2 ? FIRE_P : FIRE, true, 2.2); });
  cel(c, function (p) { p.moveTo(hx - 14, hy + 2); p.bezierCurveTo(hx - 14, hy - 12, hx + 4, hy - 14, hx + 20, hy - 6); p.quadraticCurveTo(hx + 26, hy, hx + 20, hy + 6); p.bezierCurveTo(hx + 6, hy + 12, hx - 12, hy + 12, hx - 14, hy + 2); p.closePath(); }, '#7b7372', { k: 2.4, lw: 2.4 });
  [[-2, -5], [-2, 5]].forEach(function (e) { halo(c, hx + e[0], hy + e[1], 9, '255,61,138', 0.6); dot(c, hx + e[0], hy + e[1], 3.4, '#ff3d8a'); dot(c, hx + e[0] + 0.4, hy + e[1] - 0.4, 1.6, '#ffe0f0'); });
  c.save(); c.translate(hx + 24, hy); c.rotate(PI / 2); flame(c, 0, 0, 2.6, 12, 0, FIRE_P, true, 1.6); c.restore();
  c.restore();
  c.restore();
}

/** Mapa ilustrado do Cerrado. */
export function paintMap(c0, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c0.save(); c0.scale(u, u); c0.lineCap = 'round'; c0.lineJoin = 'round';
  const c = c0, W = w / u, H = h / u, P = (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; }), R = rng(4404);
  let g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#b89a4a'); g.addColorStop(0.5, '#a88838'); g.addColorStop(1, '#8a6a2e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 130, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 3 === 0 ? 'rgba(120,130,60,.14)' : i % 3 === 1 ? 'rgba(170,80,40,.12)' : 'rgba(60,40,10,.12)'; c.fill(); }
  const lair = P.length ? spot(P, W, H, 150, 120) : { x: W * 0.86, y: H * 0.7 };
  /* vereda: córrego que desce do alto, com faixa verde e buritis */
  const RV = [[0.3, -0.06], [0.28, 0.12], [0.36, 0.3], [0.32, 0.5], [0.4, 0.66], [0.36, 0.84], [0.42, 1.06]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
  repel(RV, P, 96); repel(RV, [lair], 220);
  const river = spline(RV, 8), trail = trailOf(P, R, 0.22);
  strokeL(c, river, 'rgba(70,120,50,.5)', 110); strokeL(c, river, 'rgba(80,130,56,.65)', 64);
  /* queimadas: manchas escuras, mais perto do covil */
  for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H; if (near(P, x, y) < 70) continue; c.beginPath(); c.ellipse(x, y, 40 + R() * 50, 26 + R() * 30, R() * 3, 0, TAU); c.fillStyle = 'rgba(30,18,12,.35)'; c.fill(); }
  c.save(); c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 180 * (1 + 0.12 * Math.sin(a * 3 + 1) + 0.07 * Math.sin(a * 7)); c[i ? 'lineTo' : 'moveTo'](lair.x + Math.cos(a) * r * 1.15, lair.y + Math.sin(a) * r * 0.9); } c.closePath();
  const bg = c.createRadialGradient(lair.x, lair.y, 20, lair.x, lair.y, 210); bg.addColorStop(0, '#2a1610'); bg.addColorStop(0.7, '#3a2418'); bg.addColorStop(1, 'rgba(58,36,24,.2)'); c.fillStyle = bg; c.fill(); c.restore();
  /* clareiras das fases */
  P.forEach(function (p) { [[74, 56, 'rgba(230,200,120,.22)'], [56, 42, 'rgba(240,214,140,.24)'], [38, 28, 'rgba(250,228,160,.2)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); }); });
  /* capim: risquinhos */
  c.beginPath(); for (let i = 0; i < 1400; i++) { const x = R() * W, y = R() * H; c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 3, y - 4 - R() * 3); } c.strokeStyle = 'rgba(90,60,20,.35)'; c.lineWidth = 1.3; c.stroke();
  c.beginPath(); for (let i = 0; i < 900; i++) { const x = R() * W, y = R() * H; c.moveTo(x, y); c.lineTo(x + (R() - 0.5) * 3, y - 4 - R() * 3); } c.strokeStyle = 'rgba(250,224,140,.35)'; c.stroke();
  /* água do córrego */
  strokeL(c, river, '#2a4a2a', 22); strokeL(c, river, '#2f7080', 15); strokeL(c, river, 'rgba(190,236,240,.4)', 1.6, [12, 20]);
  /* trilha de terra vermelha */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(40,16,6,.42)', 27); strokeL(c, trail, '#6a2e16', 18.5); strokeL(c, trail, '#b8613a', 13.5);
    c.save(); c.translate(-1.2, -1.4); strokeL(c, trail, '#d9875a', 5); c.restore();
    strokeL(c, trail, 'rgba(110,40,20,.5)', 2.2, [3, 15]);
    /* pontinhas de pedra onde a trilha cruza o córrego */
    for (let i = 0; i < trail.length; i += 3) if (near(river, trail[i].x, trail[i].y) < 14) { const n0 = norm(trail, i); [-1, 1].forEach(function (sd) { dot(c, trail[i].x + n0.x * 4 * sd, trail[i].y + n0.y * 4 * sd, 3.6, '#2a1a10'); dot(c, trail[i].x + n0.x * 4 * sd - 0.6, trail[i].y + n0.y * 4 * sd - 0.6, 2.6, '#a89a88'); }); }
  }
  /* brasas e rachas no campo queimado */
  for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 40 + R() * 150, x = lair.x + Math.cos(a) * d * 1.1, y = lair.y + Math.sin(a) * d * 0.86; if (near(P, x, y) < 50 || near(trail, x, y) < 16) continue; halo(c, x, y, 8, '255,120,40', 0.5); dot(c, x, y, 1.8, EMB); }
  for (let i = 0; i < 10; i++) { const a = R() * TAU, d = 60 + R() * 110, x = lair.x + Math.cos(a) * d, y = lair.y + Math.sin(a) * d * 0.8; if (near(trail, x, y) < 20) continue; ln(c, [x, y, x + 10, y + 4, x + 16, y - 2, x + 26, y + 3], '#1a0c08', 3); ln(c, [x, y, x + 10, y + 4, x + 16, y - 2, x + 26, y + 3], '#ff7a3a', 1.2); }
  /* cupinzeiros */
  const TM = []; for (let i = 0; i < 34; i++) { const x = R() * W, y = R() * H; if (near(P, x, y) > 66 && near(trail, x, y) > 24 && near(river, x, y) > 26 && Math.hypot(x - lair.x, y - lair.y) > 200) TM.push([x, y, 0.8 + R() * 0.6]); }
  /* árvores esparsas do cerrado e buritis na vereda */
  const PAL = [['#5a6a2a', '#76863a', '#24300e', '#a0aa52'], ['#6a7430', '#869040', '#2a3010', '#b0b45a'], ['#4e6230', '#647a3a', '#1e2a10', '#8aa050'], ['#7a7a30', '#9a9440', '#302e10', '#c4bc60']];
  const IPE = ['#d6a52c', '#f2c94e', '#5a3a0a', '#ffe690'], BURN = ['#3a3230', '#4a403c', '#140e0c', '#6a5e58'];
  const TR = [], cell = 52;
  for (let gy = -1; gy * cell < H + cell; gy++) for (let gx = -1; gx * cell < W + cell; gx++) {
    const tx = (gx + 0.5 + (R() - 0.5) * 0.95) * cell, ty = (gy + 0.5 + (R() - 0.5) * 0.95) * cell, tr = 12 + R() * 11, kind = R(), keep = R();
    if (keep < 0.42) continue;
    if (near(P, tx, ty) < 56 + tr * 0.7 || near(trail, tx, ty) < 13 + tr * 0.9) continue;
    const dr = near(river, tx, ty), dl = Math.hypot(tx - lair.x, (ty - lair.y) * 1.2);
    if (dl < 150) continue;
    if (dr < 14 + tr * 0.6) continue;
    if (dr < 50) { if (keep > 0.6) TR.push([tx, ty, tr * 0.9, 'palm']); continue; }
    TR.push([tx, ty, tr, dl < 240 ? BURN : kind < 0.06 ? IPE : PAL[(kind * 97 | 0) % 4]]);
  }
  TM.forEach(function (t) { TR.push([t[0], t[1], t[2], 'mound']); });
  TR.sort(function (a, b) { return a[1] - b[1]; });
  TR.forEach(function (q) { if (q[3] === 'palm') palmTop(c, q[0], q[1], q[2], R); else if (q[3] === 'mound') termite(c, q[0], q[1], q[2]); else crown(c, q[0], q[1], q[2], q[3], R); });
  /* flores do capim-dourado nas clareiras */
  P.forEach(function (p) { for (let j = 0; j < 7; j++) { const a = R() * TAU, d = 42 + R() * 20; dot(c, p.x + Math.cos(a) * d, p.y + 4 + Math.sin(a) * d * 0.78, 1.8, j % 3 ? '#ffe28a' : '#ffd23f'); } });
  /* o covil */
  lairSnake(c, lair.x, lair.y, 1.12, R);
  /* fumaça subindo do covil e das queimadas */
  for (let i = 0; i < 7; i++) { const x = lair.x - 30 + i * 12 + Math.sin(i) * 10, y = lair.y - 90 - i * 22; puff(c, x, y, 16 + i * 4, 0.24 - i * 0.025, 'rgba(70,60,58,'); }
  /* céu de queimada: brilho laranja vindo do covil e bordas escuras */
  radial(c, lair.x, lair.y, 300, '255,110,50', 0.1, 'lighter');
  radial(c, W * 0.2, H * 0.1, W * 0.5, '255,200,120', 0.1, 'lighter');
  vignette(c, W, H, 0.8, '30,10,4', 0.3);
  c0.restore();
}
