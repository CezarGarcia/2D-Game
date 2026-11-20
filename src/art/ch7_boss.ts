// @ts-nocheck
/* Capítulo 7, Pantanal da Cuca: a Pisadeira (elite) e a Cuca (chefona), e a Cuca libertada.
   Virados para a direita, pés na origem (0,0), y negativo para cima. Assinatura: draw(ctx, anim, k). */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, star, EYE, EYEG, VEN, VEN2, MAG, MAG2,
  cl, lp, sm, seg, rope, bz, tube, tooth, drop, bubble, arm2, eye, dizzy, note, impact, swoosh } from './ch7_lib';

/* interpola uma lista de poses igualmente espaçadas em k (0..1) */
function kfr(K, k) {
  var n = K.length - 1, f = Math.min(n - 1e-9, Math.max(0, k) * n), i = Math.floor(f), u = sm(f - i), A = K[i], B = K[i + 1], o = {}, key;
  for (key in A) { var x = A[key], y = B[key]; o[key] = Array.isArray(x) ? [lp(x[0], y[0], u), lp(x[1], y[1], u)] : lp(x, y, u); }
  return o;
}
function add(P, d) { return [P[0] + d[0], P[1] + d[1]]; }

/* ================= Pisadeira ================= */
export function drawPisadeira(c, a, k) {
  var p = k * TAU, sn = Math.sin(p), cs = Math.cos(p), i, Q,
    SK = '#a5aaa1', SK2 = '#878c84', SK3 = '#6b7069', DR = '#5a5f5d', DR2 = '#474b4a', HR = '#d2d6cd', HR2 = '#a9aea6', NL = '#55685c';
  var B0 = { lift: 0, F1: [-5, 0], F2: [7, 0], fa1: 0, fa2: 0, Hp: [-2, -30], ln: .42, hd: [6.4, -5.4], ht: .16, A1: [13, -33], A2: [18, -31], na: .5, mo: 0, hs: 0, perch: 0 };
  if (a === 'idle') { Q = Object.assign({}, B0); Q.Hp = [-2, -30 + sn * .8]; Q.ln = .42 + sn * .03; Q.A1 = [13 + Math.sin(p + 1) * 1, -33 + cs * 1]; Q.A2 = [18 + Math.sin(p + 2) * 1.2, -31 + Math.sin(p) * 1]; Q.na = .5 + Math.sin(p * 2) * .18; Q.ht = .16 + Math.sin(p) * .05; Q.hs = sn; Q.mo = .15 + .15 * Math.max(0, Math.sin(p * 2)); }
  else if (a === 'move') {
    Q = Object.assign({}, B0); Q.F1 = [-1 - sn * 9, -Math.max(0, cs) * 5]; Q.F2 = [2 + sn * 9, -Math.max(0, -cs) * 5]; Q.fa1 = Math.max(0, cs) * .7; Q.fa2 = Math.max(0, -cs) * .7;
    Q.Hp = [0, -29.4 + Math.abs(cs) * 1.4]; Q.ln = .55 + Math.abs(sn) * .04; Q.A1 = [17 - sn * 3, -35 + Math.abs(sn)]; Q.A2 = [21 + sn * 3, -34 + Math.abs(sn)]; Q.na = .2; Q.hs = sn * 1.4; Q.ht = .1;
  }
  else if (a === 'atk') Q = kfr([
    { lift: 0, F1: [-5, 0], F2: [6, 0], fa1: 0, fa2: 0, Hp: [-4, -21], ln: .75, hd: [6, -4], ht: -.2, A1: [-8, -24], A2: [-4, -22], na: .2, mo: .3, hs: 0, perch: 0 },
    { lift: 12, F1: [-3, -10], F2: [5, -8], fa1: .3, fa2: .3, Hp: [-2, -27], ln: .3, hd: [6, -5], ht: .05, A1: [-6, -58], A2: [14, -60], na: -.6, mo: .9, hs: -1.5, perch: 0 },
    { lift: 9, F1: [-3, 1], F2: [4, 2], fa1: 1, fa2: 1, Hp: [-1, -31], ln: .12, hd: [6, -5], ht: .3, A1: [-8, -54], A2: [16, -56], na: -.4, mo: .9, hs: -2, perch: 0 },
    { lift: 0, F1: [-5, 0], F2: [9, 0], fa1: 0, fa2: 0, Hp: [0, -24], ln: .5, hd: [6.4, -5], ht: .3, A1: [-10, -40], A2: [24, -40], na: .1, mo: .5, hs: 1.5, perch: 0 }], k);
  else if (a === 'cast') { Q = kfr([
    { lift: 0, F1: [-5, 0], F2: [7, 0], fa1: 0, fa2: 0, Hp: [-2, -30], ln: .38, hd: [6.4, -5.4], ht: .1, A1: [10, -40], A2: [16, -42], na: -.2, mo: .3, hs: 0, perch: 0 },
    { lift: 0, F1: [-5, 0], F2: [7, 0], fa1: 0, fa2: 0, Hp: [-2, -30.6], ln: .22, hd: [6, -6], ht: -.15, A1: [2, -58], A2: [18, -60], na: -.6, mo: .8, hs: -1, perch: 0 },
    { lift: 0, F1: [-5, 0], F2: [7, 0], fa1: 0, fa2: 0, Hp: [-2, -31], ln: .08, hd: [5, -6.4], ht: -.42, A1: [-13, -74], A2: [21, -76], na: -.9, mo: 1, hs: -2, perch: 0 },
    { lift: 0, F1: [-5, 0], F2: [7, 0], fa1: 0, fa2: 0, Hp: [-2, -30], ln: .1, hd: [5, -6.4], ht: -.35, A1: [-14, -72], A2: [22, -74], na: -1, mo: .85, hs: 2, perch: 0 }], k); }
  else if (a === 'down') { Q = Object.assign({}, B0); Q.F1 = [16, 0]; Q.F2 = [22, -1]; Q.fa1 = 0; Q.fa2 = 0; Q.Hp = [-7, -15]; Q.ln = .3 + sn * .04; Q.hd = [6, -4]; Q.ht = .75 + sn * .06; Q.A1 = [2, -8]; Q.A2 = [10, -10]; Q.na = 0; Q.mo = .4; Q.hs = 2; }
  else { /* special: agachada no alto de um galho, à espreita */
    Q = Object.assign({}, B0); Q.perch = 1; Q.lift = 34; Q.F1 = [-3, 0]; Q.F2 = [5, 0]; Q.Hp = [-5, -13]; Q.ln = .95 + sn * .03; Q.hd = [6.6, -2.4]; Q.ht = .42 + Math.sin(p) * .14; Q.A1 = [5, -1]; Q.A2 = [11, 0]; Q.na = 1.5 + Math.max(0, Math.sin(p * 2)) * .3; Q.mo = .1; Q.hs = sn * 1.5;
  }
  var co = Math.cos(Q.ln), si = Math.sin(Q.ln);
  function W(x, y) { return [Q.Hp[0] + x * co - y * si, Q.Hp[1] + x * si + y * co]; }
  /* galho do alto */
  if (Q.perch) {
    c.beginPath(); c.ellipse(2, 0, 20, 4, 0, 0, TAU); c.fillStyle = 'rgba(10,8,14,.25)'; c.fill();
    rope(c, function (c) { c.moveTo(-28, -31); c.quadraticCurveTo(0, -36, 30, -33.4); }, '#6b5d50', 5.6);
    rope(c, function (c) { c.moveTo(18, -34); c.quadraticCurveTo(24, -42, 30, -45); }, '#6b5d50', 2.4);
    [[30, -45, -.4], [24, -40, .6], [-20, -32, 2.6], [-26, -31, 1.9]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); cel(c, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(4, -3.4, 9, 0); c.quadraticCurveTo(4, 3.4, 0, 0); c.closePath(); }, '#6a7f58', { k: .6, lw: 1.4 }); c.restore(); });
    ln(c, [-24, -32.6, 26, -34.6], 'rgba(255,240,220,.18)', 1.2);
  }
  c.save(); c.translate(0, -Q.lift);
  function leg(F, fa, far) {
    var col = far ? SK3 : SK2, ang = lp(.18, 1.35, fa), An = [F[0] - Math.cos(ang) * 5.6, F[1] - Math.sin(ang) * 5.6 - 1.4], kn = ik(Q.Hp[0] + (far ? -1.6 : 1), Q.Hp[1], An[0], An[1], 16, 16, -1);
    cel(c, function (c) { cap(c, Q.Hp[0] + (far ? -1.6 : 1), Q.Hp[1], kn[0], kn[1], 2.6); }, col, { k: .8, lw: 1.8 });
    cel(c, function (c) { cap(c, kn[0], kn[1], An[0], An[1], 2); }, col, { k: .7, lw: 1.8 });
    dot(c, kn[0] + .6, kn[1] - .4, 1.3, 'rgba(255,255,255,.18)');
    c.save(); c.translate(An[0], An[1]); c.rotate(ang);
    cel(c, function (c) { c.moveTo(-1.6, -1.8); c.quadraticCurveTo(4, -2.2, 7, -.6); c.lineTo(7.4, 1.2); c.quadraticCurveTo(3, 1.8, -1.8, 1.6); c.closePath(); }, col, { k: .6, lw: 1.6 });
    [-.9, .3].forEach(function (d) { ln(c, [6.6, d, 9.4, d + 1.4], OUT, 2); ln(c, [6.6, d, 9.4, d + 1.4], '#c9c6b4', .9); });
    c.restore();
  }
  function hand(S, H, far) {
    var col = far ? SK3 : SK2, kk = arm2(c, S[0], S[1], H[0], H[1], 14.6, 14, -1, 2, 1.7, col, col, { k: .7, lw: 1.7 }),
      an = Math.atan2(H[1] - kk[1], H[0] - kk[0]) + Q.na * (H[0] > S[0] ? 1 : -1) * .6;
    for (var j = 0; j < 4; j++) {
      var d = (j - 1.5) * .3, L = 8.4 - Math.abs(j - 1.4) * 1.2, x1 = H[0] + Math.cos(an + d) * 2.4, y1 = H[1] + Math.sin(an + d) * 2.4, x2 = H[0] + Math.cos(an + d) * (2.4 + L), y2 = H[1] + Math.sin(an + d) * (2.4 + L), mx = (x1 + x2) / 2 - Math.sin(an + d) * 2.4, my = (y1 + y2) / 2 + Math.cos(an + d) * 2.4;
      c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = far ? '#46564c' : NL; c.lineWidth = 1.7; c.stroke();
      if (!far) { c.strokeStyle = 'rgba(124,252,154,.7)'; c.lineWidth = .6; c.stroke(); }
    }
    cel(c, function (c) { el(c, H[0], H[1], 2.6, 2.3); }, col, { k: .5, lw: 1.5 });
  }
  var S1 = W(-3, -23), S2 = W(4, -23.4), NB = W(3, -25), Hc = add(NB, Q.hd);
  leg(Q.F1, Q.fa1, true);
  hand(S1, Q.A1, true);
  /* cabelo de trás, desgrenhado */
  c.save(); c.translate(Hc[0], Hc[1]); c.rotate(Q.ht);
  var hs = Q.hs, HB = [[3, -8.6], [1, -14], [-3, -10.6], [-7.6, -15], [-8.6, -9.4], [-14, -11.4], [-11.6, -5.4], [-17, -3 + hs * .4], [-12.4, .4], [-16.6, 5.4 + hs], [-10.6, 5.6], [-13.6, 13 + hs * 1.4], [-7.6, 9], [-7, 16 + hs * 1.4], [-3.4, 8.6], [-1, 6]];
  cel(c, function (c) { c.moveTo(HB[0][0], HB[0][1]); for (var j = 1; j < HB.length; j++) c.lineTo(HB[j][0], HB[j][1]); c.closePath(); }, HR2, { k: 1.4, lw: 2, inn: function (c) {
    c.strokeStyle = 'rgba(70,74,70,.45)'; c.lineWidth = .9; [[-3, -6, -12, 4], [-5, -3, -9, 11], [-1, -8, -14, -2], [-6, -9, -12, -8]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo((q[0] + q[2]) / 2 - 2, (q[1] + q[3]) / 2, q[2], q[3]); c.stroke(); });
  } });
  c.restore();
  /* camisola rasgada */
  c.save(); c.translate(Q.Hp[0], Q.Hp[1]); c.rotate(Q.ln);
  cel(c, function (c) { c.moveTo(-4, -25); c.quadraticCurveTo(3, -27.4, 7.4, -23); c.bezierCurveTo(9, -14, 8, -3, 11 + Q.hs * .4, 9);
    var hem = [[8, 6], [6, 11], [3, 7], [0, 12], [-3, 7.6], [-6, 11.6], [-8.6, 7], [-12.6 + Q.hs * .4, 9]]; hem.forEach(function (q) { c.lineTo(q[0], q[1]); });
    c.bezierCurveTo(-10, -1, -13, -14, -4, -25); c.closePath(); }, DR, { k: 2.2, lw: 2, inn: function (c) {
    ln(c, [1, -20, -1, 6], 'rgba(20,22,22,.45)', 1); ln(c, [5, -18, 6, 6], 'rgba(20,22,22,.35)', 1); ln(c, [-5, -16, -7, 6], 'rgba(20,22,22,.35)', 1);
    c.fillStyle = DR2; c.beginPath(); poly(c, [-6, -6, -1.6, -6.6, -1.4, -2, -6.4, -1.6]); c.fill(); ln(c, [-6, -6, -1.6, -6.6, -1.4, -2, -6.4, -1.6, -6, -6], 'rgba(200,200,190,.5)', .7, [1, 1.2]);
    c.fillStyle = '#2a2c2c'; c.beginPath(); c.ellipse(4, 2, 1.4, 1, .4, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-5, -20, 3.4, 2, -.4, 0, TAU); c.fill();
  } });
  c.restore();
  leg(Q.F2, Q.fa2, false);
  /* pescoço fino e cabeça */
  cel(c, function (c) { cap(c, NB[0], NB[1], Hc[0] - 1.6, Hc[1] + 3, 2.2); }, SK2, { k: .6, lw: 1.7 });
  c.save(); c.translate(Hc[0], Hc[1]); c.rotate(Q.ht);
  cel(c, function (c) { c.moveTo(-5, -5); c.bezierCurveTo(-4, -9.8, 4, -10, 5.6, -4.6); c.lineTo(5.2, -1); c.lineTo(5.6, 4.4); c.quadraticCurveTo(6.4, 7.4, 4.6, 8.6); c.quadraticCurveTo(1, 9.6, -2, 6.6); c.quadraticCurveTo(-5.6, 3, -5, -5); c.closePath(); }, SK, { k: 1.6, lw: 1.9, inn: function (c) {
    c.fillStyle = 'rgba(40,44,40,.35)'; c.beginPath(); c.ellipse(.6, 2.6, 2.4, 3.2, 0, 0, TAU); c.fill();
    ln(c, [-1.6, 4, .2, 6.4], 'rgba(40,44,40,.5)', .8); ln(c, [-3.4, -6.6, 2, -7.8], 'rgba(40,44,40,.4)', .8);
  } });
  /* nariz adunco com verruga */
  cel(c, function (c) { c.moveTo(4.4, -3); c.quadraticCurveTo(10.6, -1.6, 9.6, 3.2); c.quadraticCurveTo(7.4, 3, 5.4, 2.4); c.closePath(); }, SK, { k: .7, lw: 1.6 });
  dot(c, 8, -1.2, .9, SK3);
  /* olhos fundos */
  c.beginPath(); c.ellipse(2.4, -2.2, 2.4, 2, 0, 0, TAU); c.fillStyle = '#2e3230'; c.fill(); c.beginPath(); c.ellipse(-1.2, -2, 1.6, 1.7, 0, 0, TAU); c.fill();
  eye(c, 2.6, -2.2, 1.6, 1.4); eye(c, -1.1, -2, 1.1, 1.1);
  /* sobrancelhas eriçadas */
  ln(c, [-.4, -5, 2.4, -4.2, 5, -5.2], HR, 1.5); ln(c, [-3, -4.6, -.6, -4.2], HR, 1.2);
  /* boca: sorrisinho torto; risada aberta */
  if (Q.mo > .45) { c.beginPath(); c.ellipse(3.8, 5.2, 2, .6 + Q.mo * 2.2, .15, 0, TAU); c.fillStyle = '#3a1222'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke(); tooth(c, 3.4, 4.2 - Q.mo * 1.6, .6, 1.2); tooth(c, 4.8, 6 + Q.mo * 1.6, .5, -1); }
  else { c.beginPath(); c.moveTo(1, 4.6); c.quadraticCurveTo(3.6, 6.2 + Q.mo * 2, 5.8, 4.2); c.strokeStyle = OUT; c.lineWidth = 1.3; c.lineCap = 'round'; c.stroke(); tooth(c, 3.2, 5.4 + Q.mo * 1.4, .5, -1.2); }
  /* franja caindo na testa */
  cel(c, function (c) { c.moveTo(-5.6, -4); c.lineTo(-6.4, -9); c.lineTo(-2, -11.4); c.lineTo(3, -10.4); c.lineTo(6.4, -6.4); c.lineTo(3.4, -7.4); c.lineTo(2.6, -5); c.lineTo(.4, -7.6); c.lineTo(-1.6, -5.4); c.lineTo(-3, -7.6); c.closePath(); }, HR, { k: .9, lw: 1.6 });
  [[0, -11, 3, -16, 7, -15], [-4, -10, -6, -16, -3, -19], [4, -9, 9, -12, 11, -9]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = HR; c.lineWidth = 1.2; c.stroke(); });
  c.restore();
  hand(S2, Q.A2, false);
  /* risada: "ha" em ondas; tonta: estrelinhas */
  if (a === 'cast' && k > .3) { var mo2 = add(Hc, [6, 3]); for (i = 0; i < 3; i++) { c.beginPath(); c.arc(mo2[0], mo2[1], 7 + i * 5, -1.6, -.2); c.strokeStyle = 'rgba(124,252,154,' + (.8 - i * .22) * seg(k, .3, 1) + ')'; c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke(); } }
  if (a === 'down') dizzy(c, Hc[0] + 2, Hc[1] - 12, k, '#d8ffe4', 10);
  c.restore();
  if (a === 'atk' && k > .9) impact(c, 2, 0, 1);
  if (Q.perch) { /* unhas por cima do galho */ }
}

/* ================= Cuca ================= */
var CUCA_GRAY = { SC: '#7f8780', SC2: '#676f69', SC3: '#4f5651', BL: '#b6bbae', DR: '#6d7177', DR2: '#585c62', DR3: '#45484d', AP: '#aeb0a8', AP2: '#8e918a', SP: '#8e8678', SP2: '#6e675b', HR: '#f2c94c', HR2: '#cf972a', HR3: '#ffe79a', LACE: '#c9cbc4', fr: false };
var CUCA_FREE = { SC: '#64a64c', SC2: '#4a8638', SC3: '#326428', BL: '#e8e3a2', DR: '#8a52b8', DR2: '#6c3d96', DR3: '#4f2a72', AP: '#fff4dc', AP2: '#e2cfa8', SP: '#c08548', SP2: '#8e5a2c', HR: '#f6d052', HR2: '#d69c2c', HR3: '#fff0a8', LACE: '#fffaf0', fr: true };

function cucaHead(c, Q, C) {
  var i, jo = Q.jo;
  /* cabelo de trás: juba loira desgrenhada (o resto de cor) */
  var hs = Q.hs, HB = [[-4, -1], [-11, 3 + hs * .5], [-16, 7 + hs], [-14, 0], [-19, -3 + hs * .5], [-14, -7], [-18, -13], [-12, -13], [-14, -20], [-8, -18], [-6, -25], [-1, -20], [3, -25], [5, -19], [10, -21], [9, -15], [12, -13]];
  function mop(c) { c.moveTo((HB[0][0] + HB[1][0]) / 2, (HB[0][1] + HB[1][1]) / 2); for (var j = 1; j < HB.length - 1; j++) { var q = HB[j + 1]; c.quadraticCurveTo(HB[j][0], HB[j][1], (HB[j][0] + q[0]) / 2, (HB[j][1] + q[1]) / 2); } c.lineTo(12, -13); c.lineTo(4, -6); c.closePath(); }
  cel(c, mop, C.HR2, { k: 2, lw: 2.1, sh: 'rgba(120,60,0,.35)', hi: 'rgba(255,250,200,.35)', inn: function (c) {
    c.strokeStyle = 'rgba(130,70,0,.5)'; c.lineWidth = .9; c.lineCap = 'round';
    [[-4, -16, -14, -6], [0, -18, -10, -14], [-6, -8, -15, 3], [-2, -10, -9, 2], [4, -18, -2, -12]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo((q[0] + q[2]) / 2 - 3, (q[1] + q[3]) / 2, q[2], q[3]); c.stroke(); });
  } });
  /* coque torto com um grampo de osso */
  cel(c, function (c) { el(c, -5, -24, 5.4, 4.4, -.3); }, C.HR, { k: 1.2, lw: 1.9, sh: 'rgba(150,80,0,.35)', hi: 'rgba(255,250,210,.45)', inn: function (c) { c.beginPath(); c.arc(-5, -24, 2.6, .4, 4); c.strokeStyle = 'rgba(150,80,0,.55)'; c.lineWidth = 1; c.stroke(); } });
  rope(c, function (c) { c.moveTo(-11, -22); c.quadraticCurveTo(-5, -27, 1, -29); }, C.fr ? '#9a6232' : '#8a8274', 1);
  /* olho de trás */
  cel(c, function (c) { el(c, 6.6, -16.4, 3.2, 2.8); }, C.SC2, { k: .6, lw: 1.6 });
  if (jo > .06) { c.beginPath(); c.moveTo(3, -3.2); c.lineTo(26.4, -3.4); c.lineTo(2 + Math.cos(jo) * 25, -2.4 + Math.sin(jo) * 25); c.lineTo(-1, -1); c.closePath(); c.fillStyle = '#5a1530'; c.fill(); }
  /* mandíbula de baixo */
  c.save(); c.translate(2, -2.4); c.rotate(jo);
  cel(c, function (c) { c.moveTo(-6, 2); c.lineTo(24, -.6); c.quadraticCurveTo(27.4, 0, 25.4, 2.6); c.quadraticCurveTo(13, 6, 0, 6); c.quadraticCurveTo(-5, 5.4, -6, 2); c.closePath(); }, C.SC, { k: 1.2, lw: 1.9, inn: function (c) { c.fillStyle = C.BL; c.beginPath(); c.ellipse(10, 5.6, 14, 2, -.05, 0, TAU); c.fill(); for (i = 0; i < 5; i++) ln(c, [3 + i * 4, 3.6, 2.6 + i * 4, 6.6], 'rgba(40,40,30,.25)', .8); } });
  /* dentes de baixo, pra cima */
  [9, 15, 21].forEach(function (x, n) { tooth(c, x, .2 - x * .03, .8, n === 2 ? -2.8 : -1.8); });
  if (Q.tongue) cel(c, function (c) { c.moveTo(16, 1); c.quadraticCurveTo(26, 0, 28, 5); c.quadraticCurveTo(25, 8, 22, 4); c.quadraticCurveTo(19, 3, 16, 3); c.closePath(); }, '#e2719a', { k: .5, lw: 1.4 });
  c.restore();
  /* crânio e focinho comprido */
  cel(c, function (c) { c.moveTo(-6, 0); c.bezierCurveTo(-9, -10, -3, -18.4, 5, -17.6); c.bezierCurveTo(9, -17, 11, -13.6, 13.4, -11.4); c.lineTo(25.4, -8.6); c.quadraticCurveTo(30, -8.2, 29.8, -5.6); c.quadraticCurveTo(29.6, -3.2, 26.4, -3.4); c.lineTo(9, -3.6); c.quadraticCurveTo(1, -3.4, -6, 0); c.closePath(); }, C.SC, { k: 1.8, lw: 2.1, inn: function (c) {
    /* escamas e faixas do focinho */
    for (i = 0; i < 5; i++) { dot(c, 15 + i * 2.6, -8.6 + i * .3, .8, 'rgba(30,34,30,.4)'); }
    [[-2, -8], [1, -12], [-4, -4], [3, -6]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.6, .2, PI - .2); c.strokeStyle = 'rgba(30,34,30,.35)'; c.lineWidth = .8; c.stroke(); });
    c.fillStyle = 'rgba(255,255,240,.18)'; c.beginPath(); c.ellipse(18, -7.4, 7, 1, -.15, 0, TAU); c.fill();
    if (C.fr) { c.fillStyle = 'rgba(255,120,120,.35)'; c.beginPath(); c.ellipse(5, -6, 3.2, 2, 0, 0, TAU); c.fill(); }
  } });
  /* ventas na ponta */
  cel(c, function (c) { el(c, 26.4, -8.6, 2.4, 1.6); }, C.SC, { k: .5, lw: 1.5 }); dot(c, 27.2, -9, .6, OUT);
  /* dentes de cima, para baixo, e a linha da boca */
  [12, 17, 22].forEach(function (x, n) { tooth(c, x, -3.6, .8, n === 1 ? 2.6 : 1.8); });
  c.beginPath(); c.moveTo(27.6, -3.4); c.lineTo(8, -3.6); c.quadraticCurveTo(5, -3.6, 3.4, C.fr ? -5.6 : -1.8); c.strokeStyle = OUT; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke();
  /* argola na orelha */
  c.beginPath(); c.arc(-2.6, 1.6, 2, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.2; c.stroke(); c.strokeStyle = C.fr ? '#ffd23f' : '#c9c6b8'; c.lineWidth = 1; c.stroke();
  /* olho no calombo, sobrancelha brava */
  cel(c, function (c) { el(c, 10.6, -14.6, 4.4, 3.8); }, C.SC, { k: 1, lw: 1.8 });
  if (Q.eyes === 'closed') { c.beginPath(); c.arc(10.8, -14.6, 2.4, .2, PI - .2); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke(); ln(c, [8.6, -13, 7.4, -11.8], OUT, 1); ln(c, [10.8, -12.2, 10.6, -10.8], OUT, 1); }
  else if (Q.eyes === 'dizzy') { c.beginPath(); for (i = 0; i <= 18; i++) { var aa = i * .7 + Q.ph, rr = i * .14; c[i ? 'lineTo' : 'moveTo'](10.8 + Math.cos(aa) * rr, -14.6 + Math.sin(aa) * rr); } c.strokeStyle = C.fr ? OUT : '#ff7ab0'; c.lineWidth = 1; c.stroke(); }
  else if (C.fr) { c.beginPath(); c.ellipse(11, -14.6, 2.6, 2.4, 0, 0, TAU); c.fillStyle = '#fff8e0'; c.fill(); dot(c, 11.6, -14.4, 1.6, '#6a3c14'); dot(c, 11.8, -14.4, .9, '#1c0f0a'); dot(c, 12.3, -15.1, .5, '#fff'); }
  else eye(c, 11.2, -14.4, 2.3, 1.9, -.1);
  if (C.fr) { /* óculos de vovó */ c.beginPath(); c.arc(11, -14.6, 4, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = '#c99a3a'; c.lineWidth = 1.1; c.stroke(); c.fillStyle = 'rgba(220,240,255,.25)'; c.fill(); ln(c, [7, -15, -1, -12], '#8a6424', 1); ln(c, [15, -13.4, 17.6, -11.4], '#8a6424', 1.1); }
  ln(c, C.fr ? [6.4, -18.8, 11, -20, 15, -18.2] : [6.4, -20.4, 11, -18.6, 15.6, -15.8], OUT, 3);
  ln(c, C.fr ? [6.4, -18.8, 11, -20, 15, -18.2] : [6.4, -20.4, 11, -18.6, 15.6, -15.8], C.HR2, 1.3);
  /* franja loira por cima da testa */
  cel(c, function (c) { c.moveTo(-6, -12); c.quadraticCurveTo(-4, -21, 4, -20.6); c.quadraticCurveTo(9, -20.4, 10, -18.4); c.lineTo(6.6, -18); c.lineTo(7.4, -15.4); c.lineTo(4, -17); c.lineTo(2.6, -13.6); c.lineTo(.6, -16.6); c.lineTo(-2, -12.6); c.lineTo(-3, -15.6); c.closePath(); }, C.HR, { k: 1, lw: 1.8, sh: 'rgba(150,80,0,.35)', hi: 'rgba(255,250,210,.5)' });
  [[2, -20, 4, -24.6, 8, -24.4], [-3, -18, -7.6, -22, -8, -25.4], [7, -19, 11, -21.6, 13, -19.6]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.8; c.stroke(); c.strokeStyle = C.HR; c.lineWidth = 1.3; c.stroke(); });
  if (C.fr) { for (i = 0; i < 5; i++) { var fa = i * 1.257; cel(c, function (c) { el(c, -9 + Math.cos(fa) * 2.4, -17 + Math.sin(fa) * 2.4, 2, 1.4, fa); }, '#ff7aa8', { k: .4, lw: 1.1 }); } dot(c, -9, -17, 1.3, '#ffd23f'); }
}

function spoon(c, x, y, a, C, al) {
  c.save(); c.translate(x, y); c.rotate(a);
  cel(c, function (c) { cap(c, -5, 0, 23, 0, 1.5); }, C.SP, { k: .6, lw: 1.6, inn: function (c) { ln(c, [-4, -.5, 20, -.5], 'rgba(255,240,210,.3)', .6); } });
  cel(c, function (c) { el(c, 27, 0, 4.8, 3.3); }, C.SP, { k: 1, lw: 1.7, inn: function (c) { c.beginPath(); c.ellipse(27.4, .3, 3.2, 2, 0, 0, TAU); c.fillStyle = al ? MAG : C.SP2; c.fill(); } });
  c.restore();
}
function claws(c, H, an, col, C) {
  [-.5, 0, .5].forEach(function (d) { var x2 = H[0] + Math.cos(an + d) * 4.6, y2 = H[1] + Math.sin(an + d) * 4.6; ln(c, [H[0], H[1], x2, y2], OUT, 3); ln(c, [H[0], H[1], x2, y2], col, 1.5); dot(c, x2, y2, .7, C.fr ? '#f4ead0' : '#d6d4c8'); });
  cel(c, function (c) { el(c, H[0], H[1], 3, 2.7); }, col, { k: .6, lw: 1.6 });
}

export function drawCuca(c, a, k, free) {
  var C = free ? CUCA_FREE : CUCA_GRAY, p = k * TAU, sn = Math.sin(p), cs = Math.cos(p), i, b = 0;
  var Q = { rs: 0, F1: [-5, 0], F2: [8, 0], fl1: 0, fl2: 0, hs: 0, ts: 0, Hn: [18, -40], sa: .95, Hb: [-13, -37], ht: 0, jo: .05, sit: 0, eyes: 'open', ph: 0, tongue: 0, flask: 0, thr: 0 };
  if (a === 'idle') { b = sn * .8; Q.sa = .95 - Math.max(0, Math.sin(p * 2)) * .14; Q.ts = Math.sin(p + 1) * .4; Q.hs = sn * .8; Q.ht = Math.sin(p) * .03; Q.Hn = [18, -40 - Math.max(0, Math.sin(p * 2)) * 1.2]; }
  else if (a === 'move') { b = Math.abs(cs) * 1.2; Q.rs = sn * .05; Q.F1 = [-3 - sn * 6, -Math.max(0, cs) * 2.6]; Q.F2 = [6 + sn * 6, -Math.max(0, -cs) * 2.6]; Q.hs = -sn * 2.2; Q.ts = Math.sin(p + 1.4) * .9; Q.Hn = [18 + sn * 1.6, -41]; Q.sa = .85 + sn * .2; Q.Hb = [-12 - sn * 3, -33 + Math.abs(sn)]; Q.ht = Math.cos(p * 2) * .03; }
  else if (a === 'atk') { var K = kfr([{ rs: -.06, Hn: [6, -74], sa: -2.5, jo: .1, ht: -.1 }, { rs: -.12, Hn: [-1, -77], sa: -3.05, jo: .32, ht: -.14 }, { rs: .04, Hn: [18, -66], sa: -.9, jo: .32, ht: .04 }, { rs: .12, Hn: [25, -45], sa: .72, jo: .22, ht: .1 }], k); Object.assign(Q, K); Q.Hb = [-14, -38 - k * 4]; Q.hs = -Q.rs * 14; Q.ts = -Q.rs * 4; }
  else if (a === 'cast') {
    var st = k * 2.6 * TAU; Q.Hn = [26 + Math.cos(st) * 3, -46 + Math.sin(st) * 1.4]; Q.sa = 1.33 + Math.sin(st) * .07; Q.rs = .06; Q.jo = .18 + k * .2; Q.ht = .1 - k * .2; Q.hs = -1;
    Q.flask = sm(seg(k, .2, .66)); Q.thr = sm(seg(k, .7, 1)); Q.Hb = Q.thr > 0 ? [lp(-6, 12, Q.thr), lp(-72, -68, Q.thr)] : [lp(-13, -6, Q.flask), lp(-37, -72, Q.flask)];
  }
  else if (a === 'down') { b = sn * .6; Q.sit = 1; Q.F1 = [22, -1]; Q.F2 = [27, -1]; Q.fl1 = 1; Q.fl2 = 1; Q.Hn = [18, -22]; Q.Hb = [-8, -18]; Q.ht = .42 + sn * .05; Q.jo = .4; Q.tongue = 1; Q.eyes = 'dizzy'; Q.ph = p; Q.hs = 2; Q.rs = .08; Q.ts = .2; }
  else if (a === 'special') { Q.rs = sn * .07; b = Math.abs(sn) * .6; Q.eyes = 'closed'; Q.jo = .22 + Math.max(0, Math.sin(p * 2)) * .12; Q.ht = -.12 + sn * .08; Q.Hn = [18 + cs * 3, -54 + Math.sin(p * 2) * 2.4]; Q.sa = -1.1 + sn * .35; Q.Hb = [-4, -45]; Q.hs = -sn * 1.6; Q.ts = sn * .5; }
  if (free) { Q.jo = .03; }
  var sy = Q.sit * 15;
  /* rabo de jacaré no chão, por trás do vestido */
  var tip = [-37 + Math.abs(Q.ts) * 2 - Q.sit * 2, -2.6 + Q.ts * 5], TT = bz(-5, -14 + sy * .6, -16, -12 + sy * .3, -26, -3 + Q.ts * 2, tip[0], tip[1], 10, 6.4, 1.2, .9);
  for (i = 1; i < 10; i++) { var q0 = TT[i - 1], q1 = TT[i + 1], th = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), nx = Math.sin(th), ny = -Math.cos(th), rr = TT[i][2];
    (function (px, py, tx, ty, h) { cel(c, function (c) { poly(c, [px - tx * 2, py - ty * 2, px + nx * h, py + ny * h, px + tx * 2, py + ty * 2]); }, C.SC3, { k: 0, lw: 1.5 }); })(TT[i][0] + nx * rr * .7, TT[i][1] + ny * rr * .7, Math.cos(th), Math.sin(th), lp(4.2, 2, i / 10)); }
  cel(c, tube(TT), C.SC2, { k: 1.6, lw: 2.1, inn: function (c) { for (i = 1; i < 10; i++) { var q0 = TT[i - 1], q1 = TT[i + 1], th = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), rr = TT[i][2]; ln(c, [TT[i][0] - Math.sin(th) * rr, TT[i][1] + Math.cos(th) * rr, TT[i][0] + Math.sin(th) * rr, TT[i][1] - Math.cos(th) * rr], 'rgba(20,24,20,.3)', .9); dot(c, TT[i][0] - Math.sin(th) * rr * .55, TT[i][1] + Math.cos(th) * rr * .55, rr * .45, 'rgba(230,230,200,.3)'); } } });
  /* pés de jacaré */
  function foot(F, fl, far) {
    var col = far ? C.SC3 : C.SC2;
    if (!fl) cel(c, function (c) { cap(c, F[0] - 1, -11, F[0] - .6, F[1] - 2.4, 3); }, col, { k: .8, lw: 1.8 });
    cel(c, function (c) { c.moveTo(F[0] - 4, F[1]); c.lineTo(F[0] - 4, F[1] - 3.4); c.quadraticCurveTo(F[0] + 1, F[1] - 5, F[0] + 6.4, F[1] - 2); c.quadraticCurveTo(F[0] + 7.6, F[1], F[0] + 5.6, F[1]); c.closePath(); }, col, { k: .8, lw: 1.7 });
    [1.6, 3.6, 5.6].forEach(function (d) { ln(c, [F[0] + d, F[1] - .6, F[0] + d + 2, F[1] + .3], OUT, 2.2); ln(c, [F[0] + d, F[1] - .6, F[0] + d + 2, F[1] + .3], '#e9e2d0', 1); });
  }
  if (!Q.sit) foot(Q.F1, Q.fl1, true);
  if (!Q.sit) foot(Q.F2, Q.fl2, false); else foot(Q.F1, Q.fl1, true);
  /* corpo: inclina em torno da cintura */
  c.save(); c.translate(0, sy); c.translate(0, -10); c.rotate(Q.rs); c.translate(0, 10); c.translate(0, -b * (1 - Q.sit));
  /* braço de trás */
  var Sb = [-5, -51], Sf = [8, -51];
  function arm(S, H, far, pref) {
    var colS = far ? C.DR3 : C.DR2, colA = far ? C.SC3 : C.SC2, k1 = ik(S[0], S[1], H[0], H[1], 12, 12, 1), k2 = ik(S[0], S[1], H[0], H[1], 12, 12, -1), kk = Math.abs(k1[1] - k2[1]) < 3 ? ((k1[0] - k2[0]) * pref > 0 ? k1 : k2) : (k1[1] > k2[1] ? k1 : k2), an = Math.atan2(H[1] - kk[1], H[0] - kk[0]);
    if (Math.hypot(H[0] - S[0], H[1] - S[1]) > 23.9) kk = [S[0] + (H[0] - S[0]) / 2, S[1] + (H[1] - S[1]) / 2];
    cel(c, function (c) { cap(c, kk[0], kk[1], H[0], H[1], 2.7); }, colA, { k: .8, lw: 1.8, inn: function (c) { dot(c, lp(kk[0], H[0], .4), lp(kk[1], H[1], .4) - 1, .9, 'rgba(20,24,20,.35)'); } });
    cel(c, function (c) { cap(c, S[0], S[1], kk[0], kk[1], 4.2); }, colS, { k: 1.2, lw: 1.9, inn: function (c) { ln(c, [lp(S[0], kk[0], .75) - 3, lp(S[1], kk[1], .75), lp(S[0], kk[0], .75) + 3, lp(S[1], kk[1], .75)], 'rgba(20,20,30,.4)', 1); } });
    ln(c, [kk[0] - 2.6, kk[1] - 2, kk[0] + 2.6, kk[1] + 2], C.LACE, 1.6);
    return an;
  }
  var anb = arm(Sb, Q.Hb, true, 1);
  /* frasco de poção na mão de trás */
  if (Q.flask > 0 && Q.thr < .6) { c.save(); c.translate(Q.Hb[0], Q.Hb[1] - 4); c.rotate(Q.thr * 2);
    cel(c, function (c) { c.moveTo(-1.4, -6); c.lineTo(1.4, -6); c.lineTo(1.6, -3.4); c.quadraticCurveTo(5, -1, 4.4, 2.6); c.quadraticCurveTo(0, 5.4, -4.4, 2.6); c.quadraticCurveTo(-5, -1, -1.6, -3.4); c.closePath(); }, 'rgba(230,240,240,.9)', { k: .5, lw: 1.5, inn: function (c) { c.fillStyle = MAG; c.fillRect(-6, -.6, 12, 6); dot(c, -1.6, 1.4, .7, '#fff'); } });
    cel(c, function (c) { poly(c, [-1.6, -6, 1.6, -6, 1.4, -8.4, -1.4, -8.4]); }, '#8e6a4a', { k: 0, lw: 1.2 }); c.restore(); }
  claws(c, Q.Hb, anb, C.SC3, C);
  /* saia rodada com remendo */
  var hy = -6 - Q.sit * 12, hw = Q.sit * 9, hs = Q.hs;
  cel(c, function (c) { c.moveTo(-10, -37); c.lineTo(11, -37); c.bezierCurveTo(15, -26, 18 + hs, -14, 21 + hs + hw, hy);
    for (var j = 0; j <= 8; j++) { var x = lp(21 + hs + hw, -18 + hs * .6 - hw, j / 8); c.quadraticCurveTo(x + 2.4, hy + 2.6, x - .2, hy + (j % 2 ? 0 : .4)); }
    c.bezierCurveTo(-16 - hw * .5, -14, -13, -26, -10, -37); c.closePath(); }, C.DR, { k: 2.8, lw: 2.2, inn: function (c) {
    ln(c, [-4, -34, -8 + hs * .6, hy], 'rgba(20,20,30,.3)', 1); ln(c, [4, -34, 6 + hs * .8, hy], 'rgba(20,20,30,.3)', 1);
    if (C.fr) { for (i = 0; i < 14; i++) { var fx = -14 + (i * 37 % 34), fy = -32 + (i * 23 % 26); for (var m = 0; m < 4; m++) dot(c, fx + Math.cos(m * 1.57) * 1.3, fy + Math.sin(m * 1.57) * 1.3, 1, i % 2 ? '#ffd23f' : '#ff9ac0'); dot(c, fx, fy, .7, '#fff'); } }
    else { for (i = 0; i < 10; i++) dot(c, -12 + (i * 37 % 30), -32 + (i * 23 % 24), 1.1, 'rgba(30,30,40,.25)'); }
    c.fillStyle = C.DR2; c.beginPath(); poly(c, [-12, -18, -5, -19, -4.6, -12, -12.6, -11.4]); c.fill(); ln(c, [-12, -18, -5, -19, -4.6, -12, -12.6, -11.4, -12, -18], C.fr ? '#ffd23f' : 'rgba(210,210,200,.6)', .8, [1.2, 1.2]);
    c.fillStyle = 'rgba(20,20,30,.25)'; c.fillRect(-30, hy - 2.6, 70, 4);
  } });
  /* avental */
  cel(c, function (c) { c.moveTo(1, -36); c.lineTo(12.6, -36); c.quadraticCurveTo(17 + hs * .8, -22, 18 + hs * .9 + hw * .6, hy - 2); c.quadraticCurveTo(8 + hs * .6, hy, -1 + hs * .5, hy - 1.4); c.quadraticCurveTo(-1, -22, 1, -36); c.closePath(); }, C.AP, { k: 1.6, lw: 1.9, inn: function (c) {
    cel(c, function (c) { poly(c, [5, -22, 13, -22.4, 13.6, -15.6, 5.4, -15]); }, C.AP2, { k: 0, lw: 1.1 });
    ln(c, [5.4, -20.6, 13.2, -21], 'rgba(40,40,40,.35)', .8);
    if (C.fr) { dot(c, 10, -25.6, 1.4, '#ff7aa8'); dot(c, 7.4, -27.4, 1.1, '#ffd23f'); }
    c.fillStyle = 'rgba(40,40,40,.12)'; c.fillRect(-2, hy - 4, 24, 3);
  } });
  /* corpete, gola de renda e cinto com frasquinhos */
  cel(c, function (c) { c.moveTo(-10, -37); c.bezierCurveTo(-11, -44, -10, -50, -7.6, -53.6); c.quadraticCurveTo(1, -56.4, 9.4, -53.6); c.bezierCurveTo(13, -50, 13.6, -43, 11.6, -37); c.closePath(); }, C.DR, { k: 2.2, lw: 2.1, inn: function (c) {
    ln(c, [5, -53, 6.4, -38], 'rgba(20,20,30,.4)', 1); [-50, -46, -42].forEach(function (y) { dot(c, 6.4, y, 1, C.fr ? '#ffd23f' : C.LACE); });
    c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.ellipse(-4, -48, 3, 4, .2, 0, TAU); c.fill();
  } });
  for (i = 0; i < 6; i++) cel(c, function (c) { el(c, -5 + i * 2.6, -53.2 + Math.abs(i - 2.5) * -.3, 1.9, 1.5); }, C.LACE, { k: .3, lw: 1.1 });
  rope(c, function (c) { c.moveTo(-10, -37); c.quadraticCurveTo(1, -35, 12, -37.4); }, C.DR3, 2.2);
  [[-6.4, MAG], [-2.4, VEN]].forEach(function (q) { cel(c, function (c) { poly(c, [q[0] - 1.4, -36, q[0] + 1.4, -36, q[0] + 1.8, -31, q[0] - 1.8, -31]); }, q[1], { k: .3, lw: 1.1 }); dot(c, q[0] - .5, -33.4, .5, '#fff'); });
  /* pescoço */
  cel(c, function (c) { cap(c, 1.6, -52, 4.4, -58.4, 4.6); }, C.SC, { k: 1, lw: 1.9, inn: function (c) { c.fillStyle = C.BL; c.beginPath(); c.ellipse(6, -55, 2.4, 4, -.3, 0, TAU); c.fill(); } });
  var Hn = Q.Hn, back = !Q.sit && Q.sa < -1.9;
  if (back) spoon(c, Hn[0], Hn[1], Q.sa, C, false);
  c.save(); c.translate(4, -57); c.rotate(Q.ht); c.scale(1.3, 1.3); cucaHead(c, Q, C); c.restore();
  /* braço da frente com a colher de pau */
  if (Q.sit) spoon(c, 14, -10, -.08, C, false);
  else if (!back) spoon(c, Hn[0], Hn[1], Q.sa, C, a === 'cast');
  var anf = arm(Sf, Hn, false, -1);
  claws(c, Hn, anf + (Q.sit ? 0 : -.6), C.SC2, C);
  /* efeitos */
  if (a === 'atk') {
    if (k > .4 && k < .9) swoosh(c, 6, -46, 30, -2.2, .2, .8, 'rgba(255,240,200,.85)');
    if (k > .9) { var bx = Hn[0] + Math.cos(Q.sa) * 27, by = Hn[1] + Math.sin(Q.sa) * 27; star(c, bx + 2, by + 2, 6, '#fff3c4'); for (i = 0; i < 6; i++) { var aa = i * 1.05; ln(c, [bx + Math.cos(aa) * 7, by + Math.sin(aa) * 7, bx + Math.cos(aa) * 11, by + Math.sin(aa) * 11], 'rgba(255,240,200,.9)', 1.5); } }
  }
  if (a === 'cast') {
    var vx = Hn[0] + Math.cos(Q.sa) * 27, vy = Hn[1] + Math.sin(Q.sa) * 27, g = c.createRadialGradient(vx, vy - 4, 1, vx, vy - 4, 14); g.addColorStop(0, 'rgba(255,79,200,.55)'); g.addColorStop(1, 'rgba(255,79,200,0)'); c.fillStyle = g; c.fillRect(vx - 14, vy - 18, 28, 28);
    for (i = 0; i < 4; i++) { var bu = (k * 2 + i * .25) % 1; bubble(c, vx - 5 + i * 3.4, vy - 4 - bu * 14, 1 + (i % 2) * .6, i % 2 ? VEN : '#ff8fe0', 1 - bu); }
    if (Q.thr > .4) { var tx = lp(14, 32, Q.thr), ty = lp(-78, -82, Q.thr); for (i = 0; i < 4; i++) bubble(c, tx - 4 - i * 3.6, ty + 1 + i * 1.4, 1.4 - i * .25, i % 2 ? VEN : MAG, Q.thr * .8);
      c.save(); c.translate(tx, ty); c.rotate(Q.thr * 5);
      cel(c, function (c) { c.moveTo(-1.4, -6); c.lineTo(1.4, -6); c.lineTo(1.6, -3.4); c.quadraticCurveTo(5, -1, 4.4, 2.6); c.quadraticCurveTo(0, 5.4, -4.4, 2.6); c.quadraticCurveTo(-5, -1, -1.6, -3.4); c.closePath(); }, 'rgba(230,240,240,.9)', { k: .5, lw: 1.5, inn: function (c) { c.fillStyle = MAG; c.fillRect(-6, -.6, 12, 6); } });
      c.restore(); }
  }
  if (a === 'special') { var u0 = k; for (i = 0; i < 4; i++) { var u = (u0 + i * .25) % 1; note(c, 34 + u * 14 + Math.sin(u * 7 + i) * 4, -58 - u * 22, .9 + (i % 2) * .15, i % 2 ? VEN : MAG, Math.sin(u * PI) * 1.1, i % 2 === 0); } }
  if (a === 'down') dizzy(c, 18, -88, k, '#ffe79a', 12);
  c.restore();
  if (Q.sit) { foot([Q.F1[0] - 4, Q.F1[1]], 1, true); foot(Q.F2, 1, false); }
}
