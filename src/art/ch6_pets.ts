// @ts-nocheck
/* Capítulo 6: companheiros (coloridos, simpáticos). Graxaim e coruja-buraqueira. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, cl, lp, sm, win, rope, bz, tube, halo, spark } from './ch6_common';

var PO = { k: 1.2, lw: 2, sh: 'rgba(60,20,10,.32)', hi: 'rgba(255,240,200,.3)' };

/* ---------------- graxaim (raposa do campo) ---------------- */
/* o.t ciclo parado · o.walk fase do passo · o.act 0..1: agacha e dá o bote */
export function drawGraxaim(c, o) {
  o = o || {}; var t = o.t || 0, ph = t * TAU, mv = o.walk != null, w = o.walk || 0, ac = o.act == null ? -1 : cl(o.act), i;
  var GR = '#a39a8a', GR2 = '#857b6c', OC = '#c98a4e', OC2 = '#a86c38', CR = '#f1e6cf', BK = '#2a2220';
  var crouch = ac >= 0 ? win(ac, 0, .5) * (1 - win(ac, .5, 1)) : 0, leap = ac >= 0 ? win(ac, .5, 1) : 0;
  var b = mv ? Math.abs(Math.cos(w)) * 1 : Math.sin(ph) * .4, lift = leap * 7, ang = -leap * .12 + crouch * .05;
  c.save(); c.translate(0, -lift); c.rotate(ang);
  var Y = -crouch * 3 - b;
  function leg(x, ph2, near, front) {
    var s = mv ? Math.sin(w + ph2) : 0, up = mv ? Math.max(0, Math.cos(w + ph2)) * 2.4 : 0, hx = x, hy = -11 + Y, fx = x + s * 4.4, fy = -up + crouch * 0;
    if (leap > 0) { fx = x + (front ? 7 : -7) * leap; fy = -2 * leap; }
    var kn = ik(hx, hy, fx, fy - 1.4, 6, 6, front ? -1 : 1), col = near ? OC : OC2;
    cel(c, function (c) { cap(c, hx, hy, kn[0], kn[1], 2.4); }, col, PO);
    cel(c, function (c) { cap(c, kn[0], kn[1], fx, fy - 1.4, 1.6); }, col, PO);
    cel(c, function (c) { el(c, fx + 1, fy - 1, 2, 1.3); }, near ? '#3a2a22' : '#2a1e18', { k: 0, lw: 1.3 });
  }
  /* rabo peludo com a ponta preta */
  var sw = mv ? Math.sin(w) * 2 : Math.sin(ph) * 1.6, TP = bz(-11, -14 + Y, -17, -15 + Y + sw * .3, -21, -11 + Y + sw, -26 + leap * -2, -8 + Y + sw * 1.4 - leap * 4, 8, 2.6, 3.6);
  cel(c, tube(TP), GR2, { k: 1.2, lw: 1.9, sh: PO.sh, hi: PO.hi, inn: function (c) { var e = TP[TP.length - 1]; c.fillStyle = BK; c.beginPath(); c.arc(e[0], e[1], 4.6, 0, TAU); c.fill(); ln(c, [TP[2][0], TP[2][1] - 1.6, TP[6][0], TP[6][1] - 2], 'rgba(255,240,210,.3)', 1); } });
  leg(-8, PI, false, false); leg(7, 0, false, true);
  /* corpo grisalho */
  cel(c, function (c) { c.moveTo(-13, -13 + Y); c.bezierCurveTo(-12, -19 + Y, 0, -19.6 + Y, 8, -18 + Y); c.bezierCurveTo(12, -17 + Y, 12.6, -11 + Y, 9, -9.4 + Y); c.bezierCurveTo(2, -8 + Y, -8, -8 + Y, -12, -10 + Y); c.closePath(); }, GR, { k: 1.8, lw: 2, sh: PO.sh, hi: PO.hi, inn: function (c) {
    c.fillStyle = CR; c.beginPath(); c.ellipse(-1, -8.8 + Y, 10, 2.4, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(60,50,46,.45)'; c.beginPath(); c.ellipse(-2, -18.6 + Y, 9, 2, 0, 0, TAU); c.fill();
    for (i = 0; i < 7; i++) ln(c, [-10 + i * 3, -16 + Y + (i % 2), -9 + i * 3, -14 + Y + (i % 2)], 'rgba(255,250,235,.4)', .7);
    c.fillStyle = 'rgba(201,138,78,.6)'; c.beginPath(); c.ellipse(6, -11 + Y, 4, 2, .3, 0, TAU); c.fill();
  } });
  leg(-10, 0, true, false); leg(9, PI, true, true);
  /* cabeça */
  var hx = 13.6, hy = -19 + Y - leap * 1 + Math.sin(ph) * .3;
  cel(c, function (c) { poly(c, [hx - 4, hy - 3, hx - 6.4, hy - 11, hx - .6, hy - 4.6]); }, OC2, { k: .4, lw: 1.6 });
  cel(c, function (c) { c.moveTo(hx - 5, hy + 2); c.bezierCurveTo(hx - 6, hy - 4, hx - 1, hy - 6.4, hx + 3, hy - 4.6); c.quadraticCurveTo(hx + 7, hy - 2.4, hx + 10.6, hy - .6); c.quadraticCurveTo(hx + 11, hy + 1.4, hx + 9, hy + 1.8); c.quadraticCurveTo(hx + 4, hy + 4.6, hx - 5, hy + 2); c.closePath(); }, GR, { k: 1.2, lw: 1.9, sh: PO.sh, hi: PO.hi, inn: function (c) {
    c.fillStyle = OC; c.beginPath(); c.ellipse(hx - 1, hy - 3, 3.6, 2, -.3, 0, TAU); c.fill();
    c.fillStyle = CR; c.beginPath(); c.ellipse(hx + 1.6, hy + 2, 4.4, 1.6, -.1, 0, TAU); c.fill();
    c.fillStyle = BK; c.beginPath(); c.ellipse(hx + 6.6, hy + 1.6, 3, 1, -.15, 0, TAU); c.fill();
  } });
  dot(c, hx + 10.4, hy - .6, 1.1, BK);
  /* orelha da frente */
  var ea = mv ? 0 : Math.max(0, Math.sin(ph * 2 + 1) - .6) * 1.4;
  cel(c, function (c) { poly(c, [hx - 2.4, hy - 3.6, hx - 3 - ea, hy - 12, hx + 1.4, hy - 4.6]); }, GR, { k: .4, lw: 1.7, inn: function (c) { c.fillStyle = OC; c.beginPath(); c.moveTo(hx - 1.6, hy - 4.6); c.lineTo(hx - 2.6 - ea, hy - 10); c.lineTo(hx + .4, hy - 5); c.closePath(); c.fill(); } });
  /* olho simpático */
  c.beginPath(); c.ellipse(hx + 3, hy - 1.6, 1.3, 1.4, 0, 0, TAU); c.fillStyle = '#2a1a10'; c.fill(); dot(c, hx + 3.4, hy - 2.1, .5, '#fff');
  ln(c, [hx + 1.4, hy - 3.6, hx + 4.6, hy - 3.2], 'rgba(42,26,16,.6)', .8);
  /* boca aberta no bote */
  if (leap > .3) { c.beginPath(); c.moveTo(hx + 4, hy + 2.2); c.lineTo(hx + 10, hy + 1.4); c.lineTo(hx + 9, hy + 3.6); c.closePath(); c.fillStyle = '#7a2a2a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); }
  c.restore();
  if (leap > .4) for (i = 0; i < 3; i++) ln(c, [-20 - i * 2, -20 + i * 4 - lift, -28 - i * 2, -20 + i * 4 - lift], 'rgba(255,240,210,' + (leap - .3) + ')', 1.2);
}

/* ---------------- coruja-buraqueira ---------------- */
/* o.flap fase das asas · o.act 0..1: abre as asas e arregala os olhos */
export function drawCoruja(c, o) {
  o = o || {}; var w = o.flap || 0, ac = o.act == null ? -1 : cl(o.act), i;
  var BR = '#9a6b42', BR2 = '#7a5030', BR3 = '#5e3a22', CR = '#f4e8cc', YE = '#ffd23f';
  var op = ac >= 0 ? sm(ac) : 0, wa = ac >= 0 ? 1 : Math.sin(w), bob = ac >= 0 ? -op * 2 : -Math.cos(w) * 1.4;
  c.save(); c.translate(0, -13 + bob);
  function wing(far) {
    var len = 14 + (ac >= 0 ? op * 5 : Math.abs(wa) * 3);
    var a = far ? (ac >= 0 ? lp(-.9, -.6, op) : -.2 - wa * .8) : (ac >= 0 ? lp(-2.3, -2.55, op) : -3.05 + wa * .85);
    var sx = far ? 3 : -3, sy = far ? -4 : -3;
    c.save(); c.translate(sx, sy); c.rotate(a + PI / 2);
    cel(c, function (c) { c.moveTo(-3, 0); c.quadraticCurveTo(-5, -len * .6, -1, -len); c.lineTo(1, -len * .8); c.lineTo(2.6, -len * .9); c.lineTo(3.4, -len * .66); c.lineTo(5, -len * .7); c.quadraticCurveTo(5.6, -len * .3, 3, 0); c.closePath(); }, far ? BR2 : BR, { k: 1, lw: 1.8, sh: PO.sh, hi: PO.hi, inn: function (c) { for (var j = 0; j < 6; j++) dot(c, -1 + (j % 2) * 2.4, -3 - j * len * .12, .9, CR); ln(c, [-2, -len * .55, 4, -len * .5], 'rgba(60,30,14,.5)', .8); } });
    c.restore();
  }
  wing(true);
  /* pernas compridas penduradas */
  [[-1.6, 0], [1.6, 1]].forEach(function (q) { var dx = ac >= 0 ? q[0] * 2 * op : -2; ln(c, [q[0], 6, q[0] + dx, 13 + q[1]], OUT, 2.8); ln(c, [q[0], 6, q[0] + dx, 13 + q[1]], '#d8c69a', 1.3); ln(c, [q[0] + dx - 1.2, 13.4 + q[1], q[0] + dx + 1.6, 13.6 + q[1]], '#5e3a22', 1.2); });
  /* corpo pintado */
  cel(c, function (c) { el(c, 0, 0, 7.4, 8.4); }, BR, { k: 1.6, lw: 2, sh: PO.sh, hi: PO.hi, inn: function (c) {
    c.fillStyle = CR; c.beginPath(); c.ellipse(1.6, 2.4, 5, 5.4, 0, 0, TAU); c.fill();
    for (var j = 0; j < 7; j++) { var a = j * .9; c.fillStyle = BR2; c.beginPath(); c.ellipse(1.6 + Math.cos(a) * 3, 2.6 + Math.sin(a) * 3.4, 1.1, .7, 0, 0, TAU); c.fill(); }
    for (j = 0; j < 5; j++) dot(c, -4 + (j % 2) * 1.6, -4 + j * 1.8, .8, CR);
  } });
  /* cabeça redonda virada para quem olha */
  var hy = -10, big = 1 + op * .45;
  cel(c, function (c) { el(c, 1.4, hy, 7.6, 6.6); }, BR, { k: 1.4, lw: 2, sh: PO.sh, hi: PO.hi, inn: function (c) { for (var j = 0; j < 7; j++) dot(c, -3.6 + j * 1.4, hy - 4.6 + (j % 2) * .8, .7, CR); } });
  /* sobrancelhas brancas e olhos amarelos */
  [[-1.6, -.2], [4.6, .2]].forEach(function (e) {
    c.beginPath(); c.ellipse(e[0], hy + .4, 3 * big, 2.8 * big, 0, 0, TAU); c.fillStyle = CR; c.fill();
    c.beginPath(); c.ellipse(e[0], hy + .6, 2.1 * big, 2.1 * big, 0, 0, TAU); c.fillStyle = YE; c.fill(); c.strokeStyle = OUT; c.lineWidth = .9; c.stroke();
    dot(c, e[0] + .3, hy + .7, (op > .5 ? .7 : 1.1) * big, '#1c0f0a'); dot(c, e[0] - .4, hy - .2, .5, '#fff');
    if (op < .5) ln(c, [e[0] - 2.6, hy - 1.6 + e[1] * 2, e[0] + 2.4, hy - 1.8 - e[1] * 2], BR3, 1);
  });
  cel(c, function (c) { poly(c, [1, hy + 2.4, 2.6, hy + 2.4, 1.8, hy + 5]); }, '#e8d49a', { k: 0, lw: 1.1 });
  wing(false);
  c.restore();
  if (op > .6) for (i = 0; i < 4; i++) { var a2 = -PI / 2 + (i - 1.5) * .5; ln(c, [Math.cos(a2) * 22, -16 + Math.sin(a2) * 18, Math.cos(a2) * 27, -16 + Math.sin(a2) * 22], 'rgba(255,236,170,' + (op - .5) * 1.6 + ')', 1.4); }
}
