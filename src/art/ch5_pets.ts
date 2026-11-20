// @ts-nocheck
/* Companheiros do Capítulo 5: vaga-lume (voa), preguiça e sucuri. Coloridos, vivos, simpáticos.
   Virados para a direita, pés em (0,0). `corpo` ganha um fio de luz quente bem leve; `fx` por cima. */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, ik, cl, lp, sm, seg, rope, bz, tube, tooth, furStrokes, rng, mark, getMark } from './ch5_util';

function lighter(c, x, y, r, rgb, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
/* olho fofo: branco, íris, pupila e brilho */
function cute(c, x, y, r, iris, closed) {
  if (closed) { c.beginPath(); c.arc(x, y - r * .2, r * .8, .2, PI - .2); c.strokeStyle = OUT; c.lineWidth = 1.2; c.lineCap = 'round'; c.stroke(); return; }
  c.beginPath(); c.ellipse(x, y, r, r * 1.08, 0, 0, TAU); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  dot(c, x + r * .2, y + r * .05, r * .68, iris || '#4a2a14'); dot(c, x + r * .26, y + r * .08, r * .38, '#140a06'); dot(c, x + r * .45, y - r * .28, r * .26, '#ffffff');
}

/* ================= vaga-lume ================= */
export function vagalume(c, anim, k) {
  var ph = k * TAU, fl = anim === 'act' ? 0 : Math.sin(ph * 2), bob = anim === 'act' ? -sm(k) * 2 : Math.sin(ph) * 1.4, lit = anim === 'act' ? .6 + sm(k) * .4 : .55 + .45 * (.5 + .5 * Math.sin(ph));
  c.save(); c.translate(0, -15 + bob); c.rotate(anim === 'act' ? -.15 * sm(k) : .05);
  /* asas de trás (translúcidas, batendo) */
  [[-1, -4, .9], [1, -3, 1]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(-1.9 + fl * .55 * q[2] + (anim === 'act' ? -.4 : 0)); c.beginPath(); c.ellipse(5.4, 0, 6.4, 2.6, 0, 0, TAU); c.fillStyle = 'rgba(214,240,255,.55)'; c.fill(); c.strokeStyle = 'rgba(40,60,80,.7)'; c.lineWidth = .8; c.stroke(); ln(c, [0, 0, 10, 0], 'rgba(60,90,110,.5)', .5); c.restore(); });
  /* abdômen: a lanterna */
  cel(c, function (c) { el(c, -6.6, 1.4, 5.4, 3.6, .25); }, lit > .8 ? '#f6ff9a' : '#d9ef5e', { k: 1, lw: 1.5, sh: 'rgba(120,150,20,.35)', hi: 'rgba(255,255,230,.6)', inn: function (c) { ln(c, [-9, -1, -8, 4], 'rgba(120,140,30,.5)', .7); ln(c, [-6, -1.6, -5, 4.4], 'rgba(120,140,30,.5)', .7); } });
  mark(c, 'lamp', -7, 1.6);
  /* perninhas */
  [[-1, 3, -2, 6.4], [1.4, 3, 1.4, 6.6], [3.4, 2.4, 5, 5.6]].forEach(function (q) { ln(c, q, OUT, 1.4); ln(c, q, '#3a2a30', .6); });
  /* élitros: pretos com borda amarela, um pouco abertos */
  cel(c, function (c) { c.moveTo(3, -3.6); c.bezierCurveTo(-1, -6.4 - fl * .4, -8, -5, -10, -1.4); c.quadraticCurveTo(-4, 1.4, 3, 1); c.closePath(); }, '#2e2a3a', { k: 1, lw: 1.5, hi: 'rgba(200,190,255,.3)', inn: function (c) { c.beginPath(); c.moveTo(2.6, -3.2); c.bezierCurveTo(-1, -5.8 - fl * .4, -7.6, -4.6, -9.4, -1.4); c.strokeStyle = '#ffd23f'; c.lineWidth = .9; c.stroke(); } });
  /* escudo vermelho-alaranjado e cabeça */
  cel(c, function (c) { el(c, 4.2, -2.2, 3.4, 3, -.2); }, '#ff7a3a', { k: .8, lw: 1.5, hi: 'rgba(255,240,200,.5)', inn: function (c) { dot(c, 4.6, -2.8, 1, '#2e2a3a'); } });
  cel(c, function (c) { el(c, 7.8, -.6, 3.6, 3.4); }, '#3b3346', { k: .8, lw: 1.5 });
  /* antenas */
  rope(c, function (c) { c.moveTo(8.6, -3.4); c.quadraticCurveTo(10, -7.6, 13, -8.4); }, '#3b3346', .7); rope(c, function (c) { c.moveTo(7.4, -3.6); c.quadraticCurveTo(7.6, -8, 9.6, -9.6); }, '#3b3346', .7);
  dot(c, 13, -8.4, .9, '#ffd23f'); dot(c, 9.6, -9.6, .9, '#ffd23f');
  cute(c, 9, -1, 1.7, '#3a7ad9', anim === 'act' && k > .3);
  c.beginPath(); c.arc(10, 1, .9, .3, PI - .3); c.strokeStyle = OUT; c.lineWidth = .7; c.stroke();
  c.restore();
}
export function vagalumeFx(c, anim, k) {
  var p = getMark('lamp'), ph = k * TAU;
  if (anim !== 'act') { lighter(c, p[0], p[1], 9 + 3 * Math.sin(ph), '230,255,120', .55); return; }
  var g = sm(k);
  lighter(c, p[0], p[1], 10 + g * 28, '240,255,160', .6 + g * .4);
  for (var i = 0; i < 10; i++) { var a = i * TAU / 10 + .1, r0 = 5 + g * 4, r1 = r0 + 3 + g * 14 * (i % 2 ? .6 : 1); ln(c, [p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0, p[0] + Math.cos(a) * r1, p[1] + Math.sin(a) * r1], 'rgba(250,255,190,' + (.3 + g * .65) + ')', 1.2); }
  if (k > .9) { c.beginPath(); c.arc(p[0], p[1], 20, 0, TAU); c.strokeStyle = 'rgba(250,255,200,.7)'; c.lineWidth = 1.4; c.stroke(); }
}

/* ================= preguiça ================= */
var SF = '#a07c58', SF2 = '#85633f', SF3 = '#6c4e30', FACE = '#efdcb8', MASK = '#4a3020', ALG = 'rgba(110,150,80,.35)';
function slothFur(c, x0, y0, x1, y1, n, seed) { furStrokes(c, rng(seed), x0, y0, x1, y1, n, 'rgba(60,40,20,.35)', 2.4, PI / 2, .7); furStrokes(c, rng(seed + 1), x0, y0, x1, y1, n >> 1, 'rgba(255,240,210,.25)', 2, PI / 2, .6); }
function slothHead(c, x, y, a, o) {
  c.save(); c.translate(x, y); c.rotate(a);
  cel(c, function (c) { el(c, 0, 0, 7.6, 7); }, SF, { k: 1.4, lw: 1.9, inn: function (c) { slothFur(c, -7, -7, 7, 6, 10, 3); } });
  cel(c, function (c) { el(c, 2, .8, 5.6, 4.8); }, FACE, { k: .8, lw: 1.3, sh: 'rgba(120,80,40,.25)' });
  /* máscara escura em volta dos olhos */
  [[-.6, -.2], [4.8, -.2]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], 2.6, 1.6, q[0] < 0 ? .5 : -.2, 0, TAU); c.fillStyle = MASK; c.fill(); });
  if (o.closed) { [[-.4, -.2], [4.8, -.2]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1] - .4, 1.2, .3, PI - .3); c.strokeStyle = '#f6e6c8'; c.lineWidth = .9; c.lineCap = 'round'; c.stroke(); }); }
  else { [[-.4, -.2], [4.8, -.2]].forEach(function (q) { dot(c, q[0], q[1], 1.1, '#140a06'); dot(c, q[0] + .4, q[1] - .4, .4, '#fff'); }); }
  dot(c, 2.6, 2.2, 1.2, '#2a1810');
  if (o.yawn) { c.beginPath(); c.ellipse(2.6, 4.6, 1.6, 1.2 + o.yawn * 1.8, 0, 0, TAU); c.fillStyle = '#7a2a2a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .9; c.stroke(); dot(c, 2.6, 5.4 + o.yawn, .9, '#e86a6a'); }
  else { c.beginPath(); c.arc(2.6, 3.2, 1.8, .4, PI - .4); c.strokeStyle = '#2a1810'; c.lineWidth = .9; c.lineCap = 'round'; c.stroke(); }
  c.restore();
}
function slothLimb(c, A, H, l1, l2, dir, col, clawA) {
  var K = ik(A[0], A[1], H[0], H[1], l1, l2, dir);
  cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 2.8); }, col, { k: .8, lw: 1.6 });
  cel(c, function (c) { cap(c, K[0], K[1], H[0], H[1], 2.4); }, col, { k: .7, lw: 1.5 });
  for (var i = 0; i < 3; i++) { var d = (i - 1) * .3, x1 = H[0] + Math.cos(clawA + d) * 4, y1 = H[1] + Math.sin(clawA + d) * 4; c.beginPath(); c.moveTo(H[0], H[1]); c.quadraticCurveTo(H[0] + Math.cos(clawA + d) * 3, H[1] + Math.sin(clawA + d) * 3 - 1, x1, y1); c.strokeStyle = OUT; c.lineWidth = 2; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#efe2c2'; c.lineWidth = .9; c.stroke(); }
}
export function preguica(c, anim, k) {
  var ph = k * TAU, b = Math.sin(ph);
  if (anim === 'walk') {
    var s = Math.sin(ph), cc = Math.cos(ph), y = -12 + Math.abs(cc) * .6;
    slothLimb(c, [-9, y + 2], [-14 - s * 3, -Math.max(0, cc) * 2], 7, 7, 1, SF3, PI * .9);
    slothLimb(c, [7, y], [16 + s * 4, -Math.max(0, -cc) * 2.4], 8, 8, 1, SF3, .2);
    cel(c, function (c) { el(c, -2, y - 3, 14, 8.6, -.05); }, SF, { k: 2, lw: 2, inn: function (c) { slothFur(c, -16, y - 12, 12, y + 5, 30, 11); c.fillStyle = ALG; c.beginPath(); c.ellipse(-4, y - 9, 8, 3, 0, 0, TAU); c.fill(); } });
    slothLimb(c, [-7, y + 2], [-10 + s * 3, -Math.max(0, -cc) * 2], 7, 7, 1, SF2, PI * .9);
    slothLimb(c, [8, y + 1], [17 - s * 4, -Math.max(0, cc) * 2.4], 8, 8, 1, SF2, .2);
    slothHead(c, 14, y - 7 + s * .4, .1, {});
    return;
  }
  var st = anim === 'act' ? sm(k) : 0, sway = anim === 'idle' ? b * .05 : 0, blink = anim === 'idle' && k > .7;
  c.save(); c.rotate(sway);
  /* pernas curtas e pés */
  slothLimb(c, [-3, -7], [6, -1], 5, 5, -1, SF3, .1); slothLimb(c, [2, -7], [10, -1], 5, 5, -1, SF2, .1);
  /* braço de trás */
  slothLimb(c, [-4, -22 - st * 2], [lp(5, -6, st), lp(-11, -44, st)], 9, 9, lp(1, -1, st) > 0 ? 1 : -1, SF3, lp(.3, -1.9, st));
  /* corpo redondo, peludo, com um pouco de alga verde */
  cel(c, function (c) { el(c, 0, -15 - st * 1.5, 11, 12 + st * 1.5); }, SF, { k: 2.4, lw: 2.1, inn: function (c) {
    slothFur(c, -11, -28, 11, -3, 34, 21); c.fillStyle = ALG; c.beginPath(); c.ellipse(-5, -22, 5, 7, .3, 0, TAU); c.fill();
    c.fillStyle = 'rgba(240,220,180,.35)'; c.beginPath(); c.ellipse(3, -12, 6, 7, 0, 0, TAU); c.fill();
  } });
  slothHead(c, 4, -30 - st * 3, -st * .35 + sway, { closed: blink || st > .3, yawn: anim === 'act' ? sm(seg(k, .2, 1)) : 0 });
  /* braço da frente: abraça a barriga ou estica para cima */
  slothLimb(c, [5, -22 - st * 2], [lp(-2, 12, st), lp(-11, -45, st)], 9, 9, st > .5 ? 1 : -1, SF2, lp(PI, -1.3, st));
  mark(c, 'head', 6, -42 - st * 3);
  c.restore();
}
export function preguicaFx(c, anim, k) {
  if (anim === 'act' && k > .4) { var h = getMark('head'); c.save(); c.font = 'bold 7px sans-serif'; c.fillStyle = 'rgba(240,240,255,' + sm(seg(k, .4, 1)) + ')'; c.strokeStyle = 'rgba(30,30,50,.7)'; c.lineWidth = 2; c.strokeText('z', h[0] + 8, h[1] - 2); c.fillText('z', h[0] + 8, h[1] - 2); c.font = 'bold 5px sans-serif'; c.strokeText('z', h[0] + 13, h[1] - 7); c.fillText('z', h[0] + 13, h[1] - 7); c.restore(); }
}

/* ================= sucuri ================= */
var SN = '#7b8a3c', SN2 = '#5f6e2c', SPOT = '#2e2c1a', BEL = '#e2cc80';
function snakeBody(c, P, base) {
  cel(c, tube(P), base || SN, { k: 1.6, lw: 2, sh: 'rgba(30,40,10,.35)', hi: 'rgba(240,255,200,.3)', inn: function (c) {
    /* barriga clara embaixo e as manchas pretas da sucuri */
    c.beginPath(); for (var i = 0; i < P.length; i++) c[i ? 'lineTo' : 'moveTo'](P[i][0], P[i][1] + P[i][2] * .7); c.strokeStyle = BEL; c.lineWidth = 2.2; c.lineCap = 'round'; c.stroke();
    for (var j = 1; j < P.length - 1; j += 2) { var q = P[j]; c.beginPath(); c.ellipse(q[0], q[1] - q[2] * .25, q[2] * .55, q[2] * .45, 0, 0, TAU); c.fillStyle = SPOT; c.fill(); c.beginPath(); c.ellipse(q[0], q[1] - q[2] * .25, q[2] * .25, q[2] * .2, 0, 0, TAU); c.fillStyle = '#a8a050'; c.fill(); }
  } });
}
function snakeHead(c, x, y, a, tongue) {
  c.save(); c.translate(x, y); c.rotate(a);
  if (tongue) { ln(c, [5, 1, 9, 1.2], '#d8364a', .8); ln(c, [9, 1.2, 10.4, .2], '#d8364a', .6); ln(c, [9, 1.2, 10.4, 2.2], '#d8364a', .6); }
  cel(c, function (c) { c.moveTo(-3, -2.6); c.quadraticCurveTo(2, -4.4, 6, -2); c.quadraticCurveTo(8, 0, 6, 2); c.quadraticCurveTo(1, 3.4, -3, 2.6); c.closePath(); }, SN, { k: 1, lw: 1.6, inn: function (c) { ln(c, [-2, -1, 3, -2.4], SPOT, 1.2); c.fillStyle = BEL; c.beginPath(); c.ellipse(2, 2.2, 4, 1, 0, 0, TAU); c.fill(); } });
  cute(c, 2.6, -1.6, 1.5, '#d9a441');
  c.beginPath(); c.arc(4.2, .6, 2, .2, 1.2); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke();
  dot(c, 6.4, -1, .4, OUT);
  c.restore();
}
export function sucuri(c, anim, k) {
  var ph = k * TAU;
  if (anim === 'walk') {
    var P = [], n = 16, i;
    for (i = 0; i <= n; i++) { var u = i / n, x = -26 + u * 40, y = -3.6 - Math.max(0, Math.sin(u * 9 - ph)) * 3 * (1 - u * .3) - (u > .8 ? (u - .8) * 30 : 0); P.push([x, y, lp(1.4, 3.8, Math.min(1, u * 1.6)) * (u > .92 ? .9 : 1)]); }
    snakeBody(c, P); var h = P[n]; snakeHead(c, h[0] + 1, h[1] - 1, -.15, k > .5); return;
  }
  var co = anim === 'act' ? sm(k) : 0, br = anim === 'idle' ? Math.sin(ph) : 0;
  /* voltas enroladas no chão; no `act` sobem numa espiral apertada */
  var rings = 2 + co, i2;
  for (i2 = 0; i2 < Math.ceil(rings); i2++) {
    var f = Math.min(1, rings - i2), ry = -4 - i2 * lp(5, 7, co), rx = lp(14, 10, co) - i2 * lp(2, .5, co), P2 = [];
    for (var j = 0; j <= 14; j++) { var a = PI * (j / 14) * 2 * f; P2.push([Math.cos(a) * rx, ry + Math.sin(a) * rx * .32, 3.6 - i2 * .2]); }
    /* metade de trás primeiro, depois a da frente */
    snakeBody(c, P2.slice(0, 8).reverse(), SN2);
    if (P2.length > 8) snakeBody(c, P2.slice(7), SN);
  }
  /* pescoço erguido e cabeça */
  var top = -4 - Math.ceil(rings - 1) * lp(5, 7, co), hx = lp(9, 4, co) + br * .6, hy = top - lp(14, 12, co) + br * .8;
  var NK = bz(lp(10, 6, co), top - 1, lp(16, 10, co), top - 5, hx - 6, hy + 6, hx, hy, 8, 3.4, 2.8);
  snakeBody(c, NK); snakeHead(c, hx + 1, hy - .6, -.2 + br * .05, anim === 'idle' && k > .4 && k < .8);
}
export function sucuriFx(c, anim, k) {}
