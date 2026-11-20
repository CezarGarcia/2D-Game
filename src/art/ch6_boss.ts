// @ts-nocheck
/* Capítulo 6, "Pampa de lua cheia": a Teiniaguá (elite), o Lobisomem nas duas formas e o Lobisomem libertado.
   Virados para a direita, pés em (0,0), y negativo para cima. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, star, ik, EYE, EYEG, SH, SH2, SH3, G0, G1, G2, G3, G4, SHD, HIL, AO, cl, lp, sm, win, rope, bz, tube, limb, ghostEye, tooth, claw, halo, spark } from './ch6_common';

var RUBY = '#e8213f', RUBY2 = '#ff7a8e';
function rot(x, y, a) { var c0 = Math.cos(a), s0 = Math.sin(a); return [x * c0 - y * s0, x * s0 + y * c0]; }
/* sistema local: origem (ox,oy), ângulo a → mundo */
function frame(ox, oy, a) { return function (x, y) { var r = rot(x, y, a); return [ox + r[0], oy + r[1]]; }; }
function pathPts(c, P) { P.forEach(function (q, i) { c[i ? 'lineTo' : 'moveTo'](q[0], q[1]); }); c.closePath(); }
function smoothPts(c, P) { var n = P.length, i; c.moveTo((P[n - 1][0] + P[0][0]) / 2, (P[n - 1][1] + P[0][1]) / 2); for (i = 0; i < n; i++) { var q = P[(i + 1) % n]; c.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + q[0]) / 2, (P[i][1] + q[1]) / 2); } c.closePath(); }
function ruby(c, x, y, r, pw) {
  halo(c, x, y, r * (2.4 + pw * 5), '255,40,80', .2 + pw * .6);
  cel(c, function (c) { poly(c, [x, y - r * 1.3, x + r, y, x, y + r * 1.1, x - r, y]); }, RUBY, { k: r * .3, lw: 1.3, sh: 'rgba(90,0,20,.45)', hi: 'rgba(255,220,230,.5)' });
  dot(c, x - r * .3, y - r * .4, r * .3, '#ffe0e6');
  if (pw > .3) for (var i = 0; i < 6; i++) { var a = i / 6 * TAU + .3, l1 = r * 2, l2 = r * (2.6 + pw * 4); ln(c, [x + Math.cos(a) * l1, y + Math.sin(a) * l1, x + Math.cos(a) * l2, y + Math.sin(a) * l2], 'rgba(255,120,140,' + (pw - .2) + ')', 1); }
}

/* ======================= Teiniaguá ======================= */
/* forma de lagartixa. o: t (0..1 do ciclo), walk (fase), atk, cast, down */
function lizard(c, o) {
  var t = o.t || 0, ph = t * TAU, mv = o.walk != null, w = o.walk || 0, at = o.atk == null ? -1 : cl(o.atk), cs = cl(o.cast), dn = o.down ? 1 : 0, i;
  var L1 = '#8f93a6', L2 = '#717589', L3 = '#55596c', BEL = '#bcbccb';
  var coil = at >= 0 ? win(at, 0, .45) * (1 - win(at, .55, 1)) : 0, lunge = at >= 0 ? win(at, .55, 1) : 0, rear = sm(cs);
  var bx = -coil * 6 + lunge * 9, br = Math.sin(ph) * .5;
  /* inclinação do corpo: empina na magia, achata no tonto */
  var A = -rear * .38 - coil * .05 + lunge * .02;
  var B = frame(bx, -6.5 + dn * 2.4 - br * .4, A);   /* espaço do corpo: quadril em (-12,0), ombro em (12,0) */
  var tw = mv ? Math.sin(w) : Math.sin(ph) * .6;
  /* pernas abertas de lagarto */
  function leg(px, front, near, ph2) {
    var s = mv ? Math.sin(w + ph2) : 0, up = mv ? Math.max(0, Math.cos(w + ph2)) * 3 : 0, p = B(px, 1.5);
    var fx = p[0] + (front ? 6 : -7) + s * 6 + lunge * (front ? 6 : -4) - coil * (front ? 2 : -1), fy = -up;
    if (dn) { fx = p[0] + (front ? 9 : -9); fy = -1; }
    if (rear > 0 && front) { fx = p[0] + 6; fy = Math.min(fy, 0); }
    var kx = p[0] + (front ? 4 : -5) + s * 2, ky = p[1] + 1.5 - up * .6 - (near ? 0 : 1.2);
    var col = near ? L2 : L3;
    cel(c, function (c) { cap(c, p[0], p[1], kx, ky, 3); }, col, AO);
    cel(c, function (c) { cap(c, kx, ky, fx, fy - 1.4, 2.3); }, col, AO);
    for (var j = 0; j < 4; j++) { var a = (front ? -.9 : -2.4) + j * .5; ln(c, [fx, fy - 1, fx + Math.cos(a) * 3.6 + (front ? 2 : -1), fy - .4 + Math.abs(Math.sin(a)) * .4], OUT, 2.2); ln(c, [fx, fy - 1, fx + Math.cos(a) * 3.6 + (front ? 2 : -1), fy - .4 + Math.abs(Math.sin(a)) * .4], col, 1); }
  }
  leg(-11, false, false, PI); leg(10, true, false, 0);
  /* rabo comprido */
  var h0 = B(-13, 0), TP = bz(h0[0], h0[1], h0[0] - 12, h0[1] + 2 + tw * 3, h0[0] - 24, -1 - tw * 5, h0[0] - 36 - lunge * 2 + coil * 3, -2 + tw * 3 - dn, 14, 5.2, .8);
  cel(c, tube(TP), L1, { k: 1.4, lw: 2, sh: SHD, hi: HIL, inn: function (c) { for (var j = 2; j < TP.length - 1; j += 2) { var q = TP[j]; ln(c, [q[0] - 1, q[1] - q[2] * .8, q[0] + 1, q[1] + q[2] * .6], 'rgba(60,60,84,.45)', 1.1); } } });
  /* corpo */
  var body = function (c) { smoothPts(c, [B(-17, 0), B(-13, -6.4), B(-2, -8.6), B(8, -7.6), B(15, -6), B(17.4, -1), B(13, 4), B(0, 5), B(-12, 4.2)]); };
  cel(c, body, L1, { k: 2, lw: 2.1, sh: SHD, hi: HIL, inn: function (c) {
    var q = B(0, 3); c.fillStyle = BEL; c.beginPath(); c.ellipse(q[0], q[1], 14, 2.6, A, 0, TAU); c.fill();
    /* manchas do dorso e escamas */
    for (var j = 0; j < 6; j++) { var p = B(-11 + j * 4.4, -4 + (j % 2)); c.fillStyle = 'rgba(64,62,90,.45)'; c.beginPath(); c.ellipse(p[0], p[1], 1.9, 1.2, A, 0, TAU); c.fill(); }
    for (j = 0; j < 9; j++) { var p2 = B(-13 + j * 3.2, -6.4 + Math.abs(j - 4) * .12); dot(c, p2[0], p2[1], .8, 'rgba(210,214,235,.5)'); }
  } });
  leg(-12.5, false, true, 0); leg(11.5, true, true, PI);
  /* cabeça: erguida, com a pedra na testa */
  var hb = -rear * .5 + lunge * .18 - coil * .25 + (dn ? .35 : 0) + Math.sin(ph) * .03 * (1 - dn), N = B(14, -3.5);
  var Hd = frame(N[0], N[1], A + hb), jaw = lunge * .6 + (at >= 0 && at < .5 ? 0 : 0) + (dn ? .12 : 0);
  /* pescoço */
  cel(c, function (c) { var a1 = B(10, -6.4), a2 = Hd(4, -4.8), a3 = Hd(4, 2.6), a4 = B(12, 3); pathPts(c, [a1, a2, a3, a4]); }, L1, { k: 1, lw: 1.9, sh: SHD, hi: HIL });
  /* maxila de baixo */
  var J = function (x, y) { var r = rot(x - 3, y - 1.4, jaw); return Hd(3 + r[0], 1.4 + r[1]); };
  if (jaw > .05) {
    cel(c, function (c) { pathPts(c, [J(2, 1), J(15, 1.4), J(13, 3.2), J(3, 3.6)]); }, '#a0a2b3', { k: .6, lw: 1.6 });
    var m1 = Hd(6, 1.2), m2 = Hd(14, 1); c.beginPath(); c.moveTo(m1[0], m1[1]); var m3 = J(14, 1.4), m4 = J(6, 1.4); c.lineTo(m2[0], m2[1]); c.lineTo(m3[0], m3[1]); c.lineTo(m4[0], m4[1]); c.closePath(); c.fillStyle = '#4a1630'; c.fill();
  }
  cel(c, function (c) { pathPts(c, [Hd(-1, -4), Hd(5, -5.6), Hd(12, -4.2), Hd(18, -1.6), Hd(18.6, .4), Hd(15, 1.4), Hd(4, jaw > .05 ? 1.2 : 2.6), Hd(-1, 2.4)]); }, L1, { k: 1.4, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    var p = Hd(7, 2); if (jaw <= .05) { var p2 = Hd(15, .2); ln(c, [p[0], p[1], p2[0], p2[1]], 'rgba(40,36,60,.7)', 1); }
    var n1 = Hd(16.6, -1.4); dot(c, n1[0], n1[1], .6, '#2a2838');
    for (var j = 0; j < 3; j++) { var s1 = Hd(1 + j * 3, -5.2 + j * .2); dot(c, s1[0], s1[1], .7, 'rgba(210,214,235,.5)'); }
  } });
  /* olho */
  var e = Hd(7.6, -2.6);
  if (dn) { ln(c, [e[0] - 1.4, e[1] - 1.2, e[0] + 1.4, e[1] + 1.2], '#ff3d8a', 1.2); ln(c, [e[0] - 1.4, e[1] + 1.2, e[0] + 1.4, e[1] - 1.2], '#ff3d8a', 1.2); }
  else { ghostEye(c, e[0], e[1], 1.6, 1.2, A + hb); }
  /* diadema cinza e a pedra encantada */
  var d1 = Hd(0, -4), d2 = Hd(5, -6), d3 = Hd(9.5, -5.2); rope(c, function (c) { c.moveTo(d1[0], d1[1]); c.quadraticCurveTo(d2[0], d2[1] - 1, d3[0], d3[1]); }, '#b4b0c2', 1.1);
  var st = Hd(4.8, -7.8), pw = Math.max(rear, coil * .4, .15 + Math.sin(ph) * .1);
  ruby(c, st[0], st[1], 2.2 + rear * .6, dn ? 0 : pw);
  /* língua bifurcada */
  if (!dn && (Math.sin(ph * 2) > .3 || mv) && jaw < .05 && rear < .2) { var tg = Hd(18.4, .6), tg2 = Hd(23, .2 + Math.sin(ph * 4)), tg3 = Hd(25, -1), tg4 = Hd(25, 1.6); ln(c, [tg[0], tg[1], tg2[0], tg2[1], tg3[0], tg3[1]], '#b85a7a', 1); ln(c, [tg2[0], tg2[1], tg4[0], tg4[1]], '#b85a7a', 1); }
  /* raios rubros da magia */
  if (rear > .3) for (i = 0; i < 3; i++) { c.beginPath(); c.arc(st[0], st[1], 8 + i * 6 + rear * 3, 0, TAU); c.strokeStyle = 'rgba(255,90,120,' + (rear * (.7 - i * .2)) + ')'; c.lineWidth = 1.4; c.stroke(); }
  /* tonta: estrelinhas */
  if (dn) for (i = 0; i < 3; i++) { var a3 = ph + i * 2.094; star(c, e[0] + Math.cos(a3) * 9, e[1] - 10 + Math.sin(a3) * 3, 2.2, '#ffd0e4'); }
  /* poeira do bote */
  if (lunge > .5) for (i = 0; i < 3; i++) dot(c, -6 - i * 5, -1 - i % 2, 1.6, 'rgba(180,170,200,' + (lunge - .5) + ')');
}
/* forma de moça: de pé, véu, a pedra na testa; o rabinho aparece sob a saia */
function maiden(c, o) {
  var t = o.t || 0, ph = t * TAU, fl = Math.sin(ph), fl2 = Math.sin(ph + 1.4), i, b = Math.sin(ph) * .6;
  var SK = '#a19eb0', SK2 = '#86839a', DR = '#6f6b88', DR2 = '#58546f', HR = '#2e2b3c', HR2 = '#4c4864', VE = 'rgba(214,208,236,.42)';
  /* rabo saindo da barra do vestido, atrás */
  var TP = bz(-6, -6, -14, -4, -20, -1 + fl, -27, -3 + fl * 2, 10, 3, .6);
  cel(c, tube(TP), '#8f93a6', { k: 1, lw: 1.8, sh: SHD, hi: HIL });
  /* véu de trás, longo */
  cel(c, function (c) { c.moveTo(-1, -66 + b); c.bezierCurveTo(-12, -62 + b, -16 + fl, -40, -19 + fl * 2, -18); c.lineTo(-14 + fl2, -20); c.lineTo(-12 + fl * 1.5, -14); c.bezierCurveTo(-8, -32, -6, -48, 2, -58 + b); c.closePath(); }, 'rgba(190,184,214,.55)', { k: 1.4, lw: 1.6, out: 'rgba(40,30,70,.75)', sh: 'rgba(40,24,90,.25)', hi: 'rgba(255,255,255,.3)' });
  /* cabelo comprido */
  cel(c, function (c) { c.moveTo(-2, -62 + b); c.bezierCurveTo(-9, -58 + b, -10, -44, -9 + fl * .6, -34); c.lineTo(-5, -36); c.bezierCurveTo(-4, -46, -2, -54, 2, -56 + b); c.closePath(); }, HR, { k: 1, lw: 1.8, sh: 'rgba(8,6,20,.4)', hi: 'rgba(150,140,220,.2)' });
  /* vestido de escamas, saia rodada */
  cel(c, function (c) { c.moveTo(-4.6, -48 + b); c.quadraticCurveTo(0, -50 + b, 5, -48 + b); c.quadraticCurveTo(6, -40, 4, -34); c.bezierCurveTo(9, -22, 12 + fl, -10, 14 + fl * 1.5, 0); c.quadraticCurveTo(7, 1.6, 1, .6); c.quadraticCurveTo(-6, 1.6, -12 + fl * .8, 0); c.bezierCurveTo(-10, -12, -7, -24, -5, -34); c.quadraticCurveTo(-6.4, -42, -4.6, -48 + b); c.closePath(); }, DR, { k: 2, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    c.strokeStyle = 'rgba(40,36,70,.35)'; c.lineWidth = .8; for (var y = -44; y < 0; y += 3.2) for (var x = -12 + ((y / 3.2) % 2) * 1.6; x < 14; x += 3.4) { c.beginPath(); c.arc(x, y, 1.6, .3, PI - .3); c.stroke(); }
    c.fillStyle = 'rgba(30,26,50,.3)'; c.beginPath(); c.moveTo(2, -30); c.quadraticCurveTo(6, -14, 6 + fl, 0); c.lineTo(12 + fl, 0); c.quadraticCurveTo(9, -16, 4, -32); c.closePath(); c.fill();
    c.fillStyle = 'rgba(180,170,220,.3)'; c.fillRect(-6, -35, 11, 1.6);
  } });
  /* cinto com contas */
  for (i = 0; i < 5; i++) dot(c, -4 + i * 2.1, -34.4 + Math.abs(i - 2) * .2, .8, '#c9c4d8');
  /* braço de trás erguido, mão aberta */
  var S2 = [3.4, -46 + b], H2 = [13 + fl * .4, -52 + b];
  limb(c, S2[0], S2[1], H2[0], H2[1], 8, 8, 1, 1.9, 1.6, SK2, SK2, AO);
  cel(c, function (c) { el(c, H2[0] + .6, H2[1], 1.8, 1.6); }, SK2, { k: .4, lw: 1.4 });
  /* pescoço e cabeça */
  cel(c, function (c) { cap(c, .6, -48 + b, 1.2, -53 + b, 1.8); }, SK2, AO);
  var HX = 2.4, HY = -58 + b;
  cel(c, function (c) { el(c, HX, HY, 5, 5.6); }, SK, { k: 1.4, lw: 1.9, sh: SHD, hi: HIL, inn: function (c) { dot(c, HX + 3.4, HY + 2, 1.3, 'rgba(200,120,150,.25)'); } });
  cel(c, function (c) { c.moveTo(HX - 5.2, HY - .6); c.quadraticCurveTo(HX - 5, HY - 6.6, HX + .6, HY - 6.4); c.quadraticCurveTo(HX + 5.4, HY - 6.2, HX + 5.6, HY - 2.6); c.quadraticCurveTo(HX + 1.6, HY - 4.4, HX - 1.4, HY - 3.4); c.quadraticCurveTo(HX - 3, HY + 1, HX - 2.6, HY + 4); c.closePath(); }, HR, { k: .8, lw: 1.6, sh: 'rgba(8,6,20,.4)', hi: 'rgba(150,140,220,.2)' });
  ghostEye(c, HX + 2.6, HY - .6, 1, 1.2); ln(c, [HX + 1.4, HY - 2.6, HX + 4, HY - 2.4], OUT, .9);
  c.beginPath(); c.moveTo(HX + 2, HY + 2.8); c.quadraticCurveTo(HX + 3.2, HY + 3.4, HX + 4.2, HY + 2.6); c.strokeStyle = '#4a4458'; c.lineWidth = .9; c.stroke();
  /* diadema com a pedra */
  rope(c, function (c) { c.moveTo(HX - 4.6, HY - 4.4); c.quadraticCurveTo(HX, HY - 7, HX + 4.8, HY - 4.6); }, '#b4b0c2', .9);
  ruby(c, HX + 2.2, HY - 6.4, 1.7, .5 + Math.sin(ph) * .25);
  /* véu da frente, transparente, por cima da cabeça */
  c.beginPath(); c.moveTo(HX - 6, HY - 3); c.quadraticCurveTo(HX - 2, HY - 10, HX + 4, HY - 7.6); c.quadraticCurveTo(HX - 1, HY - 3, HX - 3, HY + 6); c.bezierCurveTo(HX - 4, HY + 14, HX - 2 + fl, HY + 20, HX - 1 + fl * 1.6, HY + 26); c.lineTo(HX - 6 + fl, HY + 24); c.bezierCurveTo(HX - 8, HY + 14, HX - 8, HY + 4, HX - 6, HY - 3); c.closePath(); c.fillStyle = VE; c.fill(); c.strokeStyle = 'rgba(40,30,70,.6)'; c.lineWidth = 1.1; c.stroke();
  /* braço da frente: mão no peito */
  var S1 = [-2.6, -46 + b], H1 = [3, -40 + b];
  limb(c, S1[0], S1[1], H1[0], H1[1], 7, 7, -1, 2, 1.7, SK, SK, AO);
  cel(c, function (c) { el(c, H1[0] + .6, H1[1], 1.9, 1.6); }, SK, { k: .4, lw: 1.4 });
  /* brilho */
  for (i = 0; i < 3; i++) { var u = (t + i / 3) % 1; spark(c, 10 + Math.sin(i * 2 + u * 5) * 4, -54 - u * 12, 1.6 * (1 - u) + .3, 'rgba(255,140,160,' + (1 - u) + ')'); }
}
export function drawTeiniagua(c, anim, k) {
  if (anim === 'special') return maiden(c, { t: k });
  if (anim === 'move') return lizard(c, { walk: k * TAU, t: k });
  if (anim === 'atk') return lizard(c, { atk: k, t: 0 });
  if (anim === 'cast') return lizard(c, { cast: .2 + k * .8, t: k * .3 });
  if (anim === 'down') return lizard(c, { down: true, t: k });
  return lizard(c, { t: k });
}

/* ======================= Lobisomem ======================= */
/* paletas: o homem e o lobo usam o mesmo poncho e a mesma guaiaca */
function palette(free) {
  return free ? {
    FUR: '#8197b6', FUR2: '#647a9c', FUR3: '#4a5c7e', FURL: '#c3d0e2', NOSE: '#2a2838', MOUTH: '#5a1a2a',
    PON: '#9b2f2a', PON2: '#7a2420', PST: ['#f2c14e', '#2a2236', '#f2c14e'], BELT: '#6b4226', COIN: '#e8e2cc', PANT: '#3e3a52', free: true,
  } : {
    FUR: '#87849a', FUR2: '#6c6980', FUR3: '#514e64', FURL: '#b4b1c4', NOSE: '#26232f', MOUTH: '#3a1626',
    PON: '#4f4b5f', PON2: '#3c394b', PST: [SH, '#2a2836', '#9f8cc4'], BELT: '#4a4558', COIN: '#c9c6d4', PANT: '#5d5a6e', free: false,
    SKIN: '#9c98a8', SKIN2: '#817d90', HAIR: '#3a3646', HAT: '#3a3748', BOOT: '#38343f', SHIRT: '#a9a6b6',
  };
}
/* poncho: capa de lã presa no pescoço, listras na barra e franja. Desenhado no espaço do tronco (`T`). */
function poncho(c, T, P, len, torn, sw, wide) {
  wide = wide || 1;
  var pts = [T(-1, -27), T(-9 * wide, -22), T(-14 * wide - sw, -12), T(-15 * wide - sw * 1.4, len)];
  var hem = [], n = 9, i;
  for (i = 0; i <= n; i++) { var u = i / n, x = lp(-15 * wide - sw * 1.4, 14 * wide - sw * .5, u), y = len + (torn ? ((i * 7) % 3) * 2.6 + (i % 2 ? 3.4 : 0) : 0) + Math.sin(u * 5 + sw) * .6; hem.push(T(x, y)); }
  var front = [T(14 * wide - sw * .5, len - 2), T(12 * wide, -14), T(8, -24), T(4, -28)];
  cel(c, function (c) { pathPts(c, pts.concat(hem, front)); }, P.PON, { k: 2, lw: 2.1, sh: SHD, hi: HIL, inn: function (c) {
    for (var j = 0; j < 3; j++) { c.beginPath(); for (var m = 0; m <= 8; m++) { var q = T(lp(-17 * wide, 16 * wide, m / 8), len - 3.4 - j * 2.2); c[m ? 'lineTo' : 'moveTo'](q[0], q[1]); } c.strokeStyle = P.PST[j]; c.lineWidth = 1.2; c.stroke(); }
    /* dobras */
    [[-4, -20, -8, len], [3, -22, 4, len], [9, -18, 10, len - 2]].forEach(function (q) { var a = T(q[0], q[1]), b2 = T(q[2], q[3]); ln(c, [a[0], a[1], b2[0], b2[1]], 'rgba(20,16,36,.35)', 1.1); });
    if (torn) [[-6, len - 6], [7, len - 8]].forEach(function (q) { var a = T(q[0], q[1]); c.fillStyle = 'rgba(16,12,28,.55)'; c.beginPath(); c.ellipse(a[0], a[1], 1.6, 2.6, .4, 0, TAU); c.fill(); });
  } });
  /* franja */
  for (i = 0; i < hem.length; i++) { var q = hem[i], d = T(0, 1); ln(c, [q[0], q[1], q[0] + (d[0] - T(0, 0)[0]) * 3 - sw * .2, q[1] + 3], P.PON2, 1.2); }
}
/* guaiaca: cinto largo com moedas */
function belt(c, a, b, P) {
  rope(c, function (c) { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }, P.BELT, 3);
  for (var i = 0; i < 4; i++) { var u = (i + .5) / 4; dot(c, lp(a[0], b[0], u), lp(a[1], b[1], u), 1.1, P.COIN); }
  cel(c, function (c) { el(c, lp(a[0], b[0], .62), lp(a[1], b[1], .62), 2, 1.6); }, P.COIN, { k: .4, lw: 1.1 });
}

/* ---------- o homem ---------- */
/* pose: hip [x,y], ta (inclinação do tronco), ha (cabeça), feet [far, near], hands [far, near], knife (ângulo), fur 0..1, arch 0..1, hat (0 = na cabeça, 1 = caindo) */
function drawMan(c, q, t) {
  var P = palette(false), fur = q.fur || 0, i;
  var H = q.hip, T = frame(H[0], H[1], q.ta), sw = Math.sin(t * TAU) * .8;
  var SK = fur > .5 ? '#8e8a9e' : P.SKIN, FC = P.FUR2;
  function leg(F, near) {
    var col = near ? P.PANT : '#4c495c', kn = ik(H[0], H[1], F[0], F[1] - 4, 14, 13.4, -1);
    /* bombacha larga */
    cel(c, function (c) { c.moveTo(H[0] - 4.6, H[1] - 1); c.quadraticCurveTo(kn[0] - 5.4, kn[1] - 2, kn[0] - 3.4, kn[1] + 3); c.quadraticCurveTo((kn[0] + F[0]) / 2 - 4.6, (kn[1] + F[1]) / 2, F[0] - 3.4, F[1] - 8); c.lineTo(F[0] + 3.4, F[1] - 8); c.quadraticCurveTo((kn[0] + F[0]) / 2 + 4, (kn[1] + F[1]) / 2, kn[0] + 4, kn[1] + 1); c.quadraticCurveTo(kn[0] + 5, kn[1] - 4, H[0] + 4.6, H[1] - 1); c.closePath(); }, col, { k: 1.4, lw: 2, sh: SHD, hi: HIL, inn: function (c) { ln(c, [kn[0] - 2, kn[1] + 2, F[0] - 1, F[1] - 9], 'rgba(20,16,36,.35)', .9); ln(c, [H[0], H[1] + 2, kn[0] + 1, kn[1]], 'rgba(20,16,36,.3)', .9); } });
    /* bota */
    cel(c, function (c) { c.moveTo(F[0] - 3.4, F[1] - 9); c.lineTo(F[0] + 3, F[1] - 9); c.lineTo(F[0] + 3.4, F[1] - 3); c.quadraticCurveTo(F[0] + 8, F[1] - 3.4, F[0] + 8.4, F[1]); c.lineTo(F[0] - 3.6, F[1]); c.closePath(); }, near ? P.BOOT : '#2c2934', { k: .8, lw: 1.8 });
    if (near) dot(c, F[0] - 2.8, F[1] - 3, 1, '#c9c6d4');
  }
  function arm(S, Hn, near, knife) {
    var kk = ik(S[0], S[1], Hn[0], Hn[1], 11, 10.4, near ? 1 : 1);
    var col = near ? P.SHIRT : '#8c899c';
    cel(c, function (c) { cap(c, S[0], S[1], kk[0], kk[1], 2.8); }, col, AO);
    cel(c, function (c) { cap(c, kk[0], kk[1], Hn[0], Hn[1], 2.4); }, col, { k: 1, lw: 2, sh: SHD, hi: HIL, inn: function (c) { if (fur > .2) for (var j = 0; j < 5; j++) { var u = j / 5; ln(c, [lp(kk[0], Hn[0], u), lp(kk[1], Hn[1], u) - 2, lp(kk[0], Hn[0], u) - 2, lp(kk[1], Hn[1], u) - 3.6], FC, .9); } } });
    if (fur > .2) { /* pelo rompendo a manga */ for (var j = 0; j < 4; j++) { var u = .2 + j * .2, x = lp(kk[0], Hn[0], u), y = lp(kk[1], Hn[1], u); cel(c, function (c) { poly(c, [x - 1.6, y - 1.6, x - 2.8 - fur * 2, y - 3.4 - fur * 2.4, x + .8, y - 2]); }, FC, { k: 0, lw: 1.1 }); } }
    if (knife) {
      c.save(); c.translate(Hn[0], Hn[1]); c.rotate(knife);
      cel(c, function (c) { cap(c, -2.6, 0, 2, 0, 1.2); }, '#4a3a34', { k: .4, lw: 1.3 });
      cel(c, function (c) { c.moveTo(2, -1.4); c.lineTo(12, -1); c.quadraticCurveTo(14, -.4, 13.4, .4); c.lineTo(2, 1.4); c.closePath(); }, '#c3c4d0', { k: .6, lw: 1.3, sh: 'rgba(30,20,60,.4)', hi: 'rgba(255,255,255,.55)', inn: function (c) { ln(c, [3, -.3, 12, -.4], 'rgba(255,255,255,.6)', .6); } });
      c.restore();
    }
    var fing = fur > .5;
    cel(c, function (c) { el(c, Hn[0], Hn[1], 2.4 + fur * .6, 2.2 + fur * .4); }, fur > .5 ? FC : P.SKIN2, { k: .6, lw: 1.5 });
    if (fing) for (var m = 0; m < 3; m++) claw(c, Hn[0] + 1.6, Hn[1] - 1 + m * 1.2, .5 + m * .25, 2 + fur * 2.4);
  }
  /* braço de trás, perna de trás */
  arm(T(1, -22), q.hands[0], false, 0);
  leg(q.feet[0], false);
  /* tronco: camisa por baixo */
  cel(c, function (c) { pathPts(c, [T(-5, 1), T(-6.6, -10), T(-4, -22 - q.arch * 2), T(3, -25), T(7, -20), T(6, -8), T(5, 1)]); }, P.SHIRT, AO);
  leg(q.feet[1], true);
  belt(c, T(-6.6, -3), T(6.6, -1.6), P);
  /* poncho cinza com listras roxas (o resto de cor) */
  c.save(); poncho(c, T, P, q.plen || -6, fur > .6, sw + (q.flap || 0), 1 + q.arch * .12); c.restore();
  /* costas arqueando: espinha de pelos rasgando o poncho */
  if (fur > .15) for (i = 0; i < 6; i++) { var b0 = T(-9 - q.arch * 2 + i * .6, -22 + i * 3.2), sz = fur * (3 + (i % 2) * 1.6); cel(c, function (c) { poly(c, [b0[0], b0[1] - 1.4, b0[0] - sz * 1.2, b0[1] - sz * .6, b0[0] + .4, b0[1] + 1.6]); }, FC, { k: 0, lw: 1.2 }); }
  /* lenço no pescoço */
  var nk = T(3, -26);
  cel(c, function (c) { el(c, nk[0], nk[1], 4.2, 2.2, q.ta); }, '#5e5874', { k: .6, lw: 1.5 });
  cel(c, function (c) { poly(c, [nk[0] + 1, nk[1] + 1, nk[0] + 4.6, nk[1] + 6, nk[0] + 1.4, nk[1] + 5.4]); }, '#5e5874', { k: .4, lw: 1.3 });
  /* cabeça */
  var HD = frame(nk[0] + Math.cos(q.ta - PI / 2) * 6.4 + 1.2, nk[1] + Math.sin(q.ta - PI / 2) * 6.4, q.ha);
  var sn = fur * 3.4; /* focinho crescendo */
  cel(c, function (c) { pathPts(c, [HD(-5.4, -2), HD(-3, -6.6), HD(3, -7.2), HD(6, -4), HD(7 + sn, -1), HD(8.4 + sn, 1.4), HD(6 + sn * .7, 3.4), HD(4, 6.4), HD(-.6, 6.6), HD(-4.6, 3)]); }, SK, { k: 1.6, lw: 2, sh: SHD, hi: HIL, inn: function (c) {
    for (var j = 0; j < 9; j++) { var p = HD(-.6 + (j % 3) * 1.8 + (j / 3 | 0) * .6, 3.4 + (j / 3 | 0) * 1.1); dot(c, p[0], p[1], .45, 'rgba(40,36,56,.55)'); }
    var cb = HD(2.6, -1.8), cb2 = HD(3.4, 2.6); ln(c, [cb[0], cb[1], cb2[0], cb2[1]], 'rgba(40,36,56,.35)', 1);
    if (fur > .2) for (j = 0; j < 6; j++) { var p2 = HD(-4.6 + j * .4, -3 + j * 1.6); ln(c, [p2[0], p2[1], p2[0] - 2 * fur, p2[1] + .6], FC, 1); }
  } });
  /* nariz comprido */
  var ns = HD(7.6 + sn, .4); dot(c, ns[0], ns[1], .8, '#2a2632');
  /* boca: rosnado com caninos no meio da transformação */
  var m1 = HD(3.6, 4.4), m2 = HD(6.6 + sn * .7, 3.2);
  if (fur > .3) { ln(c, [m1[0], m1[1], m2[0], m2[1]], '#2a1420', 1.4); tooth(c, lp(m1[0], m2[0], .6), lp(m1[1], m2[1], .6), .7, 1.6 * fur); tooth(c, lp(m1[0], m2[0], .25), lp(m1[1], m2[1], .25), .6, 1.2 * fur); }
  else ln(c, [m1[0], m1[1], m2[0], m2[1]], '#3a3044', 1);
  /* cabelo comprido e ensebado */
  cel(c, function (c) { pathPts(c, [HD(-5.8, 1.6), HD(-6, -3.4), HD(-3.4, -7.4), HD(3, -8), HD(5.4, -5.4), HD(1, -5.4), HD(-1.4, -3.6), HD(-2.6, 2), HD(-4, 6 + Math.sin(t * TAU) * .4), HD(-6.6, 5.4)]); }, P.HAIR, { k: .8, lw: 1.8, sh: 'rgba(8,6,20,.4)', hi: 'rgba(150,150,210,.2)' });
  /* orelha: vira ponta de lobo */
  var o1 = HD(-2.4, -1), o2 = HD(-3.4 - fur * 1.4, -4 - fur * 5), o3 = HD(-.4, -2.4);
  cel(c, function (c) { poly(c, [o1[0], o1[1], o2[0], o2[1], o3[0], o3[1]]); }, fur > .4 ? FC : P.SKIN2, { k: .3, lw: 1.3 });
  /* olho */
  var ey = HD(3.4, -2.2); ghostEye(c, ey[0], ey[1], 1.2 + fur * .5, 1 + fur * .4, q.ha);
  var bw = HD(1.6, -4.2), bw2 = HD(5.2, -3.4); ln(c, [bw[0], bw[1], bw2[0], bw2[1]], OUT, 1.3);
  /* chapéu de aba larga com barbicacho */
  if (q.hat < 1) {
    var hp = HD(.6, -7.6), ha = q.ha + q.hat * -1.4;
    c.save(); c.translate(hp[0] - q.hat * 8, hp[1] - q.hat * 14); c.rotate(ha);
    cel(c, function (c) { c.moveTo(-11, 1); c.quadraticCurveTo(0, -1.6, 12, .6); c.quadraticCurveTo(12.6, 2.4, 10, 2.4); c.quadraticCurveTo(0, .8, -10, 3); c.closePath(); }, P.HAT, { k: .8, lw: 1.7, sh: SHD, hi: HIL });
    cel(c, function (c) { poly(c, [-5.4, .6, -4.6, -6, 5, -6.2, 5.6, .4]); }, P.HAT, { k: 1, lw: 1.7, sh: SHD, hi: HIL, inn: function (c) { c.fillStyle = '#5a5470'; c.fillRect(-6, -1.8, 12, 1.6); } });
    c.restore();
    if (q.hat < .2) { var s1 = HD(-3.6, -6), s2 = HD(1, 6.8); c.beginPath(); c.moveTo(s1[0], s1[1]); c.quadraticCurveTo(s2[0] - 2, s2[1], s2[0], s2[1]); c.strokeStyle = 'rgba(30,26,40,.8)'; c.lineWidth = .8; c.stroke(); }
  }
  /* braço da frente com a faca */
  arm(T(5, -21), q.hands[1], true, q.knife);
}
export function drawLobisomemH(c, anim, k) {
  var t = k, ph = k * TAU, br = Math.sin(ph) * .6, q;
  if (anim === 'move') {
    var w = ph, s = Math.sin(w), b = Math.abs(Math.cos(w)) * 1.4;
    q = { hip: [0, -27.4 + b * .5], ta: .42, ha: -.32, feet: [[-1 - s * 7, -Math.max(0, Math.cos(w)) * 3], [1 + s * 7, -Math.max(0, -Math.cos(w)) * 3]], hands: [[2 - s * 4, -25 + b], [9 + s * 3, -24 + b]], knife: .9 + s * .1, hat: 0, arch: 0 };
  } else if (anim === 'atk') {
    var wd = win(k, 0, .55), th = win(k, .6, 1);
    q = { hip: [-1 - wd * 2 + th * 4, -27.4 + wd * .6 - th * .4], ta: .42 - wd * .12 + th * .3, ha: -.32 - th * .1, feet: [[-7 - th * 2, 0], [5 + th * 6, 0]], hands: [[-2, -26], [lp(lp(10, -3, wd), 24, th), lp(lp(-24, -34, wd), -36, th)]], knife: lp(lp(.9, -1.6, wd), -.15, th), hat: 0, arch: 0, flap: th * 2 };
  } else if (anim === 'cast') {
    var a = sm(k), sh = Math.sin(k * 37) * .6 * a;
    q = { hip: [sh, -27.4 + a * 1.4], ta: lp(.42, -.34, a), ha: lp(-.32, -.9, a), feet: [[-6 - a * 2, 0], [6 + a * 2, 0]], hands: [[lp(2, -9, a), lp(-25, -30, a)], [lp(10, 15, a), lp(-24, -40, a)]], knife: 0, hat: win(k, .3, 1) * .9, arch: a, fur: a, flap: a * 3, plen: -6 + a * 2 };
  } else if (anim === 'special') {
    var tr = Math.sin(ph * 3) * .8;
    q = { hip: [tr * .5, -26], ta: .1 + Math.sin(ph) * .05, ha: -.7 + Math.sin(ph * 2) * .06, feet: [[-7, 0], [7, 0]], hands: [[-4, -32 + tr], [13, -36 - tr]], knife: 0, hat: 1, arch: .6, fur: .65 + Math.sin(ph) * .08, flap: tr * 2 };
  } else if (anim === 'down') {
    /* de joelhos, sem fôlego */
    q = { hip: [-2, -14 + br * .5], ta: .85 + br * .05, ha: .25 + br * .06, feet: [[-14, 0], [7, 0]], hands: [[14, -2], [18, -1]], knife: 1.4, hat: 0, arch: 0 };
  } else {
    q = { hip: [0, -27.4 + br * .3], ta: .44 + br * .03, ha: -.3 + br * .04, feet: [[-5.6, 0], [5, 0]], hands: [[1, -25 + br], [9.4, -23.6 + br * .6]], knife: 1 + br * .05, hat: 0, arch: 0 };
  }
  drawMan(c, q, t);
  if (anim === 'down') for (var i = 0; i < 3; i++) { var a3 = ph + i * 2.094; star(c, 24 + Math.cos(a3) * 8, -40 + Math.sin(a3) * 2.6, 2.2, '#ffd0e4'); }
  if (anim === 'atk' && k > .8) for (i = 0; i < 3; i++) { c.beginPath(); c.arc(16, -38, 14 + i * 3, -.9, .2); c.strokeStyle = 'rgba(226,208,255,' + (.7 - i * .2) + ')'; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke(); }
}

/* ---------- o lobo ---------- */
/* pose: hip, ta, ha (cabeça), jaw, feet [far, near] (ponta do pé), hands [far, near], tail, lift */
function drawWolf(c, q, t, free) {
  var P = palette(free), ph = t * TAU, i;
  var H = q.hip, T = frame(H[0], H[1], q.ta), FUR = P.FUR, FUR2 = P.FUR2, FUR3 = P.FUR3;
  var O = { k: 1.6, lw: 2.2, sh: free ? 'rgba(10,20,60,.35)' : SHD, hi: free ? 'rgba(230,240,255,.3)' : HIL };
  /* tufos de pelo na borda */
  function tufts(A, B2, n, len, col, side) { var dx = B2[0] - A[0], dy = B2[1] - A[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * side, ny = dx / d * side; for (var j = 0; j < n; j++) { var u = (j + .5) / n, x = A[0] + dx * u, y = A[1] + dy * u; cel(c, function (c) { poly(c, [x - dx / d * 2.4, y - dy / d * 2.4, x + nx * len - dx / d * 1.6, y + ny * len - dy / d * 1.6, x + dx / d * 2.2, y + dy / d * 2.2]); }, col, { k: 0, lw: 1.4 }); } }
  /* perna digitígrada: quadril → joelho → jarrete → pé */
  function leg(F, near) {
    var col = near ? FUR : FUR3, hk = [F[0] - 9, F[1] - 11 + (F[1] < -2 ? 3 : 0)], hp = T(near ? 1 : -1, 0);
    var kn = ik(hp[0], hp[1], hk[0], hk[1], 15, 14, -1);
    cel(c, function (c) { cap(c, hp[0], hp[1], kn[0], kn[1], 7); }, col, O);
    cel(c, function (c) { cap(c, kn[0], kn[1], hk[0], hk[1], 4); }, col, O);
    cel(c, function (c) { cap(c, hk[0], hk[1], F[0], F[1] - 2.4, 3); }, col, O);
    cel(c, function (c) { el(c, F[0] + 2, F[1] - 2.2, 5, 2.6); }, near ? FUR2 : FUR3, { k: .6, lw: 1.8 });
    for (var j = 0; j < 3; j++) claw(c, F[0] + 5.6, F[1] - 3 + j * 1.2, .3 + j * .2, 2.6, free ? '#e9e4d8' : '#d4cfdc');
    /* farrapo da bombacha na coxa */
    var a = Math.atan2(kn[1] - hp[1], kn[0] - hp[0]), nx = -Math.sin(a), ny = Math.cos(a), mx = lp(hp[0], kn[0], .62), my = lp(hp[1], kn[1], .62);
    cel(c, function (c) { c.moveTo(hp[0] + nx * 8, hp[1] + ny * 8); c.lineTo(mx + nx * 7.6, my + ny * 7.6); c.lineTo(mx + Math.cos(a) * 3, my + Math.sin(a) * 3); c.lineTo(mx - nx * 3 + Math.cos(a) * 1, my - ny * 3); c.lineTo(mx - nx * 7.6 + Math.cos(a) * 4, my - ny * 7.6 + Math.sin(a) * 4); c.lineTo(hp[0] - nx * 8, hp[1] - ny * 8); c.closePath(); }, near ? P.PANT : '#3e3b4c', { k: 1, lw: 1.8, sh: SHD, hi: HIL });
  }
  function arm(S, Hn, near, swipe) {
    var col = near ? FUR : FUR3, kk = ik(S[0], S[1], Hn[0], Hn[1], 14.5, 14.5, 1);
    cel(c, function (c) { cap(c, S[0], S[1], kk[0], kk[1], 5.4); }, col, O);
    cel(c, function (c) { cap(c, kk[0], kk[1], Hn[0], Hn[1], 4.4); }, col, O);
    var a = Math.atan2(Hn[1] - kk[1], Hn[0] - kk[0]);
    cel(c, function (c) { el(c, Hn[0] + Math.cos(a) * 2, Hn[1] + Math.sin(a) * 2, 5, 4.2, a); }, near ? FUR2 : FUR3, { k: .8, lw: 1.9 });
    for (var j = 0; j < 4; j++) claw(c, Hn[0] + Math.cos(a) * 5.4 + Math.cos(a + PI / 2) * (j - 1.5) * 1.8, Hn[1] + Math.sin(a) * 5.4 + Math.sin(a + PI / 2) * (j - 1.5) * 1.8, a + .5, 4.4 + (swipe || 0) * 1.4, free ? '#f4efe2' : '#dcd7e4');
  }
  var SHf = T(-2, -31), SHn = T(4, -30);
  arm(SHf, q.hands[0], false);
  leg(q.feet[0], false);
  /* rabo peludo */
  var tb = T(-7, 1), ta = q.tail || 0, TP = bz(tb[0], tb[1], tb[0] - 10, tb[1] + 2, tb[0] - 18 - Math.cos(ta) * 4, tb[1] + 10 + ta * 4, tb[0] - 26 + Math.sin(ta) * 3, tb[1] + 18 + ta * 8, 10, 4, 6);
  cel(c, tube(TP), FUR2, { k: 1.6, lw: 2.1, sh: O.sh, hi: O.hi, inn: function (c) { var e = TP[TP.length - 1]; c.fillStyle = free ? '#dfe8f4' : '#a6a3b4'; c.beginPath(); c.arc(e[0], e[1], 5, 0, TAU); c.fill(); } });
  tufts([TP[3][0], TP[3][1]], [TP[9][0], TP[9][1]], 4, 3, FUR2, -1);
  /* tronco: peito largo, corcunda */
  var torso = function (c) { pathPts(c, [T(-10, 3), T(-13, -10), T(-12, -24), T(-6, -36), T(4, -39), T(13, -33), T(16, -22), T(12, -10), T(8, 3)]); };
  cel(c, torso, FUR, { k: 2.6, lw: 2.4, sh: O.sh, hi: O.hi, inn: function (c) {
    var p = T(6, -18); c.fillStyle = P.FURL; c.beginPath(); c.ellipse(p[0], p[1], 5.6, 10, q.ta, 0, TAU); c.fill();
    for (var j = 0; j < 5; j++) { var a = T(3 + (j % 2) * 4, -26 + j * 4), b2 = T(5 + (j % 2) * 4, -24 + j * 4); ln(c, [a[0], a[1], b2[0], b2[1]], 'rgba(30,26,50,.35)', 1); }
    for (j = 0; j < 4; j++) { var r1 = T(4 + j * 1.2, -13 + j * 3), r2 = T(9, -12 + j * 3); ln(c, [r1[0], r1[1], r2[0], r2[1]], 'rgba(30,26,50,.3)', .9); }
  } });
  tufts(T(-9, -24), T(-10, -6), 4, 3.4, FUR, -1);
  leg(q.feet[1], true);
  belt(c, T(-9.4, -1), T(9, 0), P);
  /* poncho rasgado nos ombros */
  poncho(c, T, P, -9, true, Math.sin(ph) * .8 + (q.flap || 0), 1.3);
  /* juba */
  var NB = T(7, -34);
  for (i = 0; i < 9; i++) { var a = PI * .5 + i * .14 - q.ta * .5, r = 8 + (i % 2) * 3 + (i > 5 ? -2 : 0), x = NB[0] - 1 + Math.cos(a + q.ta) * 5, y = NB[1] + 1 + Math.sin(a + q.ta) * 5; (function (x, y, a, r) { cel(c, function (c) { poly(c, [x - 3, y + 1, x + Math.cos(a + q.ta) * r, y + Math.sin(a + q.ta) * r, x + 3, y - 1]); }, i % 2 ? FUR : FUR2, { k: .6, lw: 1.6, sh: O.sh, hi: O.hi }); })(x, y, a, r); }
  /* cabeça de lobo */
  var HD = frame(NB[0] + 6 + Math.cos(q.ta) * 2, NB[1] - 3, q.ha), jw = q.jaw || 0;
  var J = function (x, y) { var r = rot(x - 1, y - 3, jw * .75); return HD(1 + r[0], 3 + r[1]); };
  /* orelha de trás */
  var e1 = HD(-6, -6), e2 = HD(-9, -18), e3 = HD(-1, -8);
  cel(c, function (c) { poly(c, [e1[0], e1[1], e2[0], e2[1], e3[0], e3[1]]); }, FUR3, { k: .6, lw: 1.8 });
  /* maxilar de baixo */
  cel(c, function (c) { pathPts(c, [J(-3, 3), J(5, 3.4), J(15, 3.6), J(16, 5.4), J(6, 8), J(-2, 7)]); }, FUR2, { k: .8, lw: 1.9, sh: O.sh, inn: function (c) { if (jw > .1) { var a = J(4, 3.4), b2 = J(15, 3.6); for (var j = 0; j < 4; j++) { var x = lp(a[0], b2[0], j / 4 + .1), y = lp(a[1], b2[1], j / 4 + .1); tooth(c, x, y + .4, .7, -1.6); } } } });
  if (jw > .08) {
    var m1 = HD(2, 2), m2 = HD(17, 2.4), m3 = J(15, 3.6), m4 = J(2, 3.4);
    c.beginPath(); c.moveTo(m1[0], m1[1]); c.lineTo(m2[0], m2[1]); c.lineTo(m3[0], m3[1]); c.lineTo(m4[0], m4[1]); c.closePath(); c.fillStyle = P.MOUTH; c.fill();
    var tg = J(8, 3); c.beginPath(); c.ellipse(tg[0], tg[1] - .6, 4, 1.4, q.ha + jw * .75, 0, TAU); c.fillStyle = free ? '#d86a7a' : '#a8607a'; c.fill();
  }
  /* crânio e focinho */
  cel(c, function (c) { pathPts(c, [HD(-8, 2), HD(-7, -5), HD(-2, -8.6), HD(5, -8), HD(9, -4.6), HD(18, -2.6), HD(20, -.4), HD(19, 2.2), HD(10, 2.6), HD(3, 3.2), HD(-3, 6.4)]); }, FUR, { k: 2, lw: 2.2, sh: O.sh, hi: O.hi, inn: function (c) {
    var p = HD(14, 1.4); c.fillStyle = P.FURL; c.beginPath(); c.ellipse(p[0], p[1], 6, 1.6, q.ha, 0, TAU); c.fill();
    var s1 = HD(8, -4.4), s2 = HD(17, -2.4); ln(c, [s1[0], s1[1], s2[0], s2[1]], 'rgba(30,26,50,.3)', 1);
    var cg = HD(-6, 2); c.fillStyle = P.FURL; c.beginPath(); c.ellipse(cg[0], cg[1], 2.4, 3.4, q.ha, 0, TAU); c.fill();
  } });
  var ns = HD(19.4, -1); q.mouth = HD(20, 2); cel(c, function (c) { el(c, ns[0], ns[1], 2, 1.6, q.ha); }, P.NOSE, { k: .4, lw: 1.2 });
  if (jw <= .08) { var f1 = HD(17, 2.4), f2 = HD(12, 4.2); tooth(c, f1[0] - 1, f1[1], .8, 2.2); tooth(c, f2[0], f2[1] - 1.4, .7, 1.8); }
  /* orelha da frente */
  var o1 = HD(-4, -6.6), o2 = HD(-5.4, -19), o3 = HD(1.6, -7.6);
  cel(c, function (c) { poly(c, [o1[0], o1[1], o2[0], o2[1], o3[0], o3[1]]); }, FUR, { k: .8, lw: 1.9, inn: function (c) { var a = HD(-2, -8), b2 = HD(-3.6, -15), d = HD(.4, -8.6); c.fillStyle = free ? '#c9a4b4' : '#7a6f88'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b2[0], b2[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fill(); } });
  /* olho e sobrancelha */
  var ey = HD(5.4, -4);
  if (free) { glow(c, ey[0], ey[1], 2.2, 1.7, '#ffe27a', '#ffb000', 7, q.ha); dot(c, ey[0] + .4, ey[1], 1, '#2a1a08'); dot(c, ey[0] - .3, ey[1] - .6, .5, '#fff'); }
  else if (q.dazed) { ln(c, [ey[0] - 1.6, ey[1] - 1.2, ey[0] + 1.6, ey[1] + 1.2], '#ff3d8a', 1.3); ln(c, [ey[0] - 1.6, ey[1] + 1.2, ey[0] + 1.6, ey[1] - 1.2], '#ff3d8a', 1.3); }
  else ghostEye(c, ey[0], ey[1], 2.2, 1.6, q.ha + .15);
  var b1 = HD(2, -6.6), b2 = HD(8.4, -5); ln(c, [b1[0], b1[1], b2[0], b2[1]], OUT, free ? 1.4 : 2);
  /* braço da frente */
  arm(SHn, q.hands[1], true, q.swipe);
}
export function drawLobisomem(c, anim, k, free) {
  var ph = k * TAU, br = Math.sin(ph), q, i;
  var base = function () { return { hip: [-4, -44 + br * .5], ta: .32 + br * .02, ha: .1 - br * .03, jaw: .1 + br * .05, feet: [[-10, 0], [6, 0]], hands: [[10, -44 + br], [18, -42 + br * .8]], tail: br * .2 }; };
  if (free) { q = { hip: [-3, -46 + br * .3], ta: .08, ha: -.12 + br * .02, jaw: 0, feet: [[-9, 0], [7, 0]], hands: [[0, -46], [10, -44 + br * .3]], tail: br * .25 }; drawWolf(c, q, k, true); return; }
  if (anim === 'move') {
    var s = Math.sin(ph), b = Math.abs(Math.cos(ph)) * 2.4;
    q = { hip: [-3, -44 + b], ta: .48, ha: -.05, jaw: .25, feet: [[-4 - s * 13, -Math.max(0, Math.cos(ph)) * 6], [-4 + s * 13, -Math.max(0, -Math.cos(ph)) * 6]], hands: [[12 + s * 9, -40 + b], [18 - s * 9, -38 + b]], tail: s * .5 };
  } else if (anim === 'atk') {
    var wd = win(k, 0, .55), th = win(k, .6, 1);
    q = base(); q.hip = [-4 - wd * 3 + th * 6, -44 + th * 2]; q.ta = .32 - wd * .2 + th * .45; q.ha = .1 - wd * .2 + th * .1; q.jaw = .2 + wd * .5;
    q.hands = [[lp(10, 4, wd), lp(-44, -46, wd)], [lp(lp(18, -4, wd), 38, th), lp(lp(-42, -90, wd), -34, th)]]; q.swipe = th; q.feet = [[-14, 0], [10 + th * 4, 0]];
  } else if (anim === 'cast') {
    var a = sm(k);
    q = base(); q.ta = lp(.32, -.22, a); q.ha = lp(.1, -1.1, a); q.jaw = lp(.1, 1, a); q.hands = [[lp(10, -8, a), lp(-44, -52, a)], [lp(18, 2, a), lp(-42, -50, a)]]; q.feet = [[-12, 0], [8, 0]]; q.flap = a * 2; q.tail = -a * .4;
  } else if (anim === 'down') {
    /* caído de joelhos, mãos no chão */
    q = { hip: [-8, -24 + br * .6], ta: 1.15 + br * .03, ha: .55 + br * .05, jaw: .55, feet: [[-22, 0], [-6, 0]], hands: [[22, -1], [28, -1]], tail: .9, dazed: true };
  } else if (anim === 'special') {
    /* salto longo: agacha, impulso, voo esticado, queda, pouso */
    var keys = [
      { hip: [-6, -32], ta: .75, ha: .15, jaw: .3, feet: [[-14, 0], [4, 0]], hands: [[12, -14], [18, -12]], tail: .4 },
      { hip: [0, -54], ta: .55, ha: -.1, jaw: .5, feet: [[-22, -6], [-14, 0]], hands: [[24, -58], [30, -54]], tail: -.2 },
      { hip: [2, -70], ta: 1.05, ha: -.35, jaw: .7, feet: [[-28, -52], [-22, -46]], hands: [[38, -72], [42, -66]], tail: -.5 },
      { hip: [4, -72], ta: .95, ha: -.15, jaw: .6, feet: [[-20, -46], [-12, -40]], hands: [[38, -62], [42, -56]], tail: -.2 },
      { hip: [4, -56], ta: .5, ha: 0, jaw: .4, feet: [[0, -16], [10, -14]], hands: [[30, -36], [34, -32]], tail: .3 },
      { hip: [2, -30], ta: .8, ha: .2, jaw: .3, feet: [[-8, 0], [10, 0]], hands: [[22, -2], [28, -1]], tail: .6 },
    ];
    q = keys[Math.round(k * 6) % 6];
  } else q = base();
  drawWolf(c, q, k, false);
  if (anim === 'cast' && k > .3) { var hd = q.mouth; for (i = 0; i < 4; i++) { c.beginPath(); c.arc(hd[0], hd[1], 8 + i * 7, -PI * .8, -PI * .1); c.strokeStyle = 'rgba(226,208,255,' + ((k - .3) * (1 - i * .2)) + ')'; c.lineWidth = 2; c.lineCap = 'round'; c.stroke(); } }
  if (anim === 'atk' && k > .8) for (i = 0; i < 4; i++) { c.beginPath(); c.arc(22, -48, 24 + i * 3.4, -.6, .9); c.strokeStyle = 'rgba(226,208,255,' + (.8 - i * .18) + ')'; c.lineWidth = 1.8; c.lineCap = 'round'; c.stroke(); }
  if (anim === 'down') for (i = 0; i < 3; i++) { var a3 = ph + i * 2.094; star(c, 34 + Math.cos(a3) * 11, -34 + Math.sin(a3) * 3, 2.8, '#ffd0e4'); }
  if (anim === 'special' && (Math.round(k * 6) % 6 === 0 || Math.round(k * 6) % 6 === 5)) for (i = 0; i < 4; i++) dot(c, -14 + i * 9, -2 - (i % 2) * 2, 2.2, 'rgba(170,160,190,.6)');
}
