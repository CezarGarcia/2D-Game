// @ts-nocheck
/* Cenário do Capítulo 7, Pantanal da Cuca: chão das arenas (3 variações), moldura por cima e mapa do capítulo.
   Tudo determinístico pela semente. A área jogável (x 120–1160, y 150–640 em 1280×720) só recebe detalhe de chão. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, rng, VEN, MAG } from './ch7_lib';

const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };

/* ---------------- peças ---------------- */
function blobShape(R, n, jit) { const r = []; for (let i = 0; i < n; i++) r.push(1 - jit + R() * jit * 2); return r; }
function blobPath(g, x, y, rx, ry, rot, r, k) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot); k = k == null ? 1 : k;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i] * k, py = Math.sin(a) * ry * r[i] * k; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
function sheet(g, R, x, y, rx, ry, fill, halo, edge) {
  const r = blobShape(R, 11, 0.24), rot = R() * 0.5 - 0.25;
  if (halo) { g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1.1); g.fillStyle = halo; g.fill(); }
  g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1); g.fillStyle = fill; g.fill();
  if (edge) { g.save(); g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1); g.clip(); g.beginPath(); blobPath(g, x + 2, y + 3, rx, ry, rot, r, 1); g.strokeStyle = edge; g.lineWidth = 3; g.stroke(); g.restore(); }
}
function ripple(g, x, y, s, col, n) { for (let i = 0; i < (n || 2); i++) { g.beginPath(); g.ellipse(x, y, (9 + i * 8) * s, (4 + i * 3.4) * s, 0, 0.4 + i * 0.9, 2.6 + i * 1.3); g.strokeStyle = col; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke(); } }
/* capim submerso: risquinhos no fundo (detalhe de chão) */
function sunkGrass(g, x, y, s, col) { for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.22, l = (7 + (i % 3) * 3) * s; ln(g, [x + i * 1.6 * s, y, x + i * 1.6 * s + Math.cos(a) * l, y + Math.sin(a) * l * 0.7], col, 1.3); } }
/* lentilha d'água */
function duckweed(g, R, x, y, r) { for (let i = 0; i < 26; i++) { const a = R() * TAU, d = Math.sqrt(R()) * r; dot(g, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 1 + R() * 1.6, R() < 0.5 ? 'rgba(140,200,90,.75)' : 'rgba(110,170,70,.7)'); } }
/* aguapé visto de cima: roseta de folhas redondas e lustrosas, às vezes com a espiga lilás */
function aguape(g, R, x, y, s, flower, glow) {
  g.beginPath(); g.ellipse(x + 3 * s, y + 4 * s, 20 * s, 9 * s, 0, 0, TAU); g.fillStyle = 'rgba(6,24,20,.3)'; g.fill();
  const n = 6 + Math.floor(R() * 3), a0 = R() * TAU;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU, d = 8 * s, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.7;
    cel(g, function (c) { el(c, lx, ly, 7.4 * s, 5.6 * s, a); }, i % 2 ? '#4f9a46' : '#5eae4e', { k: 1.4 * s, lw: 1.8, sh: 'rgba(8,50,30,.36)', hi: 'rgba(230,255,190,.3)', inn: function (c) { ln(c, [lx - Math.cos(a) * 5 * s, ly - Math.sin(a) * 3.4 * s, lx + Math.cos(a) * 4 * s, ly + Math.sin(a) * 2.6 * s], 'rgba(20,70,36,.45)', 1); } });
  }
  cel(g, function (c) { el(c, x, y, 5 * s, 3.6 * s); }, '#6cbf58', { k: 1, lw: 1.5 });
  if (flower) {
    for (let j = 0; j < 7; j++) { const fx = x + (j % 3 - 1) * 3.2 * s, fy = y - 2 * s - Math.floor(j / 3) * 3.4 * s; cel(g, function (c) { for (let m = 0; m < 6; m++) { const b = (m / 6) * TAU; el(c, fx + Math.cos(b) * 1.9 * s, fy + Math.sin(b) * 1.9 * s, 1.7 * s, 1.1 * s, b); } }, j % 2 ? '#c9a2f2' : '#b48ae6', { k: 0.4, lw: 1.1 }); dot(g, fx, fy, 0.9 * s, '#ffd23f'); }
  }
  if (glow) { const q = g.createRadialGradient(x, y, 1, x, y, 30 * s); q.addColorStop(0, 'rgba(255,79,200,.32)'); q.addColorStop(1, 'rgba(255,79,200,0)'); g.fillStyle = q; g.fillRect(x - 30 * s, y - 30 * s, 60 * s, 60 * s); }
}
/* touceira de capim alto / taboa (só fora da área de jogo) */
function reed(g, x, y, s, R, dry) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 18 * s, 5 * s, 0, 0, TAU); g.fillStyle = 'rgba(8,22,16,.3)'; g.fill();
  const n = 10;
  for (let j = 0; j < n; j++) {
    const an = -1.57 + (j - (n - 1) / 2) * 0.17 + (R() - 0.5) * 0.12, l = (30 + R() * 26) * s, bx = x + (j - (n - 1) / 2) * 2.2 * s, ex = bx + Math.cos(an) * l + (R() - 0.5) * 8 * s, ey = y + Math.sin(an) * l;
    g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + Math.cos(an) * l * 0.5, y + Math.sin(an) * l * 0.62, ex, ey); g.lineCap = 'round';
    g.strokeStyle = '#102a1c'; g.lineWidth = 4.6 * s; g.stroke(); g.strokeStyle = dry ? (j % 3 === 0 ? '#c9b25a' : j % 3 === 1 ? '#a8954a' : '#7f9a48') : (j % 3 === 0 ? '#86b452' : j % 3 === 1 ? '#5a9244' : '#407a3a'); g.lineWidth = 2.3 * s; g.stroke();
    if (j % 4 === 1) cel(g, function (c) { cap(c, ex, ey + 9 * s, ex + Math.cos(an) * 2 * s, ey + 1 * s, 2.4 * s); }, '#6a4326', { k: 0.8, lw: 1.6 });
  }
}
/* ilhota de terra com capim na beira */
function islet(g, R, x, y, rx, ry) {
  const r = blobShape(R, 12, 0.18), rot = R() * 0.4 - 0.2;
  g.beginPath(); blobPath(g, x + 5, y + 8, rx, ry, rot, r, 1.04); g.fillStyle = 'rgba(6,24,20,.35)'; g.fill();
  g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1.12); g.fillStyle = 'rgba(200,226,210,.25)'; g.fill();
  cel(g, function (c) { blobPath(c, x, y, rx, ry, rot, r, 1); }, '#8a7148', { k: 4, lw: 2.4, sh: 'rgba(40,24,10,.35)', hi: 'rgba(255,236,190,.22)', inn: function (c) {
    c.beginPath(); blobPath(c, x - rx * 0.06, y - ry * 0.1, rx * 0.8, ry * 0.76, rot, r, 1); c.fillStyle = '#6f8a44'; c.fill();
    for (let i = 0; i < 26; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 0.7; ln(c, [x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, x + Math.cos(a) * rx * d + 2, y + Math.sin(a) * ry * d - 5], 'rgba(40,70,30,.6)', 1.3); }
  } });
}
/* ninho de tuiuiú visto de cima, no alto de um toco */
function nest(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 10 * s, y + 12 * s, 34 * s, 16 * s, 0, 0, TAU); g.fillStyle = 'rgba(6,20,16,.35)'; g.fill();
  for (let i = 0; i < 46; i++) { const a = R() * TAU, r0 = (14 + R() * 10) * s, l = (8 + R() * 10) * s, b = a + PI / 2 + (R() - 0.5) * 0.8; const px = x + Math.cos(a) * r0, py = y + Math.sin(a) * r0 * 0.78; ln(g, [px - Math.cos(b) * l / 2, py - Math.sin(b) * l / 2, px + Math.cos(b) * l / 2, py + Math.sin(b) * l / 2], OUT, 3.4 * s); ln(g, [px - Math.cos(b) * l / 2, py - Math.sin(b) * l / 2, px + Math.cos(b) * l / 2, py + Math.sin(b) * l / 2], i % 3 ? '#8a6a44' : '#a8845a', 1.8 * s); }
  g.beginPath(); g.ellipse(x, y, 14 * s, 10.6 * s, 0, 0, TAU); g.fillStyle = '#4a3420'; g.fill();
  [[-4, -1], [3, 2], [1, -4]].forEach(function (q) { cel(g, function (c) { el(c, x + q[0] * s, y + q[1] * s, 3.4 * s, 2.6 * s, 0.4); }, '#f2efe4', { k: 0.6, lw: 1.3 }); });
  /* filhote de tuiuiú olhando para cima */
  cel(g, function (c) { el(c, x + 7 * s, y + 4 * s, 4 * s, 3.4 * s); }, '#e9e6dc', { k: 0.8, lw: 1.4 }); cel(g, function (c) { el(c, x + 9 * s, y + 1 * s, 2.4 * s, 2.2 * s); }, '#2a262c', { k: 0, lw: 1.2 });
}
/* tronco de piúva de pé, saindo para cima da tela */
function trunk(g, x, y, s) {
  const T = Math.max(220 * s, y + 30);
  g.beginPath(); g.ellipse(x + 26 * s, y + 4 * s, 56 * s, 14 * s, 0.08, 0, TAU); g.fillStyle = 'rgba(6,16,14,.36)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 26 * s, y + 2 * s); c.quadraticCurveTo(x - 12 * s, y - 6 * s, x - 11 * s, y - 40 * s); c.lineTo(x - 10 * s, y - T); c.lineTo(x + 10 * s, y - T); c.lineTo(x + 11 * s, y - 40 * s); c.quadraticCurveTo(x + 13 * s, y - 6 * s, x + 28 * s, y + 1 * s); c.quadraticCurveTo(x, y + 8 * s, x - 26 * s, y + 2 * s); c.closePath(); }, '#5a4636', { k: 3, lw: 2.6, inn: function (c) {
    [-6, -1, 5].forEach(function (d) { c.beginPath(); c.moveTo(x + d * s, y - T); c.bezierCurveTo(x + (d + 2) * s, y - 120 * s, x + (d - 2) * s, y - 50 * s, x + d * 2 * s, y); c.strokeStyle = 'rgba(18,10,8,.5)'; c.lineWidth = 1.2; c.stroke(); });
    c.fillStyle = 'rgba(14,26,24,.38)'; c.fillRect(x - 40 * s, y - 20 * s, 80 * s, 30 * s); c.fillStyle = 'rgba(210,200,160,.16)'; c.fillRect(x - 40 * s, y - 23 * s, 80 * s, 3 * s);
  } });
  g.beginPath(); g.ellipse(x, y + 2 * s, 34 * s, 7 * s, 0, 0.15, 3); g.strokeStyle = 'rgba(214,236,226,.34)'; g.lineWidth = 1.6; g.lineCap = 'round'; g.stroke();
}
function fog(g, x, y, r, rgb, a) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)'); g.save(); g.translate(x, y); g.scale(1, 0.5); g.translate(-x, -y); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }

/** Chão da arena: 0 lâmina d'água com aguapés, 1 ilhotas e ninhos de tuiuiú, 2 névoa de feitiço. */
export function paintPantanalGround(g, W, H, a, seed) {
  const v = (((a | 0) % 3) + 3) % 3, R = rng((seed || 31) + v * 7919);
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky }, aw = A.x1 - A.x0, ah = A.y1 - A.y0;
  const inA = function () { return [A.x0 + 50 + R() * (aw - 100), A.y0 + 40 + R() * (ah - 80)]; };
  const BASE = [['#6e9a78', '#4e7f68', '#22463e'], ['#7d8f62', '#5f7650', '#2c3e2c'], ['#4f6266', '#3c4e58', '#1a2230']][v];
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
  /* manchas de fundo */
  for (let j = 0; j < 34; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 60 + R() * 120, 24 + R() * 44, R() * 3, 0, TAU); g.fillStyle = j % 2 ? 'rgba(10,30,26,.12)' : 'rgba(170,190,140,.08)'; g.fill(); }
  if (v === 0) {
    /* fundo de lodo aparecendo sob a lâmina d'água */
    for (let j = 0; j < 10; j++) { const p = inA(); sheet(g, R, p[0], p[1], 70 + R() * 110, 24 + R() * 36, 'rgba(150,130,84,.22)', null, 'rgba(240,230,190,.12)'); }
    for (let j = 0; j < 7; j++) { const p = inA(); sheet(g, R, p[0], p[1], 50 + R() * 80, 18 + R() * 28, 'rgba(18,60,56,.22)', null, null); }
    for (let j = 0; j < 70; j++) sunkGrass(g, R() * W, R() * H, 0.8 + R() * 0.6, 'rgba(40,80,50,.45)');
    for (let j = 0; j < 22; j++) { const p = inA(); ripple(g, p[0], p[1], 0.8 + R() * 0.8, 'rgba(226,248,240,.2)', 2); }
    for (let j = 0; j < 12; j++) { const p = inA(); duckweed(g, R, p[0], p[1], 14 + R() * 18); }
    /* reflexo do céu */
    for (let j = 0; j < 90; j++) { const x = R() * W, y = R() * H, l = 18 + R() * 30, ph = R() * 6; g.beginPath(); for (let i = 0; i <= 6; i++) { const u = i / 6; g[i ? 'lineTo' : 'moveTo'](x + u * l, y + Math.sin(ph + u * 6) * 2.6); } g.strokeStyle = 'rgba(220,246,240,.1)'; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke(); }
    for (let j = 0; j < 260; j++) dot(g, R() * W, R() * H, 0.7 + R() * 1.1, R() < 0.5 ? 'rgba(20,46,40,.3)' : 'rgba(230,250,240,.22)');
    /* aguapés pequenos dentro (rasos, só chão) e touceiras grandes nas bordas */
    for (let j = 0; j < 7; j++) { const p = inA(), s = 0.55 + R() * 0.25; aguape(g, R, p[0], p[1], s, false); }
    edge(26, function (x, y, s) { aguape(g, R, x, y, s, R() < 0.45); }, 0.9, 1.5);
    edge(14, function (x, y, s) { reed(g, x, y, s, R); }, 0.9, 1.3);
    [[A.x0 - 56, A.y0 + 40, 1.15], [A.x1 + 60, A.y1 - 30, 1.2]].forEach(function (t) { items.push({ y: t[1], d: function () { trunk(g, t[0], t[1], t[2]); } }); });
  } else if (v === 1) {
    /* ilhotas de terra; dentro, só lodo raso e marcas */
    for (let j = 0; j < 9; j++) { const p = inA(); sheet(g, R, p[0], p[1], 80 + R() * 120, 26 + R() * 40, 'rgba(150,118,70,.32)', 'rgba(30,40,24,.14)', 'rgba(240,220,170,.16)'); }
    for (let j = 0; j < 6; j++) { const p = inA(); sheet(g, R, p[0], p[1], 50 + R() * 70, 18 + R() * 26, 'rgba(40,90,80,.3)', null, 'rgba(220,246,240,.18)'); ripple(g, p[0], p[1], 0.9, 'rgba(226,248,240,.2)', 2); }
    /* rachaduras no lodo seco e pegadas de bicho */
    for (let j = 0; j < 30; j++) { let x = R() * W, y = R() * H, an = R() * TAU; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 4; i++) { an += (R() - 0.5) * 1.4; x += Math.cos(an) * 12; y += Math.sin(an) * 8; g.lineTo(x, y); } g.strokeStyle = 'rgba(60,44,24,.32)'; g.lineWidth = 1.3; g.stroke(); }
    for (let j = 0; j < 4; j++) { let x = A.x0 + R() * aw, y = A.y0 + R() * ah; const an = R() * TAU; for (let i = 0; i < 7; i++) { x += Math.cos(an) * 26; y += Math.sin(an) * 16; [-0.5, 0, 0.5].forEach(function (d) { ln(g, [x, y, x + Math.cos(an + d) * 7, y + Math.sin(an + d) * 5], 'rgba(50,36,20,.4)', 1.6); }); } }
    for (let j = 0; j < 50; j++) sunkGrass(g, R() * W, R() * H, 0.8 + R() * 0.6, 'rgba(60,80,40,.45)');
    for (let j = 0; j < 320; j++) dot(g, R() * W, R() * H, 0.7 + R() * 1.1, R() < 0.55 ? 'rgba(50,36,20,.3)' : 'rgba(255,240,200,.2)');
    for (let j = 0; j < 20; j++) { const x = R() * W, y = R() * H, a2 = R() * 3, l = 8 + R() * 12; ln(g, [x, y, x + Math.cos(a2) * l, y + Math.sin(a2) * l * 0.6], 'rgba(30,20,12,.7)', 3.2); ln(g, [x, y, x + Math.cos(a2) * l, y + Math.sin(a2) * l * 0.6], '#7a5c3c', 1.6); }
    /* ilhotas com ninhos nas bordas */
    [[W * 0.3, 72, 120, 52, 1], [W * 0.7, 66, 130, 56, 1], [-10, H * 0.5, 110, 90, 1], [W + 10, H * 0.6, 110, 90, 1], [A.x1 + 64, A.y1 + 40, 120, 60, 0], [A.x0 - 50, A.y1 + 46, 120, 60, 0]].forEach(function (t, n) {
      items.push({ y: t[1] - 300, d: function () { islet(g, R, t[0], t[1], t[2], t[3]); } });
      if (t[4]) { const nx = t[0] + (t[0] < 60 ? 46 : t[0] > W - 60 ? -46 : 0); items.push({ y: t[1] + 5, d: function () { cel(g, function (c) { el(c, nx + 3, t[1] + 4, 22, 14); }, '#5a4636', { k: 2, lw: 2.2, inn: function (c) { c.beginPath(); c.ellipse(nx + 3, t[1] + 4, 14, 8, 0, 0, TAU); c.strokeStyle = 'rgba(20,10,6,.4)'; c.lineWidth = 1.2; c.stroke(); } }); nest(g, R, nx, t[1] - 4, 1.25); } }); }
    });
    edge(16, function (x, y, s) { reed(g, x, y, s, R, R() < 0.5); }, 0.9, 1.3);
    edge(12, function (x, y, s) { aguape(g, R, x, y, s, R() < 0.35); }, 0.8, 1.2);
  } else {
    /* água escura com névoa de feitiço magenta e verde rente ao chão */
    for (let j = 0; j < 8; j++) { const p = inA(); sheet(g, R, p[0], p[1], 70 + R() * 110, 24 + R() * 36, 'rgba(120,96,120,.16)', null, 'rgba(240,200,240,.1)'); }
    for (let j = 0; j < 60; j++) sunkGrass(g, R() * W, R() * H, 0.8 + R() * 0.6, 'rgba(20,30,40,.5)');
    for (let j = 0; j < 220; j++) dot(g, R() * W, R() * H, 0.7 + R() * 1.1, R() < 0.5 ? 'rgba(10,14,24,.35)' : 'rgba(230,220,250,.18)');
    for (let j = 0; j < 16; j++) { const p = inA(); ripple(g, p[0], p[1], 0.9 + R() * 0.7, 'rgba(240,200,250,.2)', 2); }
    /* fios de névoa */
    for (let j = 0; j < 26; j++) { const x = R() * W, y = R() * H, m = R() < 0.5; fog(g, x, y, 90 + R() * 130, m ? '255,79,200' : '124,252,154', m ? 0.2 : 0.16); }
    for (let j = 0; j < 22; j++) { const x = R() * W, y = R() * H, l = 80 + R() * 120, m = j % 2; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + l * 0.3, y - 14, x + l * 0.6, y + 14, x + l, y); g.strokeStyle = m ? 'rgba(255,140,230,.12)' : 'rgba(150,255,190,.11)'; g.lineWidth = 14 + R() * 10; g.lineCap = 'round'; g.stroke(); }
    /* círculos de feitiço apagados no lodo */
    for (let j = 0; j < 3; j++) { const p = inA(), r = 40 + R() * 26; g.beginPath(); g.ellipse(p[0], p[1], r, r * 0.55, 0, 0, TAU); g.strokeStyle = 'rgba(255,120,220,.22)'; g.lineWidth = 2.4; g.stroke(); g.beginPath(); g.ellipse(p[0], p[1], r * 0.7, r * 0.38, 0, 0, TAU); g.setLineDash([6, 8]); g.strokeStyle = 'rgba(150,255,190,.2)'; g.lineWidth = 1.6; g.stroke(); g.setLineDash([]); for (let i = 0; i < 6; i++) { const b = (i / 6) * TAU; dot(g, p[0] + Math.cos(b) * r * 0.85, p[1] + Math.sin(b) * r * 0.47, 2, 'rgba(255,160,230,.3)'); } }
    /* bolhas de feitiço */
    for (let j = 0; j < 40; j++) { const x = R() * W, y = R() * H, r = 1.5 + R() * 3, m = R() < 0.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fillStyle = m ? 'rgba(255,120,220,.35)' : 'rgba(150,255,190,.3)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8; g.stroke(); }
    edge(18, function (x, y, s) { aguape(g, R, x, y, s, R() < 0.4, R() < 0.5); }, 0.9, 1.4);
    edge(10, function (x, y, s) { reed(g, x, y, s, R, true); }, 0.9, 1.2);
    [[A.x0 - 50, A.y0 + 120, 1.1], [A.x1 + 56, A.y0 + 60, 1.15], [A.x1 + 40, A.y1 + 18, 1.2]].forEach(function (t) { items.push({ y: t[1], d: function () { trunk(g, t[0], t[1], t[2]); } }); });
  }
  items.sort(function (p, q2) { return p.y - q2.y; }).forEach(function (it) { it.d(); });
  if (v === 2) { for (let j = 0; j < 10; j++) { const side = j % 4, x = side < 2 ? R() * W : side === 2 ? R() * 100 : W - R() * 100, y = side === 0 ? R() * 120 : side === 1 ? H - R() * 70 : R() * H; fog(g, x, y, 140, j % 2 ? '255,79,200' : '124,252,154', 0.22); } }
  q = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, v === 2 ? 'rgba(6,4,16,.6)' : 'rgba(4,18,16,.5)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
}

/* ---------------- moldura ---------------- */
/* cacho de flores de piúva (ipê-roxo) */
function bloom(g, R, x, y, r) {
  for (let i = 0; i < 9; i++) { const a = R() * TAU, d = Math.sqrt(R()) * r; const fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * 0.8;
    cel(g, function (c) { for (let m = 0; m < 5; m++) { const b = (m / 5) * TAU + a; el(c, fx + Math.cos(b) * 3.2, fy + Math.sin(b) * 3.2, 3, 2, b); } }, i % 3 ? '#e07ac2' : '#c45aa8', { k: 0.6, lw: 1.3, sh: 'rgba(90,20,70,.3)' }); dot(g, fx, fy, 1.4, '#ffe28a'); }
}
function branch(g, R, P, w) {
  g.save(); g.translate(8, 14); g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) g.lineTo(P[i][0], P[i][1]); g.strokeStyle = 'rgba(4,14,12,.3)'; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); g.restore();
  for (let i = 0; i < P.length - 1; i++) { const ww = w * (1 - i / P.length * 0.7); g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[i + 1][0], P[i + 1][1]); g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = ww + 3; g.stroke(); g.strokeStyle = '#5a4636'; g.lineWidth = ww; g.stroke(); g.strokeStyle = 'rgba(200,170,130,.25)'; g.lineWidth = ww * 0.25; g.save(); g.translate(-1, -2); g.stroke(); g.restore(); }
}
function leafTuft(g, R, x, y, r) {
  for (let i = 0; i < 8; i++) { const a = R() * TAU, d = Math.sqrt(R()) * r, lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.8, an = R() * TAU;
    g.save(); g.translate(lx, ly); g.rotate(an); cel(g, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(7, -6, 15, 0); c.quadraticCurveTo(7, 6, 0, 0); c.closePath(); }, i % 2 ? '#3f8a48' : '#2f7040', { k: 1, lw: 1.6, sh: 'rgba(4,40,24,.4)' }); g.restore(); }
}
function bladeRow(g, R, x0, x1, y, hMin, hMax, flip) {
  for (let x = x0; x < x1; x += 5 + R() * 5) {
    const h = hMin + R() * (hMax - hMin), lean = (R() - 0.5) * 30, d = flip ? 1 : -1;
    g.beginPath(); g.moveTo(x - 3, y); g.quadraticCurveTo(x + lean * 0.3, y + d * h * 0.6, x + lean, y + d * h); g.quadraticCurveTo(x + lean * 0.3 + 2, y + d * h * 0.5, x + 3, y); g.closePath();
    g.fillStyle = R() < 0.3 ? '#a8a24a' : R() < 0.6 ? '#4f8a3c' : '#3a7034'; g.strokeStyle = OUT; g.lineWidth = 1.6; g.lineJoin = 'round'; g.stroke(); g.fill();
  }
}
/** Moldura: galhos de piúva florida, aguapés e capim alto pelas bordas. */
export function paintPantanalCanopy(g, W, H, seed) {
  const R = rng(seed || 77);
  /* capim alto entrando por baixo e pelos lados */
  bladeRow(g, R, -10, W + 10, H + 6, 30, 70, false);
  for (let y = 120; y < H; y += 7 + R() * 6) { const h = 30 + R() * 50; [[-6, 1], [W + 6, -1]].forEach(function (s) { const lean = (R() - 0.5) * 20; g.beginPath(); g.moveTo(s[0], y - 3); g.quadraticCurveTo(s[0] + s[1] * h * 0.6, y + lean * 0.3, s[0] + s[1] * h, y + lean); g.quadraticCurveTo(s[0] + s[1] * h * 0.5, y + lean * 0.3 + 2, s[0], y + 3); g.closePath(); g.fillStyle = R() < 0.3 ? '#a8a24a' : '#3f7a38'; g.strokeStyle = OUT; g.lineWidth = 1.6; g.stroke(); g.fill(); }); }
  /* aguapés no pé da moldura */
  for (let j = 0; j < 9; j++) aguape(g, R, 40 + R() * (W - 80), H - 6 - R() * 16, 1.1 + R() * 0.4, j % 2 === 0);
  [[-6, H * 0.6], [W + 6, H * 0.45], [-4, H * 0.86], [W + 4, H * 0.82]].forEach(function (p) { aguape(g, R, p[0], p[1], 1.4, true); });
  /* galhos de piúva nos cantos de cima, com flores */
  const B = [
    [[-20, 70], [80, 50], [170, 38], [240, 12], [300, -10]], [[-20, 140], [50, 110], [110, 104]], [[60, -20], [96, 40], [150, 60]],
    [[W + 20, 60], [W - 90, 44], [W - 180, 30], [W - 250, -10]], [[W + 20, 150], [W - 50, 120], [W - 120, 112]], [[W - 70, -20], [W - 100, 36], [W - 160, 60]],
  ];
  B.forEach(function (P, n) { branch(g, R, P, n % 3 === 0 ? 16 : 10); });
  [[150, 50, 34], [240, 12, 30], [100, 104, 26], [40, 70, 30], [W - 170, 34, 34], [W - 250, 0, 30], [W - 110, 110, 26], [W - 40, 64, 30], [W * 0.5, -22, 46], [W * 0.5 - 140, -16, 30], [W * 0.5 + 150, -14, 32]].forEach(function (q, n) { leafTuft(g, R, q[0], q[1], q[2]); if (n % 2 === 0 || n > 7) bloom(g, R, q[0] + 6, q[1] + 4, q[2] * 0.7); });
  /* pétalas soltas caindo nas bordas */
  for (let j = 0; j < 14; j++) { const x = R() < 0.5 ? R() * 220 : W - R() * 220, y = 30 + R() * 140; cel(g, function (c) { el(c, x, y, 3, 2, R() * 3); }, '#e07ac2', { k: 0.4, lw: 1.1 }); }
}

/* ---------------- mapa ---------------- */
function spline(P, step) {
  const out = [], n = P.length;
  if (n < 2) return P.slice();
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push({ x: 0.5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3), y: 0.5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3) }); }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y }); return out;
}
function near(L, x, y) { let m = 1e12; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function strokeL(c, L, col, lw, dash) { if (L.length < 2) return; c.beginPath(); c.moveTo(L[0].x, L[0].y); for (let i = 1; i < L.length; i++) c.lineTo(L[i].x, L[i].y); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.stroke(); if (dash) c.setLineDash([]); }
function norm(L, i) { const a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; }
function trailOf(P, R, wob) {
  if (P.length < 2) return P.slice(); const C = [];
  for (let i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { const a = P[i], b = P[i + 1], k = (R() - 0.5) * wob; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * k, y: (a.y + b.y) / 2 + (b.x - a.x) * k }); } }
  return spline(C, 6);
}
function spot(P, W, H, d, margin) {
  const n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1; let best = null, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const a = (i * TAU) / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; let s = 240;
    for (let j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    const e = Math.min(x - margin, W - margin - x, y - margin - 90, H - margin - y); if (e < 0) s += e * 8;
    s += ((Math.cos(a) * vx + Math.sin(a) * vy) / vm) * 40 - Math.sin(a) * 26;
    if (s > bs) { bs = s; best = { x: x, y: y }; }
  }
  return best;
}
function wobble(c, x, y, r, ph, sx, sy) { c.beginPath(); for (let i = 0; i <= 44; i++) { const a = (i / 44) * TAU, q = r * (1 + 0.1 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 5 + ph * 2.3)); c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q * (sx || 1), y + Math.sin(a) * q * (sy || 1)); } c.closePath(); }
function lobes(x, y, r, R) { const L = [], a0 = R() * TAU, n = 5 + ((R() * 3) | 0); for (let i = 0; i < n; i++) { const a = a0 + (i * TAU) / n; L.push([x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52, r * (0.5 + R() * 0.14)]); } L.push([x, y, r * 0.64]); return L; }
function discs(c, L, grow, dx, dy, k, col) { c.beginPath(); for (let i = 0; i < L.length; i++) { const q = L[i], r = q[2] * k + grow, x = q[0] + dx * q[2], y = q[1] + dy * q[2]; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fillStyle = col; c.fill(); }
function tree(c, x, y, r, pal, R, shadow) { const L = lobes(x, y, r, R); c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.4, r * 1.04, r * 0.94, 0, 0, TAU); c.fillStyle = shadow || 'rgba(6,18,12,.3)'; c.fill(); discs(c, L, 2.3, 0, 0, 1, pal[2]); discs(c, L, 0, 0, 0, 1, pal[0]); discs(c, L, 0, -0.2, -0.25, 0.66, pal[1]); discs(c, L, 0, -0.32, -0.38, 0.26, pal[3]); }
function palm(c, x, y, r, pal, R, shadow) {
  const n = 9, a0 = R() * TAU, A = []; for (let i = 0; i < n; i++) A.push(a0 + (i * TAU) / n + (R() - 0.5) * 0.3);
  c.beginPath(); c.ellipse(x + r * 0.3, y + r * 0.4, r, r * 0.9, 0, 0, TAU); c.fillStyle = shadow || 'rgba(6,18,12,.28)'; c.fill();
  [[2.2, pal[2]], [0, pal[0]]].forEach(function (ps) { c.beginPath(); A.forEach(function (a) { const fx = x + Math.cos(a) * r * 0.56, fy = y + Math.sin(a) * r * 0.56; c.moveTo(fx + Math.cos(a) * (r * 0.56 + ps[0]), fy + Math.sin(a) * (r * 0.56 + ps[0])); c.ellipse(fx, fy, r * 0.56 + ps[0], r * 0.17 + ps[0], a, 0, TAU); }); c.fillStyle = ps[1]; c.fill(); });
  c.beginPath(); A.forEach(function (a) { c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }); c.strokeStyle = pal[1]; c.lineWidth = 1.4; c.stroke(); dot(c, x, y, r * 0.16, pal[2]);
}
function radial(c, x, y, r, rgb, a, op) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); if (op) c.globalCompositeOperation = op; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }

/* a gruta-cozinha da Cuca: morrote de pedra com a boca acesa e fumaça magenta */
function cucaCave(c, x, y, R) {
  c.save(); c.translate(x, y);
  c.beginPath(); c.ellipse(10, 10, 96, 30, 0, 0, TAU); c.fillStyle = 'rgba(6,12,10,.42)'; c.fill();
  radial(c, 0, -20, 130, '255,79,200', 0.22, 'lighter');
  /* pedras do morrote */
  [[-60, -6, 30, 22], [62, -4, 30, 20], [-34, -40, 36, 30], [36, -42, 36, 30], [0, -66, 40, 28], [-70, 10, 20, 12], [74, 12, 20, 12]].forEach(function (q, n) {
    cel(c, function (c) { wobble(c, q[0], q[1], q[2], n * 1.7, 1, q[3] / q[2]); }, n % 2 ? '#6f6a72' : '#7d7880', { k: 4, lw: 2.6, inn: function (c) { c.fillStyle = 'rgba(96,130,80,.8)'; c.beginPath(); c.ellipse(q[0] - q[2] * 0.2, q[1] - q[3] * 0.6, q[2] * 0.5, q[3] * 0.24, -0.2, 0, TAU); c.fill(); ln(c, [q[0] + q[2] * 0.2, q[1] - q[3] * 0.3, q[0] + q[2] * 0.36, q[1] + q[3] * 0.3], 'rgba(30,24,34,.4)', 1.4); } });
  });
  /* boca da gruta */
  c.beginPath(); c.moveTo(-30, 8); c.quadraticCurveTo(-34, -42, 0, -46); c.quadraticCurveTo(34, -42, 30, 8); c.closePath(); c.fillStyle = '#1a0a18'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke();
  c.save(); c.clip(); radial(c, 0, -6, 44, '255,79,200', 0.9); radial(c, 0, 2, 22, '255,220,120', 0.6); c.restore();
  /* caldeirão na porta */
  cel(c, function (c) { el(c, 0, 0, 13, 9); }, '#36323c', { k: 2, lw: 2.2 }); cel(c, function (c) { el(c, 0, -6, 13, 4); }, '#4a4552', { k: 0, lw: 2 }); c.beginPath(); c.ellipse(0, -5.6, 10, 2.6, 0, 0, TAU); c.fillStyle = MAG; c.fill();
  /* fumaça magenta subindo, com faíscas verdes */
  for (let i = 0; i < 7; i++) { const u = i / 7, px = Math.sin(u * 5) * 10 + u * 12, py = -50 - u * 84, r = 13 + u * 18; c.beginPath(); wobble(c, px, py, r, i * 2, 1.2, 0.8); c.fillStyle = 'rgba(40,10,40,.35)'; c.fill(); c.beginPath(); wobble(c, px - 2, py - 2, r * 0.92, i * 2, 1.2, 0.8); c.fillStyle = 'rgba(232,90,200,' + (0.7 - u * 0.45) + ')'; c.fill(); c.beginPath(); wobble(c, px - r * 0.3, py - r * 0.3, r * 0.42, i, 1.2, 0.8); c.fillStyle = 'rgba(255,190,240,' + (0.5 - u * 0.3) + ')'; c.fill(); }
  for (let i = 0; i < 12; i++) dot(c, -36 + R() * 80, -56 - R() * 96, 1 + R() * 1.6, R() < 0.5 ? 'rgba(124,252,154,.85)' : 'rgba(255,220,250,.8)');
  /* olhos de Assombro espiando */
  [[-74, -20], [80, -24]].forEach(function (q) { dot(c, q[0], q[1], 7, 'rgba(10,6,12,.55)'); dot(c, q[0] - 2.6, q[1], 1.5, '#ff3d8a'); dot(c, q[0] + 2.6, q[1], 1.5, '#ff3d8a'); });
  c.restore();
}

function mapPantanal(c, W, H, P) {
  const R = rng(7707);
  let g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#6f8f4c'); g.addColorStop(0.5, '#628446'); g.addColorStop(1, '#4f7444'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 130, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(170,180,100,.14)' : 'rgba(20,50,30,.14)'; c.fill(); }
  const trail = trailOf(P, R, 0.22);
  /* lugar da gruta: perto da última fase, longe das outras, da trilha e das bordas (com folga em cima para a fumaça) */
  let lair = { x: W * 0.88, y: H * 0.3 }, best = -1e9;
  if (P.length) { const last = P[P.length - 1]; [112, 135, 160].forEach(function (d) { for (let i = 0; i < 32; i++) { const a = (i * TAU) / 32, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d + 30;
    let s = Math.min(170, near(P.slice(0, -1), x, y) - 40) + Math.min(110, near(trail, x, y) - 20) * 1.2 - d * 0.3;
    const e = Math.min(x - 100, W - 100 - x, y - 170, H - 50 - y); if (e < 0) s += e * 6;
    if (s > best) { best = s; lair = { x: x, y: y }; } } }); }
  /* baías (lagoas redondas) e um corixo serpenteando */
  const BAY = [];
  for (let i = 0; i < 40 && BAY.length < 9; i++) { const x = 60 + R() * (W - 120), y = 60 + R() * (H - 120), r = 40 + R() * 50; if (Math.hypot(x - lair.x, y - lair.y) < r + 120 || BAY.some(function (b) { return Math.hypot(b.x - x, b.y - y) < b.r + r + 30; })) continue; BAY.push({ x: x, y: y, r: r, ph: R() * 6 }); }
  const RV = spline([[-0.06, 0.44], [0.14, 0.5], [0.3, 0.42], [0.46, 0.5], [0.6, 0.6], [0.76, 0.56], [0.9, 0.66], [1.06, 0.62]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; }), 8);
  function water(x, y) { let m = near(RV, x, y) - 20; BAY.forEach(function (b) { m = Math.min(m, Math.hypot((x - b.x) / 1.2, (y - b.y) / 0.85) - b.r); }); return m; }
  /* campo alagável em volta da água */
  BAY.forEach(function (b) { c.beginPath(); wobble(c, b.x, b.y, b.r + 34, b.ph, 1.2, 0.85); c.fillStyle = 'rgba(70,130,100,.35)'; c.fill(); });
  strokeL(c, RV, 'rgba(70,130,100,.35)', 90);
  BAY.forEach(function (b) { c.beginPath(); wobble(c, b.x, b.y, b.r + 5, b.ph, 1.2, 0.85); c.fillStyle = '#244c44'; c.fill(); });
  strokeL(c, RV, '#244c44', 48);
  BAY.forEach(function (b) { c.beginPath(); wobble(c, b.x, b.y, b.r, b.ph, 1.2, 0.85); c.fillStyle = '#3f8f86'; c.fill(); c.beginPath(); wobble(c, b.x - 3, b.y - 3, b.r * 0.66, b.ph + 1, 1.2, 0.85); c.fillStyle = '#4fa596'; c.fill(); for (let i = 0; i < 2; i++) { c.beginPath(); c.ellipse(b.x, b.y, b.r * (0.5 + i * 0.25) * 1.2, b.r * (0.5 + i * 0.25) * 0.85, 0, 0.4 + i, 1.4 + i); c.strokeStyle = 'rgba(230,255,250,.35)'; c.lineWidth = 1.6; c.stroke(); } });
  strokeL(c, RV, '#3f8f86', 40); strokeL(c, RV, '#4aa092', 22);
  c.beginPath(); for (let i = 3; i < RV.length - 6; i += 7) { const n0 = norm(RV, i), o = (((i * 7) % 3) - 1) * 7; c.moveTo(RV[i].x + n0.x * o, RV[i].y + n0.y * o); c.lineTo(RV[i + 3].x + n0.x * o, RV[i + 3].y + n0.y * o); } c.strokeStyle = 'rgba(220,250,245,.4)'; c.lineWidth = 1.8; c.stroke();
  /* aguapés nas águas */
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, w = water(x, y); if (w > -6 || near(P, x, y) < 50 || near(trail, x, y) < 18) continue; for (let j = 0; j < 4; j++) dot(c, x + (R() - 0.5) * 12, y + (R() - 0.5) * 8, 2.6 + R() * 2, j % 2 ? '#4f9a46' : '#62b250'); if (i % 3 === 0) dot(c, x, y, 1.8, '#c9a2f2'); }
  /* chão firme de cada fase */
  P.forEach(function (p) {
    if (water(p.x, p.y) < 44) cel(c, function (c) { wobble(c, p.x, p.y + 4, 56, p.x * 0.01, 1.12, 0.84); }, '#a58a58', { k: 3, lw: 2.2, out: '#4a3a20', sh: 'rgba(90,60,20,.35)', hi: 'rgba(255,240,200,.35)', inn: function (c) { wobble(c, p.x, p.y + 4, 40, p.x * 0.01, 1.12, 0.84); c.fillStyle = 'rgba(130,160,80,.6)'; c.fill(); } });
    else [[76, 58, 'rgba(180,186,110,.2)'], [58, 44, 'rgba(200,196,124,.22)'], [40, 30, 'rgba(220,206,140,.2)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); });
  });
  /* trilha: dique de terra no seco, passarela de tábuas sobre a água */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(10,28,20,.42)', 27); strokeL(c, trail, '#5a4024', 18.5); strokeL(c, trail, '#a88454', 13.5);
    c.save(); c.translate(-1.2, -1.4); strokeL(c, trail, '#c9a46e', 5); c.restore();
    strokeL(c, trail, 'rgba(110,78,40,.45)', 2, [3, 15]);
    let run = -1;
    const planks = function (a, b) {
      a = Math.max(0, a); b = Math.min(trail.length - 1, b);
      [['#2a180c', 6.6, 13.6], ['#b98a55', 4.2, 12.4]].forEach(function (st) { c.beginPath(); for (let i = a; i <= b; i++) { const n = norm(trail, i); c.moveTo(trail[i].x - n.x * st[2], trail[i].y - n.y * st[2]); c.lineTo(trail[i].x + n.x * st[2], trail[i].y + n.y * st[2]); } c.strokeStyle = st[0]; c.lineWidth = st[1]; c.lineCap = 'butt'; c.stroke(); c.lineCap = 'round'; });
      [-1, 1].forEach(function (sd) { c.beginPath(); for (let i = a; i <= b; i++) { const n = norm(trail, i); c[i === a ? 'moveTo' : 'lineTo'](trail[i].x + n.x * 12.4 * sd, trail[i].y + n.y * 12.4 * sd); } c.strokeStyle = '#4a2e18'; c.lineWidth = 2.6; c.stroke(); });
      for (let i = a + 2; i < b; i += 7) { const n = norm(trail, i); dot(c, trail[i].x - n.x * 13, trail[i].y - n.y * 13, 2.6, '#2a180c'); dot(c, trail[i].x + n.x * 13, trail[i].y + n.y * 13, 2.6, '#2a180c'); }
    };
    for (let i = 0; i <= trail.length; i++) { const on = i < trail.length && water(trail[i].x, trail[i].y) < 4 && near(P, trail[i].x, trail[i].y) > 40; if (on && run < 0) run = i; if (!on && run >= 0) { planks(run - 2, i + 1); run = -1; } }
  }
  /* cordilheiras de mata, carandás na beira d'água e piúvas floridas */
  const PAL = [['#2f6a3c', '#3f8445', '#12301b', '#5aa052'], ['#3a7a40', '#4f9448', '#13331c', '#72b45c'], ['#2c623a', '#387a45', '#0f2a1a', '#4c9352']];
  const PIU = ['#c05aa6', '#e07ac2', '#4a1a3e', '#ffb0e4'], CAR = [['#5f9a4a', '#a8d070', '#1f3a1c'], ['#4f8a44', '#94c464', '#18321a']];
  const TR = [], cell = 40;
  for (let gy = -1; gy * cell < H + cell; gy++) for (let gx = -1; gx * cell < W + cell; gx++) {
    const tx = (gx + 0.5 + (R() - 0.5) * 0.9) * cell, ty = (gy + 0.5 + (R() - 0.5) * 0.9) * cell, tr = 14 + R() * 12, kind = R(), keep = R(), wd = water(tx, ty);
    const band = Math.sin(tx * 0.011 + ty * 0.006) + Math.sin(ty * 0.017 - tx * 0.004 + 1.3);
    if (wd < tr * 0.4) continue;
    if (band < 0.1 && keep < 0.86 && wd > 40) continue;
    if (near(P, tx, ty) < 58 + tr * 0.7 || near(trail, tx, ty) < 14 + tr * 0.9 || Math.hypot(tx - lair.x, ty - (lair.y - 50)) < 130) continue;
    TR.push([tx, ty, tr, kind, wd]);
  }
  TR.sort(function (a, b) { return a[1] - b[1]; });
  TR.forEach(function (q) { if (q[4] < 50 && q[3] < 0.5) palm(c, q[0], q[1], q[2] * 0.95, CAR[q[3] < 0.25 ? 0 : 1], R); else tree(c, q[0], q[1], q[2], q[3] < 0.1 ? PIU : PAL[((q[3] * 97) | 0) % 3], R); });
  /* garças e tuiuiús na água */
  for (let i = 0; i < 26; i++) { const x = R() * W, y = R() * H; if (water(x, y) > -4 || near(P, x, y) < 50 || near(trail, x, y) < 20) continue; dot(c, x + 1.5, y + 2, 3, 'rgba(6,20,16,.35)'); cel(c, function (c) { el(c, x, y, 3.4, 2.4); }, '#f6f4ee', { k: 0.6, lw: 1.2 }); if (i % 3 === 0) { dot(c, x + 3, y - 1.4, 1.6, '#1f1c22'); dot(c, x + 2, y - 0.6, 1, '#e0322e'); } }
  c.save(); c.translate(lair.x, lair.y); c.scale(0.86, 0.86); cucaCave(c, 0, 0, R); c.restore();
  /* névoa colorida rente ao chão perto da gruta */
  radial(c, lair.x - 60, lair.y + 20, 160, '124,252,154', 0.08, 'lighter');
  radial(c, W * 0.2, H * 0.12, W * 0.6, '255,236,170', 0.1, 'lighter');
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.56); vg.addColorStop(0, 'rgba(8,20,16,0)'); vg.addColorStop(1, 'rgba(8,20,16,.82)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
}

/** Mapa ilustrado do capítulo (área virtual em que o menor lado vale 1280×720). */
export function paintPantanalMap(c, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  mapPantanal(c, w / u, h / u, (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; }));
  c.restore();
}
