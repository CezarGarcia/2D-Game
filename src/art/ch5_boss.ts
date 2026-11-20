// @ts-nocheck
/* Chefes do Capítulo 5: o Capelobo (elite: homem peludo com focinho de anta) e o Mapinguari (chefão:
   gigante peludo de couro de pedra, um olho só e a boca enorme na barriga). Também o Mapinguari libertado.
   Virados para a direita, pés em (0,0). `corpo` vai com o fio de luz; `fx` por cima. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, star, ik, cl, lp, sm, seg, rope, bz, tube, tooth, furStrokes, rng, aeye, halo, mark, getMark, G0, G1, G2, G3, G4, G5, AMB, AMB2, AMB3 } from './ch5_util';

var FUR = 'rgba(26,34,34,.45)', FURL = 'rgba(220,232,226,.3)';
function lighter(c, x, y, r, rgb, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
/* dois segmentos com a dobra escolhida pelo lado (sd: +1 joelho para a frente, −1 para trás) */
function limb(A, F, l1, l2, sd) { var k1 = ik(A[0], A[1], F[0], F[1], l1, l2, 1), k2 = ik(A[0], A[1], F[0], F[1], l1, l2, -1); return (k1[0] - k2[0]) * sd > 0 ? k1 : k2; }
/* franja de pelo pendurada ao longo de uma linha (para costas, braços, ombros) */
function shag(c, P, len, col, seed) {
  var R = rng(seed || 7);
  cel(c, function (c) {
    c.moveTo(P[0][0], P[0][1]);
    for (var i = 1; i < P.length; i++) c.lineTo(P[i][0], P[i][1]);
    for (i = P.length - 1; i > 0; i--) {
      var a = P[i], b = P[i - 1], n = 3, j;
      for (j = 0; j < n; j++) { var u0 = j / n, u1 = (j + 1) / n, l = len * (.7 + R() * .6), mx = lp(a[0], b[0], (u0 + u1) / 2), my = lp(a[1], b[1], (u0 + u1) / 2); c.quadraticCurveTo(mx + 1, my + l * .6, mx - .6, my + l); c.quadraticCurveTo(mx, my + l * .4, lp(a[0], b[0], u1), lp(a[1], b[1], u1)); }
    }
    c.closePath();
  }, col, { k: 1.2, lw: 1.7, inn: function (c) { furStrokes(c, R, Math.min(P[0][0], P[P.length - 1][0]) - 4, Math.min(P[0][1], P[P.length - 1][1]) - 2, Math.max(P[0][0], P[P.length - 1][0]) + 4, Math.max(P[0][1], P[P.length - 1][1]) + len, 10, FUR, len * .5, PI / 2, .7); } });
}
function claws(c, H, a, n, len, col) { for (var i = 0; i < n; i++) { var d = (i - (n - 1) / 2) * .38, x1 = H[0] + Math.cos(a + d) * len, y1 = H[1] + Math.sin(a + d) * len, cx = H[0] + Math.cos(a + d) * len * .6 + Math.cos(a + d + PI / 2) * len * .25, cy = H[1] + Math.sin(a + d) * len * .6 + Math.sin(a + d + PI / 2) * len * .25; c.beginPath(); c.moveTo(H[0] + Math.cos(a + d) * len * .3, H[1] + Math.sin(a + d) * len * .3); c.quadraticCurveTo(cx, cy, x1, y1); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = col || '#d8d2c2'; c.lineWidth = 1.2; c.stroke(); } }
function stars(c, x, y, t, col) { for (var i = 0; i < 3; i++) { var a = t * TAU + i * 2.094; star(c, x + Math.cos(a) * 12, y + Math.sin(a) * 3.6, 3 - (i % 2) * .6, col || '#ffd0e4'); } }

/* ================= Capelobo ================= */
function capPose(anim, k) {
  var P = { hx: -3, hy: -33, sx: 9, sy: -56, ha: 0, mo: 0, nf: [7, 0], ff: [-8, 0], nh: [17, -22], fh: [5, -23], tuck: 0, sit: 0, curl: 0 };
  var t = k * TAU, b = Math.sin(t);
  if (anim === 'idle') { P.hy += b * .6; P.sy += b * 1.2; P.ha = Math.sin(t + 1) * .08; P.curl = Math.sin(t * 2) * 1.5; P.nh = [17 + b, -22 + b]; P.fh = [5 - b, -23 + b]; }
  else if (anim === 'move') {
    var s = Math.sin(t), cc = Math.cos(t), bo = -Math.abs(cc) * 2.4;
    P.hy += bo; P.sy += bo; P.sx += 1.5; P.nf = [2 + s * 11, -Math.max(0, -cc) * 5]; P.ff = [-4 - s * 11, -Math.max(0, cc) * 5];
    P.nh = [10 - s * 12, -24 + bo + Math.abs(s) * 2]; P.fh = [8 + s * 12, -25 + bo]; P.ha = .06 + s * .04; P.curl = cc * 2;
  } else if (anim === 'atk') {
    var c0 = sm(seg(k, 0, .34)), up = Math.sin(seg(k, .2, 1) * PI) * (k < .99 ? 1 : 0), fw = sm(seg(k, .34, 1));
    var dx = fw * 18, dy = -up * 24 + (1 - fw) * c0 * 9 + (k > .99 ? 6 : 0);
    P.hx += dx - c0 * 2 * (1 - fw); P.hy += dy; P.sx += dx + fw * 8 - c0 * 4 * (1 - fw); P.sy += dy + fw * 6 + c0 * 6 * (1 - fw);
    P.tuck = up; P.nf = k > .99 ? [12 + dx * .5, 0] : [lp(7, 2 + dx, up), lp(0, P.hy + 18, up)]; P.ff = k > .99 ? [-6 + dx * .5, 0] : [lp(-8, -6 + dx, up), lp(0, P.hy + 16, up)];
    var back = c0 * (1 - fw), reach = fw;
    P.nh = [lp(lp(17, -8, back), P.sx + 28, reach), lp(lp(-22, -40, back), P.sy + 18, reach)]; P.fh = [lp(lp(5, -12, back), P.sx + 24, reach), lp(lp(-23, -44, back), P.sy + 12, reach)];
    P.ha = lp(lp(0, .2, back), -.1, reach); P.mo = fw; P.claw = reach;
  } else if (anim === 'cast') {
    var sn = sm(seg(k, 0, .4)), hw = sm(seg(k, .4, 1));
    P.sy += sn * 6 - hw * 4; P.sx += sn * 4 - hw * 5; P.ha = sn * .55 - hw * 1.75; P.mo = hw; P.curl = sn * 3 - hw * 3;
    P.nh = [lp(17, 20, sn) - hw * 6, lp(-22, -26, sn) - hw * 16]; P.fh = [lp(5, 9, sn) - hw * 10, lp(-23, -24, sn) - hw * 14];
  } else if (anim === 'down') {
    P.sit = 1; P.hx = -6; P.hy = -12 + b * .4; P.sx = 6; P.sy = -36 + b; P.ha = .65 + b * .04; P.nf = [16, 0]; P.ff = [8, 0]; P.nh = [18, -2]; P.fh = [10, -3]; P.mo = .4; P.curl = 3;
  } else if (anim === 'special') {
    var s2 = Math.sin(t), c2 = Math.cos(t), bo2 = -Math.abs(Math.sin(t)) * 4;
    P.hx = -16; P.hy = -30 + bo2 + c2 * 1.5; P.sx = 12; P.sy = -34 + bo2 - c2 * 1.5; P.ha = .35 + c2 * .05;
    P.nf = [-12 + s2 * 12, -Math.max(0, -c2) * 6]; P.ff = [-20 - s2 * 12, -Math.max(0, c2) * 6]; P.nh = [22 + s2 * 12, -Math.max(0, c2) * 5]; P.fh = [16 - s2 * 12, -Math.max(0, -c2) * 5]; P.quad = 1; P.mo = .3;
  }
  return P;
}
export function capelobo(c, anim, k) {
  var P = capPose(anim, k), HIP = [P.hx, P.hy], SH = [P.sx, P.sy], la = Math.atan2(SH[1] - HIP[1], SH[0] - HIP[0]);
  var lv = [Math.cos(la), Math.sin(la)], pv = [Math.sin(la), -Math.cos(la)]; /* pv aponta para as costas */
  function leg(F, far) {
    var A = [HIP[0] + (far ? -3 : 1), HIP[1] + 2], K = limb(A, [F[0], F[1] - 3], 17, 17, P.quad ? -1 : 1);
    if (P.sit) K = [A[0] + 13 + (far ? -3 : 0), A[1] - 9];
    var Fd = P.sit ? [K[0] + 4, -3] : [F[0], F[1] - 3];
    cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 6.2); }, far ? G3 : G1, { k: 1.4, lw: 2, inn: function (c) { furStrokes(c, rng(far ? 4 : 5), Math.min(A[0], K[0]) - 6, Math.min(A[1], K[1]) - 4, Math.max(A[0], K[0]) + 6, Math.max(A[1], K[1]) + 4, 18, FUR, 3, la + PI / 2, .8); } });
    cel(c, function (c) { cap(c, K[0], K[1], Fd[0], Fd[1], 4.4); }, far ? G4 : G2, { k: 1, lw: 1.9, inn: function (c) { furStrokes(c, rng(far ? 6 : 8), Math.min(K[0], Fd[0]) - 5, Math.min(K[1], Fd[1]), Math.max(K[0], Fd[0]) + 5, Math.max(K[1], Fd[1]), 10, FUR, 2.6, PI / 2, .7); } });
    /* pé redondo, de fundo de garrafa */
    cel(c, function (c) { el(c, Fd[0] + 1, Fd[1] + 1.4, 5.8, 2.8); }, far ? G4 : G3, { k: .8, lw: 1.8, inn: function (c) { c.beginPath(); c.ellipse(Fd[0] + 1, Fd[1] + 1.4, 3.4, 1.4, 0, 0, TAU); c.strokeStyle = 'rgba(10,14,16,.5)'; c.lineWidth = .9; c.stroke(); } });
  }
  function arm(H, far) {
    var S = [SH[0] + pv[0] * (far ? 4 : -1) - lv[0] * 3, SH[1] + pv[1] * (far ? 4 : -1) - lv[1] * 3 + 2], K = limb(S, H, 16, 16, -1);
    cel(c, function (c) { cap(c, S[0], S[1], K[0], K[1], 5); }, far ? G3 : G1, { k: 1.2, lw: 1.9, inn: function (c) { furStrokes(c, rng(far ? 9 : 10), Math.min(S[0], K[0]) - 5, Math.min(S[1], K[1]) - 4, Math.max(S[0], K[0]) + 5, Math.max(S[1], K[1]) + 4, 16, FUR, 3, PI / 2, .8); } });
    cel(c, function (c) { cap(c, K[0], K[1], H[0], H[1], 3.8); }, far ? G4 : G2, { k: 1, lw: 1.8 });
    /* tufo de pelo no cotovelo */
    cel(c, function (c) { c.moveTo(K[0] - 3, K[1] - 2); c.quadraticCurveTo(K[0] - 6, K[1] + 4, K[0] - 3.6, K[1] + 7); c.quadraticCurveTo(K[0] - 1, K[1] + 3, K[0] + 2, K[1] + 2); c.closePath(); }, far ? G4 : G2, { k: .5, lw: 1.4 });
    cel(c, function (c) { el(c, H[0], H[1], 3.6, 3.2); }, far ? G4 : G3, { k: .7, lw: 1.6 });
    var a = Math.atan2(H[1] - K[1], H[0] - K[0]); claws(c, H, a + (P.claw ? -.3 : 0), P.claw ? 4 : 3, 5.4 + (P.claw || 0) * 1.6);
  }
  arm(P.fh, true); leg(P.ff, true);
  /* tronco: tubo do quadril aos ombros, corcunda e peito */
  var TB = bz(HIP[0], HIP[1], lp(HIP[0], SH[0], .35) + pv[0] * 2, lp(HIP[1], SH[1], .35) + pv[1] * 2, lp(HIP[0], SH[0], .7) + pv[0] * 3, lp(HIP[1], SH[1], .7) + pv[1] * 3, SH[0], SH[1], 8, 12, 13);
  cel(c, tube(TB), G0, { k: 2.6, lw: 2.3, inn: function (c) {
    furStrokes(c, rng(31), Math.min(HIP[0], SH[0]) - 12, Math.min(HIP[1], SH[1]) - 12, Math.max(HIP[0], SH[0]) + 12, Math.max(HIP[1], SH[1]) + 12, 34, 'rgba(26,34,34,.32)', 4, la + PI, .8);
    furStrokes(c, rng(32), Math.min(HIP[0], SH[0]) - 6, Math.min(HIP[1], SH[1]) - 6, Math.max(HIP[0], SH[0]) + 6, Math.max(HIP[1], SH[1]) + 6, 20, FURL, 3, la + PI, .7);
    /* peito e barriga mais claros */
    c.fillStyle = 'rgba(200,214,206,.3)'; c.beginPath(); c.ellipse(lp(HIP[0], SH[0], .55) - pv[0] * 7, lp(HIP[1], SH[1], .55) - pv[1] * 7, 11, 5.4, la, 0, TAU); c.fill();
  } });
  /* juba de pelo pelas costas */
  var BK = []; for (var i = 0; i <= 5; i++) { var u = i / 5, q = TB[Math.round(u * 8)]; BK.push([q[0] + pv[0] * (q[2] - 1), q[1] + pv[1] * (q[2] - 1)]); }
  BK.reverse(); shag(c, BK.concat([[SH[0] + pv[0] * 6 + lv[0] * 6, SH[1] + pv[1] * 6 + lv[1] * 6]]), 9, G1, 41);
  leg(P.nf, false);
  /* cabeça com o focinho de anta */
  var HX = SH[0] + lv[0] * 7 + 3, HY = SH[1] + lv[1] * 7 - 3;
  c.save(); c.translate(HX, HY); c.rotate(P.ha);
  cel(c, function (c) { el(c, -3.4, -6.4, 2.6, 2.8, -.3); }, G2, { k: .6, lw: 1.5, inn: function (c) { dot(c, -3.2, -6.2, 1.2, 'rgba(10,14,16,.5)'); } });
  var cu = P.curl, SN = bz(4, -1, 12, -1.6, 17, 1 + cu * .4, 20.6, 6 + cu, 8, 3.8, 1.9);
  /* boca por baixo do focinho */
  if (P.mo > .05) { c.beginPath(); c.moveTo(3, 2); c.quadraticCurveTo(8, 2 + P.mo * 6, 13, 3 + P.mo * 2); c.lineTo(12, 1); c.closePath(); c.fillStyle = '#3a1222'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.1; c.stroke(); for (var j = 0; j < 3; j++) tooth(c, 6 + j * 2.4, 1.6, .6, 1.6); }
  cel(c, function (c) { el(c, 0, 0, 8, 7, -.1); }, G1, { k: 1.8, lw: 2.1, inn: function (c) { furStrokes(c, rng(51), -8, -7, 4, 5, 18, FUR, 2.4, PI * .85, .7); c.fillStyle = 'rgba(210,222,214,.28)'; c.beginPath(); c.ellipse(3, 3, 5, 3, 0, 0, TAU); c.fill(); } });
  cel(c, tube(SN), G2, { k: 1.2, lw: 1.8, inn: function (c) { for (var j = 2; j < 8; j++) ln(c, [SN[j][0] - .6, SN[j][1] - SN[j][2] + .6, SN[j][0] + .4, SN[j][1] + SN[j][2] - .8], 'rgba(10,14,16,.35)', .7); } });
  var tip = SN[SN.length - 1]; cel(c, function (c) { el(c, tip[0] + .4, tip[1] + .6, 2.4, 2.2); }, G3, { k: .5, lw: 1.5, inn: function (c) { dot(c, tip[0] + 1, tip[1] + 1, .7, OUT); } });
  mark(c, 'snout', tip[0] + 2, tip[1] + 1);
  /* topete de pelo e o olho fundo */
  cel(c, function (c) { c.moveTo(-7, -4); c.quadraticCurveTo(-6, -10, 0, -9); c.quadraticCurveTo(4, -9.4, 6, -6); c.quadraticCurveTo(1, -7, -1, -5.6); c.quadraticCurveTo(-4, -4.4, -7, -4); c.closePath(); }, G3, { k: .6, lw: 1.5 });
  aeye(c, 3.4, -3, 1.6, { halo: 3.6 });
  ln(c, [.4, -5.4, 6, -4.8], OUT, 1.5);
  c.restore();
  arm(P.nh, false);
  mark(c, 'hand', P.nh[0], P.nh[1]); mark(c, 'head', HX, HY - 8);
}
export function capeloboFx(c, anim, k) {
  if (anim === 'cast' && k > .5) {
    var p = getMark('snout'), a = -PI / 2 + .25, h = sm(seg(k, .5, 1));
    for (var i = 0; i < 3; i++) { var r = 8 + i * 8 * h; c.beginPath(); c.arc(p[0], p[1], r, a - .7, a + .7); c.strokeStyle = 'rgba(40,10,30,' + (.5 * h) + ')'; c.lineWidth = 3.6; c.lineCap = 'round'; c.stroke(); c.strokeStyle = 'rgba(255,140,190,' + (.9 * h * (1 - i * .22)) + ')'; c.lineWidth = 1.8; c.stroke(); }
  }
  if (anim === 'cast' && k < .5 && k > 0) { var q = getMark('snout'); [[3, -2], [6, -5], [9, -2]].forEach(function (d, i) { c.beginPath(); c.arc(q[0] + d[0], q[1] + d[1] - k * 6, 1.2 + i * .3, 0, TAU); c.fillStyle = 'rgba(200,220,210,.5)'; c.fill(); }); }
  if (anim === 'atk' && k > .99) { var hd = getMark('hand'); for (var j = 0; j < 6; j++) { var b = -PI + j * .5; ln(c, [hd[0] + Math.cos(b) * 6, hd[1] + Math.sin(b) * 6, hd[0] + Math.cos(b) * 13, hd[1] + Math.sin(b) * 13], 'rgba(255,236,240,.85)', 1.6); } }
  if (anim === 'down') { var h2 = getMark('head'); stars(c, h2[0], h2[1] - 6, k); }
  if (anim === 'special') { [[-26, -3, 4], [-34, -6, 3], [-30, -1, 2.6]].forEach(function (q, i) { c.beginPath(); c.arc(q[0] - k * 6, q[1], q[2] + k * 2, 0, TAU); c.fillStyle = 'rgba(150,160,150,' + (.35 - i * .07) + ')'; c.fill(); }); }
}

/* ================= Mapinguari ================= */
var GF = { f1: G1, f2: G2, f3: G3, f4: G4, st: '#8e928a', st2: '#6c706a', vein: AMB, belly: '#7c8682', lip: '#5a4650' };
var FF = { f1: '#a8603a', f2: '#8b4c2e', f3: '#6e3a24', f4: '#55301e', st: '#b9a184', st2: '#94806a', vein: '#ffcf5a', belly: '#c08458', lip: '#8a3a30' };
function mapPose(anim, k) {
  var t = k * TAU, b = Math.sin(t);
  var P = { y: 0, x: 0, lean: 0, nf: [12, 0], ff: [-12, 0], nh: [40, -32], fh: [-30, -36], mo: 0, hb: 0, kneel: 0, ha: 0 };
  if (anim === 'idle') { P.y = b * 1.2; P.nh = [40, -32 + b * 1.4]; P.fh = [-30, -36 + b * 1.2]; P.mo = .05 + .05 * Math.max(0, b); }
  else if (anim === 'move') {
    var s = Math.sin(t), cc = Math.cos(t); P.y = -Math.abs(s) * 2.6 + 1; P.lean = s * .035;
    P.nf = [12 + cc * 8, -Math.max(0, s) * 7]; P.ff = [-12 - cc * 8, -Math.max(0, -s) * 7]; P.nh = [40 - cc * 6, -32 + P.y]; P.fh = [-30 + cc * 6, -36 + P.y];
  } else if (anim === 'atk') {
    var r = sm(seg(k, 0, .67)), d = sm(seg(k, .67, 1));
    P.lean = -r * .06 + d * .14; P.x = d * 4; P.y = d * 4;
    P.nh = [lp(lp(40, 22, r), 54, d), lp(lp(-32, -130, r), -4, d)]; P.fh = [lp(-30, -36, r), lp(-36, -48, r)]; P.mo = r * .15; P.ha = -r * .2 + d * .25; P.slam = d;
  } else if (anim === 'cast') {
    var o = sm(seg(k, 0, .67)), w = sm(seg(k, .2, 1));
    P.lean = -w * .1; P.mo = o; P.ha = -w * .35; P.eu = 1;
    P.nh = [lp(40, 56, w), lp(-32, -92, w)]; P.fh = [lp(-30, -50, w), lp(-36, -90, w)];
  } else if (anim === 'down') {
    P.kneel = 1; P.y = 26 + b * .6; P.lean = .16; P.nh = [36, -2]; P.fh = [-6, -2]; P.mo = .35 + b * .05; P.ha = .35;
  } else if (anim === 'special') {
    var ph = (k * 2) % 1, sideNear = k < .5, lift = Math.sin(ph * PI) * (ph < .7 ? 1 : 0), up = sm(seg(ph, 0, .45)) * (1 - sm(seg(ph, .55, .75)));
    P.y = up * -4 + (ph > .7 ? 2 : 0); P.lean = sideNear ? -up * .05 : up * .05;
    if (sideNear) P.nf = [16, -up * 26]; else P.ff = [-8, -up * 26];
    P.nh = [42 + up * 4, -62 - up * 22]; P.fh = [-34 - up * 4, -64 - up * 22]; P.mo = .1;
    P.stomp = ph > .72 ? (sideNear ? 1 : -1) : 0;
  }
  return P;
}
function drawMap(c, anim, k, fr) {
  var C = fr ? FF : GF, P = mapPose(anim, k), HY = -38 + P.y, i;
  /* pernas: curtas e grossas, pés virados para trás */
  function leg(F, far) {
    var A = [(far ? -11 : 9), HY + 4], K, Fd = [F[0], F[1] - 4];
    if (P.kneel) { K = [A[0] + 4 + (far ? 4 : 0), -4]; Fd = [K[0] - 18, -3]; }
    else K = limb(A, Fd, 20, 20, 1);
    cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 9.5); }, far ? C.f3 : C.f1, { k: 2, lw: 2.2, inn: function (c) { furStrokes(c, rng(far ? 61 : 62), Math.min(A[0], K[0]) - 9, Math.min(A[1], K[1]) - 6, Math.max(A[0], K[0]) + 9, Math.max(A[1], K[1]) + 6, 22, FUR, 4, PI / 2, .9); } });
    cel(c, function (c) { cap(c, K[0], K[1], Fd[0], Fd[1], 7.6); }, far ? C.f4 : C.f2, { k: 1.6, lw: 2.1, inn: function (c) { furStrokes(c, rng(far ? 63 : 64), Math.min(K[0], Fd[0]) - 7, Math.min(K[1], Fd[1]), Math.max(K[0], Fd[0]) + 7, Math.max(K[1], Fd[1]), 14, FUR, 4, PI / 2, .8); } });
    /* joelheira de pedra */
    cel(c, function (c) { poly(c, [K[0] - 5, K[1] - 4, K[0] + 1, K[1] - 7, K[0] + 7, K[1] - 3, K[0] + 5, K[1] + 4, K[0] - 3, K[1] + 4]); }, far ? C.st2 : C.st, { k: 1.2, lw: 1.8, inn: function (c) { ln(c, [K[0] - 2, K[1] - 5, K[0] + 1, K[1], K[0] + 4, K[1] + 3], C.vein, .8); } });
    /* pé virado para trás: dedos com garras apontando para a esquerda */
    var fx = Fd[0], fy = Fd[1] + 4;
    if (!P.kneel) cel(c, function (c) { c.moveTo(fx + 6, fy - 7); c.quadraticCurveTo(fx + 9, fy - 1, fx + 6, fy); c.lineTo(fx - 13, fy); c.quadraticCurveTo(fx - 15, fy - 4, fx - 10, fy - 6); c.quadraticCurveTo(fx - 2, fy - 9, fx + 6, fy - 7); c.closePath(); }, far ? C.f4 : C.f3, { k: 1.2, lw: 2, inn: function (c) { ln(c, [fx - 4, fy - 7, fx - 5, fy - 1], 'rgba(10,14,16,.4)', .8); ln(c, [fx - 8, fy - 6, fx - 9, fy - 1], 'rgba(10,14,16,.4)', .8); } });
    if (!P.kneel) [0, 1, 2].forEach(function (j) { var cx = fx - 13 + j * .6, cy = fy - 1.2 - j * 2; c.beginPath(); c.moveTo(cx + 2, cy); c.quadraticCurveTo(cx - 2, cy - 1, cx - 3.4, cy + 1.2); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#d8d2c2'; c.lineWidth = 1.1; c.stroke(); });
    if (!far) mark(c, 'nfoot', Fd[0], 0); else mark(c, 'ffoot', Fd[0], 0);
  }
  c.save(); c.translate(P.x, 0);
  /* inclinação do tronco em torno do quadril */
  var co = Math.cos(P.lean), si = Math.sin(P.lean);
  function T(x, y) { var dy = y - HY; return [x * co - dy * si, HY + x * si + dy * co]; }
  function arm(H, far) {
    var S = T(far ? -22 : 22, -78 + P.y), K = limb(S, H, 26, 26, far ? -1 : 1), a = Math.atan2(H[1] - K[1], H[0] - K[0]);
    if (P.kneel) K = limb(S, H, 26, 26, 1);
    if (P.eu) { var e1 = ik(S[0], S[1], H[0], H[1], 26, 26, 1), e2 = ik(S[0], S[1], H[0], H[1], 26, 26, -1); K = e1[1] < e2[1] ? e1 : e2; }
    cel(c, function (c) { cap(c, S[0], S[1], K[0], K[1], 9); }, far ? C.f3 : C.f1, { k: 2, lw: 2.2, inn: function (c) { furStrokes(c, rng(far ? 71 : 72), Math.min(S[0], K[0]) - 9, Math.min(S[1], K[1]) - 6, Math.max(S[0], K[0]) + 9, Math.max(S[1], K[1]) + 6, 26, FUR, 4.4, PI / 2, .9); } });
    cel(c, function (c) { cap(c, K[0], K[1], H[0], H[1], 7.4); }, far ? C.f4 : C.f2, { k: 1.6, lw: 2.1 });
    /* bracelete de couro de pedra no antebraço */
    var mx = lp(K[0], H[0], .45), my = lp(K[1], H[1], .45), nx = -Math.sin(a), ny = Math.cos(a);
    cel(c, function (c) { poly(c, [mx - Math.cos(a) * 6 + nx * 8.6, my - Math.sin(a) * 6 + ny * 8.6, mx + Math.cos(a) * 6 + nx * 8, my + Math.sin(a) * 6 + ny * 8, mx + Math.cos(a) * 7 - nx * 8.4, my + Math.sin(a) * 7 - ny * 8.4, mx - Math.cos(a) * 5 - nx * 9, my - Math.sin(a) * 5 - ny * 9]); }, far ? C.st2 : C.st, { k: 1.4, lw: 2, inn: function (c) { ln(c, [mx - nx * 6, my - ny * 6, mx + Math.cos(a) * 2, my + Math.sin(a) * 2, mx + nx * 5, my + ny * 5], 'rgba(14,18,18,.6)', 1.3); ln(c, [mx - nx * 6, my - ny * 6, mx + Math.cos(a) * 2, my + Math.sin(a) * 2, mx + nx * 5, my + ny * 5], C.vein, .7); } });
    /* franja de pelo pendurada no braço */
    shag(c, [[S[0] - 6, S[1] + 4], [lp(S[0], K[0], .5) - 7, lp(S[1], K[1], .5)], [K[0] - 6, K[1] - 2]], 8, far ? C.f4 : C.f2, far ? 81 : 82);
    cel(c, function (c) { el(c, H[0], H[1], 6.4, 5.6, a); }, far ? C.f4 : C.f3, { k: 1.2, lw: 2 });
    claws(c, H, a, 4, 9, fr ? '#efe2c2' : '#d8d2c2');
    if (!far) mark(c, 'hand', H[0] + Math.cos(a) * 8, H[1] + Math.sin(a) * 8);
  }
  arm(P.fh, true); leg(P.ff, true);
  if (P.eu) arm(P.nh, false);
  c.save(); c.translate(0, HY); c.rotate(P.lean); c.translate(0, -HY);
  /* tronco enorme */
  function torso(c) { c.moveTo(-25, HY + 8); c.bezierCurveTo(-35, HY - 8, -36, HY - 42 + P.y * .2, -24, HY - 53); c.quadraticCurveTo(-2, HY - 64, 20, HY - 53); c.bezierCurveTo(33, HY - 42, 33, HY - 14, 25, HY + 6); c.quadraticCurveTo(0, HY + 17, -25, HY + 8); c.closePath(); }
  cel(c, torso, C.f1, { k: 3.6, lw: 2.6, sh: 'rgba(10,16,18,.42)', inn: function (c) {
    furStrokes(c, rng(91), -32, HY - 56, 28, HY + 12, 110, FUR, 5, PI / 2, .9); furStrokes(c, rng(92), -26, HY - 50, 22, HY + 6, 40, fr ? 'rgba(255,220,180,.3)' : FURL, 4, PI / 2, .8);
    /* barriga mais clara */
    c.fillStyle = C.belly; c.globalAlpha = .55; c.beginPath(); c.ellipse(2, HY - 21, 21, 22, 0, 0, TAU); c.fill(); c.globalAlpha = 1;
    furStrokes(c, rng(93), -14, HY - 36, 20, HY + 2, 26, FUR, 3, PI / 2, .7);
  } });
  /* placas de couro de pedra nas costas e ombros */
  [[-28, HY - 40, 9, 12, -.4], [-30, HY - 22, 7, 10, -.2], [-12, HY - 56, 12, 7, -.15], [12, HY - 54, 10, 7, .3]].forEach(function (q, n) {
    cel(c, function (c) { var R = rng(100 + n), m = 7; for (var j = 0; j < m; j++) { var a = j * TAU / m + q[4], rr = .82 + R() * .3; c[j ? 'lineTo' : 'moveTo'](q[0] + Math.cos(a) * q[2] * rr, q[1] + Math.sin(a) * q[3] * rr); } c.closePath(); }, n > 1 ? C.st : C.st2, { k: 1.8, lw: 2, inn: function (c) { ln(c, [q[0] - q[2] * .6, q[1] - 1, q[0], q[1] + 1.4, q[0] + q[2] * .5, q[1] - 2], 'rgba(14,18,18,.6)', 1.4); ln(c, [q[0] - q[2] * .6, q[1] - 1, q[0], q[1] + 1.4, q[0] + q[2] * .5, q[1] - 2], C.vein, .8); if (fr) { c.fillStyle = 'rgba(96,150,80,.85)'; c.beginPath(); c.ellipse(q[0] - 2, q[1] - q[3] * .6, q[2] * .6, 2, 0, 0, TAU); c.fill(); } } });
  });
  /* ---- a boca da barriga ---- */
  var mo = P.mo, MX = 2, MY = HY - 22, MW = 15 + mo * 4, MH = 1.4 + mo * 14;
  if (mo > .12) {
    if (!fr) halo(c, MX, MY, 30 + mo * 16, '255,61,138', .55 + mo * .5);
    /* lábios grossos */
    cel(c, function (c) { el(c, MX, MY, MW + 3.6, MH + 3.4); }, C.lip, { k: 1.4, lw: 2.4 });
    c.save(); c.beginPath(); c.ellipse(MX, MY, MW, MH, 0, 0, TAU); c.clip();
    var g = c.createRadialGradient(MX, MY + MH * .2, 1, MX, MY, MW); g.addColorStop(0, fr ? '#ff8a8a' : '#ff6fa8'); g.addColorStop(.45, fr ? '#c03a3a' : '#c8235f'); g.addColorStop(1, '#3a0818'); c.fillStyle = g; c.fillRect(MX - MW, MY - MH, MW * 2, MH * 2);
    /* garganta e língua */
    c.beginPath(); c.ellipse(MX, MY - MH * .1, MW * .35, MH * .45, 0, 0, TAU); c.fillStyle = '#2a0410'; c.fill();
    cel(c, function (c) { c.moveTo(MX - MW * .6, MY + MH); c.quadraticCurveTo(MX - MW * .5, MY + MH * .2, MX, MY + MH * .25); c.quadraticCurveTo(MX + MW * .5, MY + MH * .2, MX + MW * .6, MY + MH); c.closePath(); }, fr ? '#e86a6a' : '#e04a7c', { k: 1, lw: 1.4, inn: function (c) { ln(c, [MX, MY + MH * .35, MX, MY + MH * .8], 'rgba(80,0,30,.5)', 1); } });
    /* fileiras de dentes */
    var nt = 7; for (i = 0; i < nt; i++) { var u = (i + .5) / nt, tx = MX - MW + u * MW * 2, ey = Math.sqrt(Math.max(0, 1 - Math.pow((tx - MX) / MW, 2))) * MH; tooth(c, tx, MY - ey - .4, MW / nt * .85, 3 + mo * 2.6 * Math.sin(u * PI)); tooth(c, tx + MW / nt, MY + ey + .4, MW / nt * .75, -(2.4 + mo * 2 * Math.sin(u * PI))); }
    c.restore();
    c.beginPath(); c.ellipse(MX, MY, MW, MH, 0, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 1.6; c.stroke();
    if (!fr) { c.beginPath(); c.ellipse(MX, MY, MW + 5.4, MH + 5.2, 0, 0, TAU); c.strokeStyle = 'rgba(255,90,160,' + (.4 + mo * .5) + ')'; c.lineWidth = 1.4; c.stroke(); }
  } else if (fr) {
    /* sorriso da boca da barriga */
    cel(c, function (c) { c.moveTo(MX - 13, MY - 3); c.quadraticCurveTo(MX, MY + 13, MX + 13, MY - 3); c.quadraticCurveTo(MX, MY + 3, MX - 13, MY - 3); c.closePath(); }, '#7a2a2a', { k: 0, lw: 2.2, inn: function (c) { c.fillStyle = '#e86a6a'; c.beginPath(); c.ellipse(MX, MY + 5, 6, 2.6, 0, 0, TAU); c.fill(); for (var j = 0; j < 5; j++) tooth(c, MX - 8 + j * 4, MY - 2 + Math.abs(j - 2) * -.6 + 1.6, 1.6, 2.2); } });
    ln(c, [MX - 15, MY - 4, MX - 12, MY - 2], OUT, 1.4); ln(c, [MX + 15, MY - 4, MX + 12, MY - 2], OUT, 1.4);
  } else {
    /* fechada: costura grossa de lábios com pontas de dentes */
    cel(c, function (c) { c.moveTo(MX - MW - 3, MY); c.quadraticCurveTo(MX, MY - 6, MX + MW + 3, MY); c.quadraticCurveTo(MX, MY + 6, MX - MW - 3, MY); c.closePath(); }, C.lip, { k: 1, lw: 2.2, inn: function (c) { ln(c, [MX - MW, MY, MX - 5, MY - 1.2, MX + 5, MY - 1.2, MX + MW, MY], '#1a0610', 1.8); } });
    for (i = 0; i < 6; i++) { var tx2 = MX - 11 + i * 4.4; tooth(c, tx2, MY - 1.4 + Math.abs(i - 2.5) * .3, 1.1, i % 2 ? 2.2 : -2.2); }
    if (!fr) { c.beginPath(); c.moveTo(MX - MW - 2, MY); c.quadraticCurveTo(MX, MY + 1.2, MX + MW + 2, MY); c.strokeStyle = 'rgba(255,61,138,.6)'; c.lineWidth = .9; c.stroke(); }
  }
  mark(c, 'mouth', MX, MY);
  /* cabeça pequena afundada entre os ombros, um olho só */
  c.save(); c.translate(8, HY - 56); c.rotate(P.ha);
  shag(c, [[-18, -2], [-10, -10], [0, -14], [10, -11], [17, -3]], 9, C.f2, 111);
  cel(c, function (c) { c.moveTo(-12, 2); c.bezierCurveTo(-14, -10, -6, -17, 2, -17); c.bezierCurveTo(10, -17, 16, -10, 15, -1); c.quadraticCurveTo(2, 6, -12, 2); c.closePath(); }, C.f1, { k: 2, lw: 2.2, inn: function (c) { furStrokes(c, rng(121), -13, -17, 15, 2, 30, FUR, 3.4, PI * .6, .8); } });
  /* testa de pedra */
  cel(c, function (c) { c.moveTo(-6, -12); c.quadraticCurveTo(4, -17, 14, -10); c.lineTo(13, -6); c.quadraticCurveTo(4, -10, -5, -8); c.closePath(); }, C.st, { k: 1, lw: 1.8, inn: function (c) { ln(c, [2, -14, 4, -9], C.vein, .8); } });
  if (fr) {
    cel(c, function (c) { el(c, 6, -3.6, 4.6, 4.2); }, '#fff6e6', { k: .6, lw: 1.8 });
    dot(c, 7, -3.4, 2.8, '#5a3418'); dot(c, 7.2, -3.4, 1.5, '#1c0f0a'); dot(c, 8, -4.6, 1, '#fff');
    c.beginPath(); c.moveTo(1, -8.6); c.quadraticCurveTo(6, -10.6, 11, -8.2); c.strokeStyle = '#2a1408'; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke();
    dot(c, 12, 0, 1.8, 'rgba(230,90,70,.35)');
  } else {
    dot(c, 6, -3.6, 5.2, '#1a0c16');
    aeye(c, 6, -3.6, anim === 'down' ? 2.4 : 3.6, { sq: anim === 'down' ? .35 : 1, halo: 3.2, socket: false, blur: 10 });
    ln(c, [0, -8.6, 12.6, -6.4], OUT, 2.2);
  }
  /* dentes de baixo da cabeça (presas) */
  tooth(c, 10, 1.4, 1.2, -3); tooth(c, 3, 2.4, 1.1, -2.6);
  mark(c, 'head', 4, -18);
  c.restore();
  /* ombreira de pedra do lado de cá */
  c.restore();
  leg(P.nf, false);
  c.save(); c.translate(0, HY); c.rotate(P.lean); c.translate(0, -HY);
  cel(c, function (c) { var R = rng(131); for (var j = 0; j < 8; j++) { var a = j * TAU / 8 - .3, rr = .85 + R() * .25; c[j ? 'lineTo' : 'moveTo'](23 + Math.cos(a) * 11 * rr, HY - 42 + P.y * .3 + Math.sin(a) * 8 * rr); } c.closePath(); }, C.st, { k: 2, lw: 2.2, inn: function (c) { ln(c, [15, HY - 44, 22, HY - 41, 29, HY - 46], 'rgba(14,18,18,.6)', 1.4); ln(c, [15, HY - 44, 22, HY - 41, 29, HY - 46], C.vein, .8); if (fr) { c.fillStyle = 'rgba(96,150,80,.85)'; c.beginPath(); c.ellipse(21, HY - 49, 7, 2.4, 0, 0, TAU); c.fill(); [[18, HY - 51], [24, HY - 51.4]].forEach(function (q) { dot(c, q[0], q[1], 1.6, '#ffd23f'); dot(c, q[0], q[1], .7, '#e4572e'); }); } } });
  c.restore();
  if (!P.eu) arm(P.nh, false);
  c.restore();
}
export function mapinguari(c, anim, k) { drawMap(c, anim, k, false); }
export function mapinguariFree(c, anim, k) { drawMap(c, anim, k, true); }
export function mapinguariFx(c, anim, k) {
  if (anim === 'cast' && k > .3) {
    var p = getMark('mouth'), o = sm(seg(k, .3, 1));
    lighter(c, p[0], p[1], 34 + o * 14, '255,61,138', .3 + o * .3);
    for (var i = 0; i < 3; i++) { var r = 22 + i * 11 * o; c.beginPath(); c.arc(p[0], p[1], r, -.75, .75); c.strokeStyle = 'rgba(40,10,30,' + (.5 * o) + ')'; c.lineWidth = 4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = 'rgba(255,150,200,' + (.9 * o * (1 - i * .25)) + ')'; c.lineWidth = 2.2; c.stroke(); }
  }
  if (anim === 'atk' && k > .99) {
    var h = getMark('hand'); cracks(c, h[0], -1, 1, 1);
    for (var j = 0; j < 5; j++) { c.beginPath(); c.arc(h[0] - 14 + j * 7, -3 - (j % 2) * 4, 3 + (j % 3), 0, TAU); c.fillStyle = 'rgba(150,156,146,.38)'; c.fill(); }
  }
  if (anim === 'down') { var hd = getMark('head'); stars(c, hd[0], hd[1] - 4, k); }
  if (anim === 'special') {
    var ph = (k * 2) % 1, f = getMark(k < .5 ? 'nfoot' : 'ffoot');
    if (ph > .7) cracks(c, f[0], 0, 1.1, 1);
  }
}
export function mapinguariFreeFx(c, anim, k) {
  var hd = getMark('head'); [[-14, -4], [16, -10], [-4, -16]].forEach(function (q, i) { var a = (k + i / 3) % 1; dot(c, hd[0] + q[0], hd[1] + q[1] - a * 8, 1.4, 'rgba(255,230,140,' + (Math.sin(a * PI) * .9) + ')'); });
}
/* rachaduras no chão (vistas em perspectiva) com brilho âmbar */
function cracks(c, x, y, s, a) {
  lighter(c, x, y, 26 * s, '255,180,80', .35 * a);
  var L = [[0, 0, -14, 2, -26, 1], [0, 0, 12, 3, 24, 2], [0, 0, -6, 4, -10, 6], [0, 0, 7, -2, 16, -3], [0, 0, 4, 5, 8, 7]];
  L.forEach(function (p) { var q = p.map(function (v, i) { return i % 2 ? y + v * s : x + v * s; }); ln(c, q, 'rgba(20,12,8,.85)', 2.6); ln(c, q, 'rgba(255,190,90,.9)', 1); });
  [[-18, -6, 2.6], [14, -8, 2], [-6, -10, 1.6], [22, -4, 1.6]].forEach(function (q) { cel(c, function (c) { poly(c, [x + q[0] * s - q[2], y + q[1] * s + q[2], x + q[0] * s, y + q[1] * s - q[2], x + q[0] * s + q[2], y + q[1] * s + q[2] * .6]); }, '#7c7f78', { k: .4, lw: 1 }); });
}
