// @ts-nocheck
/* Ajudantes do Capítulo 4 (Cerrado em chamas): fogo em camadas, tubos, sorteio determinístico e paletas.
   Mesmo estilo de characters.ts (peças recortadas, contorno grosso). */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik } from './characters';

export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik };
export var PI = Math.PI;
export var EYE = '#ffe0f0', EYEG = '#ff3d8a';
/* brasa: o resto de cor dos Assombros do capítulo */
export var EMB = '#ff8a2a', EMB2 = '#ffd36a', EMBD = '#d9481c';
export var FIRE = ['#e2401f', '#ff8a2a', '#ffd36a'];
/* fogo do Boitatá Assombro: rosa-alaranjado */
export var FIRE_P = ['#e8345e', '#ff7a4a', '#ffd6a8'];
/* fogo do Boitatá libertado: azul e dourado */
export var FIRE_B = ['#2a5fd6', '#4fb8ff', '#e8fbff'];
export var FIRE_G = ['#d98a1a', '#ffd23f', '#fff6c8'];

export function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
export function lp(a, b, k) { return a + (b - a) * k; }
export function sm(k) { return k * k * (3 - 2 * k); }
export function rng(s) { s = s >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
/* valor de um quadro numa lista de quadros-chave, pelo k de uma passagem de n quadros */
export function key(arr, k) { var n = arr.length - 1, f = k * n, i = Math.min(n - 1, Math.floor(f)), u = f - i; return n < 1 ? arr[0] : arr[i] + (arr[i + 1] - arr[i]) * u; }

/* traço grosso com contorno */
export function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
/* Bézier cúbica amostrada; cada ponto leva o raio do tubo */
export function bz(x0, y0, x1, y1, x2, y2, x3, y3, n, r0, r1) { var P = [], i, u, v; for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; P.push([v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3, r0 + (r1 - r0) * u]); } return P; }
/* tubo de espessura variável por uma linha de pontos [x,y,r] */
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
export function tooth(c, x, y, w, h, col) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y + h); c.lineTo(x + w, y); c.closePath(); c.fillStyle = col || '#f4efe2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.lineJoin = 'round'; c.stroke(); }
/* braço/perna de dois segmentos com alvo limitado ao alcance (o pé nunca estica além da perna) */
export function reach(ax, ay, bx, by, L) { var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if (d <= L) return [bx, by]; return [ax + dx / d * L, ay + dy / d * L]; }
export function limb(c, ax, ay, bx, by, l1, l2, dir, r1, r2, c1, c2, o) {
  var e = reach(ax, ay, bx, by, l1 + l2 - .3), k = ik(ax, ay, e[0], e[1], l1, l2, dir);
  cel(c, function (c) { cap(c, ax, ay, k[0], k[1], r1); }, c1, o); cel(c, function (c) { cap(c, k[0], k[1], e[0], e[1], r2); }, c2, o); return [k, e];
}

/* uma língua de fogo: base em (x,y), meia-largura w, altura h, ponta deslocada s */
export function flamePath(c, x, y, w, h, s) {
  c.moveTo(x - w, y);
  c.bezierCurveTo(x - w * 1.2, y - h * .42, x + s * .45 - w * .35, y - h * .66, x + s, y - h);
  c.bezierCurveTo(x + s * .45 + w * .55, y - h * .6, x + w * 1.2, y - h * .4, x + w, y);
  c.quadraticCurveTo(x, y + w * .8, x - w, y); c.closePath();
}
/* chama em três camadas (de fora para dentro), com contorno opcional */
export function flame(c, x, y, w, h, s, cols, out, lw) {
  if (out) { c.beginPath(); flamePath(c, x, y, w, h, s); c.strokeStyle = OUT; c.lineWidth = lw || 2.6; c.lineJoin = 'round'; c.stroke(); }
  c.beginPath(); flamePath(c, x, y, w, h, s); c.fillStyle = cols[0]; c.fill();
  c.beginPath(); flamePath(c, x + s * .08, y - w * .12, w * .66, h * .72, s * .75); c.fillStyle = cols[1]; c.fill();
  c.beginPath(); flamePath(c, x + s * .12, y - w * .2, w * .36, h * .44, s * .5); c.fillStyle = cols[2]; c.fill();
}
/* fogueira de várias línguas ao longo de uma base de largura `wd`; ph = fase (radianos) */
export function fire(c, x, y, wd, h, ph, cols, n, out, lean) {
  n = n || 5; lean = lean || 0; var T = [], i;
  for (i = 0; i < n; i++) {
    var u = n > 1 ? i / (n - 1) - .5 : 0, hh = h * (1 - Math.abs(u) * 1.1) * (.78 + .22 * Math.sin(ph + i * 2.1)) + h * .12, sw = Math.sin(ph * 1 + i * 1.7) * h * .12 + lean * hh;
    T.push([x + u * wd, Math.max(h * .2, hh), sw, wd / n * .62 + h * .05]);
  }
  if (out) T.forEach(function (q) { c.beginPath(); flamePath(c, q[0], y, q[3], q[1], q[2]); c.strokeStyle = OUT; c.lineWidth = 2.6; c.lineJoin = 'round'; c.stroke(); });
  [[1, 0], [.7, 1], [.42, 2]].forEach(function (L) { c.fillStyle = cols[L[1]]; c.beginPath(); T.forEach(function (q) { flamePath(c, q[0] + q[2] * .06 * L[1], y - q[3] * .14 * L[1], q[3] * L[0], q[1] * (L[0] * .9 + .1), q[2] * (.5 + L[0] * .5)); }); c.fill(); });
}
/* halo de luz aditivo (sem shadowBlur) */
export function halo(c, x, y, r, rgb, a) {
  var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
  c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
}
/* olho de Assombro: rosa brilhante com miolo claro */
export function eye(c, x, y, rx, ry, rot, blur) { glow(c, x, y, rx, ry, EYEG, EYEG, blur == null ? 9 : blur, rot || 0); c.beginPath(); c.ellipse(x - rx * .1, y - ry * .12, rx * .52, ry * .52, rot || 0, 0, TAU); c.fillStyle = EYE; c.fill(); }
/* fagulha (losango curvo) */
export function spark(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill(); }
/* fumaça: bolinhas cinzentas translúcidas */
export function puff(c, x, y, r, a, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * .7, y + r * .2, r * .7, 0, TAU); c.arc(x - r * .6, y + r * .3, r * .6, 0, TAU); c.fillStyle = (col || 'rgba(70,62,60,') + a + ')'; c.fill(); }
/* mistura de cores hex */
export function mix(a, b, k) {
  var p = function (h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }, A = p(a), B = p(b);
  return 'rgb(' + Math.round(lp(A[0], B[0], k)) + ',' + Math.round(lp(A[1], B[1], k)) + ',' + Math.round(lp(A[2], B[2], k)) + ')';
}
