// @ts-nocheck
/* Capítulo 7, Pantanal da Cuca: monstros comuns e o caldeirão.
   Todos virados para a direita, pés na origem (0,0), y negativo para cima. Assinatura: draw(ctx, anim, k). */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, EYE, EYEG, VEN, VEN2, MAG, MAG2, G1, G2, G3, G4, GL, GLL,
  cl, lp, sm, seg, rope, bz, tube, tooth, drop, bubble, scales, eye, impact } from './ch7_lib';

/* ---------------- ariranha ---------------- */
/* move: galope; atk: empina (aviso) e dá o bote */
export function drawAriranha(c, a, k) {
  var mv = a === 'move', at = a === 'atk' ? k : 0, p = mv ? k * TAU : 0, i,
    rear = sm(seg(at, 0, .62)) * (1 - sm(seg(at, .7, 1))), lunge = sm(seg(at, .7, 1)),
    sp = mv ? Math.sin(p) : 0, B = '#737a76', B2 = '#5b625e', B3 = '#454b48', TH = '#c3c7bd';
  var hy = -6.4 - (mv ? Math.max(0, sp) * 2.2 : 0) - rear * .6, sy = -7.4 - (mv ? Math.max(0, -sp) * 2.4 : 0) - rear * 5.6 + lunge * .8,
    H = [-7 - lunge * 1 + rear * 1.4, hy], S = [5 + (mv ? -sp * 1.2 : 0) - rear * 1 + lunge * 6, sy],
    hx = S[0] + 7.6 - rear * 3 + lunge * 3.4, hdy = S[1] - 2.6 - rear * 6 + lunge * 1.6, ha = .12 - rear * .75 + lunge * .1,
    mo = rear * .34 + lunge * .62, arch = mv ? Math.cos(p) * 1.6 : rear * 1.2;
  var wag = mv ? Math.sin(p + 1) * 2 : Math.sin(at * 6) * .6;
  function leg(jx, jy, fx, fy, far) {
    var col = far ? B3 : B2;
    cel(c, function (c) { cap(c, jx, jy, fx, fy - 1.2, 2.3); }, col, { k: .8, lw: 1.7 });
    cel(c, function (c) { el(c, fx + 1.4, fy - 1, 2.8, 1.5); }, col, { k: .5, lw: 1.5 });
    [0, 1.3, 2.6].forEach(function (d) { dot(c, fx + 2.6 + d * .5, fy - .3 + d * .1, .45, '#e2ded2'); });
  }
  /* pernas (fase de galope: as de trás juntas, as da frente juntas) */
  function legs(far) {
    var o = far ? .55 : 0, bs = mv ? Math.sin(p + o) : 0, fs = mv ? Math.sin(p + PI + o) : 0, d = far ? 1.6 : 0;
    var bfx = H[0] + 1 + bs * 4.2 + d - rear * 1, bfy = -(mv ? Math.max(0, Math.cos(p + o)) * 2 : 0);
    var ffx = S[0] + 1 + fs * 4.6 + d, ffy = -(mv ? Math.max(0, Math.cos(p + PI + o)) * 2.2 : 0);
    if (rear > 0 || lunge > 0) { ffx = lp(ffx, S[0] + 4 + d, rear); ffy = lp(ffy, S[1] + 6.4, rear); ffx = lp(ffx, S[0] + 7 + d, lunge); ffy = lp(ffy, -1, lunge); }
    leg(H[0] + d * .5, H[1] + 2, bfx, bfy, far); leg(S[0] + d * .5, S[1] + 2.2, ffx, ffy, far);
  }
  legs(true);
  /* rabo grosso e chato */
  var T = bz(H[0] + 1, H[1] + .4, H[0] - 5, H[1] + .6, H[0] - 10, H[1] + 2 + wag * .5, H[0] - 15.5, H[1] + 4 + wag, 8, 3.8, .9);
  cel(c, tube(T), B2, { k: 1.2, lw: 1.9, inn: function (c) { ln(c, [T[1][0], T[1][1] - 1.6, T[6][0], T[6][1] - .8], 'rgba(255,255,255,.14)', 1); } });
  /* corpo comprido */
  var P = bz(H[0], H[1], H[0] + 4, H[1] - 2.6 - arch, S[0] - 4, S[1] - 2.4 - arch * .6, S[0] + 2.4, S[1] - .8, 8, 4.9, 4.5);
  cel(c, tube(P), B, { k: 2, lw: 2.1, inn: function (c) {
    c.fillStyle = 'rgba(30,34,32,.28)'; for (i = 1; i < 8; i++) { c.beginPath(); c.ellipse(P[i][0], P[i][1] - 3.6, 2.6, 1.3, 0, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(214,218,206,.32)'; for (i = 1; i < 8; i++) { c.beginPath(); c.ellipse(P[i][0], P[i][1] + 3.4, 2.4, 1.1, 0, 0, TAU); c.fill(); }
  } });
  /* pescoço com a mancha clara da garganta */
  var N = bz(S[0], S[1], S[0] + 3, S[1] - .6, hx - 3, hdy + 1, hx - .6, hdy + .6, 5, 4.2, 3.4);
  cel(c, tube(N), B, { k: 1.4, lw: 2, inn: function (c) { c.fillStyle = TH; c.beginPath(); c.ellipse(lp(S[0], hx, .6) + 1, lp(S[1], hdy, .6) + 2.6, 3.6, 2, -.3 - rear * .6, 0, TAU); c.fill(); dot(c, lp(S[0], hx, .3), lp(S[1], hdy, .3) + 3.2, .9, 'rgba(60,64,60,.4)'); } });
  legs(false);
  /* cabeça */
  c.save(); c.translate(hx, hdy); c.rotate(ha);
  if (mo > .05) { c.beginPath(); c.moveTo(1, 1); c.lineTo(8.4, .6); c.lineTo(Math.cos(mo) * 8, 1.4 + Math.sin(mo) * 8); c.closePath(); c.fillStyle = '#5a1035'; c.fill(); }
  c.save(); c.translate(.6, 1.6); c.rotate(mo);
  cel(c, function (c) { c.moveTo(-2, -.4); c.lineTo(7.4, -.2); c.quadraticCurveTo(8, 1.6, 6, 2); c.lineTo(-1.6, 2.4); c.closePath(); }, TH, { k: .5, lw: 1.5 });
  if (mo > .1) { tooth(c, 4, -.2, .6, -1.6); tooth(c, 6.2, -.2, .6, -1.6); }
  c.restore();
  cel(c, function (c) { el(c, -2.2, -3.6, 1.6, 1.6); }, B2, { k: .4, lw: 1.4 });
  cel(c, function (c) { c.moveTo(-4.6, 1.6); c.bezierCurveTo(-5.6, -5, 2, -6, 5, -3.2); c.quadraticCurveTo(8.6, -2.4, 8.8, .2); c.quadraticCurveTo(8.4, 2, 6.4, 1.8); c.lineTo(-1, 2.4); c.quadraticCurveTo(-4, 3.4, -4.6, 1.6); c.closePath(); }, B, { k: 1.4, lw: 1.9, inn: function (c) { c.fillStyle = 'rgba(214,218,206,.3)'; c.beginPath(); c.ellipse(4.6, 1.2, 3.4, 1.2, 0, 0, TAU); c.fill(); } });
  if (mo > .1) { tooth(c, 3.6, 1.6, .6, 1.8); tooth(c, 5.8, 1.5, .6, 1.8); }
  cel(c, function (c) { el(c, 8.4, -.6, 1.3, 1); }, '#2a2628', { k: 0, lw: 1.2 });
  eye(c, 2.6, -2.6, 1.3, 1.1);
  ln(c, [.6, -4.4, 3.8, -3.9], OUT, 1.3);
  [[-.3, .4], [.2, .9]].forEach(function (q) { ln(c, [6.4, .6, 10 + q[0] * 3, .6 + q[1] * 2], 'rgba(230,228,220,.75)', .6); });
  c.restore();
  /* respingo do bote */
  if (lunge > .5) for (i = 0; i < 4; i++) drop(c, S[0] - 2 + i * 3, -1.4 - (i % 2) * 2.4 * lunge, .9, lunge * .9);
}

/* ---------------- socó ---------------- */
/* move: passadas com o pescoço bombeando; atk: pescoço recolhido até esticar e disparar o bico */
export function drawSoco(c, a, k) {
  var mv = a === 'move', at = a === 'atk' ? k : 0, p = mv ? k * TAU : 0, i,
    coil = sm(seg(at, 0, .66)), shoot = sm(seg(at, .7, 1)), b = mv ? Math.abs(Math.cos(p)) * 1.1 : coil * 1.4 * (1 - shoot),
    B = '#7c827e', B2 = '#616864', B3 = '#4a504d', CR = '#3b403e', NK = '#9da39d', LG = '#5a5e52', BL = '#a6a48c';
  function leg(ph, far) {
    var s = mv ? Math.sin(p + ph) : 0, up = mv ? Math.max(0, Math.cos(p + ph)) * 3.4 : 0, hip = [-1.6 + (far ? 1 : 0), -18.5 - b],
      fx = s * 6 + (far ? 1.4 : -.6) - shoot * (far ? 3 : -2) + coil * (far ? -1 : 1), fy = -up, kn = ik(hip[0], hip[1], fx, fy - 1.2, 9.6, 9.6, 1), col = far ? '#45493f' : LG;
    ln(c, [hip[0], hip[1], kn[0], kn[1], fx, fy - 1.2], OUT, 3.4); ln(c, [hip[0], hip[1], kn[0], kn[1], fx, fy - 1.2], col, 1.7);
    [[4.2, .2], [3.2, 1.1], [-2.6, .2]].forEach(function (q) { ln(c, [fx, fy - 1, fx + q[0], fy + q[1] - (up > .5 ? 1 : 0)], OUT, 2.4); ln(c, [fx, fy - 1, fx + q[0], fy + q[1] - (up > .5 ? 1 : 0)], col, 1); });
  }
  leg(PI, true);
  /* cauda e asa de trás */
  cel(c, function (c) { poly(c, [-8, -27 - b, -16, -21 - b, -15, -18 - b, -6, -21.6 - b]); }, B3, { k: .6, lw: 1.7 });
  /* pescoço: recolhido em S, ou esticado no disparo */
  var N0 = [4.6, -28.6 - b], hx = lp(lp(6.4 + (mv ? Math.sin(p * 2) * 1.6 : 0), 1.2, coil), 24, shoot), hy = lp(lp(-40.6 - b, -35.6 - b, coil), -31, shoot),
    N = bz(N0[0], N0[1], lp(lp(9.6, 11, coil), 12, shoot), lp(-31 - b, -30 - b, shoot), lp(lp(.4, -4.6, coil), 17, shoot), lp(lp(-36.4 - b, -32.6 - b, coil), -31.4, shoot), hx - 1.2, hy + .8, 9, 3, 2.2),
    ba = lp(lp(.14, .02, coil), 0, shoot);
  /* corpo */
  cel(c, function (c) { el(c, -2.4, -25.4 - b, 10.4, 6.6, -.28); }, B, { k: 2, lw: 2.1, inn: function (c) {
    c.fillStyle = 'rgba(214,218,206,.3)'; c.beginPath(); c.ellipse(1, -21 - b, 7, 2.4, -.3, 0, TAU); c.fill();
  } });
  /* asa dobrada */
  cel(c, function (c) { c.moveTo(4, -30 - b); c.bezierCurveTo(-2, -32.6 - b, -10, -30 - b, -15.6, -22.6 - b); c.quadraticCurveTo(-6, -21 - b, 3, -24.6 - b); c.closePath(); }, B2, { k: 1.2, lw: 1.8, inn: function (c) {
    for (i = 0; i < 5; i++) ln(c, [-1 - i * 3, -28.4 - b + i * 1.1, -4 - i * 3, -24.4 - b + i * .9], 'rgba(30,34,32,.4)', .9);
    c.fillStyle = 'rgba(214,218,206,.24)'; for (i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-.6 - i * 3.2, -28.8 - b + i * .9, 1.4, .7, -.3, 0, TAU); c.fill(); }
  } });
  leg(0, false);
  cel(c, tube(N), NK, { k: 1.1, lw: 1.9, inn: function (c) { for (i = 2; i < 9; i += 1) dot(c, N[i][0] + 1.4, N[i][1] + .6, .55, 'rgba(40,44,42,.5)'); } });
  /* rastro do disparo */
  if (shoot > .3) for (i = 0; i < 3; i++) ln(c, [hx - 14 - i * 2, hy - 3 + i * 3, hx - 5 - i * 2, hy - 3 + i * 3], 'rgba(230,240,230,' + (shoot * .7) + ')', 1.3);
  /* cabeça e bico de adaga */
  c.save(); c.translate(hx, hy); c.rotate(ba);
  cel(c, function (c) { c.moveTo(-1, -2.4); c.quadraticCurveTo(-6, -4.6, -11.6, -2.6 + (mv ? Math.sin(p) * .6 : 0)); c.quadraticCurveTo(-6, -1.6, -1.6, -.6); c.closePath(); }, CR, { k: .5, lw: 1.4 });
  cel(c, function (c) { c.moveTo(2.4, -.2); c.lineTo(16.6, .6); c.lineTo(2.4, 1.8); c.closePath(); }, BL, { k: .4, lw: 1.5, sh: 'rgba(40,40,20,.35)' });
  cel(c, function (c) { c.moveTo(2.4, -1.8); c.quadraticCurveTo(10, -1.2, 17.6, .4); c.lineTo(2.4, .4); c.closePath(); }, BL, { k: .5, lw: 1.5, sh: 'rgba(40,40,20,.35)', inn: function (c) { c.fillStyle = shoot > .2 ? VEN : 'rgba(124,252,154,.55)'; c.beginPath(); c.moveTo(12.4, -.6); c.lineTo(17.6, .4); c.lineTo(12.4, .6); c.closePath(); c.fill(); } });
  cel(c, function (c) { el(c, 0, -.4, 3.8, 3.1); }, NK, { k: .9, lw: 1.7 });
  cel(c, function (c) { c.moveTo(-3.6, -1.4); c.quadraticCurveTo(-2.4, -4, 2.4, -3.4); c.quadraticCurveTo(1, -2.2, -3.6, -1.4); c.closePath(); }, CR, { k: 0, lw: 1.2 });
  eye(c, .9, -.6, 1.1, 1);
  if (shoot > .2) glow(c, 17.6, .4, 1.6 * shoot, 1.6 * shoot, '#eaffef', '#7CFC9A', 8);
  c.restore();
}

/* ---------------- jararaca ---------------- */
/* hide: escondida no capim (0) até erguida (1); move: serpenteia; atk: recua e dá o bote */
export function drawJararaca(c, a, k) {
  var mv = a === 'move', hd = a === 'hide' ? sm(k) : 1, at = a === 'atk' ? k : 0, p = mv ? k * TAU : 0, i,
    pull = sm(seg(at, 0, .62)) * (1 - sm(seg(at, .7, 1))), str = sm(seg(at, .7, 1)), up = mv ? .35 : 1,
    B = '#7d8079', B2 = '#5e625c', MK = '#3c403c', BLY = '#c2c4b6';
  /* espinha: chão em S, depois o pescoço que sobe */
  var P = [], N = 14;
  for (i = 0; i <= N; i++) { var u = i / N; P.push([lp(-21, 3, u) + (mv ? Math.sin(p + u * 4) * .6 : 0), -2.6 - Math.sin(u * 6.6 - p + 1) * lp(2.6, 1.2, u) * (1 - str * u * .6), lp(.7, 3.3, Math.min(1, u * 2.2))]); }
  var B0 = P[N], hx, hy, ha, mo;
  hx = lp(lp(9, 13.6, up), 6.4, pull); hy = lp(lp(-5.8, -19.4, up), -17.6, pull); hx = lp(hx, 25, str); hy = lp(hy, -8, str);
  if (a === 'hide') { hx = lp(5, 13.6, hd); hy = lp(-6.4, -19.4, hd); }
  ha = lp(lp(.18, .1, up), -.15, pull) + str * .3; mo = pull * .5 + str * .9;
  var NK = bz(B0[0], B0[1], B0[0] + lp(9, 12, str), B0[1] - lp(.4, 1, str), lp(lp(1, -1.6, up), -5, pull) + str * 14, hy + lp(6, 2, up) + str * 2, hx - 2.4, hy + .8, 9, 3.3, 2.3);
  for (i = 1; i < NK.length; i++) P.push(NK[i]);
  /* capim de trás (só na emboscada) */
  function grass(front) {
    var gh = lp(1, .5, hd), al = lp(1, .75, hd);
    c.save(); c.globalAlpha = al;
    for (i = 0; i < 13; i++) {
      var x = -18 + i * 3.1 + (front ? 1.4 : 0), l = (11 + ((i * 7) % 5) * 2.2) * gh * (front ? 1 : 1.2), lean = ((i * 5) % 7 - 3) * .9;
      if (front && (i % 2)) continue;
      c.beginPath(); c.moveTo(x - 1.3, 0); c.quadraticCurveTo(x + lean * .3, -l * .6, x + lean, -l); c.quadraticCurveTo(x + lean * .3 + .8, -l * .5, x + 1.4, 0); c.closePath();
      c.fillStyle = front ? (i % 3 ? '#6f8a5a' : '#5d7a4c') : '#4c6640'; c.strokeStyle = OUT; c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke(); c.fill();
    }
    c.restore();
  }
  if (a === 'hide') grass(false);
  /* corpo */
  cel(c, tube(P), B, { k: 1.3, lw: 2, inn: function (c) {
    /* ventre claro */
    for (i = 1; i < P.length - 1; i++) { var q0 = P[i - 1], q1 = P[i + 1], th = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]); dot(c, P[i][0] - Math.sin(th) * P[i][2] * .62, P[i][1] + Math.cos(th) * P[i][2] * .62, P[i][2] * .52, 'rgba(206,208,196,.5)'); }
    /* marcas em V da jararaca, com o fio verde-veneno */
    for (i = 1; i < P.length - 2; i += 2) { var q2 = P[i - 1], q3 = P[i + 1], t2 = Math.atan2(q3[1] - q2[1], q3[0] - q2[0]), r = P[i][2], nx = Math.sin(t2), ny = -Math.cos(t2), tx = Math.cos(t2), ty = Math.sin(t2);
      c.beginPath(); c.moveTo(P[i][0] + nx * r * 1.1 - tx * r * .9, P[i][1] + ny * r * 1.1 - ty * r * .9); c.lineTo(P[i][0] - nx * r * .1, P[i][1] - ny * r * .1); c.lineTo(P[i][0] + nx * r * 1.1 + tx * r * .9, P[i][1] + ny * r * 1.1 + ty * r * .9); c.closePath(); c.fillStyle = MK; c.fill();
      c.strokeStyle = 'rgba(124,252,154,.55)'; c.lineWidth = .7; c.stroke(); }
  } });
  /* cabeça em ponta de lança */
  c.save(); c.translate(hx, hy); c.rotate(ha);
  if (mo > .05) { c.beginPath(); c.moveTo(-1, .4); c.lineTo(7, -.4); c.lineTo(Math.cos(mo) * 6.6, .6 + Math.sin(mo) * 6.6); c.closePath(); c.fillStyle = '#6a1240'; c.fill(); }
  c.save(); c.translate(-1, .6); c.rotate(mo);
  cel(c, function (c) { c.moveTo(-1.4, -.2); c.lineTo(6.6, -.2); c.quadraticCurveTo(6.6, 1.4, 4.6, 1.6); c.lineTo(-1.6, 1.8); c.closePath(); }, BLY, { k: .4, lw: 1.3 });
  c.restore();
  if (mo > .2) { tooth(c, 4.4, .2, .5, 2.4 * mo + .6); tooth(c, 2.4, .1, .4, 1.2); }
  cel(c, function (c) { c.moveTo(-3.6, -2.6); c.quadraticCurveTo(1, -4, 5, -2); c.quadraticCurveTo(7.6, -.8, 7.6, .2); c.lineTo(-1, .8); c.quadraticCurveTo(-4, 1.6, -3.6, -2.6); c.closePath(); }, B, { k: 1, lw: 1.7, inn: function (c) {
    ln(c, [-3.4, -.6, 1, -.6], MK, 1.6);
    c.fillStyle = MK; c.beginPath(); c.moveTo(-2, -3.2); c.lineTo(1.6, -3.4); c.lineTo(-.4, -1.8); c.closePath(); c.fill();
  } });
  eye(c, 2.2, -1.6, 1.1, .9);
  ln(c, [.6, -2.8, 3.6, -2.4], OUT, 1.1);
  /* língua bífida de feitiço */
  if (mo < .3) { var tf = mv ? Math.max(0, Math.sin(p * 2)) : (a === 'hide' ? hd : .6); if (tf > .1) { var L = 3 + tf * 4; ln(c, [7.4, .2, 7.4 + L, .4, 7.4 + L + 1.6, -.8], OUT, 1.6); ln(c, [7.4 + L, .4, 7.4 + L + 1.6, 1.6], OUT, 1.6); ln(c, [7.4, .2, 7.4 + L, .4, 7.4 + L + 1.6, -.8], MAG, .8); ln(c, [7.4 + L, .4, 7.4 + L + 1.6, 1.6], MAG, .8); } }
  c.restore();
  if (a === 'hide') { grass(true); if (hd < .6) { c.save(); c.translate(hx, hy); c.rotate(ha); eye(c, 2.2, -1.6, 1.2, 1); dot(c, 4, -1.4, 1.6, 'rgba(255,61,138,.25)'); c.restore(); } }
  if (str > .5) for (i = 0; i < 3; i++) ln(c, [hx - 16 - i * 1.6, hy - 2 + i * 2.6, hx - 8 - i * 1.6, hy - 2 + i * 2.6], 'rgba(230,240,230,' + (str * .6) + ')', 1.2);
}

/* ---------------- caldeirão (peça) ---------------- */
/* caldeirão de ferro com poção magenta; base em (0,0), tamanho em unidades (largura ~ 2*R) */
export function cauldron(c, R, t, al) {
  var i, rimY = -R * 1.12, u = (t || 0) % 1;
  /* pés */
  [[-.62, -.1], [.62, .1], [0, 0]].forEach(function (q, n) { cel(c, function (c) { poly(c, [q[0] * R - R * .12, -R * .2, q[0] * R + R * .12, -R * .2, q[0] * R + R * .08 + q[1] * R, 0, q[0] * R - R * .1 + q[1] * R, 0]); }, n === 2 ? '#2a262c' : '#3a3540', { k: .6, lw: 1.4 }); });
  /* alças */
  [-1, 1].forEach(function (s) { var a0 = s > 0 ? 0 : PI; c.beginPath(); c.arc(s * R * 1.02, rimY + R * .32, R * .2, a0 - 1.5, a0 + 1.5); c.strokeStyle = OUT; c.lineWidth = R * .14 + 2; c.stroke(); c.strokeStyle = '#4a4552'; c.lineWidth = R * .14; c.stroke(); });
  /* bojo */
  cel(c, function (c) { c.moveTo(-R, rimY); c.bezierCurveTo(-R * 1.22, -R * .62, -R * .74, -R * .14, 0, -R * .16); c.bezierCurveTo(R * .74, -R * .14, R * 1.22, -R * .62, R, rimY); c.closePath(); }, '#36323c', { k: R * .14, lw: 2, sh: 'rgba(0,0,0,.4)', hi: 'rgba(200,190,230,.18)', inn: function (c) {
    c.beginPath(); c.ellipse(-R * .5, -R * .7, R * .12, R * .28, .3, 0, TAU); c.fillStyle = 'rgba(230,220,255,.28)'; c.fill();
    ln(c, [-R * .96, rimY + R * .3, R * .96, rimY + R * .3], 'rgba(0,0,0,.35)', 1.2);
    /* escorrido de poção */
    c.fillStyle = MAG2; c.beginPath(); c.moveTo(R * .2, rimY); c.quadraticCurveTo(R * .26, rimY + R * .5, R * .34, rimY + R * .54); c.quadraticCurveTo(R * .42, rimY + R * .3, R * .46, rimY); c.closePath(); c.fill();
  } });
  /* boca, poção e bolhas */
  cel(c, function (c) { el(c, 0, rimY, R * 1.06, R * .3); }, '#4a4552', { k: 0, lw: 2 });
  c.beginPath(); c.ellipse(0, rimY + R * .03, R * .86, R * .2, 0, 0, TAU); c.fillStyle = MAG2; c.fill();
  c.beginPath(); c.ellipse(-R * .1, rimY + R * .01, R * .6, R * .12, 0, 0, TAU); c.fillStyle = MAG; c.fill();
  c.beginPath(); c.ellipse(-R * .24, rimY - R * .02, R * .22, R * .05, 0, 0, TAU); c.fillStyle = '#ffd0f0'; c.fill();
  for (i = 0; i < 4; i++) { var bu = (u + i * .27) % 1; bubble(c, (-.5 + i * .33) * R, rimY - R * .02 - bu * R * .5, R * (.07 + .05 * Math.sin(bu * PI)), i % 2 ? VEN : '#ff8fe0', (al == null ? 1 : al) * (1 - bu * .6)); }
}

/* textura do caldeirão do chefe: ~70 px, base embaixo */
export function drawCaldeirao(c, w, h) {
  c.save(); c.translate(w / 2, h - 6);
  c.beginPath(); c.ellipse(0, 0, w * .38, 4.6, 0, 0, TAU); c.fillStyle = 'rgba(10,8,14,.35)'; c.fill();
  /* vapor verde-veneno */
  var g = c.createRadialGradient(0, -h * .62, 2, 0, -h * .62, w * .36); g.addColorStop(0, 'rgba(255,90,210,.45)'); g.addColorStop(1, 'rgba(255,90,210,0)'); c.fillStyle = g; c.fillRect(-w / 2, -h, w, h * .6);
  for (var i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-8 + i * 8, -h * .62); c.bezierCurveTo(-14 + i * 8, -h * .72, -2 + i * 8, -h * .78, -8 + i * 9, -h * .88); c.strokeStyle = 'rgba(124,252,154,' + (.75 - i * .15) + ')'; c.lineWidth = 2.4 - i * .4; c.lineCap = 'round'; c.stroke(); }
  cauldron(c, w * .37, .2, 1);
  c.restore();
}

/* ---------------- cururu-da-cuca ---------------- */
/* move: pulos; atk: mexe o caldeirãozinho das costas e joga o feitiço */
export function drawCururu(c, a, k) {
  var mv = a === 'move', at = a === 'atk' ? k : 0, i,
    air = mv ? Math.max(0, Math.sin(k * TAU)) : 0, sq = mv ? Math.max(0, -Math.sin(k * TAU)) : 0,
    stir = seg(at, 0, .7), thr = sm(seg(at, .72, 1)), B = '#7a8079', B2 = '#626862', B3 = '#4b504b', BLY = '#b9bdaa', i2;
  var lift = air * 8, tilt = mv ? (air > 0 ? -Math.cos(k * TAU) * .14 : 0) : -thr * .08, ext = sm(air * 1.3);
  c.save(); c.translate(0, -lift); c.translate(0, -6); c.rotate(tilt); c.scale(1 + sq * .08, 1 - sq * .1); c.translate(0, 6);
  function hind(dx, far) {
    var col = far ? B3 : B2, Hh = [-10 + dx, -8], K = [lp(-1.6, -13, ext) + dx, lp(-4.6, -5, ext)], A = [lp(-10.6, -17, ext) + dx, lp(-2.2, -.8, ext)], T = [lp(-2.6, -21, ext) + dx, lp(-.8, 1.6, ext)];
    [-.5, 0, .5].forEach(function (d) { var an = Math.atan2(T[1] - A[1], T[0] - A[0]) + d; ln(c, [T[0], T[1], T[0] + Math.cos(an) * 3, T[1] + Math.sin(an) * 3], OUT, 2.4); ln(c, [T[0], T[1], T[0] + Math.cos(an) * 3, T[1] + Math.sin(an) * 3], col, 1.1); });
    cel(c, function (c) { cap(c, A[0], A[1], T[0], T[1], 1.6); }, col, { k: .5, lw: 1.6 });
    cel(c, function (c) { cap(c, K[0], K[1], A[0], A[1], 2.4); }, col, { k: .8, lw: 1.7 });
    cel(c, function (c) { cap(c, Hh[0], Hh[1], K[0], K[1], 4.4); }, far ? B2 : B, { k: 1.2, lw: 1.9 });
  }
  hind(3, true);
  /* braço de trás (apoio) */
  cel(c, function (c) { cap(c, 9, -7, 12 + ext * 3, -1.2 - ext * 1.6, 2.2); }, B3, { k: .6, lw: 1.6 });
  /* corpo */
  cel(c, function (c) { c.moveTo(-15, -6); c.bezierCurveTo(-16.6, -16, -7, -21, 2, -19); c.bezierCurveTo(9, -19.6, 15.6, -19, 18.4, -13.4); c.quadraticCurveTo(20.4, -9.4, 16.6, -7.4); c.bezierCurveTo(12, -3.6, 6, -2.4, -1, -2.4); c.bezierCurveTo(-8, -2.2, -14.6, -2.2, -15, -6); c.closePath(); }, B, { k: 2.2, lw: 2.1, inn: function (c) {
    c.fillStyle = 'rgba(214,218,200,.42)'; c.beginPath(); c.ellipse(4, -3.6, 11, 2.6, -.05, 0, TAU); c.fill();
    [[-10, -13, 1.4], [-5.6, -16, 1.1], [-12, -8.6, 1.2], [-4, -10.6, 1.5], [1, -12.6, 1.1], [-8, -5.6, .9], [-1.4, -6.6, 1], [5, -10.6, .9], [9.6, -9, 1.1]].forEach(function (q) { dot(c, q[0], q[1], q[2], 'rgba(40,44,40,.42)'); dot(c, q[0] - .4, q[1] - .4, q[2] * .4, 'rgba(255,255,240,.3)'); });
    c.fillStyle = 'rgba(40,44,40,.32)'; c.beginPath(); c.ellipse(7, -15, 4, 2, .3, 0, TAU); c.fill();
  } });
  /* alça que prende o caldeirão */
  ln(c, [-11.6, -15, -7, -5, -3, -3], OUT, 3.2); ln(c, [-11.6, -15, -7, -5, -3, -3], '#6a5a48', 1.7);
  /* boca emburrada */
  c.beginPath(); c.moveTo(19.4, -12.2); c.quadraticCurveTo(13, -9, 6, -10.6); c.strokeStyle = OUT; c.lineWidth = 1.5; c.lineCap = 'round'; c.stroke();
  dot(c, 17.6, -15, .6, OUT);
  hind(0, false);
  /* caldeirãozinho nas costas */
  c.save(); c.translate(-6.4, -17.6); c.rotate(-.12 + (mv ? Math.sin(k * TAU) * .05 : 0)); cauldron(c, 6.4, mv ? k : at * 2, 1); c.restore();
  /* olhos saltados e chapéu torto */
  cel(c, function (c) { el(c, 10.4, -18.6, 4.2, 4); }, B, { k: 1, lw: 1.9 });
  eye(c, 11, -18.8, 2.3, 2.1);
  ln(c, [6.6, -21, 14.4, -20.4], OUT, 1.8);
  c.save(); c.translate(7.6, -22.4); c.rotate(-.32);
  cel(c, function (c) { el(c, 0, 0, 7, 1.8); }, G4, { k: .5, lw: 1.6 });
  cel(c, function (c) { c.moveTo(-4.2, -.4); c.lineTo(-1.6, -8); c.quadraticCurveTo(-1, -12, -5.6, -12.4); c.quadraticCurveTo(-.6, -13.6, 1, -8.6); c.lineTo(4.2, -.4); c.closePath(); }, '#4a4e4b', { k: .9, lw: 1.6, inn: function (c) { c.fillStyle = MAG2; c.fillRect(-5, -3, 10, 1.8); } });
  c.restore();
  /* braço da frente com a colher de mexer */
  var top, hand;
  if (a === 'atk' && thr <= 0) { var ang = stir * TAU * 1.5; hand = [-2 + Math.cos(ang) * 2.4, -27.6 + Math.sin(ang) * 1]; top = hand; }
  else if (a === 'atk') { hand = [lp(-2, 16, thr), lp(-27.6, -24, thr)]; }
  else { hand = [14.6 + ext * 2, -5.6 - ext * 2]; }
  /* colher de pau */
  var sa = a === 'atk' ? (thr <= 0 ? 1.35 + Math.sin(stir * TAU * 1.5) * .12 : lp(1.35, -.2, thr)) : -1.3 + ext * .5, sl = 13;
  c.save(); c.translate(hand[0], hand[1]); c.rotate(sa);
  cel(c, function (c) { cap(c, -3, 0, sl, 0, 1); }, '#8a8070', { k: .5, lw: 1.4 });
  cel(c, function (c) { el(c, sl + 1.6, 0, 2.6, 1.8); }, '#8a8070', { k: .5, lw: 1.4, inn: function (c) { if (a === 'atk') { c.fillStyle = MAG; c.beginPath(); c.ellipse(sl + 1.6, 0, 1.8, 1.1, 0, 0, TAU); c.fill(); } } });
  c.restore();
  cel(c, function (c) { cap(c, 10, -9, hand[0], hand[1], 2.3); }, B2, { k: .7, lw: 1.7 });
  cel(c, function (c) { el(c, hand[0], hand[1], 2.6, 2.3); }, B2, { k: .5, lw: 1.5 });
  /* bolhas subindo; no fim, o feitiço voando */
  if (a === 'atk') { for (i2 = 0; i2 < 4; i2++) { var bu = (stir * 2 + i2 * .25) % 1; bubble(c, -6.4 + Math.sin(i2 * 2 + bu * 4) * 3, -26 - bu * 10, .9 + (i2 % 2) * .5, i2 % 2 ? VEN : '#ff8fe0', (1 - bu) * (1 - thr)); } }
  if (thr > .3) { var gx = lp(16, 23, thr), gy = lp(-30, -33, thr); for (i2 = 0; i2 < 3; i2++) bubble(c, gx - 4 - i2 * 3, gy + 1 + i2, 1 - i2 * .2, i2 % 2 ? VEN : MAG, thr * .8); var g = c.createRadialGradient(gx, gy, 0, gx, gy, 8); g.addColorStop(0, 'rgba(255,79,200,.6)'); g.addColorStop(1, 'rgba(255,79,200,0)'); c.fillStyle = g; c.fillRect(gx - 8, gy - 8, 16, 16); bubble(c, gx, gy, 3.4 * thr, MAG, 1); }
  c.restore();
}

/* ---------------- tracajá gigante ---------------- */
/* move: caminhada lenta; atk: ergue a frente do casco e cai esmagando */
export function drawTracaja(c, a, k) {
  var mv = a === 'move', at = a === 'atk' ? k : 0, p = mv ? k * TAU : 0, i,
    rise = sm(seg(at, 0, .62)) * (1 - sm(seg(at, .68, .95))), slam = sm(seg(at, .8, 1)), ang = -.4 * rise,
    b = mv ? Math.abs(Math.sin(p)) * .7 : 0, SH = '#6f7570', SH2 = '#575d59', SH3 = '#41463f', SK = '#878c84', SK2 = '#6b706a', PL = '#a9ab9a';
  c.save(); c.translate(-16, 0); c.rotate(ang); c.translate(16, 0); c.translate(0, -b + slam * .6);
  function leg(x, ph, far, front) {
    var s = mv ? Math.sin(p + ph) : 0, upl = mv ? Math.max(0, Math.cos(p + ph)) * 2.4 : 0, col = far ? SK2 : SK,
      jx = x, jy = -9, fx = x + s * 4 + (front ? 2 : -1), fy = -upl;
    if (front && rise > 0) { fx = lp(fx, x + 8, rise); fy = lp(fy, -6, rise); }
    cel(c, function (c) { cap(c, jx, jy, fx, fy - 2.2, front ? 3.8 : 4.2); }, col, { k: 1, lw: 1.9, inn: function (c) { dot(c, jx + 1, jy + 2, 1, 'rgba(40,44,40,.4)'); dot(c, (jx + fx) / 2 - 1, (jy + fy) / 2, .8, 'rgba(40,44,40,.4)'); } });
    cel(c, function (c) { el(c, fx + 1, fy - 1.5, 4.6, 2); }, col, { k: .6, lw: 1.7 });
    [0, 1.8, 3.6].forEach(function (d) { ln(c, [fx + 2.4 + d * .6, fy - .8, fx + 4 + d * .6, fy + .2], OUT, 2); ln(c, [fx + 2.4 + d * .6, fy - .8, fx + 4 + d * .6, fy + .2], '#ddd8c8', .9); });
  }
  leg(-13, PI, true, false); leg(11, 0, true, true);
  /* rabinho */
  cel(c, function (c) { poly(c, [-21, -10, -28, -6.4, -21, -6]); }, SK2, { k: .4, lw: 1.6 });
  /* pescoço e cabeça (atrás da borda do casco) */
  var hb = mv ? Math.sin(p * 2) * .8 : 0, HX = 27 + rise * 2, HY = -11 + hb - rise * 2.4, ha = -.06 - rise * .2;
  var NK = bz(13, -10, 18, -10.4, 21, HY + .6, HX - 4, HY + .6, 6, 4, 3.4);
  cel(c, tube(NK), SK, { k: 1.2, lw: 1.9, inn: function (c) { for (i = 1; i < 5; i++) { c.beginPath(); c.arc(NK[i][0], NK[i][1], 2.6, .6, 2.2); c.strokeStyle = 'rgba(40,44,40,.35)'; c.lineWidth = .8; c.stroke(); } } });
  c.save(); c.translate(HX, HY); c.rotate(ha);
  cel(c, function (c) { c.moveTo(-4.6, 2.6); c.bezierCurveTo(-5.4, -4.6, 3, -6, 6.6, -2.6); c.quadraticCurveTo(8.6, -.6, 7.6, 1.4); c.quadraticCurveTo(5, 3.6, 0, 3.6); c.quadraticCurveTo(-3.4, 3.8, -4.6, 2.6); c.closePath(); }, SK, { k: 1.3, lw: 1.9, inn: function (c) {
    c.fillStyle = 'rgba(214,218,200,.4)'; c.beginPath(); c.ellipse(2, 3, 5, 1.4, 0, 0, TAU); c.fill();
    /* as pintas do tracajá: o resto de cor */
    [[.4, -3.6, 1.3], [3.2, -3.4, 1], [-2.4, -2.6, 1.1], [5.4, -2, .8], [-.6, 1.4, .8]].forEach(function (q) { glow(c, q[0], q[1], q[2], q[2] * .8, VEN, '#3fcf72', 4); });
  } });
  c.beginPath(); c.moveTo(7.4, .8); c.quadraticCurveTo(3, 1.6, -.6, 1); c.strokeStyle = OUT; c.lineWidth = 1.2; c.lineCap = 'round'; c.stroke();
  dot(c, 7, -1.6, .5, OUT);
  eye(c, 2.6, -1.2, 1.4, 1.2); ln(c, [.4, -3, 4.6, -2.4], OUT, 1.4);
  c.restore();
  /* casco */
  cel(c, function (c) { c.moveTo(-22.6, -7.6); c.bezierCurveTo(-22, -24, 14, -27.6, 19.6, -9.4); c.quadraticCurveTo(20.4, -6.4, 17, -5.6); c.lineTo(-20, -5.4); c.quadraticCurveTo(-23.4, -5.6, -22.6, -7.6); c.closePath(); }, SH, { k: 3, lw: 2.4, inn: function (c) {
    /* placas */
    c.strokeStyle = 'rgba(30,34,30,.55)'; c.lineWidth = 1.3; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-17, -10); c.bezierCurveTo(-14, -21, 8, -23, 14.6, -10.6); c.stroke();
    [[-10.4, -22], [-2, -24.6], [6.4, -22.6]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1] + 6); c.lineTo(q[0] - 2, q[1] + .2); c.moveTo(q[0], q[1] + 6); c.lineTo(q[0] + 3, q[1] + 6.6); c.stroke(); });
    [-13, -6, 1.6, 8.6].forEach(function (x) { ln(c, [x, -14.4 + Math.abs(x + 2) * .1, x + 1, -7], 'rgba(30,34,30,.5)', 1.1); });
    c.fillStyle = 'rgba(255,255,255,.1)'; [[-9, -19.6], [-1.6, -21.4], [6, -19]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], 3.4, 1.6, -.2, 0, TAU); c.fill(); });
    /* lodo e limo do pantanal */
    c.fillStyle = 'rgba(90,110,80,.6)'; c.beginPath(); c.ellipse(-14, -16, 4, 2, -.6, 0, TAU); c.fill(); c.beginPath(); c.ellipse(9, -17.6, 3.6, 1.6, .5, 0, TAU); c.fill();
    /* borda do casco (escudos marginais) */
    c.fillStyle = SH2; c.fillRect(-25, -9.2, 46, 3.6);
    for (i = 0; i < 9; i++) ln(c, [-19 + i * 4.4, -9.2, -19 + i * 4.4, -5.6], 'rgba(30,34,30,.5)', 1);
  } });
  /* plastrão aparecendo */
  cel(c, function (c) { poly(c, [-18.6, -5.6, 16, -5.6, 14, -3.4, -16.6, -3.4]); }, PL, { k: .4, lw: 1.5 });
  leg(-17, 0, false, false); leg(7.4, PI, false, true);
  c.restore();
  /* poeira e lama da pancada */
  if (at > .75) { var q = seg(at, .78, 1); impact(c, 20, 0, q * .8); for (i = 0; i < 5; i++) drop(c, 14 + i * 5, -3 - (i % 2) * 4 * q, 1.1, q * .9, '#c4c8b8'); }
}
