// @ts-nocheck
/* Capítulo 3 (Sertão): monstros comuns. Assombros cinzentos puxados para o ocre do sertão,
   olhos rosa e um resto de amarelo-relâmpago. Virados para a direita, pés em (0,0), y negativo para cima.
   Assinatura: draw(ctx, nomeDaAnimacao, k) com k de 0 a 1. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, EYE, EYEG, YEL, PI, cl, lp, sm, bz, tube, rope, eye, spark, bolt, puff, limb } from './ch3_util';

/* ---------------- calango ---------------- */
export function drawCalango(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk', w = mv ? k * TAU : 0,
    rr = at ? sm(k / 0.66) : 0, lg = at ? sm((k - 0.66) / 0.34) : 0,
    G = '#9a907f', G2 = '#776e61', D = '#5b544c', BL = '#c2b8a6', i, O = { k: 0.5, lw: 1.1 };
  var bob = mv ? Math.abs(Math.cos(w)) * 0.7 : 0;
  c.save(); c.translate(lg * 5, -bob);
  /* rabo serpenteando, no chão */
  var T = [];
  for (i = 0; i <= 10; i++) { var u = i / 10; T.push([-6 - u * 14, -3.8 + u * 2.8 + (mv ? Math.sin(u * 5 - w) * 1.9 * u : Math.sin(u * 3 + k * 2) * 0.6 * u), 2.9 * (1 - u) + 0.5]); }
  cel(c, tube(T), G2, { k: 0.9, lw: 1.2, inn: function (c) { for (i = 1; i < 10; i += 2) ln(c, [T[i][0], T[i][1] - T[i][2] * 0.9, T[i][0] - 0.6, T[i][1] + T[i][2] * 0.9], 'rgba(40,34,30,.4)', 0.7); } });
  /* pernas: bacia (-4,-4) e ombro (5,-5) */
  function leg(hx, hy, ph, far, front) {
    var s = mv ? Math.sin(w + ph) : 0, up = mv ? Math.max(0, Math.cos(w + ph)) * 2.2 : 0, fx = hx + s * 3.4 + (front ? 1.4 : -0.6), fy = -up;
    if (front && at) { fx = hx + 2 + rr * 2 - lg * 1; fy = lp(0, hy + 4.6, rr * (1 - lg * 0.8)); }
    limb(c, hx, hy, fx, fy - 0.7, 3.5, 3.3, front ? 1 : -1, 1.5, 1.2, far ? D : G2, far ? D : G2, O);
    [-0.5, 0.2, 0.9].forEach(function (d) { ln(c, [fx, fy - 0.6, fx + Math.cos(d) * 2.4, fy - 0.6 + Math.sin(d) * 1.2 + 0.4], OUT, 1.3); ln(c, [fx, fy - 0.6, fx + Math.cos(d) * 2.4, fy - 0.6 + Math.sin(d) * 1.2 + 0.4], far ? D : G2, 0.5); });
  }
  leg(-3.4, -4.2, PI, true, false);
  /* corpo e cabeça giram juntos em volta da bacia no bote */
  c.save(); c.translate(-4, -4); c.rotate(-rr * 0.55 + lg * 0.5); c.translate(4, 4);
  leg(5.6, -5.2, 0, true, true);
  cel(c, function (c) { c.moveTo(-8.4, -3.8); c.bezierCurveTo(-6.4, -10, 4, -11, 8.8, -8.6); c.bezierCurveTo(10.2, -5.4, 8, -2, 3, -1.9); c.bezierCurveTo(-1, -1.6, -6.4, -1.6, -8.4, -3.8); c.closePath(); }, G, {
    k: 1.5, lw: 1.3, inn: function (c) {
      c.fillStyle = 'rgba(224,216,198,.5)'; c.beginPath(); c.ellipse(1, -2.2, 7.4, 1.6, 0, 0, TAU); c.fill();
      /* listras escuras e a faixa amarela do dorso: o resto de cor */
      for (i = 0; i < 5; i++) ln(c, [-5 + i * 2.9, -8.8 + Math.abs(i - 2) * 0.3, -4.4 + i * 2.9, -5], 'rgba(46,40,36,.4)', 1);
      ln(c, [-6.8, -6.6, -2, -8.8, 3, -9.4, 7.4, -8.4], 'rgba(255,210,63,.85)', 0.9, [1.6, 1.2]);
    },
  });
  leg(-3.6, -3.6, 0, false, false);
  leg(5, -4.4, PI, false, true);
  /* cabeça erguida, boca abre no bote */
  var mo = at ? 0.12 + rr * 0.35 + lg * 0.25 : 0.05;
  c.save(); c.translate(7.6, -8); c.rotate(-0.32 - (mv ? Math.sin(w * 2) * 0.04 : 0) + lg * 0.32); c.scale(1.2, 1.2);
  var jx = -1 + Math.cos(mo) * 8, jy = 1.2 + Math.sin(mo) * 8;
  if (mo > 0.1) { c.beginPath(); c.moveTo(-0.6, 1.2); c.lineTo(6.6, 0.8); c.lineTo(lp(-1, jx, 0.85), lp(1.2, jy, 0.85)); c.closePath(); c.fillStyle = '#7a2244'; c.fill(); }
  c.save(); c.translate(-1, 1.2); c.rotate(mo);
  cel(c, function (c) { c.moveTo(0, 0); c.lineTo(8, -0.2); c.quadraticCurveTo(5, 2.2, 0, 1.9); c.closePath(); }, BL, { k: 0.4, lw: 1 });
  c.restore();
  cel(c, function (c) { c.moveTo(-2.4, 1.6); c.bezierCurveTo(-2.6, -2.8, 2.6, -4.2, 6, -1.9); c.quadraticCurveTo(8.6, -0.6, 8.6, 0.8); c.lineTo(-1, 1.4); c.closePath(); }, G, {
    k: 1, lw: 1.1, inn: function (c) { ln(c, [-1.8, -1.6, 2.4, -3.1], 'rgba(46,40,36,.4)', 0.7); dot(c, 7.6, -0.5, 0.3, OUT); },
  });
  eye(c, 2.9, -1, 1.05, 0.9, 0.2);
  ln(c, [1.2, -2.5, 4.6, -2.1], OUT, 0.9);
  c.restore();
  c.restore();
  c.restore();
}

/* ---------------- cascavel ---------------- */
/* pose: 0 = enrolada e erguida em S. atk: recua (k até .62) e dá o bote em linha. move: serpenteando no chão.
   hide: 0 = enterrada (só chocalho e olhos), 1 = erguida */
export function drawCascavel(c, anim, k) {
  var G = '#958b7b', G2 = '#756c60', D = '#544c45', BL = '#c2b9a6', PAT = 'rgba(48,40,34,.55)', i,
    mv = anim === 'move', at = anim === 'atk', hd = anim === 'hide', e = hd ? sm(k) : 1, w = k * TAU,
    re = at ? sm(k / 0.62) : 0, st = at ? sm((k - 0.62) / 0.38) : 0, buzz = mv ? Math.sin(w * 4) : Math.sin(k * 40);
  function diamonds(P, step) { return function (c) { for (var j = 2; j < P.length - 1; j += step) { var p = P[j], q = P[j + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]), r = p[2] * 0.75; c.save(); c.translate(p[0], p[1]); c.rotate(a); c.beginPath(); poly(c, [-r * 1.2, 0, 0, -r, r * 1.2, 0, 0, r]); c.fillStyle = PAT; c.fill(); c.beginPath(); poly(c, [-r * 0.5, 0, 0, -r * 0.4, r * 0.5, 0, 0, r * 0.4]); c.fillStyle = 'rgba(214,204,182,.45)'; c.fill(); c.restore(); } }; }
  function rattle(x, y, a, sc) {
    c.save(); c.translate(x, y); c.rotate(a + buzz * 0.1); c.scale(sc, sc);
    for (i = 0; i < 4; i++) cel(c, function (c) { el(c, 0, -i * 2.5, 2.1 - i * 0.22, 1.5); }, i % 2 ? '#cfc4ab' : '#b9ad94', { k: 0.5, lw: 1.3 });
    /* faíscas amarelas: o resto de cor */
    var sp = 0.55 + 0.45 * Math.abs(buzz);
    glow(c, 0, -5, 2.2, 3, 'rgba(255,210,63,' + (0.35 * sp) + ')', YEL, 8);
    [[-4.2, -7.6, 1.8], [3.8, -9.4, 1.5], [-3, -11.6, 1.2], [4.4, -4, 1.1]].forEach(function (q, n) { spark(c, q[0] * (0.8 + sp * 0.3), q[1], q[2] * (n % 2 ? sp : 1.2 - sp * 0.4) + 0.4, YEL); });
    ln(c, [-2.6, -3, -5, -2], 'rgba(255,230,120,.8)', 0.7); ln(c, [2.6, -6, 5, -6.6], 'rgba(255,230,120,.8)', 0.7);
    c.restore();
  }
  function head(x, y, a, open, tongue) {
    c.save(); c.translate(x, y); c.rotate(a);
    if (tongue > 0) { var tl = 4 * tongue; ln(c, [6, 1, 6 + tl, 1.2, 6 + tl + 1.6, 0.2], '#c43d6a', 0.8); ln(c, [6 + tl, 1.2, 6 + tl + 1.6, 2.2], '#c43d6a', 0.8); }
    if (open > 0) {
      c.beginPath(); c.moveTo(-1, 1); c.lineTo(7, 0.2); c.lineTo(6.4, 1 + open * 7); c.closePath(); c.fillStyle = '#8f2448'; c.fill();
      [[5.4, 0.4], [3.6, 0.8]].forEach(function (f) { c.beginPath(); c.moveTo(f[0] - 0.5, f[1]); c.lineTo(f[0], f[1] + 2.6 * open + 0.6); c.lineTo(f[0] + 0.5, f[1]); c.closePath(); c.fillStyle = '#f4efe2'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.6; c.stroke(); });
    }
    c.save(); c.translate(-1, 1.4); c.rotate(open * 0.9);
    cel(c, function (c) { c.moveTo(-1, -0.4); c.lineTo(7.4, -0.6); c.quadraticCurveTo(4, 2.4, -1.4, 1.8); c.closePath(); }, BL, { k: 0.5, lw: 1.4 });
    c.restore();
    cel(c, function (c) { c.moveTo(-3.2, 2.2); c.bezierCurveTo(-4, -2.4, 0, -4.4, 4.4, -3.4); c.quadraticCurveTo(8, -2.4, 8.4, 0.4); c.lineTo(-1.4, 1.2); c.closePath(); }, G, {
      k: 1.1, lw: 1.8, inn: function (c) { c.fillStyle = PAT; c.beginPath(); poly(c, [-1, -2.6, 1.6, -3.6, 3.8, -2.6, 1.4, -1.4]); c.fill(); ln(c, [2, -0.2, 7.6, 0.4], 'rgba(40,34,30,.5)', 0.7); dot(c, 7.4, -1, 0.35, OUT); },
    });
    eye(c, 3.6, -1.4, 1.25, 1, 0.1);
    ln(c, [1.4, -3, 5.6, -2.4], OUT, 1.3);
    c.restore();
  }
  if (mv) {
    /* serpenteando no chão, cabeça um pouco erguida, chocalho para cima */
    var P = [];
    for (i = 0; i <= 18; i++) { var u = i / 18, x = 10 - u * 32; P.push([x, -3.2 - Math.sin(u * 7.5 - w) * 2.3 * (0.3 + u * 0.7) - (u < 0.12 ? (0.12 - u) * 40 : 0), lp(2.4, 3.3, Math.sin(u * PI)) * (u > 0.86 ? 1 - (u - 0.86) * 4 : 1)]); }
    var tl = P[P.length - 1];
    rattle(tl[0] - 0.6, tl[1] + 0.6, -0.5, 0.75);
    cel(c, tube(P), G, { k: 1.6, lw: 1.9, inn: function (c) { c.fillStyle = 'rgba(220,212,196,.35)'; for (var j = 0; j < P.length; j++) { c.beginPath(); c.arc(P[j][0], P[j][1] + P[j][2] * 0.6, P[j][2] * 0.5, 0, TAU); c.fill(); } diamonds(P, 2)(c); } });
    head(P[0][0] + 1.4, P[0][1] - 1, -0.12, 0, Math.max(0, Math.sin(w * 2)));
    return;
  }
  /* corpo enrolado, erguido em S */
  c.save();
  if (hd && e < 1) { c.beginPath(); c.rect(-40, -60, 80, 60.4); c.clip(); c.translate(0, (1 - e) * 36); }
  /* rabo com o chocalho, saindo do rolo de baixo para trás */
  var TL = bz(-10, -3.6, -15, -4, -17, -6, -16.6, -9.6, 6, 2.4, 1.4);
  cel(c, tube(TL), G2, { k: 0.8, lw: 1.7 });
  if (!hd || e > 0.5) rattle(-16.6, -10, -0.1, 0.8);
  /* rolo de baixo: metade de trás, metade da frente */
  function coil(cx, cy, rx, ry, r, a0, a1, col) {
    var P = [];
    for (i = 0; i <= 14; i++) { var a = a0 + (a1 - a0) * i / 14; P.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r]); }
    cel(c, tube(P), col, { k: 1.4, lw: 1.9, inn: function (c) { c.fillStyle = 'rgba(220,212,196,.3)'; c.beginPath(); c.ellipse(cx, cy + ry + r * 0.4, rx, r * 0.5, 0, 0, TAU); c.fill(); diamonds(P, 2)(c); } });
  }
  coil(-1, -4.2, 12, 3.6, 3.2, PI * 1.05, PI * 1.95, G2);
  coil(-1, -4.2, 12, 3.6, 3.3, -0.05, PI + 0.05, G);
  coil(0, -9.4, 8.6, 2.8, 3, PI * 1.05, PI * 2.1, G2);
  coil(0, -9.4, 8.6, 2.8, 3.1, -0.15, PI + 0.1, G);
  /* pescoço em S: recua e dá o bote */
  var hx = lp(lp(3, -5, re), 21, st), hy = lp(lp(-31, -29, re), -15, st), N;
  if (st > 0) N = bz(-6, -10.6, lp(-11, 2, st), lp(-20, -13.4, st), lp(-1, 12, st), lp(-31, -15, st), hx - 3, hy + 0.6, 12, 3, 2.3);
  else N = bz(-6, -10.6, lp(-12, -14, re), -18, lp(-4, -16, re), lp(-26, -30, re), hx - 3, hy + 0.6, 12, 3, 2.3);
  cel(c, tube(N), G, {
    k: 1.4, lw: 1.9, inn: function (c) {
      /* barriga clara do lado da frente */
      c.strokeStyle = 'rgba(226,218,200,.55)'; c.lineWidth = 2; c.lineCap = 'round'; c.beginPath(); N.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0] + p[2] * 0.55, p[1] + p[2] * 0.3); }); c.stroke();
      diamonds(N, 2)(c);
    },
  });
  head(hx, hy, lp(lp(0.05, -0.2, re), 0.15, st), at ? lp(re * 0.15, 0.7, st) : hd ? 0.05 * e : 0.05, 0);
  if (st > 0.5) [-6, 6.4].forEach(function (d, n) { ln(c, [hx - 7 - n * 3, hy + d, hx - 16 - n * 3, hy + d + 1], 'rgba(255,244,224,' + (0.8 * (st - 0.5) * 2) + ')', 1.1); });
  c.restore();
  if (hd && e < 1) {
    /* areia por cima: monte de areia, o chocalho e os olhos de fora */
    c.save(); c.globalAlpha = 1 - e * 0.85;
    cel(c, function (c) { c.moveTo(-20, 0.4); c.bezierCurveTo(-16, -6 + e * 3, 12, -7 + e * 3, 18, 0.4); c.closePath(); }, '#c4a06a', {
      k: 1.4, lw: 1.6, out: 'rgba(60,40,20,.7)', sh: 'rgba(90,60,30,.3)', hi: 'rgba(255,240,200,.35)', inn: function (c) {
        [[-12, -2], [-6, -4], [2, -3.6], [8, -2], [12, -1], [-2, -1.6]].forEach(function (q, n) { dot(c, q[0], q[1], 0.6 + (n % 2) * 0.3, n % 2 ? 'rgba(90,60,30,.5)' : 'rgba(255,240,210,.6)'); });
      },
    });
    c.restore();
    if (e < 0.5) { rattle(-12, -2.6 - e * 4, -0.25, 0.8); eye(c, 3.6, -4.6 - e * 2, 1.3, 0.9 * (1 - e) + 0.4, 0); eye(c, 6.6, -4.8 - e * 2, 1.15, 0.8 * (1 - e) + 0.4, 0); }
    /* grãos escorrendo */
    if (e > 0) for (i = 0; i < 8; i++) { var a = i * 0.8 + 0.3; dot(c, Math.cos(a) * (8 + e * 8), -2 - Math.abs(Math.sin(a)) * (4 + e * 10) + e * 4, 0.7, 'rgba(196,160,106,' + (1 - e) + ')'); }
  }
}

/* ---------------- mandacaru ---------------- */
/* move: arrasta-se balançando. atk: braços abrem, espinhos eriçam até disparar um leque */
export function drawMandacaru(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk', w = k * TAU, op = at ? sm(k / 0.8) : 0, fire = at ? cl((k - 0.8) / 0.2) : 0,
    G = '#848671', G2 = '#696b5a', D = '#4d4f43', SP = '#ece4cc', i,
    sw = mv ? Math.sin(w) * 0.07 : 0, dr = mv ? Math.sin(w) : 0, sl = 1.6 + op * 2.4;
  /* raízes arrastando no chão */
  [[-1, 0.2, 14], [-1, 1.2, 9], [1, 0.3, 13], [1, 1.1, 9], [0.2, 1.8, 6]].forEach(function (q, n) {
    var sd = q[0], ex = sd * q[2] + (sd > 0 ? 1 : -1) * dr * 2.4 * (n % 2 ? -1 : 1), ey = 0.4;
    rope(c, function (c) { c.moveTo(sd * 3, -2.4); c.quadraticCurveTo(sd * q[2] * 0.5, -3 + q[1], ex, ey); }, n % 2 ? D : '#6a5c4a', 1.8);
  });
  if (mv) for (i = 0; i < 3; i++) { var u = (k + i / 3) % 1; puff(c, -12 - u * 10, -1 - u * 4, 1.4 + u * 2.4, (1 - u) * 0.55, '#d8c39a'); }
  c.save(); c.rotate(sw); c.translate(0, mv ? -Math.abs(Math.cos(w)) * 0.8 : 0);
  function spines(x0, y0, x1, y1, n, side) {
    for (var j = 0; j <= n; j++) {
      var u = j / n, x = lp(x0, x1, u), y = lp(y0, y1, u), a = side * (0.9 + (j % 2) * 0.5) + (side < 0 ? PI : 0);
      ln(c, [x, y, x + Math.cos(a) * sl, y + Math.sin(a) * sl - (at ? 0 : 0.4)], at && op > 0.4 ? '#fff0b0' : SP, 0.75);
      if (op > 0.3) dot(c, x + Math.cos(a) * sl, y + Math.sin(a) * sl, 0.45, YEL);
    }
  }
  function arm(sd, by, len, ex, ey) {
    c.save(); c.translate(sd * 5.4, by); c.rotate(sd * op * 0.6);
    var A = bz(0, 0, sd * 7, 0.5, sd * 9, -1, sd * ex, ey, 8, 3.6, 3.2);
    cel(c, tube(A), G, {
      k: 1.4, lw: 2, inn: function (c) {
        c.strokeStyle = 'rgba(40,44,34,.45)'; c.lineWidth = 0.8; c.beginPath(); A.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0] + sd * 1.3, p[1]); }); c.stroke();
        c.fillStyle = 'rgba(230,236,200,.2)'; c.beginPath(); A.forEach(function (p, j) { c[j ? 'lineTo' : 'moveTo'](p[0] - sd * 1.6, p[1]); }); c.lineWidth = 1.6; c.strokeStyle = 'rgba(230,236,200,.2)'; c.stroke();
      },
    });
    spines(sd * ex - sd * 3, ey + 2, sd * ex - sd * 3, ey + 9, 3, -sd);
    spines(sd * ex + sd * 3, ey + 2, sd * ex + sd * 3, ey + 9, 3, sd);
    spines(sd * 3, -3.4, sd * 8, -3.6, 2, -1);
    c.restore();
    return A;
  }
  arm(-1, -17, 0, 11, -13);
  /* tronco com gomos */
  function trunk(c) { c.moveTo(-6.2, -0.5); c.bezierCurveTo(-7, -14, -6.8, -30, -5.6, -38); c.quadraticCurveTo(0, -44.6, 5.6, -38); c.bezierCurveTo(6.8, -30, 7, -14, 6.2, -0.5); c.quadraticCurveTo(0, 1.4, -6.2, -0.5); c.closePath(); }
  cel(c, trunk, G, {
    k: 2.2, lw: 2.2, inn: function (c) {
      [-3.4, 0, 3.4].forEach(function (x) { c.beginPath(); c.moveTo(x * 0.9, -40); c.quadraticCurveTo(x * 1.2, -20, x, 0); c.strokeStyle = 'rgba(40,44,34,.45)'; c.lineWidth = 1; c.stroke(); });
      [-1.7, 1.7].forEach(function (x) { c.beginPath(); c.moveTo(x * 0.9, -40); c.quadraticCurveTo(x * 1.2, -20, x, 0); c.strokeStyle = 'rgba(232,236,206,.22)'; c.lineWidth = 1.4; c.stroke(); });
      /* boca: rasgo escuro */
      c.beginPath(); poly(c, [-4, -22.6, -2.4, -21.2, -0.8, -23, 0.8, -21, 2.4, -22.8, 4, -21.4, 3.6, -19.6 - op * 2, 0, -18.6 - op * 2.4, -3.6, -19.6 - op * 2]); c.fillStyle = '#2a1a1e'; c.fill();
      c.fillStyle = 'rgba(255,61,138,' + (0.25 + op * 0.3) + ')'; c.beginPath(); c.ellipse(0, -20.6, 2.6, 1, 0, 0, TAU); c.fill();
    },
  });
  [-3.4, 0, 3.4].forEach(function (x) { spines(x * 0.95, -38, x, -3, 8, x < 0 ? -1 : x > 0 ? 1 : (op > 0.5 ? 1 : -1)); });
  /* olhos */
  eye(c, -2.6, -29, 1.5, 1.3, -0.2); eye(c, 2.8, -29.2, 1.5, 1.3, 0.2);
  ln(c, [-4.6, -31.8, -1, -30.8], OUT, 1.3); ln(c, [4.8, -32, 1.2, -30.9], OUT, 1.3);
  /* flor de cima: botão amarelo, o resto de cor */
  cel(c, function (c) { el(c, 0.6, -42.2, 2.2, 1.6); }, '#e3c25a', { k: 0.6, lw: 1.3 });
  dot(c, 0.2, -42.6, 0.6, '#fff4c0');
  arm(1, -13, 0, 11, -17);
  c.restore();
  /* leque de espinhos disparado */
  if (fire > 0) {
    c.save(); c.globalAlpha = 0.5 + fire * 0.5;
    for (i = 0; i < 5; i++) {
      var a = -0.62 + i * 0.31, d = 12 + fire * 14, x = 6 + Math.cos(a) * d, y = -26 + Math.sin(a) * d;
      ln(c, [x - Math.cos(a) * 7, y - Math.sin(a) * 7, x - Math.cos(a) * 2, y - Math.sin(a) * 2], 'rgba(255,220,100,.55)', 1.4);
      c.save(); c.translate(x, y); c.rotate(a);
      cel(c, function (c) { poly(c, [-3.4, -1.1, 4, 0, -3.4, 1.1]); }, '#fff3c8', { k: 0, lw: 0.9, out: '#5a4020' });
      c.restore();
    }
    glow(c, 7, -26, 2.4, 2.4, 'rgba(255,240,180,.9)', YEL, 10);
    c.restore();
  }
}

/* ---------------- bode-preto ---------------- */
/* move: trote. atk: abaixa a cabeça, raspa a pata, chifres para a frente (o último quadro serve para a corrida) */
export function drawBode(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk', w = mv ? k * TAU : 0, hl = at ? sm(k / 0.7) : 0, sc = at ? Math.sin(k * PI * 2.5) : 0,
    B = '#59534f', B2 = '#46413e', B3 = '#38332f', HN = '#a39a88', HN2 = '#857c6c', i,
    bob = mv ? Math.abs(Math.sin(w)) * 1.2 : 0, cr = hl * 1.6;
  c.save(); c.translate(0, -bob);
  function leg(hx, hy, ph, far, front) {
    var s = mv ? Math.sin(w + ph) : 0, up = mv ? Math.max(0, Math.cos(w + ph)) * 3.4 : 0, fx = hx + s * 5, fy = -up + bob;
    if (at) { fx = hx + (front ? 2.6 * hl : -1.6 * hl); if (front && !far) { fx += sc * 3.6 * hl - 1; fy = -Math.max(0, sc) * 2.4 * hl; } }
    var col = far ? B3 : B2, kn = limb(c, hx, hy + cr * (front ? 1.2 : 0.4), fx, fy - 2, 8.6, 8.6, front ? 1 : -1, 2.3, 1.5, col, col, { k: 0.8, lw: 1.8 });
    cel(c, function (c) { poly(c, [fx - 1.4, fy - 2.6, fx + 1.6, fy - 2.6, fx + 2.2, fy, fx - 1.6, fy]); }, '#221c1a', { k: 0, lw: 1.4 });
  }
  leg(-9, -18, PI, true, false); leg(6.4, -18, 0, true, true);
  /* rabinho */
  cel(c, function (c) { c.moveTo(-13, -23); c.quadraticCurveTo(-17, -27 - (mv ? Math.sin(w * 2) : 0), -16, -30); c.quadraticCurveTo(-14, -27, -12, -25); c.closePath(); }, B2, { k: 0.6, lw: 1.6 });
  /* corpo magro, costelas aparecendo */
  c.save(); c.translate(0, cr * 0.5); c.rotate(hl * 0.06);
  cel(c, function (c) { c.moveTo(-14, -21); c.bezierCurveTo(-14, -28, -4, -28.4, 4, -27.4); c.bezierCurveTo(9, -27, 11, -24, 10.6, -19); c.bezierCurveTo(9.6, -14.6, 6, -14.6, 2, -15.6); c.quadraticCurveTo(-4, -17.6, -10, -15); c.bezierCurveTo(-13, -15, -14.4, -17, -14, -21); c.closePath(); }, B, {
    k: 2, lw: 2, inn: function (c) {
      for (i = 0; i < 4; i++) { c.beginPath(); c.arc(-1 + i * 2.6, -26 + i * 0.2, 8, 1.2, 1.9); c.strokeStyle = 'rgba(24,20,18,.5)'; c.lineWidth = 0.9; c.stroke(); }
      c.fillStyle = 'rgba(200,190,176,.16)'; c.beginPath(); c.ellipse(-3, -26.4, 9, 1.4, 0, 0, TAU); c.fill();
      /* pelo desgrenhado */
      for (i = 0; i < 7; i++) ln(c, [-12 + i * 3, -16.6 + (i % 2), -13 + i * 3, -14.4 + (i % 2)], 'rgba(24,20,18,.5)', 0.9);
    },
  });
  c.restore();
  leg(-10.6, -17.4, 0, false, false);
  /* pescoço e cabeça: abaixam no ataque */
  c.save(); c.translate(6.4, -23 + cr * 0.5); c.rotate(hl * 0.75);
  cel(c, function (c) { c.moveTo(-3.6, 3); c.quadraticCurveTo(-2.6, -6, 4, -9.6); c.lineTo(8.6, -6.4); c.quadraticCurveTo(4, -2, 4, 4); c.closePath(); }, B, { k: 1.4, lw: 1.9 });
  /* sino de latão: o resto de cor */
  ln(c, [-1, 0.6, 2.4, 3.2], '#2a2220', 1.2);
  c.save(); c.translate(2.4, 3.2 + (mv ? Math.sin(w * 2) * 0.4 : 0)); c.rotate(mv ? Math.sin(w * 2) * 0.3 : -hl * 0.9);
  cel(c, function (c) { c.moveTo(-1.6, 0); c.lineTo(-2.2, 3.6); c.lineTo(2.2, 3.6); c.lineTo(1.6, 0); c.closePath(); }, '#e2b93a', { k: 0.6, lw: 1.3, hi: 'rgba(255,250,200,.5)' });
  dot(c, 0, 4.2, 0.7, OUT);
  c.restore();
  /* cabeça comprida */
  c.save(); c.translate(6, -9.4); c.rotate(0.5 + (mv ? Math.sin(w * 2) * 0.03 : 0) + hl * 0.5);
  /* chifre de trás */
  var HR = bz(-1, -3, -4, -10, -12, -11, -12.4, -5.6, 9, 1.9, 0.7);
  cel(c, tube(HR), HN2, { k: 0.7, lw: 1.6, inn: function (c) { for (i = 1; i < 9; i++) ln(c, [HR[i][0] - 1.6, HR[i][1] - 0.6, HR[i][0] + 1.6, HR[i][1] + 0.8], 'rgba(40,34,28,.5)', 0.7); } });
  /* orelha caída */
  cel(c, function (c) { c.moveTo(-1, -1.6); c.quadraticCurveTo(-6, -1, -8.6, 1.8); c.quadraticCurveTo(-5, 1.8, -0.6, 0.6); c.closePath(); }, B2, { k: 0.6, lw: 1.5 });
  /* barbicha */
  cel(c, function (c) { c.moveTo(6.6, 2.2); c.quadraticCurveTo(6.6, 6, 5.4, 8.6); c.quadraticCurveTo(4.2, 6, 4.2, 2.6); c.closePath(); }, '#7a726a', { k: 0.5, lw: 1.4, inn: function (c) { ln(c, [5.4, 3, 5.2, 7], 'rgba(30,24,22,.5)', 0.7); } });
  cel(c, function (c) { c.moveTo(-2.4, -3); c.bezierCurveTo(1, -5.4, 5, -3.6, 9, -0.6); c.quadraticCurveTo(10.6, 1, 9.4, 2.4); c.quadraticCurveTo(5, 3.6, 0.6, 2.6); c.quadraticCurveTo(-3, 1.6, -2.4, -3); c.closePath(); }, B, {
    k: 1.4, lw: 1.9, inn: function (c) { dot(c, 9, 0.4, 0.5, OUT); ln(c, [6.4, 2, 9.2, 1.8], 'rgba(20,16,14,.6)', 0.8); c.fillStyle = 'rgba(200,190,176,.18)'; c.beginPath(); c.ellipse(4, -2.6, 4, 1, 0.3, 0, TAU); c.fill(); },
  });
  eye(c, 2.6, -2, 1.3, 0.95, 0.3);
  ln(c, [0.8, -3.6, 4.6, -3], OUT, 1.2);
  /* chifre da frente, torcido */
  var HF = bz(0.6, -3.4, -1.4, -11.4, -9.6, -13.4, -10.4, -7, 10, 2.1, 0.8);
  cel(c, tube(HF), HN, { k: 0.8, lw: 1.7, inn: function (c) { for (i = 1; i < 10; i++) ln(c, [HF[i][0] - 1.8, HF[i][1] - 0.4, HF[i][0] + 1.6, HF[i][1] + 1], 'rgba(60,50,40,.5)', 0.8); } });
  c.restore();
  c.restore();
  leg(5, -17.6, PI, false, true);
  /* poeira da pata raspando */
  if (at && hl > 0.2) for (i = 0; i < 3; i++) puff(c, 4 - i * 3.6 - hl * 2, -1.2 - i * 0.8, 1.2 + i * 0.6, 0.55 * hl - i * 0.1, '#d8c39a');
  c.restore();
}

/* ---------------- urubu ---------------- */
/* voa: move = planando, asas abertas em V. atk = asas para cima chamando raios (faíscas nas penas) */
export function drawUrubu(c, anim, k) {
  var at = anim === 'atk', w = k * TAU, ra = at ? sm(k / 0.7) : 0, zap = at ? cl((k - 0.34) / 0.66) : 0,
    F = '#57524e', F2 = '#433e3b', F3 = '#36312e', SK = '#a39b92', i,
    by = -30 + (at ? -ra * 3 : Math.cos(w) * 1.4), fl = at ? 0 : Math.sin(w + 1) * 0.07, bank = at ? 0 : Math.sin(w) * 0.06;
  c.save(); c.translate(0, by); c.rotate(bank);
  /* vista de cima: asas abertas para os lados (uma para cima, outra para baixo da tela) */
  function wing(far) {
    var L = far ? 25 : 27, a = far ? -PI / 2 - lp(0.28, 0.5, ra) - fl : -PI / 2 + lp(0.3, 0.42, ra) + fl, sx = far ? lp(0.84, 1, ra) : lp(-1, 1, ra),
      col = far ? F3 : F, col2 = far ? '#2b2724' : F2, tip = far ? '#6a645e' : '#857e76';
    if (Math.abs(sx) < 0.2) sx = sx < 0 ? -0.2 : 0.2;
    c.save(); c.translate(far ? 0.6 : -0.6, far ? -2.4 : 1.6); c.rotate(a); c.scale(sx, 1);
    function shape(c) {
      c.moveTo(-3, 5.4); c.lineTo(L * 0.5, 6.6); c.quadraticCurveTo(L * 0.78, 6.4, L * 0.84, 4.4);
      for (var j = 0; j < 6; j++) { var y = 3.4 - j * 2.3, tx = L * (1.02 + 0.05 * Math.sin(j * 1.7)); c.lineTo(tx, y); c.quadraticCurveTo(tx + 0.8, y - 0.9, tx - 0.4, y - 1.4); c.lineTo(L * 0.84, y - 1.9); }
      for (var j = 0; j < 6; j++) { var x = L * (0.78 - j * 0.13); c.lineTo(x, -9.6 - (j % 2) * 1.3); c.lineTo(x - L * 0.06, -8.6); }
      c.lineTo(-3, -6.4); c.closePath();
    }
    cel(c, shape, col, {
      k: 1.6, lw: 1.9, inn: function (c) {
        c.fillStyle = col2; c.beginPath(); c.moveTo(-3, 5.4); c.lineTo(L * 0.6, 6.4); c.lineTo(L * 0.62, 0.6); c.lineTo(-3, 0); c.closePath(); c.fill();
        c.fillStyle = tip; c.globalAlpha = 0.55; c.fillRect(L * 0.84, -10, L * 0.3, 15); c.globalAlpha = 1;
        for (var j = 0; j < 7; j++) ln(c, [L * (0.72 - j * 0.12), 0.4, L * (0.76 - j * 0.12), -9], 'rgba(10,8,8,.45)', 0.8);
        for (var j = 0; j < 5; j++) ln(c, [L * 0.72, 2.4 - j * 2.3, L * 0.96, 2.2 - j * 2.4], 'rgba(10,8,8,.5)', 0.8);
        ln(c, [-2, 0.4, L * 0.62, 0.6], 'rgba(200,190,176,.18)', 1.2);
      },
    });
    if (zap > 0) {
      for (var j = 0; j < 4; j++) {
        var y = 3.4 - j * 3, tx = L * 1.05;
        spark(c, tx + 1.6, y, ((j % 2) + 1.6) * zap + 0.4, YEL);
        if (j < 3) bolt(c, tx - 1, y, tx - 7 - j * 2, y - 3.6, 31 + j * 7 + (far ? 50 : 0) + Math.round(k * 9), 3, 0.75, zap);
      }
    }
    c.restore();
  }
  wing(true);
  /* rabo curto em leque */
  cel(c, function (c) { c.moveTo(-9, -2.6); c.lineTo(-17, -4.4); c.quadraticCurveTo(-19.4, 0, -17, 4.4); c.lineTo(-9, 2.6); c.closePath(); }, F2, { k: 0.8, lw: 1.7, inn: function (c) { [-2.4, 0, 2.4].forEach(function (d) { ln(c, [-10, d * 0.5, -17.4, d * 1.4], 'rgba(10,8,8,.5)', 0.7); }); } });
  /* corpo */
  cel(c, function (c) { el(c, -1.4, 0, 10.6, 6, 0); }, F, { k: 1.8, lw: 2, inn: function (c) { c.fillStyle = 'rgba(200,190,176,.16)'; c.beginPath(); c.ellipse(-1, -3.4, 7, 1.6, 0, 0, TAU); c.fill(); for (i = 0; i < 5; i++) ln(c, [-8 + i * 3, -1.6, -6.6 + i * 3, 2.6], 'rgba(10,8,8,.4)', 0.8); } });
  wing(false);
  /* colar de penas e pescoço pelado */
  cel(c, function (c) { el(c, 8.4, -0.6, 3.6, 4.6, 0); }, F2, { k: 0.8, lw: 1.7, inn: function (c) { for (i = 0; i < 4; i++) ln(c, [6.6 + i * 0.8, -4 + i * 2.2, 9.6 + i * 0.6, -3.4 + i * 2.2], 'rgba(10,8,8,.4)', 0.7); } });
  c.save(); c.translate(10.4, -1.6); c.rotate(at ? -0.4 * ra : 0.05 + Math.sin(w) * 0.05);
  cel(c, function (c) { cap(c, -0.6, 0.6, 2.6, -0.4, 1.9); }, SK, { k: 0.6, lw: 1.5 });
  /* cabeça pelada, enrugada, bico em gancho; abre no chamado */
  cel(c, function (c) { c.moveTo(6.6, -1.6); c.quadraticCurveTo(9.8, -1.8, 10, 1.4); c.quadraticCurveTo(9.6, 2.8, 8.6, 1.6); c.quadraticCurveTo(7.8, 0.8 + ra * 1.6, 6.4, 1.2 + ra * 1.6); c.closePath(); }, '#ddd6c6', { k: 0.5, lw: 1.4 });
  cel(c, function (c) { el(c, 3.8, -0.4, 3.8, 3.1, 0.1); }, SK, {
    k: 1, lw: 1.7, inn: function (c) { ln(c, [1.2, 0.9, 3, 1.7], 'rgba(40,34,30,.55)', 0.7); ln(c, [1, -1, 2.2, -2.5], 'rgba(40,34,30,.5)', 0.7); ln(c, [4.4, 1.6, 5.8, 2.1], 'rgba(40,34,30,.5)', 0.7); },
  });
  dot(c, 6.8, -0.5, 0.4, OUT);
  eye(c, 4.2, -1.2, 1.15, 1, 0);
  ln(c, [2.4, -2.7, 5.6, -2.3], OUT, 1.1);
  c.restore();
  c.restore();
  /* raios convocados acima das asas */
  if (zap > 0.5) {
    var z = (zap - 0.5) * 2;
    bolt(c, -6, by - 30, -2, by - 44, 77 + Math.round(k * 5), 5, 1.5, z);
    bolt(c, 4, by - 28, 10, by - 40, 91 + Math.round(k * 5), 4, 1.1, z * 0.8);
    glow(c, -1, by - 28, 3.6 * z, 3.6 * z, 'rgba(255,250,210,.9)', YEL, 12);
  }
}
