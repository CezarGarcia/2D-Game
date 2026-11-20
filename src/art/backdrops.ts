// @ts-nocheck
/**
 * Fundos pintados das telas de menu, no estilo recortado do jogo. Cada função pinta o canvas inteiro
 * (0,0)–(w,h) e é chamada uma vez por tela, então pode gastar mais que um ícone.
 * Por dentro tudo é desenhado numa área virtual em que o menor lado vale 1280×720, e escalado;
 * assim as proporções dos objetos não mudam com o tamanho do canvas. Tudo é determinístico
 * (semente fixa, sem Math.random).
 */
import { OUT, TAU, el, cap, poly, cel, ln, dot } from './characters';

/* ---------------- ajudantes ---------------- */
function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* entra na área virtual: devolve a escala e as dimensões virtuais */
function enter(c, w, h) { var u = Math.min(w / 1280, h / 720) || 1; c.save(); c.scale(u, u); c.lineCap = 'round'; c.lineJoin = 'round'; return { u: u, W: w / u, H: h / u }; }
/* Catmull-Rom: curva suave pelos pontos, amostrada a cada ~step */
function spline(P, step) {
  var out = [], n = P.length, i, k;
  if (n < 2) return P.slice();
  for (i = 0; i < n - 1; i++) {
    var a = P[Math.max(0, i - 1)], b = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)], m = Math.max(2, Math.ceil(Math.hypot(d.x - b.x, d.y - b.y) / step));
    for (k = 0; k < m; k++) {
      var t = k / m, t2 = t * t, t3 = t2 * t;
      out.push({
        x: .5 * (2 * b.x + (d.x - a.x) * t + (2 * a.x - 5 * b.x + 4 * d.x - e.x) * t2 + (3 * b.x - a.x - 3 * d.x + e.x) * t3),
        y: .5 * (2 * b.y + (d.y - a.y) * t + (2 * a.y - 5 * b.y + 4 * d.y - e.y) * t2 + (3 * b.y - a.y - 3 * d.y + e.y) * t3),
      });
    }
  }
  out.push({ x: P[n - 1].x, y: P[n - 1].y });
  return out;
}
function near(L, x, y) { var m = 1e12, i, d, dx, dy; for (i = 0; i < L.length; i++) { dx = L[i].x - x; dy = L[i].y - y; d = dx * dx + dy * dy; if (d < m) m = d; } return Math.sqrt(m); }
function strokeL(c, L, col, lw, dash) { if (L.length < 2) return; c.beginPath(); c.moveTo(L[0].x, L[0].y); for (var i = 1; i < L.length; i++) c.lineTo(L[i].x, L[i].y); c.strokeStyle = col; c.lineWidth = lw; if (dash) c.setLineDash(dash); c.stroke(); if (dash) c.setLineDash([]); }
function norm(L, i) { var a = L[Math.max(0, i - 1)], b = L[Math.min(L.length - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: -dy / d, y: dx / d }; }
/* afasta os pontos de controle de um rio das fases */
function repel(C, P, d) { C.forEach(function (q) { P.forEach(function (p) { var dx = q.x - p.x, dy = q.y - p.y, m = Math.hypot(dx, dy); if (m < d) { if (m < 1) { dx = 1; dy = 0; m = 1; } q.x = p.x + dx / m * d; q.y = p.y + dy / m * d; } }); }); }
/* trilha: passa pelas fases na ordem, serpenteando um pouco entre elas */
function trailOf(P, R, wob) {
  if (P.length < 2) return P.slice();
  var C = [], i;
  for (i = 0; i < P.length; i++) { C.push(P[i]); if (i < P.length - 1) { var a = P[i], b = P[i + 1], k = (R() - .5) * wob; C.push({ x: (a.x + b.x) / 2 - (b.y - a.y) * k, y: (a.y + b.y) / 2 + (b.x - a.x) * k }); } }
  return spline(C, 6);
}
/* melhor lugar para o marco do chefão: a distância d da última fase, longe das outras e das bordas */
function spot(P, W, H, d, margin) {
  var n = P.length, last = P[n - 1], prev = P[n - 2] || { x: last.x - 1, y: last.y }, vx = last.x - prev.x, vy = last.y - prev.y, vm = Math.hypot(vx, vy) || 1, best = null, bs = -1e9, i, j;
  for (i = 0; i < 24; i++) {
    var a = i * TAU / 24, x = last.x + Math.cos(a) * d, y = last.y + Math.sin(a) * d, s = 240;
    for (j = 0; j < n - 1; j++) s = Math.min(s, Math.hypot(P[j].x - x, P[j].y - y));
    var edge = Math.min(x - margin, W - margin - x, y - margin, H - margin - y); if (edge < 0) s += edge * 8;
    s += (Math.cos(a) * vx + Math.sin(a) * vy) / vm * 40 - Math.sin(a) * 26;
    if (s > bs) { bs = s; best = { x: x, y: y }; }
  }
  return best;
}
function vignette(c, W, H, a, rgb, inner) { var g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * (inner || .34), W / 2, H / 2, Math.hypot(W, H) * .56); g.addColorStop(0, 'rgba(' + rgb + ',0)'); g.addColorStop(1, 'rgba(' + rgb + ',' + a + ')'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function radial(c, x, y, r, rgb, a, op) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); if (op) c.globalCompositeOperation = op; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
function spark(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill(); }
function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.strokeStyle = out || OUT; c.lineWidth = lw + 2.4; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }

/* ---------------- peças dos mapas (vistas de cima) ---------------- */
function lobes(x, y, r, R) { var L = [], a0 = R() * TAU, n = 5 + (R() * 3 | 0), i, a; for (i = 0; i < n; i++) { a = a0 + i * TAU / n; L.push([x + Math.cos(a) * r * .52, y + Math.sin(a) * r * .52, r * (.5 + R() * .14)]); } L.push([x, y, r * .64]); return L; }
function discs(c, L, grow, dx, dy, k, col) { c.beginPath(); for (var i = 0; i < L.length; i++) { var q = L[i], r = q[2] * k + grow, x = q[0] + dx * q[2], y = q[1] + dy * q[2]; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fillStyle = col; c.fill(); }
/* copa de árvore: pal = [base, luz, contorno, brilho] */
function tree(c, x, y, r, pal, R, shadow) {
  var L = lobes(x, y, r, R);
  if (shadow !== false) { c.beginPath(); c.ellipse(x + r * .3, y + r * .4, r * 1.04, r * .94, 0, 0, TAU); c.fillStyle = shadow || 'rgba(6,18,12,.3)'; c.fill(); }
  discs(c, L, 2.3, 0, 0, 1, pal[2]); discs(c, L, 0, 0, 0, 1, pal[0]); discs(c, L, 0, -.2, -.25, .66, pal[1]); discs(c, L, 0, -.32, -.38, .26, pal[3]);
}
function palm(c, x, y, r, pal, R, shadow) {
  var n = 8, a0 = R() * TAU, A = [], i;
  for (i = 0; i < n; i++) A.push(a0 + i * TAU / n + (R() - .5) * .3);
  c.beginPath(); c.ellipse(x + r * .3, y + r * .4, r, r * .9, 0, 0, TAU); c.fillStyle = shadow || 'rgba(6,18,12,.28)'; c.fill();
  [[2.2, pal[2]], [0, pal[0]]].forEach(function (ps) { c.beginPath(); A.forEach(function (a) { var fx = x + Math.cos(a) * r * .56, fy = y + Math.sin(a) * r * .56; c.moveTo(fx + Math.cos(a) * (r * .56 + ps[0]), fy + Math.sin(a) * (r * .56 + ps[0])); c.ellipse(fx, fy, r * .56 + ps[0], r * .19 + ps[0], a, 0, TAU); }); c.fillStyle = ps[1]; c.fill(); });
  c.beginPath(); A.forEach(function (a) { c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 1.02, y + Math.sin(a) * r * 1.02); }); c.strokeStyle = pal[1]; c.lineWidth = 1.6; c.stroke();
  dot(c, x, y, r * .16, pal[2]);
}
function stone(c, x, y, s, R, moss) {
  c.beginPath(); c.ellipse(x + 3 * s, y + 4 * s, 15 * s, 9 * s, 0, 0, TAU); c.fillStyle = 'rgba(6,18,12,.3)'; c.fill();
  var a = R() * .6;
  cel(c, function (c) { poly(c, [x - 13 * s, y + 3 * s, x - 9 * s, y - 8 * s + a, x + 2 * s, y - 11 * s, x + 12 * s, y - 5 * s, x + 14 * s, y + 5 * s, x + 2 * s, y + 9 * s]); }, '#84827a', { k: 2 * s, lw: 2, inn: moss ? function (c) { c.fillStyle = moss; c.beginPath(); c.ellipse(x - 2 * s, y - 8 * s, 9 * s, 4 * s, -.2, 0, TAU); c.fill(); } : null });
}
/* tábuas atravessadas ao longo de um trecho da trilha (ponte) */
function planks(c, T, a, b) {
  var i, n;
  a = Math.max(0, a); b = Math.min(T.length - 1, b);
  [['#2a180c', 6.6, 13.6], ['#b98a55', 4.2, 12.4]].forEach(function (st) { c.beginPath(); for (i = a; i <= b; i++) { n = norm(T, i); c.moveTo(T[i].x - n.x * st[2], T[i].y - n.y * st[2]); c.lineTo(T[i].x + n.x * st[2], T[i].y + n.y * st[2]); } c.strokeStyle = st[0]; c.lineWidth = st[1]; c.lineCap = 'butt'; c.stroke(); c.lineCap = 'round'; });
  [-1, 1].forEach(function (sd) { c.beginPath(); for (i = a; i <= b; i++) { n = norm(T, i); c[i === a ? 'moveTo' : 'lineTo'](T[i].x + n.x * 12.4 * sd, T[i].y + n.y * 12.4 * sd); } c.strokeStyle = '#4a2e18'; c.lineWidth = 2.6; c.stroke(); });
}

/* a morada do Curupira: árvore enorme e retorcida, com o oco aceso; base em (x,y) */
function curupiraTree(c, x, y, s, R) {
  var GP = ['#667268', '#7d8a80', '#232a26', '#98a49a'], GP2 = ['#566158', '#6c786e', '#1e2521', '#87938a'];
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.ellipse(10, 6, 86, 22, 0, 0, TAU); c.fillStyle = 'rgba(6,12,10,.45)'; c.fill();
  radial(c, 0, -30, 120, '255,140,40', .22, 'lighter');
  /* copas de trás */
  tree(c, -64, -104, 30, GP2, R, false); tree(c, 66, -112, 32, GP2, R, false); tree(c, 4, -134, 38, GP2, R, false);
  /* raízes */
  [[-1, 70, 6], [1, 74, 4], [-1, 50, 14], [1, 52, 15]].forEach(function (q) { cel(c, function (c) { c.moveTo(q[0] * 10, -16); c.quadraticCurveTo(q[0] * q[1] * .55, -12, q[0] * q[1], q[2]); c.quadraticCurveTo(q[0] * q[1] * .6, q[2] + 4, q[0] * 8, 6); c.closePath(); }, '#57493c', { k: 1.6, lw: 2.4 }); });
  /* tronco */
  cel(c, function (c) {
    c.moveTo(-36, 4); c.bezierCurveTo(-22, -14, -32, -40, -21, -62); c.bezierCurveTo(-15, -78, -32, -90, -52, -98); c.lineTo(-46, -110); c.bezierCurveTo(-26, -104, -12, -96, -7, -82);
    c.bezierCurveTo(-5, -100, -9, -114, -4, -128); c.lineTo(10, -128); c.bezierCurveTo(8, -112, 11, -98, 17, -84); c.bezierCurveTo(23, -98, 38, -104, 54, -108); c.lineTo(60, -96); c.bezierCurveTo(42, -90, 27, -80, 27, -62);
    c.bezierCurveTo(27, -40, 26, -16, 40, 4); c.quadraticCurveTo(0, 13, -36, 4); c.closePath();
  }, '#6e5d4b', {
    k: 3.4, lw: 2.8, inn: function (c) {
      [[-20, 0, -26, -40, -8, -80], [-8, 2, -18, -30, 6, -70], [10, 2, 22, -34, 2, -74], [24, 0, 16, -40, 20, -80], [-2, -84, 2, -104, 2, -124]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.strokeStyle = 'rgba(30,20,14,.5)'; c.lineWidth = 1.6; c.stroke(); });
      c.fillStyle = 'rgba(96,124,92,.85)'; c.beginPath(); c.ellipse(-24, -46, 9, 16, .2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(26, -6, 12, 7, -.3, 0, TAU); c.fill();
    },
  });
  /* oco aceso */
  c.beginPath(); c.moveTo(-12, 1); c.quadraticCurveTo(-15, -36, 0, -41); c.quadraticCurveTo(15, -36, 12, 1); c.closePath(); c.fillStyle = '#170a08'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke();
  c.save(); c.clip(); radial(c, 0, -6, 30, '255,150,40', .85); c.restore();
  [-4.6, 4.6].forEach(function (ex) { c.beginPath(); c.ellipse(ex, -25, 2.6, 3.3, ex * .05, 0, TAU); c.fillStyle = '#fff4c4'; c.fill(); dot(c, ex + .4, -25, 1, '#1c0f0a'); });
  /* copas da frente e cabelo de fogo */
  tree(c, -54, -116, 25, GP, R, false); tree(c, 60, -122, 26, GP, R, false); tree(c, -24, -138, 20, GP, R, false); tree(c, 30, -142, 22, GP, R, false);
  [[-6, 0], [4, -4], [12, 2]].forEach(function (q, i) {
    var bx = 3 + q[0], by = -150 + q[1];
    c.beginPath(); c.moveTo(bx - 9, by + 8); c.quadraticCurveTo(bx - 10, by - 12, bx + (i - 1) * 4, by - 30 + i * 4); c.quadraticCurveTo(bx + 10, by - 10, bx + 9, by + 8); c.closePath(); c.fillStyle = '#e2401f'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.fill();
  });
  [[-6, 0], [4, -4], [12, 2]].forEach(function (q, i) { var bx = 3 + q[0], by = -150 + q[1]; c.beginPath(); c.moveTo(bx - 5, by + 8); c.quadraticCurveTo(bx - 5, by - 6, bx + (i - 1) * 3, by - 19 + i * 3); c.quadraticCurveTo(bx + 6, by - 5, bx + 5, by + 8); c.closePath(); c.fillStyle = i === 1 ? '#ffd84a' : '#ff8a1e'; c.fill(); });
  tree(c, 4, -146, 15, GP, R, false);
  /* olhos de Assombro espiando na sombra */
  [[-62, -6], [70, -14]].forEach(function (q) { dot(c, q[0], q[1], 7, 'rgba(10,6,12,.55)'); dot(c, q[0] - 2.6, q[1], 1.5, '#ff3d8a'); dot(c, q[0] + 2.6, q[1], 1.5, '#ff3d8a'); dot(c, q[0] - 2.6, q[1] - .4, .6, '#ffe0f0'); dot(c, q[0] + 2.6, q[1] - .4, .6, '#ffe0f0'); });
  for (var i = 0; i < 9; i++) dot(c, -30 + R() * 64, -150 - R() * 46, .8 + R() * 1.4, 'rgba(255,' + (150 + (R() * 70 | 0)) + ',60,' + (.45 + R() * .45) + ')');
  c.restore();
}

/* ---------------- capítulo 1: Mata Atlântica ---------------- */
function mapMata(c, W, H, P) {
  var R = rng(1207), i, j, last = P[P.length - 1] || { x: W * .8, y: H * .76 };
  var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#3f7040'); g.addColorStop(.5, '#34633a'); g.addColorStop(1, '#2a553a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (i = 0; i < 80; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 130, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(104,140,74,.15)' : 'rgba(12,36,24,.17)'; c.fill(); }

  var RV = [[.5, -.06], [.47, .1], [.44, .22], [.5, .36], [.53, .5], [.47, .63], [.48, .78], [.53, .92], [.51, 1.07]].map(function (q) { return { x: q[0] * W, y: q[1] * H }; });
  repel(RV, P, 104);
  var river = spline(RV, 8), trail = trailOf(P, R, .2), lair = P.length ? spot(P, W, H, 128, 96) : { x: W * .88, y: H * .7 };
  lair.y += 68;

  /* clareiras: uma por fase e algumas soltas */
  var CL = P.map(function (p) { return [p.x, p.y, 1]; });
  for (i = 0; i < 7; i++) CL.push([R() * W, R() * H, .5 + R() * .4]);
  CL.forEach(function (q) {
    [[78, 60, 'rgba(150,170,92,.2)'], [62, 47, 'rgba(176,186,104,.22)'], [42, 31, 'rgba(206,200,124,.2)']].forEach(function (e) { c.beginPath(); c.ellipse(q[0], q[1] + 4, e[0] * q[2], e[1] * q[2], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); });
  });

  /* rio */
  strokeL(c, river, 'rgba(10,30,22,.5)', 46); strokeL(c, river, '#8f8050', 37); strokeL(c, river, '#2b7890', 29); strokeL(c, river, '#3c9cb0', 17);
  c.beginPath(); for (i = 3; i < river.length - 6; i += 7) { var n0 = norm(river, i), o = ((i * 7) % 3 - 1) * 6; c.moveTo(river[i].x + n0.x * o, river[i].y + n0.y * o); c.lineTo(river[i + 3].x + n0.x * o, river[i + 3].y + n0.y * o); } c.strokeStyle = 'rgba(220,248,250,.42)'; c.lineWidth = 1.8; c.stroke();
  for (i = 0; i < 9; i++) { var ri = river[(R() * (river.length - 1)) | 0], sd = R() < .5 ? -1 : 1; if (near(trail, ri.x, ri.y) > 40) stone(c, ri.x + sd * (13 + R() * 6), ri.y, .5 + R() * .3, R, null); }

  /* trilha de terra */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(14,28,16,.42)', 27); strokeL(c, trail, '#63492a', 18.5); strokeL(c, trail, '#b28a54', 13.5);
    c.save(); c.translate(-1.2, -1.4); strokeL(c, trail, '#cdab70', 5.5); c.restore();
    strokeL(c, trail, 'rgba(110,78,40,.5)', 2.2, [3, 15]);
    var run = -1;
    for (i = 0; i <= trail.length; i++) { var on = i < trail.length && near(river, trail[i].x, trail[i].y) < 21; if (on && run < 0) run = i; if (!on && run >= 0) { planks(c, trail, run - 2, i + 1); run = -1; } }
  }

  /* pedras */
  for (i = 0; i < 34; i++) { var sx = R() * W, sy = R() * H, ss = .6 + R() * .7; if (near(P, sx, sy) > 70 && near(trail, sx, sy) > 26 && near(river, sx, sy) > 30 && Math.hypot(sx - lair.x, sy - lair.y + 70) > 124) stone(c, sx, sy, ss, R, 'rgba(96,140,76,.9)'); }

  /* árvores: grade sacudida, de cima para baixo */
  var PAL = [['#2f6f3c', '#3f8a45', '#11301b', '#5aa552'], ['#3a7d40', '#4f9a48', '#13331c', '#72ba5c'], ['#28623a', '#357a45', '#0f2a1a', '#4c9352'], ['#48903f', '#60a84c', '#15381c', '#88c66c'], ['#2c6a48', '#3b8456', '#102e22', '#58a070']];
  var IPE = ['#d6a52c', '#f2c94e', '#5a3a0a', '#ffe690'], ROXO = ['#8660bd', '#b38af4', '#2c1a52', '#d9c4ff'], CINZA = [['#5f6a62', '#74807a', '#232926', '#8d9890'], ['#535e58', '#68746e', '#1f2522', '#808c84']];
  var TR = [], cell = 43, gx, gy;
  for (gy = -1; gy * cell < H + cell; gy++) for (gx = -1; gx * cell < W + cell; gx++) {
    var tx = (gx + .5 + (R() - .5) * .9) * cell, ty = (gy + .5 + (R() - .5) * .9) * cell, tr = 17 + R() * 13, kind = R(), keep = R();
    if (keep < .1) continue;
    if (near(P, tx, ty) < 58 + tr * .7 || near(trail, tx, ty) < 13 + tr * .92 || near(river, tx, ty) < 21 + tr * .8) continue;
    var dl = Math.hypot(tx - lair.x, ty - (lair.y - 84));
    if (dl < 112) continue;
    TR.push([tx, ty, tr, dl < 186 + keep * 90 ? CINZA[kind < .5 ? 0 : 1] : kind < .035 ? IPE : kind < .06 ? ROXO : PAL[(kind * 97 | 0) % 5]]);
  }
  TR.sort(function (a, b) { return a[1] - b[1]; });
  TR.forEach(function (q) { tree(c, q[0], q[1], q[2], q[3], R); });

  /* flores nas clareiras das fases */
  P.forEach(function (p) { for (j = 0; j < 7; j++) { var a = R() * TAU, d = 40 + R() * 22; dot(c, p.x + Math.cos(a) * d, p.y + 4 + Math.sin(a) * d * .78, 1.7, j % 3 ? '#f4e9b8' : '#ffd23f'); } });

  curupiraTree(c, lair.x, lair.y, 1.16, R);

  /* luz da manhã vindo de cima à esquerda e bordas escuras */
  radial(c, W * .22, H * .12, W * .6, '255,236,160', .13, 'lighter');
  vignette(c, W, H, .82, '6,16,12', .3);
}

/* ---------------- capítulo 2: Rios do Norte ---------------- */
function hut(c, x, y, s, flip) {
  c.save(); c.translate(x, y); c.scale(s * (flip ? -1 : 1), s);
  c.beginPath(); c.ellipse(1, 17, 27, 7, 0, 0, TAU); c.fillStyle = 'rgba(8,36,44,.38)'; c.fill();
  [-15, -5, 6, 16].forEach(function (px) { ln(c, [px, -1, px, 15], OUT, 4.4); ln(c, [px, -1, px, 15], '#6a4526', 2); });
  c.beginPath(); c.ellipse(-15, 16, 4, 1.4, 0, 0, TAU); c.ellipse(16, 16, 4, 1.4, 0, 0, TAU); c.strokeStyle = 'rgba(220,250,250,.5)'; c.lineWidth = 1; c.stroke();
  cel(c, function (c) { poly(c, [-22, -4, 23, -4, 23, 2, -22, 2]); }, '#9a6a3a', { k: .8, lw: 2 });
  cel(c, function (c) { poly(c, [-15, -23, 15, -23, 15, -4, -15, -4]); }, '#b98a55', { k: 1.4, lw: 2, inn: function (c) { for (var i = -10; i < 15; i += 5) ln(c, [i, -23, i, -4], 'rgba(74,46,24,.5)', 1); c.fillStyle = '#2a160c'; c.fillRect(-9, -16, 7, 12); c.fillStyle = '#ffd86a'; c.fillRect(4, -17, 6, 5.4); } });
  cel(c, function (c) { poly(c, [-23, -20, -12, -39, 14, -39, 24, -20]); }, '#dab45c', { k: 1.8, lw: 2.2, inn: function (c) { for (var i = -20; i < 24; i += 5) ln(c, [i * .55 + 1, -39, i, -20], 'rgba(120,80,20,.5)', 1); ln(c, [-23, -23.5, 24, -23.5], 'rgba(120,80,20,.45)', 1.4); } });
  c.restore();
}
function canoe(c, x, y, a, s) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  c.beginPath(); c.ellipse(2, 3, 18, 6, 0, 0, TAU); c.fillStyle = 'rgba(8,36,44,.35)'; c.fill();
  cel(c, function (c) { c.moveTo(-18, 0); c.quadraticCurveTo(0, -8.4, 18, 0); c.quadraticCurveTo(0, 8.4, -18, 0); c.closePath(); }, '#9a6532', { k: 1, lw: 2, inn: function (c) { c.beginPath(); c.ellipse(0, 0, 11.6, 3.2, 0, 0, TAU); c.fillStyle = '#5a3418'; c.fill(); ln(c, [-4, -3, -4, 3], '#c9945a', 1.4); ln(c, [5, -3, 5, 3], '#c9945a', 1.4); } });
  ln(c, [-3, -10, 9, 8], OUT, 3.4); ln(c, [-3, -10, 9, 8], '#e0c088', 1.5);
  c.restore();
}
function lily(c, x, y, r, a, flower) {
  function pad(c, g) { c.moveTo(x, y); c.arc(x, y, r + g, a + .4, a + TAU); c.closePath(); }
  c.beginPath(); pad(c, 1.7); c.fillStyle = '#123624'; c.fill(); c.beginPath(); pad(c, 0); c.fillStyle = '#4f9d54'; c.fill();
  c.beginPath(); c.arc(x, y, r * .8, a + .7, a + TAU - .3); c.strokeStyle = '#86cc6e'; c.lineWidth = 1.5; c.stroke();
  if (flower) { for (var i = 0; i < 6; i++) dot(c, x + Math.cos(i * 1.047) * 2.6, y + Math.sin(i * 1.047) * 2.6, 1.9, '#fbf6ea'); dot(c, x, y, 1.5, '#ffd23f'); }
}
function blob(c, x, y, r, ph, sx, sy) { c.beginPath(); for (var i = 0; i <= 44; i++) { var a = i / 44 * TAU, q = r * (1 + .1 * Math.sin(a * 3 + ph) + .06 * Math.sin(a * 5 + ph * 2.3)); c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q * (sx || 1), y + Math.sin(a) * q * (sy || 1)); } c.closePath(); }
/* faixa de largura variável ao longo de uma curva */
function band(c, L, hw, k) { var i, n; c.beginPath(); for (i = 0; i < L.length; i++) { n = norm(L, i); c[i ? 'lineTo' : 'moveTo'](L[i].x + n.x * hw[i] * k, L[i].y + n.y * hw[i] * k); } for (i = L.length - 1; i >= 0; i--) { n = norm(L, i); c.lineTo(L[i].x - n.x * hw[i] * k, L[i].y - n.y * hw[i] * k); } c.closePath(); }

function mapRios(c, W, H, P) {
  var R = rng(4411), i, j, last = P[P.length - 1] || { x: W * .84, y: H * .38 };
  function V(A) { return A.map(function (q) { return { x: q[0] * W, y: q[1] * H }; }); }
  var g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2f6048'); g.addColorStop(.5, '#28563f'); g.addColorStop(1, '#214a40'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (i = 0; i < 70; i++) { c.beginPath(); c.ellipse(R() * W, R() * H, 60 + R() * 130, 30 + R() * 60, R() * 3, 0, TAU); c.fillStyle = i % 2 ? 'rgba(96,140,84,.13)' : 'rgba(8,30,28,.18)'; c.fill(); }

  var river = spline(V([[-.08, .6], [.12, .6], [.3, .56], [.42, .43], [.56, .4], [.7, .44], [.8, .52], [.93, .5], [1.08, .44]]), 8), hw = river.map(function (q, i) { return 47 + 9 * Math.sin(i * .05) + 5 * Math.sin(i * .13 + 2); });
  var C1 = V([[.42, .43], [.445, .32], [.455, .2], [.48, .08], [.47, -.07]]), C2 = V([[.56, .42], [.565, .55], [.59, .7], [.6, .86], [.585, 1.07]]);
  repel(C1.slice(1), P, 84); repel(C2.slice(1), P, 84);
  var T1 = spline(C1, 8), T2 = spline(C2, 8), trail = trailOf(P, R, .18), lake = P.length ? spot(P, W, H, 142, 118) : { x: W * .9, y: H * .26 }, LR = 92;
  var ri0 = 0, rd = 1e9; river.forEach(function (q, i) { var d = Math.hypot(q.x - lake.x, q.y - lake.y); if (d < rd) { rd = d; ri0 = i; } });
  var chan = spline([lake, { x: (lake.x + river[ri0].x) / 2 + 14, y: (lake.y + river[ri0].y) / 2 }, river[ri0]], 8);
  function water(x, y) { var m = 1e9, k = 0, i, d; for (i = 0; i < river.length; i++) { d = Math.hypot(river[i].x - x, river[i].y - y) - hw[i]; if (d < m) m = d; } return Math.min(m, near(T1, x, y) - 13, near(T2, x, y) - 13, near(chan, x, y) - 15, Math.hypot((x - lake.x) / 1.14, (y - lake.y) / .92) - LR); }

  /* igapó: mata alagada ao longo das margens */
  for (i = 2; i < river.length; i += 4) for (j = -1; j < 2; j += 2) { var n0 = norm(river, i), d0 = hw[i] + 10 + R() * 74; c.beginPath(); c.ellipse(river[i].x + n0.x * d0 * j, river[i].y + n0.y * d0 * j, 30 + R() * 34, 20 + R() * 22, R() * 3, 0, TAU); c.fillStyle = 'rgba(30,96,96,.34)'; c.fill(); }
  [T1, T2].forEach(function (T) { for (i = 2; i < T.length; i += 5) { c.beginPath(); c.ellipse(T[i].x + (R() - .5) * 70, T[i].y + (R() - .5) * 40, 24 + R() * 26, 16 + R() * 16, R() * 3, 0, TAU); c.fillStyle = 'rgba(30,96,96,.32)'; c.fill(); } });
  blob(c, lake.x, lake.y, LR + 34, 1.3, 1.14, .92); c.fillStyle = 'rgba(30,96,96,.4)'; c.fill();

  /* água: igarapés, canal, rio largo e a lagoa */
  [T1, T2].forEach(function (T) { strokeL(c, T, '#123a36', 31); strokeL(c, T, '#2f8a8c', 25); strokeL(c, T, '#2a7c90', 14); });
  strokeL(c, chan, '#123a36', 36); strokeL(c, chan, '#2f8a8c', 30);
  band(c, river, hw, 1.07); c.fillStyle = '#123a36'; c.fill();
  blob(c, lake.x, lake.y, LR + 4, 1.3, 1.14, .92); c.fill();
  band(c, river, hw, 1); c.fillStyle = '#38959a'; c.fill();
  strokeL(c, chan, '#38959a', 28);
  band(c, river, hw, .68); c.fillStyle = '#2b8096'; c.fill();
  band(c, river, hw, .34); c.fillStyle = '#2f8aa0'; c.fill();
  [-.5, .08, .52].forEach(function (o, m) { c.beginPath(); for (i = 4 + m * 3; i < river.length - 8; i += 11) { var n1 = norm(river, i); c.moveTo(river[i].x + n1.x * hw[i] * o, river[i].y + n1.y * hw[i] * o); c.lineTo(river[i + 4].x + n1.x * hw[i] * o, river[i + 4].y + n1.y * hw[i] * o); } c.strokeStyle = 'rgba(214,246,246,.34)'; c.lineWidth = 2; c.stroke(); });
  [T1, T2].forEach(function (T) { strokeL(c, T, 'rgba(214,246,246,.3)', 1.6, [10, 22]); });
  /* lagoa da Iara: mais clara, com um brilho no meio */
  blob(c, lake.x, lake.y, LR, 1.3, 1.14, .92); c.fillStyle = '#35a2a0'; c.fill();
  blob(c, lake.x, lake.y, LR * .74, 1.3, 1.14, .92); c.fillStyle = '#4bbcae'; c.fill();
  blob(c, lake.x - 4, lake.y - 3, LR * .44, 2.1, 1.14, .92); c.fillStyle = '#7fd9c4'; c.fill();
  radial(c, lake.x, lake.y, LR * 1.25, '190,255,230', .3, 'lighter');
  for (i = 0; i < 3; i++) { c.beginPath(); c.ellipse(lake.x, lake.y, LR * (.5 + i * .2) * 1.14, LR * (.5 + i * .2) * .92, 0, .3 + i, 1.5 + i); c.strokeStyle = 'rgba(235,255,250,.4)'; c.lineWidth = 1.6; c.stroke(); }

  /* bancos de areia nas curvas do rio */
  [.1, .2, .36, .5, .62, .76, .9].forEach(function (f, m) {
    var k = (f * (river.length - 1)) | 0, n2 = norm(river, k), sd = m % 2 ? 1 : -1, x = river[k].x + n2.x * hw[k] * .86 * sd, y = river[k].y + n2.y * hw[k] * .86 * sd, a = Math.atan2(n2.y, n2.x) + Math.PI / 2;
    if (near(P, x, y) < 86 || near(trail, x, y) < 26) return;
    cel(c, function (c) { el(c, x, y, 40 + (m % 3) * 7, 13 + (m % 2) * 3, a); }, '#e9d7a4', { k: 2.6, lw: 2, out: '#6f5a34', sh: 'rgba(150,110,50,.35)', hi: 'rgba(255,250,220,.5)' });
    for (j = 0; j < 5; j++) dot(c, x + Math.cos(a) * (R() - .5) * 50, y + Math.sin(a) * (R() - .5) * 50, 1.2, 'rgba(140,110,60,.6)');
  });

  /* chão firme de cada fase: ilhota de areia se cair na água, clareira se cair em terra */
  P.forEach(function (p) {
    if (water(p.x, p.y) < 44) cel(c, function (c) { blob(c, p.x, p.y + 4, 56, p.x * .01, 1.12, .84); }, '#e3d09c', { k: 3, lw: 2.2, out: '#6f5a34', sh: 'rgba(150,110,50,.35)', hi: 'rgba(255,250,220,.45)', inn: function (c) { blob(c, p.x, p.y + 4, 40, p.x * .01, 1.12, .84); c.fillStyle = 'rgba(150,180,96,.5)'; c.fill(); } });
    else[[76, 58, 'rgba(150,176,100,.2)'], [58, 44, 'rgba(180,194,114,.22)'], [40, 30, 'rgba(210,206,134,.2)']].forEach(function (e) { c.beginPath(); c.ellipse(p.x, p.y + 4, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); });
  });

  /* passarela de tábuas */
  if (trail.length > 1) {
    strokeL(c, trail, 'rgba(6,24,26,.42)', 27); strokeL(c, trail, '#3a2414', 18.5); strokeL(c, trail, '#b88a56', 13.5);
    c.save(); c.translate(-1, -1.3); strokeL(c, trail, '#d2a870', 4.6); c.restore();
    c.beginPath(); for (i = 1; i < trail.length - 1; i += 2) { var n3 = norm(trail, i); c.moveTo(trail[i].x - n3.x * 6.4, trail[i].y - n3.y * 6.4); c.lineTo(trail[i].x + n3.x * 6.4, trail[i].y + n3.y * 6.4); } c.strokeStyle = 'rgba(74,44,20,.62)'; c.lineWidth = 1.5; c.stroke();
    for (i = 3; i < trail.length - 2; i += 7) { if (near(P, trail[i].x, trail[i].y) < 36) continue; var n4 = norm(trail, i); dot(c, trail[i].x - n4.x * 9.6, trail[i].y - n4.y * 9.6, 2.7, '#2a180c'); dot(c, trail[i].x + n4.x * 9.6, trail[i].y + n4.y * 9.6, 2.7, '#2a180c'); }
  }

  /* palafitas na beira do rio */
  var HUTS = [];
  [.04, .1, .17, .24, .31, .4, .47, .54, .61, .68, .77, .85, .92, .97].forEach(function (f, m) {
    var k = (f * (river.length - 1)) | 0, n5 = norm(river, k), t;
    for (t = 0; t < 2; t++) { var sd = (m + t) % 2 ? 1 : -1, x = river[k].x + n5.x * (hw[k] - 2) * sd, y = river[k].y + n5.y * (hw[k] - 2) * sd; if (near(P, x, y) > 96 && near(trail, x, y) > 42 && near(HUTS, x, y) > 170 && x > 40 && x < W - 40) { HUTS.push({ x: x, y: y, f: m % 2 }); break; } }
  });
  canoe(c, river[(river.length * .31) | 0].x + 8, river[(river.length * .31) | 0].y + 6, -.5, 1.05); canoe(c, river[(river.length * .71) | 0].x - 6, river[(river.length * .71) | 0].y - 4, .5, 1.05);

  /* vitórias-régias: na lagoa e nos remansos */
  for (i = 0; i < 15; i++) { var la = R() * TAU, ld = LR * (.46 + R() * .46), lx = lake.x + Math.cos(la) * ld * 1.1, ly = lake.y + Math.sin(la) * ld * .88; if (near(P, lx, ly) > 50 && near(trail, lx, ly) > 22) lily(c, lx, ly, 6 + R() * 5.5, R() * TAU, i % 3 === 0); }
  for (i = 0; i < 16; i++) { var k2 = (R() * (river.length - 20) + 10) | 0, n6 = norm(river, k2), sd2 = R() < .5 ? -1 : 1, bx = river[k2].x + n6.x * hw[k2] * .7 * sd2, by = river[k2].y + n6.y * hw[k2] * .7 * sd2; for (j = 0; j < 4; j++) { var px = bx + (R() - .5) * 46, py = by + (R() - .5) * 30; if (water(px, py) < -9 && near(P, px, py) > 66 && near(trail, px, py) > 22 && near(HUTS, px, py) > 40) lily(c, px, py, 5 + R() * 4.6, R() * TAU, j === 0 && i % 2 === 0); } }

  /* a pedra da Iara, com a cauda sumindo na água */
  c.save(); c.translate(lake.x + 6, lake.y + 6);
  c.beginPath(); c.ellipse(0, 8, 30, 9, 0, 0, TAU); c.strokeStyle = 'rgba(235,255,250,.6)'; c.lineWidth = 1.6; c.stroke();
  cel(c, function (c) { poly(c, [-22, 8, -17, -8, -4, -15, 12, -10, 20, 8, 0, 13]); }, '#7f8f8a', { k: 2.4, lw: 2.2, inn: function (c) { c.fillStyle = 'rgba(96,160,110,.9)'; c.beginPath(); c.ellipse(-4, -12, 12, 4.4, -.1, 0, TAU); c.fill(); } });
  c.translate(24, 4);
  c.beginPath(); c.ellipse(1, 9, 11, 3.6, 0, 0, TAU); c.strokeStyle = 'rgba(235,255,250,.75)'; c.lineWidth = 1.5; c.stroke();
  cel(c, function (c) { c.moveTo(-3, 9); c.quadraticCurveTo(-5, -4, -2, -10); c.bezierCurveTo(-12, -13, -17, -23, -11, -29); c.quadraticCurveTo(-5, -20, 2, -16); c.quadraticCurveTo(8, -23, 17, -24); c.bezierCurveTo(17, -14, 9, -10, 5, -9); c.quadraticCurveTo(5, 0, 6, 9); c.closePath(); }, '#3fb890', { k: 1.6, lw: 2.1, sh: 'rgba(0,60,70,.4)', hi: 'rgba(230,255,210,.45)', inn: function (c) { ln(c, [-1, -10, -9, -24], 'rgba(255,230,140,.7)', 1.1); ln(c, [3, -11, 12, -21], 'rgba(255,230,140,.7)', 1.1); ln(c, [-3, 0, 5, 0], 'rgba(0,70,70,.5)', 1); ln(c, [-3, -5, 4.6, -5], 'rgba(0,70,70,.5)', 1); } });
  c.restore();
  spark(c, lake.x - 30, lake.y - 26, 7, 'rgba(255,255,255,.9)'); spark(c, lake.x + 46, lake.y - 34, 5, 'rgba(255,255,255,.85)'); spark(c, lake.x - 52, lake.y + 24, 4, 'rgba(255,255,255,.8)');

  /* árvores e palmeiras; as da beira ficam com o pé na água */
  var PAL = [['#2a6a4a', '#37835a', '#0e2c22', '#56a274'], ['#317650', '#43905a', '#102f20', '#68b474'], ['#26604a', '#327858', '#0c2820', '#4c9670'], ['#3d8650', '#53a05a', '#12331e', '#7cc070']];
  var PALM = [['#3f8f4a', '#8ccc6a', '#102f1c'], ['#357f50', '#7cc070', '#0e2c20']];
  var TR = [], cell = 44, gx, gy;
  for (gy = -1; gy * cell < H + cell; gy++) for (gx = -1; gx * cell < W + cell; gx++) {
    var tx = (gx + .5 + (R() - .5) * .9) * cell, ty = (gy + .5 + (R() - .5) * .9) * cell, tr = 16 + R() * 13, kind = R(), keep = R(), wd = water(tx, ty);
    if (keep < .1 || wd < tr * .5 || (wd < 30 && keep < .5)) continue;
    if (near(P, tx, ty) < 60 + tr * .7 || near(trail, tx, ty) < 13 + tr * .92 || near(HUTS, tx, ty - 14) < 34 + tr) continue;
    TR.push([tx, ty, tr, kind, wd]);
  }
  TR.sort(function (a, b) { return a[1] - b[1]; });
  var hi = 0; HUTS.sort(function (a, b) { return a.y - b.y; });
  TR.forEach(function (q) {
    while (hi < HUTS.length && HUTS[hi].y < q[1]) { hut(c, HUTS[hi].x, HUTS[hi].y, 1.02, HUTS[hi].f); hi++; }
    var wet = q[4] < 78 ? 'rgba(12,58,66,.42)' : null;
    if (q[3] < .2) palm(c, q[0], q[1], q[2] * 1.05, PALM[q[3] < .1 ? 0 : 1], R, wet); else tree(c, q[0], q[1], q[2], PAL[(q[3] * 97 | 0) % 4], R, wet);
  });
  while (hi < HUTS.length) { hut(c, HUTS[hi].x, HUTS[hi].y, 1.02, HUTS[hi].f); hi++; }

  radial(c, W * .8, H * .1, W * .6, '255,232,170', .1, 'lighter');
  vignette(c, W, H, .82, '4,14,16', .3);
}

/** Mapa ilustrado de um capítulo, visto de cima. `points` são as fases em pixels do canvas, na ordem; a trilha passa por elas. */
export function paintChapterMap(c, w, h, chapter, points) {
  var v = enter(c, w, h), P = (points || []).map(function (p) { return { x: p.x / v.u, y: p.y / v.u }; });
  if (chapter === 2) mapRios(c, v.W, v.H, P); else mapMata(c, v.W, v.H, P);
  c.restore();
}

/* ---------------- peças das cenas de lado ---------------- */
function frond(c, x, y, len, ang, wd, col, rib) {
  c.save(); c.translate(x, y); c.rotate(ang);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(len * .45, -wd, len, 0); c.quadraticCurveTo(len * .45, wd, 0, 0); c.closePath(); c.fillStyle = col; c.fill();
  if (rib) { c.beginPath(); c.moveTo(len * .08, 0); c.lineTo(len * .9, 0); c.strokeStyle = rib; c.lineWidth = 1.4; c.stroke(); }
  c.restore();
}
function bush(c, x, y, s, R, col, col2, rib) { for (var i = 0; i < 9; i++) { var a = -Math.PI + .25 + i * .33 + (R() - .5) * .16; frond(c, x, y, (46 + R() * 34) * s, a, (9 + R() * 5) * s, i % 2 ? col : col2, rib); } }
function trunk(c, x, y, wd, col, R, moss) {
  cel(c, function (c) {
    c.moveTo(x - wd * 1.5, y + 6); c.quadraticCurveTo(x - wd * .62, y - wd * .2, x - wd * .5, y - wd * 1.4); c.lineTo(x - wd * .42, -40); c.lineTo(x + wd * .42, -40); c.lineTo(x + wd * .5, y - wd * 1.4);
    c.quadraticCurveTo(x + wd * .66, y - wd * .2, x + wd * 1.6, y + 6); c.quadraticCurveTo(x + wd * .7, y + wd * .3, x + wd * .2, y - wd * .1); c.quadraticCurveTo(x - wd * .3, y + wd * .36, x - wd * 1.5, y + 6); c.closePath();
  }, col, {
    k: wd * .09, lw: 3, sh: 'rgba(6,4,10,.42)', hi: 'rgba(255,236,170,.2)', inn: function (c) {
      for (var i = 0; i < 5; i++) { var d = (i - 2) * wd * .19 + (R() - .5) * 4; c.beginPath(); c.moveTo(x + d, -30); c.bezierCurveTo(x + d + 6, y * .3, x + d - 7, y * .7, x + d + 2, y - 4); c.strokeStyle = 'rgba(14,8,6,.45)'; c.lineWidth = 1.6; c.stroke(); }
      if (moss) { c.fillStyle = moss; c.beginPath(); c.ellipse(x - wd * .34, y - wd * 2.6, wd * .26, wd * .7, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x - wd * .9, y, wd * .7, wd * .22, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + wd * .3, y * .3, wd * .2, wd * .5, 0, 0, TAU); c.fill(); }
    },
  });
}
function liana(c, x, len, sway, col) { rope(c, function (c) { c.moveTo(x, -10); c.bezierCurveTo(x + sway, len * .4, x - sway, len * .7, x + sway * .4, len); }, col, 2.6, '#0a140e'); for (var i = 1; i < 5; i++) { var t = i / 5, yy = len * t; frond(c, x + Math.sin(t * 5) * sway * .5, yy, 16, i % 2 ? .5 : 2.6, 5, col); } }

/** Fundo da tela do herói: clareira com luz no centro, onde o personagem fica (pés por volta de y = 0,62·h). */
export function paintHeroBackdrop(c, w, h) {
  var v = enter(c, w, h), W = v.W, H = v.H, R = rng(77), i, cx = W / 2, hz = H * .545;
  /* fundo: bruma verde */
  var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16301f'); g.addColorStop(.3, '#3b6b40'); g.addColorStop(.56, '#5c8a4c'); g.addColorStop(1, '#1a2c1c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  radial(c, cx, H * .26, H * .78, '250,240,170', .5);
  /* mata distante: duas fileiras de troncos na bruma */
  [[26, 'rgba(58,104,66,.5)', 9, 22, 0], [15, 'rgba(34,74,50,.72)', 16, 34, 10]].forEach(function (ly) {
    for (i = 0; i < ly[0]; i++) { var x = (i + R()) / ly[0] * W, wd = ly[2] + R() * (ly[3] - ly[2]), d = Math.abs(x - cx) / (W / 2); if (d < .16) continue; c.beginPath(); c.moveTo(x - wd * .42, -10); c.lineTo(x + wd * .42, -10); c.lineTo(x + wd * .7, hz + ly[4] + 8); c.lineTo(x - wd * .7, hz + ly[4] + 8); c.closePath(); c.fillStyle = ly[1]; c.fill(); }
    for (i = 0; i < 26; i++) { var bx = R() * W, bd = Math.abs(bx - cx) / (W / 2); c.beginPath(); c.ellipse(bx, hz + ly[4] - 4, 40 + R() * 50, (16 + R() * 20) * (.5 + bd), 0, 0, TAU); c.fillStyle = ly[1]; c.fill(); }
  });
  /* chão */
  g = c.createLinearGradient(0, hz, 0, H); g.addColorStop(0, '#5a8046'); g.addColorStop(.3, '#47703c'); g.addColorStop(1, '#16271a');
  c.beginPath(); c.moveTo(0, hz + 14); c.quadraticCurveTo(cx, hz - 12, W, hz + 14); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fillStyle = g; c.fill();
  for (i = 0; i < 40; i++) { c.beginPath(); c.ellipse(R() * W, hz + 30 + R() * (H - hz), 50 + R() * 90, 8 + R() * 14, 0, 0, TAU); c.fillStyle = i % 2 ? 'rgba(120,160,80,.12)' : 'rgba(10,30,18,.16)'; c.fill(); }
  /* terra batida da clareira */
  [[W * .29, H * .105, '#6f6238'], [W * .25, H * .086, '#8c7646'], [W * .19, H * .06, '#a48a54'], [W * .115, H * .034, '#bda066']].forEach(function (e, n) { c.beginPath(); c.ellipse(cx, H * .65 + n * 2, e[0], e[1], 0, 0, TAU); c.fillStyle = e[2]; c.fill(); });
  for (i = 0; i < 30; i++) { var a = R() * TAU, d = R(), px = cx + Math.cos(a) * W * .24 * d, py = H * .653 + Math.sin(a) * H * .08 * d; c.beginPath(); c.ellipse(px, py, 3 + R() * 5, 1.4 + R() * 2, 0, 0, TAU); c.fillStyle = i % 3 ? 'rgba(90,70,36,.4)' : 'rgba(230,206,150,.4)'; c.fill(); }
  /* tufos de capim em volta, mais fechados nas laterais */
  for (i = 0; i < 190; i++) {
    var tx = R() * W, ty = hz + 12 + R() * R() * (H - hz), k = (ty - hz) / (H - hz), ex = (tx - cx) / (W * .285), ey = (ty - H * .653) / (H * .1);
    if (ex * ex + ey * ey < 1) continue;
    var n = 3 + (R() * 3 | 0), s = .7 + k * 1.5;
    for (var m = 0; m < n; m++) { var an = -1.57 + (m - (n - 1) / 2) * .4 + (R() - .5) * .2, l = (9 + R() * 10) * s; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(tx + Math.cos(an) * l * .5, ty + Math.sin(an) * l * .7, tx + Math.cos(an) * l + 2, ty + Math.sin(an) * l); c.strokeStyle = 'rgba(14,34,18,.8)'; c.lineWidth = 3.2 * s; c.stroke(); c.strokeStyle = m % 2 ? '#6da04c' : '#4f853e'; c.lineWidth = 1.6 * s; c.stroke(); }
  }
  /* pedras e cogumelos na beira da clareira */
  [[.3, .69, 1.1], [.72, .725, .9], [.66, .59, .6], [.36, .6, .55]].forEach(function (q) { var x = q[0] * W, y = q[1] * H, s = q[2]; c.beginPath(); c.ellipse(x + 6 * s, y + 3 * s, 26 * s, 6 * s, 0, 0, TAU); c.fillStyle = 'rgba(8,18,12,.35)'; c.fill(); cel(c, function (c) { poly(c, [x - 20 * s, y, x - 15 * s, y - 14 * s, x - 2 * s, y - 21 * s, x + 14 * s, y - 15 * s, x + 21 * s, y]); }, '#7d7b72', { k: 2.4 * s, lw: 2.4, inn: function (c) { c.fillStyle = 'rgba(96,140,76,.9)'; c.beginPath(); c.ellipse(x - 3 * s, y - 19 * s, 12 * s, 4.6 * s, -.15, 0, TAU); c.fill(); } }); });
  [[.275, .695, 1], [.262, .702, .7], [.745, .732, .9]].forEach(function (q) { var x = q[0] * W, y = q[1] * H, s = q[2]; cel(c, function (c) { cap(c, x, y, x, y - 7 * s, 2.2 * s); }, '#efe6d2', { k: .6, lw: 1.8 }); cel(c, function (c) { c.moveTo(x - 8 * s, y - 7 * s); c.quadraticCurveTo(x, y - 20 * s, x + 8 * s, y - 7 * s); c.closePath(); }, '#c9392c', { k: 1, lw: 2, inn: function (c) { dot(c, x - 2.6 * s, y - 11 * s, 1.3 * s, '#fff'); dot(c, x + 3 * s, y - 9.4 * s, 1.1 * s, '#fff'); } }); });

  /* feixes de luz e a poça de luz onde o herói pisa */
  c.save(); c.globalCompositeOperation = 'lighter';
  [[-70, 60, -250, 40, .13], [-20, 90, -60, 250, .11], [-110, -40, -360, -150, .07], [40, 130, 160, 400, .07]].forEach(function (b) { var lg = c.createLinearGradient(0, 0, 0, H * .74); lg.addColorStop(0, 'rgba(255,246,190,' + b[4] * 1.5 + ')'); lg.addColorStop(1, 'rgba(255,246,190,0)'); c.beginPath(); c.moveTo(cx + b[0], -10); c.lineTo(cx + b[1], -10); c.lineTo(cx + b[3], H * .74); c.lineTo(cx + b[2], H * .74); c.closePath(); c.fillStyle = lg; c.fill(); });
  c.restore();
  c.save(); c.translate(cx, H * .65); c.scale(1, .3); radial(c, 0, 0, W * .25, '255,244,180', .36, 'lighter'); c.restore();

  /* troncos, cipós e folhagem das laterais (o lado esquerdo é o direito espelhado) */
  function side(R) {
    trunk(c, W * .765, hz + 34, 30, '#3a3626', R, 'rgba(70,110,64,.75)');
    bush(c, W * .79, hz + 44, .7, R, '#2f6034', '#3d7440', null);
    trunk(c, W * .885, H * .7, 56, '#3a2c20', R, 'rgba(60,104,58,.85)');
    liana(c, W * .815, H * .34, 16, '#2c5a30'); liana(c, W * .94, H * .46, -20, '#274f2c');
    bush(c, W * .835, H * .735, 1.25, R, '#2c6234', '#3f7a40', 'rgba(16,44,24,.6)');
    bush(c, W * .955, H * .77, 1.5, R, '#24542e', '#316a38', 'rgba(12,36,20,.6)');
    trunk(c, W * 1.0, H * .94, 96, '#261c16', R, 'rgba(40,80,46,.8)');
    bush(c, W * .9, H * 1.0, 2.3, R, '#12301c', '#1a3f24', 'rgba(6,20,12,.7)');
    bush(c, W * .74, H * 1.03, 1.7, R, '#163822', '#1e4a2a', 'rgba(8,24,14,.7)');
    /* copa: folhas pesadas no alto */
    [['#1f4a2a', 70], ['#143420', 40], ['#0c2114', 0]].forEach(function (ly, n) { c.beginPath(); for (var i = 0; i < 22; i++) { var x = W * (.52 + R() * .52), d = (x - cx) / (W / 2), y = -30 + ly[1] * d * 1.6 + R() * 50 * d + d * d * 120 - n * 14, r = 46 + R() * 54; c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU); } c.fillStyle = ly[0]; c.fill(); });
    for (var i = 0; i < 16; i++) { var x = W * (.6 + R() * .42), d = (x - cx) / (W / 2); frond(c, x, 20 + d * d * 210 + R() * 40, 36 + R() * 30, 1.2 + R() * .9, 9 + R() * 5, i % 2 ? '#102a18' : '#1c4426', i % 2 ? null : 'rgba(8,24,14,.6)'); }
  }
  side(rng(311));
  c.save(); c.translate(W, 0); c.scale(-1, 1); side(rng(907)); c.restore();

  /* poeira de luz e vaga-lumes */
  for (i = 0; i < 46; i++) { var fx = cx + (R() - .5) * W * .34 * (.4 + R()), fy = H * (.08 + R() * .6), fr = .8 + R() * 1.8; dot(c, fx, fy, fr * 2.4, 'rgba(255,246,190,.07)'); dot(c, fx, fy, fr, 'rgba(255,250,214,' + (.25 + R() * .45) + ')'); }
  /* laterais escuras para os painéis */
  g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(5,12,9,.86)'); g.addColorStop(.2, 'rgba(5,12,9,.6)'); g.addColorStop(.36, 'rgba(5,12,9,0)'); g.addColorStop(.64, 'rgba(5,12,9,0)'); g.addColorStop(.8, 'rgba(5,12,9,.6)'); g.addColorStop(1, 'rgba(5,12,9,.86)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(5,12,9,.5)'); g.addColorStop(.16, 'rgba(5,12,9,0)'); g.addColorStop(.8, 'rgba(5,12,9,0)'); g.addColorStop(1, 'rgba(5,12,9,.66)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

/* ---------------- forja ---------------- */
/* ferramentas penduradas: origem no gancho, penduradas para baixo */
function hang(c, x, y, len, fn) { ln(c, [x, y, x, y + len], OUT, 3); ln(c, [x, y, x, y + len], '#8a6a44', 1.3); c.save(); c.translate(x, y + len); fn(c); c.restore(); }
var TOOLS = {
  martelo: function (c) { cel(c, function (c) { cap(c, 0, 0, 0, 62, 4); }, '#7a5230', { k: 1.4, lw: 2.4 }); cel(c, function (c) { rr(c, -19, 56, 38, 22, 4); }, '#70757e', { k: 2, lw: 2.6, sh: 'rgba(16,18,36,.5)', inn: function (c) { c.fillStyle = 'rgba(255,200,140,.25)'; c.fillRect(-20, 56, 40, 5); } }); },
  tenaz: function (c) { [[-1], [1]].forEach(function (q) { rope(c, function (c) { c.moveTo(q[0] * 6, 0); c.lineTo(q[0] * -3, 52); c.quadraticCurveTo(q[0] * -12, 66, q[0] * -3, 84); }, '#666b74', 4); }); dot(c, 0, 48, 3.4, '#2a2c34'); dot(c, 0, 48, 1.6, '#9aa0aa'); },
  lima: function (c) { cel(c, function (c) { cap(c, 0, 0, 0, 22, 5); }, '#7a5230', { k: 1.2, lw: 2.4 }); cel(c, function (c) { poly(c, [-4, 22, 4, 22, 2.4, 82, -2.4, 82]); }, '#7c828c', { k: 1.2, lw: 2.4, inn: function (c) { for (var i = 28; i < 80; i += 5) ln(c, [-4, i, 4, i + 3], 'rgba(20,22,36,.5)', 1); } }); },
  ferradura: function (c) { rope(c, function (c) { c.arc(0, 22, 17, -.9, Math.PI + .9); }, '#70757e', 6.5); [[-14, 30], [14, 30], [-16, 16], [16, 16]].forEach(function (q) { dot(c, q[0], q[1], 1.5, '#24262e'); }); },
  lamina: function (c) { cel(c, function (c) { c.moveTo(-7, 0); c.lineTo(7, 0); c.lineTo(9, 56); c.quadraticCurveTo(8, 76, 0, 88); c.quadraticCurveTo(-9, 74, -8, 56); c.closePath(); }, '#8d939c', { k: 2, lw: 2.6, sh: 'rgba(16,18,36,.5)', inn: function (c) { ln(c, [-2, 6, -3, 70], 'rgba(20,22,36,.45)', 1.4); } }); dot(c, 0, 7, 2.4, '#1c1a1e'); },
  corda: function (c) { [0, 4, 8].forEach(function (d) { rope(c, function (c) { c.ellipse(0, 24 + d, 15 - d * .4, 22, 0, 0, TAU); }, '#a8834f', 3.4); }); rope(c, function (c) { c.moveTo(-8, 6); c.lineTo(8, 10); }, '#8a6a3c', 3.4); },
};

/** Fundo do ferreiro: forja de acampamento à noite, quente no centro-baixo e escura nas bordas. */
export function paintForgeBackdrop(c, w, h) {
  var v = enter(c, w, h), W = v.W, H = v.H, R = rng(53), i, j, cx = W / 2, gy = H * .72;
  /* noite */
  var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0f1a'); g.addColorStop(.5, '#1a1620'); g.addColorStop(1, '#170f0c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (i = 0; i < 70; i++) dot(c, R() * W, R() * H * .34, .5 + R() * 1.1, 'rgba(220,230,255,' + (.2 + R() * .5) + ')');
  /* mata em silhueta */
  [['#101624', .36, 60], ['#0c111b', .44, 80]].forEach(function (ly) { c.beginPath(); for (i = 0; i < 40; i++) { var x = (i + R()) / 40 * W, r = ly[2] * (.6 + R() * .7); c.moveTo(x + r, H * ly[1]); c.arc(x, H * ly[1] - R() * 60, r, 0, TAU); } c.rect(0, H * ly[1], W, H); c.fillStyle = ly[0]; c.fill(); });
  radial(c, cx, H * .56, W * .5, '255,120,40', .34);
  /* chão de terra */
  g = c.createLinearGradient(0, gy - 40, 0, H); g.addColorStop(0, '#4a2c1a'); g.addColorStop(.35, '#3a2216'); g.addColorStop(1, '#150c0a');
  c.beginPath(); c.moveTo(0, gy - 22); c.quadraticCurveTo(cx, gy - 44, W, gy - 22); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fillStyle = g; c.fill();
  for (i = 0; i < 50; i++) { c.beginPath(); c.ellipse(R() * W, gy + R() * (H - gy), 20 + R() * 70, 3 + R() * 8, 0, 0, TAU); c.fillStyle = i % 2 ? 'rgba(255,170,90,.06)' : 'rgba(10,4,4,.2)'; c.fill(); }

  /* cobertura: dois esteios, travessa e palha */
  var px0 = W * .2, px1 = W * .8, by = H * .15;
  cel(c, function (c) { poly(c, [px0 - 110, by - 10, cx, -70, px1 + 110, by - 10, px1 + 96, by + 14, cx, -44, px0 - 96, by + 14]); }, '#4a3a22', { k: 3, lw: 3, inn: function (c) { for (i = 0; i < 40; i++) { var x = px0 - 100 + i * (px1 - px0 + 200) / 40; ln(c, [x, by + 14, cx + (x - cx) * .7, -50], 'rgba(16,10,6,.4)', 1.6); } } });
  [px0, px1].forEach(function (x) { cel(c, function (c) { poly(c, [x - 13, by - 6, x + 13, by - 6, x + 15, gy + 6, x - 15, gy + 6]); }, '#553a24', { k: 3, lw: 3, inn: function (c) { ln(c, [x - 4, by, x - 6, gy], 'rgba(16,10,6,.45)', 1.6); ln(c, [x + 6, by, x + 5, gy], 'rgba(16,10,6,.45)', 1.6); } }); });
  cel(c, function (c) { rr(c, px0 - 40, by, px1 - px0 + 80, 22, 6); }, '#644528', { k: 3, lw: 3, inn: function (c) { ln(c, [px0 - 30, by + 8, px1 + 30, by + 7], 'rgba(16,10,6,.4)', 1.6); } });
  [px0, px1].forEach(function (x) { rope(c, function (c) { c.moveTo(x - 15, by + 2); c.lineTo(x + 15, by + 20); c.moveTo(x + 15, by + 2); c.lineTo(x - 15, by + 20); }, '#b08c58', 3); });
  /* ferramentas penduradas na travessa, longe do centro */
  hang(c, W * .255, by + 22, 26, TOOLS.tenaz); hang(c, W * .305, by + 22, 40, TOOLS.martelo); hang(c, W * .355, by + 22, 22, TOOLS.lima);
  hang(c, W * .645, by + 22, 30, TOOLS.lamina); hang(c, W * .695, by + 22, 20, TOOLS.ferradura); hang(c, W * .745, by + 22, 34, TOOLS.corda);

  /* fornalha de pedra */
  var fw = W * .15, fy0 = H * .26, sy = H * .44;
  function body(c) { c.moveTo(cx - fw, gy - 4); c.lineTo(cx - fw * .96, sy + 20); c.quadraticCurveTo(cx - fw * .9, sy - 30, cx - fw * .46, sy - 46); c.lineTo(cx - fw * .4, fy0); c.lineTo(cx + fw * .4, fy0); c.lineTo(cx + fw * .46, sy - 46); c.quadraticCurveTo(cx + fw * .9, sy - 30, cx + fw * .96, sy + 20); c.lineTo(cx + fw, gy - 4); c.closePath(); }
  c.beginPath(); c.ellipse(cx, gy, fw * 1.25, 20, 0, 0, TAU); c.fillStyle = 'rgba(6,3,4,.5)'; c.fill();
  cel(c, body, '#6a625e', {
    k: 5, lw: 3.4, sh: 'rgba(16,10,30,.45)', hi: 'rgba(255,220,170,.14)', inn: function (c) {
      var row = 0, y, x;
      for (y = fy0; y < gy; y += 30, row++) {
        ln(c, [cx - fw, y, cx + fw, y], 'rgba(22,14,14,.6)', 2.6); ln(c, [cx - fw, y + 2.4, cx + fw, y + 2.4], 'rgba(255,220,180,.1)', 1.2);
        for (x = cx - fw - (row % 2) * 30; x < cx + fw; x += 44 + R() * 26) { ln(c, [x, y, x + (R() - .5) * 4, y + 30], 'rgba(22,14,14,.6)', 2.4); if (R() < .4) { c.fillStyle = R() < .5 ? 'rgba(255,230,200,.07)' : 'rgba(10,6,16,.14)'; c.fillRect(x + 2, y + 2, 44, 26); } }
      }
    },
  });
  cel(c, function (c) { rr(c, cx - fw * .5, fy0 - 16, fw, 20, 5); }, '#7a726c', { k: 2.4, lw: 3 });
  /* boca em arco com a brasa */
  var mw = fw * .5, my = gy - 34, mt = H * .5;
  function mouth(c, gI) { c.moveTo(cx - mw - gI, my); c.lineTo(cx - mw - gI, mt + mw); c.arc(cx, mt + mw, mw + gI, Math.PI, 0); c.lineTo(cx + mw + gI, my); c.closePath(); }
  cel(c, function (c) { mouth(c, 20); }, '#8a817a', { k: 3, lw: 3.2, sh: 'rgba(16,10,30,.4)', inn: function (c) { for (i = 0; i < 9; i++) { var a = Math.PI + i * Math.PI / 8; ln(c, [cx + Math.cos(a) * mw, mt + mw + Math.sin(a) * mw, cx + Math.cos(a) * (mw + 22), mt + mw + Math.sin(a) * (mw + 22)], 'rgba(22,14,14,.6)', 2.2); } ln(c, [cx - mw - 22, mt + mw + 34, cx - mw, mt + mw + 34], 'rgba(22,14,14,.6)', 2.2); ln(c, [cx + mw, mt + mw + 34, cx + mw + 22, mt + mw + 34], 'rgba(22,14,14,.6)', 2.2); } });
  c.save(); c.beginPath(); mouth(c, 0); c.fillStyle = '#1a0806'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 3; c.stroke(); c.clip();
  g = c.createLinearGradient(0, mt, 0, my); g.addColorStop(0, 'rgba(120,20,6,.5)'); g.addColorStop(.55, '#d8481a'); g.addColorStop(.85, '#ff9a2a'); g.addColorStop(1, '#ffe27a'); c.fillStyle = g; c.fillRect(cx - mw, mt, mw * 2, my - mt);
  for (i = 0; i < 6; i++) { var fx = cx - mw * .8 + i * mw * .32, fh = 40 + R() * 46; c.beginPath(); c.moveTo(fx - 16, my); c.quadraticCurveTo(fx - 14, my - fh * .5, fx + (R() - .5) * 12, my - fh); c.quadraticCurveTo(fx + 16, my - fh * .5, fx + 16, my); c.closePath(); c.fillStyle = i % 2 ? 'rgba(255,214,90,.75)' : 'rgba(255,150,40,.7)'; c.fill(); }
  for (i = 0; i < 16; i++) { var bx = cx - mw + R() * mw * 2, br = 7 + R() * 9; dot(c, bx, my - 2 - R() * 14, br + 2, '#3a0e06'); dot(c, bx, my - 3 - R() * 14, br, i % 3 ? '#ff8a1e' : '#ffd84a'); }
  c.restore();
  /* soleira */
  cel(c, function (c) { rr(c, cx - fw * 1.1, gy - 34, fw * 2.2, 34, 6); }, '#7d746e', { k: 3, lw: 3.2, sh: 'rgba(16,10,30,.45)', inn: function (c) { c.fillStyle = 'rgba(255,160,70,.35)'; c.fillRect(cx - mw - 10, gy - 36, mw * 2 + 20, 8); [-.6, -.2, .25, .66].forEach(function (k) { ln(c, [cx + fw * k, gy - 34, cx + fw * k + 3, gy], 'rgba(22,14,14,.55)', 2.2); }); } });

  /* à esquerda: barril d'água e lenha */
  var bx0 = W * .285, byy = gy + 26;
  c.beginPath(); c.ellipse(bx0 + 6, byy + 2, 62, 12, 0, 0, TAU); c.fillStyle = 'rgba(6,3,4,.5)'; c.fill();
  cel(c, function (c) { c.moveTo(bx0 - 40, byy - 92); c.quadraticCurveTo(bx0 - 54, byy - 46, bx0 - 42, byy); c.quadraticCurveTo(bx0, byy + 12, bx0 + 42, byy); c.quadraticCurveTo(bx0 + 54, byy - 46, bx0 + 40, byy - 92); c.closePath(); }, '#6a4428', { k: 4, lw: 3, inn: function (c) { [-24, -8, 8, 24].forEach(function (d) { ln(c, [bx0 + d, byy - 92, bx0 + d * 1.2, byy + 6], 'rgba(20,10,6,.5)', 1.6); }); c.fillStyle = '#4a4e58'; c.fillRect(bx0 - 60, byy - 74, 120, 9); c.fillRect(bx0 - 60, byy - 24, 120, 9); } });
  cel(c, function (c) { el(c, bx0, byy - 92, 40, 11); }, '#3a2618', { k: 0, lw: 3, inn: function (c) { c.beginPath(); c.ellipse(bx0, byy - 90, 34, 8, 0, 0, TAU); c.fillStyle = '#23405a'; c.fill(); c.beginPath(); c.ellipse(bx0 + 8, byy - 91, 14, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(255,170,90,.5)'; c.fill(); } });
  [[W * .135, gy + 60, 0], [W * .16, gy + 40, .06], [W * .115, gy + 36, -.05], [W * .14, gy + 16, .02]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); cel(c, function (c) { cap(c, -52, 0, 52, 0, 14); }, '#5a3c26', { k: 3, lw: 2.8, inn: function (c) { ln(c, [-40, -6, 30, -5], 'rgba(20,10,6,.45)', 1.4); ln(c, [-20, 5, 44, 6], 'rgba(20,10,6,.45)', 1.4); } }); cel(c, function (c) { el(c, 56, 0, 8, 13.6); }, '#c09a66', { k: 1.2, lw: 2.4, inn: function (c) { c.beginPath(); c.ellipse(56, 0, 4, 7, 0, 0, TAU); c.strokeStyle = 'rgba(90,60,30,.7)'; c.lineWidth = 1.2; c.stroke(); } }); c.restore(); });

  /* à direita: bancada com ferramentas */
  var tx0 = W * .715, tx1 = W * .93, ty = gy - 34;
  c.beginPath(); c.ellipse((tx0 + tx1) / 2, gy + 54, (tx1 - tx0) * .56, 13, 0, 0, TAU); c.fillStyle = 'rgba(6,3,4,.5)'; c.fill();
  [tx0 + 18, tx1 - 18].forEach(function (x) { cel(c, function (c) { poly(c, [x - 10, ty + 10, x + 10, ty + 10, x + 12, gy + 54, x - 12, gy + 54]); }, '#4e3622', { k: 2.4, lw: 2.8 }); });
  cel(c, function (c) { poly(c, [tx0 + 22, ty + 54, tx1 - 22, ty + 54, tx1 - 22, ty + 64, tx0 + 22, ty + 64]); }, '#48301e', { k: 1.6, lw: 2.6 });
  cel(c, function (c) { rr(c, tx0 - 12, ty - 6, tx1 - tx0 + 24, 22, 5); }, '#76502e', { k: 3, lw: 3, inn: function (c) { ln(c, [tx0, ty + 2, tx1, ty + 1], 'rgba(20,10,6,.45)', 1.4); c.fillStyle = 'rgba(255,170,90,.18)'; c.fillRect(tx0 - 12, ty - 6, 90, 5); } });
  /* sobre a bancada: balde, lâmina em bruto e um martelinho */
  var kx = tx1 - 50;
  cel(c, function (c) { poly(c, [kx - 24, ty - 46, kx + 24, ty - 46, kx + 19, ty - 6, kx - 19, ty - 6]); }, '#5c6068', { k: 2.4, lw: 2.8, sh: 'rgba(16,18,36,.5)', inn: function (c) { c.fillStyle = 'rgba(20,22,36,.45)'; c.fillRect(kx - 26, ty - 38, 52, 4); c.fillRect(kx - 26, ty - 18, 52, 4); } });
  rope(c, function (c) { c.moveTo(kx - 23, ty - 44); c.quadraticCurveTo(kx, ty - 80, kx + 23, ty - 44); }, '#70757e', 2.6);
  c.save(); c.translate(tx0 + 76, ty - 9); c.rotate(-.05); cel(c, function (c) { c.moveTo(-58, -5); c.lineTo(30, -6); c.quadraticCurveTo(52, -5, 62, 0); c.quadraticCurveTo(52, 5, 30, 5); c.lineTo(-58, 5); c.closePath(); }, '#8d939c', { k: 1.8, lw: 2.6, sh: 'rgba(16,18,36,.5)', inn: function (c) { ln(c, [-52, -1, 44, -1], 'rgba(255,200,150,.35)', 1.4); } }); c.restore();

  /* luz quente no centro-baixo, fagulhas e bordas escuras */
  c.save(); c.translate(cx, gy + 6); c.scale(1, .34); radial(c, 0, 0, W * .36, '255,150,60', .34, 'lighter'); c.restore();
  radial(c, cx, my - 20, W * .3, '255,130,40', .3, 'lighter');
  for (i = 0; i < 34; i++) { var sx = cx + (R() - .5) * fw * 2.6, sy2 = my - 30 - R() * R() * H * .5, sr = .8 + R() * 1.8; dot(c, sx, sy2, sr * 2.6, 'rgba(255,150,50,.1)'); dot(c, sx, sy2, sr, 'rgba(255,' + (170 + (R() * 70 | 0)) + ',90,' + (.35 + R() * .5) + ')'); }
  vignette(c, W, H, .9, '4,3,6', .26);
  g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(4,3,6,.7)'); g.addColorStop(.26, 'rgba(4,3,6,0)'); g.addColorStop(.74, 'rgba(4,3,6,0)'); g.addColorStop(1, 'rgba(4,3,6,.7)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.restore();
}

/** Fundo da teia de talentos: céu noturno visto por entre as copas, escuro e de pouco contraste. O desenho é centrado em (w/2, h/2). */
export function paintTalentBackdrop(c, w, h) {
  var v = enter(c, w, h), W = v.W, H = v.H, R = rng(909), i, j, cx = W / 2, cy = H / 2, M = Math.max(W, H);
  var g = c.createRadialGradient(cx, cy, 20, cx, cy, M * .68); g.addColorStop(0, '#17303a'); g.addColorStop(.45, '#0f1f2a'); g.addColorStop(1, '#060b11'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  /* névoa de estrelas, bem apagada */
  c.save(); c.translate(cx, cy); c.rotate(-.42);
  for (i = 0; i < 26; i++) { var nx = (R() - .5) * M * 1.2, ny = (R() - .5) * M * .16; c.save(); c.translate(nx, ny); c.scale(1, .5); radial(c, 0, 0, 90 + R() * 150, i % 3 ? '90,150,160' : '120,110,180', .05); c.restore(); }
  c.restore();
  /* estrelas discretas */
  for (i = 0; i < 300; i++) { var x = R() * W, y = R() * H, r = .5 + R() * R() * 1.5, a = .12 + R() * .38; dot(c, x, y, r, 'rgba(' + (i % 5 ? '214,232,240' : '255,236,190') + ',' + a + ')'); }
  for (i = 0; i < 12; i++) { var sx = R() * W, sy = R() * H; dot(c, sx, sy, 5, 'rgba(190,225,240,.05)'); spark(c, sx, sy, 3.4 + R() * 3, 'rgba(226,240,246,.5)'); }
  /* brilho suave no centro */
  radial(c, cx, cy, Math.min(W, H) * .5, '110,200,180', .15, 'lighter');
  radial(c, cx, cy, Math.min(W, H) * .2, '190,240,220', .1, 'lighter');
  /* copas em silhueta em volta, mais pesadas nos cantos */
  function leafy(col, depth, n, seed) {
    var Q = rng(seed);
    c.beginPath();
    for (i = 0; i < n; i++) {
      var t = Q() * 4, sd = t | 0, f = t - sd, e = Math.abs(f - .5) * 2, d = depth * (.25 + e * e * 1.1) * (.6 + Q() * .6), r = 34 + Q() * 60, x, y;
      if (sd === 0) { x = f * W; y = d - r * .6; } else if (sd === 1) { x = f * W; y = H - d + r * .6; } else if (sd === 2) { x = d - r * .6; y = f * H; } else { x = W - d + r * .6; y = f * H; }
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
    c.fillStyle = col; c.fill();
  }
  leafy('#0d1d1a', 190, 150, 5);
  /* folhas soltas na borda das copas */
  var Q2 = rng(31);
  for (i = 0; i < 120; i++) {
    var t = Q2() * 4, sd = t | 0, f = t - sd, e = Math.abs(f - .5) * 2, d = 150 * (.3 + e * e * 1.1) + Q2() * 50, lx, ly, an;
    if (sd === 0) { lx = f * W; ly = d; an = 1.57; } else if (sd === 1) { lx = f * W; ly = H - d; an = -1.57; } else if (sd === 2) { lx = d; ly = f * H; an = 0; } else { lx = W - d; ly = f * H; an = Math.PI; }
    frond(c, lx, ly, 26 + Q2() * 30, an + (Q2() - .5) * 1.6, 7 + Q2() * 5, i % 3 ? '#0d1d1a' : '#132a24', null);
  }
  leafy('#08130f', 120, 130, 17);
  /* galhos finos cruzando os cantos */
  [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].forEach(function (q, n) { for (j = 0; j < 2; j++) { c.beginPath(); c.moveTo(q[0] - q[2] * 20, q[1] + q[3] * (60 + j * 90 + n * 9)); c.quadraticCurveTo(q[0] + q[2] * (120 + j * 40), q[1] + q[3] * (110 + j * 50), q[0] + q[2] * (250 + j * 60 - n * 14), q[1] + q[3] * (90 + j * 110)); c.strokeStyle = '#08130f'; c.lineWidth = 7 - j * 2.4; c.stroke(); } });
  vignette(c, W, H, .7, '3,6,9', .4);
  c.restore();
}

/** Bigorna sobre o toco, com o martelo apoiado. Centrada em (0,0), cerca de 200 px de largura. `t` (segundos) anima a brasa e as fagulhas. */
export function drawAnvil(c, t) {
  t = t || 0;
  var p = .5 + .5 * Math.sin(t * 2.6), i;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.ellipse(4, 84, 100, 13, 0, 0, TAU); c.fillStyle = 'rgba(8,4,2,.5)'; c.fill();
  /* toco */
  cel(c, function (c) { c.moveTo(-56, 38); c.lineTo(-60, 70); c.quadraticCurveTo(-66, 80, -80, 85); c.quadraticCurveTo(0, 96, 80, 85); c.quadraticCurveTo(66, 80, 60, 70); c.lineTo(56, 38); c.closePath(); }, '#6a4a30', { k: 3.4, lw: 3, inn: function (c) { [-40, -22, -4, 16, 36].forEach(function (d, n) { c.beginPath(); c.moveTo(d, 40); c.quadraticCurveTo(d + (n % 2 ? 5 : -5), 62, d * 1.1, 90); c.strokeStyle = 'rgba(24,12,8,.5)'; c.lineWidth = 1.6; c.stroke(); }); c.fillStyle = 'rgba(96,140,76,.8)'; c.beginPath(); c.ellipse(-52, 80, 16, 5, .2, 0, TAU); c.fill(); } });
  cel(c, function (c) { el(c, 0, 38, 57, 12.5); }, '#c9a26b', { k: 1.6, lw: 3, inn: function (c) { [44, 30, 16].forEach(function (r) { c.beginPath(); c.ellipse(-4, 38, r, r * .22, 0, 0, TAU); c.strokeStyle = 'rgba(90,60,30,.6)'; c.lineWidth = 1.3; c.stroke(); }); } });
  /* bigorna */
  cel(c, function (c) {
    c.moveTo(-104, -38); c.quadraticCurveTo(-72, -47, -44, -47); c.lineTo(86, -47); c.lineTo(86, -29); c.quadraticCurveTo(52, -25, 40, -7); c.lineTo(38, 9); c.quadraticCurveTo(40, 19, 62, 23); c.lineTo(62, 39);
    c.lineTo(-58, 39); c.lineTo(-58, 23); c.quadraticCurveTo(-36, 19, -34, 9); c.lineTo(-36, -7); c.quadraticCurveTo(-44, -23, -66, -25); c.quadraticCurveTo(-90, -28, -104, -38); c.closePath();
  }, '#5d6470', {
    k: 3.6, lw: 3, sh: 'rgba(14,16,36,.5)', hi: 'rgba(255,255,255,.2)', inn: function (c) {
      c.fillStyle = '#b3bbc7'; c.fillRect(-110, -49, 200, 8.6); ln(c, [-66, -40, 86, -40], 'rgba(14,16,36,.5)', 1.6);
      c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(-12, 2, 9, 22, .1, 0, TAU); c.fill();
      ln(c, [-58, 24, 62, 24], 'rgba(14,16,36,.5)', 1.6);
      c.beginPath(); c.moveTo(-58, 37); c.lineTo(62, 37); c.strokeStyle = 'rgba(255,140,50,' + (.3 + p * .25) + ')'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(-100, -36); c.quadraticCurveTo(-88, -28, -66, -26); c.strokeStyle = 'rgba(255,150,60,' + (.35 + p * .3) + ')'; c.lineWidth = 2.4; c.stroke();
      dot(c, 4, 4, 5, 'rgba(14,16,36,.45)'); dot(c, 4, 4, 2.4, '#8a919c');
    },
  });
  /* lâmina em brasa sobre a mesa */
  var hot = 'rgb(255,' + Math.round(150 + p * 60) + ',' + Math.round(40 + p * 50) + ')';
  cel(c, function (c) { c.moveTo(-90, -52); c.quadraticCurveTo(-80, -56, -34, -55); c.lineTo(-28, -51); c.lineTo(-34, -47.4); c.lineTo(-84, -48); c.closePath(); }, hot, { k: 0, lw: 2.4, out: '#6a1e06', inn: function (c) { ln(c, [-82, -52, -36, -51.6], 'rgba(255,246,190,.9)', 1.6); } });
  /* martelo apoiado */
  cel(c, function (c) { cap(c, 26, -63, 102, -71, 5); }, '#9a6a3a', { k: 1.6, lw: 2.8, inn: function (c) { ln(c, [84, -73, 86, -63], '#3a2014', 1.6); ln(c, [92, -74, 94, -64], '#3a2014', 1.6); } });
  cel(c, function (c) { rr(c, 6, -84, 32, 37, 5); }, '#8d939c', { k: 2.6, lw: 3, sh: 'rgba(14,16,36,.5)', hi: 'rgba(255,255,255,.3)', inn: function (c) { c.fillStyle = 'rgba(14,16,36,.35)'; c.fillRect(4, -55, 36, 9); ln(c, [11, -78, 33, -78], 'rgba(255,255,255,.5)', 1.8); } });
  /* brilho da brasa e fagulhas */
  c.save(); c.globalCompositeOperation = 'lighter';
  var gr = 46 + p * 12, g = c.createRadialGradient(-58, -52, 0, -58, -52, gr); g.addColorStop(0, 'rgba(255,170,60,' + (.4 + p * .22) + ')'); g.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = g; c.fillRect(-58 - gr, -52 - gr, gr * 2, gr * 2);
  for (i = 0; i < 9; i++) { var u = (t * .55 + i * .37) % 1, x = -58 + Math.sin(i * 2.4) * 24 + (i % 2 ? 1 : -1) * u * 20 + Math.sin(t * 3 + i) * 2, y = -54 - u * (46 + (i % 3) * 16) + u * u * 14; dot(c, x, y, (1 - u) * 2.2 + .5, 'rgba(255,' + Math.round(220 - 90 * u) + ',90,' + (1 - u) + ')'); }
  c.restore();
  c.restore();
}
