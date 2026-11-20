// @ts-nocheck
/* Capítulo 3 (Sertão): Corpo-Seco (elite), Saci-Pererê (chefão e libertado), companheiros Tatu-bola e
   Carcará e o redemoinho de poeira. Mesmo estilo de characters.ts. Virados para a direita, pés em (0,0),
   y negativo para cima. Assinatura: draw(ctx, nomeDaAnimacao, k) com k de 0 a 1. */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, ik, EYE, EYEG, YEL, PI, cl, lp, sm, bz, tube, rope, eye, spark, bolt, puff, limb } from './ch3_util';

function P2(x, y) { return [x, y]; }
function mix(a, b, k) { return [lp(a[0], b[0], k), lp(a[1], b[1], k)]; }

/* ---------------- Corpo-Seco ---------------- */
var CS = { SK: '#8f8475', SK2: '#71675a', SK3: '#5a5248', BONE: '#c4b9a5', RAG: '#6e6a62', RAG2: '#57534c', HAIR: '#a7a097', SC: '#d6a92c', SC2: '#b08422' };

function csHand(c, x, y, ang, curl, col) {
  c.save(); c.translate(x, y); c.rotate(ang);
  for (var j = 0; j < 4; j++) {
    var a = (j - 1.5) * 0.26, l1 = 3.6 - Math.abs(j - 1.5) * 0.3, l2 = 3.2 - Math.abs(j - 1.5) * 0.3, b = a + curl * 1.5,
      x1 = 1.6 + Math.cos(a) * l1, y1 = Math.sin(a) * l1 * 1.4, x2 = x1 + Math.cos(b) * l2, y2 = y1 + Math.sin(b) * l2;
    rope(c, function (c) { c.moveTo(1.2, Math.sin(a) * 1.6); c.lineTo(x1, y1); c.lineTo(x2, y2); }, col, 1.3);
    /* unha */
    dot(c, x2, y2, 0.55, '#3a302a');
  }
  rope(c, function (c) { c.moveTo(0.6, -1.4); c.lineTo(2, -3.4 + curl * 1.4); c.lineTo(3.4 + curl, -4.2 + curl * 3); }, col, 1.3);
  cel(c, function (c) { el(c, 0.6, 0, 2.4, 2); }, col, { k: 0.6, lw: 1.5 });
  c.restore();
}

function csArm(c, S, H, far, curl) {
  var col = far ? CS.SK3 : CS.SK2, k = limb(c, S[0], S[1], H[0], H[1], 17.5, 17.5, 1, 2.3, 1.9, col, col, { k: 0.8, lw: 1.8 });
  dot(c, k[0], k[1], 1.6, far ? '#7d7466' : CS.BONE); c.beginPath(); c.arc(k[0], k[1], 1.6, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  csHand(c, H[0], H[1], Math.atan2(H[1] - k[1], H[0] - k[0]), curl, far ? CS.SK3 : CS.SK);
  return k;
}
function csLeg(c, Hp, F, far, drag) {
  var col = far ? CS.SK3 : CS.SK2, k = limb(c, Hp[0], Hp[1], F[0], F[1] - 2.4, 19, 18, -1, 2.6, 2, col, col, { k: 0.8, lw: 1.8 });
  dot(c, k[0], k[1], 1.9, far ? '#7d7466' : CS.BONE); c.beginPath(); c.arc(k[0], k[1], 1.9, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  /* pé ossudo, dedos compridos; arrastado = ponta no chão */
  c.save(); c.translate(F[0], F[1] - 2.4); c.rotate(drag ? 0.9 : 0);
  cel(c, function (c) { c.moveTo(-2.4, -0.6); c.lineTo(-2.4, 2.4); c.lineTo(6.4, 2.6); c.quadraticCurveTo(7, 1.2, 5.6, 0.6); c.closePath(); }, col, { k: 0.6, lw: 1.5, inn: function (c) { ln(c, [2, 1.4, 6, 1.8], 'rgba(30,24,20,.5)', 0.6); } });
  c.restore();
}
/* tronco: H = bacia, S = ombros. Desenhado num referencial que aponta da bacia para os ombros */
function csTorso(c, H, S, glowK) {
  var dx = S[0] - H[0], dy = S[1] - H[1], L = Math.hypot(dx, dy), a = Math.atan2(dy, dx) + PI / 2;
  c.save(); c.translate(H[0], H[1]); c.rotate(a);
  cel(c, function (c) { c.moveTo(-5, 2); c.bezierCurveTo(-8.6, -L * 0.4, -10.6, -L * 0.82, -4, -L - 2.4); c.quadraticCurveTo(2.6, -L - 4.4, 6.4, -L + 0.6); c.bezierCurveTo(6.6, -L * 0.72, 1.6, -L * 0.4, 4.6, 2); c.closePath(); }, CS.SK, {
    k: 2.2, lw: 2, inn: function (c) {
      /* costelas e espinha */
      for (var j = 0; j < 5; j++) { var y = -L * (0.5 + j * 0.095); c.beginPath(); c.moveTo(-4.6, y + 1.6); c.quadraticCurveTo(1, y - 1.8, 6, y + 0.6); c.strokeStyle = 'rgba(40,32,26,.55)'; c.lineWidth = 1; c.stroke(); c.beginPath(); c.moveTo(-4, y); c.quadraticCurveTo(1, y - 3, 5.4, y - 0.8); c.strokeStyle = 'rgba(220,210,190,.28)'; c.lineWidth = 0.8; c.stroke(); }
      for (var j = 0; j < 6; j++) dot(c, -7.4 + j * 0.3 - Math.sin(j * 0.5) * 1.6, -L * (0.3 + j * 0.11), 0.9, 'rgba(220,210,190,.35)');
      /* barriga funda */
      c.fillStyle = 'rgba(40,32,26,.35)'; c.beginPath(); c.ellipse(2.6, -L * 0.28, 2.4, 5, 0, 0, TAU); c.fill();
      /* rachaduras de terra seca no couro */
      ln(c, [-6, -L * 0.36, -3.6, -L * 0.42, -4.4, -L * 0.48], 'rgba(40,32,26,.5)', 0.7);
      if (glowK > 0) { c.fillStyle = 'rgba(255,61,138,' + (0.45 * glowK) + ')'; c.beginPath(); c.ellipse(2.6, -L * 0.7, 4 + glowK * 2, 4 + glowK * 2, 0, 0, TAU); c.fill(); }
    },
  });
  /* calça rasgada e corda na cintura */
  cel(c, function (c) { c.moveTo(-6, -5); c.lineTo(5.4, -5); c.lineTo(7, 5); c.lineTo(5, 9); c.lineTo(3.4, 6.4); c.lineTo(1.6, 10); c.lineTo(-0.4, 6.6); c.lineTo(-2.6, 9.6); c.lineTo(-4.4, 6.2); c.lineTo(-6.6, 8.6); c.lineTo(-7.6, 4); c.closePath(); }, CS.RAG, {
    k: 1.2, lw: 1.7, inn: function (c) { ln(c, [-3, -3, -2, 6], 'rgba(30,26,22,.45)', 0.8); ln(c, [2.6, -3, 3, 5], 'rgba(30,26,22,.45)', 0.8); dot(c, -4, 2, 1.2, 'rgba(30,26,22,.35)'); },
  });
  rope(c, function (c) { c.moveTo(-6.4, -4.4); c.lineTo(5.8, -4.6); }, '#8a7a5a', 1.1);
  c.restore();
}
/* cabeça: crânio com couro, órbitas fundas, cabelo ralo; espaço da cabeça com o pescoço em (0,0) */
function csHead(c, x, y, rot, jaw, hs, glowK) {
  c.save(); c.translate(x, y); c.rotate(rot);
  /* cabelo ralo, comprido, caindo para trás */
  [[-5, -9], [-7, -6.6], [-3, -10.4], [-8, -3.6]].forEach(function (q, n) {
    rope(c, function (c) { c.moveTo(q[0] + 4, q[1]); c.bezierCurveTo(q[0] - 3, q[1] + 1, q[0] - 6 + hs, q[1] + 8, q[0] - 5 + hs * 1.6, q[1] + 15 + n * 2); }, CS.HAIR, 0.8, 'rgba(34,16,10,.8)');
  });
  /* mandíbula: abre */
  c.save(); c.translate(1, 1.6); c.rotate(jaw * 0.5);
  cel(c, function (c) { c.moveTo(-1, -1); c.lineTo(9.4, -0.8); c.quadraticCurveTo(10, 2.6, 7, 3.6); c.quadraticCurveTo(2, 4.2, -1, 1.6); c.closePath(); }, CS.SK2, { k: 0.8, lw: 1.6, inn: function (c) { for (var j = 0; j < 4; j++) c.fillRect(3 + j * 1.6, -1.2, 1, 1.6); } });
  c.restore();
  if (jaw > 0.1) { c.beginPath(); c.moveTo(2, 0.6); c.lineTo(10, 0.8); c.lineTo(8, 0.6 + jaw * 5); c.closePath(); c.fillStyle = '#1e1216'; c.fill(); }
  cel(c, function (c) { c.moveTo(-5.6, 2); c.bezierCurveTo(-8, -6, -2, -12.6, 4, -10.6); c.bezierCurveTo(9, -9, 11.6, -4, 11, 0.6); c.lineTo(9.6, 1.6); c.lineTo(2, 1.4); c.quadraticCurveTo(-2, 4, -5.6, 2); c.closePath(); }, CS.SK, {
    k: 1.8, lw: 1.9, inn: function (c) {
      /* bochecha funda e testa ossuda */
      c.fillStyle = 'rgba(40,30,26,.4)'; c.beginPath(); c.ellipse(5, -1, 3, 1.8, -0.2, 0, TAU); c.fill();
      c.fillStyle = 'rgba(230,220,200,.25)'; c.beginPath(); c.ellipse(4, -8.2, 4.6, 1.4, -0.2, 0, TAU); c.fill();
      /* órbitas */
      c.fillStyle = '#1e1416'; c.beginPath(); c.ellipse(6.6, -4.4, 2.6, 2.2, 0.1, 0, TAU); c.fill(); c.beginPath(); c.ellipse(1.8, -4.6, 2, 2, 0, 0, TAU); c.fill();
      /* nariz cavado e dentes */
      c.beginPath(); poly(c, [9.6, -2.4, 10.8, -0.6, 9.2, -0.4]); c.fillStyle = '#1e1416'; c.fill();
      for (var j = 0; j < 4; j++) { c.fillStyle = '#d9cfba'; c.fillRect(4.4 + j * 1.5, 0, 1.1, 1.5); }
      ln(c, [4, 1.6, 10, 1.4], 'rgba(30,22,20,.7)', 0.6);
      ln(c, [-4, -2, -1.6, 0.4], 'rgba(40,30,26,.5)', 0.7);
    },
  });
  /* orelha seca */
  cel(c, function (c) { el(c, -2.4, -2.6, 1.6, 2.4, 0.2); }, CS.SK2, { k: 0.5, lw: 1.3 });
  glow(c, 6.8, -4.4, 1.4 + glowK * 0.5, 1.2 + glowK * 0.5, EYE, EYEG, 9);
  glow(c, 2, -4.6, 1.1 + glowK * 0.4, 1.1 + glowK * 0.4, EYE, EYEG, 8);
  ln(c, [4.2, -7.6, 9.4, -6.6], OUT, 1.5);
  c.restore();
}
function csScarf(c, S, fl) {
  /* lenço puído no pescoço: o resto de cor */
  cel(c, function (c) { c.moveTo(S[0] - 5, S[1] - 1); c.quadraticCurveTo(S[0] - 10, S[1] + 1 + fl, S[0] - 15, S[1] + 6 + fl * 1.6); c.lineTo(S[0] - 12.6, S[1] + 3.6 + fl); c.lineTo(S[0] - 13.6, S[1] + 9 + fl); c.quadraticCurveTo(S[0] - 8, S[1] + 4, S[0] - 3, S[1] + 2.6); c.closePath(); }, CS.SC2, { k: 0.8, lw: 1.5 });
  cel(c, function (c) { c.moveTo(S[0] - 6, S[1] - 2); c.quadraticCurveTo(S[0], S[1] + 3, S[0] + 7, S[1] - 1.4); c.lineTo(S[0] + 6.4, S[1] - 4.6); c.quadraticCurveTo(S[0], S[1] - 1.6, S[0] - 5, S[1] - 5); c.closePath(); }, CS.SC, { k: 0.8, lw: 1.6, inn: function (c) { ln(c, [S[0] - 3, S[1] - 2.6, S[0] - 2, S[1] + 0.6], 'rgba(90,60,10,.5)', 0.7); dot(c, S[0] + 3, S[1] - 1.6, 0.8, 'rgba(90,60,10,.45)'); } });
}
function csBody(c, o) {
  var S = o.S, H = o.H, NK = [S[0] + 4, S[1] - 2.6];
  csArm(c, [S[0] - 2, S[1] + 1], o.H2, true, o.curl);
  csLeg(c, [H[0] - 1, H[1] + 1], o.F2, true, o.drag2);
  csLeg(c, [H[0] + 1, H[1]], o.F1, false, o.drag1);
  csTorso(c, H, S, o.glow || 0);
  /* pescoço fino */
  cel(c, function (c) { cap(c, S[0] + 1, S[1], NK[0] + 2, NK[1], 1.8); }, CS.SK2, { k: 0.6, lw: 1.6 });
  csScarf(c, [S[0] + 1, S[1] - 0.4], o.fl || 0);
  csHead(c, NK[0] + 2.6, NK[1] - 1, o.hr, o.jaw || 0, o.hs || 0, o.glow || 0);
  csArm(c, [S[0] + 1.6, S[1] + 1.4], o.H1, false, o.curl);
}

export function drawCorpoSeco(c, anim, k) {
  var t = k * TAU, i, o;
  if (anim === 'down') {
    /* desmontado no chão */
    var tw = k < 0.5 ? 0 : 1;
    c.beginPath(); c.ellipse(0, 0.6, 40, 5, 0, 0, TAU); c.fillStyle = 'rgba(40,30,20,.25)'; c.fill();
    csLeg(c, [-12, -7], [-34, 0], true, true);
    csArm(c, [10, -9], [18 + tw, -2], true, 0.6);
    csTorso(c, [-12, -6], [10, -9], 0);
    csLeg(c, [-11, -6], [-26, 0], false, false);
    /* cabeça soltou e rolou */
    csHead(c, 26, -4.6, 1.15 + tw * 0.06, 0.5 + tw * 0.25, 2, 0);
    csArm(c, [9, -8], [4 + tw * 2, -1], false, 0.9 - tw * 0.4);
    /* ossinhos e poeira */
    [[30, -1, 0.4], [-2, -1, -0.3]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(q[2]); cel(c, function (c) { cap(c, -3, 0, 3, 0, 0.9); el(c, -3, 0, 1.3, 1.3); el(c, 3, 0, 1.3, 1.3); }, CS.BONE, { k: 0.3, lw: 1.2 }); c.restore(); });
    for (i = 0; i < 4; i++) puff(c, -20 + i * 14, -3 - ((i + tw) % 2) * 2, 1.6 + (i % 2), 0.4, '#d8c39a');
    /* atordoado: faíscas rosa girando sobre a cabeça */
    for (i = 0; i < 3; i++) { var a = t * 0.5 + i * 2.1 + tw * 0.6; spark(c, 24 + Math.cos(a) * 7, -16 + Math.sin(a) * 2.4, 1.8, i % 2 ? '#ff8fbb' : '#ffe0f0'); }
    return;
  }
  if (anim === 'special') {
    /* afundando na terra */
    var d = sm(k / 0.9) * 0.95;
    c.beginPath(); c.ellipse(0, 0, 26, 7.4, 0, 0, TAU); c.fillStyle = '#2a1c14'; c.fill();
    c.beginPath(); c.ellipse(0, 0.8, 22, 5.6, 0, 0, TAU); c.fillStyle = '#140c0a'; c.fill();
    c.save(); c.beginPath(); c.rect(-60, -140, 120, 140); c.ellipse(0, 0, 22, 5.6, 0, 0, PI); c.clip(); c.translate(0, d * 88);
    o = { H: [-1, -38], S: [6, -61], F1: [5, 0], F2: [-7, 0], H1: [lp(12, 10, d), lp(-30, -88, d)], H2: [lp(2, -4, d), lp(-30, -86, d)], hr: lp(0.2, -0.5, d), jaw: 0.4 + d * 0.3, hs: 2, curl: 0.2 };
    csBody(c, o);
    c.restore();
    /* beira do buraco, torrões e rachaduras */
    c.beginPath(); c.ellipse(0, 0, 26, 7.4, 0, 0.1, PI - 0.1); c.strokeStyle = OUT; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = '#7a5a3a'; c.lineWidth = 2; c.stroke();
    [[-30, 0.4, 3.4, -0.2], [27, -0.6, 2.6, 0.2], [-14, 6.4, 2.2, 0.1], [12, 6, 3, -0.3], [22, -6, 1.8, 0]].forEach(function (q) { cel(c, function (c) { el(c, q[0], q[1], q[2], q[2] * 0.7, q[3]); }, '#8a6844', { k: 0.6, lw: 1.3 }); });
    [[-26, 3, -40, 8], [24, 4, 38, 9], [8, 6.6, 12, 12]].forEach(function (q) { ln(c, [q[0], q[1], (q[0] + q[2]) / 2 + 2, (q[1] + q[3]) / 2 - 1, q[2], q[3]], 'rgba(30,18,12,.7)', 1.2); });
    for (i = 0; i < 4; i++) { var u = (k * 2 + i / 4) % 1; puff(c, Math.cos(i * 1.7) * (14 + u * 16), -2 - u * 14, 2 + u * 3, (1 - u) * 0.6, '#d8c39a'); }
    return;
  }
  if (anim === 'move') {
    var w = t, st = Math.sin(w), co = Math.cos(w), lean = 0.05 * st;
    o = {
      H: [-1 + st * 1.2, -36 + Math.abs(st) * 1.6], S: [8 + st * 1.6, -59 + Math.abs(st) * 1.8], F1: [5 + st * 9, -Math.max(0, co) * 5], F2: [-7 - st * 5, 0], drag2: true,
      H1: [12 - st * 7, -29 + Math.abs(st) * 2], H2: [3 + st * 6, -30 + Math.abs(co) * 2], hr: 0.28 + lean, jaw: 0.15, hs: -st * 2, fl: co * 2, curl: 0.3,
    };
    csBody(c, o);
    for (i = 0; i < 2; i++) { var u = (k * 2 + i * 0.5) % 1; puff(c, -9 - st * 5 - u * 8, -1 - u * 5, 1.6 + u * 2.4, (1 - u) * 0.45, '#d8c39a'); }
    return;
  }
  if (anim === 'atk') {
    var g1 = sm(k / 0.45), g2 = sm((k - 0.45) / 0.55);
    o = {
      H: [lp(-2, 0, g2), -36], S: [lp(lp(7, 3, g1), 14, g2), lp(lp(-59, -62, g1), -56, g2)], F1: [lp(6, 13, g2), 0], F2: [-8, 0],
      H1: mix(mix([12, -28], [-12, -72], g1), [38, -54], g2), H2: mix(mix([2, -29], [-8, -76], g1), [34, -48], g2),
      hr: lp(lp(0.25, -0.15, g1), 0.2, g2), jaw: g1 * 0.4 + g2 * 0.5, hs: -g2 * 3, fl: -g2 * 3, curl: lp(0.1, 1, g2),
    };
    csBody(c, o);
    if (g2 > 0.5) for (i = 0; i < 3; i++) ln(c, [20 - i * 2, -62 + i * 6, 10 - i * 2, -64 + i * 6], 'rgba(255,240,220,' + ((g2 - 0.5) * 1.4) + ')', 1.2);
    return;
  }
  if (anim === 'cast') {
    /* suga a vida: corrente fina saindo do peito */
    var g = sm(k / 0.5), ch = cl((k - 0.25) / 0.75);
    o = {
      H: [-2, -37], S: [lp(7, 4, g), lp(-59, -63, g)], F1: [7, 0], F2: [-8, 0],
      H1: mix([12, -28], [24, -60], g), H2: mix([2, -29], [-16, -58], g), hr: lp(0.25, -0.3, g), jaw: g * 0.7, hs: -g * 2, fl: -g * 2, curl: 0, glow: ch,
    };
    var cx = o.S[0] - 0.6, cy = o.S[1] + 10;
    if (ch > 0) {
      var ex = cx + 18 + ch * 32, ey = cy + 6;
      c.save(); c.globalCompositeOperation = 'lighter';
      var gr = c.createRadialGradient(cx, cy, 0, cx, cy, 14 * ch + 4); gr.addColorStop(0, 'rgba(255,61,138,.6)'); gr.addColorStop(1, 'rgba(255,61,138,0)'); c.fillStyle = gr; c.fillRect(cx - 20, cy - 20, 40, 40);
      c.restore();
    }
    csBody(c, o);
    if (ch > 0) {
      /* elos da corrente, ondulando; a vida corre para o peito */
      var n = 14, ph = k * 6;
      c.save(); c.globalAlpha = 0.4 + ch * 0.6;
      c.beginPath(); for (i = 0; i <= n; i++) { var u = i / n, x = lp(cx + 2, ex, u), y = lp(cy, ey, u) + Math.sin(u * 9 + ph) * 2.4 * Math.sin(u * PI); c[i ? 'lineTo' : 'moveTo'](x, y); }
      c.strokeStyle = 'rgba(255,61,138,.5)'; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#ffe0f0'; c.lineWidth = 0.9; c.stroke();
      for (i = 1; i < n; i++) { var u = i / n, x = lp(cx + 2, ex, u), y = lp(cy, ey, u) + Math.sin(u * 9 + ph) * 2.4 * Math.sin(u * PI); c.beginPath(); c.ellipse(x, y, 1.6, i % 2 ? 0.8 : 1.3, 0, 0, TAU); c.strokeStyle = i % 3 ? '#ff8fbb' : YEL; c.lineWidth = 0.9; c.stroke(); }
      [0.2, 0.55, 0.85].forEach(function (q) { var u = (q + k * 0.6) % 1, x = lp(ex, cx, u), y = lp(ey, cy, u); glow(c, x, y, 1.4, 1.4, '#ffe0f0', EYEG, 8); });
      c.restore();
    }
    return;
  }
  /* idle: curvado, balançando, braços compridos pendurados */
  o = {
    H: [-2, -36 + Math.sin(t) * 0.6], S: [7 + Math.sin(t) * 0.6, -59 + Math.sin(t) * 1.2], F1: [6, 0], F2: [-8, 0],
    H1: [12 + Math.sin(t + 1) * 1.6, -28 + Math.cos(t + 1) * 0.6], H2: [2 + Math.sin(t + 1.6) * 1.6, -29], hr: 0.26 + Math.sin(t) * 0.05, jaw: 0.1 + Math.max(0, Math.sin(t * 2)) * 0.12, hs: Math.sin(t) * 1.6, fl: Math.sin(t + 0.6) * 1.6, curl: 0.35,
  };
  csBody(c, o);
}

/* ---------------- Saci-Pererê ---------------- */
function saciPal(free) {
  return free
    ? { SK: '#6b4128', SK2: '#4f2d1a', SK3: '#3e2214', SH: '#efe4c8', SH2: '#d2c3a0', CAP: '#e0322a', CAP2: '#a8201a', PIPE: '#8a5a32', HAIR: '#1c120e', MOUTH: '#5a1a1a', EMB: '#ff8a2a' }
    : { SK: '#6f6862', SK2: '#57514c', SK3: '#46413d', SH: '#a9a39a', SH2: '#8a847b', CAP: '#e0322a', CAP2: '#a8201a', PIPE: '#7c7670', HAIR: '#2c2826', MOUTH: '#2a1a20', EMB: '#ff9a9a' };
}
/* gorro vermelho: base na testa, ponta caída para trás. sp = balanço da ponta */
function saciCap(c, x, y, rot, sp, P, sc) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc || 1, sc || 1);
  var tx = -17 + sp, ty = -11 + sp * 0.5;
  cel(c, function (c) { c.moveTo(-9.4, 1.4); c.bezierCurveTo(-11, -8, -5, -17, 1, -19.6); c.bezierCurveTo(7, -15, 10.4, -6, 9.8, 1.2); c.quadraticCurveTo(0, -1.6, -9.4, 1.4); c.closePath(); }, P.CAP, {
    k: 1.8, lw: 1.9, sh: 'rgba(80,0,10,.38)', hi: 'rgba(255,200,170,.35)', inn: function (c) { ln(c, [-5, -9, -1, -16], 'rgba(255,190,170,.4)', 1.2); c.beginPath(); c.moveTo(-9.6, 1.2); c.quadraticCurveTo(0, -2, 10, 1); c.strokeStyle = 'rgba(90,0,10,.45)'; c.lineWidth = 2; c.stroke(); },
  });
  /* ponta caída para trás */
  cel(c, function (c) { c.moveTo(2, -19.4); c.quadraticCurveTo(-8, -23, tx, ty); c.quadraticCurveTo(-9, -15.4, -3.4, -13.4); c.closePath(); }, P.CAP2, { k: 0.9, lw: 1.7, hi: 'rgba(255,200,170,.3)' });
  /* pompom na ponta */
  cel(c, function (c) { el(c, tx, ty, 2.1, 2.1); }, '#f2efe6', { k: 0.5, lw: 1.3 });
  c.restore();
}
function saciHead(c, x, y, rot, P, free, o) {
  c.save(); c.translate(x, y); c.rotate(rot);
  /* cabelo crespo curto por baixo do gorro */
  cel(c, function (c) { for (var j = 0; j < 6; j++) { var a = PI + 0.2 + j * 0.42; el(c, Math.cos(a) * 7.4, -2 + Math.sin(a) * 7.4, 2.6, 2.6); } }, P.HAIR, { k: 0.6, lw: 1.4 });
  /* orelha */
  cel(c, function (c) { el(c, -6.6, 0.6, 2, 2.6, 0.2); }, P.SK2, { k: 0.6, lw: 1.5 });
  cel(c, function (c) { c.moveTo(-8, 0); c.bezierCurveTo(-8.6, -9, 6, -11, 9, -3); c.quadraticCurveTo(11.4, 2, 9, 6); c.quadraticCurveTo(2, 10.4, -4, 7.6); c.quadraticCurveTo(-8, 5, -8, 0); c.closePath(); }, P.SK, {
    k: 2, lw: 1.9, inn: function (c) { c.fillStyle = free ? 'rgba(220,90,60,.3)' : 'rgba(30,20,24,.15)'; c.beginPath(); c.ellipse(6.4, 3.4, 2.2, 1.4, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,230,200,.18)'; c.beginPath(); c.ellipse(1, -6.4, 5, 1.6, -0.2, 0, TAU); c.fill(); },
  });
  /* nariz */
  c.beginPath(); c.moveTo(9.4, -1); c.quadraticCurveTo(11.6, 0.6, 9.6, 1.8); c.strokeStyle = P.SK3; c.lineWidth = 1.1; c.lineCap = 'round'; c.stroke();
  /* sorriso arteiro com dentes */
  if (o.mouth === 'o') { c.beginPath(); c.ellipse(6.4, 5, 1.6, 1.8, 0, 0, TAU); c.fillStyle = P.MOUTH; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.9; c.stroke(); }
  else {
    c.beginPath(); c.moveTo(2.4, 3.6); c.quadraticCurveTo(6.6, 8, 9.6, 3.6); c.quadraticCurveTo(6.4, 5.4, 2.4, 3.6); c.closePath(); c.fillStyle = P.MOUTH; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
    c.beginPath(); c.moveTo(3.4, 4.1); c.quadraticCurveTo(6.4, 5.2, 9, 4); c.lineTo(8.6, 5.2); c.quadraticCurveTo(6.2, 6, 3.8, 4.9); c.closePath(); c.fillStyle = '#f6f0e2'; c.fill();
  }
  /* olhos */
  if (free) {
    [[6.4, -2.2, 2.2], [1.6, -2.4, 1.9]].forEach(function (e) { c.beginPath(); c.ellipse(e[0], e[1], e[2], e[2] * 1.15, 0, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.9; c.stroke(); dot(c, e[0] + 0.7, e[1] + 0.2, e[2] * 0.6, '#2a1608'); dot(c, e[0] + 0.3, e[1] - 0.5, e[2] * 0.25, '#fff'); });
    ln(c, [4.4, -6, 8.4, -5.6], P.HAIR, 1.3); ln(c, [-0.2, -5.4, 3, -6], P.HAIR, 1.3);
  } else if (o.dizzy) {
    [[6.4, -2.2], [1.6, -2.4]].forEach(function (e) { c.beginPath(); for (var j = 0; j <= 12; j++) { var a = j * 0.9, r = j * 0.17; c[j ? 'lineTo' : 'moveTo'](e[0] + Math.cos(a) * r, e[1] + Math.sin(a) * r); } c.strokeStyle = EYEG; c.lineWidth = 0.9; c.stroke(); });
  } else {
    eye(c, 6.4, -2.2, 1.9, 1.7, 0); eye(c, 1.6, -2.4, 1.6, 1.5, 0);
    ln(c, [4, -5.6, 8.6, -4.4], OUT, 1.4); ln(c, [-0.4, -4.4, 3.2, -5.4], OUT, 1.4);
  }
  if (!o.noPipe) {
    /* cachimbo no canto da boca */
    rope(c, function (c) { c.moveTo(8.4, 5); c.lineTo(14, 5.6); }, P.PIPE, 1.2);
    cel(c, function (c) { c.moveTo(12.6, 6); c.lineTo(12.4, 1); c.lineTo(16.6, 1); c.lineTo(16.2, 6); c.quadraticCurveTo(14.4, 7.6, 12.6, 6); c.closePath(); }, P.PIPE, { k: 0.8, lw: 1.4 });
    c.beginPath(); c.ellipse(14.5, 1, 2.1, 0.8, 0, 0, TAU); c.fillStyle = '#1a1210'; c.fill();
    glow(c, 14.5, 0.9, 1.4, 0.5, P.EMB, free ? '#ff6a00' : '#ff3d8a', 6);
  }
  if (!o.noCap) saciCap(c, 0.4, -6.4, -0.12, o.sp || 0, P);
  c.restore();
}
function saciSmoke(c, x, y, k, n, al) {
  for (var j = 0; j < n; j++) { var u = (k + j / n) % 1; puff(c, x - u * 4 + Math.sin(u * 7 + j) * 2, y - u * 18, 1.2 + u * 3, (1 - u) * (al || 0.7), '#e6e1d8'); }
}
/* o corpo inteiro de pé numa perna. o: { y, lean, kn (dobra do joelho), H1, H2 (mãos), head rot, ... } */
function saciBody(c, P, free, o) {
  var hip = [0, -21 + o.y], sh = [1.6 + o.lean * 10, -35 + o.y], hd = [3 + o.lean * 16, -45 + o.y];
  c.save(); c.translate(o.x || 0, 0);
  /* braço de trás */
  limb(c, sh[0] - 3, sh[1] + 1, o.H2[0], o.H2[1] + o.y, 7.4, 7.4, 1, 1.9, 1.7, P.SK3, P.SK3, { k: 0.6, lw: 1.6 });
  cel(c, function (c) { el(c, o.H2[0], o.H2[1] + o.y, 2.1, 2.1); }, P.SK3, { k: 0.5, lw: 1.4 });
  /* a perna só */
  var F = o.F || [1, 0], kn = limb(c, hip[0] + 1, hip[1], F[0], F[1] - 1.8, 11, 11, -1, 3, 2.5, P.SK2, P.SK2, { k: 0.8, lw: 1.8 });
  c.save(); c.translate(F[0], F[1] - 1.8); c.rotate(o.fr || 0);
  cel(c, function (c) { c.moveTo(-2.6, -0.6); c.lineTo(-2.8, 1.8); c.lineTo(5.6, 1.8); c.quadraticCurveTo(6.4, 0.2, 4, -0.4); c.closePath(); }, P.SK2, { k: 0.6, lw: 1.5 });
  c.restore();
  /* calção */
  c.save(); c.translate(hip[0], hip[1]); c.rotate(o.lean);
  cel(c, function (c) { c.moveTo(-6.4, -6); c.lineTo(6.4, -6); c.lineTo(7, 3.4); c.lineTo(1.8, 4.4); c.lineTo(0.6, 1); c.lineTo(-0.6, 4.4); c.lineTo(-6.6, 3.6); c.closePath(); }, P.SH, { k: 1.2, lw: 1.7, inn: function (c) { ln(c, [-6.4, -4.4, 6.4, -4.4], P.SH2, 1.2); if (free) ln(c, [1, -4.4, 2.4, -1.4], P.CAP, 0.9); } });
  /* tronco magrinho */
  cel(c, function (c) { c.moveTo(-5.4, -5); c.bezierCurveTo(-6.4, -10, -6, -14, -4.6, -16); c.quadraticCurveTo(0.6, -17.4, 5.4, -15.4); c.bezierCurveTo(6.4, -12, 6, -8, 5.6, -5); c.closePath(); }, P.SK, {
    k: 1.6, lw: 1.8, inn: function (c) { ln(c, [1, -9, 2.6, -8.6], 'rgba(20,10,10,.4)', 0.8); c.fillStyle = 'rgba(255,230,200,.16)'; c.beginPath(); c.ellipse(-1.6, -13, 3, 1.2, 0, 0, TAU); c.fill(); },
  });
  c.restore();
  saciHead(c, hd[0], hd[1], o.hr || 0, P, free, o);
  /* braço da frente */
  limb(c, sh[0] + 2.4, sh[1] + 1, o.H1[0], o.H1[1] + o.y, 7.4, 7.4, 1, 1.9, 1.7, P.SK2, P.SK2, { k: 0.6, lw: 1.6 });
  cel(c, function (c) { el(c, o.H1[0], o.H1[1] + o.y, 2.2, 2.2); }, P.SK, { k: 0.5, lw: 1.4 });
  c.restore();
  return hd;
}
/* redemoinho de poeira (também é o efeito `poeira`): funil de base estreita, fitas girando e folhas secas */
function whirl(c, k, H, R0, R1, al, leaves) {
  var i, n = 12, ph = k * TAU;
  function cx(y) { return Math.sin(y * 0.06 + ph) * 2.4 + Math.sin(-y * 0.11) * 1.2; }
  function rad(u) { return lp(R0, R1, Math.pow(u, 1.25)); }
  c.save();
  /* corpo translúcido */
  c.beginPath(); for (i = 0; i <= n; i++) { var u = i / n, y = -u * H; c[i ? 'lineTo' : 'moveTo'](cx(y) - rad(u), y); } for (i = n; i >= 0; i--) { var u = i / n, y = -u * H; c.lineTo(cx(y) + rad(u), y); } c.closePath();
  var g = c.createLinearGradient(-R1, 0, R1, 0); g.addColorStop(0, 'rgba(176,142,92,' + (0.12 * al) + ')'); g.addColorStop(0.4, 'rgba(226,200,150,' + (0.42 * al) + ')'); g.addColorStop(1, 'rgba(150,116,72,' + (0.2 * al) + ')');
  c.fillStyle = g; c.fill();
  /* folhas de trás */
  function leaf(j, front) {
    var u = ((j * 0.37 + k * (j % 2 ? 1 : 2)) % 1), a = ph * (j % 2 ? 2 : 3) + j * 2.3, y = -(0.15 + u * 0.8) * H, r = rad(-y / H) * 1.05, s = Math.sin(a);
    if ((s > 0) !== front) return;
    var x = cx(y) + Math.cos(a) * r, yy = y + s * r * 0.26;
    c.save(); c.translate(x, yy); c.rotate(a * 1.3); c.globalAlpha = front ? 0.95 : 0.55;
    c.beginPath(); c.moveTo(-2.4, 0); c.quadraticCurveTo(0, -1.8, 2.6, 0); c.quadraticCurveTo(0, 1.8, -2.4, 0); c.closePath(); c.fillStyle = ['#a8743a', '#c49a4a', '#7a5a2a', '#9a8a4a'][j % 4]; c.fill(); c.strokeStyle = 'rgba(40,24,10,.8)'; c.lineWidth = 0.6; c.stroke();
    c.restore();
  }
  if (leaves) for (i = 0; i < leaves; i++) leaf(i, false);
  /* fitas de poeira girando */
  for (i = 1; i <= n; i++) {
    var u = i / n, y = -u * H + Math.sin(ph * 2 + i) * 0.6, r = rad(u), a0 = ph * 2 + i * 0.9;
    c.beginPath(); c.ellipse(cx(y), y, r, r * 0.26, 0, a0, a0 + 2.2); c.strokeStyle = 'rgba(244,228,192,' + (0.55 * al) + ')'; c.lineWidth = 1.3; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.ellipse(cx(y), y, r * 0.92, r * 0.24, 0, a0 + 3.2, a0 + 4.4); c.strokeStyle = 'rgba(120,88,52,' + (0.45 * al) + ')'; c.lineWidth = 1.1; c.stroke();
  }
  /* contorno das bordas */
  [-1, 1].forEach(function (sd) { c.beginPath(); for (var j = 0; j <= n; j++) { var u = j / n, y = -u * H; c[j ? 'lineTo' : 'moveTo'](cx(y) + sd * rad(u) * (0.96 + 0.06 * Math.sin(j * 1.7 + ph * 2)), y); } c.strokeStyle = 'rgba(110,80,46,' + (0.5 * al) + ')'; c.lineWidth = 1.2; c.stroke(); });
  /* grãos */
  for (i = 0; i < 16; i++) { var u = (i * 0.618 + k * 0.5) % 1, a = ph * 3 + i * 1.9, y = -u * H, r = rad(u) * (0.7 + (i % 3) * 0.2); dot(c, cx(y) + Math.cos(a) * r, y + Math.sin(a) * r * 0.26, 0.6, 'rgba(96,70,40,' + (0.7 * al) + ')'); }
  if (leaves) for (i = 0; i < leaves; i++) leaf(i, true);
  /* poeira na base */
  for (i = 0; i < 4; i++) { var a = ph * 2 + i * 1.57; puff(c, Math.cos(a) * (R0 + 6), Math.sin(a) * 1.6, 2.4, 0.3 * al, '#d8c39a'); }
  c.restore();
}

export function drawSaci(c, anim, k, free) {
  var P = saciPal(free), t = k * TAU, i, o, hd;
  if (anim === 'special') {
    /* dentro do redemoinho: só o gorro e os olhos aparecem */
    whirl(c, k, 70, 6, 27, 1, 7);
    var hy = -46 + Math.sin(t) * 1.4, hx = Math.sin(t) * 2.4;
    c.save(); c.globalAlpha = 0.9;
    eye(c, hx + 4, hy + 6, 1.9, 1.6, 0); eye(c, hx - 1.4, hy + 6, 1.6, 1.4, 0);
    c.restore();
    saciCap(c, hx + 1, hy - 1, Math.sin(t) * 0.12, Math.sin(t * 2) * 1.6, P, 1.05);
    /* poeira passando na frente */
    for (i = 0; i < 3; i++) { var y = -30 - i * 12, a = t * 2 + i * 2; c.beginPath(); c.ellipse(Math.sin(y * 0.06 + t) * 2.4, y, 10 + i * 5, 3 + i, 0, a, a + 1.6); c.strokeStyle = 'rgba(244,228,192,.7)'; c.lineWidth = 1.6; c.stroke(); }
    return;
  }
  if (anim === 'down') {
    /* caído sentado, gorro torto, cachimbo no chão */
    var sw = k < 0.5 ? 0 : 1;
    c.beginPath(); c.ellipse(2, 0.6, 22, 4, 0, 0, TAU); c.fillStyle = 'rgba(40,30,20,.22)'; c.fill();
    /* cachimbo caído */
    c.save(); c.translate(22, -2); c.rotate(0.3);
    rope(c, function (c) { c.moveTo(-6, 0); c.lineTo(0, 0.6); }, P.PIPE, 1.2);
    cel(c, function (c) { c.moveTo(-1, 1); c.lineTo(-1.2, -4); c.lineTo(3, -4); c.lineTo(2.8, 1); c.closePath(); }, P.PIPE, { k: 0.6, lw: 1.3 });
    c.restore();
    saciSmoke(c, 23, -8, k * 0.5, 2, 0.4);
    /* perna esticada no chão */
    cel(c, function (c) { cap(c, -2, -6, 14, -3, 2.8); }, P.SK2, { k: 0.8, lw: 1.8 });
    cel(c, function (c) { c.moveTo(13, -6.4); c.lineTo(17.6, -9); c.quadraticCurveTo(19, -7, 17, -2); c.lineTo(13, -1); c.closePath(); }, P.SK2, { k: 0.6, lw: 1.5 });
    limb(c, -6, -18, -12, -3, 7.4, 7.4, -1, 1.9, 1.7, P.SK3, P.SK3, { k: 0.6, lw: 1.6 });
    cel(c, function (c) { el(c, -12, -3, 2.1, 2.1); }, P.SK3, { k: 0.5, lw: 1.4 });
    cel(c, function (c) { c.moveTo(-8, -1); c.lineTo(5, -1); c.lineTo(5, -9); c.lineTo(-7.6, -10); c.closePath(); }, P.SH, { k: 1, lw: 1.7 });
    cel(c, function (c) { c.moveTo(-7, -9); c.bezierCurveTo(-8.6, -15, -7, -21, -4, -23); c.quadraticCurveTo(1, -24, 4.6, -21); c.bezierCurveTo(4.6, -16, 4.6, -12, 4.6, -9); c.closePath(); }, P.SK, { k: 1.4, lw: 1.8 });
    c.save(); c.translate(1, -30); c.rotate(0.3 + sw * 0.08);
    saciHead(c, 0, 0, 0, P, free, { dizzy: true, noPipe: true, noCap: true, mouth: 'o' });
    /* gorro torto, caído sobre o olho */
    saciCap(c, 2.4, -5.4, 0.62 + sw * 0.05, 3, P);
    c.restore();
    limb(c, 3, -20, 9, -10, 7.4, 7.4, 1, 1.9, 1.7, P.SK2, P.SK2, { k: 0.6, lw: 1.6 });
    cel(c, function (c) { el(c, 9, -10, 2.2, 2.2); }, P.SK, { k: 0.5, lw: 1.4 });
    for (i = 0; i < 3; i++) { var a = t * 0.5 + i * 2.1 + sw; spark(c, 2 + Math.cos(a) * 9, -46 + Math.sin(a) * 2.6, 2, YEL); }
    return;
  }
  if (anim === 'atk') {
    /* chute giratório: encolhe, gira e estica a perna, com rastro de vento */
    var g1 = sm(k / 0.4), g2 = sm((k - 0.4) / 0.6), rot = lp(lp(0, 0.25, g1), -0.42, g2);
    if (g2 > 0) {
      c.save(); c.globalAlpha = g2;
      for (i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -24, 20 + i * 4, PI * 0.45, PI * (0.45 - 0.75 * g2) - i * 0.1, true); c.strokeStyle = i ? 'rgba(244,228,192,.5)' : 'rgba(255,250,236,.85)'; c.lineWidth = 2.4 - i * 0.6; c.lineCap = 'round'; c.stroke(); }
      c.restore();
    }
    c.save(); c.translate(0, -24 - g1 * 4); c.rotate(rot); c.translate(0, 24);
    var foot = mix(mix([1, 0], [6, -10], g1), [27, -26], g2);
    o = { y: -g1 * 2, lean: lp(0.15, -0.1, g2), F: foot, fr: lp(0, -1.4, g2), H1: mix([7, -26], [-6, -38], g2), H2: mix([-6, -26], [-14, -32], g2), hr: lp(0.1, -0.2, g2), sp: -3 * g2 };
    saciBody(c, P, free, o);
    c.restore();
    for (i = 0; i < 4; i++) { var u = (k + i / 4) % 1; puff(c, -6 + Math.cos(i * 1.6 + k * 6) * 14, -2 - u * 6, 1.6 + u * 2, (1 - u) * 0.5 * g2, '#d8c39a'); }
    return;
  }
  if (anim === 'cast') {
    /* tira o gorro e o gira por cima da cabeça; raios em volta */
    var g = sm(k / 0.4), sp = cl((k - 0.3) / 0.7);
    o = { y: 0, lean: -0.05 * g, H1: [10, -28], H2: mix([-7, -26], [3, -66], g), hr: -0.12 * g, noCap: g > 0.15, mouth: sp > 0.5 ? 'o' : null };
    hd = saciBody(c, P, free, o);
    if (g <= 0.15) return;
    var cx = 3, cy = -70, sq = Math.cos(k * TAU * 3);
    if (sp > 0) {
      c.save(); c.globalAlpha = sp * 0.8;
      for (i = 0; i < 2; i++) { c.beginPath(); c.ellipse(cx, cy - 4, 15 + i * 4, 4 + i, 0, k * 9 + i, k * 9 + i + 4); c.strokeStyle = 'rgba(255,240,180,.8)'; c.lineWidth = 1.2; c.stroke(); }
      c.restore();
      [[cx - 18, cy + 2, cx - 30, cy + 18], [cx + 18, cy - 2, cx + 30, cy + 10], [cx - 6, cy - 12, cx - 14, cy - 22], [cx + 10, cy - 10, cx + 22, cy - 20]].forEach(function (q, n) { if (sp > n * 0.18) bolt(c, q[0], q[1], q[2], q[3], 11 + n * 5 + Math.round(k * 7), 4, 1.2, sp); });
      glow(c, cx, cy - 2, 3 * sp, 3 * sp, 'rgba(255,250,220,.8)', YEL, 12);
    }
    saciCap(c, cx + 2, cy + 4, lp(-0.4, 0, g) + sp * Math.sin(k * TAU * 3) * 0.3, sq * 3 * sp, P, 1);
    return;
  }
  if (anim === 'move') {
    /* pulos para a frente */
    var hp = Math.sin(k * PI), y = -hp * 12, land = 1 - Math.min(1, hp * 3);
    o = { y: y + land * 2.4, lean: 0.18, F: [lp(-2, 1, hp), y], fr: hp * 0.4, H1: [lp(9, 3, hp), -26 - hp * 2], H2: [lp(-4, -10, hp), -24 - hp * 4], hr: 0.08, sp: -hp * 3 };
    saciBody(c, P, free, o);
    saciSmoke(c, 18 + o.lean * 16, -49 + o.y, k, 3, 0.55);
    if (land > 0.5) for (i = 0; i < 3; i++) puff(c, -6 + i * 6, -1, 2, 0.4, '#d8c39a');
    return;
  }
  /* idle: pulando num pé só, fumaça do cachimbo (também é o libertado) */
  var hp = Math.abs(Math.sin(k * PI)), y = -hp * 5, sq = 1 - Math.min(1, hp * 4);
  o = { y: y + sq * 1.6, lean: 0.04, F: [1, y], H1: [11, -28 + Math.sin(t) * 0.8], H2: [-6.4, -25], hr: Math.sin(t) * 0.04, sp: Math.sin(t) * 2 };
  saciBody(c, P, free, o);
  saciSmoke(c, 18 + o.lean * 16, -49 + o.y, k, 3, free ? 0.75 : 0.6);
}

/* ---------------- poeira (efeito de cenário) ---------------- */
export function drawPoeira(c, anim, k) { whirl(c, k, 58, 4, 21, 0.85, 5); }

/* ---------------- Tatu-bola (companheiro) ---------------- */
export function drawTatu(c, anim, k) {
  var SH = '#c98e52', SH2 = '#a86f3a', PL = '#e2b276', SKN = '#e0a888', SKN2 = '#c4866a', i, t = k * TAU;
  var walk = anim === 'walk', act = anim === 'act', roll = act ? sm(k) : 0, w = walk ? t : 0, b = walk ? Math.abs(Math.sin(w)) * 0.8 : Math.sin(t) * 0.3;
  if (act && roll > 0.55) {
    /* bola rolando */
    var r = 10.4, cy = -r, sp = k * PI * 3;
    for (i = 0; i < 3; i++) ln(c, [-r - 4 - i * 3, cy - 5 + i * 5, -r - 12 - i * 4, cy - 5 + i * 5], 'rgba(255,248,230,.75)', 1.2);
    puff(c, -r - 2, -2, 2.6, 0.5, '#d8c39a'); puff(c, -r - 8, -3, 2, 0.35, '#d8c39a');
    cel(c, function (c) { el(c, 0, cy, r, r); }, SH, {
      k: 2, lw: 2, inn: function (c) {
        for (var j = -2; j <= 2; j++) { var a = sp + j * 0.5; c.beginPath(); c.ellipse(0, cy, Math.abs(Math.cos(a)) * r, r, 0, 0, TAU); c.strokeStyle = 'rgba(90,50,20,.55)'; c.lineWidth = 1.1; c.stroke(); }
        for (var j = 0; j < 10; j++) { var a = sp + j * 0.63; dot(c, Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, 1.1, 'rgba(255,230,180,.45)'); }
      },
    });
    /* escudo da cabeça e do rabo, encaixados */
    c.save(); c.translate(0, cy); c.rotate(sp);
    cel(c, function (c) { poly(c, [r * 0.3, -r * 0.95, r * 0.95, -r * 0.3, r * 0.5, r * 0.1, -r * 0.1, -r * 0.4]); }, PL, { k: 0.8, lw: 1.5 });
    c.restore();
    return;
  }
  c.save(); c.translate(0, -b);
  if (act) { c.translate(0, -roll * 3); c.rotate(roll * 0.9); }
  /* pernas curtinhas */
  [[-7, PI, true], [6, 0, true], [-5, 0, false], [8, PI, false]].forEach(function (q) {
    var s = walk ? Math.sin(w + q[1]) : 0, up = walk ? Math.max(0, Math.cos(w + q[1])) * 1.6 : 0;
    cel(c, function (c) { cap(c, q[0], -6, q[0] + s * 2.4 + roll * 3, -1.6 - up + roll * -2, 2); }, q[2] ? SKN2 : SKN, { k: 0.6, lw: 1.5 });
    if (!act) [-1, 0.6].forEach(function (d) { ln(c, [q[0] + s * 2.4 + 1, -0.6 - up, q[0] + s * 2.4 + 2.4 + d, 0.4 - up], OUT, 1); });
  });
  /* rabinho com escudo */
  cel(c, function (c) { c.moveTo(-11, -7); c.quadraticCurveTo(-16, -5, -17, -2); c.lineTo(-15, -1.4); c.quadraticCurveTo(-13, -4, -10, -4); c.closePath(); }, SH2, { k: 0.6, lw: 1.5 });
  /* casco em faixas */
  cel(c, function (c) { c.moveTo(-12, -4.6); c.bezierCurveTo(-13.6, -15, -4, -19, 1, -18.4); c.bezierCurveTo(8, -18, 12.6, -13, 12, -4.6); c.quadraticCurveTo(0, -2.4, -12, -4.6); c.closePath(); }, SH, {
    k: 2, lw: 1.9, inn: function (c) {
      /* três cintas no meio e placas nas pontas */
      [-3.4, 0, 3.4].forEach(function (x) { c.beginPath(); c.moveTo(x - 0.6, -18.4); c.quadraticCurveTo(x + 0.8, -10, x, -3); c.strokeStyle = 'rgba(90,50,20,.6)'; c.lineWidth = 1.2; c.stroke(); });
      for (var j = 0; j < 9; j++) { var x = -10 + j * 2.6, y = -12 + (j % 2) * 3; dot(c, x, y, 1.1, 'rgba(255,230,180,.45)'); dot(c, x + 1.2, y + 4, 0.9, 'rgba(255,230,180,.35)'); }
      c.fillStyle = 'rgba(255,236,190,.3)'; c.beginPath(); c.ellipse(-2, -15.6, 7, 1.6, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,70,30,.35)'; c.fillRect(-14, -6.4, 28, 2);
    },
  });
  /* cabeça com escudo triangular, focinho e orelhinhas */
  var hr = walk ? Math.sin(w * 2) * 0.05 : act ? roll * 0.8 : Math.sin(t) * 0.06;
  c.save(); c.translate(10.4, -8); c.rotate(0.15 + hr);
  cel(c, function (c) { el(c, -0.4, -4.4, 1.4, 2.4, -0.4); }, SKN2, { k: 0.5, lw: 1.3 });
  cel(c, function (c) { c.moveTo(-2, -3); c.quadraticCurveTo(3, -5, 8, -1.4); c.quadraticCurveTo(9.6, 0.6, 8, 1.6); c.quadraticCurveTo(3, 2.6, -2, 2.4); c.closePath(); }, SKN, { k: 1, lw: 1.6, inn: function (c) { dot(c, 8.4, 0.2, 0.55, '#5a3020'); c.fillStyle = 'rgba(220,120,110,.35)'; c.beginPath(); c.ellipse(3, 1, 1.6, 0.8, 0, 0, TAU); c.fill(); } });
  cel(c, function (c) { c.moveTo(-2.4, -2.6); c.lineTo(5, -4); c.quadraticCurveTo(3, -1.6, -1.6, -0.4); c.closePath(); }, PL, { k: 0.5, lw: 1.3 });
  dot(c, 2.6, -1.2, 1.2, '#2a1608'); dot(c, 2.9, -1.6, 0.45, '#fff');
  c.restore();
  c.restore();
}

/* ---------------- Carcará (companheiro, voa) ---------------- */
export function drawCarcara(c, anim, k) {
  var BR = '#5a3a24', BR2 = '#3e2616', CR = '#f1e6cc', CAP = '#1e1612', FACE = '#e8582c', BK = '#8fa0b4', LEG = '#f2c23a', i,
    act = anim === 'act', dv = act ? sm(k) : 0, f = act ? 0 : k * TAU, by = -26 + (act ? dv * 4 : Math.cos(f) * 1.4);
  c.save(); c.translate(0, by); c.rotate(dv * 0.55);
  function wing(q, far) {
    var L = 22, qq = Math.abs(q) < 0.16 ? (q < 0 ? -0.16 : 0.16) : q;
    c.save(); c.translate(-1, -2.4); c.rotate(-0.25 - dv * 0.6);
    cel(c, function (c) { c.moveTo(6, 0); c.quadraticCurveTo(8.6, -L * 0.6 * qq, 2.4, -L * qq); [[-1.4, -0.92], [-3.4, -0.9], [-5.4, -0.74], [-7.6, -0.74], [-9, -0.52], [-11, -0.5], [-10.6, -0.28], [-12.4, -0.24], [-8.6, 0]].forEach(function (p) { c.lineTo(p[0], p[1] * L * qq); }); c.closePath(); }, far ? BR2 : BR, {
      k: 1.5, lw: 1.9, inn: function (c) {
        /* mancha clara barrada nas primárias */
        c.fillStyle = far ? '#cbbf9f' : CR; c.beginPath(); c.moveTo(4, -L * qq * 0.62); c.lineTo(-2, -L * qq * 0.66); c.lineTo(-3, -L * qq * 0.86); c.lineTo(2.6, -L * qq * 0.94); c.closePath(); c.fill();
        for (var j = 0; j < 4; j++) ln(c, [3.6 - j * 1.6, -L * qq * (0.62 + j * 0.08), -2.6 + j * 0.4, -L * qq * (0.64 + j * 0.08)], 'rgba(60,36,20,.6)', 0.7);
        [[2.6, -0.5], [-0.6, -0.5], [-4, -0.44], [-7, -0.34]].forEach(function (p) { ln(c, [p[0] * 0.5 + 1, -L * qq * 0.18, p[0], p[1] * L * qq], 'rgba(30,16,8,.45)', 0.8); });
      },
    });
    c.restore();
  }
  var q = act ? lp(0.5, 0.95, dv) : Math.cos(f);
  wing(act ? q : Math.cos(f - 0.5), true);
  /* rabo comprido, claro com barras e ponta escura */
  cel(c, function (c) { c.moveTo(-6, -2.4); c.lineTo(-19, -3.6 + (act ? 0 : Math.sin(f) * 0.6)); c.lineTo(-19.4, 1.6); c.lineTo(-6, 2.4); c.closePath(); }, CR, { k: 0.8, lw: 1.7, inn: function (c) { for (var j = 0; j < 4; j++) ln(c, [-9 - j * 2.4, -3, -9 - j * 2.4, 2], 'rgba(70,44,24,.5)', 0.8); c.fillStyle = BR2; c.fillRect(-20, -4, 3.4, 7); } });
  /* pernas amarelas: recolhidas, ou para a frente com as garras abertas no mergulho */
  var tx = lp(-3, 12, dv), ty = lp(5.6, 9, dv);
  ln(c, [0, 3, tx, ty], OUT, 3); ln(c, [0, 3, tx, ty], LEG, 1.5);
  ln(c, [-2.4, 3, tx - 2.6, ty - 0.6], OUT, 3); ln(c, [-2.4, 3, tx - 2.6, ty - 0.6], '#d8a830', 1.5);
  if (dv > 0.2) [[tx, ty], [tx - 2.6, ty - 0.6]].forEach(function (p) { [-0.7, 0, 0.7].forEach(function (d) { var a = 0.2 + d * dv; ln(c, [p[0], p[1], p[0] + Math.cos(a) * 3, p[1] + Math.sin(a) * 3], OUT, 1.2); }); });
  /* corpo: dorso marrom, peito claro barrado */
  cel(c, function (c) { el(c, 0, 0, 9.6, 5.6, -0.08); }, BR, { k: 1.8, lw: 1.9, inn: function (c) { c.fillStyle = CR; c.beginPath(); c.ellipse(4, 2, 6.4, 3.4, -0.3, 0, TAU); c.fill(); for (var j = 0; j < 5; j++) ln(c, [0 + j * 1.8, 0.6 + j * 0.3, 1.4 + j * 1.8, 3.6 + j * 0.2], 'rgba(70,44,24,.55)', 0.8); } });
  /* cabeça: boné preto com topete, cara vermelha, bico azulado em gancho */
  c.save(); c.translate(9.4, -4.4); c.rotate(-0.05 + dv * 0.2);
  cel(c, function (c) { el(c, 0.6, 0.4, 4.6, 4, 0); }, CR, { k: 1, lw: 1.7 });
  cel(c, function (c) { c.moveTo(-4.4, -0.4); c.quadraticCurveTo(-2, -5.6, 3.4, -4); c.quadraticCurveTo(-1, -3, -1.6, 0.2); c.lineTo(-5.6, -1.6); c.closePath(); }, CAP, { k: 0.6, lw: 1.4 });
  cel(c, function (c) { el(c, 3.2, 0.2, 2.2, 1.8, 0); }, FACE, { k: 0.5, lw: 1.2 });
  cel(c, function (c) { c.moveTo(4.4, -1); c.quadraticCurveTo(8, -1.4, 8.4, 1.8); c.quadraticCurveTo(7.4, 2.8, 6.8, 1.6); c.lineTo(4.6, 1.6); c.closePath(); }, BK, { k: 0.5, lw: 1.3, inn: function (c) { c.fillStyle = '#efe4c0'; c.beginPath(); c.ellipse(7.8, 1.2, 1, 1.2, 0, 0, TAU); c.fill(); } });
  dot(c, 2.4, -1, 1.15, '#3a1a08'); dot(c, 2.7, -1.4, 0.4, '#fff');
  c.restore();
  wing(q, false);
  c.restore();
}
