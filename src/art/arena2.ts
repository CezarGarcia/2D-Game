// @ts-nocheck
/* Cenário do Capítulo 2, "Rios do Norte", desenhado por código, no mesmo formato de arena.ts.
   `paintRiverGround` faz o chão visto de cima (margem de rio, igapó ou remanso) e os objetos baixos;
   `paintRiverCanopy` faz a moldura de galhos, cipós e folhas que passa por cima dos personagens.
   A área jogável (x 120–1160, y 150–640 numa tela de 1280×720) só recebe detalhe de chão. */
import { OUT, TAU, cap, cel, dot, el, ln, poly } from './characters';

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

/* contorno orgânico fechado: raios sorteados em volta de uma elipse, alisados com curvas */
function blobShape(R, n, jit) { const r = []; for (let i = 0; i < n; i++) r.push(1 - jit + R() * jit * 2); return r; }
function blobPath(g, x, y, rx, ry, rot, r, k) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot); k = k == null ? 1 : k;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i] * k, py = Math.sin(a) * ry * r[i] * k; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
/* lâmina d'água rasa (ou mancha de lama/areia): halo molhado, corpo translúcido e um fio de brilho na borda */
function sheet(g, R, x, y, rx, ry, fill, halo, edge) {
  const r = blobShape(R, 11, 0.24), rot = R() * 0.5 - 0.25;
  if (halo) { g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1.09); g.fillStyle = halo; g.fill(); }
  g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1); g.fillStyle = fill; g.fill();
  if (edge) { g.save(); g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1); g.clip(); g.beginPath(); blobPath(g, x + 2, y + 3, rx, ry, rot, r, 1); g.strokeStyle = edge; g.lineWidth = 3; g.stroke(); g.restore(); }
}
function ripple(g, x, y, s, col, n) {
  for (let i = 0; i < (n || 2); i++) { g.beginPath(); g.ellipse(x, y, (9 + i * 8) * s, (4 + i * 3.4) * s, 0, 0.4 + i * 0.9, 2.6 + i * 1.3); g.strokeStyle = col; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke(); }
}
function pebble(g, x, y, r, col) {
  g.beginPath(); g.ellipse(x, y, r, r * 0.68, 0, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(24,18,14,.65)'; g.lineWidth = 1.2; g.stroke();
  g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.24, r * 0.36, r * 0.2, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,.32)'; g.fill();
}
/* pedra chata, quase no nível da água: detalhe de chão */
function slab(g, R, x, y, s, col) {
  const r = blobShape(R, 8, 0.16), rot = R() * 0.6 - 0.3;
  g.beginPath(); g.ellipse(x + 2 * s, y + 4 * s, 20 * s, 9 * s, rot, 0, TAU); g.fillStyle = 'rgba(8,24,34,.25)'; g.fill();
  g.beginPath(); blobPath(g, x, y, 18 * s, 9.5 * s, rot, r, 1); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(20,24,30,.7)'; g.lineWidth = 1.8; g.stroke();
  g.save(); g.beginPath(); blobPath(g, x, y, 18 * s, 9.5 * s, rot, r, 1); g.clip();
  g.beginPath(); blobPath(g, x - 2 * s, y - 3 * s, 18 * s, 9.5 * s, rot, r, 1); g.fillStyle = 'rgba(255,255,255,.14)'; g.fill();
  g.beginPath(); g.ellipse(x + 5 * s, y + 5 * s, 14 * s, 4 * s, rot, 0, TAU); g.fillStyle = 'rgba(10,20,30,.2)'; g.fill();
  ln(g, [x - 6 * s, y - 1 * s, x - 1 * s, y + 2 * s, x + 3 * s, y + 1 * s], 'rgba(20,24,30,.35)', 1); g.restore();
  g.beginPath(); g.ellipse(x, y + 1.5 * s, 21 * s, 11 * s, rot, 0.5, 2.7); g.strokeStyle = 'rgba(225,245,250,.28)'; g.lineWidth = 1.4; g.stroke();
}
function shell(g, x, y, s, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(0, 3 * s); g.quadraticCurveTo(-5.4 * s, 1 * s, -4 * s, -2.6 * s); g.quadraticCurveTo(0, -5 * s, 4 * s, -2.6 * s); g.quadraticCurveTo(5.4 * s, 1 * s, 0, 3 * s); g.closePath();
  g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,26,20,.7)'; g.lineWidth = 1.1; g.stroke();
  [-2.4, 0, 2.4].forEach(function (d) { ln(g, [0, 2.4 * s, d * s, -3 * s], 'rgba(90,60,50,.5)', 0.8); });
  g.restore();
}
function floatLeaf(g, x, y, s, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(-6 * s, 0); g.quadraticCurveTo(0, -4.4 * s, 7 * s, 0); g.quadraticCurveTo(0, 4.4 * s, -6 * s, 0); g.closePath();
  g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(14,20,14,.6)'; g.lineWidth = 1; g.stroke(); ln(g, [-5 * s, 0, 6 * s, 0], 'rgba(14,20,14,.4)', 0.7);
  g.restore();
}
/* vitória-régia vista de cima, com a borda virada */
function pad(g, x, y, s, flower, R) {
  const rx = 23 * s, ry = 14 * s, cut = R() * TAU;
  g.beginPath(); g.ellipse(x + 3 * s, y + 5 * s, rx, ry, 0, 0, TAU); g.fillStyle = 'rgba(6,20,22,.3)'; g.fill();
  cel(g, function (c) { el(c, x, y, rx, ry); }, '#7d4a44', { k: 1.4 * s, lw: 2.2 });
  cel(g, function (c) { el(c, x, y + 1.2 * s, rx - 2.6 * s, ry - 2.2 * s); }, '#4c9a4e', {
    k: 2 * s, lw: 1.4, sh: 'rgba(8,50,30,.36)', hi: 'rgba(220,255,170,.22)', inn: function (c) {
      for (let j = 0; j < 12; j++) { const a = cut + (j / 12) * TAU; ln(c, [x, y + 1.2 * s, x + Math.cos(a) * rx, y + 1.2 * s + Math.sin(a) * ry], 'rgba(20,70,36,.5)', 1); }
      c.beginPath(); c.ellipse(x, y + 1.2 * s, rx * 0.5, ry * 0.5, 0, 0, TAU); c.strokeStyle = 'rgba(20,70,36,.3)'; c.lineWidth = 1; c.stroke();
      c.beginPath(); c.moveTo(x, y + 1.2 * s); c.lineTo(x + Math.cos(cut - 0.09) * rx * 1.2, y + Math.sin(cut - 0.09) * ry * 1.2); c.lineTo(x + Math.cos(cut + 0.09) * rx * 1.2, y + Math.sin(cut + 0.09) * ry * 1.2); c.closePath(); c.fillStyle = '#1d3a34'; c.fill();
    },
  });
  if (flower) {
    const fx = x + rx * 0.2, fy = y - ry * 0.1;
    for (let j = 0; j < 9; j++) { const a = (j / 9) * TAU; cel(g, function (c) { el(c, fx + Math.cos(a) * 5.4 * s, fy + Math.sin(a) * 3.8 * s, 4.6 * s, 2.3 * s, a); }, j % 2 ? '#fff4f0' : '#ffd3de', { k: 0.6, lw: 1.3, sh: 'rgba(200,80,120,.3)' }); }
    dot(g, fx, fy, 2.8 * s, '#ffd23f'); dot(g, fx, fy, 1.3 * s, '#e4872e');
  }
}
/* capim e taboa: touceira alta, só para fora da área de jogo */
function reed(g, x, y, s, R) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 18 * s, 5 * s, 0, 0, TAU); g.fillStyle = 'rgba(8,22,16,.3)'; g.fill();
  const n = 9;
  for (let j = 0; j < n; j++) {
    const an = -1.57 + (j - (n - 1) / 2) * 0.17 + (R() - 0.5) * 0.12, l = (30 + R() * 26) * s, bx = x + (j - (n - 1) / 2) * 2.2 * s, ex = bx + Math.cos(an) * l + (R() - 0.5) * 8 * s, ey = y + Math.sin(an) * l;
    g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + Math.cos(an) * l * 0.5, y + Math.sin(an) * l * 0.62, ex, ey); g.lineCap = 'round';
    g.strokeStyle = '#102a1c'; g.lineWidth = 4.6 * s; g.stroke(); g.strokeStyle = j % 3 === 0 ? '#7fae4e' : j % 3 === 1 ? '#4f8a40' : '#3b7438'; g.lineWidth = 2.3 * s; g.stroke();
    if (j % 4 === 1) cel(g, function (c) { cap(c, ex, ey + 9 * s, ex + Math.cos(an) * 2 * s, ey + 1 * s, 2.4 * s); }, '#6a4326', { k: 0.8, lw: 1.6 });
  }
}
function rock(g, x, y, s, col) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 1 * s, 24 * s, 7 * s, 0, 0, TAU); g.fillStyle = 'rgba(6,20,22,.32)'; g.fill();
  cel(g, function (c) { poly(c, [x - 18 * s, y, x - 15 * s, y - 12 * s, x - 3 * s, y - 20 * s, x + 12 * s, y - 15 * s, x + 19 * s, y - 3 * s, x + 17 * s, y]); }, col || '#7a7f84', {
    k: 2.4, inn: function (c) {
      c.fillStyle = 'rgba(70,128,84,.9)'; c.beginPath(); c.ellipse(x - 3 * s, y - 18.5 * s, 11 * s, 4.4 * s, -0.15, 0, TAU); c.fill();
      ln(c, [x + 4 * s, y - 13 * s, x + 7 * s, y - 6 * s, x + 5 * s, y - 2 * s], 'rgba(20,24,30,.4)', 1.1);
      c.fillStyle = 'rgba(16,40,50,.35)'; c.fillRect(x - 20 * s, y - 3.4 * s, 42 * s, 4 * s);
    },
  });
  g.beginPath(); g.ellipse(x, y + 0.5 * s, 22 * s, 4.6 * s, 0, 0.25, 2.9); g.strokeStyle = 'rgba(230,246,250,.4)'; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke();
}
/* raiz rasteira: traço que afina e ondula, com raizinhas */
function root(g, R, x, y, ang, len, w) {
  const n = 12, P = []; let a = ang, px = x, py = y; const wig = 0.5 + R() * 0.5, ph = R() * 6;
  for (let i = 0; i <= n; i++) { P.push([px, py]); a = ang + Math.sin(ph + i * 0.9) * 0.42 * wig; px += Math.cos(a) * len / n; py += Math.sin(a) * len / n * 0.8; }
  const pass = function (col, k, off) { for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(P[i][0], P[i][1] + off); g.lineTo(P[i + 1][0], P[i + 1][1] + off); g.strokeStyle = col; g.lineWidth = Math.max(0.6, w * (1 - i / (n + 1.5)) * k); g.lineCap = 'round'; g.stroke(); } };
  g.save(); g.translate(2, 4); pass('rgba(6,18,16,.28)', 1.2, 0); g.restore();
  pass(OUT, 1, 0); pass('#5d4632', 0.66, 0); pass('rgba(214,180,130,.28)', 0.18, -w * 0.12);
  [3, 6, 8].forEach(function (i) { const d = (i % 2 ? 1 : -1) * (0.7 + R() * 0.5), l = len * 0.16; ln(g, [P[i][0], P[i][1], P[i][0] + Math.cos(ang + d) * l, P[i][1] + Math.sin(ang + d) * l * 0.8], OUT, w * 0.34); ln(g, [P[i][0], P[i][1], P[i][0] + Math.cos(ang + d) * l, P[i][1] + Math.sin(ang + d) * l * 0.8], '#5d4632', w * 0.18); });
}
/* tronco de pé com sapopemas (raízes em tábua), sobe para fora da tela */
function trunk(g, R, x, y, s, wet) {
  const T = Math.max(230 * s, y + 30); /* sempre sai pelo alto da tela, para não aparecer o topo cortado */
  g.beginPath(); g.ellipse(x + 30 * s, y + 4 * s, 64 * s, 16 * s, 0.08, 0, TAU); g.fillStyle = 'rgba(6,16,14,.36)'; g.fill();
  cel(g, function (c) {
    c.moveTo(x - 34 * s, y + 1 * s); c.quadraticCurveTo(x - 16 * s, y - 6 * s, x - 13 * s, y - 46 * s); c.lineTo(x - 12 * s, y - T); c.lineTo(x + 12 * s, y - T); c.lineTo(x + 13 * s, y - 44 * s);
    c.quadraticCurveTo(x + 17 * s, y - 8 * s, x + 36 * s, y); c.quadraticCurveTo(x + 18 * s, y + 6 * s, x + 7 * s, y - 2 * s); c.quadraticCurveTo(x + 1 * s, y + 9 * s, x - 6 * s, y - 1 * s); c.quadraticCurveTo(x - 16 * s, y + 7 * s, x - 34 * s, y + 1 * s); c.closePath();
  }, '#4a3a2c', {
    k: 3, lw: 2.8, inn: function (c) {
      [-8, -3, 3, 8].forEach(function (d) { c.beginPath(); c.moveTo(x + d * s, y - T + 2); c.bezierCurveTo(x + (d + 2) * s, y - 140 * s, x + (d - 2) * s, y - 60 * s, x + (d * 2.4) * s, y - 2 * s); c.strokeStyle = 'rgba(18,10,8,.5)'; c.lineWidth = 1.2; c.stroke(); });
      c.fillStyle = 'rgba(70,128,84,.85)'; c.beginPath(); c.ellipse(x - 16 * s, y - 8 * s, 10 * s, 6 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 9 * s, y - 70 * s, 5 * s, 13 * s, 0, 0, TAU); c.fill();
      /* marca da cheia */
      c.fillStyle = 'rgba(14,26,24,.38)'; c.fillRect(x - 40 * s, y - 26 * s, 80 * s, 40 * s); c.fillStyle = 'rgba(210,200,160,.16)'; c.fillRect(x - 40 * s, y - 29 * s, 80 * s, 3 * s);
    },
  });
  if (wet) { g.beginPath(); g.ellipse(x, y + 2 * s, 40 * s, 8 * s, 0, 0.15, 3); g.strokeStyle = 'rgba(214,236,226,.34)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.stroke(); g.beginPath(); g.ellipse(x, y + 4 * s, 52 * s, 11 * s, 0, 0.5, 2.6); g.strokeStyle = 'rgba(214,236,226,.18)'; g.stroke(); }
}
function drift(g, x, y) {
  g.beginPath(); g.ellipse(x + 10, y + 2, 80, 12, 0, 0, TAU); g.fillStyle = 'rgba(6,16,14,.34)'; g.fill();
  cel(g, function (c) { cap(c, x - 54, y - 14, x + 50, y - 15, 14); }, '#8a7a66', {
    k: 3, lw: 2.8, inn: function (c) {
      [-38, -16, 8, 30].forEach(function (d) { ln(c, [x + d, y - 29, x + d + 8, y - 12, x + d + 4, y - 1], 'rgba(40,30,24,.4)', 1.2); });
      c.fillStyle = 'rgba(70,128,84,.8)'; c.beginPath(); c.ellipse(x - 20, y - 28, 20, 5, 0, 0, TAU); c.fill();
    },
  });
  cel(g, function (c) { el(c, x + 54, y - 15, 8, 13.6); }, '#c4b08a', { k: 1.4, lw: 2.4, inn: function (c) { [9, 5, 2].forEach(function (r) { c.beginPath(); c.ellipse(x + 54, y - 15, r * 0.58, r, 0, 0, TAU); c.strokeStyle = 'rgba(90,70,40,.7)'; c.lineWidth = 1; c.stroke(); }); } });
  cel(g, function (c) { cap(c, x - 20, y - 26, x - 34, y - 44, 3.4); }, '#8a7a66', { k: 1, lw: 2 });
}
/* faixa de rio fundo ao longo de uma borda, com espuma e areia molhada na margem */
function riverBand(g, W, y0, shore, deep, shallow, wet) {
  const top = shore(0) > y0, P = []; for (let x = -20; x <= W + 20; x += 20) P.push([x, shore(x)]);
  const path = function (dy) { g.moveTo(P[0][0], P[0][1] + dy); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1] + dy); };
  const d = top ? 1 : -1;
  if (wet) { g.beginPath(); path(d * 7); g.strokeStyle = wet; g.lineWidth = 26; g.lineJoin = 'round'; g.stroke(); }
  g.beginPath(); path(0); g.lineTo(W + 20, y0); g.lineTo(-20, y0); g.closePath();
  const q = g.createLinearGradient(0, y0, 0, y0 + d * 140); q.addColorStop(0, deep); q.addColorStop(1, shallow); g.fillStyle = q; g.fill();
  g.beginPath(); path(0); g.strokeStyle = 'rgba(238,250,248,.7)'; g.lineWidth = 2.6; g.lineJoin = 'round'; g.stroke();
  g.beginPath(); path(-d * 8); g.strokeStyle = 'rgba(238,250,248,.26)'; g.lineWidth = 1.6; g.setLineDash([26, 18]); g.stroke();
  g.beginPath(); path(-d * 19); g.strokeStyle = 'rgba(238,250,248,.14)'; g.setLineDash([40, 30]); g.stroke(); g.setLineDash([]);
}

/** Chão da arena do rio. `a` escolhe a variação: 0 margem de areia, 1 igapó escuro e alagado, 2 remanso azul com pedras. */
export function paintRiverGround(g, W, H, a, seed) {
  const v = (((a | 0) % 3) + 3) % 3, R = rng((seed || 41) + v * 7919);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky };
  const aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 50 + R() * (aw - 100), A.y0 + 40 + R() * (ah - 80)]; };
  const BASE = [['#bfa672', '#a68c57', '#6f5b38'], ['#5b6650', '#3f4f3e', '#1a2a23'], ['#4e96a8', '#35778e', '#17455b']][v];
  let q = g.createRadialGradient(W * 0.47, H * 0.55, 60, W * 0.5, H * 0.5, W * 0.72);
  q.addColorStop(0, BASE[0]); q.addColorStop(0.55, BASE[1]); q.addColorStop(1, BASE[2]);
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  const items = [];
  const edge = function (n, fn, sMin, sMax) {
    for (let j = 0; j < n; j++) {
      const side = Math.floor(R() * 4); let x, y;
      if (side === 0) { x = A.x0 + R() * aw; y = A.y0 - 18 - R() * 50; }
      else if (side === 1) { x = A.x0 + R() * aw; y = A.y1 + 50 + R() * 28; }
      else if (side === 2) { x = A.x0 - 24 - R() * 60; y = A.y0 + R() * ah; }
      else { x = A.x1 + 24 + R() * 60; y = A.y0 + R() * ah; }
      const s = sMin + R() * (sMax - sMin);
      items.push({ y: y, d: function () { fn(x, y, s); } });
    }
  };
  const LEAF = ['#8a6a2c', '#a8822e', '#5c7a34', '#6b4a24', '#c29a3a', '#3f6a38'];

  if (v === 0) {
    /* ---- margem de areia: rio em cima, braço de rio embaixo ---- */
    const p1 = R() * 6, p2 = R() * 6, p3 = R() * 6;
    for (let j = 0; j < 20; j++) { const p = inA(); g.beginPath(); g.ellipse(p[0], p[1], 90 + R() * 150, 30 + R() * 46, R() * 0.5 - 0.25, 0, TAU); g.fillStyle = j % 2 ? 'rgba(232,212,160,.13)' : 'rgba(110,84,44,.1)'; g.fill(); }
    for (let j = 0; j < 30; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 50 + R() * 90, 20 + R() * 34, R() * 3, 0, TAU); g.fillStyle = 'rgba(70,52,28,.1)'; g.fill(); }
    /* marcas de onda na areia */
    for (let j = 0; j < 34; j++) {
      const x = R() * W, y = A.y0 - 20 + R() * (ah + 60), l = 46 + R() * 70, n = 3 + Math.floor(R() * 3), ph = R() * 6;
      for (let m = 0; m < n; m++) { g.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8; g[i ? 'lineTo' : 'moveTo'](x + u * l + m * 5, y + m * 7 + Math.sin(ph + u * 5) * 3); } g.strokeStyle = 'rgba(96,72,36,.2)'; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke(); g.save(); g.translate(0, 1.6); g.strokeStyle = 'rgba(255,242,200,.14)'; g.stroke(); g.restore(); }
    }
    riverBand(g, W, -10, function (x) { return (100 + 18 * Math.sin(x * 0.0063 + p1) + 9 * Math.sin(x * 0.019 + p2)) * ky; }, '#184f60', '#5aaea6', 'rgba(92,70,36,.34)');
    riverBand(g, W, H + 10, function (x) { return H - (44 + 13 * Math.sin(x * 0.0071 + p3) + 6 * Math.sin(x * 0.023 + p1)) * ky; }, '#184f60', '#4f9f9c', 'rgba(92,70,36,.34)');
    for (let j = 0; j < 26; j++) { const top = j % 3 !== 0, x = R() * W, y = top ? 12 + R() * 62 : H - 8 - R() * 22; ripple(g, x, y, 0.8 + R() * 0.8, 'rgba(226,246,244,.2)', 2); }
    /* lâminas d'água rasas dentro da arena */
    for (let j = 0; j < 8; j++) { const p = inA(); sheet(g, R, p[0], p[1], 60 + R() * 90, 22 + R() * 30, 'rgba(70,158,162,.3)', 'rgba(88,66,34,.2)', 'rgba(232,248,244,.3)'); ripple(g, p[0] + (R() - 0.5) * 40, p[1] + (R() - 0.5) * 10, 0.9, 'rgba(232,248,244,.22)', 2); }
    for (let j = 0; j < 620; j++) { const x = R() * W, y = R() * H; g.beginPath(); g.arc(x, y, 0.7 + R() * 1.1, 0, TAU); g.fillStyle = R() < 0.5 ? 'rgba(74,54,28,.34)' : 'rgba(255,244,206,.34)'; g.fill(); }
    for (let j = 0; j < 64; j++) pebble(g, R() * W, 120 * ky + R() * (H - 170 * ky), 2 + R() * 3.4, ['#8a8478', '#6f6a64', '#a0705a', '#b9b0a0'][Math.floor(R() * 4)]);
    for (let j = 0; j < 18; j++) shell(g, R() * W, 130 * ky + R() * (H - 190 * ky), 0.8 + R() * 0.5, R() * 6, ['#f2e3d0', '#e8c9c0', '#d9d0c4'][j % 3]);
    for (let j = 0; j < 12; j++) { const x = R() * W, y = 130 * ky + R() * (H - 190 * ky), an = R() * 3, l = 9 + R() * 12; ln(g, [x, y, x + Math.cos(an) * l, y + Math.sin(an) * l * 0.6], 'rgba(30,20,12,.7)', 3.4); ln(g, [x, y, x + Math.cos(an) * l, y + Math.sin(an) * l * 0.6], '#7a5c3c', 1.7); }
    for (let j = 0; j < 22; j++) floatLeaf(g, R() * W, 120 * ky + R() * (H - 170 * ky), 0.8 + R() * 0.5, R() * 6, LEAF[Math.floor(R() * 6)]);
    /* borda: capim, pedras, troncos, tronco caído; vitórias-régias na água */
    edge(16, function (x, y, s) { reed(g, x, y, s, R); }, 0.9, 1.3); edge(9, function (x, y, s) { rock(g, x, y, s); }, 0.9, 1.5);
    for (let j = 0; j < 9; j++) { const x = 40 + R() * (W - 80), y = 16 + R() * 56, s = 0.8 + R() * 0.5, fl = j % 3 === 0; items.push({ y: y - 400, d: function () { pad(g, x, y, s, fl, R); } }); }
    for (let j = 0; j < 4; j++) { const x = 60 + R() * (W - 120), y = H - 14 - R() * 10, s = 0.9 + R() * 0.4, fl = j % 2 === 0; items.push({ y: y - 400, d: function () { pad(g, x, y, s, fl, R); } }); }
    [[A.x0 - 50, A.y0 + 150, 1.2], [A.x1 + 56, A.y0 + 90, 1.1], [A.x1 + 44, A.y1 - 20, 1.25], [A.x0 - 36, A.y1 + 12, 1.15]].forEach(function (t) { items.push({ y: t[1], d: function () { root(g, R, t[0], t[1] - 2, t[0] < W / 2 ? 0.25 : Math.PI - 0.25, 70 * t[2], 9 * t[2]); root(g, R, t[0], t[1], t[0] < W / 2 ? -0.5 : Math.PI + 0.5, 54 * t[2], 7 * t[2]); trunk(g, R, t[0], t[1], t[2], false); } }); });
    items.push({ y: A.y1 + 56, d: function () { drift(g, W * 0.68, A.y1 + 56); } });
  } else if (v === 1) {
    /* ---- igapó: mata alagada, água cor de chá, lama e raízes ---- */
    for (let j = 0; j < 36; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 60 + R() * 110, 24 + R() * 40, R() * 3, 0, TAU); g.fillStyle = j % 2 ? 'rgba(10,26,22,.16)' : 'rgba(120,130,84,.08)'; g.fill(); }
    /* bancos de lama, um pouco mais claros */
    for (let j = 0; j < 9; j++) { const p = inA(); sheet(g, R, p[0], p[1], 70 + R() * 110, 26 + R() * 36, 'rgba(124,104,66,.4)', 'rgba(26,34,26,.22)', 'rgba(190,170,120,.18)'); }
    /* poças mais fundas */
    for (let j = 0; j < 7; j++) { const p = inA(); sheet(g, R, p[0], p[1], 50 + R() * 80, 18 + R() * 26, 'rgba(14,34,32,.34)', null, 'rgba(180,214,196,.16)'); }
    for (let j = 0; j < 90; j++) { const x = R() * W, y = R() * H; g.beginPath(); g.ellipse(x, y, 8 + R() * 14, 3 + R() * 4, 0, 0.3, 2.6); g.strokeStyle = 'rgba(196,222,200,.13)'; g.lineWidth = 1.4; g.lineCap = 'round'; g.stroke(); }
    for (let j = 0; j < 16; j++) { const p = inA(); ripple(g, p[0], p[1], 0.8 + R() * 0.7, 'rgba(196,222,200,.16)', 2); }
    for (let j = 0; j < 380; j++) { const x = R() * W, y = R() * H; g.beginPath(); g.arc(x, y, 0.7 + R() * 1.2, 0, TAU); g.fillStyle = R() < 0.6 ? 'rgba(12,22,18,.36)' : 'rgba(206,196,150,.22)'; g.fill(); }
    for (let j = 0; j < 130; j++) floatLeaf(g, R() * W, R() * H, 0.8 + R() * 0.7, R() * 6, LEAF[Math.floor(R() * 6)]);
    for (let j = 0; j < 26; j++) pebble(g, R() * W, R() * H, 2 + R() * 3, ['#5c5f58', '#494d48', '#6f6a5a'][j % 3]);
    /* raízes entrando pelas bordas: rasteiras, não tapam ninguém */
    for (let j = 0; j < 22; j++) {
      const side = j % 4; let x, y, an;
      if (side === 0) { x = A.x0 + R() * aw; y = A.y0 - 30 - R() * 30; an = 1.2 + R() * 0.8; }
      else if (side === 1) { x = A.x0 + R() * aw; y = A.y1 + 46 + R() * 20; an = -1.2 - R() * 0.8; }
      else if (side === 2) { x = A.x0 - 50 - R() * 30; y = A.y0 + R() * ah; an = (R() - 0.5) * 0.9; }
      else { x = A.x1 + 50 + R() * 30; y = A.y0 + R() * ah; an = Math.PI + (R() - 0.5) * 0.9; }
      const l = side < 2 ? 56 + R() * 44 : 80 + R() * 70, w = 7 + R() * 5; items.push({ y: -900 + j, d: function () { root(g, R, x, y, an, l, w); } });
    }
    edge(8, function (x, y, s) { reed(g, x, y, s, R); }, 0.9, 1.2); edge(5, function (x, y, s) { rock(g, x, y, s, '#5e6460'); }, 0.9, 1.3);
    edge(13, function (x, y, s) { pad(g, x, y, s, R() < 0.3, R); }, 0.75, 1.2);
    [[A.x0 - 46, A.y0 + 60, 1.25], [A.x0 - 62, A.y0 + 300, 1.1], [A.x0 - 34, A.y1 + 24, 1.3], [A.x1 + 50, A.y0 + 30, 1.2], [A.x1 + 66, A.y0 + 250, 1.1], [A.x1 + 40, A.y1 + 16, 1.3], [W * 0.3, A.y0 - 34, 1], [W * 0.56, A.y0 - 40, 1.1], [W * 0.8, A.y0 - 30, 0.95]].forEach(function (t) { items.push({ y: t[1], d: function () { trunk(g, R, t[0], t[1], t[2], true); } }); });
    items.push({ y: A.y1 + 58, d: function () { drift(g, W * 0.4, A.y1 + 58); } });
  } else {
    /* ---- remanso: água parada e azul, fundo de areia aparecendo, pedras ---- */
    for (let j = 0; j < 30; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 60 + R() * 110, 24 + R() * 40, R() * 3, 0, TAU); g.fillStyle = j % 2 ? 'rgba(8,40,62,.13)' : 'rgba(150,226,226,.07)'; g.fill(); }
    for (let j = 0; j < 9; j++) { const p = inA(); sheet(g, R, p[0], p[1], 70 + R() * 110, 26 + R() * 36, 'rgba(222,206,150,.2)', null, 'rgba(240,230,190,.14)'); }
    for (let j = 0; j < 6; j++) { const p = inA(); sheet(g, R, p[0], p[1], 60 + R() * 90, 22 + R() * 30, 'rgba(12,58,90,.22)', null, null); }
    /* luz ondulando no fundo */
    for (let j = 0; j < 120; j++) {
      const x = R() * W, y = R() * H, l = 20 + R() * 34, ph = R() * 6; g.beginPath();
      for (let i = 0; i <= 6; i++) { const u = i / 6; g[i ? 'lineTo' : 'moveTo'](x + u * l, y + Math.sin(ph + u * 6) * 3.4); }
      g.strokeStyle = 'rgba(214,248,250,.12)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    }
    for (let j = 0; j < 300; j++) { const x = R() * W, y = R() * H; g.beginPath(); g.arc(x, y, 0.7 + R() * 1.1, 0, TAU); g.fillStyle = R() < 0.5 ? 'rgba(8,36,56,.3)' : 'rgba(226,248,250,.24)'; g.fill(); }
    /* bancos de areia nos cantos de baixo */
    [[W * 0.1, H + 10, 240, 70], [W * 0.82, H + 16, 300, 76], [-20, H * 0.5, 110, 150]].forEach(function (b) { sheet(g, R, b[0], b[1], b[2], b[3], '#b59c68', 'rgba(232,248,244,.3)', 'rgba(255,240,200,.2)'); });
    for (let j = 0; j < 18; j++) { const p = inA(); ripple(g, p[0], p[1], 0.9 + R() * 0.8, 'rgba(226,248,250,.2)', 2); }
    /* pedras chatas dentro da arena */
    for (let j = 0; j < 15; j++) { const p = inA(), s = 0.7 + R() * 0.7; slab(g, R, p[0], p[1], s, ['#6f7a84', '#7f8a90', '#5f6a76'][j % 3]); }
    for (let j = 0; j < 40; j++) pebble(g, R() * W, R() * H, 2 + R() * 3.2, ['#6f7a84', '#8a949a', '#55606c'][j % 3]);
    for (let j = 0; j < 26; j++) floatLeaf(g, R() * W, R() * H, 0.8 + R() * 0.5, R() * 6, LEAF[Math.floor(R() * 6)]);
    edge(20, function (x, y, s) { rock(g, x, y, s, R() < 0.5 ? '#74808a' : '#8a9096'); }, 1, 1.9);
    edge(9, function (x, y, s) { reed(g, x, y, s, R); }, 0.9, 1.3); edge(10, function (x, y, s) { pad(g, x, y, s, R() < 0.35, R); }, 0.8, 1.2);
    [[A.x0 - 54, A.y0 + 70, 1.2], [A.x1 + 58, A.y0 + 200, 1.15], [W * 0.62, A.y0 - 36, 1]].forEach(function (t) { items.push({ y: t[1], d: function () { trunk(g, R, t[0], t[1], t[2], true); } }); });
  }
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  /* escurece fora da área jogável, para a borda ser legível */
  q = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, v === 1 ? 'rgba(2,10,10,.6)' : 'rgba(4,16,22,.48)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* folha grande de beira de rio (bananeira-brava, aninga) */
function bigLeaf(g, x, y, ang, len, wd, col, col2) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.moveTo(8, 10); g.bezierCurveTo(len * 0.3, -wd + 10, len * 0.8, -wd * 0.7 + 10, len + 8, 10); g.bezierCurveTo(len * 0.8, wd * 0.7 + 10, len * 0.3, wd + 10, 8, 10); g.fillStyle = 'rgba(4,14,12,.28)'; g.fill();
  cel(g, function (c) { c.moveTo(0, 0); c.bezierCurveTo(len * 0.3, -wd, len * 0.8, -wd * 0.7, len, 0); c.bezierCurveTo(len * 0.8, wd * 0.7, len * 0.3, wd, 0, 0); c.closePath(); }, col, {
    k: 3, lw: 2.8, sh: 'rgba(4,30,24,.4)', hi: 'rgba(210,255,170,.16)', inn: function (c) {
      ln(c, [0, 0, len, 0], col2, 2.2);
      for (let j = 1; j < 9; j++) { const u = j / 9, w2 = wd * Math.sin(u * Math.PI) * 0.85; ln(c, [len * u, 0, len * u + len * 0.1, -w2], col2, 1.1); ln(c, [len * u, 0, len * u + len * 0.1, w2], col2, 1.1); }
    },
  });
  g.restore();
}
/* folha de palmeira (açaí): talo curvo com folíolos dos dois lados */
function frond(g, x, y, ang, len, R) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const bend = (R() - 0.5) * 0.5, pt = function (u) { return [len * u, Math.sin(u * 1.5) * len * bend * 0.5]; };
  for (let pass = 0; pass < 2; pass++) {
    for (let j = 1; j <= 15; j++) {
      const u = j / 16, p = pt(u), l = (0.34 - Math.abs(u - 0.45) * 0.3) * len;
      [-1, 1].forEach(function (sd) {
        const ex = p[0] + l * 0.55, ey = p[1] + sd * l;
        g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + l * 0.1 + 5, p[1] + sd * l * 0.6, ex, ey); g.quadraticCurveTo(p[0] + l * 0.34, p[1] + sd * l * 0.36, p[0] + 7, p[1]); g.closePath();
        if (pass === 0) { g.strokeStyle = OUT; g.lineWidth = 3.4; g.lineJoin = 'round'; g.stroke(); } else { g.fillStyle = (j + (sd > 0 ? 1 : 0)) % 2 ? '#2f6f40' : '#1f5a36'; g.fill(); }
      });
    }
  }
  g.beginPath(); g.moveTo(0, 0); for (let j = 1; j <= 16; j++) { const p = pt(j / 16); g.lineTo(p[0], p[1]); } g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#5a8a3c'; g.lineWidth = 2.4; g.stroke();
  g.restore();
}
/* cipó pendurado, com folhinhas e às vezes uma flor na ponta */
function vine(g, R, x, len, sway, flower) {
  const ex = x + sway, pt = function (u) { const v2 = 1 - u; return [v2 * v2 * x + 2 * v2 * u * (x + sway * 1.6) + u * u * ex, -12 * v2 * v2 + 2 * v2 * u * len * 0.5 + u * u * len]; };
  g.beginPath(); for (let j = 0; j <= 14; j++) { const p = pt(j / 14); g[j ? 'lineTo' : 'moveTo'](p[0], p[1]); } g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = OUT; g.lineWidth = 4.8; g.stroke(); g.strokeStyle = '#4a7038'; g.lineWidth = 2.4; g.stroke();
  const n = Math.floor(len / 17);
  for (let j = 1; j <= n; j++) {
    const p = pt(j / (n + 0.4)), sd = j % 2 ? 1 : -1, an = (sd > 0 ? 0.5 : Math.PI - 0.5) + (R() - 0.5) * 0.5, l = 9 + R() * 5;
    g.save(); g.translate(p[0], p[1]); g.rotate(an);
    cel(g, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(l * 0.5, -l * 0.5, l, 0); c.quadraticCurveTo(l * 0.5, l * 0.5, 0, 0); c.closePath(); }, j % 3 ? '#3f8a48' : '#5aa64e', { k: 1, lw: 1.7, sh: 'rgba(4,40,24,.4)' });
    g.restore();
  }
  const e = pt(1);
  if (flower) { for (let j = 0; j < 3; j++) cel(g, function (c) { c.moveTo(e[0], e[1] + j * 6); c.quadraticCurveTo(e[0] + (j % 2 ? -11 : 11), e[1] + j * 6 + 1, e[0] + (j % 2 ? -9 : 9), e[1] + j * 6 + 9); c.quadraticCurveTo(e[0] + (j % 2 ? -2 : 2), e[1] + j * 6 + 8, e[0], e[1] + j * 6); c.closePath(); }, j % 2 ? '#f2a03a' : '#e4472e', { k: 0.8, lw: 1.6 }); }
  else { g.beginPath(); g.arc(e[0] + 4, e[1], 4, Math.PI, Math.PI * 2.6); g.strokeStyle = OUT; g.lineWidth = 4.2; g.stroke(); g.strokeStyle = '#4a7038'; g.lineWidth = 2; g.stroke(); }
}

/** Moldura de beira de rio por cima de tudo: copas, galhos, cipós, folhas de palmeira e folhões nos cantos. */
export function paintRiverCanopy(g, W, H, seed) {
  const R = rng(seed || 91);
  /* cipós pendurados no alto: curtos no meio, compridos perto dos cantos */
  for (let j = 0; j < 13; j++) { const x = 30 + (j / 12) * (W - 60) + (R() - 0.5) * 50, c2 = Math.abs(x / W - 0.5) * 2, len = 40 + c2 * c2 * 96 + R() * 26; vine(g, R, x, len, (R() - 0.5) * 30, j % 4 === 1); }
  /* cipós em laço, de um ponto a outro do alto */
  [[W * 0.14, W * 0.36, 58], [W * 0.6, W * 0.9, 64], [W * 0.4, W * 0.56, 34]].forEach(function (l) {
    g.beginPath(); g.moveTo(l[0], -8); g.quadraticCurveTo((l[0] + l[1]) / 2, l[2] * 2, l[1], -8); g.lineCap = 'round'; g.strokeStyle = 'rgba(4,14,12,.3)'; g.lineWidth = 7; g.save(); g.translate(8, 12); g.stroke(); g.restore();
    g.strokeStyle = OUT; g.lineWidth = 6.4; g.stroke(); g.strokeStyle = '#5d4632'; g.lineWidth = 3.6; g.stroke();
    for (let j = 1; j < 6; j++) { const u = j / 6, v2 = 1 - u, x = v2 * v2 * l[0] + 2 * v2 * u * (l[0] + l[1]) / 2 + u * u * l[1], y = -8 * v2 * v2 + 2 * v2 * u * l[2] * 2 - 8 * u * u; g.save(); g.translate(x, y); g.rotate(1.2 + (j % 2) * 0.8); cel(g, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(7, -7, 14, 0); c.quadraticCurveTo(7, 7, 0, 0); c.closePath(); }, '#3f8a48', { k: 1, lw: 1.7, sh: 'rgba(4,40,24,.4)' }); g.restore(); }
  });
  /* folhas de palmeira entrando pelos lados */
  [[-14, H * 0.3, 0.25, 150], [-14, H * 0.72, -0.3, 140], [W + 14, H * 0.36, Math.PI - 0.2, 150], [W + 14, H * 0.76, Math.PI + 0.3, 140], [W * 0.28, H + 16, -1.25, 120], [W * 0.74, H + 16, -1.9, 124]].forEach(function (f) { frond(g, f[0], f[1], f[2], f[3], R); });
  /* galhos nos cantos de cima */
  [[-10, 96, 190, 26, 0], [W + 10, 80, W - 210, 30, 1]].forEach(function (b) {
    g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo((b[0] + b[2]) / 2, b[1] - 10, b[2], b[3]); g.lineCap = 'round'; g.save(); g.translate(8, 14); g.strokeStyle = 'rgba(4,14,12,.3)'; g.lineWidth = 18; g.stroke(); g.restore();
    g.strokeStyle = OUT; g.lineWidth = 19; g.stroke(); g.strokeStyle = '#4a3a2c'; g.lineWidth = 14; g.stroke(); g.save(); g.translate(-1, -3.4); g.strokeStyle = 'rgba(190,160,120,.25)'; g.lineWidth = 3; g.stroke(); g.restore();
  });
  /* copas: tufos escuros nos cantos e bordas */
  const groups = [[60, 44, 1.5], [240, -16, 1.15], [W - 76, 36, 1.55], [W - 290, -26, 1.1], [-16, H * 0.52, 1.1], [W + 16, H * 0.56, 1.05], [44, H + 4, 1.35], [W - 56, H + 8, 1.45], [W * 0.5, -52, 1], [W * 0.5 - 200, H + 46, 1.05], [W * 0.5 + 230, H + 50, 1.05]];
  groups.forEach(function (q, n) {
    const b = [];
    for (let k = 0; k < 9; k++) b.push({ x: q[0] + (R() - 0.5) * 130 * q[2], y: q[1] + (R() - 0.5) * 96 * q[2], r: (30 + R() * 26) * q[2] });
    g.fillStyle = 'rgba(4,14,12,.3)'; b.forEach(function (o) { g.beginPath(); g.arc(o.x + 18, o.y + 26, o.r, 0, TAU); g.fill(); });
    g.fillStyle = OUT; b.forEach(function (o) { g.beginPath(); g.arc(o.x, o.y, o.r + 2.8, 0, TAU); g.fill(); });
    [['#11332c', 0, 0, 1], ['#1a5040', -0.16, -0.2, 0.8], ['#2a7350', -0.3, -0.36, 0.56]].forEach(function (p) { g.fillStyle = p[0]; b.forEach(function (o) { g.beginPath(); g.arc(o.x + o.r * p[1], o.y + o.r * p[2], o.r * p[3], 0, TAU); g.fill(); }); });
    g.fillStyle = '#58a868'; b.forEach(function (o, m) { g.beginPath(); g.ellipse(o.x - o.r * 0.3, o.y - o.r * 0.42, o.r * 0.2, o.r * 0.09, -0.6 + m + n, 0, TAU); g.fill(); });
  });
  /* folhões nos cantos, por cima das copas */
  [[18, 150, 0.5, 120, 34], [70, 40, 1.1, 110, 30], [W - 16, 140, Math.PI - 0.55, 124, 34], [W - 90, 30, Math.PI - 1.05, 104, 28], [30, H - 30, -0.5, 130, 36], [W - 30, H - 36, Math.PI + 0.45, 134, 36]].forEach(function (l, n) { bigLeaf(g, l[0], l[1], l[2], l[3], l[4], n % 2 ? '#2f7a48' : '#27683e', 'rgba(8,44,30,.6)'); });
}
