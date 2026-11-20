// @ts-nocheck
/* Capítulo 7, Pantanal da Cuca: companheiros coloridos (jacarezinho e tuiuiú).
   Virados para a direita, pés na origem (0,0), y negativo para cima. Assinatura: draw(ctx, anim, k). */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, cl, lp, sm, seg, bz, tube, tooth } from './ch7_lib';

/* ---------------- jacarezinho (filhote de jacaré-do-pantanal) ---------------- */
export function drawJacarezinho(c, a, k) {
  var p = k * TAU, wk = a === 'walk', ac = a === 'act' ? k : -1, i,
    G = '#5fae40', G2 = '#438c30', G3 = '#2e6624', BL = '#f3e8a2', YE = '#ffd23f',
    mo = ac < 0 ? (a === 'idle' ? .04 + Math.max(0, Math.sin(p)) * .06 : .04) : (ac <= .5 ? lp(.35, 1, ac * 2) : lp(1, 0, (ac - .5) * 2)),
    lunge = ac > .5 ? (ac - .5) * 2 : 0, b = wk ? Math.abs(Math.cos(p)) * .8 : Math.sin(p) * .5;
  function leg(x, ph, far) {
    var s = wk ? Math.sin(p + ph) : 0, up = wk ? Math.max(0, Math.cos(p + ph)) * 2 : 0, fx = x + 1.6 + s * 4, fy = -up, col = far ? G3 : G2;
    cel(c, function (c) { cap(c, x, -6 - b, fx, fy - 1.6, 2.4); }, col, { k: .7, lw: 1.7 });
    cel(c, function (c) { el(c, fx + 1.2, fy - 1, 3, 1.5); }, col, { k: .5, lw: 1.5 });
    [1.6, 3, 4.4].forEach(function (d) { dot(c, fx + d, fy - .2, .6, '#fff6d0'); });
  }
  leg(9, PI, true); leg(-8, 0, true);
  /* rabo com faixas amarelas de filhote */
  var P = [], x = -10, y = -7 - b, an, N = 9;
  for (i = 0; i <= N; i++) { P.push([x, y, lp(4.6, .9, Math.pow(i / N, .8))]); an = PI - .06 - i * .02 + (wk ? Math.sin(p - i * .7) * .1 : Math.sin(p - i * .5) * .05); x += Math.cos(an) * 2.7; y += Math.sin(an) * 2.7; }
  cel(c, tube(P), G, { k: 1.3, lw: 1.9, inn: function (c) {
    for (i = 1; i < N; i += 2) { var q0 = P[i - 1], q1 = P[i + 1], th = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), r = P[i][2] + 1; ln(c, [P[i][0] - Math.sin(th) * r, P[i][1] + Math.cos(th) * r, P[i][0] + Math.sin(th) * r, P[i][1] - Math.cos(th) * r], YE, 1.6); }
    for (i = 1; i < N; i++) dot(c, P[i][0], P[i][1] - P[i][2] * .7, .6, G3);
  } });
  /* corpo */
  cel(c, function (c) { c.moveTo(-12, -9 - b); c.bezierCurveTo(-6, -14.4 - b, 4, -14.6 - b, 10, -11.6 - b); c.lineTo(12, -9 - b); c.lineTo(11, -4 - b); c.bezierCurveTo(3, -2.2 - b, -7, -2.4 - b, -12, -5 - b); c.closePath(); }, G, { k: 1.8, lw: 2, inn: function (c) {
    c.fillStyle = BL; c.beginPath(); c.ellipse(0, -3.4 - b, 11, 2, 0, 0, TAU); c.fill();
    for (i = 0; i < 6; i++) { dot(c, -9 + i * 3.6, -12.4 - b + Math.abs(i - 2.5) * .3, 1, G3); dot(c, -8 + i * 3.6, -9.4 - b, .9, YE); }
  } });
  leg(7, 0, false); leg(-10, PI, false);
  /* cabeçona fofa */
  c.save(); c.translate(11 + lunge * 3, -8.4 - b);
  var ua = -mo * .55, la = mo * .32;
  if (mo > .1) { c.beginPath(); c.moveTo(-1, 0); c.lineTo(Math.cos(ua) * 15, Math.sin(ua) * 15 - .4); c.lineTo(Math.cos(la) * 14, Math.sin(la) * 14 + .6); c.closePath(); c.fillStyle = '#c0365e'; c.fill(); c.beginPath(); c.ellipse(4, .4, 3, mo * 2.4, 0, 0, TAU); c.fillStyle = '#e2719a'; c.fill(); }
  c.save(); c.rotate(la);
  cel(c, function (c) { c.moveTo(-3, .4); c.lineTo(14.6, .8); c.quadraticCurveTo(15.6, 3, 13, 3.4); c.quadraticCurveTo(5, 4.6, -1.6, 4); c.closePath(); }, BL, { k: .8, lw: 1.7 });
  for (i = 0; i < 4; i++) tooth(c, 4 + i * 2.8, .8, .6, -1.3);
  c.restore();
  c.save(); c.rotate(ua);
  cel(c, function (c) { c.moveTo(-4, 1); c.bezierCurveTo(-5.6, -7, 3, -9, 6.6, -4.4); c.lineTo(14.4, -2.4); c.quadraticCurveTo(17, -1.6, 16.4, .4); c.quadraticCurveTo(15.6, 1.4, 13.6, 1.2); c.lineTo(-1, 1.4); c.closePath(); }, G, { k: 1.5, lw: 1.9, inn: function (c) {
    dot(c, 1, -.6, 1.6, 'rgba(255,120,140,.45)');
    for (i = 0; i < 3; i++) dot(c, 8 + i * 2.4, -2.4 + i * .3, .5, G3);
  } });
  for (i = 0; i < 4; i++) tooth(c, 5 + i * 2.8, 1.1, .6, 1.2);
  cel(c, function (c) { el(c, 15, -1.6, 1.4, 1); }, G, { k: 0, lw: 1.2 });
  /* olho grande e brilhante */
  cel(c, function (c) { el(c, 2.2, -6, 3.6, 3.4); }, G, { k: .8, lw: 1.7 });
  c.beginPath(); c.ellipse(2.6, -6.2, 2.6, 2.6, 0, 0, TAU); c.fillStyle = '#fff8e0'; c.fill();
  c.beginPath(); c.ellipse(3, -6.2, 1.9, 2.2, 0, 0, TAU); c.fillStyle = '#c9a020'; c.fill();
  c.beginPath(); c.ellipse(3.2, -6.2, .6, 1.9, 0, 0, TAU); c.fillStyle = '#1c0f0a'; c.fill(); dot(c, 3.8, -7.2, .7, '#fff');
  if (mo < .2) { c.beginPath(); c.moveTo(13.6, .9); c.quadraticCurveTo(7, 1.8, 1.4, -.2); c.strokeStyle = OUT; c.lineWidth = 1.2; c.lineCap = 'round'; c.stroke(); }
  c.restore();
  c.restore();
  if (lunge > .5) for (i = 0; i < 3; i++) { var aa = -.9 + i * .9; ln(c, [27 + Math.cos(aa) * 3, -9 + Math.sin(aa) * 3, 27 + Math.cos(aa) * 6.4, -9 + Math.sin(aa) * 6.4], '#fff3c4', 1.6); }
}

/* ---------------- tuiuiú (voa) ---------------- */
export function drawTuiuiu(c, a, k) {
  var i, f, qf, qn, gust = 0, tilt = 0;
  if (a === 'act') { qn = k <= .5 ? lp(1, -1, sm(k * 2)) : lp(-1, -.35, sm((k - .5) * 2)); qf = lp(qn, 1, .15); gust = sm(seg(k, .3, 1)); tilt = -.12 * Math.sin(k * PI); f = 0; }
  else { f = k * TAU; qn = Math.cos(f); qf = Math.cos(f - .5); }
  var by = -27 + (a === 'act' ? -k * 2 : Math.cos(f) * 1.6), WH = '#f6f4ee', WH2 = '#d9d8d2', BK = '#1f1c22', RD = '#e0322e';
  c.save(); c.translate(0, by); c.rotate(tilt);
  function wing(q, far) {
    var L = 27, s = Math.abs(q) < .16 ? (q < 0 ? -.16 : .16) : q;
    c.save(); c.translate(1, -2.4);
    cel(c, function (c) { c.moveTo(7, 0); c.quadraticCurveTo(9.4, -L * .55 * s, 3, -L * s);
      [[-.6, -1.04], [-2.6, -.86], [-4.6, -.98], [-6.6, -.8], [-8.4, -.88], [-10.6, -.66], [-12, -.7], [-13.4, -.44], [-12, -.2], [-9, 0]].forEach(function (pt) { c.lineTo(pt[0], pt[1] * L * s); }); c.closePath(); },
      far ? WH2 : WH, { k: 1.4, lw: 1.9, sh: 'rgba(40,40,60,.28)', inn: function (c) {
        [[2.4, -.98], [-1.4, -.9], [-4.6, -.86], [-8, -.74], [-11, -.56]].forEach(function (pt) { ln(c, [pt[0] * .5 + 2, -L * s * .5, pt[0], pt[1] * L * s], 'rgba(90,90,110,.4)', .9); });
        ln(c, [7, -L * s * .3, -11, -L * s * .3], 'rgba(90,90,110,.25)', .8);
      } });
    c.restore();
  }
  wing(qf, true);
  /* pernas pretas esticadas para trás */
  [[0, 0], [1.6, 1.4]].forEach(function (q) { ln(c, [-6, 3 + q[1], -25, 4.6 + q[1]], OUT, 3.2); ln(c, [-6, 3 + q[1], -25, 4.6 + q[1]], '#3a3438', 1.6); [-1, 0, 1].forEach(function (d) { ln(c, [-25, 4.6 + q[1], -28.6, 4.6 + q[1] + d * 1.3], OUT, 2.2); ln(c, [-25, 4.6 + q[1], -28.6, 4.6 + q[1] + d * 1.3], '#3a3438', .9); }); });
  /* rabo curto */
  cel(c, function (c) { poly(c, [-8, -2, -16, -1, -15, 2.6, -8, 3]); }, WH2, { k: .5, lw: 1.6 });
  /* corpo branco */
  cel(c, function (c) { el(c, 0, 0, 10.6, 6.2, -.06); }, WH, { k: 1.8, lw: 2, sh: 'rgba(40,40,60,.25)', inn: function (c) { c.fillStyle = 'rgba(200,200,215,.4)'; c.beginPath(); c.ellipse(0, 4, 8, 2, 0, 0, TAU); c.fill(); } });
  /* colarinho vermelho e pescoço preto pelado */
  var NK = bz(7.6, -2.6, 12, -4, 15, -6, 19.4, -5.6, 6, 3.4, 2.6);
  cel(c, tube(NK), BK, { k: .8, lw: 1.8, hi: 'rgba(200,200,220,.2)', inn: function (c) { c.fillStyle = RD; c.beginPath(); c.ellipse(9.6, -2.8, 3, 4.4, -.3, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,200,180,.4)'; c.beginPath(); c.ellipse(9.2, -4.6, 1.2, 1.6, -.3, 0, TAU); c.fill(); } });
  /* cabeça e bicão levemente arrebitado */
  cel(c, function (c) { el(c, 20.4, -6, 3.6, 3.2); }, BK, { k: .8, lw: 1.8, hi: 'rgba(200,200,220,.25)' });
  cel(c, function (c) { c.moveTo(22.6, -8); c.quadraticCurveTo(30, -8.4, 37.4, -10.6); c.quadraticCurveTo(31, -6, 22.8, -4.6); c.closePath(); }, '#2a262c', { k: .6, lw: 1.6, hi: 'rgba(220,220,240,.35)' });
  cel(c, function (c) { c.moveTo(22.8, -4.8); c.quadraticCurveTo(30, -6.2, 36.6, -10); c.quadraticCurveTo(30, -3.6, 22.4, -3.4); c.closePath(); }, '#3a3540', { k: .4, lw: 1.4 });
  dot(c, 20.6, -7, 1.1, '#fff8e0'); dot(c, 20.9, -7, .65, '#1c0f0a'); dot(c, 21.1, -7.3, .3, '#fff');
  wing(qn, false);
  /* rajada de vento */
  if (gust > 0) for (i = 0; i < 3; i++) { c.beginPath(); c.arc(16 + i * 7 + gust * 6, 8, 8 + i * 3, -1.1, .9); c.strokeStyle = 'rgba(230,248,255,' + (gust * (.85 - i * .2)) + ')'; c.lineWidth = 2; c.lineCap = 'round'; c.stroke(); }
  c.restore();
}
