// @ts-nocheck
/* Capítulo 6, "Pampa de lua cheia": monstros comuns. Todos virados para a direita, pés (ou a base do voo)
   em (0,0), y negativo para cima. Assombros cinzentos com um resto de roxo-sombra e olhos rosa. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, EYE, EYEG, SH, SH2, SH3, G0, G1, G2, G3, G4, SHD, HIL, AO, cl, lp, sm, win, rope, bz, tube, limb, ghostEye, tooth, halo, spark } from './ch6_common';

/* ---------------- quero-quero ---------------- */
/* asa vista de lado: ombro (sx,sy), ângulo `a` (raiz → ponta), comprimento e largura; a borda de ataque fica à frente */
function wingQ(c, sx, sy, a, len, wd, far, spur) {
  var n0x = -Math.sin(a), n0y = Math.cos(a), sg = Math.abs(n0x) > .3 ? (n0x < 0 ? 1 : -1) : (n0y > 0 ? 1 : -1);
  c.save(); c.translate(sx, sy); c.rotate(a); c.scale(1, sg);
  var shape = function (c) {
    c.moveTo(0, -2.2); c.quadraticCurveTo(len * .2, -4.4, len * .42, -4); c.quadraticCurveTo(len * .74, -3, len, -.2);
    c.lineTo(len * .86, 1.4); c.lineTo(len * .8, wd * .5); c.lineTo(len * .66, wd * .72); c.lineTo(len * .5, wd * .86); c.lineTo(len * .32, wd); c.lineTo(len * .14, wd * .9); c.quadraticCurveTo(0, wd * .6, 0, 2.6); c.closePath();
  };
  cel(c, shape, far ? G3 : G2, { k: 1, lw: 1.7, sh: SHD, hi: HIL, inn: function (c) {
    c.fillStyle = far ? '#24222e' : '#2c2a38'; c.beginPath(); c.moveTo(len * .58, -6); c.lineTo(len + 2, -6); c.lineTo(len + 2, wd + 2); c.lineTo(len * .5, wd + 2); c.closePath(); c.fill();
    c.fillStyle = far ? 'rgba(200,198,214,.6)' : '#d8d6e2'; c.beginPath(); c.moveTo(len * .12, wd * .55); c.lineTo(len * .52, wd * .5); c.lineTo(len * .5, wd + 2); c.lineTo(len * .1, wd + 2); c.closePath(); c.fill();
    /* reflexo bronzeado das coberteiras, quase apagado */
    c.fillStyle = 'rgba(150,130,190,.35)'; c.beginPath(); c.ellipse(len * .28, -1, len * .16, 1.6, 0, 0, TAU); c.fill();
    for (var i = 0; i < 4; i++) ln(c, [len * (.6 + i * .09), -2, len * (.56 + i * .09), wd * .7], 'rgba(120,118,140,.5)', .7);
  } });
  if (spur) {
    var sx2 = len * .42, sy2 = -4;
    if (spur > .05) halo(c, sx2 + 1, sy2 - 2, 4 + spur * 6, '185,140,255', .55 * spur);
    cel(c, function (c) { poly(c, [sx2 - 1.3, sy2 + .4, sx2 + 2.6 + spur * 1.2, sy2 - 3.4 - spur * 1.4, sx2 + 1.4, sy2 + .4]); }, SH, { k: 0, lw: 1.1, out: '#2a1440' });
  }
  c.restore();
}
/* o.flap fase das asas · o.atk 0..1: grito com as asas erguidas → mergulho com o esporão à frente */
export function drawQueroquero(c, o) {
  o = o || {}; var w = o.flap || 0, at = o.atk == null ? -1 : cl(o.atk), att = at >= 0, wa = Math.sin(w), bob = -Math.cos(w) * 1.6, i;
  var dv = att ? win(at, .45, 1) : 0, cry = att ? win(at, 0, .35) * (1 - dv) : 0, rot = att ? lp(-.22 * cry, .62, dv) : Math.sin(w) * .04;
  c.save(); c.translate(0, -15 + bob - dv * 2); c.rotate(rot);
  /* ângulo e tamanho das asas */
  var A, L, Wd;
  if (att) { var up = lp(1, .9, dv); A = lp(-PI / 2 - .55, -PI + .55, dv); L = lp(20, 15, dv); Wd = lp(9, 6, dv); }
  else { A = PI + (PI / 2 - .5) * wa; L = 17 + 7 * Math.abs(wa); Wd = 8 + 3 * Math.abs(wa); }
  /* asa de trás */
  wingQ(c, -.5, -3.4, A - (att ? .12 : wa * .12), L * .94, Wd, true, att ? dv * .6 : 0);
  /* pernas recolhidas para trás */
  [[-1, 0], [1, 1]].forEach(function (q) { ln(c, [-3 + q[0], 3, -12 + q[0], 5.4 + q[1]], OUT, 2.6); ln(c, [-3 + q[0], 3, -12 + q[0], 5.4 + q[1]], '#8b8796', 1.2); });
  /* cauda: base branca, faixa preta */
  cel(c, function (c) { poly(c, [-12, -3.4, -20.6, -4.2, -21.2, 1.2, -12, 2]); }, '#dcdae4', { k: .6, lw: 1.6, sh: SHD, inn: function (c) { c.fillStyle = '#2a2836'; c.fillRect(-22, -5, 5.2, 7); } });
  /* corpo */
  cel(c, function (c) { c.moveTo(-14, -1.4); c.bezierCurveTo(-11, -5.6, -2, -7.2, 5, -6.4); c.bezierCurveTo(10, -5.6, 12, -2, 11, 1.2); c.bezierCurveTo(8, 5.6, -4, 5.2, -14, 1.8); c.closePath(); }, G1, { k: 1.6, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    c.fillStyle = '#e2e0ea'; c.beginPath(); c.ellipse(-1, 4, 11, 3.6, -.05, 0, TAU); c.fill();
    c.fillStyle = '#26242f'; c.beginPath(); c.moveTo(5, -6); c.quadraticCurveTo(13, -4, 11.6, 2.6); c.quadraticCurveTo(7, 3.6, 4.6, .4); c.quadraticCurveTo(3.6, -3, 5, -6); c.closePath(); c.fill();
    ln(c, [-10, -2.6, 2, -4.6], 'rgba(80,76,100,.5)', .8);
  } });
  /* cabeça com a mancha preta do rosto e o penacho */
  var hx = 12.4, hy = -6.6 - cry * 1.2;
  [[-1.6, 2.2, 9], [0, 0, 11], [1.4, -1.4, 8]].forEach(function (q) { rope(c, function (c) { c.moveTo(hx - 3, hy - 3 + q[0] * .3); c.quadraticCurveTo(hx - 7 - cry * 2, hy - 6 - q[2] * .4 - cry * 3, hx - 9 - q[1] - cry * 1.5, hy - 8 - q[2] * .35 - cry * 4); }, '#2a2836', .9, 'rgba(20,16,30,.9)'); });
  cel(c, function (c) { el(c, hx, hy, 4.8, 4.3); }, G1, { k: 1, lw: 1.9, sh: SHD, hi: HIL, inn: function (c) {
    c.fillStyle = '#26242f'; c.beginPath(); c.moveTo(hx - 1, hy - 4.6); c.quadraticCurveTo(hx + 5, hy - 4.4, hx + 5, hy - 1); c.lineTo(hx + 4.6, hy + 4.6); c.quadraticCurveTo(hx + 2, hy + 1, hx + 1.4, hy - 1.6); c.quadraticCurveTo(hx, hy - 3, hx - 1, hy - 4.6); c.closePath(); c.fill();
    ln(c, [hx - 3, hy + 1.8, hx + 1, hy + 3.8], 'rgba(235,232,245,.8)', 1);
  } });
  /* bico (aberto no grito) */
  var bo = cry * 1.8 + dv * .4;
  cel(c, function (c) { poly(c, [hx + 3.6, hy - 1.4, hx + 9.6, hy - .4 - bo * .3, hx + 3.8, hy + .6]); }, '#b6a6b4', { k: .4, lw: 1.3 });
  cel(c, function (c) { poly(c, [hx + 3.8, hy + .6, hx + 8.6, hy + .8 + bo, hx + 3.4, hy + 1.8]); }, '#9a8a9a', { k: .4, lw: 1.3 });
  dot(c, hx + 8.8, hy - .3 - bo * .3, .7, '#26242f');
  ghostEye(c, hx + 1.8, hy - 1.4, 1.3, 1.2);
  /* asa da frente */
  wingQ(c, 1, -3.8, A, L, Wd, false, att ? .25 + dv * .75 : .15);
  c.restore();
  /* grito: arcos saindo do bico */
  if (cry > .2) for (i = 0; i < 2; i++) { c.beginPath(); c.arc(22, -24, 4 + i * 4, -.7, .7); c.strokeStyle = 'rgba(226,208,255,' + (cry * (.8 - i * .3)) + ')'; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke(); }
  /* rastro do mergulho */
  if (dv > .3) for (i = 0; i < 3; i++) ln(c, [-10 - i * 3, -26 + i * 5, -22 - i * 3, -33 + i * 5], 'rgba(185,140,255,' + (dv - .3) * .8 + ')', 1.3);
}

/* ---------------- boi-barroso ---------------- */
/* o.walk fase do passo · o.atk 0..1: abaixa a cabeça, raspa a pata e aponta os chifres (último quadro = investida) */
export function drawBoi(c, o) {
  o = o || {}; var w = o.walk || 0, mv = o.walk != null, at = cl(o.atk), att = o.atk != null, i;
  var hl = att ? win(at, 0, .7) : 0, ch = att ? win(at, .7, 1) : 0, paw = att ? Math.sin(win(at, .15, .85) * PI * 2) * (1 - ch) : 0;
  var b = mv ? Math.abs(Math.cos(w)) * 1 : 0, lean = ch * .06, tsw = Math.sin(w + 1) * (mv ? 3 : 1.5) + ch * -4;
  var BC = '#a7a3b4', BC2 = '#8c889c', DK = G3, HN = '#d7d2de';
  c.save(); c.translate(0, 0); c.rotate(lean);
  function leg(hx, ph, near, front) {
    var s = mv ? Math.sin(w + ph) : 0, lift = mv ? Math.max(0, Math.cos(w + ph)) * 3 : 0, fx = hx + s * 5, fy = -lift, hy = -18 - b;
    if (att && front && near) { fx = hx + 3 - paw * 6; fy = -Math.max(0, paw) * 5 - ch * 2; }
    if (att && ch > 0) { fx += front ? 2 * ch : -3 * ch; }
    var kn = ik(hx, hy, fx, fy - 2, 9, 9.5, front ? -1 : 1), col = near ? BC2 : DK;
    cel(c, function (c) { cap(c, hx, hy, kn[0], kn[1], front ? 3.8 : 4.6); }, col, AO);
    cel(c, function (c) { cap(c, kn[0], kn[1], fx, fy - 2, 2.5); }, col, AO);
    cel(c, function (c) { poly(c, [fx - 3, fy, fx - 2.6, fy - 3.2, fx + 2.8, fy - 3.2, fx + 3.4, fy]); }, '#2e2b38', { k: 0, lw: 1.5 });
  }
  /* rabo */
  rope(c, function (c) { c.moveTo(-21, -29 - b); c.quadraticCurveTo(-24 + tsw * .3, -22, -23 + tsw, -12); }, BC2, 1.8);
  cel(c, function (c) { el(c, -23 + tsw, -10.6, 2, 3.4, tsw * .05); }, G4, { k: .5, lw: 1.5 });
  leg(-15, PI, false, false); leg(10, 0, false, true);
  /* chifre de trás */
  var hd = hl * .42 - ch * .05, NX = 15, NY = -29 - b;
  function headT(x, y) { var co = Math.cos(hd), si = Math.sin(hd); return [NX + (x - NX) * co - (y - NY) * si, NY + (x - NX) * si + (y - NY) * co]; }
  function horn(near) {
    var p = near ? [[22, -33], [30, -37], [38, -34], [43, -41]] : [[21, -34], [15, -38], [8, -36.5], [3, -42]];
    if (ch > 0 && near) p[3] = [lp(43, 46, ch), lp(-41, -37, ch)];
    var P = bz(p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1], p[3][0], p[3][1], 9, 2.6, .6).map(function (q) { var t = headT(q[0], q[1]); return [t[0], t[1], q[2]]; });
    cel(c, tube(P), near ? HN : '#a9a4b6', { k: .9, lw: 1.8, sh: SHD, inn: function (c) { var e = P[P.length - 1]; c.fillStyle = SH; c.beginPath(); c.arc(e[0], e[1], 4, 0, TAU); c.fill(); for (var j = 1; j < 4; j++) { var q = P[j]; ln(c, [q[0] - 1.6, q[1] - 1.6, q[0] + 1.6, q[1] + 1.6], 'rgba(90,84,104,.45)', .7); } } });
    if (near) { var e = P[P.length - 1]; halo(c, e[0], e[1], 5 + ch * 5, '185,140,255', .45 + ch * .4); }
  }
  horn(false);
  /* corpo */
  cel(c, function (c) {
    c.moveTo(-21, -26 - b); c.bezierCurveTo(-20, -33 - b, -9, -32.4 - b, 1, -33 - b); c.bezierCurveTo(6, -38 - b, 11.6, -37 - b, 14.6, -33 - b);
    c.bezierCurveTo(17.6, -30 - b, 18.6, -24 - b, 18, -19 - b); c.bezierCurveTo(16, -14 - b, 10, -13.4 - b, 2, -13 - b); c.bezierCurveTo(-8, -12.6 - b, -16, -13.4 - b, -20, -17 - b); c.quadraticCurveTo(-22.6, -21 - b, -21, -26 - b); c.closePath();
  }, BC, { k: 2.4, lw: 2.2, sh: SHD, hi: HIL, inn: function (c) {
    /* pintas do barroso e o lombo */
    c.fillStyle = 'rgba(96,90,112,.42)'; [[-12, -27, 5, 3.4, .3], [-4, -20, 4, 2.6, -.2], [6, -30, 3.4, 2.4, .2], [-17, -19, 2.6, 2, 0]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1] - b, q[2], q[3], q[4], 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(232,228,240,.3)'; c.beginPath(); c.ellipse(-2, -15 - b, 15, 2.6, 0, 0, TAU); c.fill();
    for (i = 0; i < 6; i++) ln(c, [-10 + i * 3.4, -15.6 - b, -9 + i * 3.4, -18.6 - b], 'rgba(70,64,86,.35)', .8);
    c.beginPath(); c.moveTo(13, -32 - b); c.quadraticCurveTo(10, -26 - b, 11.6, -18 - b); c.strokeStyle = 'rgba(70,64,86,.4)'; c.lineWidth = 1; c.stroke();
  } });
  leg(-18.5, 0, true, false); leg(13, PI, true, true);
  /* barbela e cabeça */
  c.save(); c.translate(NX, NY); c.rotate(hd); c.translate(-NX, -NY);
  cel(c, function (c) { c.moveTo(14, -30 - b); c.quadraticCurveTo(21, -25 - b, 22, -18 - b); c.quadraticCurveTo(18, -15.4 - b, 15, -19 - b); c.closePath(); }, BC2, { k: 1, lw: 1.8, sh: SHD });
  c.restore();
  var H = function (x, y) { return headT(x, y - b); };
  c.save(); var h0 = H(0, 0); c.translate(0, 0);
  cel(c, function (c) { var p = [[19, -35], [26, -34.6], [32.4, -26], [32, -21.4], [28, -19.6], [23, -21.6], [18.4, -27]]; p.forEach(function (q, j) { var t = H(q[0], q[1]); c[j ? 'lineTo' : 'moveTo'](t[0], t[1]); }); c.closePath(); }, BC, { k: 1.6, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    var m = H(30, -23); c.fillStyle = '#7d7889'; c.beginPath(); c.ellipse(m[0], m[1], 3.4, 3, hd, 0, TAU); c.fill(); var n = H(31.2, -24.4); dot(c, n[0], n[1], .9, '#26232e');
    var f = H(24, -33); c.fillStyle = 'rgba(96,90,112,.5)'; c.beginPath(); c.ellipse(f[0], f[1], 3, 2, hd, 0, TAU); c.fill();
  } });
  /* orelha */
  var e1 = H(20, -31.4), e2 = H(15.6, -30), e3 = H(18.6, -28.6);
  cel(c, function (c) { poly(c, [e1[0], e1[1], e2[0], e2[1], e3[0], e3[1]]); }, BC2, { k: .5, lw: 1.5 });
  var ey = H(24.4, -29.4); ghostEye(c, ey[0], ey[1], 1.6, 1.3, hd);
  var br = H(22.4, -31.8), br2 = H(26.2, -30.4); ln(c, [br[0], br[1], br2[0], br2[1]], OUT, 1.4);
  c.restore();
  horn(true);
  /* bufo roxo pelas ventas */
  if (att && at > .1) for (i = 0; i < 3; i++) { var n2 = H(32, -22), u = ((at * 2.2 + i * .33) % 1), al = (1 - u) * .7 * Math.min(1, at * 3); c.beginPath(); c.arc(n2[0] + 3 + u * 9, n2[1] + 3 + u * 4 - i, 1.4 + u * 3, 0, TAU); c.fillStyle = 'rgba(200,170,255,' + al + ')'; c.fill(); }
  /* poeira da pata raspando */
  if (att && at > .2 && ch < 1) for (i = 0; i < 4; i++) dot(c, 10 - i * 4, -1 - (i % 2) * 2.4, 1.6, 'rgba(160,150,170,' + (.5 * (1 - ch)) + ')');
  c.restore();
}

/* ---------------- alma penada ---------------- */
/* elo de corrente */
function chain(c, P, ph) {
  for (var i = 0; i < P.length - 1; i++) {
    var a = P[i], b = P[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, an = Math.atan2(b[1] - a[1], b[0] - a[0]), d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    c.save(); c.translate(mx, my); c.rotate(an); if (i % 2) c.scale(1, .45);
    c.beginPath(); c.ellipse(0, 0, d * .62, 1.9, 0, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = i % 2 ? '#6c6880' : '#9c98ae'; c.lineWidth = 1.2; c.stroke(); c.restore();
  }
  var e = P[P.length - 1]; c.save(); c.translate(e[0], e[1]);
  cel(c, function (c) { el(c, 0, 1.6, 2.6, 2.6); }, '#7a768c', { k: .5, lw: 1.4 }); dot(c, -.6, .8, .6, SH3); c.restore();
}
/* o.t tempo do ciclo (0..1) · o.atk 0..1: braços erguidos, correntes balançando, sinais roxos caindo */
export function drawAlma(c, o) {
  o = o || {}; var t = o.t || 0, ph = t * TAU, at = cl(o.atk), att = o.atk != null, i;
  var raise = att ? win(at, 0, .8) : 0, bob = Math.sin(ph) * 1.6 - raise * 2, sw = Math.sin(ph + 1);
  var SHT = '#cbc8d8', SHT2 = '#a6a2b8';
  if (att && raise > .1) { /* círculo de sinais embaixo */
    c.save(); c.translate(0, 4); c.scale(1, .32);
    halo(c, 0, 0, 30, '185,140,255', .35 * raise);
    c.beginPath(); c.arc(0, 0, 22 * raise, 0, TAU); c.strokeStyle = 'rgba(185,140,255,' + (.8 * raise) + ')'; c.lineWidth = 3; c.stroke();
    for (i = 0; i < 6; i++) { var a = i / 6 * TAU + at * 1.5; spark(c, Math.cos(a) * 22 * raise, Math.sin(a) * 22 * raise, 4, 'rgba(226,208,255,' + raise + ')'); }
    c.restore();
  }
  c.save(); c.translate(0, bob);
  c.globalAlpha = .93;
  /* lençol: barra rasgada balançando */
  var shape = function (c) {
    c.moveTo(-9, -36); c.bezierCurveTo(-8, -46, 9, -47, 10, -36);
    c.bezierCurveTo(12, -28, 14, -18, 15 + sw * 1.2, -8);
    var tips = [[15, -2], [11, -6], [8.6, 1], [5, -5], [1.6, 2.4], [-2, -4.4], [-5.4, 1.6], [-8.6, -4], [-12.4, .6], [-14, -7]];
    tips.forEach(function (q, j) { c.lineTo(q[0] + Math.sin(ph + j * .9) * 1.6 - sw * (j % 2 ? .5 : 1.4), q[1] + Math.cos(ph + j * 1.3) * 1.2); });
    c.bezierCurveTo(-14 - sw, -20, -11, -28, -9, -36); c.closePath();
  };
  cel(c, shape, SHT, { k: 2.4, lw: 2.2, sh: 'rgba(40,24,80,.4)', hi: 'rgba(240,244,255,.4)', inn: function (c) {
    c.strokeStyle = 'rgba(110,100,140,.5)'; c.lineWidth = 1.1; c.lineCap = 'round';
    [[-5, -30, -9, -6], [1, -26, 1, -3], [7, -30, 9, -6], [11, -24, 13, -6]].forEach(function (q, j) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[0] + sw * 1.5 - 1, (q[1] + q[3]) / 2, q[2] + Math.sin(ph + j) * 1.2, q[3]); c.stroke(); });
    /* furos */
    c.fillStyle = 'rgba(30,20,50,.55)'; c.beginPath(); c.ellipse(-6, -14, 1.6, 2.4, .3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(8, -11, 1.2, 1.8, -.2, 0, TAU); c.fill();
    halo(c, 2, -24, 18, '185,140,255', .12);
  } });
  /* capuz: buraco escuro do rosto */
  cel(c, function (c) { c.moveTo(-2, -42.4); c.bezierCurveTo(6, -44, 10.6, -38, 9.6, -32); c.bezierCurveTo(8.4, -27, 2, -26.4, -.6, -29); c.bezierCurveTo(-3, -32, -4, -39, -2, -42.4); c.closePath(); }, '#17121f', { k: 0, lw: 1.6, out: '#4c4664' });
  ghostEye(c, 2.2, -36.4, 1.6, 2, .1); ghostEye(c, 6.8, -36, 1.3, 1.8, .1);
  c.beginPath(); c.moveTo(2.6, -30.6); c.quadraticCurveTo(4.6, -32.2, 6.6, -30.4); c.strokeStyle = 'rgba(255,61,138,.5)'; c.lineWidth = 1; c.stroke();
  c.globalAlpha = 1;
  /* braços: mangas pendentes com grilhões e correntes */
  function arm(sx, sy, far) {
    var hx = lp(sx + 8 + sw * .6, sx + (far ? -2 : 4), raise), hy = lp(sy + 10, sy - 18 - (far ? 0 : 2), raise) + Math.sin(ph + (far ? 1 : 0)) * .8 * (1 - raise);
    var sl = function (c) { c.moveTo(sx - 3, sy - 2); c.quadraticCurveTo((sx + hx) / 2 - 2, (sy + hy) / 2 - 3, hx - 1.6, hy - 3); c.lineTo(hx + 2.4, hy + 1.6); c.lineTo(hx - .6, hy + 3); c.lineTo(hx - 2.6, hy + 1); c.quadraticCurveTo((sx + hx) / 2 + 1, (sy + hy) / 2 + 3, sx + 3, sy + 3); c.closePath(); };
    cel(c, sl, far ? SHT2 : SHT, { k: 1.4, lw: 1.9, sh: 'rgba(40,24,80,.4)', hi: 'rgba(240,244,255,.4)' });
    /* mão ossuda e grilhão */
    cel(c, function (c) { el(c, hx + 1.4, hy + .6, 2, 1.6); }, '#9a96aa', { k: .5, lw: 1.3 });
    ln(c, [hx - 2.4, hy - 2, hx + .6, hy + 2.6], OUT, 3.6); ln(c, [hx - 2.4, hy - 2, hx + .6, hy + 2.6], '#77738a', 2);
    var P = [], n = 6, sp = raise > .2 ? 1 : 0;
    for (var j = 0; j <= n; j++) { var u = j / n; P.push([hx - 1 + Math.sin(ph * 1 + u * 2 + (far ? 1 : 0)) * u * 3 - u * (2 - raise * 6) + sp * Math.sin(at * 9 + u * 3) * u * 4, hy + 1 + u * lp(14, 20, raise) * (raise > .5 ? -.2 + 1.2 * u : 1)]); }
    if (raise > .5) { P = []; for (j = 0; j <= n; j++) { u = j / n; var aa = -PI / 2 - .9 + u * 2.4 + at * 2 + (far ? .6 : 0); P.push([hx + Math.cos(aa) * u * 13, hy + Math.sin(aa) * u * 10 + u * 4]); } }
    chain(c, P, ph);
  }
  arm(-6, -31, true);
  arm(5, -30, false);
  /* sinais roxos subindo das mãos */
  if (att && raise > .3) for (i = 0; i < 4; i++) { var u = (at * 1.4 + i * .25) % 1; spark(c, -4 + i * 4 + Math.sin(i * 2 + at * 6) * 2, -50 - u * 10, 2.4 * (1 - u) + .6, 'rgba(210,180,255,' + (1 - u) * raise + ')'); }
  c.restore();
}

/* ---------------- fogo-fátuo ---------------- */
/* o.t tempo do ciclo · o.atk 0..1: incha até estourar */
export function drawFatuo(c, o) {
  o = o || {}; var t = o.t || 0, ph = t * TAU, at = cl(o.atk), att = o.atk != null, i;
  var sw = att ? lp(1, 1.75, sm(at)) : 1, burst = att ? win(at, .8, 1) : 0, fl = Math.sin(ph * 2) * 1.4, fl2 = Math.cos(ph * 3) * 1.2;
  var cy = -11;
  halo(c, 0, cy - 2, 20 * sw, '170,120,255', .5);
  c.save(); c.translate(0, cy); c.scale(sw, sw);
  if (att) { var sh = Math.sin(at * 40) * at * .8; c.translate(sh, 0); }
  function flame(k, col, out, lw) {
    var path = function (c) {
      c.moveTo(0, 9 * k); c.bezierCurveTo(-8.6 * k, 9 * k, -10 * k, 1, -7 * k, -5 * k);
      c.quadraticCurveTo(-8.4 * k + fl2 * .6, -12 * k, -6.4 * k + fl * .5, -15 * k); c.quadraticCurveTo(-4 * k, -10 * k, -2.6 * k, -9 * k);
      c.quadraticCurveTo(-2 * k + fl * .6, -17 * k, fl * 1.4 - 1, -22 * k - Math.abs(fl)); c.quadraticCurveTo(4 * k, -14 * k, 3.4 * k, -9.4 * k);
      c.quadraticCurveTo(5.6 * k + fl2 * .5, -12 * k, 7 * k + fl2, -14.6 * k); c.quadraticCurveTo(10 * k, -5 * k, 8.4 * k, 1 * k); c.bezierCurveTo(7.6 * k, 7 * k, 4 * k, 9 * k, 0, 9 * k); c.closePath();
    };
    if (out) cel(c, path, col, { k: 1.4 * k, lw: lw, out: out, sh: 'rgba(40,10,80,.35)', hi: 'rgba(255,240,255,.3)' }); else { c.beginPath(); path(c); c.fillStyle = col; c.fill(); }
  }
  flame(1, '#7a4ad0', '#2a1440', 1.8);
  flame(.74, SH);
  c.save(); c.translate(0, 2); flame(.48, SH3); c.restore();
  /* rachaduras de luz no inchaço */
  if (att && at > .35) { c.save(); c.globalCompositeOperation = 'lighter'; var a2 = (at - .35) / .65; [[-2, -2, -7, -7], [2, 0, 7, -4], [0, 3, 3, 8], [-1, 2, -6, 6]].forEach(function (q) { ln(c, [q[0], q[1], (q[0] + q[2]) / 2 + 1, (q[1] + q[3]) / 2 - 1, q[2], q[3]], 'rgba(255,240,255,' + a2 + ')', 1); }); c.restore(); }
  /* rosto */
  var sq = att ? at : 0;
  ghostEye(c, -2.2, -1.6, 1.4, lp(1.6, .7, sq), -.2); ghostEye(c, 2.6, -1.8, 1.4, lp(1.6, .7, sq), .2);
  if (att && at > .3) { c.beginPath(); c.moveTo(-3, 2.4); for (i = 0; i <= 6; i++) c.lineTo(-3 + i, 2.4 + (i % 2 ? 1.3 : 0)); c.strokeStyle = '#4a1f70'; c.lineWidth = .9; c.stroke(); }
  else { c.beginPath(); c.ellipse(.2, 2.6, 1.2, 1.4 + Math.sin(ph) * .3, 0, 0, TAU); c.fillStyle = '#4a1f70'; c.fill(); }
  c.restore();
  /* faíscas frias soltas */
  for (i = 0; i < 3; i++) { var u = (t + i / 3) % 1; spark(c, Math.sin(i * 2.1 + u * 6) * 6 * sw, cy - 14 * sw - u * 10, 1.8 * (1 - u) + .4, 'rgba(226,208,255,' + (1 - u) + ')'); }
  /* estouro */
  if (burst > 0) {
    halo(c, 0, cy, 26, '220,190,255', .7 * burst);
    for (i = 0; i < 10; i++) { var a = i / 10 * TAU + .2, r1 = 13 + burst * 4, r2 = 19 + burst * 7; ln(c, [Math.cos(a) * r1, cy + Math.sin(a) * r1, Math.cos(a) * r2, cy + Math.sin(a) * r2], 'rgba(226,208,255,' + burst + ')', 2); spark(c, Math.cos(a + .3) * (r2 + 2), cy + Math.sin(a + .3) * (r2 + 2), 2.6, 'rgba(185,140,255,' + burst + ')'); }
  }
}

/* ---------------- espantalho ---------------- */
function sickle(c, x, y, a, s, glint) {
  c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
  cel(c, function (c) { cap(c, 0, 3.4, 0, -2, 1.3); }, '#6b5a4e', { k: .4, lw: 1.4 });
  cel(c, function (c) { c.moveTo(-1.2, -2); c.bezierCurveTo(-2, -10, 6, -15, 12, -11); c.bezierCurveTo(7, -12, 2, -9, 1.4, -2); c.closePath(); }, '#aeb0bd', { k: .8, lw: 1.5, sh: 'rgba(30,20,60,.4)', hi: 'rgba(255,255,255,.5)', inn: function (c) { c.beginPath(); c.moveTo(-.4, -3); c.bezierCurveTo(-1, -10, 5, -13.6, 11, -11.2); c.strokeStyle = SH; c.lineWidth = 1.1; c.stroke(); } });
  if (glint) halo(c, 6, -11, 6, '185,140,255', glint);
  c.restore();
}
function straw(c, x, y, a, n, l) { for (var i = 0; i < n; i++) { var aa = a + (i - (n - 1) / 2) * .32, ll = l * (.7 + (i % 2) * .3); ln(c, [x, y, x + Math.cos(aa) * ll, y + Math.sin(aa) * ll], OUT, 2); ln(c, [x, y, x + Math.cos(aa) * ll, y + Math.sin(aa) * ll], i % 2 ? '#b8b099' : '#9c957f', .9); } }
/* o.walk fase do passo duro · o.atk 0..1: braço da frente vai para trás e arremessa a foice */
export function drawEspantalho(c, o) {
  o = o || {}; var w = o.walk || 0, mv = o.walk != null, at = cl(o.atk), att = o.atk != null, i;
  var hop = mv ? Math.abs(Math.sin(w)) * 3 : 0, sway = mv ? Math.sin(w) * .07 : 0, wind = att ? win(at, 0, .7) : 0, thr = att ? win(at, .7, 1) : 0;
  var PN = '#7c788c', PN2 = '#625e74', SHI = '#8f8a9e', SAC = '#b2ab9c', HAT = '#a49c84';
  /* pernas de pau dentro das calças */
  function leg(x, ph, near) {
    var up = mv ? Math.max(0, Math.sin(w + ph)) * 4 : 0, fx = x + (mv ? Math.cos(w + ph) * 2 : 0);
    ln(c, [x, -22 + hop, fx, -up], OUT, 4.2); ln(c, [x, -22 + hop, fx, -up], '#6b5a4e', 2.2);
    cel(c, function (c) { c.moveTo(x - 3.6, -26 + hop); c.lineTo(x + 3.6, -26 + hop); c.lineTo(fx + 3.4 + (near ? 0 : .4), -7 - up); c.lineTo(fx - 3.4, -7 - up); c.closePath(); }, near ? PN : PN2, { k: 1, lw: 1.8, sh: SHD, hi: HIL, inn: function (c) { ln(c, [x - 1, -22 + hop, fx - 1.4, -10 - up], 'rgba(40,36,56,.4)', .8); if (near) { c.fillStyle = 'rgba(140,110,200,.55)'; c.fillRect(x - 2.6, -19 + hop, 4, 4); ln(c, [x - 2.6, -19 + hop, x + 1.4, -15 + hop], 'rgba(40,30,60,.6)', .6); } } });
    rope(c, function (c) { c.moveTo(fx - 3.6, -8.4 - up); c.lineTo(fx + 3.6, -8.4 - up); }, '#8a8070', .8);
    straw(c, fx, -7 - up, PI / 2, 5, 4.4);
  }
  c.save(); c.translate(0, -hop); c.rotate(sway);
  leg(2.6, PI, false); leg(-2.6, 0, true);
  /* braço de trás (com a outra foice) */
  var SY = -40;
  ln(c, [-14, SY - 1, 13, SY + 1], OUT, 4.2); ln(c, [-14, SY - 1, 13, SY + 1], '#6b5a4e', 2.2);
  cel(c, function (c) { poly(c, [-15.6, SY - 4, -6, SY - 4.6, -5, SY + 3.4, -14.6, SY + 4.4, -12, SY + 1.6, -16, SY + 1]); }, PN2, { k: 1, lw: 1.7, sh: SHD });
  straw(c, -16, SY + .4, PI, 5, 4.6);
  sickle(c, -18.4, SY + 1, -.4 + Math.sin(w) * .1, .95, 0);
  /* camisa rasgada */
  cel(c, function (c) { c.moveTo(-7, SY - 4); c.lineTo(7, SY - 4); c.lineTo(8.6, -22); c.lineTo(6, -24); c.lineTo(4.4, -21.4); c.lineTo(1.6, -24.4); c.lineTo(-1, -21.6); c.lineTo(-4, -24); c.lineTo(-6, -21.4); c.lineTo(-8.6, -23); c.closePath(); }, SHI, { k: 1.6, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    ln(c, [0, SY - 3, .6, -23], 'rgba(40,36,56,.5)', .9); [-35, -31, -27].forEach(function (y) { dot(c, 1.6, y, .7, '#3a3648'); });
    c.fillStyle = 'rgba(110,104,128,.7)'; c.fillRect(-6, -31, 4, 4.4); ln(c, [-6, -31, -2, -26.6], 'rgba(40,36,56,.6)', .6); ln(c, [-2, -31, -6, -26.6], 'rgba(40,36,56,.6)', .6);
  } });
  rope(c, function (c) { c.moveTo(-7.4, -25.6); c.lineTo(7.8, -25.2); }, '#8a8070', 1);
  straw(c, 0, SY - 3, -PI / 2, 5, 4);
  /* cabeça de saco */
  var HX = 1, HY = SY - 10;
  cel(c, function (c) { c.moveTo(HX - 6.4, HY + 6); c.bezierCurveTo(HX - 8.6, HY - 2, HX - 6, HY - 8, HX, HY - 8); c.bezierCurveTo(HX + 7, HY - 8, HX + 8.6, HY - 1, HX + 6.4, HY + 6); c.quadraticCurveTo(HX, HY + 8, HX - 6.4, HY + 6); c.closePath(); }, SAC, { k: 1.6, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    for (i = 0; i < 6; i++) ln(c, [HX - 6 + i * 2.4, HY - 8, HX - 6.4 + i * 2.4, HY + 7], 'rgba(90,82,70,.25)', .7);
    for (i = 0; i < 5; i++) ln(c, [HX - 7, HY - 6 + i * 3, HX + 7, HY - 6 + i * 3], 'rgba(90,82,70,.18)', .7);
    /* boca costurada */
    ln(c, [HX - .6, HY + 3.4, HX + 6, HY + 3], '#3a3044', 1); for (i = 0; i < 4; i++) ln(c, [HX + .4 + i * 1.6, HY + 2.2, HX + 1 + i * 1.6, HY + 4.4], '#3a3044', .8);
  } });
  rope(c, function (c) { c.moveTo(HX - 6.4, HY + 6); c.quadraticCurveTo(HX, HY + 7.6, HX + 6.4, HY + 6); }, '#8a8070', 1);
  /* olhos: botões costurados que brilham */
  ghostEye(c, HX + 1, HY - 1, 1.5, 1.5); ghostEye(c, HX + 5, HY - 1.2, 1.3, 1.3);
  ln(c, [HX - .6, HY - 3.4, HX + 2.6, HY - 2.6], OUT, 1.1);
  /* chapéu de palha rasgado */
  cel(c, function (c) { c.moveTo(HX - 13, HY - 4); c.quadraticCurveTo(HX, HY - 9, HX + 14, HY - 6.4); c.lineTo(HX + 10, HY - 4); c.lineTo(HX + 8, HY - 5.6); c.quadraticCurveTo(HX, HY - 4, HX - 9, HY - 2); c.lineTo(HX - 11, HY - 3.4); c.closePath(); }, HAT, { k: 1, lw: 1.8, sh: SHD, hi: HIL });
  cel(c, function (c) { c.moveTo(HX - 6.4, HY - 6); c.quadraticCurveTo(HX - 5.6, HY - 15, HX + .4, HY - 15.4); c.quadraticCurveTo(HX + 6.6, HY - 15, HX + 7, HY - 7); c.closePath(); }, HAT, { k: 1.2, lw: 1.8, sh: SHD, hi: HIL, inn: function (c) { c.fillStyle = SH2; c.fillRect(HX - 7, HY - 9.4, 15, 2.2); c.fillStyle = '#2a2236'; c.beginPath(); c.ellipse(HX + 3, HY - 13, 1.4, 1, 0, 0, TAU); c.fill(); } });
  straw(c, HX + 12, HY - 6, -.2, 3, 3);
  /* braço da frente: barra de pau, gira no ombro para trás e solta a foice */
  var aa = att ? lp(lp(0, -2.5, wind), .35, thr) : Math.sin(w + .5) * .1;
  c.save(); c.translate(3, SY); c.rotate(aa);
  ln(c, [-2, 0, 15, 0], OUT, 4.2); ln(c, [-2, 0, 15, 0], '#6b5a4e', 2.2);
  cel(c, function (c) { poly(c, [3, -4.6, 13.4, -4, 14.4, 4, 4, 4.6, 6, 1.6, 2.4, 1]); }, PN, { k: 1, lw: 1.7, sh: SHD, hi: HIL });
  straw(c, 15, 0, 0, 5, 4.6);
  if (!att || at < .9) sickle(c, 17.4, 0, .1 + wind * .6, 1.05, wind * .6);
  c.restore();
  c.restore();
  /* foice voando, girando */
  if (att && thr > .2) {
    var fx = 3 + Math.cos(.35) * 22, fy = SY - hop + Math.sin(.35) * 22 - 6;
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(fx, fy, 9 + i * 2.2, -PI * .9 + i * .3, -PI * .2 + i * .3); c.strokeStyle = 'rgba(226,208,255,' + (.7 - i * .2) + ')'; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke(); }
    sickle(c, fx, fy, at * 9, 1.05, .7);
  }
}
