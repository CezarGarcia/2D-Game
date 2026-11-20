// @ts-nocheck
/* Monstros comuns do Capítulo 4 (Cerrado em chamas). Todos virados para a direita, pés na origem, y negativo para cima.
   Assinatura: draw(ctx, anim, k), com os nomes de animação de kit.ts. Assombros cinzentos com brasa (#ff8a2a) e olhos rosa. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, EMB, EMB2, EMBD, FIRE, cl, lp, sm, key, rope, bz, tube, tooth, limb, flame, fire, halo, eye, spark, puff, mix } from './ch4_util';

/* ---------------- formiga-de-fogo ---------------- */
/* move: corrida de seis patas · atk: ergue o abdômen em brasa com o ferrão para a frente */
export function drawFormiga(c, anim, k) {
  var mv = anim === 'move', st = anim === 'atk' ? sm(k) : 0, w = mv ? k * TAU : 0, b = mv ? Math.abs(Math.cos(w)) * .7 : 0,
    G1 = '#7a716f', G2 = '#625a58', D = '#463f3f', i;
  c.save(); c.translate(0, -b - st * 1.5);
  function lg(x, ph, far) {
    var s = Math.sin(w + ph), up = mv ? Math.max(0, Math.cos(w + ph)) * 2.6 : 0, dx = x > 1 ? 5.4 : x < -1 ? -5.4 : 0;
    c.beginPath(); c.moveTo(x, -8); c.lineTo(x + dx * .6 + s * 1.5, -15 - st); c.lineTo(x + dx + s * 4 + (x < 0 ? -st * 2 : st * 2), -up + b + st * 1.5);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.8; c.stroke(); c.strokeStyle = far ? D : G1; c.lineWidth = 1.9; c.stroke();
  }
  [[-4, 0], [0, 2.1], [4.4, 4.2]].forEach(function (q) { lg(q[0], q[1] + PI, true); });
  /* abdômen em brasa, gira em volta do pecíolo */
  c.save(); c.translate(-6, -9.5); c.rotate(st * 1.62 - .08);
  var hot = .55 + st * .45;
  halo(c, -9, -1, 13 + st * 6, '255,138,42', .22 + st * .35);
  cel(c, function (p) { poly(p, [-16.5, -1.6, -24, 0, -16.5, 1.6]); }, '#a39894', { k: 0, lw: 1.5 });
  cel(c, function (p) { el(p, -9.5, 0, 9.4, 7.4, -.04); }, G2, {
    k: 1.8, lw: 2.4, inn: function (p) {
      var g = p.createRadialGradient(-9, .5, 1, -9, .5, 10); g.addColorStop(0, 'rgba(255,211,106,' + hot + ')'); g.addColorStop(.55, 'rgba(255,138,42,' + hot * .8 + ')'); g.addColorStop(1, 'rgba(217,72,28,0)');
      p.fillStyle = g; p.fillRect(-20, -9, 22, 18);
      [-4, -8.6, -13.2].forEach(function (x, n) { p.beginPath(); p.ellipse(x, 0, 1.2, 7.4 - n * .6, 0, 0, TAU); p.fillStyle = 'rgba(70,40,34,.55)'; p.fill(); });
      dot(p, -11, -4.2, 1.6, 'rgba(255,240,220,.35)');
    },
  });
  if (st > .5) for (i = 0; i < 3; i++) spark(c, -26 - i * 2.4, -2 + i * 2.6 - 3, 1.3 - i * .3, i % 2 ? EMB2 : EMB);
  c.restore();
  /* pecíolo e tórax */
  cel(c, function (p) { el(p, -4.6, -9.6, 2.6, 2.4); }, G2, { k: .6, lw: 1.8 });
  cel(c, function (p) { el(p, 1.2, -10, 6, 4.8, -.1); }, G1, { k: 1.3, lw: 2.2 });
  /* cabeça grande */
  cel(c, function (p) { el(p, 9.8, -12.2, 7.4, 6.6, .1); }, G1, { k: 1.6, lw: 2.4, inn: function (p) { ln(p, [6.6, -18, 7.4, -7], 'rgba(40,30,30,.35)', .9); } });
  [[-4, 0], [0, 2.1], [4.4, 4.2]].forEach(function (q) { lg(q[0], q[1], false); });
  /* mandíbulas */
  var ma = .2 + st * .5;
  [[-1, 0], [1, .9]].forEach(function (q) { c.beginPath(); c.moveTo(15, -10 + q[1]); c.quadraticCurveTo(20 + st, -10.6 + q[0] * ma * 4 + q[1], 22.4, -8.6 + q[0] * ma * 3 + q[1]); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = '#d9d0c4'; c.lineWidth = 1.7; c.stroke(); });
  /* antenas cotoveladas */
  [[13, -17, 16 - st, -25 - st * 2, 21.5, -24 - st * 3], [9.6, -18.4, 11, -26.5 - st, 16.4, -28.4 - st * 2]].forEach(function (q) { ln(c, q, OUT, 2.8); ln(c, q, G1, 1.3); });
  eye(c, 12, -13.6, 2.3, 2.7, .2, 8);
  ln(c, [8.6, -17.4, 14.4, -16], OUT, 1.6);
  c.restore();
}

/* ---------------- seriema ---------------- */
/* move: passadas longas · atk: crista eriçada, corpo inclinado, pronta para a corrida */
export function drawSeriema(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk' ? sm(k) : 0, w = mv ? k * TAU : 0, ph = k * TAU,
    G1 = '#8a817c', G2 = '#6f6763', D = '#57504d', BL = '#bdb5ae', LEG = '#a8908a', LEG2 = '#8a7470', BK = '#b49a96', i;
  var b = mv ? -Math.abs(Math.sin(w)) * 2.6 + 1 : Math.sin(ph) * .4, lean = at * .5 + (mv ? .14 : 0), HX = -1, HY = -38 + b + at * 5;
  /* pés: na passada o pé de apoio corre para trás e o outro sobe para a frente */
  function foot(p) { if (mv) { var s = Math.sin(w + p), lift = Math.max(0, Math.cos(w + p)) * 9; return [HX + 3 + s * 15, -lift]; } return p === 0 ? [HX + lp(4, 14, at), 0] : [HX + lp(-4, -16, at), 0]; }
  function leg(p, far) {
    var f = foot(p), hip = [HX + (far ? 2 : -1), HY + 4], e = reach(hip[0], hip[1], f[0], f[1] - 2, 37.5), kn = ik(hip[0], hip[1], e[0], e[1], 18, 20, 1), col = far ? LEG2 : LEG;
    ln(c, [hip[0], hip[1], kn[0], kn[1], e[0], e[1]], OUT, 4.4); ln(c, [hip[0], hip[1], kn[0], kn[1], e[0], e[1]], col, 2.4);
    dot(c, kn[0], kn[1], 1.9, OUT); dot(c, kn[0], kn[1], 1.1, col);
    [[5.6, .5], [4.8, -.3], [-3.2, 0]].forEach(function (t) { ln(c, [e[0], e[1], e[0] + t[0], e[1] + t[1] + 1.4], OUT, 3); ln(c, [e[0], e[1], e[0] + t[0], e[1] + t[1] + 1.4], col, 1.3); });
  }
  function reach(ax, ay, bx, by, L) { var dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); return d <= L ? [bx, by] : [ax + dx / d * L, ay + dy / d * L]; }
  leg(PI, true);
  c.save(); c.translate(HX, HY); c.rotate(lean);
  /* rabo comprido com faixa escura e ponta clara */
  var tw = mv ? Math.sin(w * 2) * .05 : Math.sin(ph) * .03;
  [[-.18, D], [-.04, G2], [.1, D]].forEach(function (q, n) {
    c.save(); c.translate(-12, -3); c.rotate(q[0] + tw - at * .15);
    cel(c, function (p) { p.moveTo(0, -3.6); p.quadraticCurveTo(-14, -5, -27, -2.6); p.quadraticCurveTo(-29, 0, -27, 2.6); p.quadraticCurveTo(-14, 4, 0, 3.6); p.closePath(); }, q[1], {
      k: .9, lw: 1.9, inn: function (p) { p.fillStyle = '#3c3534'; p.fillRect(-23, -5, 4, 10); p.fillStyle = BL; p.fillRect(-30, -5, 5, 10); },
    });
    c.restore();
  });
  /* corpo */
  cel(c, function (p) { p.moveTo(-15, -2); p.bezierCurveTo(-15, -13, -2, -15, 8, -12); p.bezierCurveTo(15, -10, 17, -2, 13, 4); p.bezierCurveTo(6, 9, -10, 9, -15, -2); p.closePath(); }, G1, {
    k: 2.2, inn: function (p) {
      p.fillStyle = 'rgba(230,222,214,.35)'; p.beginPath(); p.ellipse(4, 4.6, 10, 3.4, -.1, 0, TAU); p.fill();
      for (i = 0; i < 7; i++) ln(p, [-11 + i * 3.4, -9 + (i % 2) * 2, -9.6 + i * 3.4, -5 + (i % 2) * 2], 'rgba(50,40,40,.35)', .9);
    },
  });
  /* asa dobrada, abre um pouco no ataque */
  c.save(); c.translate(2, -7); c.rotate(-at * .35 + (mv ? Math.sin(w) * .06 : 0));
  cel(c, function (p) { p.moveTo(4, -4); p.bezierCurveTo(-4, -7, -16, -5, -21, 1); p.quadraticCurveTo(-12, 4, 2, 4); p.closePath(); }, G2, {
    k: 1.3, lw: 2, inn: function (p) { [-16, -11, -6].forEach(function (x) { ln(p, [x, -3, x - 3, 3], 'rgba(40,32,32,.5)', 1); }); p.fillStyle = 'rgba(40,32,32,.45)'; p.fillRect(-22, -1, 6, 6); },
  });
  c.restore();
  /* pescoço em S: no ataque estica para a frente */
  var pump = mv ? Math.sin(w * 2) * 2.2 : 0, NX = lp(19, 25, at) + pump, NY = lp(-30, -21, at), P = bz(9, -9, 16, -14, lp(12, 22, at) + pump * .5, lp(-22, -16, at), NX - 1, NY + 3, 7, 4.8, 3.6);
  cel(c, tube(P), G1, { k: 1.4, lw: 2.1, inn: function (p) { p.fillStyle = 'rgba(232,226,218,.4)'; p.beginPath(); p.ellipse(lp(17, 22, at), lp(-17, -12, at), 2.6, 7, lp(.3, .9, at), 0, TAU); p.fill(); for (i = 1; i < 6; i++) dot(p, P[i][0] - 1, P[i][1], .7, 'rgba(50,40,40,.4)'); } });
  /* cabeça */
  c.save(); c.translate(NX, NY); c.rotate(-lean * .7 + at * .15);
  /* crista: tufo na testa, deita para trás em repouso e se eriça no ataque */
  var cr = at, crw = mv ? Math.sin(w * 2 + 1) * .08 : Math.sin(ph) * .05;
  for (i = 0; i < 6; i++) {
    var a = lp(-2.25, -1.25, cr) + (i - 2.5) * lp(.13, .2, cr) + crw, L = 8 + (i % 3) * 2.2 + cr * 3, bx0 = 1.6 + i * .5, by0 = -4.4;
    var tx = bx0 + Math.cos(a) * L, ty = by0 + Math.sin(a) * L;
    c.beginPath(); c.moveTo(bx0, by0); c.quadraticCurveTo(bx0 + Math.cos(a + .3) * L * .5, by0 + Math.sin(a + .3) * L * .5, tx, ty); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = G2; c.lineWidth = 1.8; c.stroke();
    dot(c, tx, ty, 1.4 + cr * .5, OUT); dot(c, tx, ty, .9 + cr * .5, cr > .3 ? EMB2 : EMB);
    if (cr > .2) halo(c, tx, ty, 3 + cr * 3, '255,138,42', .35 * cr);
  }
  /* bico curvo, um pouco aberto no ataque */
  var op = at * .2;
  cel(c, function (p) { p.moveTo(4, -1.6); p.quadraticCurveTo(10, -2.6, 13.6, .4); p.quadraticCurveTo(12.6, .6, 12, .2 + op * 4); p.quadraticCurveTo(9, .4, 4, 1.6); p.closePath(); }, BK, { k: .6, lw: 1.7 });
  if (op > 0) cel(c, function (p) { p.moveTo(4, 1.4); p.quadraticCurveTo(8, 2 + op * 6, 11.4, 1.6 + op * 8); p.quadraticCurveTo(8, 3.4 + op * 6, 4, 3); p.closePath(); }, BK, { k: .4, lw: 1.5 });
  cel(c, function (p) { el(p, 0, 0, 6.2, 5.4); }, G1, { k: 1.3, lw: 2.1, inn: function (p) { p.fillStyle = 'rgba(230,222,214,.4)'; p.beginPath(); p.ellipse(1, 3.8, 4, 1.8, 0, 0, TAU); p.fill(); } });
  dot(c, 2, -1, 3.2, '#3c3434');
  eye(c, 2.1, -1, 2.2, 2.2, 0, 9);
  ln(c, [-1.2, -4.4, 5, -3.4], OUT, 1.7);
  c.restore();
  c.restore();
  leg(0, false);
}

/* ---------------- pequizeiro ---------------- */
/* move: arrasta-se nas raízes, balançando · atk: galho puxado para trás e solta um pequi em brasa */
export function drawPequizeiro(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk', ph = k * TAU, w = mv ? ph : 0, i,
    BK = '#6f6560', BK2 = '#5a514d', BK3 = '#8a7f78', LF = '#6c7569', LF2 = '#555d53', LF3 = '#828b7c';
  var sway = mv ? Math.sin(w) * .07 : Math.sin(ph) * .02, bob = mv ? Math.abs(Math.sin(w)) * 1.6 : 0;
  /* raízes-pernas */
  function root(x, dir, p, far) {
    var s = mv ? Math.sin(w + p) : 0, up = mv ? Math.max(0, Math.cos(w + p)) * 5 : 0, tx = x + dir * 15 + s * 6, P = bz(x, -9 - bob, x + dir * 5, -4 - bob, tx - dir * 4, -2 - up, tx, -up, 6, 4.4, 1.6);
    cel(c, tube(P), far ? BK2 : BK, { k: 1, lw: 2, inn: function (p) { ln(p, [x, -8, tx - dir * 3, -2 - up], 'rgba(30,22,20,.35)', .9); } });
  }
  root(-4, -1, PI, true); root(4, 1, 0, true);
  c.save(); c.translate(0, -bob); c.rotate(sway);
  /* galhos de trás e copa de trás */
  function leafy(x, y, r, col, col2) {
    var L = []; for (var j = 0; j < 6; j++) { var a = j * 1.047 + x * .1; L.push([x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .38, r * .55, r * .4, a]); } L.push([x, y, r * .62, r * .46, 0]);
    var path = function (p, g) { p.beginPath(); L.forEach(function (q) { el(p, q[0], q[1], q[2] + g, q[3] + g, q[4]); }); };
    path(c, 1.3); c.fillStyle = OUT; c.fill();
    path(c, 0); c.fillStyle = col; c.fill();
    c.save(); path(c, 0); c.clip();
    c.beginPath(); L.forEach(function (q) { el(c, q[0] + r * .14, q[1] + r * .16, q[2], q[3], q[4]); }); c.fillStyle = 'rgba(20,30,20,.35)'; c.fill();
    c.beginPath(); L.forEach(function (q, n) { if (n % 2 === 0) el(c, q[0] - r * .12, q[1] - r * .14, q[2] * .5, q[3] * .45, q[4]); }); c.fillStyle = 'rgba(230,240,220,.18)'; c.fill();
    for (var j = 0; j < 5; j++) { var a2 = j * 1.25 + y; ln(c, [x + Math.cos(a2) * r * .2, y + Math.sin(a2) * r * .15, x + Math.cos(a2) * r * .8, y + Math.sin(a2) * r * .55], col2, .9); }
    c.restore();
  }
  rope(c, function (p) { p.moveTo(-5, -50); p.quadraticCurveTo(-18, -62, -32, -66); }, BK2, 5.2);
  rope(c, function (p) { p.moveTo(-3, -52); p.quadraticCurveTo(-2, -70, 8, -84); }, BK2, 4.4);
  leafy(-34, -70, 17, LF2, 'rgba(30,40,30,.5)'); leafy(9, -88, 15, LF2, 'rgba(30,40,30,.5)'); leafy(-14, -86, 16, LF, 'rgba(30,40,30,.45)');
  /* tronco torto de casca grossa */
  cel(c, function (p) {
    p.moveTo(-13, -6); p.bezierCurveTo(-8, -18, -15, -30, -10, -42); p.bezierCurveTo(-8, -48, -12, -54, -9, -58); p.lineTo(-2, -55); p.lineTo(3, -60); p.lineTo(6, -53);
    p.bezierCurveTo(2, -44, 9, -30, 6, -18); p.bezierCurveTo(5, -12, 9, -8, 12, -6); p.quadraticCurveTo(0, -2, -13, -6); p.closePath();
  }, BK, {
    k: 3, lw: 2.6, inn: function (p) {
      /* placas de cortiça */
      [[-10, -12, -6, -20, -9, -26], [-4, -8, -1, -18, -4, -24], [2, -10, 5, -19, 3, -26], [-9, -32, -6, -40, -8, -48], [1, -34, 4, -42, 2, -50], [-4, -28, -2, -36, -4, -42]].forEach(function (q) { ln(p, q, 'rgba(30,22,20,.55)', 1.3); });
      [[-7, -15], [0, -21], [-6, -37], [3, -45], [-1, -11]].forEach(function (q) { p.fillStyle = 'rgba(160,150,140,.35)'; p.beginPath(); p.ellipse(q[0], q[1], 2.6, 1.3, -.4, 0, TAU); p.fill(); });
    },
  });
  /* rosto num nó da casca */
  cel(c, function (p) { el(p, -2, -33, 7.4, 8.2, .1); }, BK3, { k: 1.4, lw: 2 });
  c.beginPath(); c.ellipse(-2, -33, 5, 5.8, .1, 0, TAU); c.fillStyle = '#170c0c'; c.fill();
  halo(c, -2, -34, 8, '255,61,138', .25);
  eye(c, -4.2, -34.6, 1.6, 2.1, .3, 8); eye(c, .6, -34.4, 1.6, 2.1, -.3, 8);
  ln(c, [-4.6, -29.4, -2.6, -30.6, -.6, -29.4], '#ff8aa8', 1);
  /* pequis pendurados: o resto de cor */
  function pequi(x, y, r, sw) {
    ln(c, [x, y - r - 4, x + sw, y - r], OUT, 2.2); ln(c, [x, y - r - 4, x + sw, y - r], '#6a5a40', 1);
    halo(c, x + sw, y, r * 2.2, '255,138,42', .4);
    cel(c, function (p) { el(p, x + sw, y, r, r * 1.05); }, EMB, { k: r * .3, lw: 1.6, sh: 'rgba(160,30,10,.5)', hi: 'rgba(255,240,170,.5)', inn: function (p) { ln(p, [x + sw - r * .4, y - r * .5, x + sw + r * .2, y + r * .1, x + sw - r * .1, y + r * .6], 'rgba(120,30,10,.7)', .9); dot(p, x + sw - r * .35, y - r * .35, r * .25, 'rgba(255,250,220,.8)'); } });
  }
  var ps = mv ? Math.sin(w + 1) * 2 : Math.sin(ph) * .8;
  pequi(-26, -58, 3.6, ps); pequi(-40, -60, 3.2, ps * .8); pequi(-12, -74, 3.4, ps * 1.1); pequi(12, -77, 3.2, ps);
  leafy(-28, -78, 14, LF, 'rgba(30,40,30,.45)');
  /* braço de arremesso: galho da frente com um pequi na ponta */
  var aa, fi = Math.round(k * 3);
  if (at) aa = [-.25, -.8, -1.25, .55][fi]; else aa = -.15 + (mv ? Math.sin(w + .5) * .12 : Math.sin(ph + .5) * .05);
  c.save(); c.translate(3, -52); c.rotate(aa);
  cel(c, function (p) { p.moveTo(0, -4); p.quadraticCurveTo(14, -8, 27, -5); p.lineTo(28, -2); p.quadraticCurveTo(14, -2, 0, 4); p.closePath(); }, BK, { k: 1.4, lw: 2.2, inn: function (p) { ln(p, [6, -3, 12, -4, 18, -3], 'rgba(30,22,20,.5)', 1); } });
  rope(c, function (p) { p.moveTo(16, -5); p.lineTo(20, -12); }, BK, 1.8);
  leafy(21, -14, 9, LF3, 'rgba(30,40,30,.45)');
  if (!at || fi < 3) pequi(28, 3, 4.4, 0);
  c.restore();
  if (at && fi === 3) {
    /* o pequi sai voando, com rastro de brasa */
    var px = 38, py = -80;
    for (i = 0; i < 5; i++) { var u = i / 5; c.beginPath(); c.arc(px - 6 - i * 4.6, py + 6 + i * 3.4, 3.6 - i * .55, 0, TAU); c.fillStyle = 'rgba(255,' + (138 + i * 20) + ',42,' + (.55 - u * .45) + ')'; c.fill(); }
    halo(c, px, py, 12, '255,138,42', .5);
    cel(c, function (p) { el(p, px, py, 4.8, 5); }, EMB, { k: 1.4, lw: 1.8, sh: 'rgba(160,30,10,.5)', hi: 'rgba(255,240,170,.5)', inn: function (p) { dot(p, px - 1.6, py - 1.6, 1.3, 'rgba(255,250,220,.85)'); } });
    [[-8, -6], [-10, 2], [-4, 8]].forEach(function (q) { ln(c, [px + q[0] - 6, py + q[1] + 4, px + q[0], py + q[1]], 'rgba(255,230,180,.6)', 1.2); });
  }
  c.restore();
  root(-2, -1, 0, false); root(2, 1, PI, false);
}

/* ---------------- cupinzeiro ---------------- */
/* move: anda nos tocos de barro · atk: ergue o corpo inteiro e cai esmagando */
export function drawCupinzeiro(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk', ph = k * TAU, w = mv ? ph : 0, fi = Math.round(k * 3), i,
    CL = '#8a7a74', CL2 = '#716360', CL3 = '#a29089', D = '#4e4442';
  var ly = at ? [0, -16, -30, 0][fi] : mv ? -Math.abs(Math.sin(w)) * 2.4 : 0, sx = at ? [1.1, .94, .96, 1.2][fi] : 1 + (mv ? 0 : Math.sin(ph) * .01), sy = at ? [.88, 1.1, 1.05, .8][fi] : 1 - (mv ? 0 : Math.sin(ph) * .01),
    glowA = at ? [.5, .7, 1, .9][fi] : .45 + Math.sin(ph) * .08;
  /* pés de barro */
  function foot(x, p, far) {
    var s = mv ? Math.sin(w + p) : 0, up = mv ? Math.max(0, Math.cos(w + p)) * 5 : 0, fx = x + s * 4, fy = at ? (fi === 1 || fi === 2 ? ly + 4 : 0) : -up;
    cel(c, function (p2) { p2.moveTo(fx - 7, fy); p2.lineTo(fx - 5.6, fy - 12 + (at && fi === 0 ? 4 : 0)); p2.lineTo(fx + 5.6, fy - 12 + (at && fi === 0 ? 4 : 0)); p2.lineTo(fx + 7.4, fy); p2.quadraticCurveTo(fx, fy + 2, fx - 7, fy); p2.closePath(); }, far ? CL2 : CL, { k: 1.2, lw: 2 });
  }
  foot(10, PI, true); foot(-12, 0, true);
  c.save(); c.translate(0, ly - 7); c.scale(sx, sy);
  if (at) halo(c, 0, -40, 50, '255,138,42', .14 * glowA);
  /* monte de barro, com torrinhas */
  function mound(p) {
    p.moveTo(-30, 0); p.bezierCurveTo(-32, -14, -24, -24, -24, -36); p.bezierCurveTo(-26, -42, -22, -48, -18, -50); p.bezierCurveTo(-20, -60, -14, -70, -8, -78);
    p.quadraticCurveTo(-3, -84, 1, -80); p.bezierCurveTo(4, -74, 3, -66, 6, -62); p.quadraticCurveTo(10, -70, 15, -66); p.bezierCurveTo(18, -58, 16, -52, 19, -46);
    p.bezierCurveTo(25, -40, 24, -30, 26, -22); p.bezierCurveTo(30, -12, 32, -6, 30, 0); p.quadraticCurveTo(0, 6, -30, 0); p.closePath();
  }
  cel(c, mound, CL, {
    k: 3.4, lw: 2.8, inn: function (p) {
      /* camadas de barro */
      [[-26, -12, 26, -14], [-23, -27, 24, -28], [-20, -42, 20, -40], [-16, -56, 14, -54], [-10, -70, 2, -70]].forEach(function (q) { p.beginPath(); p.moveTo(q[0], q[1]); p.quadraticCurveTo((q[0] + q[2]) / 2, q[1] + 3, q[2], q[3]); p.strokeStyle = 'rgba(60,44,40,.3)'; p.lineWidth = 1.4; p.stroke(); });
      [[-8, -60, 3], [14, -36, 2.4], [-18, -20, 2.6], [8, -14, 2], [-14, -44, 2], [18, -54, 1.8]].forEach(function (q) { p.fillStyle = CL3; p.beginPath(); p.ellipse(q[0], q[1], q[2] * 2, q[2], 0, 0, TAU); p.fill(); });
      /* fendas em brasa */
      var cracks = [[-20, -6, -16, -14, -19, -22, -14, -30], [12, -4, 16, -12, 12, -20, 17, -28, 14, -34], [-6, -46, -3, -52, -7, -58], [6, -64, 9, -70], [-24, -34, -19, -38]];
      cracks.forEach(function (q) { ln(p, q, '#2a1610', 3.6); ln(p, q, EMBD, 2.2); ln(p, q, 'rgba(255,211,106,' + glowA + ')', 1); });
      /* buracos de cupim, alguns acesos */
      [[-12, -26, 0], [4, -30, 1], [-2, -70, 0], [10, -50, 1], [-20, -46, 0], [20, -16, 1], [-6, -14, 0]].forEach(function (q) { p.beginPath(); p.ellipse(q[0], q[1], 1.8, 1.3, 0, 0, TAU); p.fillStyle = q[2] ? 'rgba(255,138,42,' + glowA + ')' : '#2a1a16'; p.fill(); });
    },
  });
  /* rosto: fenda funda com olhos rosa */
  c.beginPath(); c.moveTo(-12, -46); c.quadraticCurveTo(-2, -52, 10, -47); c.quadraticCurveTo(-1, -38, -12, -46); c.closePath(); c.fillStyle = '#140a0a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke();
  halo(c, -1, -46, 12, '255,61,138', .25);
  eye(c, -6, -46, 2, 2.4, .2, 8); eye(c, 4, -46.4, 2, 2.4, -.2, 8);
  ln(c, [-14, -51, -4, -53], OUT, 2.2); ln(c, [2, -53.4, 12, -50], OUT, 2.2);
  /* fagulhas subindo das torrinhas */
  for (i = 0; i < 4; i++) { var u = ((k + i * .25) % 1); dot(c, -4 + Math.sin(u * 6 + i) * 4 + (i % 2) * 14, -82 - u * 14 + (i % 2) * 14, 1.3 * (1 - u) + .3, 'rgba(255,' + (160 + i * 20) + ',60,' + (1 - u) + ')'); }
  c.restore();
  foot(-8, PI, false); foot(13, 0, false);
  /* a queda: poeira, lascas e chão rachado */
  if (at && fi === 3) {
    [[-38, -4, 8], [-48, -8, 6], [38, -4, 8], [49, -7, 6], [-28, -1, 6], [28, -1, 6]].forEach(function (q) { puff(c, q[0], q[1], q[2], .55, 'rgba(160,130,110,'); });
    [[-30, 0, -44, 3], [30, 0, 46, 4], [-10, 2, -18, 6], [12, 2, 22, 7]].forEach(function (q) { ln(c, q, '#2a1610', 3); ln(c, q, EMB, 1.2); });
    [[-34, -26, 3], [36, -22, 2.6], [-22, -36, 2], [26, -38, 2.2]].forEach(function (q) { cel(c, function (p) { poly(p, [q[0] - q[2], q[1], q[0], q[1] - q[2], q[0] + q[2], q[1] + q[2] * .4]); }, CL2, { k: 0, lw: 1.4 }); });
  }
}

/* ---------------- taturana ---------------- */
/* move: rasteja ondulando · atk: incha e os pelos acendem até estourar */
export function drawTaturana(c, anim, k) {
  var mv = anim === 'move', at = anim === 'atk' ? k : 0, ph = k * TAU, i, N = 7,
    G1 = '#7d7470', G2 = '#665e5b', D = '#4d4644';
  var sw = 1 + sm(at) * .38, heat = at;
  c.save(); c.translate(0, -1); c.scale(sw, sw);
  if (at > 0) halo(c, 0, -8, 22 + at * 16, '255,138,42', .2 + at * .4);
  var S = [];
  for (i = 0; i < N; i++) {
    var u = i / (N - 1), x = -19 + u * 36, hump = mv ? Math.max(0, Math.sin(ph * 1 - i * .95)) * 4.4 : Math.sin(ph + i) * .3;
    x += mv ? Math.cos(ph - i * .95) * .9 : 0;
    S.push([x, -6.4 - hump, 6.6 - Math.abs(u - .55) * 2.4]);
  }
  /* patinhas */
  S.forEach(function (s, n) { if (n > 0 && n < N - 1) { cel(c, function (p) { cap(p, s[0], s[1] + s[2] * .6, s[0] + .4, -.4, 1.5); }, D, { k: 0, lw: 1.3 }); } });
  /* gomos, de trás para a frente, com tufos de pelo */
  function hairs(s, n, front) {
    for (var j = 0; j < 7; j++) {
      var a = -PI / 2 + (j - 3) * .42 + Math.sin(ph * 2 + n + j) * .05, L = (front ? 5.4 : 7.4) + (j % 2) * 2 + heat * 2.6, x0 = s[0] + Math.cos(a) * s[2] * .8, y0 = s[1] + Math.sin(a) * s[2] * .8, x1 = s[0] + Math.cos(a) * (s[2] + L), y1 = s[1] + Math.sin(a) * (s[2] + L);
      var col = heat < .05 ? (j % 2 ? '#a89e98' : '#8f8682') : mix('#9a908a', heat > .6 ? '#ffe7a0' : '#ff8a2a', Math.min(1, heat * 1.6));
      ln(c, [x0, y0, x1, y1], OUT, 2.2); ln(c, [x0, y0, x1, y1], col, 1);
      dot(c, x1, y1, .9 + heat * .5, heat > .3 ? EMB2 : EMB);
    }
  }
  for (i = 0; i < N; i++) hairs(S[i], i, false);
  for (i = 0; i < N; i++) (function (s, n) {
    cel(c, function (p) { el(p, s[0], s[1], s[2] * 1.02, s[2]); }, n % 2 ? G1 : G2, {
      k: 1.2, lw: 1.9, inn: function (p) {
        p.fillStyle = 'rgba(255,138,42,' + (.35 + heat * .6) + ')'; p.beginPath(); p.ellipse(s[0], s[1] - s[2] * .55, s[2] * .6, s[2] * .22, 0, 0, TAU); p.fill();
        if (heat > .5) { p.fillStyle = 'rgba(255,230,160,' + (heat - .5) * 1.6 + ')'; p.beginPath(); p.ellipse(s[0], s[1], s[2] * .55, s[2] * .5, 0, 0, TAU); p.fill(); }
        dot(p, s[0] - 1.6, s[1] + 2.6, 1, 'rgba(30,24,24,.4)');
      },
    });
  })(S[i], i);
  /* cabeça */
  var Hh = S[N - 1], hx = Hh[0] + 6, hy = Hh[1] + 1.4;
  cel(c, function (p) { el(p, hx, hy, 5, 4.6); }, D, { k: 1, lw: 1.9 });
  eye(c, hx + 1.6, hy - 1.4, 1.3, 1.5, 0, 7); eye(c, hx + 3.6, hy - .6, 1, 1.3, 0, 6);
  ln(c, [hx + 3, hy + 2.6, hx + 5, hy + 2.2], OUT, 1.2);
  c.restore();
  if (at >= .99) {
    /* estouro: raios de luz e fagulhas */
    c.save(); c.globalCompositeOperation = 'lighter';
    for (i = 0; i < 10; i++) { var a = i * .628 + .2, r0 = 16, r1 = 28 + (i % 3) * 5; ln(c, [Math.cos(a) * r0, -10 + Math.sin(a) * r0 * .8, Math.cos(a) * r1, -10 + Math.sin(a) * r1 * .8], 'rgba(255,200,90,.55)', 2); }
    c.restore();
    for (i = 0; i < 8; i++) { var a2 = i * .785; spark(c, Math.cos(a2) * 22, -10 + Math.sin(a2) * 17, 2.2, i % 2 ? EMB2 : '#fff4d0'); }
  }
}
