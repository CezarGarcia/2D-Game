// @ts-nocheck
/**
 * Torre dos Cem Andares: chão de um andar, moldura da sala e fundo da tela da Torre no acampamento.
 * Pedra antiga com entalhes de folclore, tochas nas bordas, raízes subindo pelas paredes.
 * A área jogável (x 120–1160, y 150–640 numa tela de 1280×720) só recebe detalhe de chão.
 * Determinístico pela semente (sem Math.random).
 */
import { OUT, TAU, cel, dot, el, ln, poly, cap } from './characters';

const PI = Math.PI;
const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };
function rng(s) { s = s >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function radial(c, x, y, r, rgb, a, op) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); if (op) c.globalCompositeOperation = op; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
function shade(hex, f) { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, m = function (v) { return Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); }; return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')'; }

/* paletas de cada variação: pedra, pedra clara, rejunte, cor dos entalhes */
const PAL = [
  { s: '#5f5b6b', l: '#76718a', d: '#25222e', moss: 'rgba(80,110,80,', name: 'ardósia' },
  { s: '#7c6852', l: '#957e62', d: '#2d2218', moss: 'rgba(110,110,60,', name: 'arenito' },
  { s: '#505a52', l: '#66705f', d: '#1b231e', moss: 'rgba(70,120,70,', name: 'musgo' },
];

/* entalhe: sulco escuro com a borda de baixo iluminada */
function carve(c, fn, a, lw) {
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.translate(0, 1.4); c.beginPath(); fn(c); c.strokeStyle = 'rgba(255,240,210,' + 0.16 * a + ')'; c.lineWidth = lw || 3; c.stroke();
  c.translate(0, -1.4); c.beginPath(); fn(c); c.strokeStyle = 'rgba(10,6,14,' + 0.5 * a + ')'; c.lineWidth = (lw || 3) * 0.8; c.stroke();
  c.restore();
}
/* símbolos do folclore, centrados em (0,0), cabem num raio ~20 */
const GLYPHS = [
  /* sol */ function (c) { c.moveTo(8, 0); c.arc(0, 0, 8, 0, TAU); for (let i = 0; i < 8; i++) { const a = i * PI / 4; c.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); c.lineTo(Math.cos(a) * 18, Math.sin(a) * 18); } },
  /* cobra de fogo (Boitatá) */ function (c) { c.moveTo(-18, 6); c.bezierCurveTo(-12, -10, -4, 12, 2, -2); c.bezierCurveTo(6, -12, 12, -6, 16, -8); c.moveTo(16, -8); c.lineTo(19, -12); c.moveTo(16, -8); c.lineTo(20, -6); },
  /* pé virado (Curupira) */ function (c) { c.ellipse(2, 4, 6, 10, 0.2, 0, TAU); for (let i = 0; i < 4; i++) { c.moveTo(-2 + i * 3 + 2, 16 + Math.abs(i - 1.5)); c.arc(-2 + i * 3, 16 + Math.abs(i - 1.5), 2, 0, TAU); } },
  /* peixe (Iara) */ function (c) { c.moveTo(-14, 0); c.quadraticCurveTo(0, -12, 12, 0); c.quadraticCurveTo(0, 12, -14, 0); c.moveTo(-14, 0); c.lineTo(-20, -7); c.lineTo(-20, 7); c.closePath(); c.moveTo(8, -1); c.arc(6, -1, 2, 0, TAU); },
  /* lua (Lobisomem) */ function (c) { c.arc(0, 0, 14, 0.8, TAU - 0.8); c.quadraticCurveTo(4, 0, Math.cos(0.8) * 14, Math.sin(0.8) * 14); },
  /* chama (Mula) */ function (c) { c.moveTo(-8, 12); c.quadraticCurveTo(-14, -2, 0, -18); c.quadraticCurveTo(-2, -4, 6, -8); c.quadraticCurveTo(14, 4, 8, 12); c.closePath(); },
  /* olho (Esquecimento) */ function (c) { c.moveTo(-16, 0); c.quadraticCurveTo(0, -12, 16, 0); c.quadraticCurveTo(0, 12, -16, 0); c.moveTo(5, 0); c.arc(0, 0, 5, 0, TAU); },
  /* espiral (Saci) */ function (c) { for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 2.4, r = 2 + t * 15; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } },
  /* pena (cocar) */ function (c) { c.moveTo(0, 18); c.lineTo(0, -18); c.moveTo(0, -16); c.quadraticCurveTo(10, -6, 0, 10); c.moveTo(0, -16); c.quadraticCurveTo(-10, -6, 0, 10); },
  /* cacto */ function (c) { c.moveTo(0, 18); c.lineTo(0, -18); c.moveTo(0, 2); c.lineTo(-9, 2); c.lineTo(-9, -10); c.moveTo(0, -4); c.lineTo(9, -4); c.lineTo(9, -14); },
];
function glyph(c, i, x, y, s, rot, a) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); carve(c, GLYPHS[i % GLYPHS.length], a, 3 / s); c.restore(); }

/* uma laje de pedra: polígono com rejunte, chanfro claro e sombra */
function slab(c, P, col, R, p) {
  c.beginPath(); poly(c, P); c.fillStyle = col; c.fill();
  c.save(); c.clip();
  c.beginPath(); c.rect(-5000, -5000, 10000, 10000); poly(c, P.map(function (v, i) { return v + (i % 2 ? 3 : 2.4); })); c.fillStyle = 'rgba(255,240,220,.08)'; c.fill('evenodd');
  c.beginPath(); c.rect(-5000, -5000, 10000, 10000); poly(c, P.map(function (v, i) { return v - (i % 2 ? 3 : 2.4); })); c.fillStyle = 'rgba(0,0,0,.16)'; c.fill('evenodd');
  /* poros e manchas */
  let mx = 0, my = 0; for (let i = 0; i < P.length; i += 2) { mx += P[i]; my += P[i + 1]; } mx /= P.length / 2; my /= P.length / 2;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(mx + (R() - 0.5) * 50, my + (R() - 0.5) * 30, 6 + R() * 14, 3 + R() * 7, R() * 3, 0, TAU); c.fillStyle = R() < 0.5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.05)'; c.fill(); }
  if (R() < 0.25) ln(c, [mx - 20 + R() * 10, my - 10 + R() * 8, mx + R() * 8, my + R() * 6, mx + 14 + R() * 10, my + 6 + R() * 8], 'rgba(10,6,14,.4)', 1.1);
  c.restore();
  c.beginPath(); poly(c, P); c.strokeStyle = p.d; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke();
}

/* tocha presa na parede, vista de cima e um pouco de frente */
function torch(c, x, y, s, lit) {
  radial(c, x, y + 10 * s, 190 * s, '255,170,70', 0.32 * lit, 'lighter');
  radial(c, x, y - 6 * s, 50 * s, '255,210,120', 0.5 * lit, 'lighter');
  cel(c, function (c) { poly(c, [x - 9 * s, y - 2 * s, x + 9 * s, y - 2 * s, x + 6 * s, y + 6 * s, x - 6 * s, y + 6 * s]); }, '#3c3640', { k: 1.4, lw: 2 });
  cel(c, function (c) { cap(c, x, y + 4 * s, x, y - 12 * s, 3 * s); }, '#6a4a2c', { k: 1, lw: 1.8 });
  cel(c, function (c) { poly(c, [x - 6 * s, y - 10 * s, x + 6 * s, y - 10 * s, x + 5 * s, y - 15 * s, x - 5 * s, y - 15 * s]); }, '#4a4450', { k: 0.8, lw: 1.6 });
  c.save(); c.lineJoin = 'round';
  [[1, '#e2401f', 3.4], [0.72, '#ff8a1e', 0], [0.45, '#ffd84a', 0]].forEach(function (f) {
    const k = f[0]; c.beginPath(); c.moveTo(x - 7 * s * k, y - 14 * s); c.quadraticCurveTo(x - 9 * s * k, y - 26 * s * k - 8 * s, x - 1 * s, y - 38 * s * k - 10 * s); c.quadraticCurveTo(x + 2 * s * k, y - 26 * s * k - 8 * s, x + 4 * s * k, y - 28 * s * k - 10 * s); c.quadraticCurveTo(x + 10 * s * k, y - 22 * s * k - 6 * s, x + 7 * s * k, y - 14 * s); c.closePath();
    if (f[2]) { c.strokeStyle = OUT; c.lineWidth = f[2]; c.stroke(); } c.fillStyle = f[1]; c.fill();
  });
  c.restore();
}
/* raiz grossa rastejando pela pedra */
function root(c, R, x, y, ang, len, w, col) {
  const n = 12, P = []; let a = ang, px = x, py = y; const ph = R() * 6;
  for (let i = 0; i <= n; i++) { P.push([px, py]); a = ang + Math.sin(ph + i * 0.8) * 0.45; px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; }
  const pass = function (cl, k, dy) { for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(P[i][0], P[i][1] + dy); c.lineTo(P[i + 1][0], P[i + 1][1] + dy); c.strokeStyle = cl; c.lineWidth = Math.max(0.8, w * (1 - i / (n + 2)) * k); c.lineCap = 'round'; c.stroke(); } };
  c.save(); c.translate(3, 5); pass('rgba(0,0,0,.3)', 1.1, 0); c.restore();
  pass(OUT, 1, 0); pass(col, 0.7, 0); pass('rgba(255,220,170,.22)', 0.2, -w * 0.15);
  for (let i = 3; i < n - 2; i += 3) { const d = (i % 2 ? 1 : -1) * 0.9, l = len * 0.18; ln(c, [P[i][0], P[i][1], P[i][0] + Math.cos(ang + d) * l, P[i][1] + Math.sin(ang + d) * l], OUT, w * 0.35); ln(c, [P[i][0], P[i][1], P[i][0] + Math.cos(ang + d) * l, P[i][1] + Math.sin(ang + d) * l], col, w * 0.2); }
}

/** Piso de um andar da Torre em 1280×720. 0: ardósia em fiadas com medalhão; 1: arenito em anéis; 2: lajes velhas com musgo e raízes. */
function ground(c, W, H, variant, seed) {
  const v = (((variant | 0) % 3) + 3) % 3, R = rng((seed || 31) + v * 5003), p = PAL[v];
  const kx = W / 1280, ky = H / 720, A = { x0: AREA.x0 * kx, y0: AREA.y0 * ky, x1: AREA.x1 * kx, y1: AREA.y1 * ky }, cx = W / 2, cy = (A.y0 + A.y1) / 2;
  c.fillStyle = p.d; c.fillRect(0, 0, W, H);
  const tone = function () { const f = (R() - 0.5) * 0.16; return shade(p.s, f); };
  if (v === 0) {
    /* fiadas de lajes retangulares */
    for (let y = -10, r = 0; y < H; y += 52, r++) { let x = -((r * 37) % 90); while (x < W) { const w = 64 + R() * 60; slab(c, [x + 1.5, y + 1.5, x + w - 1.5, y + 1.5, x + w - 1.5, y + 50.5, x + 1.5, y + 50.5], tone(), R, p); x += w; } }
  } else if (v === 1) {
    /* anéis de pedra em volta do centro */
    c.fillStyle = shade(p.s, -0.1); c.fillRect(0, 0, W, H);
    for (let rr = 70; rr < 900; rr += 50) {
      const n = Math.max(6, Math.round(TAU * rr / 90)), off = R() * TAU;
      for (let i = 0; i < n; i++) {
        const a0 = off + i * TAU / n, a1 = off + (i + 1) * TAU / n, P = [], m = 6;
        for (let j = 0; j <= m; j++) { const a = a0 + (a1 - a0) * j / m; P.push(cx + Math.cos(a) * (rr - 1.5), cy + Math.sin(a) * (rr - 1.5) * 0.92); }
        for (let j = m; j >= 0; j--) { const a = a0 + (a1 - a0) * j / m; P.push(cx + Math.cos(a) * (rr - 48.5), cy + Math.sin(a) * (rr - 48.5) * 0.92); }
        const mx = cx + Math.cos((a0 + a1) / 2) * rr, my = cy + Math.sin((a0 + a1) / 2) * rr;
        if (mx < -80 || mx > W + 80 || my < -80 || my > H + 80) continue;
        slab(c, P, tone(), R, p);
      }
    }
  } else {
    /* lajes grandes e tortas */
    const gx = 7, gy = 5, cw = W / gx, ch = H / gy, J = [];
    for (let j = 0; j <= gy; j++) { J.push([]); for (let i = 0; i <= gx; i++) J[j].push([i * cw + (i > 0 && i < gx ? (R() - 0.5) * cw * 0.35 : 0), j * ch + (j > 0 && j < gy ? (R() - 0.5) * ch * 0.35 : 0)]); }
    for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
      const a = J[j][i], b = J[j][i + 1], d = J[j + 1][i + 1], e = J[j + 1][i];
      if (R() < 0.4) { const mx = (a[0] + d[0]) / 2, my = (a[1] + d[1]) / 2; slab(c, [a[0] + 2, a[1] + 2, b[0] - 2, b[1] + 2, mx, my], tone(), R, p); slab(c, [b[0] - 2, b[1] + 2, d[0] - 2, d[1] - 2, e[0] + 2, e[1] - 2, a[0] + 2, a[1] + 2, mx, my], tone(), R, p); }
      else slab(c, [a[0] + 2, a[1] + 2, b[0] - 2, b[1] + 2, d[0] - 2, d[1] - 2, e[0] + 2, e[1] - 2], tone(), R, p);
    }
    /* musgo no rejunte */
    for (let i = 0; i < 160; i++) { const j = Math.floor(R() * gy), q = Math.floor(R() * gx), a = J[j][q], b = R() < 0.5 ? J[j][q + 1] : J[j + 1][q], u = R(); c.beginPath(); c.ellipse(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 5 + R() * 9, 2.4 + R() * 3, Math.atan2(b[1] - a[1], b[0] - a[0]), 0, TAU); c.fillStyle = p.moss + (0.35 + R() * 0.3) + ')'; c.fill(); }
    /* poças rasas */
    for (let i = 0; i < 4; i++) { const x = A.x0 + 80 + R() * (A.x1 - A.x0 - 160), y = A.y0 + 60 + R() * (A.y1 - A.y0 - 120); c.beginPath(); c.ellipse(x, y, 40 + R() * 40, 14 + R() * 10, R() * 0.4, 0, TAU); c.fillStyle = 'rgba(20,30,40,.3)'; c.fill(); c.strokeStyle = 'rgba(200,220,230,.14)'; c.lineWidth = 1.5; c.stroke(); }
  }
  /* medalhão entalhado no centro */
  const MR = [150, 130, 120][v];
  c.save(); c.translate(cx, cy); c.scale(1, 0.92);
  carve(c, function (c) { c.arc(0, 0, MR, 0, TAU); c.moveTo(MR - 14, 0); c.arc(0, 0, MR - 14, 0, TAU); }, 0.9, 3.4);
  const n = v === 1 ? 10 : 8;
  for (let i = 0; i < n; i++) { const a = i * TAU / n - PI / 2; glyph(c, (i + v * 3) % GLYPHS.length, Math.cos(a) * (MR - 44), Math.sin(a) * (MR - 44), 0.95, a + PI / 2, 0.85); }
  carve(c, function (c) { c.arc(0, 0, MR * 0.38, 0, TAU); }, 0.8, 2.6);
  glyph(c, [0, 7, 1][v], 0, 0, 1.6, 0, 0.9);
  for (let i = 0; i < n; i++) { const a = (i + 0.5) * TAU / n - PI / 2; carve(c, function (c) { c.moveTo(Math.cos(a) * (MR - 16), Math.sin(a) * (MR - 16)); c.lineTo(Math.cos(a) * (MR * 0.4), Math.sin(a) * (MR * 0.4)); }, 0.35, 2); }
  c.restore();
  /* entalhes soltos pelo piso */
  for (let i = 0; i < 9; i++) { let x, y, t = 0; do { x = A.x0 + 40 + R() * (A.x1 - A.x0 - 80); y = A.y0 + 30 + R() * (A.y1 - A.y0 - 60); t++; } while (Math.hypot(x - cx, (y - cy) / 0.92) < MR + 50 && t < 20); glyph(c, Math.floor(R() * GLYPHS.length), x, y, 0.8 + R() * 0.4, (R() - 0.5) * 0.6, 0.55); }
  /* pedrinhas e lascas */
  for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H, r = 1.5 + R() * 3; c.beginPath(); c.ellipse(x, y, r, r * 0.7, R() * 3, 0, TAU); c.fillStyle = shade(p.l, (R() - 0.5) * 0.3); c.fill(); c.strokeStyle = 'rgba(10,6,14,.5)'; c.lineWidth = 0.9; c.stroke(); }
  /* raízes da torre entrando pelos cantos */
  const RC = ['#5d4632', '#6a4e34', '#4e3c2c'][v];
  [[-10, 60, 0.35], [W + 10, 80, PI - 0.35], [-10, H - 70, -0.3], [W + 10, H - 50, PI + 0.3]].forEach(function (t) { root(c, R, t[0], t[1], t[2], 150 + R() * 60, 16, RC); root(c, R, t[0], t[1] + 20, t[2] + (t[2] > 0 ? 0.5 : -0.5), 100, 11, RC); });
  if (v === 2) [[W * 0.3, -10, 1.3], [W * 0.75, -10, 1.8], [W * 0.5, H + 10, -1.5]].forEach(function (t) { root(c, R, t[0], t[1], t[2], 120, 13, RC); });
  /* parede baixa em volta da sala */
  const wall = function (x, y, w, h) { cel(c, function (c) { poly(c, [x, y, x + w, y, x + w, y + h, x, y + h]); }, shade(p.s, -0.25 + (R() - 0.5) * 0.12), { k: 2.4, lw: 2.4, inn: function (c) { c.fillStyle = 'rgba(255,240,220,.08)'; c.fillRect(x, y, w, 4); } }); };
  for (let x = -20; x < W + 20; x += 70 + R() * 30) { wall(x, -8, 74, 46 * ky); wall(x - 20, H - 34 * ky, 80, 50); }
  for (let y = 30; y < H - 30; y += 60 + R() * 30) { wall(-8, y, 40 * kx, 64); wall(W - 32 * kx, y, 48, 64); }
  /* tochas nas bordas */
  const tl = [[W * 0.3, 128 * ky], [W * 0.5, 126 * ky], [W * 0.7, 128 * ky], [90 * kx, H * 0.4], [W - 90 * kx, H * 0.4], [90 * kx, H * 0.74], [W - 90 * kx, H * 0.74]];
  tl.forEach(function (t) { torch(c, t[0], t[1], 1, 1); });
  /* sombra nos cantos e um pouco de luz quente no centro */
  let q = c.createRadialGradient(cx, cy, H * 0.35, cx, cy, W * 0.68); q.addColorStop(0, 'rgba(8,4,14,0)'); q.addColorStop(1, 'rgba(8,4,14,.5)'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  radial(c, cx, cy, W * 0.42, '255,200,140', 0.07, 'lighter');
}

/** Moldura da sala da Torre: arcos no alto, colunas dos lados e o parapeito embaixo. */
function canopy(c, W, H, seed) {
  const R = rng(seed || 77), ST = '#4a4656', ST2 = '#5c5868', DK = '#1d1a24';
  /* sombra que a moldura joga para dentro */
  let q = c.createLinearGradient(0, 0, 0, 140); q.addColorStop(0, 'rgba(6,4,12,.6)'); q.addColorStop(1, 'rgba(6,4,12,0)'); c.fillStyle = q; c.fillRect(0, 0, W, 140);
  q = c.createLinearGradient(0, 0, 150, 0); q.addColorStop(0, 'rgba(6,4,12,.55)'); q.addColorStop(1, 'rgba(6,4,12,0)'); c.fillStyle = q; c.fillRect(0, 0, 150, H);
  q = c.createLinearGradient(W, 0, W - 150, 0); q.addColorStop(0, 'rgba(6,4,12,.55)'); q.addColorStop(1, 'rgba(6,4,12,0)'); c.fillStyle = q; c.fillRect(W - 150, 0, 150, H);
  /* parede do alto com arcos abertos para a noite */
  const AH = 92, n = 5, aw = W / n;
  cel(c, function (c) {
    c.moveTo(-10, -10); c.lineTo(W + 10, -10); c.lineTo(W + 10, AH);
    for (let i = n - 1; i >= 0; i--) { const x0 = i * aw, x1 = (i + 1) * aw; c.lineTo(x1 - 22, AH); c.lineTo(x1 - 22, AH - 30); c.arc((x0 + x1) / 2, AH - 30, aw / 2 - 22, 0, PI, true); c.lineTo(x0 + 22, AH); }
    c.lineTo(-10, AH); c.closePath();
  }, ST, {
    k: 3, lw: 3, inn: function (c) {
      for (let y = 8; y < AH; y += 22) for (let x = (y / 22) % 2 ? -30 : 0; x < W; x += 60) { c.strokeStyle = 'rgba(10,6,14,.35)'; c.lineWidth = 1.4; c.strokeRect(x, y, 60, 22); }
      for (let i = 0; i < n; i++) { const mx = (i + 0.5) * aw; c.beginPath(); poly(c, [mx - 9, 4, mx + 9, 4, mx + 6, 18, mx - 6, 18]); c.fillStyle = ST2; c.fill(); c.strokeStyle = DK; c.lineWidth = 1.6; c.stroke(); }
    },
  });
  /* céu e estrelas dentro dos arcos, atrás da parede: só a borda de baixo de cada arco (o resto é a sala) */
  for (let i = 0; i < n; i++) { const mx = (i + 0.5) * aw; c.save(); c.beginPath(); c.moveTo(i * aw + 22, AH); c.lineTo(i * aw + 22, AH - 30); c.arc(mx, AH - 30, aw / 2 - 22, PI, 0); c.lineTo((i + 1) * aw - 22, AH); c.closePath(); c.clip(); q = c.createLinearGradient(0, 0, 0, AH); q.addColorStop(0, 'rgba(14,16,40,.95)'); q.addColorStop(1, 'rgba(30,28,64,.5)'); c.fillStyle = q; c.fillRect(i * aw, 0, aw, AH); for (let j = 0; j < 14; j++) dot(c, i * aw + 30 + R() * (aw - 60), 8 + R() * (AH - 30), 0.6 + R() * 1.2, 'rgba(255,250,220,' + (0.4 + R() * 0.6) + ')'); c.restore(); }
  /* colunas dos lados */
  const column = function (x, flip) {
    const w = 64;
    cel(c, function (c) { poly(c, [x - w / 2, -10, x + w / 2, -10, x + w / 2, H + 10, x - w / 2, H + 10]); }, ST2, {
      k: 4, lw: 3, inn: function (c) { for (let i = -2; i <= 2; i++) { ln(c, [x + i * 10, 0, x + i * 10, H], 'rgba(10,6,14,.35)', 2); ln(c, [x + i * 10 + 3, 0, x + i * 10 + 3, H], 'rgba(255,240,220,.08)', 1.6); } },
    });
    [[96, 1], [H - 70, -1]].forEach(function (b) { cel(c, function (c) { poly(c, [x - w / 2 - 12, b[0], x + w / 2 + 12, b[0], x + w / 2 + 12, b[0] + 22, x - w / 2 - 12, b[0] + 22]); }, ST, { k: 2, lw: 2.6, inn: function (c) { ln(c, [x - w / 2 - 10, b[0] + 11, x + w / 2 + 10, b[0] + 11], 'rgba(10,6,14,.4)', 1.4); } }); });
    /* raiz enroscando na coluna */
    c.save(); c.beginPath();
    for (let i = 0; i <= 60; i++) { const t = i / 60, y = H + 10 - t * (H + 20), xx = x + Math.sin(t * 9 + (flip ? 2 : 0)) * (w / 2 + 4); c[i ? 'lineTo' : 'moveTo'](xx, y); }
    c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 11; c.stroke(); c.strokeStyle = '#5d4632'; c.lineWidth = 7; c.stroke(); c.strokeStyle = 'rgba(255,220,170,.2)'; c.lineWidth = 2; c.stroke(); c.restore();
    for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7, y = H - t * H, xx = x + Math.sin(t * 9 + (flip ? 2 : 0)) * (w / 2 + 4); c.save(); c.translate(xx, y); c.rotate(i % 2 ? 0.6 : 2.5); cel(c, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(8, -8, 18, 0); c.quadraticCurveTo(8, 8, 0, 0); c.closePath(); }, i % 2 ? '#3f7a48' : '#2f6a40', { k: 1, lw: 1.8 }); c.restore(); }
  };
  column(26, false); column(W - 26, true);
  /* parapeito embaixo */
  const PY = H - 46;
  cel(c, function (c) { poly(c, [-10, PY, W + 10, PY, W + 10, H + 10, -10, H + 10]); }, ST, {
    k: 3, lw: 3, inn: function (c) {
      c.fillStyle = 'rgba(255,240,220,.1)'; c.fillRect(0, PY, W, 6);
      for (let x = 70; x < W - 40; x += 46) { c.beginPath(); c.moveTo(x, H + 4); c.lineTo(x, PY + 22); c.arc(x + 12, PY + 22, 12, PI, 0); c.lineTo(x + 24, H + 4); c.closePath(); c.fillStyle = DK; c.fill(); }
      for (let x = 0; x < W; x += 92) ln(c, [x, PY + 2, x, PY + 14], 'rgba(10,6,14,.4)', 1.4);
    },
  });
  /* correntes penduradas com lanternas apagadas nos cantos do alto */
  [[W * 0.2, 118], [W * 0.8, 112]].forEach(function (t) {
    for (let y = AH - 4; y < t[1]; y += 7) { c.beginPath(); c.ellipse(t[0], y, 2.4, 3.8, 0, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#8a8494'; c.lineWidth = 1.2; c.stroke(); }
    cel(c, function (c) { poly(c, [t[0] - 8, t[1], t[0] + 8, t[1], t[0] + 6, t[1] + 16, t[0] - 6, t[1] + 16]); }, '#3a3440', { k: 1.4, lw: 2.2, inn: function (c) { c.fillStyle = 'rgba(255,200,110,.6)'; c.fillRect(t[0] - 4, t[1] + 3, 8, 10); } });
    radial(c, t[0], t[1] + 8, 40, '255,190,100', 0.35, 'lighter');
  });
}

/** Fundo da tela da Torre: uma torre altíssima de pedra e raízes subindo até as nuvens, à noite. A faixa central fica limpa. */
function backdrop(c, w, h) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  const W = w / u, H = h / u, R = rng(4242), cx = W / 2;
  /* céu */
  let q = c.createLinearGradient(0, 0, 0, H); q.addColorStop(0, '#080a20'); q.addColorStop(0.45, '#17183c'); q.addColorStop(0.8, '#2c2756'); q.addColorStop(1, '#3a2f5a'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  for (let i = 0; i < Math.round(W * H / 2400); i++) { const x = R() * W, y = R() * H * 0.8, r = 0.5 + R() * R() * 1.8; dot(c, x, y, r, 'rgba(255,250,225,' + (0.25 + R() * 0.7) * (1 - y / H * 0.6) + ')'); }
  for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H * 0.6, r = 4 + R() * 4; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fillStyle = 'rgba(255,250,225,.85)'; c.fill(); }
  /* lua */
  const mx = Math.min(cx - 330, W * 0.2), my = Math.min(H * 0.18, 160);
  radial(c, mx, my, 220, '220,230,255', 0.22, 'lighter');
  cel(c, function (c) { el(c, mx, my, 54, 54); }, '#f4f0dc', { k: 6, lw: 2.6, sh: 'rgba(120,120,160,.35)', hi: 'rgba(255,255,255,.4)', inn: function (c) { [[-16, -10, 10], [14, 12, 8], [8, -22, 5], [-20, 20, 6]].forEach(function (q2) { c.beginPath(); c.arc(mx + q2[0], my + q2[1], q2[2], 0, TAU); c.fillStyle = 'rgba(170,166,170,.35)'; c.fill(); }); } });
  /* nuvens distantes */
  const cloud = function (x, y, s, col, a) { c.save(); c.globalAlpha = a; c.beginPath(); for (let i = 0; i < 7; i++) { const bx = x + (i - 3) * 34 * s, by = y - Math.sin(i / 6 * PI) * 22 * s, r = (26 + (i % 3) * 8) * s; c.moveTo(bx + r, by); c.arc(bx, by, r, 0, TAU); } c.fillStyle = col; c.fill(); c.restore(); };
  for (let i = 0; i < 8; i++) cloud(R() * W, H * (0.35 + R() * 0.3), 0.8 + R() * 0.8, '#3c3870', 0.45);
  /* morros e mata no horizonte */
  const hz = H * 0.86;
  [['#1e1b3a', -60, 50], ['#141228', -10, 30]].forEach(function (L, n) {
    c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W + 20; x += 20) c.lineTo(x, hz + L[1] + Math.sin(x * 0.006 + n * 2) * L[2] + Math.sin(x * 0.021 + n) * 12); c.lineTo(W, H); c.closePath(); c.fillStyle = L[0]; c.fill();
    for (let i = 0; i < 40; i++) { const x = R() * W, y = hz + L[1] + Math.sin(x * 0.006 + n * 2) * L[2] + 6, r = 18 + R() * 26; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = L[0]; c.fill(); }
  });
  /* a torre */
  const TW = Math.max(260, Math.min(440, W * 0.3)), base = H - 30, top = -40, half = function (y) { const t = (base - y) / (base - top); return TW * (0.58 - t * 0.14); };
  const edge = function (sd) { const P = []; for (let y = base; y >= top; y -= 20) P.push([cx + sd * half(y), y]); return P; };
  const L = edge(-1), Rr = edge(1);
  radial(c, cx, H * 0.5, TW * 1.4, '120,110,200', 0.12, 'lighter');
  c.beginPath(); L.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); for (let i = Rr.length - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath();
  q = c.createLinearGradient(cx - TW * 0.6, 0, cx + TW * 0.6, 0); q.addColorStop(0, '#6e6a86'); q.addColorStop(0.3, '#55526c'); q.addColorStop(0.7, '#3e3b52'); q.addColorStop(1, '#25233a'); c.fillStyle = q; c.fill();
  c.save(); c.clip();
  /* blocos de pedra: mais marcados nas laterais, quase lisos na faixa central */
  for (let y = base, r = 0; y > top; y -= 34, r++) {
    const hw = half(y); for (let x = cx - hw - ((r % 2) * 40); x < cx + hw; x += 80) {
      const d = Math.abs(x + 40 - cx) / hw, a = d < 0.42 ? 0.06 : 0.3;
      c.strokeStyle = 'rgba(14,10,24,' + a + ')'; c.lineWidth = 2; c.strokeRect(x, y - 34, 80, 34);
      if (d > 0.42) { c.fillStyle = 'rgba(255,255,255,' + (R() * 0.05) + ')'; c.fillRect(x + 2, y - 32, 76, 30); }
    }
  }
  /* faixa central: painel liso e um pouco mais claro */
  const fw = TW * 0.36; q = c.createLinearGradient(cx - fw, 0, cx + fw, 0); q.addColorStop(0, 'rgba(20,16,36,0)'); q.addColorStop(0.15, 'rgba(20,16,36,.25)'); q.addColorStop(0.85, 'rgba(20,16,36,.25)'); q.addColorStop(1, 'rgba(20,16,36,0)'); c.fillStyle = q; c.fillRect(cx - fw, top, fw * 2, base - top);
  /* cornijas a cada andar grande */
  for (let y = base - 150; y > top; y -= 190) { const hw = half(y); c.fillStyle = 'rgba(10,8,20,.45)'; c.fillRect(cx - hw, y, hw * 2, 8); c.fillStyle = 'rgba(200,190,240,.12)'; c.fillRect(cx - hw, y - 3, hw * 2, 3); }
  /* sombra do lado direito, luz da lua do esquerdo */
  q = c.createLinearGradient(cx - TW * 0.6, 0, cx - TW * 0.4, 0); q.addColorStop(0, 'rgba(220,226,255,.22)'); q.addColorStop(1, 'rgba(220,226,255,0)'); c.fillStyle = q; c.fillRect(cx - TW * 0.6, top, TW * 0.2, base - top);
  c.restore();
  c.beginPath(); L.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke();
  c.beginPath(); Rr.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); }); c.stroke();
  /* janelas acesas, só perto das bordas */
  for (let y = base - 90; y > top + 40; y -= 110) {
    const hw = half(y);
    [-1, 1].forEach(function (sd, n) {
      if (R() < 0.25) return; const x = cx + sd * hw * 0.78, ww = 12, wh = 22;
      radial(c, x, y, 40, '255,190,100', 0.3, 'lighter');
      c.beginPath(); c.moveTo(x - ww / 2, y + wh / 2); c.lineTo(x - ww / 2, y - wh / 2 + ww / 2); c.arc(x, y - wh / 2 + ww / 2, ww / 2, PI, 0); c.lineTo(x + ww / 2, y + wh / 2); c.closePath(); c.fillStyle = '#ffc86a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.4; c.stroke();
      ln(c, [x, y - wh / 2 + 2, x, y + wh / 2], '#7a4a2a', 1.4);
    });
  }
  /* raízes subindo pelas bordas da torre, sem entrar na faixa do meio */
  const vine = function (sd, ph, w0, col) {
    const P = []; for (let y = base + 20; y > top; y -= 8) { const hw = half(y), t = (base - y) / (base - top); P.push([cx + sd * (hw + Math.sin(y * 0.012 + ph) * hw * 0.2 - hw * 0.06), y, w0 * (1 - t * 0.75)]); }
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < P.length - 1; i++) { c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[i + 1][0], P[i + 1][1]); c.lineWidth = pass === 0 ? P[i][2] + 4 : pass === 1 ? P[i][2] : P[i][2] * 0.25; c.strokeStyle = pass === 0 ? OUT : pass === 1 ? col : 'rgba(255,220,170,.22)'; c.lineCap = 'round'; c.stroke(); }
    for (let i = 4; i < P.length; i += 7) { c.save(); c.translate(P[i][0], P[i][1]); c.rotate(sd > 0 ? -0.4 + (i % 2) * 0.8 : PI + 0.4 - (i % 2) * 0.8); cel(c, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(10, -9, 22, 0); c.quadraticCurveTo(10, 9, 0, 0); c.closePath(); }, i % 3 ? '#2f6a40' : '#3f8a48', { k: 1, lw: 1.8 }); c.restore(); }
  };
  vine(-1, 0, 26, '#5d4632'); vine(1, 2.1, 24, '#4e3c2c'); vine(-1, 3.4, 13, '#6a4e34'); vine(1, 5, 13, '#5d4632');
  /* raízes da base se espalhando pelo chão */
  const RB = rng(99);
  for (let i = 0; i < 6; i++) { const sd = i % 2 ? 1 : -1; root(c, RB, cx + sd * half(base) * 0.8, base - 10, sd > 0 ? 0.15 + i * 0.05 : PI - 0.15 - i * 0.05, 140 + RB() * 120, 20 - i * 2, '#4e3c2c'); }
  c.beginPath(); c.ellipse(cx, base + 8, half(base) * 1.3, 18, 0, 0, TAU); c.fillStyle = 'rgba(8,6,16,.5)'; c.fill();
  /* nuvens altas: a torre some dentro delas */
  for (let i = 0; i < 6; i++) cloud(cx + (i - 2.5) * 140 + (RB() - 0.5) * 60, 70 + RB() * 70, 1.3 + RB() * 0.5, '#4a4680', 0.55);
  q = c.createLinearGradient(0, 0, 0, 220); q.addColorStop(0, 'rgba(60,56,110,.85)'); q.addColorStop(1, 'rgba(60,56,110,0)'); c.fillStyle = q; c.fillRect(0, 0, W, 220);
  radial(c, cx, 0, TW, '255,230,170', 0.22, 'lighter');
  for (let i = 0; i < 5; i++) cloud(cx + (i - 2) * 170, 30 + RB() * 30, 1.5, '#5a5694', 0.4);
  /* vaga-lumes */
  for (let i = 0; i < 30; i++) { const x = RB() * W, y = H * (0.6 + RB() * 0.38), r = 1 + RB() * 1.6; radial(c, x, y, r * 6, '220,255,150', 0.25, 'lighter'); dot(c, x, y, r, 'rgba(240,255,190,.9)'); }
  /* vinheta */
  q = c.createRadialGradient(cx, H / 2, Math.min(W, H) * 0.35, cx, H / 2, Math.hypot(W, H) * 0.6); q.addColorStop(0, 'rgba(4,4,12,0)'); q.addColorStop(1, 'rgba(4,4,12,.6)'); c.fillStyle = q; c.fillRect(0, 0, W, H);
  c.restore();
}

export const TORRE = { ground, canopy, backdrop };
