// @ts-nocheck
/* Companheiros do Capítulo 4 (Lobo-guará e Tamanduá-bandeira), o fogo do chão e a touceira de capim.
   Coloridos e simpáticos. Virados para a direita, pés na origem, y negativo para cima. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, EMB, EMB2, FIRE, FIRE_G, cl, lp, sm, rope, bz, tube, limb, flamePath, flame, fire, halo, spark, puff, rng } from './ch4_util';

/* ---------------- lobo-guará ---------------- */
/* idle · walk (passo de lobo-guará: as duas pernas do mesmo lado juntas) · act: corrida com rastro de fogo */
export function drawLoboguara(c, anim, k) {
  var ph = k * TAU, wk = anim === 'walk', ac = anim === 'act', i,
    CO = '#d4682c', CO2 = '#b4521f', CL = '#eb9a5c', BK = '#2a201c', BK2 = '#3a2e28', WH = '#f6eee0';
  var w = wk ? ph : 0, b = wk ? -Math.abs(Math.sin(w)) * 1.4 : Math.sin(ph) * .4, A = ac ? -.08 - k * .06 : 0, run = ac ? .4 + k * .6 : 0;
  var PX = 0, PY = -36, ca = Math.cos(A), sa = Math.sin(A);
  function T(x, y) { var dx = x - PX, dy = y - PY; return [PX + dx * ca - dy * sa, PY + dx * sa + dy * ca + b + run * 3]; }
  function footAt(base, p) {
    if (wk) { var s = Math.sin(w + p); return [base + s * 9, -Math.max(0, Math.cos(w + p)) * 6]; }
    if (ac) { var fr = base > 0; return p === 0 ? [base + (fr ? 16 : 8) * run, -run * (fr ? 10 : 4)] : [base - (fr ? 4 : 16) * run, -run * (fr ? 2 : 8)]; }
    return [base + (p === 0 ? 1.5 : -1.5), 0];
  }
  function leg(root, f, front, far) {
    var col = far ? BK : BK2, top = far ? CO2 : CO;
    var e = (function () { var dx = f[0] - root[0], dy = f[1] - 3 - root[1], d = Math.hypot(dx, dy), L = 36.6; return d <= L ? [f[0], f[1] - 3] : [root[0] + dx / d * L, root[1] + dy / d * L]; })();
    var kn = ik(root[0], root[1], e[0], e[1], 17, 20, front ? -1 : 1);
    cel(c, function (p) { cap(p, root[0], root[1], kn[0], kn[1], front ? 3.4 : 4.4); }, top, { k: 1, lw: 1.9, inn: function (p) { p.fillStyle = col; p.beginPath(); p.arc(kn[0], kn[1], 5, 0, TAU); p.fill(); } });
    cel(c, function (p) { cap(p, kn[0], kn[1], e[0], e[1], 2.3); }, col, { k: .6, lw: 1.8 });
    cel(c, function (p) { el(p, e[0] + 2, e[1] + 1.6, 3.6, 2); }, col, { k: 0, lw: 1.7 });
  }
  /* rastro de fogo da corrida */
  if (ac) {
    for (i = 0; i < 4; i++) { var s = (1 - i * .2) * (.5 + k * .5); fire(c, -30 - i * 11, 0, 14 * s, 26 * s, ph + i * 1.7 + k * 3, FIRE, 3, true, -.5); }
    halo(c, -44, -10, 34, '255,140,40', .3 + k * .2);
    for (i = 0; i < 3; i++) ln(c, [-26 - i * 6, -44 + i * 9, -42 - i * 8, -44 + i * 9], 'rgba(255,240,200,.6)', 1.6);
  }
  leg(T(-12, -36), footAt(-11, wk ? PI : 1), false, true); leg(T(13, -37), footAt(14, wk ? PI : 1), true, true);
  c.save(); c.translate(PX, PY + b + run * 3); c.rotate(A); c.translate(-PX, -PY);
  /* rabo cheio, ponta branca */
  var ts = wk ? Math.sin(w * 2) * .12 : ac ? -.9 : Math.sin(ph) * .15;
  c.save(); c.translate(-19, -41); c.rotate(ts);
  cel(c, function (p) { p.moveTo(0, -3); p.bezierCurveTo(-8, -2, -12, 6, -11, 16); p.quadraticCurveTo(-7, 20, -4, 15); p.bezierCurveTo(-3, 8, 2, 4, 3, 3); p.closePath(); }, CO, { k: 1.4, lw: 2, inn: function (p) { p.fillStyle = WH; p.beginPath(); p.ellipse(-8, 15, 5, 4.4, .3, 0, TAU); p.fill(); ln(p, [-2, 0, -8, 8], CO2, 1); } });
  c.restore();
  /* corpo */
  cel(c, function (p) { p.moveTo(-20, -40); p.bezierCurveTo(-14, -48, 6, -46, 16, -47); p.bezierCurveTo(22, -46, 23, -38, 18, -33); p.bezierCurveTo(8, -30, -10, -30, -16, -33); p.quadraticCurveTo(-21, -35, -20, -40); p.closePath(); }, CO, {
    k: 2, inn: function (p) { p.fillStyle = CL; p.beginPath(); p.ellipse(0, -32, 14, 2.6, 0, 0, TAU); p.fill(); p.fillStyle = 'rgba(140,60,20,.35)'; p.beginPath(); p.ellipse(-4, -46, 16, 2.6, 0, 0, TAU); p.fill(); },
  });
  /* juba preta no pescoço */
  cel(c, function (p) { p.moveTo(4, -46); p.quadraticCurveTo(12, -54, 20, -58); p.lineTo(24, -52); p.quadraticCurveTo(18, -46, 14, -40); p.quadraticCurveTo(9, -42, 4, -46); p.closePath(); }, BK, { k: .8, lw: 1.9 });
  for (i = 0; i < 4; i++) { var mx = 6 + i * 4, my = -48 - i * 3; cel(c, function (p) { poly(p, [mx - 2, my + 1, mx - 1, my - 5, mx + 2, my]); }, BK, { k: 0, lw: 1.3 }); }
  /* pescoço e cabeça */
  var hb = wk ? Math.sin(w * 2) * .8 : ac ? 4 : 0, hx = 26 + (ac ? 4 : 0), hy = -56 + hb + (ac ? 6 : 0);
  cel(c, function (p) { p.moveTo(14, -42); p.quadraticCurveTo(17, -52, hx - 4, hy + 2); p.lineTo(hx + 2, hy + 6); p.quadraticCurveTo(22, -46, 19, -36); p.closePath(); }, CO, { k: 1.2, lw: 1.9, inn: function (p) { p.fillStyle = WH; p.beginPath(); p.ellipse(hx - 1, hy + 7, 3, 5, .4, 0, TAU); p.fill(); } });
  /* orelhas enormes */
  [[-3.6, -1, CO2], [1.4, 0, CO]].forEach(function (q) { cel(c, function (p) { poly(p, [hx + q[0] - 2.4, hy - 3, hx + q[0] - 1 - (ac ? 4 : 0), hy - 17 + (ac ? 3 : 0), hx + q[0] + 3.4, hy - 4]); }, q[2], { k: .8, lw: 1.8, inn: function (p) { p.fillStyle = WH; p.beginPath(); poly(p, [hx + q[0] - 1, hy - 4, hx + q[0] - .6 - (ac ? 3 : 0), hy - 13 + (ac ? 2 : 0), hx + q[0] + 1.8, hy - 4.6]); p.fill(); } }); });
  cel(c, function (p) { p.moveTo(hx - 6, hy - 1); p.quadraticCurveTo(hx - 5, hy - 6.4, hx, hy - 6); p.quadraticCurveTo(hx + 4, hy - 5, hx + 7, hy - 2.4); p.lineTo(hx + 13, hy - .6); p.quadraticCurveTo(hx + 14, hy + 2, hx + 12, hy + 2.6); p.quadraticCurveTo(hx + 4, hy + 4.4, hx - 3, hy + 3); p.quadraticCurveTo(hx - 7, hy + 2, hx - 6, hy - 1); p.closePath(); }, CO, {
    k: 1.4, lw: 2, inn: function (p) { p.fillStyle = BK; p.beginPath(); p.moveTo(hx + 6, hy - 2.6); p.lineTo(hx + 14, hy - 1); p.lineTo(hx + 13, hy + 3); p.lineTo(hx + 5, hy + 3.6); p.closePath(); p.fill(); p.fillStyle = WH; p.beginPath(); p.ellipse(hx + 1, hy + 2.4, 3.4, 1.4, 0, 0, TAU); p.fill(); },
  });
  dot(c, hx + 13.2, hy - .8, 1.2, '#100c0a');
  dot(c, hx + 2, hy - 2, 1.7, '#1c120c'); dot(c, hx + 2.6, hy - 2.6, .6, '#fff');
  ln(c, [hx - .6, hy - 4.6, hx + 4, hy - 4.2], BK, 1);
  if (!ac) { c.beginPath(); c.moveTo(hx + 7, hy + 3); c.quadraticCurveTo(hx + 9, hy + 4.4, hx + 11.6, hy + 3); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
  else { c.beginPath(); c.moveTo(hx + 6, hy + 3); c.lineTo(hx + 12, hy + 3.4); c.lineTo(hx + 9, hy + 6); c.closePath(); c.fillStyle = '#b02a2a'; c.fill(); }
  c.restore();
  leg(T(-12, -36), footAt(-13, 0), false, false); leg(T(13, -37), footAt(12, 0), true, false);
}

/* ---------------- tamanduá-bandeira ---------------- */
/* idle · walk (anda sobre os nós dos dedos) · act: abraço, de pé com os braços abertos */
export function drawTamandua(c, anim, k) {
  var ph = k * TAU, wk = anim === 'walk', ac = anim === 'act' ? sm(k) : 0, i,
    FU = '#8c7a66', FU2 = '#76654f', FL = '#a8977f', BK = '#2a2420', WH = '#f2ebdc', ARM = '#e2d9c6', HL = '#4a3e36', TL = '#5e4e42', TL2 = '#4a3c32';
  var w = wk ? ph : 0, b = wk ? -Math.abs(Math.sin(w)) * 1 : Math.sin(ph) * .4;
  var PX = -14, PY = -18, A = -ac * 1.18, ca = Math.cos(A), sa = Math.sin(A);
  function T(x, y) { var dx = x - PX, dy = y - PY; return [PX + dx * ca - dy * sa, PY + dx * sa + dy * ca + b]; }
  function footAt(base, p) { if (wk) { var s = Math.sin(w + p); return [base + s * 7, -Math.max(0, Math.cos(w + p)) * 4]; } return [base, 0]; }
  function hind(root, f, far) {
    var e = (function () { var dx = f[0] - root[0], dy = f[1] - 2 - root[1], d = Math.hypot(dx, dy), L = 19.6; return d <= L ? [f[0], f[1] - 2] : [root[0] + dx / d * L, root[1] + dy / d * L]; })();
    var kn = ik(root[0], root[1], e[0], e[1], 10, 10, 1);
    cel(c, function (p) { cap(p, root[0], root[1], kn[0], kn[1], 5.6); }, far ? '#3a302a' : HL, { k: 1.2, lw: 2 });
    cel(c, function (p) { cap(p, kn[0], kn[1], e[0], e[1], 3.6); }, far ? '#3a302a' : HL, { k: .8, lw: 1.9 });
    cel(c, function (p) { el(p, e[0] + 1.6, e[1] + 1, 5, 2.4); }, far ? '#2a2420' : BK, { k: 0, lw: 1.7 });
  }
  /* braço da frente: claro com pulseira preta e garras dobradas */
  function arm(root, f, far, open) {
    var e = (function () { var dx = f[0] - root[0], dy = f[1] - root[1], d = Math.hypot(dx, dy), L = 21.6; return d <= L ? [f[0], f[1]] : [root[0] + dx / d * L, root[1] + dy / d * L]; })();
    var kn = ik(root[0], root[1], e[0], e[1], 11, 11, open ? 1 : -1), col = far ? '#c9bfab' : ARM;
    cel(c, function (p) { cap(p, root[0], root[1], kn[0], kn[1], 5.4); }, col, { k: 1.2, lw: 2 });
    cel(c, function (p) { cap(p, kn[0], kn[1], e[0], e[1], 4.2); }, col, { k: 1, lw: 2, inn: function (p) { var a0 = Math.atan2(e[1] - kn[1], e[0] - kn[0]), mx = lp(kn[0], e[0], .62), my = lp(kn[1], e[1], .62); p.save(); p.translate(mx, my); p.rotate(a0); p.fillStyle = BK; p.fillRect(-2.2, -6, 4.4, 12); p.restore(); } });
    var a = Math.atan2(e[1] - kn[1], e[0] - kn[0]);
    [-1, 0, 1].forEach(function (d) { var cx = e[0] + Math.cos(a) * 3, cy = e[1] + Math.sin(a) * 3, ex = cx + Math.cos(a + d * .3 + (open ? 0 : -.9)) * 5, ey = cy + Math.sin(a + d * .3 + (open ? 0 : -.9)) * 5; ln(c, [cx, cy, ex, ey], OUT, 2.8); ln(c, [cx, cy, ex, ey], '#e8dcc0', 1.3); });
  }
  /* rabo-bandeira */
  var tsw = wk ? Math.sin(w) * .06 : Math.sin(ph) * .05;
  var tr = T(-22, -24);
  c.save(); c.translate(tr[0], tr[1]); c.rotate(tsw + ac * .9);
  cel(c, function (p) { p.moveTo(2, -6); p.bezierCurveTo(-10, -18, -26, -24, -34, -20); p.lineTo(-38, -14); p.lineTo(-33, -12); p.lineTo(-37, -6); p.lineTo(-30, -5); p.lineTo(-33, 1); p.bezierCurveTo(-20, 6, -6, 6, 2, 4); p.closePath(); }, TL, {
    k: 2, lw: 2.2, inn: function (p) { for (var j = 0; j < 7; j++) { p.beginPath(); p.moveTo(-2 - j * 2, -2 + j * .3); p.quadraticCurveTo(-16 - j, -10 + j * 2, -32 + j * .5, -16 + j * 2.6); p.strokeStyle = j % 2 ? 'rgba(30,22,18,.4)' : 'rgba(160,140,120,.3)'; p.lineWidth = 1; p.stroke(); } },
  });
  c.restore();
  var Sw = T(12, -22), Hw = T(-12, -16);
  hind(T(-10, -16), ac ? [-6, 0] : footAt(-9, wk ? PI : 0), true);
  arm(T(6, -20), ac ? [Sw[0] - 18, Sw[1] - 12] : footAt(9, 0), true, ac > .5);
  c.save(); c.translate(PX, PY + b); c.rotate(A); c.translate(-PX, -PY);
  /* corpo */
  cel(c, function (p) { p.moveTo(-24, -20); p.bezierCurveTo(-24, -32, -8, -38, 6, -36); p.bezierCurveTo(16, -35, 20, -30, 22, -26); p.lineTo(22, -14); p.bezierCurveTo(10, -10, -10, -9, -18, -12); p.quadraticCurveTo(-25, -14, -24, -20); p.closePath(); }, FU, {
    k: 2.4, inn: function (p) {
      for (var j = 0; j < 10; j++) ln(p, [-20 + j * 4, -32 + (j % 2) * 2, -22 + j * 4, -24 + (j % 2) * 2], 'rgba(50,40,30,.3)', 1);
      /* faixa preta debruada de branco */
      p.beginPath(); p.moveTo(22, -20); p.quadraticCurveTo(8, -26, -6, -38); p.lineTo(4, -38); p.quadraticCurveTo(14, -30, 22, -27); p.closePath(); p.fillStyle = BK; p.fill();
      p.beginPath(); p.moveTo(22, -27); p.quadraticCurveTo(14, -30, 4, -38); p.strokeStyle = WH; p.lineWidth = 2; p.stroke();
      p.beginPath(); p.moveTo(22, -19); p.quadraticCurveTo(8, -25, -7, -37); p.stroke();
      p.fillStyle = FL; p.beginPath(); p.ellipse(-2, -12, 14, 2.6, 0, 0, TAU); p.fill();
    },
  });
  /* cabeça: focinho comprido */
  var hs = wk ? Math.sin(w * 2) * 1 : Math.sin(ph + 1) * 1.2, SN = bz(16, -27, 26, -28 + hs * .3, 34, -24 + hs * .6, 43, -19 + hs, 7, 7.4, 2.1);
  cel(c, tube(SN), FL, { k: 1.4, lw: 2, inn: function (p) { p.fillStyle = 'rgba(70,56,44,.3)'; p.beginPath(); p.ellipse(28, -22 + hs * .5, 14, 2, .2, 0, TAU); p.fill(); } });
  dot(c, SN[7][0] + 1.4, SN[7][1] + .2, 1.6, BK);
  if (!wk && !ac && Math.sin(ph) > .5) { ln(c, [SN[7][0] + 1, SN[7][1] + 1, SN[7][0] + 7, SN[7][1] + 4], OUT, 2); ln(c, [SN[7][0] + 1, SN[7][1] + 1, SN[7][0] + 7, SN[7][1] + 4], '#e86a8a', 1); }
  cel(c, function (p) { el(p, 15, -31, 2.8, 2.6); }, FU2, { k: .6, lw: 1.6 });
  dot(c, 22, -28.6, 1.6, '#1c120c'); dot(c, 22.5, -29.2, .6, '#fff');
  if (ac > .7) { c.beginPath(); c.arc(22, -27.6, 2.4, PI * 1.15, PI * 1.85); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke(); }
  c.restore();
  hind(T(-16, -15), ac ? [-20, 0] : footAt(-14, wk ? 0 : PI), false);
  arm(T(9, -21), ac ? [Sw[0] + 14 - ac * 2, Sw[1] - 16] : footAt(13, wk ? PI : 0), false, ac > .5);
  /* coraçãozinho do abraço */
  if (ac > .9) {
    var hx = Sw[0] + 4, hy = Sw[1] - 34;
    c.beginPath(); c.moveTo(hx, hy + 4); c.bezierCurveTo(hx - 7, hy - 1, hx - 3, hy - 7, hx, hy - 3); c.bezierCurveTo(hx + 3, hy - 7, hx + 7, hy - 1, hx, hy + 4); c.closePath(); c.fillStyle = '#ff6a8a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.6; c.stroke();
    dot(c, hx - 2.4, hy - 2.6, .9, '#ffe0e8');
  }
}

/* ---------------- fogo no chão (fx) ---------------- */
export function drawChama(c, anim, k) {
  var ph = k * TAU, i;
  halo(c, 0, -14, 38, '255,140,40', .45);
  c.beginPath(); c.ellipse(0, 0, 22, 5.6, 0, 0, TAU); c.fillStyle = 'rgba(40,16,8,.55)'; c.fill();
  [[-9, .3], [6, -.4], [-1, .9]].forEach(function (q) { cel(c, function (p) { cap(p, q[0] - 8, -1 + q[1], q[0] + 8, -2 - q[1], 2.4); }, '#3a2018', { k: 0, lw: 1.6, inn: function (p) { ln(p, [q[0] - 6, -1.6, q[0] + 5, -2.4], EMB, 1.2); } }); });
  fire(c, 0, -1, 28, 50 + Math.sin(ph) * 4, ph, FIRE, 5, true, Math.sin(ph) * .12);
  for (i = 0; i < 5; i++) { var u = (k + i / 5) % 1; dot(c, Math.sin(u * 8 + i * 2.3) * 10 + (i - 2) * 3, -40 - u * 22, 1.6 * (1 - u) + .3, 'rgba(255,' + (180 + i * 12) + ',80,' + (1 - u) + ')'); }
}

/* ---------------- touceira de capim seco, vista de cima (tex 96×96, centrada) ---------------- */
export function drawCapim(c) {
  var R = rng(4096), cx = 48, cy = 48, i, B = [];
  var g = c.createRadialGradient(cx + 3, cy + 4, 4, cx + 3, cy + 4, 34); g.addColorStop(0, 'rgba(40,24,10,.45)'); g.addColorStop(1, 'rgba(40,24,10,0)');
  c.fillStyle = g; c.beginPath(); c.arc(cx + 3, cy + 4, 34, 0, TAU); c.fill();
  for (i = 0; i < 46; i++) { var a = (i / 46) * TAU + (R() - .5) * .3, L = 22 + R() * 20, bend = (R() - .5) * .7; B.push([a, L, bend, i % 4]); }
  B.sort(function (p, q) { return p[1] - q[1]; });
  var COL = ['#d9ae4a', '#c4953a', '#e8c872', '#a87a2c'];
  function blade(q, pass) {
    var a = q[0], L = q[1], bd = q[2], x0 = cx + Math.cos(a) * 3, y0 = cy + Math.sin(a) * 3, mx = cx + Math.cos(a + bd * .5) * L * .55, my = cy + Math.sin(a + bd * .5) * L * .55, ex = cx + Math.cos(a + bd) * L, ey = cy + Math.sin(a + bd) * L;
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, ex, ey); c.lineCap = 'round';
    if (pass === 0) { c.strokeStyle = 'rgba(60,34,10,.85)'; c.lineWidth = 4.2; } else { c.strokeStyle = COL[q[3]]; c.lineWidth = 2.2; }
    c.stroke();
  }
  B.forEach(function (q) { blade(q, 0); }); B.forEach(function (q) { blade(q, 1); });
  /* hastes com as flores douradas (capim-dourado) */
  for (i = 0; i < 7; i++) { var a2 = R() * TAU, L2 = 26 + R() * 14, ex = cx + Math.cos(a2) * L2, ey = cy + Math.sin(a2) * L2; ln(c, [cx, cy, ex, ey], 'rgba(60,34,10,.8)', 2.2); ln(c, [cx, cy, ex, ey], '#f0d27a', 1); dot(c, ex, ey, 2.6, '#5a3a10'); dot(c, ex, ey, 1.8, '#ffd84a'); dot(c, ex - .5, ey - .5, .7, '#fff6c8'); }
  dot(c, cx, cy, 5, '#7a5420'); dot(c, cx, cy, 3, '#a87a2c');
}
