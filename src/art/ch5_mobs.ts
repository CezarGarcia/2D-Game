// @ts-nocheck
/* Monstros comuns do Capítulo 5 (Selva Profunda): morcego, besouro-rinoceronte de pedra,
   caranguejeira, macaco-prego e totem de barro. Assombros: cinzentos puxados para o verde-azulado,
   olhos rosa fortes e um resto de cor âmbar de pedra. Virados para a direita, pés em (0,0).
   Cada bicho tem `corpo` (vai com o contorno de luz) e `fx` (efeitos por cima, sem contorno). */
import { OUT, TAU, PI, el, cap, poly, cel, ln, dot, glow, ik, cl, lp, sm, seg, rope, bz, tube, tooth, arm2, furStrokes, rng, aeye, mark, getMark, G0, G1, G2, G3, G4, G5, AMB, AMB2, AMB3 } from './ch5_util';

var FUR = 'rgba(30,38,38,.42)', FURL = 'rgba(214,226,220,.32)';
/* raio de luz e brilho (para pedras âmbar acesas) */
function shine(c, x, y, r, rgb, a) { var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
function speedLines(c, x, y, ang, n, len, al) { for (var i = 0; i < n; i++) { var o = (i - (n - 1) / 2) * 3.4, px = x - Math.sin(ang) * o, py = y + Math.cos(ang) * o, l = len * (i % 2 ? .7 : 1); ln(c, [px, py, px - Math.cos(ang) * l, py - Math.sin(ang) * l], 'rgba(220,236,230,' + al + ')', 1.2); } }

/* ================= morcego ================= */
/* asa vista de lado, apontando para cima no espaço local; th gira (−0,3 alta, −2,3 baixa) */
function batWing(c, th, ws, far) {
  c.save(); c.rotate(th); c.scale(lp(.55, 1, ws), ws);
  var W = [2.6, -8.2], T = [[3.6, -16.6], [-2.6, -15.6], [-7.4, -10.6], [-7.8, -3.4], [-3.4, 1.6]];
  function mem(c) {
    c.moveTo(0, 0); c.lineTo(W[0], W[1]); c.lineTo(T[0][0], T[0][1]);
    for (var i = 1; i < T.length; i++) { var a = T[i - 1], b = T[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; c.quadraticCurveTo(lp(mx, W[0], .34), lp(my, W[1], .34), b[0], b[1]); }
    c.closePath();
  }
  cel(c, mem, far ? G4 : G3, { k: 1.1, lw: 1.6, sh: 'rgba(10,16,20,.4)', hi: 'rgba(200,226,220,.18)', inn: function (c) {
    for (var i = 0; i < 4; i++) ln(c, [W[0], W[1], T[i][0], T[i][1]], far ? G5 : G4, 1);
    c.fillStyle = 'rgba(160,110,130,.16)'; c.beginPath(); c.ellipse(-2, -7, 4, 6, -.3, 0, TAU); c.fill();
  } });
  cel(c, function (c) { cap(c, 0, 0, W[0], W[1], 1.15); }, far ? G3 : G2, { k: .5, lw: 1.3 });
  /* polegar com garrinha */
  ln(c, [W[0], W[1], W[0] + 1.6, W[1] - 1.6], OUT, 1.6);
  c.restore();
}
export function morcego(c, anim, k) {
  var mv = anim !== 'atk', ph = mv ? k * TAU : 0, fl = mv ? (1 - Math.cos(ph)) / 2 : 0, bob = mv ? Math.sin(ph) * 1.6 : 0, th, ws = 1, rot = 0, mo = 0, d = mv ? 0 : k;
  if (mv) th = lp(-.3, -2.3, fl);
  else { var f = sm(seg(d, .3, 1)); th = lp(-.12, -1.75, f); ws = lp(1.08, .52, f); rot = lp(-.28, .8, sm(d)); mo = sm(seg(d, 0, .35)); }
  c.save(); c.translate(0, -15 + bob); c.rotate(rot);
  c.save(); c.translate(.6, -2.6); batWing(c, th + .32, ws * .94, true); c.restore();
  /* pezinhos */
  [[-5, 2.6, -7, 6.6], [-3.4, 3.2, -4.6, 7]].forEach(function (q) { ln(c, [q[0], q[1], q[2], q[3]], OUT, 2.2); ln(c, [q[0], q[1], q[2], q[3]], G3, 1); ln(c, [q[2], q[3], q[2] + 1.2, q[3] + .8], OUT, .9); });
  /* corpo peludo */
  cel(c, function (c) { el(c, -1.2, 0, 5.8, 4.5, -.12); }, G1, { k: 1.4, lw: 1.8, inn: function (c) {
    c.fillStyle = 'rgba(214,224,218,.3)'; c.beginPath(); c.ellipse(0, 2.4, 4.4, 2, -.1, 0, TAU); c.fill();
    furStrokes(c, rng(5), -6, -3.6, 3, 2.6, 16, FUR, 1.8, PI * .9, .7);
  } });
  /* orelhas */
  [[3.2, -4.8, 2, -11.8, 6.2, -5.6, G2], [5.6, -5.4, 8.6, -11.4, 8.8, -4.2, G1]].forEach(function (q) {
    cel(c, function (c) { c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[0] - .6, q[3] + 3, q[2], q[3]); c.quadraticCurveTo(q[4] + .4, q[3] + 3.6, q[4], q[5]); c.closePath(); }, q[6], { k: .8, lw: 1.5, inn: function (c) { c.fillStyle = 'rgba(176,120,140,.4)'; c.beginPath(); c.moveTo(q[0] + 1, q[1] - .4); c.quadraticCurveTo(q[0] + .4, q[3] + 3.4, q[2] + .4, q[3] + 1.6); c.quadraticCurveTo(q[4] - .6, q[3] + 3.6, q[4] - .8, q[5] - .2); c.closePath(); c.fill(); } });
  });
  /* cabeça e focinho de folha */
  cel(c, function (c) { el(c, 5.4, -2.3, 3.8, 3.5); }, G1, { k: 1, lw: 1.7 });
  cel(c, function (c) { el(c, 8.7, -1.4, 2, 1.6, .1); }, G2, { k: .5, lw: 1.3, inn: function (c) { dot(c, 9.6, -1.9, .45, OUT); } });
  if (mo > .05) { c.beginPath(); c.moveTo(6.4, 0); c.quadraticCurveTo(8.6, .3 + mo * 2.6, 10, .2); c.lineTo(6.6, -.4); c.closePath(); c.fillStyle = '#3a1222'; c.fill(); c.strokeStyle = OUT; c.lineWidth = .8; c.stroke(); tooth(c, 8, -.2, .5, 1.6); tooth(c, 9.4, 0, .45, 1.4); tooth(c, 8.6, .4 + mo * 2.4, .45, -1.3); }
  else { tooth(c, 8.2, .1, .45, 1.4); tooth(c, 9.4, .1, .4, 1.2); }
  aeye(c, 6.7, -3.2, 1.15, { halo: 4 });
  ln(c, [5.2, -5, 8, -4.4], OUT, 1);
  c.save(); c.translate(-.4, -2.2); batWing(c, th, ws, false); c.restore();
  mark(c, 'nose', 10, -1);
  c.restore();
}
export function morcegoFx(c, anim, k) {
  if (anim !== 'atk' || k < .5) return;
  var p = getMark('nose'), a = .8; speedLines(c, p[0] - 10, p[1] - 6, a, 4, 12 * k, .55 * k);
}

/* ================= besouro-rinoceronte de pedra ================= */
export function besouro(c, anim, k) {
  var mv = anim === 'move', ph = mv ? k * TAU : 0, rear = 0, hit = 0;
  if (anim === 'atk') { rear = sm(seg(k, 0, .67)); hit = sm(seg(k, .67, 1)); }
  var bob = mv ? Math.abs(Math.sin(ph)) * .7 : 0, rot = -rear * .2 + hit * .3, tx = -rear * 2.4 + hit * 7, PX = -15, PY = -6, co = Math.cos(rot), si = Math.sin(rot);
  function B(x, y) { var dx = x - PX, dy = y - PY; return [PX + dx * co - dy * si + tx, PY + dx * si + dy * co - bob]; }
  var hr = -rear * .55 + hit * .55;
  /* pernas: [encaixe, pé, grupo, perna da frente?] */
  function leg(at, fx, grp, far, kind) {
    var A = B(at[0], at[1]), o = ph + grp * PI, dx = mv ? Math.sin(o) * 3.2 : 0, lift = mv ? Math.max(0, Math.cos(o)) * 2.4 : 0;
    var F = [fx + dx + (kind === 0 ? hit * 4 : 0) + (far ? 1.6 : 0), (far ? -1.6 : 0) - lift];
    var k1 = ik(A[0], A[1], F[0], F[1], 8.6, 9.6, 1), k2 = ik(A[0], A[1], F[0], F[1], 8.6, 9.6, -1), K = k1[1] < k2[1] ? k1 : k2;
    var col = far ? G4 : G3, col2 = far ? G5 : G4;
    cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 1.9); }, col, { k: .7, lw: 1.5 });
    cel(c, function (c) { cap(c, K[0], K[1], F[0], F[1] - .8, 1.35); }, col2, { k: .5, lw: 1.4, inn: function (c) { } });
    var a = Math.atan2(F[1] - K[1], F[0] - K[0]);
    for (var i = 1; i < 4; i++) { var u = i / 4, sx = lp(K[0], F[0], u), sy = lp(K[1], F[1], u); ln(c, [sx, sy, sx + Math.cos(a - (kind === 2 ? -1.9 : 1.9)) * 1.8, sy + Math.sin(a - (kind === 2 ? -1.9 : 1.9)) * 1.8], OUT, 1); }
    ln(c, [F[0], F[1] - .6, F[0] + (kind === 2 ? -2 : 2), F[1] + .2], OUT, 1.4);
  }
  leg([7, -10], 18, 1, true, 0); leg([1, -9], 7, 0, true, 1); leg([-6, -9], -12, 1, true, 2);
  c.save(); c.translate(tx, -bob); c.translate(PX, PY); c.rotate(rot); c.translate(-PX, -PY);
  /* barriga em gomos */
  cel(c, function (c) { el(c, -5, -8, 14, 4.6, .02); }, G4, { k: .8, lw: 1.6, inn: function (c) { for (var i = 0; i < 5; i++) ln(c, [-14 + i * 4.6, -11, -15 + i * 4.6, -4], 'rgba(10,14,16,.5)', .9); } });
  /* cabeça (atrás do escudo) com o chifre grande */
  c.save(); c.translate(13, -14); c.rotate(hr);
  var HN = bz(3, -2.6, 8, -5, 11.6, -10, 13.4, -17.6, 8, 2.7, .6);
  cel(c, tube(HN), G1, { k: 1, lw: 1.7, inn: function (c) { ln(c, [5, -4.6, 9.4, -7.4, 11.6, -12], 'rgba(255,255,255,.2)', 1); for (var i = 2; i < 7; i++) ln(c, [HN[i][0] - 2, HN[i][1] + 1, HN[i][0] + 1.6, HN[i][1] + .4], 'rgba(20,26,28,.35)', .7); } });
  mark(c, 'horn', 13.4, -17.6);
  cel(c, function (c) { el(c, 3.2, 1, 4.6, 3.8, .2); }, G2, { k: 1, lw: 1.7, inn: function (c) { dot(c, 6, 3.2, .8, 'rgba(10,14,16,.6)'); } });
  /* palpos */
  ln(c, [6.6, 3.4, 8.2, 5.4], OUT, 1.6); ln(c, [6.6, 3.4, 8.2, 5.4], G3, .7);
  aeye(c, 4.4, -.3, 1.25, { halo: 3.6 });
  c.restore();
  /* élitros: a carapaça de pedra */
  function shell(c) { c.moveTo(-21.6, -8.6); c.bezierCurveTo(-22.4, -22, -9, -31.4, 1.6, -28.4); c.bezierCurveTo(6, -27, 8, -21, 7.6, -11); c.quadraticCurveTo(-7, -5.2, -21.6, -8.6); c.closePath(); }
  cel(c, shell, G1, { k: 2.6, lw: 2.2, sh: 'rgba(14,22,24,.42)', hi: 'rgba(220,236,228,.24)', inn: function (c) {
    /* placas de pedra separadas por rachas com veio âmbar */
    var CR = [[-19, -12, -15, -18, -16, -25], [-15, -18, -8, -19, -3, -28], [-8, -19, -6, -11], [-8, -19, 0, -16, 6, -18], [0, -16, 1, -9], [-15, -18, -14, -10]];
    CR.forEach(function (p) { ln(c, p, 'rgba(14,18,18,.7)', 1.5); });
    CR.forEach(function (p, i) { if (i % 2 === 0) ln(c, p, AMB, .7); });
    c.fillStyle = 'rgba(255,255,255,.13)'; [[-13, -24, 3.4, 1.8], [-3, -24, 3, 1.4], [-17, -15, 2, 1.2], [-4, -14.6, 2.2, 1]].forEach(function (q) { c.beginPath(); c.ellipse(q[0], q[1], q[2], q[3], -.3, 0, TAU); c.fill(); });
    /* musgo no alto */
    c.fillStyle = 'rgba(112,140,114,.85)'; c.beginPath(); c.ellipse(-8, -28.4, 8, 2.8, -.12, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-16, -23.6, 3.4, 2.2, -.7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,186,150,.6)'; [[-11, -29.2], [-6, -29.8], [-3, -28.8], [-15, -25]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], .9, 0, TAU); c.fill(); });
    /* linha da junta dos élitros */
    c.beginPath(); c.moveTo(4, -26); c.quadraticCurveTo(-8, -18, -21, -10); c.strokeStyle = 'rgba(14,18,18,.4)'; c.lineWidth = .9; c.stroke();
  } });
  /* pronoto (escudo do peito) com o chifre curto */
  cel(c, function (c) { c.moveTo(4.6, -9.6); c.bezierCurveTo(3.4, -18, 5, -24.4, 9.4, -25); c.quadraticCurveTo(13.6, -30, 17.4, -31); c.quadraticCurveTo(15.6, -27, 14.2, -22.6); c.bezierCurveTo(16.4, -19, 16.6, -14, 15.2, -10.4); c.quadraticCurveTo(10, -8, 4.6, -9.6); c.closePath(); }, G2, { k: 1.8, lw: 2, inn: function (c) {
    ln(c, [7, -22, 9, -14, 7.6, -10], 'rgba(14,18,18,.5)', 1.1); ln(c, [9, -14, 13, -15], 'rgba(14,18,18,.4)', .9); ln(c, [7.4, -21, 8.8, -15.4], AMB, .6);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(9, -21, 2.2, 1.2, -.6, 0, TAU); c.fill();
  } });
  c.restore();
  leg([8, -9], 15, 0, false, 0); leg([2, -8], 4, 1, false, 1); leg([-5, -8], -15, 0, false, 2);
}
export function besouroFx(c, anim, k) {
  if (anim !== 'atk') return;
  var p = getMark('horn');
  if (k < .3) return;
  if (k < .9) { /* brilho de aviso no chifre */ for (var i = 0; i < 3; i++) { var a = -1.2 + i * .9; ln(c, [p[0] + Math.cos(a) * 3, p[1] + Math.sin(a) * 3, p[0] + Math.cos(a) * 6.4, p[1] + Math.sin(a) * 6.4], 'rgba(255,210,230,.8)', 1.2); } return; }
  for (var j = 0; j < 7; j++) { var b = -1.6 + j * .5, r0 = 3, r1 = 9 + (j % 2) * 4; ln(c, [p[0] + Math.cos(b) * r0, p[1] + Math.sin(b) * r0, p[0] + Math.cos(b) * r1, p[1] + Math.sin(b) * r1], 'rgba(255,240,220,.9)', 1.4); }
  speedLines(c, p[0] - 16, p[1] + 2, .2, 3, 12, .45);
  [[-14, -2, 3], [-8, -1, 2.4], [-20, -1.4, 2]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], q[2], 0, TAU); c.fillStyle = 'rgba(160,170,160,.4)'; c.fill(); });
}

/* ================= caranguejeira ================= */
/* o corpo é desenhado num quadro próprio (gira e sobe no fio); as pernas no quadro da célula */
export function aranha(c, anim, k) {
  var mv = anim === 'move', ph = mv ? k * TAU : 0, rear = 0, hit = 0, hang = 0, tx = 0, ty = 0, rot = 0, fold = 0;
  if (anim === 'atk') { rear = sm(seg(k, 0, .67)); hit = sm(seg(k, .67, 1)); rot = -rear * .42 + hit * .5; tx = hit * 6; }
  if (anim === 'hide') { hang = 1 - sm(k); fold = 1 - sm(seg(k, .3, 1)); rot = hang * PI * .5; ty = -hang * 64; }
  var bob = mv ? Math.abs(Math.sin(ph * 2)) * .5 : 0, PX = -8, PY = -11, co = Math.cos(rot), si = Math.sin(rot);
  function B(x, y) { var dx = x - PX, dy = y - PY; return [PX + dx * co - dy * si + tx, PY + dx * si + dy * co - bob + ty]; }
  /* fio de seda */
  if (hang > 0) { var sp = B(-18.4, -12); c.beginPath(); c.moveTo(sp[0], sp[1]); c.lineTo(sp[0] + 1, -160); c.strokeStyle = 'rgba(214,230,226,.75)'; c.lineWidth = .7; c.stroke(); }
  var NEAR = [[6, -10.4, 17, 0], [4.4, -10, 10.4, 0], [2.4, -10, -3.4, 0], [.4, -10.6, -14, 0]], FAR = [[6.6, -11.4, 19.4, -1.6], [5, -11, 12.6, -1.6], [3, -11, -1.6, -1.6], [1, -11.6, -11.6, -1.6]];
  var FOLD = [[10, -6], [7, -4], [-2, -4], [-7, -6]];
  function leg(L, i, far) {
    var A = B(L[0], L[1]), grp = (i + (far ? 1 : 0)) % 2, o = ph + grp * PI, dx = mv ? Math.sin(o) * 2.6 : 0, lift = mv ? Math.max(0, Math.cos(o)) * 2 : 0, F;
    var gx = L[2] + dx, gy = L[3] - lift;
    if (anim === 'atk' && i < 2) { var raise = [[16 - i * 3, -27 + i * 4], [24 - i * 5, -4 + i]]; gx = lp(lp(gx, raise[0][0] + (far ? 2 : 0), rear), raise[1][0] + (far ? 2 : 0), hit); gy = lp(lp(gy, raise[0][1] - (far ? 1 : 0), rear), raise[1][1], hit); }
    else if (anim === 'atk') { gx += hit * 2; }
    if (fold > 0) { var f = B(FOLD[i][0] + (far ? 1.4 : 0), FOLD[i][1] - (far ? 1 : 0)); gx = lp(gx, f[0], fold); gy = lp(gy, f[1], fold); }
    F = [gx, gy];
    var l1 = 9.6, l2 = 11.6, k1 = ik(A[0], A[1], F[0], F[1], l1, l2, 1), k2 = ik(A[0], A[1], F[0], F[1], l1, l2, -1), K = hang > .5 ? (k1[0] * Math.sign(L[2] - L[0] || 1) > k2[0] * Math.sign(L[2] - L[0] || 1) ? k1 : k2) : (k1[1] < k2[1] ? k1 : k2);
    var col = far ? G3 : G2, col2 = far ? G4 : G3;
    cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 2); }, col, { k: .7, lw: 1.5, inn: function (c) { furStrokes(c, rng(i * 7 + (far ? 3 : 0)), Math.min(A[0], K[0]), Math.min(A[1], K[1]), Math.max(A[0], K[0]), Math.max(A[1], K[1]), 6, FUR, 1.6, -PI / 2, .6); } });
    cel(c, function (c) { cap(c, K[0], K[1], F[0], F[1], 1.55); }, col2, { k: .5, lw: 1.4 });
    /* anel claro no joelho */
    var a = Math.atan2(F[1] - K[1], F[0] - K[0]), nx = -Math.sin(a) * 1.6, ny = Math.cos(a) * 1.6, rx = K[0] + Math.cos(a) * 2.2, ry = K[1] + Math.sin(a) * 2.2;
    ln(c, [rx - nx, ry - ny, rx + nx, ry + ny], far ? G2 : G0, 1);
    /* pelos para fora */
    for (var j = 1; j < 4; j++) { var u = j / 4, x = lp(K[0], F[0], u), y = lp(K[1], F[1], u); ln(c, [x + nx * .7, y + ny * .7, x + nx * 1.5 + Math.cos(a) * .6, y + ny * 1.5 + Math.sin(a) * .6], OUT, .6); ln(c, [x - nx * .7, y - ny * .7, x - nx * 1.5 + Math.cos(a) * .6, y - ny * 1.5 + Math.sin(a) * .6], OUT, .6); }
  }
  for (var i = 3; i >= 0; i--) leg(FAR[i], i, true);
  c.save(); c.translate(tx, -bob + ty); c.translate(PX, PY); c.rotate(rot); c.translate(-PX, -PY);
  /* abdômen peludo */
  cel(c, function (c) { el(c, -10, -12.4, 9.4, 7.6, -.12); }, G2, { k: 2, lw: 2, inn: function (c) {
    furStrokes(c, rng(11), -19, -20, -1, -5, 46, FUR, 2.4, PI * .85, .8); furStrokes(c, rng(12), -17, -19, -5, -10, 18, FURL, 2, PI * .85, .7);
    c.fillStyle = 'rgba(10,14,16,.32)'; c.beginPath(); c.ellipse(-8, -16, 4.2, 2.4, -.2, 0, TAU); c.fill();
  } });
  /* pelos soltos no contorno */
  for (var h = 0; h < 14; h++) { var a = -PI * .95 + h * .19, x0 = -10 + Math.cos(a) * 9.2, y0 = -12.4 + Math.sin(a) * 7.4; ln(c, [x0, y0, x0 + Math.cos(a) * 2, y0 + Math.sin(a) * 2], OUT, .7); }
  /* cefalotórax */
  cel(c, function (c) { el(c, 3.4, -11.4, 6.6, 4.6, -.05); }, G1, { k: 1.6, lw: 1.9, inn: function (c) {
    for (var j = 0; j < 6; j++) { var a2 = PI + .4 + j * .42; ln(c, [3.6, -12.4, 3.6 + Math.cos(a2) * 5.4, -12.4 + Math.sin(a2) * 3.6], 'rgba(20,26,28,.4)', .7); }
    furStrokes(c, rng(13), -2, -15, 9, -8, 16, FUR, 1.6, PI * .9, .6);
  } });
  c.restore();
  for (var n = 3; n >= 0; n--) leg(NEAR[n], n, false);
  c.save(); c.translate(tx, -bob + ty); c.translate(PX, PY); c.rotate(rot); c.translate(-PX, -PY);
  /* palpos e quelíceras com as presas */
  var fang = anim === 'atk' ? lp(sm(seg(k, 0, .4)), 0, hit) * .9 + hit * .4 : .1;
  cel(c, function (c) { cap(c, 8.4, -10.4, 11.6, -6, 1.5); }, G3, { k: .5, lw: 1.3 });
  cel(c, function (c) { el(c, 9.4, -9.2, 2.6, 3, .2); }, G2, { k: .7, lw: 1.5, inn: function (c) { furStrokes(c, rng(17), 7.4, -11.4, 11, -7, 6, FUR, 1.3, PI / 2, .6); } });
  c.save(); c.translate(10, -6.8); c.rotate(-fang * 1.2);
  cel(c, function (c) { c.moveTo(-1, -.4); c.quadraticCurveTo(1.6, 1, .6, 4.4); c.quadraticCurveTo(0, 1.8, -1.6, .8); c.closePath(); }, '#1d1a1e', { k: 0, lw: 1.1 });
  c.restore();
  /* olhos: dois grandes e os pequenos em volta */
  aeye(c, 5.6, -15.3, 1.05, { halo: 4.2 }); aeye(c, 8, -14.6, .85, { halo: 3, socket: true });
  dot(c, 4, -14.6, .45, '#ff8ab8'); dot(c, 7, -16.4, .45, '#ff8ab8'); dot(c, 9.3, -13.6, .4, '#ff8ab8');
  mark(c, 'fang', 11, -4);
  c.restore();
}
export function aranhaFx(c, anim, k) {
  if (anim === 'atk' && k > .9) { var p = getMark('fang'); for (var i = 0; i < 5; i++) { var a = -1 + i * .5; ln(c, [p[0] + Math.cos(a) * 3, p[1] + Math.sin(a) * 3, p[0] + Math.cos(a) * 8, p[1] + Math.sin(a) * 8], 'rgba(255,230,240,.85)', 1.2); } }
  if (anim === 'hide' && k > .4 && k < .8) { /* poeira ao tocar o chão */ }
}

/* ================= macaco-prego ================= */
export function macaco(c, anim, k) {
  var mv = anim === 'move', ph = mv ? k * TAU : 0, up = mv ? 0 : 1, sw = Math.sin(ph), cw = Math.cos(ph), i;
  var bob = mv ? -Math.max(0, Math.sin(ph)) * 3.4 : 0, thr = anim === 'atk' ? k : 0;
  var HIP = [-7, -11 + bob * .6], SH = [lp(7, -3, up), lp(-17.6, -26.5, up) + bob];
  if (anim === 'atk') { var lean = thr < .7 ? -seg(thr, 0, .67) * 2.4 : lp(-2.4, 3.6, sm(seg(thr, .67, 1))); SH[0] += lean; SH[1] += thr > .67 ? sm(seg(thr, .67, 1)) * 1.6 : 0; }
  var ta = Math.atan2(SH[1] - HIP[1], SH[0] - HIP[0]), HD = [SH[0] + Math.cos(ta) * 4.6 + lp(4, 1.6, up), SH[1] + Math.sin(ta) * 4.6 - lp(2.4, 3.4, up)];
  /* rabo comprido, enrolado na ponta */
  var tw = mv ? Math.sin(ph + 1) * 2 : Math.sin(thr * 3) * 1.4;
  var TL = bz(HIP[0] - 2, HIP[1] + .6, HIP[0] - 14, HIP[1] + 2 + tw, HIP[0] - 20, HIP[1] - 14, HIP[0] - 13 + tw, HIP[1] - 19, 12, 1.9, 1.1);
  cel(c, tube(TL), G2, { k: .8, lw: 1.6, inn: function (c) { furStrokes(c, rng(3), HIP[0] - 24, HIP[1] - 22, HIP[0], HIP[1] + 4, 14, FUR, 1.6, PI * .7, .6); } });
  var e = TL[TL.length - 1]; c.beginPath(); c.arc(e[0] + 2, e[1] + .4, 2.2, PI, PI * 2.6); c.strokeStyle = OUT; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = G2; c.lineWidth = 1.6; c.stroke();
  /* mãos: alvo de cada braço */
  var HF, HN2, ST = null;
  if (mv) { HF = [SH[0] + 4 - cw * 4.4, -Math.max(0, -sw) * 2.4]; HN2 = [SH[0] + 4 + cw * 4.4, -Math.max(0, sw) * 2.4]; }
  else {
    var hx, hy;
    if (thr < .34) { var u = sm(seg(thr, 0, .34)); hx = lp(SH[0] + 5, SH[0] + 4, u); hy = lp(SH[1] + 10, SH[1] - 2, u); }
    else if (thr < .67) { var u2 = sm(seg(thr, .34, .67)); hx = lp(SH[0] + 4, SH[0] - 2, u2); hy = lp(SH[1] - 2, SH[1] - 15, u2); }
    else { var u3 = sm(seg(thr, .67, 1)); hx = lp(SH[0] - 2, SH[0] + 13, u3); hy = lp(SH[1] - 15, SH[1] - 6, u3); }
    HF = [hx - 1.2, hy + .6]; HN2 = [hx + 1.2, hy - .2]; ST = thr < .99 ? [hx, hy - 3.4] : null;
  }
  /* pernas */
  function legP(dx, far) {
    var F = mv ? [HIP[0] + 4 + dx * (far ? -1 : 1) * cw * 4, -Math.max(0, (far ? 1 : -1) * sw) * 2] : [HIP[0] + (far ? 6.4 : 2.4) + thr * (far ? 1 : 0), 0];
    var A = [HIP[0] + (far ? 1.4 : 0), HIP[1] + 1], K = ik(A[0], A[1], F[0], F[1] - 1.4, 7, 7.6, -1);
    cel(c, function (c) { cap(c, A[0], A[1], K[0], K[1], 3); }, far ? G3 : G1, { k: 1, lw: 1.6 });
    cel(c, function (c) { cap(c, K[0], K[1], F[0], F[1] - 1.4, 2); }, far ? G3 : G2, { k: .7, lw: 1.5 });
    cel(c, function (c) { el(c, F[0] + 1.6, F[1] - 1, 2.8, 1.3); }, far ? G4 : G3, { k: .5, lw: 1.3 });
  }
  function armP(Hn, far) {
    var S = [SH[0] + (far ? 1.4 : -.4), SH[1] + 1.4], K = ik(S[0], S[1], Hn[0], Hn[1], 7.4, 7.4, mv ? 1 : -1);
    cel(c, function (c) { cap(c, S[0], S[1], K[0], K[1], 2.3); }, far ? G3 : G1, { k: .8, lw: 1.5 });
    cel(c, function (c) { cap(c, K[0], K[1], Hn[0], Hn[1], 1.8); }, far ? G3 : G2, { k: .6, lw: 1.4 });
    cel(c, function (c) { el(c, Hn[0], Hn[1], 1.9, 1.6); }, far ? G4 : G4, { k: .4, lw: 1.3 });
  }
  legP(1, true); armP(HF, true);
  /* tronco */
  cel(c, function (c) { cap(c, HIP[0], HIP[1], SH[0], SH[1], 6.8); }, G1, { k: 1.8, lw: 2, inn: function (c) {
    furStrokes(c, rng(21), Math.min(HIP[0], SH[0]) - 4, Math.min(HIP[1], SH[1]) - 6, Math.max(HIP[0], SH[0]) + 4, Math.max(HIP[1], SH[1]) + 5, 34, FUR, 2, ta + PI, .7);
    c.fillStyle = 'rgba(214,224,216,.34)'; c.beginPath(); c.ellipse(lp(HIP[0], SH[0], .5) + Math.sin(ta) * 3, lp(HIP[1], SH[1], .5) - Math.cos(ta) * 3.4, 6.6, 3, ta, 0, TAU); c.fill();
  } });
  legP(0, false);
  /* cabeça */
  c.save(); c.translate(HD[0], HD[1]); c.rotate(anim === 'atk' ? -.12 + thr * .2 : sw * .05);
  cel(c, function (c) { el(c, -3.6, -1.6, 2.2, 2.4); }, G2, { k: .6, lw: 1.4, inn: function (c) { dot(c, -3.4, -1.4, 1, 'rgba(10,14,16,.5)'); } });
  cel(c, function (c) { el(c, 0, 0, 5.4, 5); }, G1, { k: 1.4, lw: 1.8 });
  /* boné escuro do macaco-prego, com o topete */
  cel(c, function (c) { c.moveTo(-5.2, -.4); c.bezierCurveTo(-5.8, -6, -1, -7.6, 3, -6.2); c.quadraticCurveTo(4.6, -5.2, 5.2, -3.6); c.quadraticCurveTo(1, -3.6, -1, -2.6); c.quadraticCurveTo(-3, -1, -5.2, -.4); c.closePath(); }, G4, { k: .8, lw: 1.5, inn: function (c) { ln(c, [-3, -5, -2, -3.4], 'rgba(255,255,255,.18)', .7); } });
  cel(c, function (c) { c.moveTo(-2, -6); c.quadraticCurveTo(-1.4, -9, .6, -9.4); c.quadraticCurveTo(0, -7.6, 1.6, -6.4); c.closePath(); }, G4, { k: 0, lw: 1.2 });
  /* cara clara e focinho */
  cel(c, function (c) { el(c, 2.8, 1, 3.4, 3.4); }, G0, { k: .8, lw: 1.4 });
  cel(c, function (c) { el(c, 5, 2.2, 2.2, 1.8); }, '#c4ccc6', { k: .5, lw: 1.3, inn: function (c) { dot(c, 6.4, 1.6, .4, OUT); } });
  var mo = anim === 'atk' && thr > .67 ? 1 : 0;
  if (mo) { c.beginPath(); c.ellipse(4.8, 3.4, 1.3, 1, 0, 0, TAU); c.fillStyle = '#3a1222'; c.fill(); tooth(c, 4.3, 2.6, .4, 1); tooth(c, 5.3, 2.6, .4, 1); }
  else ln(c, [3.6, 3.4, 5.8, 3.2], OUT, .8);
  aeye(c, 3.2, -.8, 1, { halo: 3.8 });
  ln(c, [1.4, -2.4, 4.6, -2.2], OUT, 1);
  c.restore();
  armP(HN2, false);
  /* a pedra âmbar */
  if (ST) { ST[1] -= 1.4; cel(c, function (c) { poly(c, [ST[0] - 5, ST[1] + 1.4, ST[0] - 3.4, ST[1] - 3.6, ST[0] + 1.6, ST[1] - 4.6, ST[0] + 5.2, ST[1] - 1, ST[0] + 3.6, ST[1] + 3.4, ST[0] - 2.2, ST[1] + 3.6]); }, '#8f8a7c', { k: 1, lw: 1.6, inn: function (c) { c.fillStyle = AMB; c.beginPath(); c.ellipse(ST[0] + .4, ST[1] - .2, 2.9, 2.1, .3, 0, TAU); c.fill(); dot(c, ST[0] - .6, ST[1] - 1.2, .9, AMB2); } }); mark(c, 'stone', ST[0], ST[1]); }
  mark(c, 'hand', HN2[0], HN2[1]);
}
export function macacoFx(c, anim, k) {
  if (anim !== 'atk') return;
  if (k > .3 && k < .99) { var s = getMark('stone'); shine(c, s[0], s[1], 7, '255,190,90', .35); }
  if (k > .99) { var h = getMark('hand'), x = h[0] + 9, y = h[1] - 6; speedLines(c, x - 3, y + 1, -.3, 3, 9, .5);
    cel(c, function (c) { poly(c, [x - 3.6, y + 1, x - 2.4, y - 2.6, x + 1.2, y - 3.4, x + 3.8, y - .8, x + 2.6, y + 2.4, x - 1.6, y + 2.6]); }, '#8f8a7c', { k: 1, lw: 1.6, inn: function (c) { c.fillStyle = AMB; c.beginPath(); c.ellipse(x + .4, y - .2, 2, 1.5, .3, 0, TAU); c.fill(); } }); shine(c, x, y, 8, '255,190,90', .4); }
}

/* ================= totem de barro ================= */
export function totem(c, anim, k) {
  var mv = anim === 'move', ph = mv ? k * TAU : 0, gl = anim === 'atk' ? sm(k) : 0;
  var rock = mv ? Math.sin(ph) * .07 : -gl * .05, hop = mv ? Math.abs(Math.sin(ph)) * 1.4 : 0;
  c.save(); c.translate(mv ? Math.sin(ph) * .8 : 0, -hop); c.rotate(rock);
  var CL = '#8b8a84', CL2 = '#74746f', CL3 = '#5d5e5a';
  /* raízes de barro arrastando */
  [[-9, -2, -15, 1, true], [8, -2, 15, .6, false], [-2, -1, -6, 1.4, true]].forEach(function (q) { cel(c, function (c) { c.moveTo(q[0] - 2.4, q[1] - 2); c.quadraticCurveTo(lp(q[0], q[2], .6), q[1], q[2], q[3] + hop); c.quadraticCurveTo(lp(q[0], q[2], .5), q[1] + 2.4, q[0] + 2.4, q[1]); c.closePath(); }, CL3, { k: .5, lw: 1.4 }); });
  /* base */
  cel(c, function (c) { c.moveTo(-13, -1); c.quadraticCurveTo(-14.4, -9, -10, -11); c.lineTo(10, -11); c.quadraticCurveTo(14.4, -9, 13, -1); c.quadraticCurveTo(0, 2.2, -13, -1); c.closePath(); }, CL2, { k: 1.6, lw: 2, inn: function (c) {
    for (var i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-11 + i * 4.4, -9); c.lineTo(-9 + i * 4.4, -5.6); c.lineTo(-11 + i * 4.4, -2.4); c.strokeStyle = 'rgba(24,28,28,.45)'; c.lineWidth = .9; c.stroke(); }
    c.fillStyle = 'rgba(110,138,108,.85)'; c.beginPath(); c.ellipse(-8, -1, 5, 1.8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(9, -2, 3.4, 1.4, 0, 0, TAU); c.fill();
  } });
  /* alças de jarro (bracinhos); erguem no brilho */
  [[-1, true], [1, false]].forEach(function (q) { var sd = q[0], ry = -22 - gl * 4; cel(c, function (c) { c.moveTo(sd * 9, -26); c.bezierCurveTo(sd * 16, -27 - gl * 6, sd * 17, ry + 6, sd * 9.4, -15); c.lineTo(sd * 9.4, -18); c.bezierCurveTo(sd * 13.6, ry + 5, sd * 13, -24 - gl * 4, sd * 9, -23); c.closePath(); }, q[1] ? CL3 : CL2, { k: .7, lw: 1.6 }); });
  /* corpo */
  cel(c, function (c) { c.moveTo(-10, -10); c.bezierCurveTo(-11.6, -18, -10.6, -26, -9, -30); c.lineTo(9, -30); c.bezierCurveTo(10.6, -26, 11.6, -18, 10, -10); c.closePath(); }, CL, { k: 2, lw: 2, inn: function (c) {
    /* faixas de barro e o anel entalhado em volta da pedra */
    ln(c, [-10.6, -27, 10.6, -27], 'rgba(24,28,28,.4)', 1); ln(c, [-10.8, -12.6, 10.8, -12.6], 'rgba(24,28,28,.4)', 1);
    for (var i = 0; i < 9; i++) { var a = i * TAU / 9; ln(c, [Math.cos(a) * 5.8, -19.6 + Math.sin(a) * 5.4, Math.cos(a) * 7.6, -19.6 + Math.sin(a) * 7], 'rgba(24,28,28,.45)', 1); }
    c.beginPath(); c.ellipse(0, -19.6, 6, 5.6, 0, 0, TAU); c.strokeStyle = 'rgba(24,28,28,.5)'; c.lineWidth = 1.2; c.stroke();
    ln(c, [-8, -14, -5, -11, -6, -9], 'rgba(24,28,28,.5)', .9); ln(c, [7, -28, 5.4, -25], 'rgba(24,28,28,.5)', .9);
    c.fillStyle = 'rgba(110,138,108,.85)'; c.beginPath(); c.ellipse(-8, -28.6, 3.4, 1.6, 0, 0, TAU); c.fill();
  } });
  /* a pedra âmbar */
  var sc = 1 + gl * .12;
  cel(c, function (c) { poly(c, [0, -25.2 * sc + (sc - 1) * 19.6, 4.4 * sc, -21.4, 3.6 * sc, -16.6, 0, -14.2 + (1 - sc) * 3, -3.6 * sc, -16.6, -4.4 * sc, -21.4]); }, gl > .5 ? AMB2 : AMB, { k: 1.2, lw: 1.6, sh: 'rgba(120,60,10,.45)', hi: 'rgba(255,250,220,.5)', inn: function (c) { ln(c, [0, -25, 0, -14.4], 'rgba(150,90,20,.5)', .7); ln(c, [-4.2, -21.4, 4.2, -21.4], 'rgba(150,90,20,.4)', .7); dot(c, -1.4, -21.8, .9, 'rgba(255,255,240,.8)'); } });
  /* cabeça entalhada */
  cel(c, function (c) { c.moveTo(-11, -30); c.quadraticCurveTo(-12.4, -36, -10.4, -41); c.quadraticCurveTo(0, -44, 10.4, -41); c.quadraticCurveTo(12.6, -36, 11, -30); c.closePath(); }, CL, { k: 1.8, lw: 2, inn: function (c) {
    /* sobrancelha, olhos fundos e a boca */
    c.fillStyle = CL3; c.beginPath(); c.moveTo(-9, -37.6); c.quadraticCurveTo(0, -40.4, 10, -37.4); c.lineTo(10, -35.6); c.quadraticCurveTo(0, -38, -9, -35.6); c.closePath(); c.fill();
    c.fillStyle = '#2a1e24'; c.beginPath(); c.moveTo(-4, -32.2); c.lineTo(8.4, -32.4); c.lineTo(7.6, -31); c.lineTo(-3.4, -30.8); c.closePath(); c.fill();
    for (var i = 0; i < 4; i++) ln(c, [-2 + i * 3, -32.2, -2 + i * 3, -30.9], CL2, .8);
  } });
  aeye(c, 0, -35, 1.5, { sq: .7, halo: 3.4 }); aeye(c, 6.4, -35, 1.3, { sq: .7, halo: 3 });
  /* coroa de penas de barro */
  [[-7, -41, -9.4, -48, -3, -42.6], [-1.6, -42.6, -.6, -51, 3, -42.8], [4, -42.4, 9, -49, 8.6, -41.6]].forEach(function (q, n) { cel(c, function (c) { c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2] - 1, lp(q[1], q[3], .6), q[2], q[3]); c.quadraticCurveTo(q[4] + .4, lp(q[5], q[3], .5), q[4], q[5]); c.closePath(); }, n === 1 ? CL : CL2, { k: .7, lw: 1.5, inn: function (c) { ln(c, [lp(q[0], q[4], .5), lp(q[1], q[5], .5), q[2], q[3] + 1.4], 'rgba(24,28,28,.45)', .7); } }); });
  /* brotinho de folha */
  cel(c, function (c) { c.moveTo(9.6, -30); c.quadraticCurveTo(13.6, -33, 15.6, -31); c.quadraticCurveTo(13, -28.6, 9.6, -30); c.closePath(); }, '#7d977c', { k: .4, lw: 1.2 });
  mark(c, 'gem', 0, -19.8);
  c.restore();
}
export function totemFx(c, anim, k) {
  var p = getMark('gem');
  if (anim === 'move') {
    var ph = k * TAU, s = Math.abs(Math.sin(ph));
    [[-15, -1.4], [-19, -3]].forEach(function (q, i) { c.beginPath(); c.arc(q[0] - s * 2, q[1] - s * i, 1.8 + s * (1.4 + i), 0, TAU); c.fillStyle = 'rgba(150,150,140,' + (.3 * (1 - i * .3)) + ')'; c.fill(); });
    shine(c, p[0], p[1], 8, '255,180,80', .25); return;
  }
  var g = sm(k);
  shine(c, p[0], p[1], 10 + g * 22, '255,190,90', .35 + g * .5);
  for (var i = 0; i < 8; i++) { var a = i * TAU / 8 + .2, r0 = 6 + g * 2, r1 = r0 + 3 + g * 9 * (i % 2 ? .7 : 1); ln(c, [p[0] + Math.cos(a) * r0, p[1] + Math.sin(a) * r0, p[0] + Math.cos(a) * r1, p[1] + Math.sin(a) * r1], 'rgba(255,214,130,' + (.25 + g * .65) + ')', 1.3); }
  if (k > .6) { var q = sm(seg(k, .6, 1)); c.beginPath(); c.ellipse(0, -2, 14 + q * 12, 4 + q * 3, 0, 0, TAU); c.strokeStyle = 'rgba(255,214,130,' + (.75 * q) + ')'; c.lineWidth = 1.6; c.stroke(); c.beginPath(); c.ellipse(0, -2, 10 + q * 8, 3 + q * 2, 0, 0, TAU); c.strokeStyle = 'rgba(255,240,200,' + (.4 * q) + ')'; c.lineWidth = 1; c.stroke(); }
}
