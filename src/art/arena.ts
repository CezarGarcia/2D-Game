// @ts-nocheck
/* Cenário da Mata Atlântica, desenhado por código. `paintGround` faz o chão e os objetos baixos;
   `paintCanopy` faz as copas que passam por cima dos personagens; `paintRays` faz os raios de sol. */
import { OUT, TAU, cap, cel, dot, el, ln, poly } from './characters';

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function fern(c, x, y, s) {
  for (let j = 0; j < 6; j++) {
    const a = -2.7 + j * 0.46, ex = x + Math.cos(a) * 30 * s, ey = y + Math.sin(a) * 22 * s - 6 * s, mx = x + Math.cos(a) * 16 * s, my = y + Math.sin(a) * 20 * s - 8 * s;
    [['#12301c', 4.6], ['#3f7a40', 2]].forEach(function (st) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(mx, my, ex, ey); c.strokeStyle = st[0]; c.lineWidth = st[1]; c.lineCap = 'round'; c.stroke(); });
    for (let m = 1; m < 7; m++) {
      const u = m / 7, px = (1 - u) * (1 - u) * x + 2 * u * (1 - u) * mx + u * u * ex, py = (1 - u) * (1 - u) * y + 2 * u * (1 - u) * my + u * u * ey, l = (1 - u * 0.6) * 7 * s;
      [['#12301c', 3.6], [m % 2 ? '#5d9a4a' : '#4a8a40', 1.8]].forEach(function (st) { c.beginPath(); c.moveTo(px - Math.sin(a) * l, py + Math.cos(a) * l * 0.7); c.lineTo(px, py); c.lineTo(px + Math.sin(a) * l, py - Math.cos(a) * l * 0.7); c.strokeStyle = st[0]; c.lineWidth = st[1]; c.stroke(); });
    }
  }
}
function brom(c, x, y, s) {
  for (let j = 0; j < 9; j++) {
    const a = -2.9 + j * 0.33, inn = j > 2 && j < 6, l = (inn ? 15 : 22) * s;
    cel(c, function (c) { c.moveTo(x - Math.sin(a) * 3 * s, y + Math.cos(a) * 2 * s); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 - Math.sin(a) * 4 * s, y + Math.sin(a) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.8); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + Math.sin(a) * 4 * s, y + Math.sin(a) * l * 0.6, x + Math.sin(a) * 3 * s, y - Math.cos(a) * 2 * s); c.closePath(); }, inn ? '#d9435e' : '#3f7a4a', { k: 1, lw: 1.8 });
  }
}
function mush(c, x, y, s) {
  cel(c, function (c) { cap(c, x, y, x, y - 6 * s, 2 * s); }, '#efe6d2', { k: 0.6, lw: 1.6 });
  cel(c, function (c) { c.moveTo(x - 7 * s, y - 6 * s); c.quadraticCurveTo(x, y - 18 * s, x + 7 * s, y - 6 * s); c.closePath(); }, '#c9392c', { k: 1, lw: 1.8, inn: function (c) { dot(c, x - 2.4 * s, y - 10 * s, 1.2 * s, '#fff'); dot(c, x + 2.6 * s, y - 8.6 * s, 1 * s, '#fff'); } });
}
function rock(c, x, y, s) {
  cel(c, function (c) { poly(c, [x - 18 * s, y, x - 14 * s, y - 13 * s, x - 2 * s, y - 20 * s, x + 13 * s, y - 14 * s, x + 19 * s, y]); }, '#77756c', { k: 2.2, inn: function (c) { c.fillStyle = 'rgba(86,130,70,.9)'; c.beginPath(); c.ellipse(x - 3 * s, y - 18 * s, 11 * s, 4.5 * s, -0.15, 0, TAU); c.fill(); } });
}
function trunk(c, x, y, s) {
  c.beginPath(); c.ellipse(x + 30 * s, y + 4 * s, 62 * s, 16 * s, 0.08, 0, TAU); c.fillStyle = 'rgba(8,18,12,.35)'; c.fill();
  cel(c, function (c) { c.moveTo(x - 26 * s, y); c.quadraticCurveTo(x - 13 * s, y - 8 * s, x - 12 * s, y - 40 * s); c.lineTo(x - 11 * s, y - 220 * s); c.lineTo(x + 11 * s, y - 220 * s); c.lineTo(x + 12 * s, y - 40 * s); c.quadraticCurveTo(x + 14 * s, y - 8 * s, x + 28 * s, y); c.quadraticCurveTo(x + 12 * s, y + 5 * s, x + 4 * s, y - 2 * s); c.quadraticCurveTo(x - 6 * s, y + 6 * s, x - 26 * s, y); c.closePath(); }, '#4d3828', {
    k: 3, lw: 2.8, inn: function (c) {
      [-7, -2, 4, 8].forEach(function (d) { c.beginPath(); c.moveTo(x + d * s, y - 218 * s); c.bezierCurveTo(x + (d + 2) * s, y - 140 * s, x + (d - 2) * s, y - 60 * s, x + (d + 1) * s, y - 4 * s); c.strokeStyle = 'rgba(20,12,8,.5)'; c.lineWidth = 1.2; c.stroke(); });
      c.fillStyle = 'rgba(86,130,70,.85)'; c.beginPath(); c.ellipse(x - 14 * s, y - 6 * s, 10 * s, 6 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x - 9 * s, y - 60 * s, 5 * s, 12 * s, 0, 0, TAU); c.fill();
    },
  });
}
function log(c, x, y) {
  c.beginPath(); c.ellipse(x + 10, y + 2, 78, 12, 0, 0, TAU); c.fillStyle = 'rgba(8,18,12,.35)'; c.fill();
  cel(c, function (c) { cap(c, x - 52, y - 16, x + 50, y - 16, 16); }, '#5a4230', { k: 3, lw: 2.8, inn: function (c) { [-36, -14, 10, 30].forEach(function (d) { ln(c, [x + d, y - 31, x + d + 6, y - 2], 'rgba(20,12,8,.45)', 1.2); }); c.fillStyle = 'rgba(86,130,70,.9)'; c.beginPath(); c.ellipse(x - 18, y - 30, 22, 6, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 30, y - 29, 10, 4, 0, 0, TAU); c.fill(); } });
  cel(c, function (c) { el(c, x + 54, y - 16, 9, 15.5); }, '#c9a26b', { k: 1.4, lw: 2.4, inn: function (c) { [11, 6.5, 2.5].forEach(function (r) { c.beginPath(); c.ellipse(x + 54, y - 16, r * 0.58, r, 0, 0, TAU); c.strokeStyle = 'rgba(90,60,30,.7)'; c.lineWidth = 1; c.stroke(); }); } });
  mush(c, x - 30, y - 28, 0.8); mush(c, x - 40, y - 27, 0.6);
}

/** Chão, clareira e objetos baixos. `a` é a área jogável, para concentrar a decoração alta fora dela. */
export function paintGround(g, W, H, a, seed) {
  const R = rng(seed || 31);
  let q = g.createRadialGradient(W * 0.47, H * 0.55, 60, W * 0.5, H * 0.5, W * 0.7);
  q.addColorStop(0, '#49683a'); q.addColorStop(0.55, '#2c4a2c'); q.addColorStop(1, '#14261a');
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (let j = 0; j < 22; j++) { g.beginPath(); g.ellipse(W * 0.5 + (R() - 0.5) * (a.x1 - a.x0) * 0.8, (a.y0 + a.y1) / 2 + (R() - 0.5) * (a.y1 - a.y0) * 0.7, 90 + R() * 150, 34 + R() * 50, R() * 0.6 - 0.3, 0, TAU); g.fillStyle = 'rgba(134,108,62,.12)'; g.fill(); }
  for (let j = 0; j < 44; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 50 + R() * 90, 22 + R() * 38, R() * 3, 0, TAU); g.fillStyle = 'rgba(8,24,16,.13)'; g.fill(); }
  const LC = ['#7a6a2e', '#5c4a22', '#8a5a2a', '#40602c', '#a07a34', '#33502a'];
  for (let j = 0; j < 520; j++) { g.save(); g.translate(R() * W, R() * H); g.rotate(R() * 3.14); g.beginPath(); g.ellipse(0, 0, 3 + R() * 4, 1.4 + R() * 1.4, 0, 0, TAU); g.fillStyle = LC[Math.floor(R() * 6)]; g.globalAlpha = 0.55 + R() * 0.35; g.fill(); g.restore(); }
  for (let j = 0; j < 60; j++) { const x = R() * W, y = R() * H, r = 2 + R() * 3.5; g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, TAU); g.fillStyle = '#6f7068'; g.fill(); g.strokeStyle = 'rgba(20,14,10,.7)'; g.lineWidth = 1.2; g.stroke(); g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.25, r * 0.35, r * 0.2, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,.3)'; g.fill(); }
  for (let j = 0; j < 230; j++) {
    const tx = R() * W, ty = R() * H, n = 3 + Math.floor(R() * 3); g.lineCap = 'round';
    for (let m = 0; m < n; m++) { const an = -1.57 + (m - (n - 1) / 2) * 0.42 + (R() - 0.5) * 0.2, l = 7 + R() * 9; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(an) * l * 0.5, ty + Math.sin(an) * l * 0.7, tx + Math.cos(an) * l + 2, ty + Math.sin(an) * l); g.strokeStyle = 'rgba(16,34,18,.8)'; g.lineWidth = 3; g.stroke(); g.strokeStyle = m % 2 ? '#5d8f44' : '#467a3a'; g.lineWidth = 1.5; g.stroke(); }
  }
  for (let j = 0; j < 60; j++) { const fx = R() * W, fy = R() * H, fc = R() < 0.5 ? '#fff4d6' : '#ffd23f'; for (let m = 0; m < 4; m++) { g.beginPath(); g.arc(fx + Math.cos(m * 1.57) * 2, fy + Math.sin(m * 1.57) * 2, 1.5, 0, TAU); g.fillStyle = fc; g.fill(); } g.beginPath(); g.arc(fx, fy, 1, 0, TAU); g.fillStyle = '#e4572e'; g.fill(); }

  /* borda da arena: troncos, tronco caído, pedras e plantas, ordenados de cima para baixo */
  const items = [];
  const edge = function (n, fn, sMin, sMax) {
    for (let j = 0; j < n; j++) {
      const side = Math.floor(R() * 4);
      let x, y;
      if (side === 0) { x = a.x0 + R() * (a.x1 - a.x0); y = a.y0 - 14 - R() * 50; }
      else if (side === 1) { x = a.x0 + R() * (a.x1 - a.x0); y = a.y1 + 34 + R() * 40; }
      else if (side === 2) { x = a.x0 - 20 - R() * 60; y = a.y0 + R() * (a.y1 - a.y0); }
      else { x = a.x1 + 20 + R() * 60; y = a.y0 + R() * (a.y1 - a.y0); }
      const s = sMin + R() * (sMax - sMin);
      items.push({ y: y, d: function () { fn(g, x, y, s); } });
    }
  };
  edge(16, fern, 0.9, 1.4); edge(8, brom, 0.9, 1.3); edge(9, rock, 0.9, 1.6); edge(10, mush, 0.9, 1.4);
  /* poucas plantas baixas dentro da clareira, só para quebrar o vazio */
  for (let j = 0; j < 7; j++) { const x = a.x0 + 60 + R() * (a.x1 - a.x0 - 120), y = a.y0 + 40 + R() * (a.y1 - a.y0 - 80), s = 0.6 + R() * 0.3; items.push({ y: y, d: function () { (j % 3 ? fern : mush)(g, x, y, s); } }); }
  [[a.x0 - 44, a.y0 + 120, 1.25], [a.x1 + 52, a.y0 + 60, 1.1], [a.x0 - 30, a.y1 + 30, 1.3], [a.x1 + 40, a.y1 + 20, 1.2], [W * 0.36, a.y0 - 30, 1], [W * 0.68, a.y0 - 36, 1.1]].forEach(function (t) { items.push({ y: t[1], d: function () { trunk(g, t[0], t[1], t[2]); } }); });
  items.push({ y: a.y1 + 52, d: function () { log(g, W * 0.3, a.y1 + 52); } });
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  /* escurece fora da área jogável, para a borda ser legível */
  q = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(4,14,10,.5)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/** Copas de árvore nos cantos e bordas, por cima de tudo. */
export function paintCanopy(g, W, H, seed) {
  const R = rng(seed || 77);
  const groups = [[70, 50, 1.5], [250, -10, 1.2], [W - 80, 40, 1.6], [W - 300, -25, 1.1], [-10, H * 0.5, 1.2], [W + 10, H * 0.55, 1.1], [50, H + 5, 1.4], [W - 60, H + 10, 1.5], [W * 0.5, -45, 1], [W * 0.5 - 220, H + 40, 1.1], [W * 0.5 + 240, H + 46, 1.1]];
  groups.forEach(function (q, n) {
    const b = [];
    for (let k = 0; k < 9; k++) b.push({ x: q[0] + (R() - 0.5) * 130 * q[2], y: q[1] + (R() - 0.5) * 96 * q[2], r: (30 + R() * 26) * q[2] });
    g.fillStyle = 'rgba(4,14,10,.3)'; b.forEach(function (o) { g.beginPath(); g.arc(o.x + 18, o.y + 26, o.r, 0, TAU); g.fill(); });
    g.fillStyle = OUT; b.forEach(function (o) { g.beginPath(); g.arc(o.x, o.y, o.r + 2.8, 0, TAU); g.fill(); });
    [['#143420', 0, 0, 1], ['#1f4f2a', -0.16, -0.2, 0.8], ['#2f6f36', -0.3, -0.36, 0.56]].forEach(function (p) { g.fillStyle = p[0]; b.forEach(function (o) { g.beginPath(); g.arc(o.x + o.r * p[1], o.y + o.r * p[2], o.r * p[3], 0, TAU); g.fill(); }); });
    g.fillStyle = '#4f9448'; b.forEach(function (o, m) { g.beginPath(); g.ellipse(o.x - o.r * 0.3, o.y - o.r * 0.42, o.r * 0.2, o.r * 0.09, -0.6 + m + n, 0, TAU); g.fill(); });
  });
}

/** Raios de sol em diagonal. A textura é desenhada em branco amarelado e somada à cena. */
export function paintRays(g, W, H) {
  [[W * 0.14, 110], [W * 0.4, 80], [W * 0.62, 130]].forEach(function (r) {
    const q = g.createLinearGradient(r[0], 0, r[0] + 300, H); q.addColorStop(0, 'rgba(255,236,160,.2)'); q.addColorStop(1, 'rgba(255,236,160,0)');
    g.fillStyle = q; g.beginPath(); g.moveTo(r[0], 0); g.lineTo(r[0] + r[1], 0); g.lineTo(r[0] + r[1] + 380, H); g.lineTo(r[0] + 250, H); g.closePath(); g.fill();
  });
}
