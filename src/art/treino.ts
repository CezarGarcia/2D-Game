// @ts-nocheck
/* Terreiro de treino (docs/gdd/09): os bonecos de palha e o chão do terreiro, no mesmo estilo recortado dos personagens.
   O boneco é desenhado virado para a direita, com o pé da estaca na origem (0,0) e y negativo para cima. */
import { OUT, TAU, cap, cel, dot, el, ln, poly, star } from './characters';
import { paintGround } from './arena';
import { TRAINING_SPOTS } from '../data/training';

var WD = '#8f5f36', WD2 = '#74492a', STRAW = '#e2bf62', STRAW2 = '#b98a34', SACK = '#c9a66a', SACK2 = '#a98548', RED = '#cf3b28', LE = '#96562b', LE2 = '#7a4424', GOLD = '#f2c14e';

function tuft(c, x, y, ang, n, len) {
  for (var i = 0; i < n; i++) {
    var a = ang + (i - (n - 1) / 2) * .26, ex = x + Math.cos(a) * len * (1 - (i % 2) * .22), ey = y + Math.sin(a) * len * (1 - (i % 2) * .22);
    ln(c, [x, y, ex, ey], OUT, 2.6); ln(c, [x, y, ex, ey], i % 2 ? STRAW2 : STRAW, 1.3);
  }
}
function rope(c, x, y, w) { for (var i = -1; i <= 1; i++) { ln(c, [x - w, y + i * 1.5, x + w, y + i * 1.5 + .8], OUT, 2.1); ln(c, [x - w, y + i * 1.5, x + w, y + i * 1.5 + .8], '#d9c69a', 1); } }

/* o.kind: 'idle' (palha), 'armor' (blindado: tábuas e panela de barro), 'elite' (chapéu de couro e lenço) */
export function drawBoneco(c, t, o) {
  o = o || {}; var kind = o.kind || 'idle', armor = kind === 'armor', elite = kind === 'elite', i;
  /* monte de terra e pedras ao pé da estaca */
  cel(c, function (c) { el(c, 0, -.6, 14, 4.4); }, '#6b4a2c', { k: 1, lw: 2, sh: 'rgba(20,8,4,.4)' });
  [[-9.6, -1.4, 3.2], [8.4, -.6, 3.6], [1.6, 1.4, 2.6]].forEach(function (q) { cel(c, function (c) { el(c, q[0], q[1], q[2], q[2] * .72); }, '#8e8a80', { k: .7, lw: 1.6 }); });
  tuft(c, -4, -2.4, -2.1, 3, 6); tuft(c, 5, -2.2, -1, 3, 6);
  /* estaca e travessa */
  cel(c, function (c) { cap(c, 0, -1.6, 0, -46, 2.7); }, WD, { k: 1.2, lw: 2.2, inn: function (c) { ln(c, [-.8, -5, -.4, -44], 'rgba(40,18,8,.4)', .9); } });
  cel(c, function (c) { cap(c, -18, -36.4, 18, -35.6, 2.3); }, WD2, { k: 1, lw: 2.1, inn: function (c) { ln(c, [-15, -36.9, 15, -36.1], 'rgba(255,220,170,.25)', .9); } });
  tuft(c, -19.4, -36.4, 2.5, 4, 8); tuft(c, 19.4, -35.6, .6, 4, 8);
  /* palha saindo por baixo do saco */
  tuft(c, -5.6, -14.6, 1.95, 3, 7.4); tuft(c, 0, -14, 1.57, 3, 8.2); tuft(c, 5.6, -14.6, 1.2, 3, 7.4);
  /* corpo: saco de estopa (ou gibão de couro, no elite) */
  cel(c, function (c) { c.moveTo(-9.6, -40); c.quadraticCurveTo(0, -43, 9.6, -40); c.quadraticCurveTo(12.6, -27, 10.6, -15.4); c.quadraticCurveTo(0, -12.4, -10.6, -15.4); c.quadraticCurveTo(-12.6, -27, -9.6, -40); c.closePath(); }, elite ? LE : SACK, {
    k: 2.2, lw: 2.3, sh: 'rgba(60,24,6,.4)', inn: function (c) {
      if (elite) {
        ln(c, [0, -41, 0, -14], 'rgba(40,16,6,.55)', 1.2);
        [-33, -27, -21].forEach(function (y) { dot(c, -2.6, y, .9, GOLD); dot(c, 2.6, y, .9, GOLD); });
        ln(c, [-11, -18.6, 11, -18.6], LE2, 2.4); dot(c, 0, -18.6, 1.7, GOLD);
      } else {
        for (i = 0; i < 5; i++) ln(c, [-9 + i * 4.4, -40, -10 + i * 4.8, -15], 'rgba(90,60,20,.22)', .8);
        ln(c, [5, -21, 9, -17], 'rgba(60,34,10,.7)', .9); ln(c, [5.4, -17.4, 8.6, -20.6], 'rgba(60,34,10,.7)', .9);
        cel(c, function (c) { poly(c, [-9.4, -24.6, -4.4, -25.6, -3.8, -20.4, -8.8, -19.6]); }, SACK2, { k: 0, lw: 1.1, inn: function (c) { ln(c, [-8.6, -23.6, -5, -21.4], 'rgba(60,34,10,.6)', .8); } });
      }
    },
  });
  rope(c, 0, -39.6, 8.2);
  if (armor) {
    /* tábuas presas com cinta de ferro: o escudo do boneco blindado */
    cel(c, function (c) { c.moveTo(-9.4, -36.6); c.lineTo(9.4, -36.6); c.lineTo(9.4, -24); c.quadraticCurveTo(0, -15.6, -9.4, -24); c.closePath(); }, '#9a6a3a', {
      k: 1.6, lw: 2.2, inn: function (c) { [-4.6, 0, 4.6].forEach(function (x) { ln(c, [x, -36.6, x, -18], 'rgba(40,18,8,.5)', 1); }); c.fillStyle = '#8d8a84'; c.fillRect(-10, -31.6, 20, 2.6); ln(c, [-10, -31.6, 10, -31.6], 'rgba(255,255,255,.35)', .8); },
    });
    dot(c, -6.6, -30.3, 1, '#d9d6cc'); dot(c, 6.6, -30.3, 1, '#d9d6cc'); dot(c, 0, -30.3, 1.3, '#d9d6cc');
  } else {
    /* alvo pintado no peito */
    var tc = elite ? '#f6e3b0' : '#f3ead2';
    dot(c, 0, -28.6, 6.3, OUT); dot(c, 0, -28.6, 5.3, tc); dot(c, 0, -28.6, 3.7, RED); dot(c, 0, -28.6, 2.1, tc); dot(c, 0, -28.6, .9, RED);
  }
  /* cabeça: cabaça com cara pintada */
  cel(c, function (c) { c.moveTo(-8.4, -50); c.bezierCurveTo(-9.4, -58.6, 9.4, -58.6, 8.4, -50); c.bezierCurveTo(8.4, -44.4, 4.6, -42.2, 0, -42.2); c.bezierCurveTo(-4.6, -42.2, -8.4, -44.4, -8.4, -50); c.closePath(); }, elite ? '#d98f3a' : '#e0ad4a', {
    k: 2, lw: 2.3, sh: 'rgba(110,50,0,.4)', hi: 'rgba(255,245,200,.4)', inn: function (c) { ln(c, [-5.6, -55, -6.4, -46], 'rgba(120,60,0,.28)', .9); ln(c, [5.6, -55, 6.4, -46], 'rgba(120,60,0,.28)', .9); },
  });
  /* olhos em xis e boca costurada */
  [[-1.6, -50.6], [4.6, -50.6]].forEach(function (q) { ln(c, [q[0] - 1.5, q[1] - 1.5, q[0] + 1.5, q[1] + 1.5], OUT, 1.5); ln(c, [q[0] - 1.5, q[1] + 1.5, q[0] + 1.5, q[1] - 1.5], OUT, 1.5); });
  if (elite) { ln(c, [-3.8, -54, .4, -52.6], OUT, 1.7); ln(c, [6.8, -54, 2.6, -52.6], OUT, 1.7); }
  ln(c, [-2.4, -46.2, 5.4, -46.2], OUT, 1.3); [-1, 1.5, 4].forEach(function (x) { ln(c, [x, -47.2, x, -45.2], OUT, 1); });
  if (armor) {
    /* panela de barro emborcada na cabeça */
    cel(c, function (c) { c.moveTo(-10.4, -53.4); c.quadraticCurveTo(-10.4, -64.4, 0, -64.4); c.quadraticCurveTo(10.4, -64.4, 10.4, -53.4); c.closePath(); }, '#b5613a', { k: 1.8, lw: 2.2, sh: 'rgba(70,20,0,.42)', inn: function (c) { ln(c, [-8.6, -57.4, 8.6, -57.4], '#f0d9a0', 1.2); for (i = -3; i <= 3; i++) ln(c, [i * 2.4 - 1, -59.4, i * 2.4, -57.6, i * 2.4 + 1, -59.4], 'rgba(60,20,0,.55)', .8); } });
    cel(c, function (c) { cap(c, -11.4, -53.4, 11.4, -53.4, 1.5); }, '#9a4e2c', { k: .6, lw: 1.8 });
    cel(c, function (c) { el(c, 0, -65, 2.2, 1.5); }, '#9a4e2c', { k: .5, lw: 1.6 });
  } else if (elite) {
    /* chapéu de couro em meia-lua, com estrelas, e lenço vermelho */
    cel(c, function (c) { c.moveTo(-15.6, -54.6); c.quadraticCurveTo(-13.6, -68, 0, -68.6); c.quadraticCurveTo(13.6, -68, 15.6, -54.6); c.quadraticCurveTo(0, -58.6, -15.6, -54.6); c.closePath(); }, LE, { k: 2, lw: 2.3, sh: 'rgba(50,16,4,.45)', inn: function (c) { c.beginPath(); c.moveTo(-13, -56.6); c.quadraticCurveTo(0, -60.6, 13, -56.6); c.strokeStyle = GOLD; c.lineWidth = 1.2; c.stroke(); } });
    star(c, 0, -63.4, 2.9, GOLD); star(c, -7.6, -60.6, 1.9, GOLD); star(c, 7.6, -60.6, 1.9, GOLD);
    cel(c, function (c) { c.moveTo(-8.6, -44.6); c.quadraticCurveTo(0, -40.6, 8.6, -44.6); c.lineTo(7.4, -41.2); c.quadraticCurveTo(0, -37.6, -7.4, -41.2); c.closePath(); }, RED, { k: .8, lw: 1.9, sh: 'rgba(90,0,0,.4)' });
    cel(c, function (c) { poly(c, [-6.6, -41.6, -13.6, -36.6, -9.6, -34.6, -11.6, -30.6, -4.6, -39.6]); }, RED, { k: .8, lw: 1.8, sh: 'rgba(90,0,0,.4)' });
  } else {
    /* chapéu de palha */
    cel(c, function (c) { c.moveTo(-6.6, -55.6); c.quadraticCurveTo(-6, -64.6, 0, -64.6); c.quadraticCurveTo(6, -64.6, 6.6, -55.6); c.closePath(); }, STRAW, { k: 1.4, lw: 2.1, sh: 'rgba(110,60,0,.4)', inn: function (c) { ln(c, [-6.4, -57.6, 6.4, -57.6], RED, 1.6); for (i = -2; i <= 2; i++) ln(c, [i * 2.2, -64, i * 2.6, -58.6], 'rgba(120,80,10,.4)', .7); } });
    cel(c, function (c) { el(c, 0, -55.4, 14.6, 3.5); }, STRAW, { k: 1.2, lw: 2.1, sh: 'rgba(110,60,0,.42)', inn: function (c) { c.beginPath(); c.ellipse(0, -55.2, 10.6, 2.2, 0, 0, TAU); c.strokeStyle = 'rgba(120,80,10,.4)'; c.lineWidth = .8; c.stroke(); } });
    tuft(c, 13.6, -55, .3, 2, 4.4); tuft(c, -13.6, -55, 2.85, 2, 4.4);
  }
}

function rng(s) { return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function bale(g, x, y, s) {
  g.beginPath(); g.ellipse(x + 6 * s, y + 3 * s, 40 * s, 9 * s, 0, 0, TAU); g.fillStyle = 'rgba(8,18,12,.35)'; g.fill();
  cel(g, function (c) { c.moveTo(x - 30 * s, y); c.lineTo(x - 30 * s, y - 30 * s); c.quadraticCurveTo(x, y - 36 * s, x + 30 * s, y - 30 * s); c.lineTo(x + 30 * s, y); c.quadraticCurveTo(x, y + 5 * s, x - 30 * s, y); c.closePath(); }, STRAW, {
    k: 2.6, lw: 2.6, sh: 'rgba(110,60,0,.42)', inn: function (c) {
      for (var i = 0; i < 16; i++) ln(c, [x - 28 * s + i * 3.8 * s, y - 32 * s, x - 29 * s + i * 3.9 * s, y + 2 * s], 'rgba(120,80,10,.32)', 1);
      [-12, 12].forEach(function (d) { ln(c, [x + d * s, y - 34 * s, x + d * s, y + 4 * s], '#7a4424', 2.4 * s); });
    },
  });
}
function post(g, x, y, s) {
  g.beginPath(); g.ellipse(x + 5 * s, y + 2 * s, 14 * s, 4.6 * s, 0, 0, TAU); g.fillStyle = 'rgba(8,18,12,.35)'; g.fill();
  cel(g, function (c) { cap(c, x, y, x, y - 46 * s, 5.4 * s); }, WD, { k: 2, lw: 2.5, inn: function (c) { ln(c, [x - 1.6 * s, y - 4 * s, x - 1 * s, y - 44 * s], 'rgba(40,18,8,.4)', 1.1); } });
  cel(g, function (c) { el(c, x, y - 47 * s, 5.4 * s, 2.6 * s); }, '#c9a26b', { k: .8, lw: 2 });
}
function rack(g, x, y) {
  g.beginPath(); g.ellipse(x + 8, y + 3, 62, 9, 0, 0, TAU); g.fillStyle = 'rgba(8,18,12,.35)'; g.fill();
  [-46, 46].forEach(function (d) { cel(g, function (c) { cap(c, x + d, y, x + d, y - 58, 4); }, WD2, { k: 1.6, lw: 2.4 }); });
  [-48, -22].forEach(function (h) { cel(g, function (c) { cap(c, x - 50, y + h, x + 50, y + h, 3); }, WD, { k: 1.2, lw: 2.2 }); });
  /* armas de treino encostadas: borduna, zagaia e um arco */
  cel(g, function (c) { c.moveTo(x - 30, y - 2); c.lineTo(x - 28, y - 44); c.quadraticCurveTo(x - 34, y - 62, x - 24, y - 72); c.quadraticCurveTo(x - 14, y - 62, x - 22, y - 44); c.lineTo(x - 24, y - 2); c.closePath(); }, '#5a3218', { k: 1.6, lw: 2.3, inn: function (c) { ln(c, [x - 30, y - 50, x - 20, y - 50], RED, 2); } });
  cel(g, function (c) { cap(c, x + 2, y - 2, x + 6, y - 74, 1.8); }, '#b98a56', { k: .8, lw: 2 });
  cel(g, function (c) { poly(c, [x + 2.4, y - 72, x + 6.6, y - 90, x + 10.4, y - 72]); }, '#dcd8cc', { k: 1, lw: 2, sh: 'rgba(50,60,90,.4)' });
  g.beginPath(); g.moveTo(x + 26, y - 4); g.quadraticCurveTo(x + 50, y - 40, x + 30, y - 76); g.strokeStyle = OUT; g.lineWidth = 6; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#9a6a3a'; g.lineWidth = 3.2; g.stroke();
  ln(g, [x + 26, y - 4, x + 30, y - 76], 'rgba(240,230,200,.8)', 1);
}

/** Chão do terreiro: a clareira da mata com terra batida no meio, marcas de giz, fardos de palha e o cavalete das armas. */
export function paintTrainingGround(g, W, H, a) {
  paintGround(g, W, H, a, 53);
  var R = rng(911), cx = (a.x0 + a.x1) / 2 + 60, cy = (a.y0 + a.y1) / 2, i;
  /* terra batida */
  g.save();
  g.beginPath(); g.ellipse(cx, cy, 430, 212, 0, 0, TAU); g.clip();
  var q = g.createRadialGradient(cx - 40, cy - 30, 40, cx, cy, 440);
  q.addColorStop(0, '#b08a56'); q.addColorStop(.7, '#8f6c40'); q.addColorStop(1, 'rgba(110,84,48,0)');
  g.fillStyle = q; g.fillRect(0, 0, W, H);
  for (i = 0; i < 90; i++) { g.beginPath(); g.ellipse(cx + (R() - .5) * 820, cy + (R() - .5) * 400, 14 + R() * 40, 5 + R() * 12, R() * .5 - .25, 0, TAU); g.fillStyle = R() < .5 ? 'rgba(70,46,22,.14)' : 'rgba(230,200,150,.1)'; g.fill(); }
  for (i = 0; i < 160; i++) { var x = cx + (R() - .5) * 820, y = cy + (R() - .5) * 400, r = 1 + R() * 2.2; g.beginPath(); g.ellipse(x, y, r, r * .7, 0, 0, TAU); g.fillStyle = 'rgba(60,40,20,.35)'; g.fill(); }
  /* marcas de pés e riscos de golpe no chão */
  for (i = 0; i < 26; i++) { var sx = cx + (R() - .5) * 700, sy = cy + (R() - .5) * 330, an = R() * 3.14, l = 16 + R() * 26; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + Math.cos(an) * l * .5 + 6, sy + Math.sin(an) * l * .5 - 6, sx + Math.cos(an) * l, sy + Math.sin(an) * l); g.strokeStyle = 'rgba(60,38,18,.22)'; g.lineWidth = 2 + R() * 2; g.lineCap = 'round'; g.stroke(); }
  g.restore();
  /* borda da terra batida, com capim invadindo */
  g.beginPath(); g.ellipse(cx, cy, 430, 212, 0, 0, TAU); g.strokeStyle = 'rgba(40,26,12,.28)'; g.lineWidth = 5; g.setLineDash([26, 18]); g.stroke(); g.setLineDash([]);
  /* círculos de giz onde os bonecos ficam (as posições são as de src/data/training.ts) */
  TRAINING_SPOTS.forEach(function (p, n) {
    g.save(); g.translate(p.x, p.y); g.scale(1, .42);
    g.beginPath(); g.arc(0, 0, 62 + n * 6, 0, TAU); g.strokeStyle = 'rgba(250,244,225,.6)'; g.lineWidth = 5; g.setLineDash([22, 9]); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(0, 0, 40 + n * 4, 0, TAU); g.strokeStyle = 'rgba(250,244,225,.22)'; g.lineWidth = 3; g.stroke();
    g.restore();
  });
  /* risco de partida do herói */
  g.save(); g.translate(a.x0 + 100, cy + 8); g.scale(1, .42); g.beginPath(); g.arc(0, 0, 46, 0, TAU); g.strokeStyle = 'rgba(250,244,225,.3)'; g.lineWidth = 4; g.setLineDash([10, 10]); g.stroke(); g.restore(); g.setLineDash([]);
  /* o que fica fora da área jogável: cavalete das armas, fardos e mourões com corda */
  rack(g, W * .5 + 40, a.y0 - 26);
  bale(g, W * .5 - 190, a.y0 - 22, 1.05); bale(g, W * .5 - 130, a.y0 - 30, .9); bale(g, W * .5 - 156, a.y0 - 54, .86);
  bale(g, a.x1 - 150, a.y0 - 24, 1); bale(g, a.x1 - 60, a.y1 + 46, 1.1);
  var posts = [];
  for (i = 0; i <= 6; i++) posts.push([a.x0 + 130 + i * ((a.x1 - a.x0 - 260) / 6), a.y1 + 52 + Math.sin(i * 1.3) * 4]);
  for (i = 0; i < posts.length - 1; i++) {
    var p0 = posts[i], p1 = posts[i + 1];
    [-36, -22].forEach(function (h) { g.beginPath(); g.moveTo(p0[0], p0[1] + h); g.quadraticCurveTo((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 + h + 9, p1[0], p1[1] + h); g.strokeStyle = OUT; g.lineWidth = 4.6; g.stroke(); g.strokeStyle = '#d9c69a'; g.lineWidth = 2.2; g.stroke(); });
  }
  posts.forEach(function (p) { post(g, p[0], p[1], 1); });
}

