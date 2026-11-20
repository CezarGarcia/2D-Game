// @ts-nocheck
/* Cenário do Capítulo 6, "Pampa de lua cheia": chão das arenas (campo, taipa com porteira, sanga com figueira),
   a moldura por cima e o mapa ilustrado do capítulo. Tudo determinístico pela semente. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, rng, halo } from './ch6_common';

const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

/* ---------------- ajudantes ---------------- */
function blobShape(R, n, jit) { const r = []; for (let i = 0; i < n; i++) r.push(1 - jit + R() * jit * 2); return r; }
function blobPath(g, x, y, rx, ry, rot, r, k) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot); k = k == null ? 1 : k;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i] * k, py = Math.sin(a) * ry * r[i] * k; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
function patch(g, R, x, y, rx, ry, col) { const r = blobShape(R, 10, 0.22); g.beginPath(); blobPath(g, x, y, rx, ry, R() * 0.6 - 0.3, r, 1); g.fillStyle = col; g.fill(); }
/* tufo de grama baixa, vista de cima/oblíqua: fios curtos com a ponta acesa pelo luar */
function tuft(g, x, y, s, dark, lit) {
  for (let i = 0; i < 4; i++) { const a = -PI / 2 + (i - 1.5) * 0.42, l = (5 + (i % 2) * 2.4) * s; g.beginPath(); g.moveTo(x + (i - 1.5) * 1.2 * s, y); g.quadraticCurveTo(x + (i - 1.5) * 1.6 * s, y - l * 0.6, x + Math.cos(a) * l * 0.7, y + Math.sin(a) * l); g.strokeStyle = dark; g.lineWidth = 1.5 * s; g.lineCap = 'round'; g.stroke(); }
  for (let i = 1; i < 3; i++) { const a = -PI / 2 + (i - 1.5) * 0.42, l = (5 + (i % 2) * 2.4) * s; dot(g, x + Math.cos(a) * l * 0.7, y + Math.sin(a) * l, 0.8 * s, lit); }
}
/* touceira alta (macega, capim-caninha): só fora da área de jogo */
function macega(g, x, y, s, R, pal) {
  g.beginPath(); g.ellipse(x + 5 * s, y + 3 * s, 22 * s, 7 * s, 0, 0, TAU); g.fillStyle = 'rgba(4,10,18,.38)'; g.fill();
  pal = pal || ['#2f4a44', '#3d5c52', '#567a6c', '#9ec2c0'];
  const n = 13;
  for (let pass = 0; pass < 2; pass++) for (let j = 0; j < n; j++) {
    const a = -PI / 2 + (j / (n - 1) - 0.5) * 2.2 + (R() - 0.5) * 0.2, l = (26 + R() * 18) * s * (1 - Math.abs(j / (n - 1) - 0.5) * 0.7), bx = x + (j - n / 2) * 1.3 * s;
    const ex = bx + Math.cos(a) * l, ey = y + Math.sin(a) * l * 0.9;
    g.beginPath(); g.moveTo(bx - 2 * s, y); g.quadraticCurveTo(bx + Math.cos(a) * l * 0.4, y + Math.sin(a) * l * 0.5, ex, ey); g.quadraticCurveTo(bx + Math.cos(a) * l * 0.45 + 2 * s, y + Math.sin(a) * l * 0.45, bx + 2 * s, y); g.closePath();
    if (pass === 0) { g.strokeStyle = '#0c1418'; g.lineWidth = 2.4; g.lineJoin = 'round'; g.stroke(); } else { g.fillStyle = pal[j % 3]; g.fill(); }
    if (pass === 1 && j % 3 === 1) dot(g, ex, ey, 1.2 * s, pal[3]);
  }
}
/* pedra chata no chão */
function flat(g, R, x, y, s, col) {
  const r = blobShape(R, 8, 0.18), rot = R() * 0.6 - 0.3;
  g.beginPath(); g.ellipse(x + 2 * s, y + 3 * s, 15 * s, 7 * s, rot, 0, TAU); g.fillStyle = 'rgba(4,10,18,.3)'; g.fill();
  g.beginPath(); blobPath(g, x, y, 13 * s, 7 * s, rot, r, 1); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(10,14,22,.75)'; g.lineWidth = 1.6; g.stroke();
  g.save(); g.beginPath(); blobPath(g, x, y, 13 * s, 7 * s, rot, r, 1); g.clip();
  g.beginPath(); blobPath(g, x - 2 * s, y - 2.4 * s, 13 * s, 7 * s, rot, r, 1); g.fillStyle = 'rgba(200,220,255,.18)'; g.fill(); g.restore();
}
/* pedra de pé (para a taipa e as bordas) */
function rock(g, x, y, s, col, R) {
  const a = (R() - 0.5) * 3 * s, b = (R() - 0.5) * 3 * s;
  g.beginPath(); g.ellipse(x + 4 * s, y + 5 * s, 15 * s, 6 * s, 0, 0, TAU); g.fillStyle = 'rgba(4,10,18,.4)'; g.fill();
  cel(g, function (c) { poly(c, [x - 13 * s, y + 3 * s, x - 10 * s + a, y - 8 * s, x + b, y - 12 * s, x + 11 * s, y - 7 * s + a, x + 14 * s, y + 3 * s, x + 2 * s, y + 7 * s]); }, col, { k: 2.4 * s, lw: 2, out: '#0c1016', sh: 'rgba(6,8,24,.4)', hi: 'rgba(190,214,255,.3)', inn: function (c) { c.fillStyle = 'rgba(110,140,120,.45)'; c.beginPath(); c.ellipse(x - 3 * s, y - 9 * s, 7 * s, 2.6 * s, -0.2, 0, TAU); c.fill(); } });
}
/* florzinha branca do campo (maçanilha) */
function flower(g, x, y, s) { for (let i = 0; i < 5; i++) { const a = i * 1.257; dot(g, x + Math.cos(a) * 1.6 * s, y + Math.sin(a) * 1.6 * s, 1.1 * s, 'rgba(232,236,246,.85)'); } dot(g, x, y, 0.9 * s, '#e8c84a'); }
/* caveira de boi, perto da borda */
function skull(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.ellipse(2, 4, 16, 6, 0, 0, TAU); g.fillStyle = 'rgba(4,10,18,.35)'; g.fill();
  [-1, 1].forEach(function (sd) { g.beginPath(); g.moveTo(sd * 5, -4); g.quadraticCurveTo(sd * 16, -8, sd * 19, -15); g.strokeStyle = '#0c1016'; g.lineWidth = 4.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#c9c4b4'; g.lineWidth = 2.4; g.stroke(); });
  cel(g, function (c) { c.moveTo(-6, -6); c.quadraticCurveTo(0, -9, 6, -6); c.lineTo(4, 6); c.quadraticCurveTo(0, 9, -4, 6); c.closePath(); }, '#d9d4c4', { k: 1.2, lw: 1.6, out: '#0c1016', sh: 'rgba(6,8,24,.35)' });
  dot(g, -2.4, -1.6, 1.6, '#1a1a22'); dot(g, 2.4, -1.6, 1.6, '#1a1a22'); dot(g, -1, 5, 0.7, '#1a1a22'); dot(g, 1, 5, 0.7, '#1a1a22');
  g.restore();
}
/* cupinzeiro baixo do campo */
function mound(g, x, y, s) {
  g.beginPath(); g.ellipse(x + 5 * s, y + 4 * s, 18 * s, 7 * s, 0, 0, TAU); g.fillStyle = 'rgba(4,10,18,.38)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 14 * s, y + 3 * s); c.bezierCurveTo(x - 13 * s, y - 10 * s, x - 4 * s, y - 20 * s, x + 2 * s, y - 19 * s); c.bezierCurveTo(x + 9 * s, y - 17 * s, x + 14 * s, y - 6 * s, x + 14 * s, y + 3 * s); c.quadraticCurveTo(x, y + 7 * s, x - 14 * s, y + 3 * s); c.closePath(); }, '#5a5a5e', { k: 3 * s, lw: 2, out: '#0c1016', sh: 'rgba(6,8,24,.4)', hi: 'rgba(190,214,255,.25)', inn: function (c) { dot(c, x - 3 * s, y - 8 * s, 1.6 * s, '#1a1a22'); dot(c, x + 5 * s, y - 3 * s, 1.3 * s, '#1a1a22'); } });
}
function moonlight(g, W, H, a) {
  let q = g.createRadialGradient(W * 0.86, -H * 0.2, 40, W * 0.7, H * 0.1, W * 0.95);
  q.addColorStop(0, 'rgba(170,200,255,' + a + ')'); q.addColorStop(1, 'rgba(170,200,255,0)');
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = q; g.fillRect(0, 0, W, H); g.restore();
}

/* ---------------- chão das arenas ---------------- */
export function paintGround(g, W, H, a, seed) {
  const v = (((a | 0) % 3) + 3) % 3, R = rng((seed || 31) + v * 7919);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky };
  const aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 30 + R() * (aw - 60), A.y0 + 20 + R() * (ah - 40)]; };
  const outside = function (x, y, m) { return x < A.x0 - m || x > A.x1 + m || y < A.y0 - m || y > A.y1 + m; };
  const BASE = [['#4a6670', '#34505c', '#1a2a36'], ['#466270', '#304a58', '#192734'], ['#43626a', '#2e4a52', '#172832']][v];
  let q = g.createRadialGradient(W * 0.5, H * 0.52, 60, W * 0.5, H * 0.5, W * 0.72);
  q.addColorStop(0, BASE[0]); q.addColorStop(0.55, BASE[1]); q.addColorStop(1, BASE[2]);
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  /* manchas de pasto mais alto e mais ralo */
  for (let j = 0; j < 46; j++) patch(g, R, R() * W, R() * H, 60 + R() * 140, 24 + R() * 50, j % 3 ? 'rgba(18,34,40,.16)' : 'rgba(150,186,196,.07)');
  /* trevo e capim em placas */
  for (let j = 0; j < 22; j++) { const p = inA(); patch(g, R, p[0], p[1], 30 + R() * 60, 12 + R() * 20, 'rgba(60,96,90,.18)'); }
  const items = [];
  const edge = function (n, fn, sMin, sMax, m) {
    for (let j = 0; j < n; j++) {
      const side = Math.floor(R() * 4); let x, y;
      if (side === 0) { x = R() * W; y = A.y0 - 22 - R() * (A.y0 - 40); }
      else if (side === 1) { x = R() * W; y = A.y1 + 30 + R() * (H - A.y1 - 30); }
      else if (side === 2) { x = A.x0 - 30 - R() * (A.x0 - 40); y = R() * H; }
      else { x = A.x1 + 30 + R() * (W - A.x1 - 40); y = R() * H; }
      if (m && !m(x, y)) continue;
      const s = sMin + R() * (sMax - sMin);
      items.push({ y: y, d: function () { fn(x, y, s); } });
    }
  };

  if (v === 0) {
    /* ---- campo aberto: trilha do gado atravessando, cupinzeiros e uma caveira na borda ---- */
    const y0 = A.y0 + ah * (0.25 + R() * 0.2), y1 = A.y1 - ah * (0.15 + R() * 0.2), ph = R() * 6;
    for (let pass = 0; pass < 2; pass++) {
      g.beginPath(); for (let i = 0; i <= 64; i++) { const u = i / 64, x = -20 + u * (W + 40), y = y0 + (y1 - y0) * u + Math.sin(u * 5 + ph) * 26 * ky; g[i ? 'lineTo' : 'moveTo'](x, y); }
      g.strokeStyle = pass ? 'rgba(120,128,128,.28)' : 'rgba(16,24,30,.2)'; g.lineWidth = pass ? 14 : 30; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke();
    }
    g.save(); g.setLineDash([3, 9]);
    [-5, 5].forEach(function (o) { g.beginPath(); for (let i = 0; i <= 64; i++) { const u = i / 64, x = -20 + u * (W + 40), y = y0 + (y1 - y0) * u + Math.sin(u * 5 + ph) * 26 * ky + o; g[i ? 'lineTo' : 'moveTo'](x, y); } g.strokeStyle = 'rgba(30,36,40,.4)'; g.lineWidth = 2; g.stroke(); });
    g.restore();
    edge(5, function (x, y, s) { mound(g, x, y, s); }, 0.9, 1.4);
    items.push({ y: A.y1 + 40, d: function () { skull(g, A.x1 - 120, A.y1 + 40, 1.1, 0.3); } });
    edge(26, function (x, y, s) { macega(g, x, y, s, R); }, 0.8, 1.3);
    edge(10, function (x, y, s) { rock(g, x, y, s, R() < 0.5 ? '#6c7480' : '#7c8088', R); }, 0.7, 1.2);
  } else if (v === 1) {
    /* ---- taipa de pedra no alto, porteira de madeira, pedras caídas ---- */
    const wy = A.y0 - 64 * ky, gx = W * (0.4 + R() * 0.2);
    /* caminho batido saindo da porteira */
    for (let pass = 0; pass < 2; pass++) { g.beginPath(); g.moveTo(gx, wy); g.bezierCurveTo(gx + 20, A.y0 + 80, gx - 60, A.y0 + 220, gx - 20, H + 20); g.strokeStyle = pass ? 'rgba(126,132,130,.24)' : 'rgba(16,24,30,.18)'; g.lineWidth = pass ? 40 : 70; g.lineCap = 'round'; g.stroke(); }
    for (let j = 0; j < 30; j++) { const u = R(), x = (1 - u) * (1 - u) * (1 - u) * gx + 3 * (1 - u) * (1 - u) * u * (gx + 20) + 3 * (1 - u) * u * u * (gx - 60) + u * u * u * (gx - 20), y = (1 - u) * (1 - u) * (1 - u) * wy + 3 * (1 - u) * (1 - u) * u * (A.y0 + 80) + 3 * (1 - u) * u * u * (A.y0 + 220) + u * u * u * (H + 20); dot(g, x + (R() - 0.5) * 30, y, 1.2 + R() * 1.4, 'rgba(170,176,180,.35)'); }
    /* pedras soltas e achatadas na arena (só chão) */
    for (let j = 0; j < 12; j++) { const p = inA(); flat(g, R, p[0], p[1], 0.6 + R() * 0.6, ['#5e6672', '#6c7480', '#555c68'][j % 3]); }
    /* a taipa: duas fileiras de pedras empilhadas, interrompida pela porteira */
    const wall = function (x0, x1, y) {
      items.push({ y: y + 6, d: function () {
        g.beginPath(); g.moveTo(x0, y + 12); g.lineTo(x1, y + 12); g.strokeStyle = 'rgba(4,10,18,.45)'; g.lineWidth = 22; g.lineCap = 'round'; g.stroke();
        for (let row = 0; row < 2; row++) for (let x = x0 + (row ? 12 : 0); x < x1; x += 22 + R() * 6) { const s = 0.75 + R() * 0.3; rock(g, x, y - row * 13 + (R() - 0.5) * 3, s, ['#747c88', '#848a94', '#666e7a'][Math.floor(R() * 3)], R); }
      } });
    };
    wall(-20, gx - 52, wy); wall(gx + 52, W + 20, wy);
    /* porteira: dois moirões e a cancela aberta pela metade */
    items.push({ y: wy + 8, d: function () {
      [gx - 46, gx + 46].forEach(function (px) { g.beginPath(); g.ellipse(px + 5, wy + 6, 9, 4, 0, 0, TAU); g.fillStyle = 'rgba(4,10,18,.4)'; g.fill(); cel(g, function (c) { poly(c, [px - 5, wy + 4, px - 5, wy - 46, px + 5, wy - 48, px + 5, wy + 4]); }, '#6a5a50', { k: 2, lw: 2.2, out: '#0c1016', sh: 'rgba(6,8,24,.4)', hi: 'rgba(190,214,255,.25)', inn: function (c) { ln(c, [px - 1, wy - 44, px - 2, wy], 'rgba(20,14,12,.5)', 1); } }); });
      g.save(); g.translate(gx - 44, wy - 8); g.transform(0.72, 0.28, 0, 1, 0, 0);
      [-30, -17, -4].forEach(function (yy) { cel(g, function (c) { poly(c, [0, yy - 3, 84, yy - 3, 84, yy + 3, 0, yy + 3]); }, '#8a7868', { k: 1.2, lw: 1.8, out: '#0c1016', sh: 'rgba(6,8,24,.35)', hi: 'rgba(190,214,255,.25)' }); });
      cel(g, function (c) { poly(c, [4, -2, 10, -2, 80, -28, 74, -28]); }, '#7a6a5c', { k: 1, lw: 1.6, out: '#0c1016' });
      cel(g, function (c) { poly(c, [78, -36, 86, -36, 86, 4, 78, 4]); }, '#7a6a5c', { k: 1, lw: 1.6, out: '#0c1016' });
      g.restore();
    } });
    /* taipa descendo pela esquerda */
    items.push({ y: -999, d: function () { for (let y = wy + 26; y < H + 10; y += 20 + R() * 6) rock(g, A.x0 - 70 + (R() - 0.5) * 8, y, 0.75 + R() * 0.3, ['#747c88', '#848a94', '#666e7a'][Math.floor(R() * 3)], R); } });
    edge(16, function (x, y, s) { macega(g, x, y, s, R); }, 0.8, 1.2, function (x, y) { return y > wy + 30 && x > A.x0 - 40; });
    edge(8, function (x, y, s) { rock(g, x, y, s, '#6c7480', R); }, 0.6, 1, function (x, y) { return y > wy + 20; });
  } else {
    /* ---- sanga no alto, figueira no canto de cima à direita ---- */
    const p1 = R() * 6, p2 = R() * 6, sy = function (x) { return (70 + 12 * Math.sin(x * 0.006 + p1) + 6 * Math.sin(x * 0.017 + p2)) * ky; };
    const band = function (o0, o1, fill) { g.beginPath(); for (let x = -10; x <= W + 10; x += 16) g[x < -9 ? 'moveTo' : 'lineTo'](x, sy(x) + o0); for (let x = W + 10; x >= -10; x -= 16) g.lineTo(x, sy(x) + o1); g.closePath(); g.fillStyle = fill; g.fill(); };
    /* barrancos de terra e a água com o luar */
    band(-44, 46, 'rgba(12,20,26,.35)'); band(-38, 40, '#3a3e40'); band(-32, 34, '#26303a');
    q = g.createLinearGradient(0, 40 * ky, 0, 110 * ky); q.addColorStop(0, '#16304a'); q.addColorStop(0.5, '#2a4c66'); q.addColorStop(1, '#1c3a56'); band(-26, 28, q);
    for (let j = 0; j < 46; j++) { const x = R() * W, y = sy(x) - 18 + R() * 40, l = 12 + R() * 26; ln(g, [x, y, x + l, y], 'rgba(200,226,255,' + (0.14 + R() * 0.3) + ')', 1.4); }
    /* reflexo da lua na água */
    for (let j = 0; j < 9; j++) { const x = W * 0.62 + (R() - 0.5) * 30, y = sy(W * 0.62) - 16 + j * 4; ln(g, [x - 24 + Math.abs(j - 4) * 4, y, x + 24 - Math.abs(j - 4) * 4, y], 'rgba(235,244,255,.6)', 1.8); }
    /* raízes da figueira saindo do canto de cima, à direita */
    const fx = A.x1 + 60, fy = A.y0 - 20;
    for (let j = 0; j < 7; j++) { const an = PI + 0.1 - j * 0.24 + (R() - 0.5) * 0.1, l = 90 + R() * 70, wd = 9 - j * 0.6; items.push({ y: -900 + j, d: function () {
      const ex = fx + Math.cos(an) * l, ey = fy + Math.sin(an) * l * 0.8, mx = fx + Math.cos(an - 0.2) * l * 0.5, my = fy + Math.sin(an - 0.2) * l * 0.4;
      g.beginPath(); g.moveTo(fx, fy); g.quadraticCurveTo(mx, my, ex, ey); g.lineCap = 'round'; g.strokeStyle = '#0c1016'; g.lineWidth = wd + 3; g.stroke(); g.strokeStyle = '#5a5654'; g.lineWidth = wd; g.stroke(); g.strokeStyle = 'rgba(190,214,255,.18)'; g.lineWidth = wd * 0.3; g.save(); g.translate(-1, -2); g.stroke(); g.restore();
    } }); }
    items.push({ y: -800, d: function () { cel(g, function (c) { el(c, fx, fy, 56, 40); }, '#5a5654', { k: 6, lw: 3, out: '#0c1016', sh: 'rgba(6,8,24,.4)', hi: 'rgba(190,214,255,.2)', inn: function (c) { for (let j = 0; j < 6; j++) { c.beginPath(); c.arc(fx, fy, 10 + j * 8, 0.2, 1.6); c.strokeStyle = 'rgba(20,16,20,.4)'; c.lineWidth = 1.4; c.stroke(); } } }); } });
    /* folhas caídas da figueira e pedrinhas */
    for (let j = 0; j < 40; j++) { const x = A.x0 + aw * 0.5 + R() * aw * 0.5, y = A.y0 + R() * ah * 0.5; g.save(); g.translate(x, y); g.rotate(R() * 6); g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, TAU); g.fillStyle = j % 2 ? 'rgba(70,100,70,.5)' : 'rgba(100,110,70,.4)'; g.fill(); g.restore(); }
    for (let j = 0; j < 10; j++) { const p = inA(); flat(g, R, p[0], p[1], 0.5 + R() * 0.5, '#5e6672'); }
    /* juncos e pedras na beira da sanga */
    for (let j = 0; j < 12; j++) { const x = 30 + R() * (W - 260), y = sy(x) + (j % 2 ? 38 : -30); items.push({ y: y, d: function () { macega(g, x, y, 0.8 + R() * 0.3, R, ['#2c4a40', '#3a5a4a', '#4e7660', '#a8d0c0']); } }); }
    edge(16, function (x, y, s) { macega(g, x, y, s, R); }, 0.8, 1.2, function (x, y) { return Math.abs(y - sy(x)) > 50 && Math.hypot(x - fx, y - fy) > 70; });
    edge(6, function (x, y, s) { rock(g, x, y, s, '#6c7480', R); }, 0.6, 1, function (x, y) { return Math.abs(y - sy(x)) > 46 && Math.hypot(x - fx, y - fy) > 70; });
  }
  /* grama baixa por toda parte e flores */
  for (let j = 0; j < 1300; j++) { const x = R() * W, y = R() * H; tuft(g, x, y, 0.8 + R() * 0.5, R() < 0.5 ? 'rgba(20,38,42,.55)' : 'rgba(70,104,104,.45)', 'rgba(170,206,220,.5)'); }
  for (let j = 0; j < 500; j++) dot(g, R() * W, R() * H, 0.7 + R() * 1, R() < 0.6 ? 'rgba(12,24,30,.35)' : 'rgba(170,200,214,.22)');
  for (let j = 0; j < 40; j++) { const p = inA(); flower(g, p[0], p[1], 0.8 + R() * 0.4); }
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  moonlight(g, W, H, 0.12);
  /* escurece fora da área jogável */
  q = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(4,8,20,.55)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* ---------------- moldura ---------------- */
function figLeaves(g, R, x, y, r, n) {
  const L = [];
  for (let k = 0; k < n; k++) L.push({ x: x + (R() - 0.5) * r * 2, y: y + (R() - 0.5) * r * 1.4, r: r * (0.35 + R() * 0.3) });
  g.fillStyle = 'rgba(2,6,14,.35)'; L.forEach(function (o) { g.beginPath(); g.arc(o.x + 16, o.y + 22, o.r, 0, TAU); g.fill(); });
  g.fillStyle = '#05090e'; L.forEach(function (o) { g.beginPath(); g.arc(o.x, o.y, o.r + 2.6, 0, TAU); g.fill(); });
  [['#13242a', 0, 0, 1], ['#1c3434', -0.14, -0.2, 0.78], ['#2a4a46', -0.3, -0.36, 0.5]].forEach(function (p) { g.fillStyle = p[0]; L.forEach(function (o) { g.beginPath(); g.arc(o.x + o.r * p[1], o.y + o.r * p[2], o.r * p[3], 0, TAU); g.fill(); }); });
  /* folhas com borda de luar */
  L.forEach(function (o, m) { for (let k = 0; k < 2; k++) { const a = R() * TAU, lx = o.x + Math.cos(a) * o.r * 0.6, ly = o.y + Math.sin(a) * o.r * 0.6; g.save(); g.translate(lx, ly); g.rotate(a); g.beginPath(); g.ellipse(0, 0, 7, 3.6, 0, 0, TAU); g.fillStyle = '#2f524c'; g.fill(); g.strokeStyle = 'rgba(160,200,220,.35)'; g.lineWidth = 1; g.stroke(); g.restore(); } });
}
function branch(g, x0, y0, x1, y1, bend, w) {
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + bend, x1, y1); g.lineCap = 'round';
  g.save(); g.translate(10, 16); g.strokeStyle = 'rgba(2,6,14,.3)'; g.lineWidth = w; g.stroke(); g.restore();
  g.strokeStyle = '#05090e'; g.lineWidth = w + 4; g.stroke(); g.strokeStyle = '#3a3634'; g.lineWidth = w; g.stroke();
  g.save(); g.translate(-1, -w * 0.25); g.strokeStyle = 'rgba(170,196,230,.25)'; g.lineWidth = w * 0.22; g.stroke(); g.restore();
}
function tallGrass(g, R, x, y, s, ang) {
  for (let j = 0; j < 9; j++) {
    const a = ang + (j - 4) * 0.12 + (R() - 0.5) * 0.1, l = (70 + R() * 50) * s, bx = x + (j - 4) * 5 * s, ex = bx + Math.cos(a) * l, ey = y + Math.sin(a) * l;
    g.beginPath(); g.moveTo(bx - 3 * s, y); g.quadraticCurveTo(bx + Math.cos(a) * l * 0.5 - 6 * s, y + Math.sin(a) * l * 0.5, ex, ey); g.quadraticCurveTo(bx + Math.cos(a) * l * 0.5 + 6 * s, y + Math.sin(a) * l * 0.5, bx + 3 * s, y); g.closePath();
    g.fillStyle = '#05090e'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#05090e'; g.stroke();
    g.save(); g.translate(-1, -1); g.fillStyle = j % 2 ? '#1a2e30' : '#22393a'; g.fill(); g.restore();
    /* pendão do capim-santa-fé */
    if (j % 3 === 0) { for (let k = 0; k < 5; k++) dot(g, ex + Math.cos(a) * k * 2.4, ey + Math.sin(a) * k * 2.4, 2 - k * 0.2, 'rgba(190,206,214,.75)'); }
  }
}
export function paintCanopy(g, W, H, seed) {
  const R = rng(seed || 77);
  /* figueira: galhos grossos entrando pelos cantos de cima */
  branch(g, -30, 150, 260, 20, -40, 26); branch(g, 120, 70, 380, -20, 30, 14); branch(g, -20, 40, 150, -20, 10, 18);
  branch(g, W + 30, 120, W - 240, 10, -30, 22); branch(g, W - 90, 60, W - 330, -20, 20, 12);
  [[60, 30, 90, 10], [230, -10, 70, 8], [380, -40, 60, 6], [10, 160, 70, 7], [W - 60, 40, 90, 10], [W - 250, -20, 70, 8], [W - 400, -46, 50, 5], [W + 10, 190, 60, 6]].forEach(function (q) { figLeaves(g, R, q[0], q[1], q[2], q[3]); });
  /* capim alto pelos lados e embaixo */
  [[-10, H * 0.45, 1, -0.5], [-20, H * 0.75, 1.2, -0.7], [W + 10, H * 0.5, 1, -2.6], [W + 20, H * 0.8, 1.2, -2.4]].forEach(function (q) { tallGrass(g, R, q[0], q[1], q[2], q[3]); });
  /* cerca de arame com moirões ao longo de baixo */
  const posts = []; for (let x = -20; x < W + 60; x += 150) posts.push([x + (R() - 0.5) * 20, H - 6 + (R() - 0.5) * 6]);
  [-58, -36].forEach(function (dy, m) { g.beginPath(); posts.forEach(function (p, i) { if (i) { const pr = posts[i - 1]; g.quadraticCurveTo((pr[0] + p[0]) / 2, (pr[1] + p[1]) / 2 + dy + 8, p[0], p[1] + dy); } else g.moveTo(p[0], p[1] + dy); }); g.strokeStyle = '#05090e'; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(170,190,210,.7)'; g.lineWidth = 1.2; g.stroke(); });
  posts.forEach(function (p) {
    cel(g, function (c) { poly(c, [p[0] - 6, p[1] + 10, p[0] - 5, p[1] - 70, p[0] + 1, p[1] - 74, p[0] + 6, p[1] - 70, p[0] + 6, p[1] + 10]); }, '#3e3834', { k: 2, lw: 2.6, out: '#05090e', sh: 'rgba(2,6,14,.45)', hi: 'rgba(170,196,230,.3)', inn: function (c) { ln(c, [p[0] - 1, p[1] - 66, p[0] - 2, p[1] + 6], 'rgba(10,8,8,.6)', 1.2); } });
  });
  for (let j = 0; j < 9; j++) { const x = 40 + j * (W - 80) / 8 + (R() - 0.5) * 50; tallGrass(g, R, x, H + 30, 0.6 + R() * 0.3, -PI / 2 + (R() - 0.5) * 0.6); }
  [[-10, H + 20, 1.1, -1], [W + 10, H + 20, 1.1, -2.1]].forEach(function (q) { tallGrass(g, R, q[0], q[1], q[2], q[3]); });
  /* vaga-lumes frios e névoa baixa nas bordas */
  for (let j = 0; j < 14; j++) { const side = j % 2, x = side ? W - 20 - R() * 90 : 20 + R() * 90, y = 200 + R() * (H - 300); halo(g, x, y, 8, '200,220,255', 0.5); dot(g, x, y, 1.4, 'rgba(235,244,255,.9)'); }
}

/* ---------------- mapa ---------------- */
function spline(P, step) {
  const out = [], n = P.length;
  if (n < 2) return P.slice();
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (let k = 0; k < m; k++) {
      const t = k / m, t2 = t * t, t3 = t2 * t;
      out.push({ x: 0.5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3), y: 0.5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3) });
    }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y });
  return out;
}
function near(L, x, y) { let m = 1e12; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function strokeL(c, L, col, lw, dash) { if (L.length < 2) return; c.beginPath(); c.moveTo(L[0].x, L[0].y); for (let i = 1; i < L.length; i++) c.lineTo(L[i].x, L[i].y); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.stroke(); if (dash) c.setLineDash([]); }
function norm(L, i) { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; }
function repel(C, P, d) { C.forEach(function (q) { P.forEach(function (p) { let dx = q.x - p.x, dy = q.y - p.y, m = Math.hypot(dx, dy); if (m < d) { if (m < 1) { dx = 1; dy = 0; m = 1; } q.x = p.x + dx / m * d; q.y = p.y + dy / m * d; } }); }); }
function trailOf(P, R, wob) {
  if (P.length < 2) return P.slice();
  const C = [];
  for (let i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { const a = P[i], b = P[i + 1], k = (R() - 0.5) * wob; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * k, y: (a.y + b.y) / 2 + (b.x - a.x) * k }); } }
  return spline(C, 6);
}
function spot(P, W, H, d, margin) {
  const n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1;
  let best = null, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; let s = 240;
    for (let j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    const e = Math.min(x - margin, W - margin - x, y - margin, H - margin - y); if (e < 0) s += e * 8;
    s += (Math.cos(a) * vx + Math.sin(a) * vy) / vm * 40;
    if (s > bs) { bs = s; best = { x: x, y: y }; }
  }
  return best;
}
/* figueira/árvore vista de cima, com sombra para a esquerda-baixo (lua no alto à direita) */
function treeTop(c, x, y, r, R, pal) {
  c.beginPath(); c.ellipse(x - r * 0.4, y + r * 0.45, r * 1.05, r * 0.8, 0, 0, TAU); c.fillStyle = 'rgba(2,8,14,.4)'; c.fill();
  const L = []; const n = 5 + (R() * 3 | 0), a0 = R() * TAU;
  for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; L.push([x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * (0.5 + R() * 0.14)]); }
  L.push([x, y, r * 0.62]);
  const disc = function (grow, dx, dy, k, col) { c.beginPath(); L.forEach(function (q) { const rr = q[2] * k + grow; c.moveTo(q[0] + dx * q[2] + rr, q[1] + dy * q[2]); c.arc(q[0] + dx * q[2], q[1] + dy * q[2], rr, 0, TAU); }); c.fillStyle = col; c.fill(); };
  disc(2.2, 0, 0, 1, '#05090e'); disc(0, 0, 0, 1, pal[0]); disc(0, 0.16, -0.2, 0.74, pal[1]); disc(0, 0.3, -0.34, 0.42, pal[2]);
}
/* tapera: casa abandonada vista de cima, telhado meio caído */
function tapera(c, x, y, s, R) {
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.12);
  c.beginPath(); c.ellipse(-8, 14, 60, 34, 0, 0, TAU); c.fillStyle = 'rgba(2,8,14,.45)'; c.fill();
  halo(c, 0, 0, 90, '185,140,255', 0.22);
  /* paredes de pau a pique */
  cel(c, function (c) { poly(c, [-40, -26, 40, -26, 40, 26, -40, 26]); }, '#5c5250', { k: 3, lw: 2.6, out: '#05090e', sh: 'rgba(6,8,24,.4)', hi: 'rgba(190,214,255,.2)', inn: function (c) {
    c.fillStyle = '#120e16'; c.fillRect(-34, -20, 68, 40);
    /* chão de dentro: tábuas e mato */
    for (let i = 0; i < 6; i++) ln(c, [-30 + i * 11, -18, -32 + i * 11, 18], 'rgba(90,80,90,.4)', 1.2);
    for (let i = 0; i < 5; i++) dot(c, -20 + R() * 40, -10 + R() * 20, 3, 'rgba(60,90,70,.6)');
    halo(c, 6, 4, 26, '185,140,255', 0.35);
  } });
  /* metade do telhado de santa-fé que sobrou, com buracos */
  cel(c, function (c) { c.moveTo(-46, -32); c.lineTo(46, -32); c.lineTo(46, -4); c.lineTo(30, 2); c.lineTo(18, -6); c.lineTo(4, 4); c.lineTo(-10, -4); c.lineTo(-24, 6); c.lineTo(-46, 0); c.closePath(); }, '#8a7a5c', { k: 3, lw: 2.4, out: '#05090e', sh: 'rgba(6,8,24,.45)', hi: 'rgba(200,220,255,.25)', inn: function (c) {
    for (let i = -44; i < 46; i += 4) ln(c, [i, -32, i + 2, 2], 'rgba(60,46,30,.45)', 1);
    ln(c, [-46, -16, 46, -16], 'rgba(40,30,20,.6)', 2);
    c.fillStyle = '#120e16'; c.beginPath(); c.ellipse(12, -22, 7, 4, 0.3, 0, TAU); c.fill();
  } });
  /* caibros soltos sobre o buraco */
  [[-30, 6, -18, 26], [8, 2, 20, 26]].forEach(function (q) { ln(c, q, '#05090e', 4.4); ln(c, q, '#6a5a48', 2.4); });
  /* chaminé de pedra e a porta caída */
  cel(c, function (c) { poly(c, [34, 14, 46, 14, 46, 30, 34, 30]); }, '#6c7480', { k: 1.4, lw: 2, out: '#05090e' });
  c.save(); c.translate(-10, 34); c.rotate(0.5); cel(c, function (c) { poly(c, [-8, -3, 8, -3, 8, 3, -8, 3]); }, '#6a5a48', { k: 1, lw: 1.8, out: '#05090e' }); c.restore();
  /* dois olhos rosa na escuridão */
  dot(c, -4, 12, 1.8, '#ff3d8a'); dot(c, 2, 12, 1.8, '#ff3d8a'); dot(c, -4, 11.6, 0.7, '#ffe0f0'); dot(c, 2, 11.6, 0.7, '#ffe0f0');
  c.restore();
}
function deadTree(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(-14, 18, 30, 10, -0.3, 0, TAU); c.fillStyle = 'rgba(2,8,14,.35)'; c.fill();
  [[0, 0, -30, -14, 4.4], [0, 0, 18, -26, 3.6], [0, 0, 10, 24, 3], [0, 0, -16, 22, 2.6], [-16, -7, -22, -24, 2], [-24, -11, -38, -6, 1.6], [10, -14, 30, -18, 2], [16, -23, 18, -36, 1.4], [6, 14, 18, 22, 1.6], [-10, 14, -12, 30, 1.4]].forEach(function (q) { ln(c, q.slice(0, 4), '#05090e', q[4] + 3); ln(c, q.slice(0, 4), '#4e4846', q[4]); });
  dot(c, 0, 0, 6, '#05090e'); dot(c, 0, 0, 4.4, '#4e4846');
  c.restore();
}
function cow(c, x, y, a, s) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.ellipse(-2, 4, 9, 4, 0, 0, TAU); c.fillStyle = 'rgba(2,8,14,.35)'; c.fill();
  cel(c, function (c) { el(c, 0, 0, 8, 4.6); }, '#7a6a62', { k: 1, lw: 1.6, out: '#05090e', inn: function (c) { dot(c, 2, 1, 2.6, '#d8d2c8'); dot(c, -4, -1.4, 2, '#d8d2c8'); } });
  cel(c, function (c) { el(c, 9.4, 0, 3.2, 2.6); }, '#e0dad0', { k: 0.6, lw: 1.4, out: '#05090e' });
  ln(c, [9, -2.4, 12, -6], '#05090e', 2.4); ln(c, [9, 2.4, 12, 6], '#05090e', 2.4); ln(c, [9, -2.4, 12, -6], '#e8e2d0', 1.2); ln(c, [9, 2.4, 12, 6], '#e8e2d0', 1.2);
  c.restore();
}
export function paintMap(c, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  const W = w / u, H = h / u, P = (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; });
  const R = rng(6606);
  /* fundo: campo à noite, coxilhas iluminadas pela lua */
  let g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#3a5664'); g.addColorStop(0.5, '#2f4a56'); g.addColorStop(1, '#22384a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 16; i++) { const x = R() * W, y = R() * H, r = 120 + R() * 160; let q = c.createRadialGradient(x + r * 0.25, y - r * 0.25, r * 0.1, x, y, r); q.addColorStop(0, 'rgba(150,186,200,.16)'); q.addColorStop(0.7, 'rgba(150,186,200,.05)'); q.addColorStop(1, 'rgba(10,20,30,.12)'); c.fillStyle = q; c.beginPath(); c.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); c.fill(); }
  for (let i = 0; i < 60; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 40 + R() * 100, 20 + R() * 40, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(90,130,120,.08)' : 'rgba(8,20,28,.12)'; c.fill(); }
  /* a lua: canto mais longe das fases */
  const corners = [{ x: W - 40, y: 40 }, { x: 40, y: 40 }, { x: W - 40, y: H - 40 }, { x: 40, y: H - 40 }];
  let moon = corners[0], md = -1; corners.forEach(function (q) { const d = P.length ? near(P, q.x, q.y) : 1e9; if (d > md + 40) { md = d; moon = q; } });
  const last = P[P.length - 1] || { x: W * 0.8, y: H * 0.7 };
  /* sanga */
  const SG = [{ x: -0.06, y: 0.38 }, { x: 0.14, y: 0.42 }, { x: 0.3, y: 0.58 }, { x: 0.46, y: 0.5 }, { x: 0.6, y: 0.4 }, { x: 0.78, y: 0.52 }, { x: 0.9, y: 0.64 }, { x: 1.06, y: 0.6 }].map(function (q) { return { x: q.x * W, y: q.y * H }; });
  repel(SG.slice(1, -1), P, 86);
  const sanga = spline(SG, 8), trail = trailOf(P, R, 0.22), lair = P.length ? spot(P, W, H, 120, 110) : { x: W * 0.85, y: H * 0.7 };
  /* mata ciliar escura nas margens */
  for (let i = 2; i < sanga.length; i += 3) for (let s = -1; s < 2; s += 2) { const n0 = norm(sanga, i), d0 = 14 + R() * 24, x = sanga[i].x + n0.x * d0 * s, y = sanga[i].y + n0.y * d0 * s; if (near(P, x, y) > 60) { c.beginPath(); c.ellipse(x, y, 18 + R() * 14, 12 + R() * 8, R() * 3, 0, TAU); c.fillStyle = 'rgba(14,34,36,.45)'; c.fill(); } }
  strokeL(c, sanga, '#0e1e28', 22); strokeL(c, sanga, '#2a5272', 16); strokeL(c, sanga, '#3c6e92', 8);
  c.beginPath(); for (let i = 3; i < sanga.length - 4; i += 9) { c.moveTo(sanga[i].x, sanga[i].y - 2); c.lineTo(sanga[i + 3].x, sanga[i + 3].y - 2); } c.strokeStyle = 'rgba(220,236,255,.5)'; c.lineWidth = 1.6; c.stroke();
  /* textura de capim */
  for (let i = 0; i < 1400; i++) { const x = R() * W, y = R() * H, l = 3 + R() * 4; ln(c, [x, y, x + (R() - 0.5) * 2, y - l], R() < 0.5 ? 'rgba(10,24,30,.3)' : 'rgba(150,190,200,.16)', 1.2); }
  /* clareiras das fases */
  P.forEach(function (p) { [[74, 56, 'rgba(150,186,190,.14)'], [56, 42, 'rgba(170,200,200,.14)'], [40, 30, 'rgba(190,214,210,.12)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); }); });
  /* taipas: muros de pedra cortando o campo */
  const walls = [];
  for (let i = 0; i < 7; i++) { const x0 = R() * W, y0 = R() * H, a = R() * PI, l = 160 + R() * 220; walls.push([x0, y0, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l]); }
  walls.forEach(function (wl) {
    const n = Math.floor(Math.hypot(wl[2] - wl[0], wl[3] - wl[1]) / 9);
    for (let k = 0; k <= n; k++) { const t = k / n, x = wl[0] + (wl[2] - wl[0]) * t, y = wl[1] + (wl[3] - wl[1]) * t; if (near(P, x, y) < 62 || near(trail, x, y) < 22 || near(sanga, x, y) < 16 || Math.hypot(x - lair.x, y - lair.y) < 80 || Math.hypot(x - moon.x, y - moon.y) < 200) continue; c.beginPath(); c.ellipse(x + 1.6, y + 2, 5.4, 4, 0, 0, TAU); c.fillStyle = '#0a1016'; c.fill(); c.beginPath(); c.ellipse(x, y, 4.6, 3.6, R(), 0, TAU); c.fillStyle = k % 2 ? '#8a929c' : '#767e8a'; c.fill(); dot(c, x - 1.2, y - 1.2, 1.4, 'rgba(220,234,255,.45)'); }
  });
  /* trilha */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(6,14,20,.4)', 24); strokeL(c, trail, '#4e5250', 16); strokeL(c, trail, '#8a8c84', 11.5);
    c.save(); c.translate(1, -1.2); strokeL(c, trail, 'rgba(200,214,220,.5)', 3.6); c.restore();
    strokeL(c, trail, 'rgba(50,52,50,.5)', 2, [3, 14]);
    /* pinguela sobre a sanga */
    for (let i = 0; i < trail.length; i += 2) if (near(sanga, trail[i].x, trail[i].y) < 10) { const n0 = norm(trail, i); ln(c, [trail[i].x - n0.x * 10, trail[i].y - n0.y * 10, trail[i].x + n0.x * 10, trail[i].y + n0.y * 10], '#05090e', 4.6); ln(c, [trail[i].x - n0.x * 10, trail[i].y - n0.y * 10, trail[i].x + n0.x * 10, trail[i].y + n0.y * 10], '#8a7a62', 2.6); }
  }
  /* árvores: figueiras solitárias e capões */
  const PAL = [['#1c3432', '#28463f', '#3e6658'], ['#1a302e', '#244038', '#365c50'], ['#213a36', '#2e4c44', '#46705e']];
  const TR = [];
  for (let i = 0; i < 70; i++) {
    const cx = R() * W, cy = R() * H, grp = R() < 0.4 ? 4 + (R() * 4 | 0) : 1;
    for (let k = 0; k < grp; k++) { const x = cx + (R() - 0.5) * 60 * (grp > 1 ? 1 : 0), y = cy + (R() - 0.5) * 40 * (grp > 1 ? 1 : 0), r = grp > 1 ? 11 + R() * 8 : 15 + R() * 10; if (near(P, x, y) < 58 + r || near(trail, x, y) < 12 + r || near(sanga, x, y) < 10 + r * 0.6 || Math.hypot(x - lair.x, y - lair.y) < 90 || Math.hypot(x - moon.x, y - moon.y) < 190) continue; TR.push([x, y, r]); }
  }
  /* gado pastando */
  const COWS = [];
  for (let i = 0; i < 14; i++) { const x = (i % 3 ? COWS.length ? COWS[COWS.length - 1][0] + (R() - 0.5) * 50 : R() * W : R() * W), y = (i % 3 ? COWS.length ? COWS[COWS.length - 1][1] + (R() - 0.5) * 36 : R() * H : R() * H); if (near(P, x, y) > 70 && near(trail, x, y) > 24 && near(sanga, x, y) > 24 && near(TR.map(function (q) { return { x: q[0], y: q[1] }; }), x, y) > 30 && Math.hypot(x - moon.x, y - moon.y) > 200 && x > 30 && y > 30 && x < W - 30 && y < H - 30) COWS.push([x, y, R() * TAU]); }
  COWS.forEach(function (q) { cow(c, q[0], q[1], q[2], 1.3); });
  TR.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (q) { treeTop(c, q[0], q[1], q[2], R, PAL[(q[0] * 7 | 0) % 3]); });
  /* a tapera do Lobisomem, perto da última fase */
  deadTree(c, lair.x + 74, lair.y - 52, 1.15);
  tapera(c, lair.x, lair.y, 1.2, R);
  /* rastro de pegadas de lobo saindo da tapera */
  for (let k = 0; k < 6; k++) { const t = k / 6, x = lair.x + (last.x - lair.x) * t * 0.8 + (k % 2 ? 4 : -4), y = lair.y + (last.y - lair.y) * t * 0.8; if (near(P, x, y) < 40) continue; dot(c, x, y, 2.4, 'rgba(10,14,22,.7)'); for (let m = 0; m < 3; m++) dot(c, x - 2.4 + m * 2.4, y - 3.4, 1, 'rgba(10,14,22,.7)'); }
  /* névoa e vinheta */
  for (let i = 0; i < 8; i++) { const x = R() * W, y = R() * H; let q = c.createRadialGradient(x, y, 10, x, y, 160); q.addColorStop(0, 'rgba(200,214,240,.07)'); q.addColorStop(1, 'rgba(200,214,240,0)'); c.fillStyle = q; c.fillRect(x - 160, y - 160, 320, 320); }
  g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.hypot(W, H) * 0.56); g.addColorStop(0, 'rgba(4,8,20,0)'); g.addColorStop(1, 'rgba(4,8,20,.8)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* lua grande no canto */
  const mr = 150;
  halo(c, moon.x, moon.y, mr * 2.6, '190,214,255', 0.35);
  halo(c, moon.x, moon.y, mr * 1.5, '230,240,255', 0.35);
  c.beginPath(); c.arc(moon.x, moon.y, mr, 0, TAU); g = c.createRadialGradient(moon.x - mr * 0.3, moon.y - mr * 0.3, mr * 0.1, moon.x, moon.y, mr); g.addColorStop(0, '#fbfaf2'); g.addColorStop(0.8, '#e2e4ea'); g.addColorStop(1, '#c6cad8'); c.fillStyle = g; c.fill();
  c.save(); c.beginPath(); c.arc(moon.x, moon.y, mr, 0, TAU); c.clip();
  [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.42, 0.12], [0.4, -0.4, 0.1], [-0.5, 0.3, 0.08], [0.1, -0.55, 0.07]].forEach(function (q) { c.beginPath(); c.arc(moon.x + q[0] * mr, moon.y + q[1] * mr, q[2] * mr, 0, TAU); c.fillStyle = 'rgba(150,156,176,.35)'; c.fill(); c.beginPath(); c.arc(moon.x + q[0] * mr + 2, moon.y + q[1] * mr + 2, q[2] * mr * 0.8, 0, TAU); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill(); });
  c.restore();
  c.beginPath(); c.arc(moon.x, moon.y, mr, 0, TAU); c.strokeStyle = 'rgba(40,50,80,.5)'; c.lineWidth = 3; c.stroke();
  c.restore();
}
