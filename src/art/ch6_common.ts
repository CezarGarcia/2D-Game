// @ts-nocheck
/* Ajudantes e cores do Capítulo 6, "Pampa de lua cheia". Mesmo estilo de characters.ts:
   peças recortadas com sombra, brilho e contorno. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik } from './characters';

export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik };
export var PI = Math.PI;
export var EYE = '#ffe0f0', EYEG = '#ff3d8a';
/* roxo-sombra: o resto de cor dos Assombros do Pampa */
export var SH = '#b98cff', SH2 = '#8a5fd6', SH3 = '#e2d0ff';
/* cinzas puxados para o violeta da noite */
export var G0 = '#b5b2c4', G1 = '#8e8ba0', G2 = '#737086', G3 = '#5a576c', G4 = '#423f52';
/* sombra e brilho do cel para as peças cinzentas (luar frio) */
export var SHD = 'rgba(16,8,40,.36)', HIL = 'rgba(214,226,255,.26)';
export var AO = { k: 1.2, lw: 2, sh: SHD, hi: HIL };

export function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
export function lp(a, b, k) { return a + (b - a) * k; }
export function sm(k) { return k * k * (3 - 2 * k); }
/* janela: 0 fora de [a,b], sobe suave até 1 */
export function win(k, a, b) { return sm(cl((k - a) / (b - a))); }
/* traço grosso com contorno */
export function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
/* Bézier cúbica amostrada, cada ponto com um raio */
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
/* braço/perna de dois segmentos: escolhe a dobra pela direção `dir` */
export function limb(c, ax, ay, bx, by, l1, l2, dir, r1, r2, c1, c2, o) {
  var k = ik(ax, ay, bx, by, l1, l2, dir);
  cel(c, function (c) { cap(c, ax, ay, k[0], k[1], r1); }, c1, o || AO);
  cel(c, function (c) { cap(c, k[0], k[1], bx, by, r2); }, c2 || c1, o || AO);
  return k;
}
/* olho de Assombro: rosa brilhante com miolo claro */
export function ghostEye(c, x, y, rx, ry, rot) { glow(c, x, y, rx, ry == null ? rx : ry, EYE, EYEG, Math.max(5, rx * 4), rot || 0); }
export function tooth(c, x, y, w, h, col) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y + h); c.lineTo(x + w, y); c.closePath(); c.fillStyle = col || '#efeae0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .7; c.lineJoin = 'round'; c.stroke(); }
/* garra curva */
export function claw(c, x, y, a, l, col) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, -1.1); c.quadraticCurveTo(l * .7, -1, l, l * .45); c.quadraticCurveTo(l * .5, .4, 0, 1.1); c.closePath(); c.fillStyle = col || '#e9e4d8'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); c.restore(); }
/* brilho aditivo redondo */
export function halo(c, x, y, r, rgb, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
/* faísca de quatro pontas */
export function spark(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill(); }
/* tufos de pelo na borda de uma peça (dentro do recorte) */
export function furStrokes(c, x0, y0, x1, y1, n, col, lw, len, ang) { for (var i = 0; i < n; i++) { var u = (i + .5) / n, x = lp(x0, x1, u), y = lp(y0, y1, u); ln(c, [x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len], col, lw || .9); } }
/* listras do poncho (dentro do recorte) */
export function stripes(c, x0, x1, y, gap, cols, lw) { for (var i = 0; i < cols.length; i++) { c.beginPath(); c.moveTo(x0, y + i * gap); c.lineTo(x1, y + i * gap); c.strokeStyle = cols[i]; c.lineWidth = lw || 1.4; c.stroke(); } }
export function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
