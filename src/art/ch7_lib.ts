// @ts-nocheck
/* Ajudantes de desenho do Capítulo 7 (Pantanal da Cuca). Os básicos vêm de characters.ts;
   aqui ficam os que characters3.ts usa por dentro (tubos, dentes, gotas) e as cores do capítulo. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik, seg2 } from './characters';

export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik, seg2 };
export var PI = Math.PI, EYE = '#ffe0f0', EYEG = '#ff3d8a';
/* resto de cor do capítulo: verde-veneno e magenta de feitiço */
export var VEN = '#7CFC9A', VEN2 = '#3fcf72', MAG = '#ff4fc8', MAG2 = '#c02a9a';
/* cinzentos de Assombro, puxados de leve para o verde do pantanal */
export var G1 = '#7d847f', G2 = '#666d69', G3 = '#4e5451', G4 = '#383d3b', GL = '#b7bcb3', GLL = '#d6d8cf';

export function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
export function lp(a, b, k) { return a + (b - a) * k; }
export function sm(k) { k = cl(k); return k * k * (3 - 2 * k); }
/* trecho [a,b] de uma passagem k, reescalado para 0..1 */
export function seg(k, a, b) { return cl((k - a) / (b - a)); }
/* traço grosso com contorno */
export function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
/* Bézier cúbica amostrada, cada ponto com o raio do tubo naquele lugar */
export function bz(x0, y0, x1, y1, x2, y2, x3, y3, n, r0, r1, pw) {
  var P = [], i, u, v; for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; P.push([v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3, r0 + (r1 - r0) * (pw ? Math.pow(u, pw) : u)]); } return P;
}
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
export function tooth(c, x, y, w, h, col) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y + h); c.lineTo(x + w, y); c.closePath(); c.fillStyle = col || '#f4efe2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.lineJoin = 'round'; c.stroke(); }
export function drop(c, x, y, r, al, col, out) { c.save(); c.globalAlpha = cl(al); c.beginPath(); c.moveTo(x, y - r * 1.7); c.quadraticCurveTo(x + r * 1.2, y, x, y + r); c.quadraticCurveTo(x - r * 1.2, y, x, y - r * 1.7); c.fillStyle = col || '#e4f4fa'; c.fill(); c.strokeStyle = out || 'rgba(34,40,60,.55)'; c.lineWidth = .7; c.stroke(); c.restore(); }
/* bolha de feitiço: bolinha com contorno e brilho */
export function bubble(c, x, y, r, col, al) { if (r <= .1) return; c.save(); c.globalAlpha = al == null ? 1 : cl(al); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(40,10,40,.75)'; c.lineWidth = .8; c.stroke(); dot(c, x - r * .35, y - r * .35, r * .3, 'rgba(255,255,255,.75)'); c.restore(); }
/* escamas em fileiras (usar dentro do recorte de uma peça) */
export function scales(c, x0, x1, y0, y1, col, s) { s = s || 1; c.strokeStyle = col; c.lineWidth = .8; c.lineCap = 'round'; var r = 0, x, y; for (y = y0; y <= y1; y += 3.1 * s, r++) for (x = x0 + (r % 2) * 2.2 * s; x <= x1; x += 4.4 * s) { c.beginPath(); c.arc(x, y, 2.3 * s, .2, PI - .2); c.stroke(); } }
/* braço de dois segmentos: escolhe o cotovelo mais baixo; no empate, o lado `pref` */
export function arm2(c, sx, sy, hx, hy, l1, l2, pref, r1, r2, c1, c2, op) {
  var k1 = ik(sx, sy, hx, hy, l1, l2, 1), k2 = ik(sx, sy, hx, hy, l1, l2, -1), k = Math.abs(k1[1] - k2[1]) < 3 ? ((k1[0] - k2[0]) * pref > 0 ? k1 : k2) : (k1[1] > k2[1] ? k1 : k2);
  cel(c, function (c) { cap(c, sx, sy, k[0], k[1], r1); }, c1, op); cel(c, function (c) { cap(c, k[0], k[1], hx, hy, r2); }, c2, op); return k;
}
/* olho de Assombro: miolo claro com brilho rosa */
export function eye(c, x, y, r, ry, rot) { glow(c, x, y, r, ry == null ? r : ry, EYE, EYEG, Math.max(5, r * 4), rot || 0); }
/* estrelinhas de tonto girando acima de (x,y) */
export function dizzy(c, x, y, k, col, rx) { rx = rx || 11; for (var i = 0; i < 3; i++) { var a = k * TAU + i * 2.094; star(c, x + Math.cos(a) * rx, y + Math.sin(a) * rx * .3, 2.6 - (i % 2) * .5, col || '#ffd0e4'); } }
/* nota musical (colcheia), para o canto de ninar */
export function note(c, x, y, s, col, al, dbl) {
  c.save(); c.globalAlpha = cl(al); c.translate(x, y); c.scale(s, s);
  c.beginPath(); el(c, 0, 0, 2.6, 1.9, -.4); if (dbl) el(c, 7, -1.6, 2.6, 1.9, -.4); c.fillStyle = col; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  ln(c, [2.2, -.4, 2.2, -10], OUT, 2.4); ln(c, [2.2, -.4, 2.2, -10], col, 1);
  if (dbl) { ln(c, [9.2, -2, 9.2, -11.6], OUT, 2.4); ln(c, [9.2, -2, 9.2, -11.6], col, 1); ln(c, [2.2, -10, 9.2, -11.6], OUT, 3.6); ln(c, [2.2, -10, 9.2, -11.6], col, 1.8); }
  else { c.beginPath(); c.moveTo(2.2, -10); c.quadraticCurveTo(6.4, -8, 5.4, -4); c.strokeStyle = OUT; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = col; c.lineWidth = 1; c.stroke(); }
  c.restore();
}
/* traços de impacto no chão */
export function impact(c, x, y, k, col, n) {
  n = n || 7; if (k <= 0) return;
  for (var i = 0; i < n; i++) { var a = PI + (i + .5) / n * PI, r0 = 8 + k * 6, r1 = r0 + 5 + k * 6; ln(c, [x + Math.cos(a) * r0, y + Math.sin(a) * r0 * .5, x + Math.cos(a) * r1, y + Math.sin(a) * r1 * .5], col || 'rgba(230,226,210,' + (.9 * k) + ')', 1.6); }
  c.beginPath(); c.ellipse(x, y, 10 + k * 14, 2.6 + k * 3, 0, 0, TAU); c.strokeStyle = 'rgba(220,240,236,' + (.6 * k) + ')'; c.lineWidth = 1.4; c.stroke();
}
/* arco de movimento (rastro de golpe) */
export function swoosh(c, x, y, r, a0, a1, al, col) {
  if (al <= 0) return; c.save(); c.globalAlpha = cl(al);
  c.beginPath(); c.arc(x, y, r, a0, a1, a1 < a0); c.strokeStyle = col || 'rgba(255,255,255,.85)'; c.lineWidth = 3.2; c.lineCap = 'round'; c.stroke();
  c.beginPath(); c.arc(x, y, r - 4, a0 + (a1 - a0) * .3, a1, a1 < a0); c.lineWidth = 1.4; c.stroke(); c.restore();
}
export function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
