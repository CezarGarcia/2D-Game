// @ts-nocheck
/* Chefes do Capítulo 4: Mula-sem-Cabeça (elite) e Boitatá (chefão: cabeça, gomo e cauda).
   Virados para a direita, pés/base na origem, y negativo para cima. Assinatura: draw(ctx, anim, k[, opções]). */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, EYE, EYEG, EMB, EMB2, FIRE, FIRE_P, FIRE_B, FIRE_G, cl, lp, sm, rope, bz, tube, tooth, limb, flamePath, flame, fire, halo, eye, spark, puff, mix } from './ch4_util';

/* ---------------- Mula-sem-Cabeça ---------------- */
/* idle · move (galope) · atk (empina e golpeia com as ferraduras) · cast (a labareda cresce e cospe fogo)
   down (deitada, fogo baixo) · special (galope em chamas, rastro de fogo) */
export function drawMula(c, anim, k) {
  var ph = k * TAU, fi = Math.round(k * 3), i,
    G1 = '#857c7a', G2 = '#6b6361', G3 = '#5a5250', BL = '#a69c98', HAIR = '#3d3636', HAIR2 = '#575050', HOOF = '#3a3434', SIL = '#e6edf4';
  var gal = anim === 'move' || anim === 'special', dn = anim === 'down', w = gal ? ph : 0;
  var A = 0, bob = 0, NA = 0, fm = 1, flean = 0;
  if (anim === 'idle') { bob = Math.sin(ph) * .7; flean = Math.sin(ph) * .08; }
  if (gal) { A = Math.sin(w + .6) * .055; bob = -Math.abs(Math.sin(w)) * 3.4 + 1.2; flean = anim === 'special' ? -.75 : -.35; fm = anim === 'special' ? 1.35 : 1; }
  if (anim === 'atk') { A = [-.2, -.46, -.58, -.12][fi]; bob = [0, -1, -2, -1][fi]; flean = [0, .1, .15, -.2][fi]; }
  if (anim === 'cast') { A = -.06 * sm(k); fm = 1 + sm(k) * 1.1; flean = .1 * k; NA = -.1 * k; }
  if (dn) { bob = 26 + Math.sin(ph) * .5; NA = .7; fm = .42 + Math.sin(ph) * .05; }
  var PX = -26, PY = -44, ca = Math.cos(A), sa = Math.sin(A);
  function T(x, y) { var dx = x - PX, dy = y - PY; return [PX + dx * ca - dy * sa, PY + dx * sa + dy * ca + bob]; }
  var SH = T(20, -44), HP = T(-26, -44);
  /* alvo dos pés */
  function gfoot(base, p) { var s = Math.sin(w + p), lift = Math.max(0, Math.cos(w + p)); return [base + s * 15, -lift * 12]; }
  function feet() {
    var F = {};
    if (gal) { F.hf = gfoot(-22, 0); F.hn = gfoot(-26, .7); F.ff = gfoot(24, 2.5); F.fn = gfoot(20, 3.2); }
    else if (anim === 'atk') {
      F.hf = [-20, 0]; F.hn = [-28, 0];
      var L = fi < 3 ? [[30, -24], [34, -26], [36, -28]][fi] : [50, -16], Lf = fi < 3 ? [[24, -20], [28, -22], [30, -24]][fi] : [46, -10];
      F.fn = T(L[0], L[1]); F.ff = T(Lf[0], Lf[1]);
    } else if (dn) { F.hf = F.hn = F.ff = F.fn = null; }
    else { var paw = anim === 'idle' ? Math.max(0, Math.sin(ph)) : 0; F.hf = [-20, 0]; F.hn = [-28, 0]; F.ff = [26, 0]; F.fn = [20 + paw * 3, -paw * 4]; }
    return F;
  }
  var F = feet();
  function hoof(e, ang, far) {
    c.save(); c.translate(e[0], e[1]); c.rotate(ang);
    cel(c, function (p) { poly(p, [-4.2, -6, 4.2, -6, 5.6, 0, -5, 0]); }, far ? '#2c2727' : HOOF, { k: .8, lw: 1.8 });
    /* ferradura de prata */
    c.beginPath(); c.moveTo(-5.6, -.4); c.lineTo(6, -.4); c.lineTo(6.2, 1.8); c.lineTo(-5.8, 1.8); c.closePath(); c.fillStyle = far ? '#b9c2cc' : SIL; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.3; c.stroke();
    dot(c, -2.6, .7, .55, '#7a8590'); dot(c, 3, .7, .55, '#7a8590'); ln(c, [-4.4, .1, 0, .1], 'rgba(255,255,255,.9)', .7);
    c.restore();
  }
  function leg(root, f, front, far) {
    var col = far ? G3 : G2, up = far ? G2 : G1, r1 = front ? 5.6 : 7, l1 = front ? 22 : 23, l2 = front ? 25 : 25;
    if (!f) return;
    var e = (function () { var dx = f[0] - root[0], dy = f[1] - 6 - root[1], d = Math.hypot(dx, dy), L = l1 + l2 - .4; return d <= L ? [f[0], f[1] - 6] : [root[0] + dx / d * L, root[1] + dy / d * L]; })();
    var kn = ik(root[0], root[1], e[0], e[1], l1, l2, front ? -1 : 1);
    cel(c, function (p) { cap(p, root[0], root[1], kn[0], kn[1], r1); }, up, { k: 1.4, lw: 2.1 });
    cel(c, function (p) { cap(p, kn[0], kn[1], e[0], e[1], 3.5); }, col, { k: 1, lw: 2, inn: function (p) { p.fillStyle = 'rgba(40,34,34,.35)'; p.beginPath(); p.arc(e[0], e[1] - 2, 4.4, 0, TAU); p.fill(); } });
    hoof([e[0], e[1] + 6], Math.atan2(e[1] - kn[1], e[0] - kn[0]) - PI / 2, far);
  }
  /* pernas dobradas (deitada) */
  function folded(x, far, front) {
    var y = -4;
    cel(c, function (p) { cap(p, x, y - 4, x + (front ? 12 : -10), y, 4.2); }, far ? G3 : G2, { k: 1, lw: 2 });
    hoof([x + (front ? 16 : -14), y + 4], front ? -PI / 2 : PI / 2, far);
  }
  /* rastro de fogo do galope em chamas */
  if (anim === 'special') {
    for (i = 0; i < 4; i++) { var tx = -48 - i * 13, sz = 1 - i * .2; fire(c, tx, 0, 18 * sz, 30 * sz, ph * 2 + i * 1.3, FIRE, 3, true, -.25); }
    halo(c, -62, -10, 40, '255,138,42', .3);
  }
  if (gal || anim === 'idle' || anim === 'atk' || anim === 'cast') { leg(T(-22, -44), F.hf, false, true); leg(T(24, -44), F.ff, true, true); }
  if (dn) { folded(-24, true, false); folded(14, true, true); }
  /* corpo (com rabo e pescoço) no quadro girado */
  c.save(); c.translate(PX, PY + bob); c.rotate(A); c.translate(-PX, -PY);
  /* rabo */
  var tsw = gal ? Math.sin(w * 2) * .25 - .7 : dn ? .5 : Math.sin(ph) * .12;
  c.save(); c.translate(-37, -55); c.rotate(tsw);
  var TP = bz(0, 0, -6, 6, -10, 16, -8, 32, 7, 3.6, 4.4);
  cel(c, tube(TP), HAIR, { k: 1.2, lw: 2, inn: function (p) { [-1.5, 0, 1.5].forEach(function (d) { ln(p, [d, 2, -6 + d, 14, -8 + d, 30], 'rgba(120,110,110,.5)', .8); }); } });
  [[-8, 32], [-10, 30], [-6, 33]].forEach(function (q, n) { dot(c, q[0] + n * 2 - 2, q[1] + 3, 1.2, n % 2 ? EMB : EMB2); });
  c.restore();
  /* barriga e lombo */
  cel(c, function (p) {
    p.moveTo(-30, -62); p.bezierCurveTo(-14, -67, 6, -62, 18, -64); p.bezierCurveTo(28, -65, 35, -55, 33, -45); p.bezierCurveTo(31, -36, 22, -32, 14, -33);
    p.bezierCurveTo(2, -30, -12, -30, -22, -33); p.bezierCurveTo(-34, -35, -41, -45, -39, -54); p.bezierCurveTo(-38, -60, -35, -62, -30, -62); p.closePath();
  }, G1, {
    k: 3, inn: function (p) {
      p.fillStyle = 'rgba(200,192,186,.35)'; p.beginPath(); p.ellipse(-2, -33, 20, 4, 0, 0, TAU); p.fill();
      p.fillStyle = 'rgba(60,50,50,.25)'; p.beginPath(); p.ellipse(-4, -62, 26, 4, 0, 0, TAU); p.fill();
      /* costelas e músculo da anca */
      [[-4, -54, -2, -40], [2, -55, 4, -41], [8, -56, 10, -42]].forEach(function (q) { p.beginPath(); p.moveTo(q[0], q[1]); p.quadraticCurveTo(q[0] - 3, (q[1] + q[3]) / 2, q[2], q[3]); p.strokeStyle = 'rgba(50,42,42,.3)'; p.lineWidth = 1.1; p.stroke(); });
      p.beginPath(); p.arc(-26, -48, 10, -1.9, 1.2); p.strokeStyle = 'rgba(50,42,42,.35)'; p.lineWidth = 1.3; p.stroke();
      p.beginPath(); p.arc(22, -48, 8, 1.6, 4.2); p.strokeStyle = 'rgba(50,42,42,.3)'; p.stroke();
      /* manchas de brasa apagada no lombo */
      [[-18, -58, 3], [-6, -60, 2.4], [6, -59, 2]].forEach(function (q) { p.fillStyle = 'rgba(255,138,42,.28)'; p.beginPath(); p.ellipse(q[0], q[1], q[2] * 1.6, q[2] * .7, 0, 0, TAU); p.fill(); });
    },
  });
  /* manta rasgada e a cilha: resto de arreio */
  cel(c, function (p) { p.moveTo(-8, -64); p.quadraticCurveTo(2, -66, 10, -64); p.lineTo(12, -48); p.lineTo(8, -45); p.lineTo(4, -49); p.lineTo(0, -45); p.lineTo(-4, -49); p.lineTo(-9, -46); p.closePath(); }, '#6a5552', { k: 1.3, lw: 1.8, inn: function (p) { ln(p, [-8, -61, 10, -61], 'rgba(200,180,170,.4)', .9, [1.6, 1.6]); } });
  ln(c, [1, -64, 2, -33], OUT, 3); ln(c, [1, -64, 2, -33], '#4a3c38', 1.6);
  /* pescoço e o toco em chamas */
  c.save(); c.translate(16, -58); c.rotate(NA); c.translate(-16, 58);
  if (!dn) halo(c, 47, -92, 30 * fm + 10, '255,138,42', .28);
  /* crina de restos de pelo, atrás do pescoço */
  for (i = 0; i < 6; i++) {
    var u = i / 5, mx = lp(10, 37, u), my = lp(-61, -82, u), ml = 7 + (i % 2) * 2.4, ma = -2.75 + (gal ? -.25 : 0) + Math.sin(ph * 2 + i) * .1;
    cel(c, function (p) { p.moveTo(mx - 1, my + 3); p.quadraticCurveTo(mx + Math.cos(ma) * ml * .5, my + Math.sin(ma) * ml * .5 - 3, mx + Math.cos(ma) * ml, my + Math.sin(ma) * ml); p.quadraticCurveTo(mx + Math.cos(ma) * ml * .4 + 1, my + Math.sin(ma) * ml * .4 + 2, mx + 3, my + 3.4); p.closePath(); }, i % 2 ? HAIR : HAIR2, { k: 0, lw: 1.4 });
  }
  cel(c, function (p) { p.moveTo(8, -61); p.quadraticCurveTo(24, -73, 38, -85); p.lineTo(51, -74); p.quadraticCurveTo(43, -60, 33, -46); p.quadraticCurveTo(22, -52, 8, -61); p.closePath(); }, G1, {
    k: 2.6, inn: function (p) {
      p.fillStyle = 'rgba(200,192,186,.3)'; p.beginPath(); p.ellipse(42, -60, 3.6, 12, .6, 0, TAU); p.fill();
      [[26, -68, 36, -58], [32, -74, 42, -64]].forEach(function (q) { ln(p, q, 'rgba(50,42,42,.3)', 1); });
    },
  });
  /* freio pendurado no pescoço */
  ln(c, [37, -79, 47, -69], OUT, 3.4); ln(c, [37, -79, 47, -69], '#5a4038', 1.8);
  rope(c, function (p) { p.moveTo(46, -69); p.quadraticCurveTo(50, -60, 45, -52); }, '#5a4038', 1.2);
  c.beginPath(); c.arc(45, -50, 2.6, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke(); c.strokeStyle = '#b9c2cc'; c.lineWidth = 1.2; c.stroke();
  /* o toco */
  c.save(); c.translate(44.5, -79.5); c.rotate(.75);
  cel(c, function (p) { el(p, 0, 0, 8.4, 3.4); }, '#7a2a1e', { k: 0, lw: 2, inn: function (p) { p.fillStyle = EMB; p.beginPath(); p.ellipse(0, 0, 5.4, 2, 0, 0, TAU); p.fill(); p.fillStyle = EMB2; p.beginPath(); p.ellipse(.4, 0, 2.6, 1, 0, 0, TAU); p.fill(); } });
  /* a labareda no lugar da cabeça: o resto de cor */
  c.rotate(-.75 + .35);
  var fh = 34 * fm;
  fire(c, 0, 1, 15 * Math.min(1.5, .7 + fm * .35), fh, ph * (gal ? 2 : 1), FIRE, 5, true, flean);
  if (anim === 'cast' && fi === 3) {
    /* cuspe de fogo para a frente */
    c.save(); c.rotate(1.3);
    halo(c, 0, -50, 46, '255,138,42', .45);
    c.beginPath(); flamePath(c, 0, 4, 13, 84, 3); c.strokeStyle = OUT; c.lineWidth = 2.6; c.stroke();
    flame(c, 0, 4, 13, 84, 3, FIRE, false);
    for (i = 0; i < 5; i++) spark(c, (i % 2 ? 9 : -9) + Math.sin(i) * 3, -40 - i * 11, 2.4 - i * .25, i % 2 ? EMB2 : '#fff2c0');
    c.restore();
  }
  if (dn) for (i = 0; i < 3; i++) { var su = (k + i / 3) % 1; puff(c, 2 + su * 6, -16 - su * 26 - i * 4, 3 + su * 4, .35 * (1 - su)); }
  for (i = 0; i < 5; i++) { var eu = (k * (gal ? 2 : 1) + i / 5) % 1; dot(c, Math.sin(eu * 7 + i * 2) * 8 + (gal ? -eu * 22 : 0), -fh * .6 - eu * fh * .9, 1.4 * (1 - eu) + .4, 'rgba(255,' + (170 + i * 15) + ',70,' + (1 - eu) + ')'); }
  c.restore();
  c.restore();
  c.restore();
  if (gal || anim === 'idle' || anim === 'atk' || anim === 'cast') { leg(T(-26, -44), F.hn, false, false); leg(T(20, -44), F.fn, true, false); }
  if (dn) { folded(-30, false, false); folded(8, false, true); }
  /* o golpe: faíscas nas ferraduras */
  if (anim === 'atk' && fi === 3) {
    var hx = F.fn[0] + 4, hy = F.fn[1] - 2;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (i = 0; i < 7; i++) { var a = -1.2 + i * .4; ln(c, [hx + Math.cos(a) * 7, hy + Math.sin(a) * 7, hx + Math.cos(a) * 15, hy + Math.sin(a) * 15], 'rgba(255,240,200,.85)', 1.8); }
    c.restore();
    spark(c, hx + 6, hy - 6, 3.4, '#fff8e0'); spark(c, hx + 2, hy + 8, 2.4, EMB2);
  }
  if (anim === 'special') for (i = 0; i < 4; i++) { var fx = [F.hf, F.hn, F.ff, F.fn][i]; if (fx && fx[1] > -3) { spark(c, fx[0] - 6, fx[1] - 3, 2.4, EMB2); dot(c, fx[0] - 10, fx[1] - 6, 1.2, EMB); } }
}

/* ---------------- Boitatá: cabeça ---------------- */
/* paletas: Assombro cinzento com fogo rosa-alaranjado; libertado azul e dourado */
function bpal(fr) {
  return fr ? { S1: '#2f72b4', S2: '#225a92', S3: '#18406c', SL: '#5ea4e0', BEL: '#f2c14e', BEL2: '#d99a2a', F1: FIRE_B, F2: FIRE_G, MOUTH: '#1c2c6a', IN: '120,200,255', JOINT: '#ffd23f', JG: '255,210,90', BROW: '#18406c' }
    : { S1: '#7b7372', S2: '#625b5a', S3: '#4c4646', SL: '#9a918e', BEL: '#aaa29c', BEL2: '#8d8580', F1: FIRE_P, F2: FIRE_P, MOUTH: '#4a0e22', IN: '255,110,80', JOINT: '#ff7a4a', JG: '255,110,80', BROW: '#4c4646' };
}
/* fileiras de escamas em arco (dentro de um recorte) */
function scaleRows(c, x0, x1, y0, y1, col, s) { s = s || 1; c.strokeStyle = col; c.lineWidth = .9; c.lineCap = 'round'; var r = 0, x, y; for (y = y0; y <= y1; y += 3.6 * s, r++) for (x = x0 + (r % 2) * 2.6 * s; x <= x1; x += 5.2 * s) { c.beginPath(); c.arc(x, y, 2.7 * s, PI * .6, PI * 1.4); c.stroke(); } }

/* idle/move: língua de fogo · atk: bote de boca escancarada · cast: cospe fogo · down: cabeça caída, chama fraca
   special: mergulha no chão · o.free: Boitatá libertado (colorido, fogo azul e dourado, olhos bondosos) */
export function drawBoitata(c, anim, k, o) {
  o = o || {}; var fr = !!o.free, P = bpal(fr), ph = k * TAU, fi = Math.round(k * 3), i;
  var HX = 4, HY = -33, HA = 0, JA = .08, tg = 0, crest = 1, dimEye = 0, sink = 0, spit = 0;
  if (anim === 'idle') { HY += Math.sin(ph) * 1.4; HA = Math.sin(ph) * .05; tg = Math.max(0, Math.sin(ph * 2)) * 16; }
  if (anim === 'move') { HY += Math.sin(ph) * 3; HX += Math.cos(ph) * 2; HA = Math.sin(ph + .6) * .09; tg = Math.max(0, Math.sin(ph * 2 + 1)) * 14; }
  if (anim === 'atk') { HX += [-4, -10, 6, 16][fi]; HY += [0, -4, 2, 4][fi]; HA = [-.06, -.2, .04, .1][fi]; JA = [.2, .4, .72, .88][fi]; }
  if (anim === 'cast') { HX += [0, -4, -6, 4][fi]; HY += [0, -3, -5, -2][fi]; HA = [-.08, -.18, -.24, .02][fi]; JA = [.2, .5, .78, .86][fi]; spit = fi === 3 ? 1 : 0; }
  if (anim === 'down') { HX += 8; HY = -16 + Math.sin(ph) * .6; HA = .22; JA = .1; crest = .35; dimEye = 1; }
  if (anim === 'special') { sink = k; HX = 6 + k * 18; HY = -28 + k * 42; HA = .45 + k * .75; crest = 1.2; }
  /* clipe do mergulho */
  c.save();
  if (sink > 0) { c.beginPath(); c.rect(-200, -300, 400, 300.5); c.clip(); }
  /* pescoço: tubo de escamas que vem da esquerda (onde encaixa o primeiro gomo) */
  var N = bz(-46, -21, -30, -21, -14, lp(-26, -20, dimEye), HX - 2, HY + 3, 9, 21, 18);
  /* fogo nas juntas do pescoço (atrás) */
  for (i = 1; i < N.length - 1; i += 2) { var q = N[i]; flame(c, q[0], q[1] - q[2] + 3, 4.2, (11 + (i % 3) * 3) * crest, -4 + Math.sin(ph * 2 + i) * 3, i % 4 === 1 ? P.F1 : P.F2, true, 2.2); }
  cel(c, tube(N), P.S1, {
    k: 2.4, lw: 2.6, inn: function (p) {
      p.fillStyle = P.BEL; p.globalAlpha = .75; p.beginPath(); N.forEach(function (q, n) { p[n ? 'lineTo' : 'moveTo'](q[0], q[1] + q[2] * .62); }); for (var j = N.length - 1; j >= 0; j--) p.lineTo(N[j][0], N[j][1] + q2(j)); p.closePath(); p.fill(); p.globalAlpha = 1;
      function q2(j) { return N[j][2] + 2; }
      for (var j = 0; j < N.length; j++) ln(p, [N[j][0] - 1, N[j][1] + N[j][2] * .6, N[j][0] - 2, N[j][1] + N[j][2]], 'rgba(40,30,30,.35)', 1);
      scaleRows(p, -60, HX + 10, HY - 20, -6, fr ? 'rgba(10,30,60,.45)' : 'rgba(40,34,34,.4)', 1.1);
      /* juntas acesas */
      for (j = 2; j < N.length - 1; j += 2) { var a = Math.atan2(N[j + 1][1] - N[j - 1][1], N[j + 1][0] - N[j - 1][0]) + PI / 2, r = N[j][2]; ln(p, [N[j][0] - Math.cos(a) * r, N[j][1] - Math.sin(a) * r, N[j][0] + Math.cos(a) * r * .5, N[j][1] + Math.sin(a) * r * .5], 'rgba(30,10,10,.6)', 3); ln(p, [N[j][0] - Math.cos(a) * r, N[j][1] - Math.sin(a) * r, N[j][0] + Math.cos(a) * r * .5, N[j][1] + Math.sin(a) * r * .5], P.JOINT, 1.2); }
      p.fillStyle = 'rgba(255,255,255,.12)'; p.beginPath(); p.ellipse(-24, -32, 14, 3, -.15, 0, TAU); p.fill();
    },
  });
  /* encaixe do primeiro gomo: anel de fogo */
  halo(c, -44, -21, 22, P.JG, .3);
  /* cabeça */
  c.save(); c.translate(HX, HY); c.rotate(HA); c.scale(1.25, 1.25);
  /* crista de fogo, varrida para trás */
  [[-6, -8, 20], [-2, -15, 24], [6, -19.5, 22], [14, -21, 17], [22, -20, 12]].forEach(function (q, n) {
    var h = q[2] * crest * (.85 + .15 * Math.sin(ph * 2 + n * 1.7));
    flame(c, q[0], q[1] + 4, 5, h, -h * .55 + Math.sin(ph * 2 + n) * 2.5, n % 2 ? P.F1 : P.F2, true, 2.4);
  });
  if (!fr && crest > .5) halo(c, 8, -22, 30, '255,110,80', .22);
  if (fr) halo(c, 8, -22, 32, '120,200,255', .25);
  /* boca por dentro: brasa */
  var hj = [8, 3], ca2 = Math.cos(JA), sa2 = Math.sin(JA);
  function J(x, y) { var dx = x - hj[0], dy = y - hj[1]; return [hj[0] + dx * ca2 - dy * sa2, hj[1] + dx * sa2 + dy * ca2]; }
  if (JA > .15) {
    var L1 = J(46, 2), L2 = J(34, 6);
    c.beginPath(); c.moveTo(hj[0], hj[1]); c.lineTo(50, 1); c.lineTo(L1[0], L1[1]); c.lineTo(L2[0], L2[1]); c.closePath(); c.fillStyle = P.MOUTH; c.fill();
    halo(c, (hj[0] + 50 + L1[0]) / 3, (hj[1] + 1 + L1[1]) / 3, 18 + JA * 8, P.IN, .7);
    var fp = J(22, 6); c.beginPath(); c.ellipse(fp[0], fp[1] - 2, 9, 3, JA * .5, 0, TAU); c.fillStyle = fr ? '#3a5ab0' : '#b03a50'; c.fill();
  }
  /* mandíbula */
  c.save(); c.translate(hj[0], hj[1]); c.rotate(JA); c.translate(-hj[0], -hj[1]);
  cel(c, function (p) { p.moveTo(-2, 0); p.lineTo(46, 1.6); p.quadraticCurveTo(47, 6, 41, 8.6); p.bezierCurveTo(30, 12, 12, 13.4, 2, 9); p.quadraticCurveTo(-4, 6, -2, 0); p.closePath(); }, P.S2, {
    k: 1.8, lw: 2.3, inn: function (p) { p.fillStyle = P.BEL; p.beginPath(); p.ellipse(22, 10, 20, 3, .03, 0, TAU); p.fill(); for (var j = 0; j < 6; j++) ln(p, [8 + j * 6, 7.6, 7 + j * 6, 12], 'rgba(40,30,30,.35)', .9); },
  });
  if (JA > .3) { tooth(c, 40, 2, 1.4, -5); tooth(c, 31, 2.4, 1.1, -3.4); }
  c.restore();
  /* crânio e focinho */
  cel(c, function (p) { p.moveTo(-6, -1); p.bezierCurveTo(-9, -15, 4, -22, 18, -21); p.bezierCurveTo(31, -19, 43, -13, 51, -6.6); p.quadraticCurveTo(55, -2.4, 51, 1.4); p.lineTo(12, 4.6); p.quadraticCurveTo(0, 6, -6, -1); p.closePath(); }, P.S1, {
    k: 2.8, lw: 2.6, inn: function (p) {
      /* placas da cabeça */
      [[4, -19, 8, -9], [12, -21, 13, -16], [28, -18, 31, -12], [36, -15, 38, -9], [44, -10, 45, -5]].forEach(function (q) { ln(p, q, fr ? 'rgba(10,30,60,.5)' : 'rgba(40,34,34,.45)', 1.2); });
      p.fillStyle = 'rgba(255,255,255,.14)'; p.beginPath(); p.ellipse(30, -15, 14, 2.6, .3, 0, TAU); p.fill();
      p.fillStyle = P.BEL; p.globalAlpha = .55; p.beginPath(); p.ellipse(30, 2, 20, 2.6, -.02, 0, TAU); p.fill(); p.globalAlpha = 1;
      scaleRows(p, -10, 14, -14, 0, fr ? 'rgba(10,30,60,.4)' : 'rgba(40,34,34,.35)', .9);
      /* listras de fogo nas escamas, entre as placas */
      [[2, -14, 7, -8], [24, -17, 26, -12]].forEach(function (q) { ln(p, q, fr ? 'rgba(255,210,90,.7)' : 'rgba(255,122,74,.7)', 1.1); });
    },
  });
  /* lábio e narina */
  ln(c, [12, 4.4, 30, 3.2, 50, 1.2], OUT, 1.6);
  dot(c, 47.5, -5, 1.4, OUT);
  if (fr) { c.beginPath(); c.moveTo(34, 3.6); c.quadraticCurveTo(40, 6, 46, 1.6); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke(); }
  /* olho enorme */
  var ex = 20, ey = -9;
  cel(c, function (p) { el(p, ex, ey, 9.4, 8.4, .05); }, P.S3, { k: 1, lw: 2.2 });
  if (fr) {
    cel(c, function (p) { el(p, ex, ey, 7.2, 6.6); }, '#ffcf4a', { k: 1.4, lw: 1.4, sh: 'rgba(180,90,10,.45)', hi: 'rgba(255,255,220,.5)' });
    dot(c, ex + 1.4, ey + .4, 4, '#2a1a10'); dot(c, ex + 2.6, ey - 1.6, 1.6, '#fff'); dot(c, ex - .4, ey + 2, .8, '#fff');
    c.beginPath(); c.moveTo(ex - 9, ey - 9.6); c.quadraticCurveTo(ex, ey - 13.6, ex + 9.4, ey - 9); c.strokeStyle = P.BROW; c.lineWidth = 2.6; c.lineCap = 'round'; c.stroke();
  } else {
    halo(c, ex, ey, 18, '255,61,138', dimEye ? .2 : .45);
    glow(c, ex, ey, 7, 6.2, dimEye ? '#e0457e' : EYEG, EYEG, dimEye ? 6 : 14);
    glow(c, ex + .6, ey - .4, 4, 3.6, EYE, EYEG, 6);
    c.beginPath(); c.ellipse(ex + 1, ey, 1, 4.4, .05, 0, TAU); c.fillStyle = 'rgba(120,10,60,.75)'; c.fill();
    if (dimEye) { c.save(); c.beginPath(); c.ellipse(ex, ey, 7.6, 7, 0, 0, TAU); c.clip(); c.fillStyle = P.S2; c.fillRect(ex - 9, ey - 9, 18, 9.4); c.restore(); ln(c, [ex - 7.4, ey + .4, ex + 7.4, ey + .4], OUT, 1.8); }
    /* sobrancelha pesada de escama */
    cel(c, function (p) { p.moveTo(ex - 11, ey - 7); p.quadraticCurveTo(ex - 1, ey - 15, ex + 11, ey - 9.6); p.lineTo(ex + 10, ey - 6.4); p.quadraticCurveTo(ex, ey - 10.6, ex - 10, ey - 4.6); p.closePath(); }, P.S2, { k: .8, lw: 1.8 });
  }
  /* língua de fogo bifurcada */
  if (tg > 1 && JA < .3) {
    c.save(); c.translate(50, 1.6);
    var lx = tg, sw = Math.sin(ph * 4) * 2;
    c.beginPath(); c.moveTo(0, -1.3); c.quadraticCurveTo(lx * .5, -1.6 + sw * .5, lx, -3.6 + sw); c.lineTo(lx * .82, -.6 + sw * .7); c.lineTo(lx, 2.4 + sw); c.quadraticCurveTo(lx * .5, 1.6 + sw * .5, 0, 1.3); c.closePath();
    c.fillStyle = P.F1[1]; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
    ln(c, [1, 0, lx * .7, sw * .6], P.F1[2], .9);
    c.restore();
  }
  /* cuspe de fogo */
  if (spit) {
    c.save(); c.translate(48, 4); c.rotate(PI / 2 + .08);
    halo(c, 0, -46, 44, P.IN, .5);
    c.beginPath(); flamePath(c, 0, 6, 13, 76, 3); c.strokeStyle = OUT; c.lineWidth = 2.2; c.stroke();
    flame(c, 0, 6, 13, 76, 3, P.F1, false);
    for (i = 0; i < 5; i++) spark(c, (i % 2 ? 10 : -10), -24 - i * 10, 2.2 - i * .25, i % 2 ? P.F1[2] : '#fff2e0');
    c.restore();
  }
  /* fumaça quando caído */
  if (anim === 'down') for (i = 0; i < 3; i++) { var su = (k + i / 3) % 1; puff(c, 6 + su * 8, -22 - su * 24 - i * 3, 3 + su * 4, .3 * (1 - su)); }
  c.restore();
  c.restore();
  /* buraco e terra voando no mergulho */
  if (sink > 0) {
    var bx = HX + 22 - sink * 6;
    c.beginPath(); c.ellipse(bx, 0, 30, 6.4, 0, 0, TAU); c.fillStyle = '#2a1812'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
    halo(c, bx, -2, 30, '255,110,80', .35);
    cel(c, function (p) { p.moveTo(bx - 36, 2); p.quadraticCurveTo(bx - 32, -8, bx - 22, -6); p.quadraticCurveTo(bx, 4, bx + 22, -6); p.quadraticCurveTo(bx + 34, -8, bx + 38, 2); p.quadraticCurveTo(bx, 10, bx - 36, 2); p.closePath(); }, '#8a5a40', { k: 1.6, lw: 2.2 });
    for (i = 0; i < 6; i++) { var u = ((k * 2 + i / 6) % 1), a = -PI / 2 + (i - 2.5) * .45, r = 10 + u * 34; cel(c, function (p) { el(p, bx + Math.cos(a) * r, -4 + Math.sin(a) * r + u * u * 20, 2.6 - u, 2 - u * .8); }, i % 2 ? '#8a5a40' : '#6a4430', { k: 0, lw: 1.2 }); }
  }
}

/* ---------------- Boitatá: gomo do corpo, visto de cima (70×70, eixo do corpo na horizontal) ---------------- */
/* simétrico em cima e embaixo, para a cena girar; a frente aponta para a direita */
export function drawBoitataSeg(c, fr) {
  var P = bpal(fr), cx = 35, cy = 35, RX = 29, RY = 23, i;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  /* fogo nas juntas (as duas pontas), saindo pelos dois lados */
  [8, 62].forEach(function (x, n) {
    halo(c, x, cy, 26, P.JG, .35);
    [-1, 1].forEach(function (sd) {
      c.save(); c.translate(x, cy + sd * (RY - 7)); if (sd > 0) c.scale(1, -1);
      flame(c, -2, 2, 4.6, 10, -1.6, P.F1, true, 2); flame(c, 4, 2, 3.4, 7, 2, P.F2, true, 2);
      c.restore();
    });
  });
  /* corpo: placa oval com sombreado simétrico */
  c.beginPath(); c.ellipse(cx, cy, RX + 2.6, RY + 2.6, 0, 0, TAU); c.fillStyle = OUT; c.fill();
  c.save(); c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, TAU); c.clip();
  var g = c.createLinearGradient(0, cy - RY, 0, cy + RY); g.addColorStop(0, P.S3); g.addColorStop(.28, P.S1); g.addColorStop(.5, P.SL); g.addColorStop(.72, P.S1); g.addColorStop(1, P.S3);
  c.fillStyle = g; c.fillRect(0, 0, 70, 70);
  /* escamas: arcos abertos para a frente, em fileiras */
  c.strokeStyle = fr ? 'rgba(10,30,60,.5)' : 'rgba(40,34,34,.45)'; c.lineWidth = 1.1;
  for (var row = -4; row <= 4; row++) { var y = cy + row * 5.2; for (var x = 4 + (row & 1) * 3.2; x < 70; x += 6.4) { c.beginPath(); c.arc(x, y, 3.4, -PI * .42, PI * .42); c.stroke(); } }
  /* juntas escuras com brilho de fogo */
  [9, 61].forEach(function (x) { c.beginPath(); c.ellipse(x, cy, 4, RY + 2, 0, 0, TAU); c.fillStyle = 'rgba(30,10,10,.55)'; c.fill(); c.beginPath(); c.ellipse(x, cy, 1.6, RY, 0, 0, TAU); c.fillStyle = P.JOINT; c.fill(); });
  c.restore();
  /* crista: placas no meio das costas com brasa entre elas */
  for (i = 0; i < 4; i++) {
    var px = 17 + i * 12;
    dot(c, px - 6, cy, 2, P.F1[1]); halo(c, px - 6, cy, 6, P.JG, .45);
    c.beginPath(); c.moveTo(px - 4.6, cy); c.lineTo(px + 3, cy - 4.4); c.lineTo(px + 6, cy); c.lineTo(px + 3, cy + 4.4); c.closePath(); c.fillStyle = P.S2; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.6; c.stroke();
    ln(c, [px - 2, cy, px + 4, cy], fr ? 'rgba(160,210,255,.6)' : 'rgba(190,180,176,.6)', 1);
  }
  dot(c, 59, cy, 2, P.F1[1]);
  c.restore();
}

/* ponta da cauda, vista de cima, apontando para a esquerda; a base (direita) tem a largura do gomo */
export function drawBoitataTail(c, fr) {
  var P = bpal(fr), cy = 35, i;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  halo(c, 62, cy, 24, P.JG, .35);
  [-1, 1].forEach(function (sd) { c.save(); c.translate(62, cy + sd * 16); if (sd > 0) c.scale(1, -1); flame(c, 0, 2, 4.4, 10, -1.6, P.F1, true, 2); c.restore(); });
  /* chama da ponta */
  c.save(); c.translate(14, cy); c.rotate(-PI / 2);
  halo(c, 0, -8, 16, P.JG, .45);
  c.beginPath(); flamePath(c, 0, 0, 5.6, 16, 0); c.strokeStyle = OUT; c.lineWidth = 2.4; c.stroke(); flame(c, 0, 0, 5.6, 16, 0, P.F1, false);
  c.restore();
  function shape(p, g) { p.moveTo(70 + g, cy - 23 - g); p.bezierCurveTo(46, cy - 23 - g, 30, cy - 12 - g, 12 - g, cy); p.bezierCurveTo(30, cy + 12 + g, 46, cy + 23 + g, 70 + g, cy + 23 + g); p.closePath(); }
  c.beginPath(); shape(c, 2.4); c.fillStyle = OUT; c.fill();
  c.save(); c.beginPath(); shape(c, 0); c.clip();
  var g = c.createLinearGradient(0, cy - 23, 0, cy + 23); g.addColorStop(0, P.S3); g.addColorStop(.3, P.S1); g.addColorStop(.5, P.SL); g.addColorStop(.7, P.S1); g.addColorStop(1, P.S3);
  c.fillStyle = g; c.fillRect(0, 0, 70, 70);
  c.strokeStyle = fr ? 'rgba(10,30,60,.5)' : 'rgba(40,34,34,.45)'; c.lineWidth = 1.1;
  for (var row = -4; row <= 4; row++) { var y = cy + row * 5.2; for (var x = 8 + (row & 1) * 3.2; x < 72; x += 6.4) { c.beginPath(); c.arc(x, y, 3.4, -PI * .42, PI * .42); c.stroke(); } }
  c.beginPath(); c.ellipse(63, cy, 4, 25, 0, 0, TAU); c.fillStyle = 'rgba(30,10,10,.55)'; c.fill(); c.beginPath(); c.ellipse(63, cy, 1.6, 23, 0, 0, TAU); c.fillStyle = P.JOINT; c.fill();
  c.restore();
  for (i = 0; i < 4; i++) {
    var px = 52 - i * 10, s = 1 - i * .18;
    dot(c, px + 6 * s, cy, 1.8 * s, P.F1[1]); halo(c, px + 6 * s, cy, 5, P.JG, .4);
    c.beginPath(); c.moveTo(px - 4 * s, cy); c.lineTo(px + 2.6 * s, cy - 3.8 * s); c.lineTo(px + 5 * s, cy); c.lineTo(px + 2.6 * s, cy + 3.8 * s); c.closePath(); c.fillStyle = P.S2; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke();
  }
  c.restore();
}
