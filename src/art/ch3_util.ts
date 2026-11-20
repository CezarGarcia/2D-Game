// @ts-nocheck
/* Ajudantes de desenho do Capítulo 3 (Sertão), no mesmo estilo de characters.ts / characters3.ts. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik } from './characters';

export var EYE = '#ffe0f0', EYEG = '#ff3d8a', YEL = '#ffd23f', PI = Math.PI;
export { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik };

export function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
export function lp(a, b, k) { return a + (b - a) * k; }
export function sm(k) { k = cl(k); return k * k * (3 - 2 * k); }
export function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

/* Bézier cúbica amostrada em n trechos; cada ponto leva o raio do tubo naquele lugar */
export function bz(x0, y0, x1, y1, x2, y2, x3, y3, n, r0, r1) {
  var P = [], i, u, v;
  for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; P.push([v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3, r0 + (r1 - r0) * u]); }
  return P;
}
/* tubo de espessura variável ao longo de pontos [x,y,raio] */
export function tube(P) {
  return function (c) {
    var n = P.length, i, S = [];
    for (i = 0; i < n; i++) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; S.push(Math.atan2(b[1] - a[1], b[0] - a[0])); }
    for (i = 0; i < n; i++) c[i ? 'lineTo' : 'moveTo'](P[i][0] - Math.sin(S[i]) * P[i][2], P[i][1] + Math.cos(S[i]) * P[i][2]);
    c.arc(P[n - 1][0], P[n - 1][1], P[n - 1][2], S[n - 1] + PI / 2, S[n - 1] - PI / 2, true);
    for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0] + Math.sin(S[i]) * P[i][2], P[i][1] - Math.cos(S[i]) * P[i][2]);
    c.arc(P[0][0], P[0][1], P[0][2], S[0] - PI / 2, S[0] + PI / 2, true);
    c.closePath();
  };
}
/* traço grosso com contorno */
export function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
/* olho de Assombro */
export function eye(c, x, y, r, ry, rot) { ry = ry == null ? r : ry; dot(c, x, y, r + 0.8, 'rgba(30,20,24,.85)'); c.beginPath(); c.ellipse(x, y, r, ry, rot || 0, 0, TAU); c.fillStyle = EYEG; c.fill(); glow(c, x - r * 0.12, y - ry * 0.1, r * 0.55, ry * 0.55, EYE, EYEG, 6, rot || 0); }
/* estrelinha de quatro pontas (faísca, brilho) */
export function spark(c, x, y, r, col) { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill(); }
/* raio em zigue-zague, amarelo com miolo claro; determinístico pela semente */
export function bolt(c, x0, y0, x1, y1, seed, n, w, al) {
  var R = rng(seed), P = [[x0, y0]], i, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  n = n || 5; w = w || 1.4; al = al == null ? 1 : al;
  for (i = 1; i < n; i++) { var u = i / n, j = (R() - 0.5) * L * 0.34; P.push([x0 + dx * u + nx * j, y0 + dy * u + ny * j]); }
  P.push([x1, y1]);
  c.save(); c.globalAlpha = al; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); P.forEach(function (p, i) { c[i ? 'lineTo' : 'moveTo'](p[0], p[1]); });
  c.strokeStyle = 'rgba(120,70,0,.55)'; c.lineWidth = w + 1.6; c.stroke();
  c.strokeStyle = YEL; c.lineWidth = w; c.stroke();
  c.strokeStyle = '#fffbe0'; c.lineWidth = w * 0.4; c.stroke();
  c.restore();
}
/* fumaça: bolinhas claras que crescem e somem (u de 0 a 1) */
export function puff(c, x, y, r, al, col) { if (al <= 0) return; c.save(); c.globalAlpha = Math.min(1, al); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col || '#e8e2d6'; c.fill(); c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill(); c.restore(); }
/* braço de dois segmentos (cotovelo para o lado `dir`) */
export function limb(c, ax, ay, bx, by, l1, l2, dir, r1, r2, c1, c2, o) {
  var k = ik(ax, ay, bx, by, l1, l2, dir);
  cel(c, function (c) { cap(c, ax, ay, k[0], k[1], r1); }, c1, o);
  cel(c, function (c) { cap(c, k[0], k[1], bx, by, r2); }, c2, o);
  return k;
}
