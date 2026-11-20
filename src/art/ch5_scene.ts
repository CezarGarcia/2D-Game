// @ts-nocheck
/* Cenário do Capítulo 5 · Selva Profunda: chão das arenas (folhas e raízes enormes; ruína de pedra
   antiga com musgo; igarapé raso), a moldura por cima (troncos gigantes, cipós, folhas grandes) e o
   mapa ilustrado do capítulo. Tons escuros e saturados (verde-azulado); a área jogável
   (x 120–1160, y 150–640) só recebe detalhe de chão. Tudo determinístico pela semente. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, rng } from './ch5_util';

const AREA = { x0: 120, y0: 150, x1: 1160, y1: 640 };
const LEAF = ['#3b4a26', '#4f4322', '#2c4f3e', '#5c4426', '#244a40', '#3f5a2c', '#6a5228'];

function blobPath(g, x, y, rx, ry, rot, r, k) {
  const n = r.length, P = [], co = Math.cos(rot), si = Math.sin(rot); k = k == null ? 1 : k;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = Math.cos(a) * rx * r[i] * k, py = Math.sin(a) * ry * r[i] * k; P.push([x + px * co - py * si, y + px * si + py * co]); }
  g.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2);
  for (let i = 0; i < n; i++) { const q = P[(i + 1) % n]; g.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); }
  g.closePath();
}
function shape(R, n, jit) { const r = []; for (let i = 0; i < n; i++) r.push(1 - jit + R() * jit * 2); return r; }
function radial(g, x, y, r, rgb, a, op) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); q.addColorStop(1, 'rgba(' + rgb + ',0)'); g.save(); if (op) g.globalCompositeOperation = op; g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
/* folha seca caída: só preenchimento e nervura (barato, vai às centenas) */
function leaf(g, x, y, s, rot, col) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.moveTo(-7 * s, 0); g.quadraticCurveTo(0, -4.6 * s, 8 * s, 0); g.quadraticCurveTo(0, 4.6 * s, -7 * s, 0); g.closePath(); g.fillStyle = col; g.fill();
  g.strokeStyle = 'rgba(8,14,10,.45)'; g.lineWidth = .9; g.stroke(); g.beginPath(); g.moveTo(-6 * s, 0); g.lineTo(7 * s, 0); g.strokeStyle = 'rgba(8,14,10,.35)'; g.lineWidth = .7; g.stroke();
  g.restore();
}
function moss(g, R, x, y, rx, ry) {
  const r = shape(R, 10, .3), rot = R() * TAU;
  g.beginPath(); blobPath(g, x, y, rx, ry, rot, r, 1); g.fillStyle = 'rgba(60,110,64,.42)'; g.fill();
  g.beginPath(); blobPath(g, x - rx * .1, y - ry * .1, rx * .7, ry * .7, rot, r, 1); g.fillStyle = 'rgba(96,150,84,.3)'; g.fill();
  for (let i = 0; i < rx * ry / 60; i++) { const a = R() * TAU, d = Math.sqrt(R()); dot(g, x + Math.cos(a) * rx * d * .9, y + Math.sin(a) * ry * d * .9, .8 + R() * 1.1, R() < .5 ? 'rgba(140,190,110,.35)' : 'rgba(20,50,30,.35)'); }
}
/* raiz enorme rasteira: afina, ondula, com musgo por cima */
function root(g, R, x, y, ang, len, w, col) {
  const n = 16, P = []; let a = ang, px = x, py = y; const wig = .5 + R() * .5, ph = R() * 6;
  for (let i = 0; i <= n; i++) { P.push([px, py]); a = ang + Math.sin(ph + i * .7) * .38 * wig; px += Math.cos(a) * len / n; py += Math.sin(a) * len / n * .85; }
  const wd = function (i) { return Math.max(1, w * (1 - i / (n + 2))); };
  const pass = function (colr, kk, off, dx) { for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(P[i][0] + (dx || 0), P[i][1] + off); g.lineTo(P[i + 1][0] + (dx || 0), P[i + 1][1] + off); g.strokeStyle = colr; g.lineWidth = wd(i) * kk; g.lineCap = 'round'; g.stroke(); } };
  pass('rgba(2,8,8,.4)', 1.25, w * .35, w * .15); pass(OUT, 1, 0); pass(col || '#4a3e2e', .78, 0); pass('rgba(70,120,70,.55)', .4, -w * .2); pass('rgba(220,200,150,.14)', .14, -w * .3);
  [4, 8, 11].forEach(function (i) { const d = (i % 2 ? 1 : -1) * (.8 + R() * .5), l = len * .2, ex = P[i][0] + Math.cos(ang + d) * l, ey = P[i][1] + Math.sin(ang + d) * l * .8; ln(g, [P[i][0], P[i][1], ex, ey], OUT, wd(i) * .4); ln(g, [P[i][0], P[i][1], ex, ey], col || '#4a3e2e', wd(i) * .24); });
}
/* pé de árvore gigante com sapopemas, visto de cima/lado: sai pelo alto da tela */
function giant(g, R, x, y, s) {
  const T = Math.max(260 * s, y + 40);
  g.beginPath(); g.ellipse(x + 30 * s, y + 6 * s, 90 * s, 22 * s, .06, 0, TAU); g.fillStyle = 'rgba(2,8,8,.45)'; g.fill();
  [[-1, 80, 10], [1, 86, 8], [-1, 52, 20], [1, 60, 18]].forEach(function (q) {
    cel(g, function (c) { c.moveTo(x + q[0] * 14 * s, y - 70 * s); c.quadraticCurveTo(x + q[0] * q[1] * .5 * s, y - 30 * s, x + q[0] * q[1] * s, y + q[2] * .4 * s); c.quadraticCurveTo(x + q[0] * q[1] * .5 * s, y + 6 * s, x + q[0] * 6 * s, y + 4 * s); c.closePath(); }, '#3c3428', { k: 3, lw: 2.6, sh: 'rgba(4,6,8,.45)', hi: 'rgba(200,190,150,.14)', inn: function (c) { c.fillStyle = 'rgba(70,120,70,.6)'; c.beginPath(); c.ellipse(x + q[0] * q[1] * .5 * s, y - 24 * s, 9 * s, 16 * s, q[0] * .5, 0, TAU); c.fill(); } });
  });
  cel(g, function (c) { c.moveTo(x - 24 * s, y + 4 * s); c.quadraticCurveTo(x - 20 * s, y - 60 * s, x - 20 * s, y - T); c.lineTo(x + 20 * s, y - T); c.quadraticCurveTo(x + 22 * s, y - 60 * s, x + 26 * s, y + 4 * s); c.closePath(); }, '#41382b', {
    k: 4, lw: 2.8, sh: 'rgba(4,6,8,.5)', hi: 'rgba(200,190,150,.14)', inn: function (c) {
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * 6 * s, y - T); c.bezierCurveTo(x + (i * 6 + 4) * s, y - 160 * s, x + (i * 6 - 4) * s, y - 60 * s, x + i * 7.4 * s, y); c.strokeStyle = 'rgba(14,10,6,.5)'; c.lineWidth = 1.4; c.stroke(); }
      c.fillStyle = 'rgba(64,118,68,.7)'; c.beginPath(); c.ellipse(x - 12 * s, y - 40 * s, 8 * s, 30 * s, .1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 10 * s, y - 120 * s, 6 * s, 22 * s, 0, 0, TAU); c.fill();
    },
  });
}
/* tufo de samambaia (borda) */
function fern(g, R, x, y, s) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 3 * s, 30 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(2,8,8,.35)'; g.fill();
  for (let j = 0; j < 9; j++) {
    const a = -Math.PI + .2 + j * .34 + (R() - .5) * .2, l = (26 + R() * 18) * s, ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l * .7;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5, y + Math.sin(a) * l * .5 - 6 * s, ex, ey); g.strokeStyle = OUT; g.lineWidth = 3.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#2f6a3e'; g.lineWidth = 1.6; g.stroke();
    for (let m = 1; m < 7; m++) { const u = m / 7, px = x + (ex - x) * u, py = y + (ey - y) * u - Math.sin(u * Math.PI) * 5 * s, ll = (7 - m * .7) * s; [-1, 1].forEach(function (sd) { const qa = a + sd * 1.2; g.beginPath(); g.ellipse(px + Math.cos(qa) * ll * .5, py + Math.sin(qa) * ll * .5, ll * .6, ll * .22, qa, 0, TAU); g.fillStyle = (m + j) % 2 ? '#3f8a50' : '#2c6e42'; g.fill(); }); }
  }
}
/* cogumelos que brilham no escuro */
function shrooms(g, R, x, y, s) {
  radial(g, x, y - 4 * s, 26 * s, '120,240,210', .22, 'lighter');
  for (let j = 0; j < 4; j++) {
    const px = x + (R() - .5) * 16 * s, py = y + (R() - .5) * 6 * s, h = (5 + R() * 6) * s, r = (3 + R() * 3) * s;
    ln(g, [px, py, px, py - h], OUT, 2.6 * s); ln(g, [px, py, px, py - h], '#cfe8dc', 1.2 * s);
    cel(g, function (c) { c.moveTo(px - r, py - h + 1); c.quadraticCurveTo(px, py - h - r * 1.3, px + r, py - h + 1); c.closePath(); }, '#7fe8cf', { k: .6, lw: 1.4, hi: 'rgba(240,255,250,.6)', inn: function (c) { dot(c, px - r * .3, py - h - r * .3, .8, 'rgba(255,255,255,.8)'); } });
  }
}
function rock(g, x, y, s, col) {
  g.beginPath(); g.ellipse(x + 4 * s, y + 2 * s, 26 * s, 8 * s, 0, 0, TAU); g.fillStyle = 'rgba(2,8,8,.38)'; g.fill();
  cel(g, function (c) { poly(c, [x - 20 * s, y, x - 16 * s, y - 13 * s, x - 3 * s, y - 21 * s, x + 13 * s, y - 16 * s, x + 21 * s, y - 3 * s, x + 18 * s, y]); }, col || '#5e6660', {
    k: 2.4, sh: 'rgba(4,8,10,.4)', inn: function (c) { c.fillStyle = 'rgba(70,128,76,.9)'; c.beginPath(); c.ellipse(x - 3 * s, y - 19 * s, 13 * s, 5 * s, -.15, 0, TAU); c.fill(); ln(c, [x + 4 * s, y - 14 * s, x + 7 * s, y - 6 * s, x + 5 * s, y - 2 * s], 'rgba(10,14,16,.45)', 1.1); },
  });
}
/* bloco de pedra antiga entalhado (ruína) */
function block(g, R, x, y, w, h, s) {
  g.beginPath(); g.ellipse(x + w * .5 + 6, y + 4, w * .62, 10 * s, 0, 0, TAU); g.fillStyle = 'rgba(2,8,8,.42)'; g.fill();
  cel(g, function (c) { poly(c, [x, y, x + 3, y - h, x + w - 2, y - h - 3, x + w, y - 2]); }, '#6b6f66', {
    k: 3, lw: 2.4, sh: 'rgba(4,8,10,.42)', hi: 'rgba(220,226,200,.16)', inn: function (c) {
      /* espiral entalhada com resto de âmbar */
      const cx = x + w * .5, cy = y - h * .5; c.beginPath(); for (let i = 0; i < 40; i++) { const a = i * .45, r = 1 + i * .32 * s; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.strokeStyle = 'rgba(20,22,20,.6)'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(217,164,65,.5)'; c.lineWidth = .8; c.stroke();
      c.fillStyle = 'rgba(64,118,68,.85)'; c.beginPath(); c.ellipse(x + w * .4, y - h, w * .5, 6 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 4, y - h * .3, 6 * s, h * .3, 0, 0, TAU); c.fill();
      ln(c, [x + w * .75, y - h, x + w * .68, y - h * .6, x + w * .8, y - h * .3], 'rgba(10,14,12,.5)', 1.3);
    },
  });
}
/* laje do piso antigo, rente ao chão (vai dentro da área) */
function slab(g, R, x, y, w, h, rot) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.beginPath(); g.rect(-w / 2 + 3, -h / 2 + 4, w, h); g.fillStyle = 'rgba(2,8,8,.3)'; g.fill();
  g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(96,104,94,.55)'; g.fill(); g.strokeStyle = 'rgba(10,16,14,.7)'; g.lineWidth = 2; g.stroke();
  g.beginPath(); g.rect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6); g.strokeStyle = 'rgba(190,200,170,.12)'; g.lineWidth = 1.4; g.stroke();
  if (R() < .6) ln(g, [-w * .3, -h / 2, -w * .1, 0, -w * .2, h / 2], 'rgba(10,16,14,.55)', 1.2);
  g.beginPath(); g.ellipse(w * (R() - .5) * .6, h * .4, w * .3, 4, 0, 0, TAU); g.fillStyle = 'rgba(70,130,72,.45)'; g.fill();
  g.restore();
}
/* coluna tombada (borda) */
function column(g, R, x, y, len, ang) {
  g.save(); g.translate(x, y); g.rotate(ang);
  g.beginPath(); g.ellipse(len * .5 + 6, 10, len * .55, 10, 0, 0, TAU); g.fillStyle = 'rgba(2,8,8,.42)'; g.fill();
  cel(g, function (c) { cap(c, 0, 0, len, 0, 14); }, '#6b6f66', { k: 3, lw: 2.6, sh: 'rgba(4,8,10,.42)', inn: function (c) { for (let i = 1; i < 4; i++) ln(c, [len * i / 4, -14, len * i / 4 + 2, 14], 'rgba(10,14,12,.5)', 1.6); c.fillStyle = 'rgba(64,118,68,.8)'; c.beginPath(); c.ellipse(len * .4, -10, len * .3, 5, 0, 0, TAU); c.fill(); } });
  cel(g, function (c) { el(c, len, 0, 6, 14); }, '#80847a', { k: 1, lw: 2.2, inn: function (c) { c.beginPath(); c.ellipse(len, 0, 3, 8, 0, 0, TAU); c.strokeStyle = 'rgba(10,14,12,.4)'; c.lineWidth = 1; c.stroke(); } });
  g.restore();
}

/** Chão da arena. `variant` 0 = folhas e raízes; 1 = ruína de pedra com musgo; 2 = igarapé raso. */
export function paintGround(g, W, H, variant, seed) {
  const v = (((variant | 0) % 3) + 3) % 3, R = rng((seed || 31) * 13 + v * 7919);
  g.save(); g.scale(W / 1280, H / 720); W = 1280; H = 720;
  const A = AREA, aw = A.x1 - A.x0, ah = A.y1 - A.y0, inA = function (m) { m = m || 40; return [A.x0 + m + R() * (aw - m * 2), A.y0 + m + R() * (ah - m * 2)]; };
  const BASE = [['#2f4d40', '#1f392f', '#0a1815'], ['#34493f', '#22382f', '#0b1716'], ['#2a4a40', '#1b3630', '#081614']][v];
  let q = g.createRadialGradient(W * .5, H * .54, 60, W * .5, H * .5, W * .7); q.addColorStop(0, BASE[0]); q.addColorStop(.55, BASE[1]); q.addColorStop(1, BASE[2]); g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (let j = 0; j < 46; j++) { g.beginPath(); g.ellipse(R() * W, R() * H, 60 + R() * 120, 24 + R() * 44, R() * 3, 0, TAU); g.fillStyle = j % 2 ? 'rgba(4,14,12,.18)' : 'rgba(110,140,90,.06)'; g.fill(); }
  for (let j = 0; j < 9; j++) { const p = inA(); moss(g, R, p[0], p[1], 50 + R() * 90, 22 + R() * 30); }
  const items = [];
  const edge = function (n, fn, sMin, sMax) {
    for (let j = 0; j < n; j++) {
      const side = Math.floor(R() * 4); let x, y;
      if (side === 0) { x = A.x0 + R() * aw; y = A.y0 - 22 - R() * 60; } else if (side === 1) { x = A.x0 + R() * aw; y = A.y1 + 40 + R() * 36; }
      else if (side === 2) { x = A.x0 - 30 - R() * 70; y = A.y0 + R() * ah; } else { x = A.x1 + 30 + R() * 70; y = A.y0 + R() * ah; }
      const s = sMin + R() * (sMax - sMin); items.push({ y, d: function () { fn(x, y, s); } });
    }
  };
  if (v === 2) {
    /* igarapé: faixa d'água rasa cruzando a arena na diagonal */
    const ph = R() * 6, cx = function (y) { return W * (.38 + .2 * (y / H)) + Math.sin(y * .012 + ph) * 60; };
    const band = function (hw, dx) { g.beginPath(); for (let y = -20; y <= H + 20; y += 20) g[y < -19 ? 'moveTo' : 'lineTo'](cx(y) - hw(y) + (dx || 0), y); for (let y = H + 20; y >= -20; y -= 20) g.lineTo(cx(y) + hw(y) + (dx || 0), y); g.closePath(); };
    const hw = function (y) { return 92 + 22 * Math.sin(y * .02 + ph * 2); };
    band(function (y) { return hw(y) + 22; }); g.fillStyle = 'rgba(60,46,30,.5)'; g.fill();
    band(hw); q = g.createLinearGradient(0, 0, W, 0); q.addColorStop(0, '#173f44'); q.addColorStop(.5, '#1d5154'); q.addColorStop(1, '#173f44'); g.fillStyle = q; g.fill();
    band(function (y) { return hw(y) * .45; }); g.fillStyle = 'rgba(20,70,76,.6)'; g.fill();
    /* fundo de areia e seixos aparecendo */
    for (let j = 0; j < 70; j++) { const y = R() * H, x = cx(y) + (R() - .5) * hw(y) * 1.6; dot(g, x, y, 1.5 + R() * 3, R() < .5 ? 'rgba(160,150,110,.25)' : 'rgba(10,30,32,.3)'); }
    for (let j = 0; j < 60; j++) { const y = R() * H, x = cx(y) + (R() - .5) * hw(y) * 1.7, l = 14 + R() * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * .5, y - 3, x + l, y); g.strokeStyle = 'rgba(200,240,236,.16)'; g.lineWidth = 1.5; g.lineCap = 'round'; g.stroke(); }
    [-1, 1].forEach(function (sd) { g.beginPath(); for (let y = -20; y <= H + 20; y += 20) g[y < -19 ? 'moveTo' : 'lineTo'](cx(y) + sd * hw(y), y); g.strokeStyle = 'rgba(200,240,236,.35)'; g.lineWidth = 2.2; g.stroke(); });
    /* pedras chatas para atravessar e folhas boiando */
    for (let j = 0; j < 7; j++) { const y = A.y0 + 30 + j * (ah - 60) / 6 + (R() - .5) * 20, x = cx(y) + (R() - .5) * 60; g.beginPath(); g.ellipse(x + 2, y + 3, 22, 10, R(), 0, TAU); g.fillStyle = 'rgba(4,14,16,.4)'; g.fill(); cel(g, function (c) { el(c, x, y, 20 + R() * 6, 9 + R() * 3, R() - .5); }, '#5b6660', { k: 2, lw: 1.8, sh: 'rgba(4,10,12,.4)', inn: function (c) { c.fillStyle = 'rgba(70,128,76,.6)'; c.beginPath(); c.ellipse(x - 4, y - 3, 9, 3, 0, 0, TAU); c.fill(); } }); g.beginPath(); g.ellipse(x, y + 2, 26, 12, 0, .2, 2.9); g.strokeStyle = 'rgba(200,240,236,.3)'; g.lineWidth = 1.4; g.stroke(); }
    for (let j = 0; j < 30; j++) { const y = R() * H, x = cx(y) + (R() - .5) * hw(y) * 1.5; leaf(g, x, y, 1 + R() * .5, R() * 6, LEAF[j % LEAF.length]); }
  }
  if (v === 1) {
    /* piso de lajes antigas, meio enterrado */
    for (let j = 0; j < 26; j++) { const p = inA(30), w = 50 + R() * 50; slab(g, R, p[0], p[1], w, w * (.55 + R() * .3), (R() - .5) * .3); }
    for (let j = 0; j < 5; j++) { const p = inA(); moss(g, R, p[0], p[1], 40 + R() * 50, 16 + R() * 20); }
  }
  /* folhiço: centenas de folhas caídas, escuras e de pouco contraste */
  for (let j = 0; j < (v === 0 ? 700 : 420); j++) { const x = R() * W, y = R() * H; leaf(g, x, y, .9 + R() * .9, R() * 6, LEAF[Math.floor(R() * LEAF.length)]); }
  for (let j = 0; j < 500; j++) dot(g, R() * W, R() * H, .7 + R() * 1.2, R() < .6 ? 'rgba(4,10,8,.4)' : 'rgba(170,190,140,.16)');
  /* raízes enormes entrando pelas bordas */
  const nr = v === 0 ? 20 : 12;
  for (let j = 0; j < nr; j++) {
    const side = j % 4; let x, y, an;
    if (side === 0) { x = A.x0 + R() * aw; y = A.y0 - 50 - R() * 30; an = 1.2 + R() * .8; } else if (side === 1) { x = A.x0 + R() * aw; y = A.y1 + 60 + R() * 20; an = -1.2 - R() * .8; }
    else if (side === 2) { x = A.x0 - 70 - R() * 30; y = A.y0 + R() * ah; an = (R() - .5) * .9; } else { x = A.x1 + 70 + R() * 30; y = A.y0 + R() * ah; an = Math.PI + (R() - .5) * .9; }
    const l = (side < 2 ? 90 : 130) + R() * (v === 0 ? 120 : 70), w = (v === 0 ? 16 : 11) + R() * 8;
    items.push({ y: -900 + j, d: function () { root(g, R, x, y, an, l, w); } });
  }
  edge(10, function (x, y, s) { fern(g, R, x, y, s); }, .9, 1.3);
  edge(6, function (x, y, s) { shrooms(g, R, x, y, s); }, .9, 1.4);
  edge(v === 1 ? 5 : 7, function (x, y, s) { rock(g, x, y, s); }, .9, 1.5);
  if (v === 1) {
    [[A.x0 - 110, A.y0 + 40, 90, 70], [A.x1 + 20, A.y0 + 220, 96, 80], [W * .44, A.y0 - 70, 110, 56], [A.x0 - 90, A.y1 - 30, 84, 60], [W * .72, A.y1 + 40, 120, 50]].forEach(function (b) { items.push({ y: b[1], d: function () { block(g, R, b[0], b[1], b[2], b[3], 1); } }); });
    items.push({ y: A.y0 - 40, d: function () { column(g, R, W * .14, A.y0 - 46, 150, .08); } });
    items.push({ y: A.y1 + 60, d: function () { column(g, R, W * .5, A.y1 + 64, 170, -.04); } });
  }
  [[A.x0 - 70, A.y0 + 60, 1.25], [A.x0 - 80, A.y1 - 40, 1.1], [A.x1 + 74, A.y0 + 120, 1.3], [A.x1 + 64, A.y1 + 10, 1.15], [W * .3, A.y0 - 56, 1], [W * .78, A.y0 - 50, 1.05]].forEach(function (t) { items.push({ y: t[1], d: function () { giant(g, R, t[0], t[1], t[2]); } }); });
  items.sort(function (a, b) { return a.y - b.y; }).forEach(function (it) { it.d(); });
  /* vaga-lumes e esporos no ar, de leve */
  for (let j = 0; j < 26; j++) { const x = R() * W, y = R() * H, ins = x > A.x0 && x < A.x1 && y > A.y0 && y < A.y1; if (ins && R() < .7) continue; radial(g, x, y, 8, '220,255,150', .25, 'lighter'); dot(g, x, y, 1.3, 'rgba(240,255,190,.9)'); }
  q = g.createRadialGradient(W / 2, H / 2, H * .4, W / 2, H / 2, W * .66); q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(1, 'rgba(2,8,10,.62)'); g.fillStyle = q; g.fillRect(0, 0, W, H);
  g.restore();
}

/* ---------------- moldura ---------------- */
/* folha grande de costela-de-adão, com recortes */
function monstera(g, x, y, ang, len, col) {
  g.save(); g.translate(x, y); g.rotate(ang);
  const wd = len * .42;
  g.beginPath(); g.ellipse(len * .55 + 10, 14, len * .55, wd, 0, 0, TAU); g.fillStyle = 'rgba(2,8,8,.32)'; g.fill();
  cel(g, function (c) { c.moveTo(0, 0); c.bezierCurveTo(len * .25, -wd * 1.1, len * .85, -wd * .9, len, 0); c.bezierCurveTo(len * .85, wd * .9, len * .25, wd * 1.1, 0, 0); c.closePath(); }, col, {
    k: 3, lw: 2.6, sh: 'rgba(2,20,16,.42)', hi: 'rgba(200,255,200,.14)', inn: function (c) {
      ln(c, [0, 0, len, 0], 'rgba(150,200,140,.45)', 2.2);
      for (let j = 1; j < 7; j++) { const u = j / 7, x2 = len * u; ln(c, [x2, 0, x2 + len * .12, -wd * .8], 'rgba(150,200,140,.3)', 1.2); ln(c, [x2, 0, x2 + len * .12, wd * .8], 'rgba(150,200,140,.3)', 1.2); }
      /* recortes e furos */
      c.fillStyle = 'rgba(0,0,0,1)'; c.globalCompositeOperation = 'destination-out';
      for (let j = 2; j < 6; j++) { const x2 = len * j / 7 + len * .06; [-1, 1].forEach(function (sd) { c.beginPath(); c.moveTo(x2, sd * wd * 1.1); c.lineTo(x2 + len * .03, sd * wd * .45); c.lineTo(x2 + len * .07, sd * wd * 1.1); c.closePath(); c.fill(); c.beginPath(); c.ellipse(x2 - len * .02, sd * wd * .3, len * .025, wd * .08, 0, 0, TAU); c.fill(); }); }
      c.globalCompositeOperation = 'source-over';
    },
  });
  g.restore();
}
function vine(g, R, x, len, sway) {
  const pt = function (u) { const v2 = 1 - u, ex = x + sway; return [v2 * v2 * x + 2 * v2 * u * (x + sway * 1.6) + u * u * ex, -12 * v2 * v2 + 2 * v2 * u * len * .5 + u * u * len]; };
  g.beginPath(); for (let j = 0; j <= 16; j++) { const p = pt(j / 16); g[j ? 'lineTo' : 'moveTo'](p[0], p[1]); } g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = OUT; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#3e5a30'; g.lineWidth = 2.6; g.stroke();
  const n = Math.floor(len / 18);
  for (let j = 1; j <= n; j++) { const p = pt(j / (n + .4)), sd = j % 2 ? 1 : -1, an = (sd > 0 ? .5 : Math.PI - .5) + (R() - .5) * .5, l = 10 + R() * 6; g.save(); g.translate(p[0], p[1]); g.rotate(an); cel(g, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(l * .5, -l * .5, l, 0); c.quadraticCurveTo(l * .5, l * .5, 0, 0); c.closePath(); }, j % 3 ? '#2f6e40' : '#3f8248', { k: 1, lw: 1.7, sh: 'rgba(4,30,20,.4)' }); g.restore(); }
}
/** Moldura da Selva Profunda: troncos gigantes nas laterais, cipós e folhões; centro transparente. */
export function paintCanopy(g, W, H, seed) {
  const R = rng(seed || 77);
  g.save(); g.scale(W / 1280, H / 720); W = 1280; H = 720;
  /* troncos gigantes nas laterais, de alto a baixo */
  [[-30, 70, 0], [W + 30, 74, 1]].forEach(function (t) {
    const x = t[0], w = t[1], sd = t[2] ? -1 : 1;
    g.beginPath(); g.rect(x - w + sd * 30, -10, w * 2, H + 20); g.fillStyle = 'rgba(2,8,8,.35)'; g.fill();
    cel(g, function (c) { c.moveTo(x - w, -10); c.lineTo(x + w, -10); c.bezierCurveTo(x + w - 8, H * .4, x + w + 10, H * .7, x + w + 20, H + 10); c.lineTo(x - w - 20, H + 10); c.bezierCurveTo(x - w, H * .6, x - w + 6, H * .3, x - w, -10); c.closePath(); }, '#2e2a22', {
      k: 6, lw: 3, sh: 'rgba(0,4,6,.5)', hi: 'rgba(200,190,150,.12)', inn: function (c) {
        for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(x + i * 14, -10); c.bezierCurveTo(x + i * 16 + 8, H * .3, x + i * 14 - 8, H * .6, x + i * 17, H + 10); c.strokeStyle = 'rgba(8,6,4,.5)'; c.lineWidth = 1.8; c.stroke(); }
        c.fillStyle = 'rgba(50,100,58,.65)'; [[.2, 40], [.55, 30], [.85, 46]].forEach(function (q) { c.beginPath(); c.ellipse(x + sd * w * .6, H * q[0], 12, q[1], 0, 0, TAU); c.fill(); });
      },
    });
    /* cipó enrolado no tronco */
    g.beginPath(); for (let y = -10; y <= H + 10; y += 6) { const xx = x + sd * w * .9 * Math.sin(y * .02); g[y === -10 ? 'moveTo' : 'lineTo'](xx, y); } g.strokeStyle = OUT; g.lineWidth = 6; g.stroke(); g.strokeStyle = '#4a5a30'; g.lineWidth = 3; g.stroke();
  });
  /* copa escura no alto */
  const groups = [[160, -10, 1.1], [420, -40, 1], [700, -46, .95], [960, -36, 1], [1130, -10, 1.15], [20, 40, 1.2], [W - 20, 50, 1.2], [80, H + 10, 1.1], [W - 90, H + 16, 1.15], [W * .4, H + 50, .9], [W * .66, H + 52, .9]];
  groups.forEach(function (q, n) {
    const b = []; for (let k = 0; k < 9; k++) b.push({ x: q[0] + (R() - .5) * 140 * q[2], y: q[1] + (R() - .5) * 70 * q[2], r: (30 + R() * 26) * q[2] });
    g.fillStyle = 'rgba(2,8,8,.3)'; b.forEach(function (o) { g.beginPath(); g.arc(o.x + 16, o.y + 24, o.r, 0, TAU); g.fill(); });
    g.fillStyle = OUT; b.forEach(function (o) { g.beginPath(); g.arc(o.x, o.y, o.r + 2.8, 0, TAU); g.fill(); });
    [['#0c2622', 0, 0, 1], ['#14392e', -.16, -.2, .8], ['#1f5440', -.3, -.36, .56]].forEach(function (p) { g.fillStyle = p[0]; b.forEach(function (o) { g.beginPath(); g.arc(o.x + o.r * p[1], o.y + o.r * p[2], o.r * p[3], 0, TAU); g.fill(); }); });
  });
  /* cipós pendurados (curtos no meio) e laços */
  for (let j = 0; j < 12; j++) { const x = 90 + (j / 11) * (W - 180) + (R() - .5) * 40, c2 = Math.abs(x / W - .5) * 2, len = 36 + c2 * c2 * 90 + R() * 24; vine(g, R, x, len, (R() - .5) * 26); }
  [[W * .12, W * .34, 54], [W * .62, W * .88, 60]].forEach(function (l) {
    g.beginPath(); g.moveTo(l[0], -8); g.quadraticCurveTo((l[0] + l[1]) / 2, l[2] * 2, l[1], -8); g.lineCap = 'round'; g.strokeStyle = OUT; g.lineWidth = 7; g.stroke(); g.strokeStyle = '#4a3e2e'; g.lineWidth = 4; g.stroke();
  });
  /* folhões nos cantos */
  [[40, 130, .45, 150, '#1f5a3c'], [100, 20, 1.05, 130, '#25653f'], [W - 40, 130, Math.PI - .45, 150, '#1f5a3c'], [W - 110, 18, Math.PI - 1.05, 124, '#25653f'], [30, H - 20, -.45, 150, '#225e3e'], [W - 30, H - 24, Math.PI + .5, 150, '#225e3e'], [W * .3, H + 20, -1.3, 110, '#1d5038'], [W * .72, H + 20, -1.85, 110, '#1d5038']].forEach(function (l) { monstera(g, l[0], l[1], l[2], l[3], l[4]); });
  g.restore();
}

/* ---------------- mapa ---------------- */
function spline(P, step) {
  const out = [], n = P.length; if (n < 2) return P.slice();
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (let k = 0; k < m; k++) { const t = k / m, t2 = t * t, t3 = t2 * t; out.push({ x: .5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3), y: .5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3) }); }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y }); return out;
}
function near(L, x, y) { let m = 1e12; for (let i = 0; i < L.length; i++) { const dx = L[i].x - x, dy = L[i].y - y, d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function strokeL(c, L, col, lw, dash) { if (L.length < 2) return; c.beginPath(); c.moveTo(L[0].x, L[0].y); for (let i = 1; i < L.length; i++) c.lineTo(L[i].x, L[i].y); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; if (dash) c.setLineDash(dash); c.stroke(); if (dash) c.setLineDash([]); }
function repel(C, P, d) { C.forEach(function (q) { P.forEach(function (p) { let dx = q.x - p.x, dy = q.y - p.y, m = Math.hypot(dx, dy); if (m < d) { if (m < 1) { dx = 1; dy = 0; m = 1; } q.x = p.x + dx / m * d; q.y = p.y + dy / m * d; } }); }); }
function trailOf(P, R, wob) { if (P.length < 2) return P.slice(); const C = []; for (let i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { const a = P[i], b = P[i + 1], k = (R() - .5) * wob; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * k, y: (a.y + b.y) / 2 + (b.x - a.x) * k }); } } return spline(C, 6); }
function spot(P, W, H, d, margin) {
  const n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1; let best = null, bs = -1e9;
  for (let i = 0; i < 24; i++) {
    const a = i * TAU / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d; let s = 240;
    for (let j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    const e = Math.min(x - margin, W - margin - x, y - margin, H - margin - y); if (e < 0) s += e * 8;
    s += (Math.cos(a) * vx + Math.sin(a) * vy) / vm * 30; if (s > bs) { bs = s; best = { x, y }; }
  }
  return best;
}
function lobes(x, y, r, R) { const L = [], a0 = R() * TAU, n = 5 + (R() * 3 | 0); for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n; L.push([x + Math.cos(a) * r * .52, y + Math.sin(a) * r * .52, r * (.5 + R() * .14)]); } L.push([x, y, r * .64]); return L; }
function discs(c, L, grow, dx, dy, k, col) { c.beginPath(); for (let i = 0; i < L.length; i++) { const q = L[i], r = q[2] * k + grow, x = q[0] + dx * q[2], y = q[1] + dy * q[2]; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fillStyle = col; c.fill(); }
function tree(c, x, y, r, pal, R) { const L = lobes(x, y, r, R); c.beginPath(); c.ellipse(x + r * .3, y + r * .4, r * 1.04, r * .94, 0, 0, TAU); c.fillStyle = 'rgba(2,8,8,.38)'; c.fill(); discs(c, L, 2.3, 0, 0, 1, pal[2]); discs(c, L, 0, 0, 0, 1, pal[0]); discs(c, L, 0, -.2, -.25, .66, pal[1]); discs(c, L, 0, -.32, -.38, .26, pal[3]); }
/* pegada enorme do Mapinguari (pé virado para trás: os dedos apontam para onde ele veio) */
function footprint(c, x, y, a, s) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.ellipse(0, 0, 13, 8, 0, 0, TAU); c.fillStyle = 'rgba(20,12,6,.7)'; c.fill(); c.strokeStyle = 'rgba(230,200,140,.45)'; c.lineWidth = 1.6; c.stroke();
  [[-15, -6], [-17, 0], [-15, 6]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], 3.6, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(20,12,6,.7)'; c.fill(); c.strokeStyle = 'rgba(230,200,140,.4)'; c.lineWidth = 1.2; c.stroke(); });
  c.restore();
}
/* árvore quebrada: toco lascado e tronco caído */
function broken(c, x, y, a, s, R) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(4, 4, 16, 10, 0, 0, TAU); c.fillStyle = 'rgba(2,6,6,.45)'; c.fill();
  c.save(); c.rotate(a);
  c.beginPath(); c.ellipse(36, 10, 34, 9, 0, 0, TAU); c.fillStyle = 'rgba(2,6,6,.4)'; c.fill();
  cel(c, function (c) { cap(c, 10, 0, 62, 0, 7); }, '#5a4a36', { k: 1.6, lw: 2, inn: function (c) { ln(c, [16, -3, 58, -3], 'rgba(20,14,8,.5)', 1); c.fillStyle = 'rgba(50,100,58,.7)'; c.beginPath(); c.ellipse(70, 0, 14, 10, 0, 0, TAU); c.fill(); } });
  tree(c, 72, 0, 13, ['#4a5a3a', '#5a6c44', '#1a2214', '#7a8a5a'], R);
  c.restore();
  cel(c, function (c) { poly(c, [-9, 2, -8, -6, -4, -12, -1, -7, 2, -14, 5, -6, 9, -9, 9, 2]); }, '#6a5840', { k: 1.4, lw: 2, inn: function (c) { c.beginPath(); c.ellipse(0, -2, 6, 3, 0, 0, TAU); c.fillStyle = '#c8a878'; c.fill(); } });
  c.restore();
}
/** Mapa ilustrado da Selva Profunda; `points` são as 12 fases em pixels do canvas. */
export function paintMap(c, w, h, points) {
  const u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round';
  const W = w / u, H = h / u, P = (points || []).map(function (p) { return { x: p.x / u, y: p.y / u }; }), R = rng(5205);
  let g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#173a30'); g.addColorStop(.5, '#133229'); g.addColorStop(1, '#0f2a25'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 130, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(80,130,90,.1)' : 'rgba(2,12,10,.2)'; c.fill(); }
  const trail = trailOf(P, R, .2), lair = P.length > 1 ? spot(P, W, H, 150, 175) : { x: W * .85, y: H * .3 };
  /* igarapés: dois riachos sinuosos, afastados das fases */
  const S1 = [[-.05, .45], [.15, .5], [.3, .62], [.45, .6], [.6, .7], [.8, .64], [1.05, .72]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
  const S2 = [[.5, -.05], [.53, .15], [.6, .3], [.57, .45], [.6, .7]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
  repel(S1.slice(1, -1), P, 70); repel(S2.slice(1), P, 70);
  const st1 = spline(S1, 8), st2 = spline(S2, 8);
  [st1, st2].forEach(function (S) { strokeL(c, S, 'rgba(2,10,10,.5)', 30); strokeL(c, S, '#3a3020', 24); strokeL(c, S, '#1f5a5a', 17); strokeL(c, S, '#2c7472', 9); strokeL(c, S, 'rgba(200,250,240,.3)', 1.4, [8, 18]); });
  /* clareiras das fases e da toca */
  P.forEach(function (p) { [[74, 56, 'rgba(70,110,70,.25)'], [56, 42, 'rgba(96,130,80,.25)'], [40, 30, 'rgba(120,140,90,.22)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); }); });
  c.beginPath(); c.ellipse(lair.x, lair.y, 132, 104, 0, 0, TAU); c.fillStyle = 'rgba(70,60,40,.55)'; c.fill();
  c.beginPath(); c.ellipse(lair.x, lair.y, 110, 84, 0, 0, TAU); c.fillStyle = 'rgba(110,94,62,.6)'; c.fill();
  for (let i = 0; i < 40; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 100; dot(c, lair.x + Math.cos(a) * d, lair.y + Math.sin(a) * d * .78, 1 + R() * 2, R() < .5 ? 'rgba(40,30,18,.5)' : 'rgba(170,150,110,.4)'); }
  /* ruínas de pedra entre as árvores */
  const RU = [];
  for (let i = 0; i < 40 && RU.length < 5; i++) { const x = 80 + R() * (W - 160), y = 70 + R() * (H - 140); if (near(P, x, y) > 110 && near(trail, x, y) > 60 && Math.hypot(x - lair.x, y - lair.y) > 190 && near(RU, x, y) > 200) RU.push({ x, y }); }
  /* trilha */
  if (trail.length > 1) { strokeL(c, trail, 'rgba(2,10,8,.45)', 26); strokeL(c, trail, '#3e2e1c', 17); strokeL(c, trail, '#7a6040', 12); c.save(); c.translate(-1, -1.3); strokeL(c, trail, '#9a7c52', 4); c.restore(); strokeL(c, trail, 'rgba(40,28,14,.5)', 2, [3, 14]);
    for (let i = 0; i < trail.length; i += 3) { const t = trail[i]; if (near(st1, t.x, t.y) < 18 || near(st2, t.x, t.y) < 18) { c.beginPath(); c.ellipse(t.x, t.y, 9, 6, 0, 0, TAU); c.fillStyle = '#6b6f66'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.6; c.stroke(); } } }
  RU.forEach(function (r) {
    c.save(); c.translate(r.x, r.y); c.rotate(R() * .6 - .3);
    c.beginPath(); c.rect(-34, -24, 74, 56); c.fillStyle = 'rgba(2,8,8,.35)'; c.fill();
    [[-30, -20, 60, 8], [-30, -20, 8, 44], [22, -20, 8, 26], [-30, 18, 34, 8]].forEach(function (q) { cel(c, function (c) { c.rect(q[0], q[1], q[2], q[3]); }, '#6b6f66', { k: 1.4, lw: 1.8, inn: function (c) { c.fillStyle = 'rgba(64,118,68,.8)'; c.fillRect(q[0], q[1], q[2] * .6, 3); } }); });
    c.beginPath(); c.arc(0, 2, 5, 0, TAU); c.fillStyle = 'rgba(217,164,65,.7)'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
    c.restore();
  });
  /* toca do Mapinguari: pegadas enormes, árvores quebradas e o olho rosa no escuro */
  for (let i = 0; i < 6; i++) { const t = i / 5, ax = lair.x - 96 + t * 120, ay = lair.y + 50 - t * 44 + (i % 2 ? 12 : -12); footprint(c, ax, ay, -.35, 1.5); }
  [[-90, -60, .6, 1.3], [78, -56, 2.5, 1.35], [96, 46, 2.9, 1.2], [-104, 34, .2, 1.25]].forEach(function (q) { broken(c, lair.x + q[0], lair.y + q[1], q[2], q[3], R); });
  /* rochedo com a boca da toca */
  c.save(); c.translate(lair.x + 6, lair.y - 6);
  c.beginPath(); c.ellipse(6, 10, 50, 18, 0, 0, TAU); c.fillStyle = 'rgba(2,6,6,.5)'; c.fill();
  cel(c, function (c) { poly(c, [-46, 12, -40, -14, -20, -34, 8, -38, 34, -26, 46, 0, 40, 14]); }, '#55594f', { k: 3, lw: 2.4, inn: function (c) { c.fillStyle = 'rgba(64,118,68,.8)'; c.beginPath(); c.ellipse(-6, -32, 22, 6, 0, 0, TAU); c.fill(); ln(c, [10, -30, 16, -16, 12, -4], 'rgba(10,14,12,.5)', 1.4); ln(c, [10, -30, 16, -16, 12, -4], 'rgba(217,164,65,.6)', .7); } });
  c.beginPath(); c.moveTo(-18, 13); c.quadraticCurveTo(-16, -14, 2, -16); c.quadraticCurveTo(20, -14, 20, 13); c.closePath(); c.fillStyle = '#0a0608'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  radial(c, 2, -2, 26, '255,61,138', .3, 'lighter'); dot(c, 2, -2, 3.4, '#ff3d8a'); dot(c, 2, -2, 1.6, '#ffe0f0');
  c.restore();
  /* árvores: grade sacudida, densa e escura; sumaúmas maiores */
  const PAL = [['#1f5440', '#2a6a4c', '#071a14', '#3f8a5c'], ['#245a38', '#2f7044', '#081c10', '#4c9250'], ['#1a4a40', '#235e50', '#06180f', '#3a8070'], ['#2a6040', '#357650', '#0a1e12', '#58a068']];
  const GR = [['#4a5550', '#5a6660', '#161c1a', '#76827c'], ['#40504a', '#505e58', '#121816', '#6a7a72']];
  const TR = [], cell = 40;
  for (let gy = -1; gy * cell < H + cell; gy++) for (let gx = -1; gx * cell < W + cell; gx++) {
    const tx = (gx + .5 + (R() - .5) * .9) * cell, ty = (gy + .5 + (R() - .5) * .9) * cell, big = R() < .06, tr = big ? 34 + R() * 10 : 16 + R() * 12, kind = R();
    if (R() < .06) continue;
    if (near(P, tx, ty) < 58 + tr * .7 || near(trail, tx, ty) < 14 + tr * .9 || near(st1, tx, ty) < 14 + tr * .6 || near(st2, tx, ty) < 14 + tr * .6 || near(RU, tx, ty) < 46 + tr * .5) continue;
    const dl = Math.hypot(tx - lair.x, ty - lair.y); if (dl < 132 + tr * .4) continue;
    TR.push([tx, ty, tr, dl < 210 ? GR[kind < .5 ? 0 : 1] : PAL[(kind * 97 | 0) % 4]]);
  }
  TR.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (q) { tree(c, q[0], q[1], q[2], q[3], R); });
  /* cogumelos luminosos e vaga-lumes */
  for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H; if (near(P, x, y) < 44) continue; radial(c, x, y, 10, i % 3 ? '220,255,150' : '120,240,210', .35, 'lighter'); dot(c, x, y, 1.4, i % 3 ? 'rgba(240,255,190,.95)' : 'rgba(170,255,230,.95)'); }
  /* névoa baixa */
  for (let i = 0; i < 8; i++) radial(c, R() * W, R() * H, 120 + R() * 120, '160,200,190', .07);
  const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.hypot(W, H) * .56); vg.addColorStop(0, 'rgba(2,10,8,0)'); vg.addColorStop(1, 'rgba(2,10,8,.85)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  radial(c, lair.x, lair.y, 150, '255,120,170', .12, 'lighter'); radial(c, lair.x + 8, lair.y - 8, 40, '255,61,138', .25, 'lighter');
  c.restore();
}
