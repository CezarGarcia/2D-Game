// @ts-nocheck
/* Ajudantes do Capítulo 5 (Selva Profunda). Mesmo estilo de characters.ts: peças recortadas com
   sombra, brilho e contorno. Aqui ficam também o "contorno de luz" (um fio claro em volta da
   silhueta, para os bichos lerem nas arenas escuras) e os olhos de Assombro com halo forte. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik, seg2 } from './characters';

export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik, seg2 };
export var PI = Math.PI, EYE = '#ffe0f0', EYEG = '#ff3d8a', AMB = '#d9a441', AMB2 = '#ffd27a', AMB3 = '#8a5a1c';
/* cinzas de Assombro puxados para o verde-azulado da mata */
export var G0 = '#a8b3ae', G1 = '#86918d', G2 = '#6d7875', G3 = '#555f5d', G4 = '#3e4746', G5 = '#2c3433';
export function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
export function lp(a, b, k) { return a + (b - a) * k; }
export function sm(k) { k = cl(k); return k * k * (3 - 2 * k); }
/* trecho [a,b] de k remapeado para 0..1 */
export function seg(k, a, b) { return cl((k - a) / (b - a)); }
export function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
export function bz(x0, y0, x1, y1, x2, y2, x3, y3, n, r0, r1) { var P = [], i, u, v; for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; P.push([v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3, r0 + (r1 - r0) * u]); } return P; }
/* tubo de espessura variável ao longo de pontos [x,y,raio] */
export function tube(P) {
  return function (c) {
    var n = P.length, i, S = [];
    for (i = 0; i < n; i++) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; S.push(Math.atan2(b[1] - a[1], b[0] - a[0])); }
    for (i = 0; i < n; i++) c[i ? 'lineTo' : 'moveTo'](P[i][0] - Math.sin(S[i]) * P[i][2], P[i][1] + Math.cos(S[i]) * P[i][2]);
    c.arc(P[n - 1][0], P[n - 1][1], P[n - 1][2], S[n - 1] + PI / 2, S[n - 1] - PI / 2, true);
    for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0] + Math.sin(S[i]) * P[i][2], P[i][1] - Math.cos(S[i]) * P[i][2]);
    c.arc(P[0][0], P[0][1], P[0][2], S[0] - PI / 2, S[0] + PI / 2, true); c.closePath();
  };
}
export function tooth(c, x, y, w, h, col) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y + h); c.lineTo(x + w, y); c.closePath(); c.fillStyle = col || '#efe9da'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .7; c.lineJoin = 'round'; c.stroke(); }
/* braço de dois segmentos, escolhendo a dobra com o cotovelo mais baixo (ou o lado `pref`) */
export function arm2(c, sx, sy, hx, hy, l1, l2, pref, r1, r2, c1, c2, op) {
  var k1 = ik(sx, sy, hx, hy, l1, l2, 1), k2 = ik(sx, sy, hx, hy, l1, l2, -1), k = Math.abs(k1[1] - k2[1]) < 3 ? ((k1[0] - k2[0]) * pref > 0 ? k1 : k2) : (k1[1] > k2[1] ? k1 : k2);
  cel(c, function (c) { cap(c, sx, sy, k[0], k[1], r1); }, c1, op); cel(c, function (c) { cap(c, k[0], k[1], hx, hy, r2); }, c2, op); return k;
}
/* pelo: tufos curtos de traço dentro de uma peça (use no `inn`) */
export function furStrokes(c, R, x0, y0, x1, y1, n, col, len, ang, lw) {
  c.beginPath();
  for (var i = 0; i < n; i++) { var x = lp(x0, x1, R()), y = lp(y0, y1, R()), a = ang + (R() - .5) * .7, l = len * (.6 + R() * .6); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * .5 + 1, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); }
  c.strokeStyle = col; c.lineWidth = lw || .8; c.lineCap = 'round'; c.stroke();
}
export function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* contorno de franja de pelo: pontas em zigue-zague ao longo de uma linha de pontos */
export function fringe(c, P, len, ang, n) {
  /* P: [[x,y],...] em ordem; desenha um caminho fechado com as pontas penduradas para `ang` */
  c.moveTo(P[0][0], P[0][1]);
  for (var i = 1; i < P.length; i++) {
    var a = P[i - 1], b = P[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = len * (i % 2 ? 1 : .7);
    c.quadraticCurveTo(mx + Math.cos(ang) * l * .3, my + Math.sin(ang) * l * .3, mx + Math.cos(ang) * l, my + Math.sin(ang) * l);
    c.quadraticCurveTo(b[0] + Math.cos(ang) * l * .2, b[1] + Math.sin(ang) * l * .2, b[0], b[1]);
  }
}

/* ---------------- olhos de Assombro ----------------
   O olho é desenhado na peça (miolo claro com glow) e o halo rosa forte é guardado em coordenadas do
   aparelho, para ser pintado depois do contorno de luz, em modo 'lighter' (lê no escuro). */
var HALOS = [], BASE = null, MARKS = {};
/* guarda um ponto em coordenadas da célula (o sistema do kit), a partir do quadro atual do desenho */
function toCell(c, x, y) { var T = c.getTransform(), X = T.a * x + T.c * y + T.e, Y = T.b * x + T.d * y + T.f; return BASE ? [(X - BASE.e) / BASE.a, (Y - BASE.f) / BASE.a, Math.hypot(T.a, T.b) / BASE.a] : [x, y, 1]; }
export function aeye(c, x, y, r, o) {
  o = o || {}; var sq = o.sq == null ? 1 : o.sq, rot = o.rot || 0, p = toCell(c, x, y);
  HALOS.push({ x: p[0], y: p[1], r: r * p[2] * (o.halo || 3.4) * 1.2, a: o.a == null ? 1 : o.a });
  if (o.socket !== false) { c.beginPath(); c.ellipse(x, y, r * 1.35, r * 1.35 * Math.max(.55, sq), rot, 0, TAU); c.fillStyle = '#1a0c16'; c.fill(); }
  glow(c, x, y, r, r * sq, EYE, EYEG, o.blur || 8, rot);
  if (sq > .5) dot(c, x + r * .28, y - r * .3 * sq, r * .3, '#ffffff');
}
/* halo extra (bocas, pedras acesas): mesmo esquema dos olhos, com cor própria */
export function halo(c, x, y, r, rgb, a) { var p = toCell(c, x, y); HALOS.push({ x: p[0], y: p[1], r: r * p[2], a: a == null ? 1 : a, rgb: rgb }); }
function paintHalos(c, list) {
  c.save(); c.globalCompositeOperation = 'lighter';
  list.forEach(function (h) {
    var rgb = h.rgb || '255,61,138', g = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + Math.min(1, .9 * h.a) + ')'); g.addColorStop(.3, 'rgba(' + rgb + ',' + (.4 * h.a) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(h.x - h.r, h.y - h.r, h.r * 2, h.r * 2);
  });
  c.restore();
}

/* ---------------- contorno de luz ----------------
   Cada animação é desenhada primeiro numa tira (uma célula por quadro, com folga entre elas), com o
   corpo. Da tira sai a silhueta tingida de uma cor clara. No quadro do kit vão: a silhueta deslocada
   em 4 direções (um fio de luz por fora do contorno escuro, para ler nas arenas escuras), o corpo, os
   halos dos olhos e os efeitos (`fx`, sem fio). Só a caixa do conteúdo de cada célula é copiada. */
export function mark(c, name, x, y) { var p = toCell(c, x, y); MARKS[name] = [p[0], p[1]]; }
export function getMark(n, dx, dy) { return MARKS[n] || [dx || 0, dy || 0]; }
var RAMP = ['atk', 'cast', 'hide', 'act'], PAD = 8;
/* caixa do conteúdo de cada célula da tira: reduz 8× (em passos de 2, que fazem média) e lê a miniatura */
function boxes(cv, W, H, n, cw, pad) {
  var w1 = Math.ceil(W / 2), h1 = Math.ceil(H / 2), w2 = Math.ceil(w1 / 2), h2 = Math.ceil(h1 / 2), w3 = Math.ceil(w2 / 2), h3 = Math.ceil(h2 / 2);
  var a = canvas(w1, h1), b = canvas(w2, h2), d = canvas(w3, h3);
  a[1].drawImage(cv, 0, 0, W, H, 0, 0, W / 2, H / 2); b[1].drawImage(a[0], 0, 0, w1, h1, 0, 0, w1 / 2, h1 / 2); d[1].drawImage(b[0], 0, 0, w2, h2, 0, 0, w2 / 2, h2 / 2);
  var px = d[1].getImageData(0, 0, w3, h3).data, out = [], i, x, y;
  for (i = 0; i < n; i++) {
    var X0 = i * (cw + PAD), cx0 = Math.floor(X0 / 8), cx1 = Math.min(w3, Math.ceil((X0 + cw) / 8)), mx0 = 1e9, my0 = 1e9, mx1 = -1, my1 = -1;
    for (y = 0; y < h3; y++) for (x = cx0; x < cx1; x++) if (px[(y * w3 + x) * 4 + 3] > 0) { if (x < mx0) mx0 = x; if (x > mx1) mx1 = x; if (y < my0) my0 = y; if (y > my1) my1 = y; }
    if (mx1 < 0) { out.push(null); continue; }
    out.push([Math.max(X0, mx0 * 8 - pad), Math.max(0, my0 * 8 - pad), Math.min(X0 + cw, (mx1 + 1) * 8 + pad), Math.min(H, (my1 + 1) * 8 + pad)]);
  }
  return out;
}
function canvas(w, h) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; return [cv, cv.getContext('2d')]; }
/* opt(anim, k) → { col: cor do fio, rim: largura (px de tela, padrão 1,3; menor = mais fraco), dim: escurecer o corpo 0..1 } */
export function bakeRimmed(kit, s, body, fx, opt) {
  var strip = null;
  function build(anim, m) {
    var n = s.anims[anim], r = RAMP.indexOf(anim) >= 0, ks = [], i;
    for (i = 0; i < n; i++) ks.push(r ? (n > 1 ? i / (n - 1) : 1) : i / n);
    var cw = Math.ceil(s.cellW * m), ch = Math.ceil(s.cellH * m), W = (cw + PAD) * n, A = canvas(W, ch), g = A[1], sc = m * s.scale, marks = [], opts = [], halos = [];
    ks.forEach(function (k, i) {
      var x0 = i * (cw + PAD), o = opt(anim, k) || {};
      g.save(); g.beginPath(); g.rect(x0, 0, cw, ch); g.clip();
      g.setTransform(sc, 0, 0, sc, x0 + s.ox * m, s.oy * m); g.lineCap = 'round'; g.lineJoin = 'round';
      BASE = { a: sc, e: x0 + s.ox * m, f: s.oy * m }; MARKS = {}; HALOS = [];
      body(g, anim, k);
      BASE = null; marks.push(MARKS); opts.push(o); halos.push(HALOS); HALOS = []; MARKS = {};
      if (o.dim) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(4,10,12,' + o.dim + ')'; g.fillRect(x0, 0, cw, ch); }
      g.restore();
    });
    var B = canvas(W, ch), b = B[1], base = opts[0] || {}, bx = boxes(A[0], W, ch, n, cw, Math.ceil(1.3 * m) + 10);
    b.drawImage(A[0], 0, 0); b.globalCompositeOperation = 'source-in'; b.fillStyle = base.col || 'rgba(196,226,214,.9)'; b.fillRect(0, 0, W, ch);
    return { anim: anim, m: m, ks: ks, A: A[0], B: B[0], bx: bx, opts: opts, marks: marks, halos: halos, cw: cw, sc: sc };
  }
  kit.creature(s, function (c, anim, k) {
    var T = c.getTransform(), m = Math.round(T.a / s.scale * 100) / 100 || 1, i, best = 0;
    if (!strip || strip.anim !== anim || strip.m !== m) strip = build(anim, m);
    for (i = 1; i < strip.ks.length; i++) if (Math.abs(strip.ks[i] - k) < Math.abs(strip.ks[best] - k)) best = i;
    var q = strip.bx[best], o = strip.opts[best], sc = strip.sc, x0 = best * (strip.cw + PAD);
    if (q) {
      var w = q[2] - q[0], h = q[3] - q[1], dx = (q[0] - x0 - s.ox * m) / sc, dy = (q[1] - s.oy * m) / sc, f = o.rim == null ? 1 : o.rim / 1.3, rw = 1.3 / s.scale;
      if (f > 0 && (strip.opts[0] || {}).rim !== 0) { c.save(); c.globalAlpha = Math.min(1, f); for (var j = 0; j < 4; j++) { var a = j * TAU / 4 + .785; c.drawImage(strip.B, q[0], q[1], w, h, dx + Math.cos(a) * rw, dy + Math.sin(a) * rw, w / sc, h / sc); } c.restore(); }
      c.drawImage(strip.A, q[0], q[1], w, h, dx, dy, w / sc, h / sc);
    }
    paintHalos(c, strip.halos[best]);
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; MARKS = strip.marks[best]; fx(c, anim, k); MARKS = {}; c.restore();
  });
  strip = null;
}
