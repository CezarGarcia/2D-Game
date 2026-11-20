// @ts-nocheck
/**
 * Ícones da interface (atributos, estatísticas, abas, ações do ferreiro, bênçãos, talentos, feitiços).
 * `drawUiIcon(c, key, size)` desenha o ícone num quadrado de `size` px a partir de (0,0).
 * Mesmo estilo recortado dos personagens: contorno escuro quente, sombra em meia-lua, um brilho.
 * Cada ícone é desenhado numa caixa de 40×40 e escalado; em tamanhos pequenos o contorno engrossa
 * (variável Q) para a silhueta continuar legível. Sem gradientes nem shadowBlur: são desenhados
 * muitas vezes por quadro.
 */
import { OUT, TAU, el, cap, poly, cel, ln, dot } from './characters';

export const UI_ICON_KEYS = [
  // atributos
  'forca', 'agilidade', 'inteligencia', 'vitalidade', 'espirito', 'sorte',
  // estatísticas
  'vida', 'mana', 'dano', 'defesa', 'critico', 'danoCritico', 'velAtaque', 'movimento', 'esquiva', 'magia', 'recarga', 'poder',
  'ouro', 'xp', 'resistencia', 'roubo', 'veneno', 'alcance', 'cura', 'regeneracao', 'espinhos', 'projetil', 'perfurar', 'explosao',
  'escudo', 'pocao', 'companheiro', 'item', 'material', 'elite', 'execucao', 'furia', 'altar', 'relogio', 'tomo', 'bau',
  // abas do acampamento
  'mapa', 'heroi', 'ferreiro', 'talentos', 'feiticos', 'companheiros', 'opcoes',
  // ferreiro
  'aprimorar', 'fundir', 'encantar', 'reforjar', 'vender', 'desmontar',
  // diversos
  'cadeado', 'estrela', 'caveira', 'coroa', 'supremo', 'seta', 'fechar', 'som', 'mudo', 'mais', 'menos', 'check', 'novo', 'gaiola',
  // materiais
  'resina', 'po', 'lagrima',
  // elementos
  'natureza', 'agua',
  // feitiços
  'dardo', 'sementes', 'cipo', 'casca', 'broto', 'jato', 'onda', 'bolha', 'correnteza', 'chuva',
] as const;
export type UiIconKey = typeof UI_ICON_KEYS[number];

/* ---------------- paleta ---------------- */
var FOR = '#E4572E', VIT = '#D9A441', ESP = '#5FBF8E', INT = '#3FA7E0', SOR = '#B98CFF', AGI = '#8FE36A';
var GOLD = '#f2c14e', GOLD2 = '#c98f2a', LE = '#96562b', LE2 = '#7a4424', DK = '#3a2014', RED = '#cf3b28', BLOOD = '#e0344c';
var CRM = '#f0d9a0', BONE = '#f1ead8', STEEL = '#ebe6d6', IRON = '#8d8a84', STONE = '#77756c', SK = '#c88a5a';
var GR = '#5fbf5a', GR2 = '#2f7a3a', UP = '#7be05a', WAT = '#4aa8ea', WAT2 = '#9fe0fa', WATD = '#2a6fc0', AMB = '#f5a732';
var COLD = 'rgba(50,60,90,.4)', LEAFSH = 'rgba(10,60,30,.4)', WSH = 'rgba(14,40,120,.4)', GSH = 'rgba(120,60,0,.45)', WOUT = '#12233f';
var Q = 1;

/* ---------------- ajudantes ---------------- */
/* peça recortada: como `cel`, mas com o contorno engrossado por Q */
function P(c, fn, col, o) { o = o || {}; cel(c, fn, col, { k: o.k == null ? 1.8 : o.k, lw: o.lw === 0 ? 0 : (o.lw || 2.1) * Q, sh: o.sh, hi: o.hi, out: o.out, inn: o.inn }); }
/* traço grosso com contorno */
function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.3 * Q; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
function bar(c, p, col, lw, out) { rope(c, function (c) { c.moveTo(p[0], p[1]); for (var i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]); }, col, lw, out); }
/* brilho de quatro pontas; com `o` ganha contorno */
function spark(c, x, y, r, col, o) {
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x + r * .12, y - r * .12, x + r, y); c.quadraticCurveTo(x + r * .12, y + r * .12, x, y + r); c.quadraticCurveTo(x - r * .12, y + r * .12, x - r, y); c.quadraticCurveTo(x - r * .12, y - r * .12, x, y - r); c.closePath();
  if (o) { c.strokeStyle = o === true ? OUT : o; c.lineWidth = 1.7 * Q; c.lineJoin = 'round'; c.stroke(); }
  c.fillStyle = col || '#fff6cf'; c.fill();
}
function shine(c, x, y, rx, ry, rot, a) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,' + (a == null ? .7 : a) + ')'; c.fill(); }
function odot(c, x, y, r, col, out) { dot(c, x, y, r + .9 * Q, out || OUT); dot(c, x, y, r, col); }
function rr(c, x, y, w, h, r) { c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath(); }
function heartP(c, x, y, s) {
  c.moveTo(x, y - s * .45); c.bezierCurveTo(x - s * .5, y - s * 1.15, x - s * 1.25, y - s * .75, x - s * 1.1, y - s * .1);
  c.bezierCurveTo(x - s * .95, y + s * .5, x - s * .3, y + s * .7, x, y + s * 1.05); c.bezierCurveTo(x + s * .3, y + s * .7, x + s * .95, y + s * .5, x + s * 1.1, y - s * .1);
  c.bezierCurveTo(x + s * 1.25, y - s * .75, x + s * .5, y - s * 1.15, x, y - s * .45); c.closePath();
}
function dropP(c, x, y, s) {
  c.moveTo(x, y - s * 1.3); c.bezierCurveTo(x + s * .1, y - s * .6, x + s * .9, y - s * .1, x + s * .9, y + s * .4); c.bezierCurveTo(x + s * .9, y + s * .95, x + s * .5, y + s * 1.3, x, y + s * 1.3);
  c.bezierCurveTo(x - s * .5, y + s * 1.3, x - s * .9, y + s * .95, x - s * .9, y + s * .4); c.bezierCurveTo(x - s * .9, y - s * .1, x - s * .1, y - s * .6, x, y - s * 1.3); c.closePath();
}
function shieldP(c, x, y, s) {
  c.moveTo(x - s, y - s * .95); c.quadraticCurveTo(x - s * .45, y - s * .85, x, y - s * 1.2); c.quadraticCurveTo(x + s * .45, y - s * .85, x + s, y - s * .95);
  c.lineTo(x + s, y); c.quadraticCurveTo(x + s * .9, y + s * .85, x, y + s * 1.3); c.quadraticCurveTo(x - s * .9, y + s * .85, x - s, y); c.closePath();
}
function burstP(c, x, y, R, r, n, rot) { for (var i = 0; i < n * 2; i++) { var a = (rot || 0) - Math.PI / 2 + i * Math.PI / n, q = i % 2 ? r : R; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); }
function flameP(c, x, y, s) {
  c.moveTo(x, y - s * 1.4); c.bezierCurveTo(x + s * .2, y - s * .7, x + s, y - s * .3, x + s * .85, y + s * .5); c.bezierCurveTo(x + s * .75, y + s * 1.1, x + s * .3, y + s * 1.3, x, y + s * 1.3);
  c.bezierCurveTo(x - s * .5, y + s * 1.3, x - s * .95, y + s * .95, x - s * .9, y + s * .35); c.bezierCurveTo(x - s * .88, y - s * .05, x - s * .6, y - s * .3, x - s * .5, y - s * .65);
  c.bezierCurveTo(x - s * .3, y - s * .35, x - s * .2, y - s * .3, x - s * .1, y - s * .4); c.bezierCurveTo(x - s * .25, y - s * .9, x - s * .1, y - s * 1.2, x, y - s * 1.4); c.closePath();
}
function skullP(c, x, y, s) {
  c.moveTo(x - s * .52, y + s); c.lineTo(x - s * .52, y + s * .52); c.bezierCurveTo(x - s * 1.3, y + s * .2, x - s * 1.15, y - s * 1.05, x, y - s * 1.05);
  c.bezierCurveTo(x + s * 1.15, y - s * 1.05, x + s * 1.3, y + s * .2, x + s * .52, y + s * .52); c.lineTo(x + s * .52, y + s); c.closePath();
}
function skull(c, x, y, s, col, eye, o) {
  P(c, function (c) { skullP(c, x, y, s); }, col, {
    k: s * .16, lw: o && o.lw, sh: COLD, inn: function (c) {
      ln(c, [x - s * .18, y + s * .66, x - s * .18, y + s * 1.05], 'rgba(40,24,30,.75)', s * .1); ln(c, [x + s * .18, y + s * .66, x + s * .18, y + s * 1.05], 'rgba(40,24,30,.75)', s * .1);
    },
  });
  [-1, 1].forEach(function (d) { c.beginPath(); c.ellipse(x + d * s * .43, y - s * .08, s * .29, s * .33, d * .25, 0, TAU); c.fillStyle = '#1c0f12'; c.fill(); if (eye) { dot(c, x + d * s * .43, y - s * .06, s * .17, eye); dot(c, x + d * s * .43, y - s * .06, s * .07, '#fff'); } });
  c.beginPath(); c.moveTo(x, y + s * .2); c.lineTo(x - s * .12, y + s * .46); c.lineTo(x + s * .12, y + s * .46); c.closePath(); c.fillStyle = '#1c0f12'; c.fill();
}
function gearP(c, x, y, R, r, n, hole) {
  var st = TAU / n, i;
  for (i = 0; i < n; i++) [[-.3, r], [-.17, R], [.17, R], [.3, r]].forEach(function (q, j) { var a = (i + q[0]) * st; c[i || j ? 'lineTo' : 'moveTo'](x + Math.cos(a) * q[1], y + Math.sin(a) * q[1]); });
  c.closePath(); if (hole) { c.moveTo(x + hole, y); c.arc(x, y, hole, 0, TAU, true); }
}
/* seta reta em polígono: da cauda (x1,y1) à ponta (x2,y2) */
function arrowP(c, x1, y1, x2, y2, w, hw, hl) {
  var a = Math.atan2(y2 - y1, x2 - x1), co = Math.cos(a), si = Math.sin(a), L = Math.hypot(x2 - x1, y2 - y1) - hl;
  function pt(u, v, first) { var X = x1 + co * u - si * v, Y = y1 + si * u + co * v; if (first) c.moveTo(X, Y); else c.lineTo(X, Y); }
  pt(0, -w, 1); pt(L, -w); pt(L, -hw); pt(L + hl, 0); pt(L, hw); pt(L, w); pt(0, w); c.closePath();
}
/* seta em arco */
function arcArrow(c, cx, cy, r, a0, a1, col, lw, hs) {
  hs = hs || lw * 1.5; var d = a1 > a0 ? 1 : -1, px = cx + Math.cos(a1) * r, py = cy + Math.sin(a1) * r, tx = -Math.sin(a1) * d, ty = Math.cos(a1) * d, nx = Math.cos(a1), ny = Math.sin(a1);
  function head(c) { c.moveTo(px + tx * hs * 1.35, py + ty * hs * 1.35); c.lineTo(px + nx * hs, py + ny * hs); c.lineTo(px - nx * hs, py - ny * hs); c.closePath(); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.arc(cx, cy, r, a0, a1, d < 0); c.strokeStyle = OUT; c.lineWidth = lw + 2.3 * Q; c.stroke();
  c.beginPath(); head(c); c.strokeStyle = OUT; c.lineWidth = 2.3 * Q; c.stroke(); c.fillStyle = col; c.fill();
  c.beginPath(); c.arc(cx, cy, r, a0, a1, d < 0); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
}
/* rastro que engrossa ao longo de uma curva quadrática, com a ponta arredondada */
function trailP(c, x0, y0, x1, y1, x2, y2, w0, w1) {
  var n = 10, L = [], R = [], i, t, u, x, y, dx, dy, d, w;
  for (i = 0; i <= n; i++) { t = i / n; u = 1 - t; x = u * u * x0 + 2 * u * t * x1 + t * t * x2; y = u * u * y0 + 2 * u * t * y1 + t * t * y2; dx = 2 * u * (x1 - x0) + 2 * t * (x2 - x1); dy = 2 * u * (y1 - y0) + 2 * t * (y2 - y1); d = Math.hypot(dx, dy) || 1; w = w0 + (w1 - w0) * t; L.push(x - dy / d * w, y + dx / d * w); R.push(x + dy / d * w, y - dx / d * w); }
  c.moveTo(L[0], L[1]); for (i = 2; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]);
  var aL = Math.atan2(dx, -dy); c.arc(x2, y2, w1, aL, aL - Math.PI, true);
  for (i = R.length - 2; i >= 0; i -= 2) c.lineTo(R[i], R[i + 1]); c.closePath();
}
function leaf(c, x, y, rot, s, col) { c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); P(c, function (c) { c.moveTo(0, 0); c.quadraticCurveTo(3, -4.6, 9.4, -.8); c.quadraticCurveTo(4, 3, 0, 0); c.closePath(); }, col || GR, { k: .8, lw: 1.5 / s, sh: LEAFSH, inn: function (c) { ln(c, [.6, -.1, 7.6, -.7], GR2, .8); } }); c.restore(); }
/* facão; `ghost` desenha só a lâmina */
function facao(c, x, y, rot, s, ghost) {
  var col = typeof ghost === 'string' ? ghost : STEEL;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  P(c, function (c) { c.moveTo(-3.3, -2); c.lineTo(-4.4, -20); c.quadraticCurveTo(-2.4, -28, 2.6, -31.5); c.quadraticCurveTo(8.4, -25, 6.4, -18); c.lineTo(3.6, -2); c.closePath(); }, col, { k: 1.5, lw: (ghost ? 1.5 : 2) / s, out: ghost ? '#2c3550' : OUT, sh: COLD, inn: function (c) { ln(c, [-1, -4, -1.6, -21], 'rgba(110,120,145,.7)', 1.1); ln(c, [4.4, -17, 5.6, -24], 'rgba(255,255,255,.7)', 1.1); } });
  if (!ghost) {
    P(c, function (c) { poly(c, [-6.8, -3.9, 7.2, -3.9, 7.2, -.5, -6.8, -.5]); }, GOLD, { k: .6, lw: 1.7 / s });
    P(c, function (c) { cap(c, 0, .6, 0, 7.4, 2.9); }, '#5a3218', { k: 1, lw: 1.9 / s }); dot(c, 0, 2.2, .9, GOLD); dot(c, 0, 6, .9, GOLD);
  }
  c.restore();
}
/* flecha: da cauda (x1,y1) à ponta (x2,y2) */
function arrow(c, x1, y1, x2, y2, s, fl) {
  s = s || 1; var L = Math.hypot(x2 - x1, y2 - y1);
  c.save(); c.translate(x1, y1); c.rotate(Math.atan2(y2 - y1, x2 - x1));
  bar(c, [0, 0, L - 4 * s, 0], '#d9b77a', 1.5 * s);
  P(c, function (c) { poly(c, [L - 6 * s, -3.4 * s, L + .6, 0, L - 6 * s, 3.4 * s]); }, '#dcd8cc', { k: .6, lw: 1.5, sh: COLD });
  if (fl !== false) P(c, function (c) { poly(c, [1.4 * s, 0, -1.2 * s, -3 * s, 4.2 * s, -3 * s, 6.6 * s, 0, 4.2 * s, 3 * s, -1.2 * s, 3 * s]); }, fl || RED, { k: .6, lw: 1.4 });
  c.restore();
}
/* martelo: cabo saindo de (x,y), cabeça para cima antes de girar */
function hammer(c, x, y, rot, s) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  P(c, function (c) { cap(c, 0, 0, 0, -16, 1.8); }, '#9a6a3a', { k: .8, lw: 1.8 / s, inn: function (c) { ln(c, [-2, -3.4, 2, -3.4], DK, 1); ln(c, [-2, -.6, 2, -.6], DK, 1); } });
  P(c, function (c) { c.moveTo(-8, -23.6); c.lineTo(6.4, -23.6); c.quadraticCurveTo(8.4, -23.6, 8.4, -21.6); c.lineTo(8.4, -17); c.quadraticCurveTo(8.4, -15, 6.4, -15); c.lineTo(-8, -15); c.closePath(); }, '#a9a6a0', { k: 1.3, lw: 2 / s, sh: COLD, hi: 'rgba(255,255,255,.4)', inn: function (c) { c.fillStyle = 'rgba(40,44,60,.4)'; c.fillRect(-9, -24, 3.4, 10); ln(c, [-3, -21.6, 5.6, -21.6], 'rgba(255,255,255,.55)', 1.2); } });
  c.restore();
}
function anvilP(c, x, y, s) {
  c.moveTo(x - 16 * s, y - 9 * s); c.lineTo(x + 13 * s, y - 9 * s); c.lineTo(x + 13 * s, y - 4.4 * s); c.quadraticCurveTo(x + 6.4 * s, y - 3.4 * s, x + 5 * s, y + .6 * s); c.lineTo(x + 5 * s, y + 3.6 * s); c.lineTo(x + 10.5 * s, y + 5.6 * s); c.lineTo(x + 10.5 * s, y + 9 * s);
  c.lineTo(x - 10.5 * s, y + 9 * s); c.lineTo(x - 10.5 * s, y + 5.6 * s); c.lineTo(x - 5 * s, y + 3.6 * s); c.lineTo(x - 5 * s, y + .6 * s); c.quadraticCurveTo(x - 6 * s, y - 3.6 * s, x - 9.5 * s, y - 4.2 * s); c.quadraticCurveTo(x - 14 * s, y - 5 * s, x - 16 * s, y - 9 * s); c.closePath();
}
function anvil(c, x, y, s) {
  P(c, function (c) { anvilP(c, x, y, s); }, '#7f8592', { k: 1.6, sh: 'rgba(20,24,44,.45)', hi: 'rgba(255,255,255,.22)', inn: function (c) { c.fillStyle = '#b9bec8'; c.fillRect(x - 17 * s, y - 9.4 * s, 31 * s, 2.7 * s); ln(c, [x - 10 * s, y + 6 * s, x + 10 * s, y + 6 * s], 'rgba(20,24,44,.5)', 1); } });
}
function coin(c, x, y, r, mark) {
  P(c, function (c) { el(c, x, y, r, r); }, GOLD, { k: r * .2, sh: GSH, inn: function (c) { c.beginPath(); c.arc(x, y, r * .7, 0, TAU); c.strokeStyle = 'rgba(140,80,0,.6)'; c.lineWidth = r * .13; c.stroke(); } });
  if (mark !== false) { c.beginPath(); burstP(c, x, y, r * .48, r * .22, 5); c.fillStyle = '#fff3c4'; c.fill(); }
}
function paw(c, x, y, s, col, pad) {
  [[-.8, -.1, .24, .31, -.45], [-.3, -.62, .25, .34, -.14], [.3, -.62, .25, .34, .14], [.8, -.1, .24, .31, .45]].forEach(function (q) { P(c, function (c) { el(c, x + q[0] * s, y + q[1] * s, q[2] * s, q[3] * s, q[4]); }, col, { k: s * .09, lw: 1.9 }); });
  P(c, function (c) {
    c.moveTo(x, y - s * .04); c.bezierCurveTo(x + s * .5, y - s * .04, x + s * .76, y + s * .45, x + s * .64, y + s * .74); c.bezierCurveTo(x + s * .5, y + s * 1.04, x + s * .16, y + s * .82, x, y + s * .82);
    c.bezierCurveTo(x - s * .16, y + s * .82, x - s * .5, y + s * 1.04, x - s * .64, y + s * .74); c.bezierCurveTo(x - s * .76, y + s * .45, x - s * .5, y - s * .04, x, y - s * .04); c.closePath();
  }, col, { k: s * .13, inn: pad ? function (c) { c.beginPath(); c.ellipse(x, y + s * .42, s * .3, s * .22, 0, 0, TAU); c.fillStyle = pad; c.fill(); } : null });
}
function gem(c, x, y, r, col, sh) { P(c, function (c) { poly(c, [x, y - r, x + r * .9, y - r * .15, x, y + r, x - r * .9, y - r * .15]); }, col, { k: r * .22, lw: 1.7, sh: sh || COLD, inn: function (c) { ln(c, [x - r * .9, y - r * .15, x + r * .9, y - r * .15], 'rgba(0,0,0,.28)', .8); ln(c, [x, y - r, x - r * .35, y - r * .15, x, y + r], 'rgba(255,255,255,.5)', .8); } }); }
function speaker(c) { P(c, function (c) { c.moveTo(4.6, 15.2); c.lineTo(11.6, 15.2); c.lineTo(20.4, 7.4); c.lineTo(20.4, 32.6); c.lineTo(11.6, 24.8); c.lineTo(4.6, 24.8); c.closePath(); }, CRM, { k: 1.6, lw: 2.3, inn: function (c) { ln(c, [11.6, 15.2, 11.6, 24.8], 'rgba(90,50,20,.5)', 1.2); } }); }

/* ---------------- ícones ---------------- */
var I = {
  /* ===== atributos ===== */
  forca: function (c) {
    P(c, function (c) { c.moveTo(8, 8); c.quadraticCurveTo(8, 3.4, 13, 3.4); c.lineTo(18, 3.4); c.quadraticCurveTo(22.6, 4, 22.2, 9); c.quadraticCurveTo(22, 13, 18.6, 14.2); c.quadraticCurveTo(17.6, 17, 18.2, 19.6); c.quadraticCurveTo(24, 12, 31, 15.6); c.quadraticCurveTo(36.8, 19.4, 36.4, 27); c.lineTo(36.4, 33); c.quadraticCurveTo(24, 37.8, 13, 35.2); c.quadraticCurveTo(4.6, 32.6, 5, 24); c.quadraticCurveTo(5.6, 15, 8, 8); c.closePath(); }, FOR, {
      k: 2.2, lw: 2.3, sh: 'rgba(90,10,20,.38)', inn: function (c) {
        ln(c, [12.8, 4.2, 12.8, 9.4], 'rgba(90,20,10,.6)', 1.2); ln(c, [17.2, 4.2, 17.2, 9.4], 'rgba(90,20,10,.6)', 1.2); ln(c, [9, 10.8, 21.4, 10.8], 'rgba(90,20,10,.5)', 1.2);
        c.beginPath(); c.moveTo(18.2, 19.6); c.quadraticCurveTo(18.6, 24.4, 22.6, 27); c.strokeStyle = 'rgba(90,20,10,.65)'; c.lineWidth = 1.5; c.stroke();
        shine(c, 27.4, 18.8, 4.6, 1.8, .25, .5);
      },
    });
  },
  agilidade: function (c) {
    ln(c, [4.4, 21, 10, 15.4], 'rgba(200,255,170,.85)', 1.8); ln(c, [15, 35.4, 20.4, 30], 'rgba(200,255,170,.85)', 1.8);
    c.save(); c.translate(20.5, 19.5); c.rotate(.74);
    bar(c, [0, 6, 0, 18.4], CRM, 1.7);
    P(c, function (c) { c.moveTo(0, -19); c.bezierCurveTo(9.6, -14.6, 11.6, -6, 9.8, -1); c.lineTo(5, -.4); c.lineTo(9.2, 2.4); c.bezierCurveTo(8.2, 6.6, 5.4, 9.6, 1.6, 12); c.lineTo(-1.6, 12); c.bezierCurveTo(-6.2, 9, -9, 4.6, -9.6, .8); c.lineTo(-5, -1.2); c.lineTo(-9.8, -3.8); c.bezierCurveTo(-10.4, -10, -7.4, -15.6, 0, -19); c.closePath(); }, AGI, {
      k: 1.8, sh: LEAFSH, hi: 'rgba(250,255,200,.4)', inn: function (c) {
        [[-11, 6.6], [-6, 8], [3, 6.4]].forEach(function (q) { ln(c, [0, q[0] + 4, q[1], q[0]], 'rgba(30,100,30,.5)', 1); ln(c, [0, q[0] + 4, -q[1], q[0]], 'rgba(30,100,30,.5)', 1); });
        ln(c, [0, -15, 0, 11], '#f4ffd8', 1.5);
      },
    });
    c.restore();
  },
  inteligencia: function (c) {
    [[20, 2.4, 20, 8], [9.4, 5.6, 12.2, 10.2], [30.6, 5.6, 27.8, 10.2]].forEach(function (q) { bar(c, q, '#bfe9ff', 1.7); });
    P(c, function (c) { c.moveTo(2.4, 23); c.quadraticCurveTo(20, 4.6, 37.6, 23); c.quadraticCurveTo(20, 41.4, 2.4, 23); c.closePath(); }, INT, {
      k: 1.6, lw: 2.3, sh: WSH, inn: function (c) {
        c.beginPath(); c.moveTo(6.8, 23); c.quadraticCurveTo(20, 9.6, 33.2, 23); c.quadraticCurveTo(20, 36.4, 6.8, 23); c.closePath(); c.fillStyle = '#f4fbff'; c.fill();
        dot(c, 20, 23, 6.5, '#12314f'); dot(c, 20, 23, 5.4, '#2585d0'); dot(c, 20, 23, 2.7, '#0f1c33'); dot(c, 17.8, 20.8, 1.6, '#fff');
      },
    });
  },
  vitalidade: function (c) {
    P(c, function (c) { heartP(c, 20, 20.4, 13.6); }, VIT, {
      k: 2.2, lw: 2.3, sh: GSH, inn: function (c) {
        ln(c, [6, 21.4, 13.4, 21.4, 16.6, 14.6, 21, 28.4, 24.4, 19, 26.6, 21.4, 34, 21.4], '#6b3a10', 2);
        shine(c, 12.6, 12.8, 3.4, 1.9, -.6, .6);
      },
    });
  },
  espirito: function (c) {
    P(c, function (c) { dropP(c, 7.4, 11, 2.6); }, '#c9f5dc', { k: 0, lw: 1.5 }); P(c, function (c) { dropP(c, 33, 13.6, 2.1); }, '#c9f5dc', { k: 0, lw: 1.5 });
    P(c, function (c) { flameP(c, 20, 20.8, 12.6); }, ESP, {
      k: 2, lw: 2.3, sh: 'rgba(10,70,60,.4)', inn: function (c) {
        c.beginPath(); flameP(c, 20.4, 25.4, 7.8); c.fillStyle = '#d2f8e2'; c.fill();
        c.beginPath(); c.arc(20.6, 28, 4.3, -1.2, 2.9); c.arc(19.4, 27.6, 1.8, 2.9, 6.6); c.strokeStyle = '#2f8f68'; c.lineWidth = 1.7; c.lineCap = 'round'; c.stroke();
      },
    });
  },
  sorte: function (c) {
    rope(c, function (c) { c.moveTo(20.5, 20); c.quadraticCurveTo(21, 30, 28, 36.4); }, '#7d5fc0', 2.2);
    for (var i = 0; i < 4; i++) {
      c.save(); c.translate(20, 18.2); c.rotate(.785 + i * 1.5708);
      P(c, function (c) { heartP(c, 0, -9, 6.9); }, SOR, { k: 1.4, lw: 2, sh: 'rgba(50,20,110,.4)', hi: 'rgba(255,240,255,.35)', inn: function (c) { ln(c, [0, -3.6, 0, -9.6], 'rgba(70,40,140,.6)', 1.1); } });
      c.restore();
    }
    dot(c, 20, 18.2, 1.9, '#7d5fc0'); spark(c, 33.4, 31.6, 3.6, '#fff6cf', true);
  },

  /* ===== estatísticas ===== */
  vida: function (c) {
    P(c, function (c) { heartP(c, 20, 20.4, 13.6); }, BLOOD, { k: 2.4, lw: 2.3, sh: 'rgba(90,0,40,.42)', hi: 'rgba(255,200,200,.35)', inn: function (c) { shine(c, 12.4, 13.2, 3.6, 2.1, -.6, .75); dot(c, 17.6, 10.6, 1, 'rgba(255,255,255,.7)'); } });
  },
  mana: function (c) {
    P(c, function (c) { dropP(c, 20, 19.6, 13); }, '#3f8fe8', { k: 2.4, lw: 2.3, out: WOUT, sh: WSH, hi: 'rgba(210,240,255,.4)', inn: function (c) { shine(c, 14.2, 22, 1.9, 4.4, .4, .75); spark(c, 23.4, 26, 5, '#e6f6ff'); } });
  },
  dano: function (c) { facao(c, 11, 28.6, .8, 1.04); },
  defesa: function (c) {
    P(c, function (c) { shieldP(c, 20, 18.6, 14.2); }, '#c9cdd3', {
      k: 2.2, lw: 2.3, sh: COLD, inn: function (c) {
        c.beginPath(); shieldP(c, 20, 18.8, 10.4); c.fillStyle = '#7f8a99'; c.fill();
        c.fillStyle = '#aab3bf'; c.fillRect(18.2, 4, 3.6, 32); c.fillRect(8, 15, 24, 3.4);
        shine(c, 11.4, 11, 2, 4, .3, .45);
      },
    });
    odot(c, 20, 16.7, 3.1, GOLD); dot(c, 19.2, 15.9, 1, '#fff3c4');
  },
  critico: function (c) {
    P(c, function (c) { el(c, 17.4, 23, 14.6, 14.6); }, '#d8323f', { k: 2, lw: 2.3, inn: function (c) { dot(c, 17.4, 23, 10.4, '#f6ecd2'); dot(c, 17.4, 23, 6.4, '#d8323f'); dot(c, 17.4, 23, 2.6, '#f6ecd2'); } });
    arrow(c, 36.4, 4, 19.2, 21.2, 1.15, GOLD);
    spark(c, 10.4, 8.6, 3.4, '#fff6cf', true);
  },
  danoCritico: function (c) {
    P(c, function (c) { burstP(c, 20, 20, 18.6, 10.4, 8, .2); }, '#ff9d2e', { k: 1.8, sh: 'rgba(150,30,0,.4)', inn: function (c) { c.beginPath(); burstP(c, 20, 20, 12.4, 6.6, 8, .2); c.fillStyle = '#fff0a0'; c.fill(); } });
    facao(c, 12.4, 28, .8, .88);
  },
  velAtaque: function (c) {
    facao(c, 8.4, 33.4, -.02, .8, '#7f8ba6'); facao(c, 8.4, 33.4, .47, .87, '#b9c2d3');
    c.beginPath(); c.arc(8.4, 33.4, 31.4, -1.34, -.66); c.strokeStyle = 'rgba(255,246,207,.95)'; c.lineWidth = 1.8; c.lineCap = 'round'; c.stroke();
    facao(c, 8.4, 33.4, .98, .92);
  },
  movimento: function (c) {
    [[2.6, 12.6, 9, 12.6], [1.6, 19.6, 8, 19.6], [3.4, 26.6, 8.4, 26.6]].forEach(function (q) { ln(c, q, 'rgba(255,246,207,.85)', 1.8); });
    P(c, function (c) { rr(c, 11.4, 30.2, 25.6, 5, 1.6); }, DK, { k: 0, lw: 2.1 });
    P(c, function (c) { c.moveTo(13, 5.4); c.lineTo(24.6, 5.4); c.lineTo(25, 18.6); c.quadraticCurveTo(33.6, 20.4, 35.6, 26.4); c.quadraticCurveTo(36.6, 30, 34.8, 31.6); c.lineTo(12.6, 31.6); c.quadraticCurveTo(11.6, 22, 13, 5.4); c.closePath(); }, LE, {
      k: 2, lw: 2.3, inn: function (c) {
        c.fillStyle = '#b46c36'; c.fillRect(10, 4, 18, 5.6); ln(c, [12, 9.8, 26, 9.8], DK, 1.1);
        c.beginPath(); c.moveTo(25, 18.8); c.quadraticCurveTo(21, 21.4, 20.4, 27); c.strokeStyle = 'rgba(58,32,20,.6)'; c.lineWidth = 1.2; c.stroke();
        ln(c, [13.4, 27.6, 35, 27.6], CRM, 1, [1.7, 1.8]);
      },
    });
    dot(c, 22.4, 14, 1.3, GOLD); dot(c, 22.4, 18.6, 1.3, GOLD);
  },
  esquiva: function (c) {
    odot(c, 5.4, 34, 2.4, CRM); odot(c, 10.6, 35.6, 1.7, CRM); odot(c, 3.6, 28.6, 1.5, CRM);
    c.beginPath(); c.moveTo(8, 30); c.quadraticCurveTo(15, 2, 30, 17); c.setLineDash([2.4, 4]); c.strokeStyle = 'rgba(220,255,200,.7)'; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
    P(c, function (c) { trailP(c, 7, 27, 13, -4, 30, 17.4, .6, 4.4); }, AGI, { k: 1.2, sh: LEAFSH, inn: function (c) { c.beginPath(); c.moveTo(11, 13); c.quadraticCurveTo(17, 3, 29, 16.4); c.strokeStyle = '#f4ffd8'; c.lineWidth = 1.5; c.stroke(); } });
    P(c, function (c) { poly(c, [36.6, 26.4, 22.4, 20.6, 33.6, 10.4]); }, '#d9ffb8', { k: 1.2, sh: LEAFSH });
  },
  magia: function (c) {
    bar(c, [8, 36, 22.6, 14.6], '#9a6a3a', 2.6);
    rope(c, function (c) { c.moveTo(22.6, 14.6); c.bezierCurveTo(26, 9.6, 33.6, 8, 34.4, 14.4); c.bezierCurveTo(35, 19, 30.4, 20.6, 28.4, 18.4); }, '#9a6a3a', 2.4);
    ln(c, [10.6, 32.4, 13, 34], DK, 1.2); ln(c, [12.6, 29.4, 15, 31], DK, 1.2);
    P(c, function (c) { el(c, 27.6, 12.6, 5.2, 5.2); }, '#8fe3ff', { k: 1.3, lw: 1.9, out: WOUT, sh: WSH, inn: function (c) { dot(c, 26, 11, 1.5, '#fff'); } });
    spark(c, 11.4, 9.4, 5, '#e6f6ff', WOUT); spark(c, 20, 4.6, 2.8, '#e6f6ff', WOUT); spark(c, 35, 26.4, 2.6, '#e6f6ff', WOUT);
  },
  recarga: function (c) {
    P(c, function (c) { c.moveTo(9.6, 7); c.lineTo(30.4, 7); c.quadraticCurveTo(30.4, 15.4, 22.6, 20); c.quadraticCurveTo(30.4, 24.6, 30.4, 33); c.lineTo(9.6, 33); c.quadraticCurveTo(9.6, 24.6, 17.4, 20); c.quadraticCurveTo(9.6, 15.4, 9.6, 7); c.closePath(); }, '#dff1f3', {
      k: 1.4, lw: 2.1, sh: 'rgba(40,70,90,.3)', inn: function (c) {
        c.fillStyle = GOLD; c.fillRect(8, 13.6, 24, 7); c.fillRect(19.3, 20, 1.5, 12);
        c.beginPath(); c.moveTo(9, 33.4); c.quadraticCurveTo(20, 21.6, 31, 33.4); c.closePath(); c.fill();
        c.fillStyle = 'rgba(160,90,0,.4)'; c.fillRect(8, 13.6, 24, 1.3); shine(c, 13.4, 28.6, 1, 2.6, .5, .7);
      },
    });
    [3.4, 32.2].forEach(function (y) { P(c, function (c) { rr(c, 6.6, y, 26.8, 4.6, 1.6); }, '#a5652e', { k: .8, lw: 2.1, inn: function (c) { ln(c, [9, y + 1.3, 31, y + 1.3], 'rgba(255,220,160,.5)', 1); } }); });
  },
  poder: function (c) {
    P(c, function (c) { poly(c, [10.6, 12.4, 9, 3.4, 15.4, 7.6, 20, 2, 24.6, 7.6, 31, 3.4, 29.4, 12.4]); }, GOLD, { k: 1.1, lw: 2, sh: GSH, inn: function (c) { dot(c, 20, 9, 1.3, BLOOD); } });
    P(c, function (c) { rr(c, 13, 29.6, 14, 8.6, 1.6); }, LE2, { k: 1, lw: 2.1, inn: function (c) { ln(c, [13, 32.4, 27, 32.4], GOLD, 1.3); } });
    P(c, function (c) { c.moveTo(8.6, 19); c.quadraticCurveTo(8.6, 15, 12, 15); c.quadraticCurveTo(14, 13.6, 16.4, 14.8); c.quadraticCurveTo(19, 13.2, 21.6, 14.8); c.quadraticCurveTo(24.4, 13.4, 26.6, 15.2); c.quadraticCurveTo(31.6, 15.4, 31.6, 20.4); c.lineTo(31.6, 26.4); c.quadraticCurveTo(31.6, 31.4, 26.6, 31.4); c.lineTo(13.4, 31.4); c.quadraticCurveTo(8.6, 31.4, 8.6, 26.4); c.closePath(); }, FOR, {
      k: 2, lw: 2.3, sh: 'rgba(90,10,20,.38)', inn: function (c) {
        [14.4, 19.2, 24.2].forEach(function (x) { ln(c, [x, 15.6, x, 22], 'rgba(90,20,10,.6)', 1.2); });
        c.beginPath(); c.moveTo(8.6, 23.4); c.quadraticCurveTo(18, 21.4, 24.4, 24); c.quadraticCurveTo(27, 25.6, 25, 28); c.strokeStyle = 'rgba(90,20,10,.7)'; c.lineWidth = 1.4; c.stroke();
        shine(c, 12.6, 18, 2.6, 1.3, -.2, .45);
      },
    });
  },
  ouro: function (c) {
    function pile(x, y) {
      P(c, function (c) { c.moveTo(x + 9, y); c.ellipse(x, y, 9, 3.6, 0, 0, Math.PI); c.lineTo(x - 9, y + 3); c.ellipse(x, y + 3, 9, 3.6, 0, Math.PI, 0, true); c.closePath(); }, GOLD2, { k: .9, lw: 1.9, inn: function (c) { for (var i = -3; i < 4; i++) ln(c, [x + i * 2.5, y + 2.4, x + i * 2.5, y + 7], 'rgba(110,60,0,.4)', .8); } });
      P(c, function (c) { el(c, x, y, 9, 3.6); }, GOLD, { k: .9, lw: 1.9 });
    }
    pile(14.6, 30.6); pile(15.8, 25.6); pile(14, 20.6);
    coin(c, 27.4, 22.6, 9);
    spark(c, 9, 9.4, 4, '#fff6cf', true); spark(c, 32, 8, 2.6, '#fff6cf', true);
  },
  xp: function (c) {
    P(c, function (c) { burstP(c, 16.6, 23, 14.6, 6.6, 5); }, GOLD, { k: 1.9, lw: 2.2, sh: GSH, hi: 'rgba(255,255,220,.5)', inn: function (c) { c.beginPath(); burstP(c, 16.6, 23, 6.6, 3, 5); c.fillStyle = '#fff3c4'; c.fill(); } });
    P(c, function (c) { arrowP(c, 30.6, 22.6, 30.6, 2.6, 3, 7.4, 9); }, UP, { k: 1.2, lw: 2.1, sh: LEAFSH });
  },
  resistencia: function (c) {
    P(c, function (c) { shieldP(c, 20, 18.6, 14.2); }, '#3f8f48', { k: 2.2, lw: 2.3, sh: LEAFSH, inn: function (c) { c.beginPath(); shieldP(c, 20, 18.8, 10.6); c.fillStyle = '#62b85a'; c.fill(); shine(c, 11, 10.6, 1.8, 3.6, .3, .4); } });
    P(c, function (c) { c.moveTo(13.4, 27.4); c.bezierCurveTo(10.6, 16.6, 18.6, 9.6, 27.6, 9.4); c.bezierCurveTo(28.6, 19, 22.6, 27.6, 13.4, 27.4); c.closePath(); }, '#e9f7c4', { k: 1, lw: 1.8, sh: LEAFSH, inn: function (c) { ln(c, [13.6, 27, 26, 11.4], GR2, 1.2); ln(c, [18, 21.6, 19, 16.4], GR2, .9); ln(c, [19.4, 20.6, 24.6, 19.6], GR2, .9); } });
  },
  roubo: function (c) {
    P(c, function (c) { c.moveTo(3.6, 3.6); c.lineTo(36.4, 3.6); c.quadraticCurveTo(36.4, 12, 30, 12.6); c.lineTo(10, 12.6); c.quadraticCurveTo(3.6, 12, 3.6, 3.6); c.closePath(); }, '#9a2444', { k: 1.4, lw: 2.2 });
    [[11.6, 1], [28.4, -1]].forEach(function (q) { P(c, function (c) { c.moveTo(q[0] - 5.4, 8.6); c.quadraticCurveTo(q[0], 6.2, q[0] + 5.4, 8.6); c.quadraticCurveTo(q[0] + 4.6 + q[1], 18.6, q[0] + q[1] * 1.6, 27); c.quadraticCurveTo(q[0] - 4.6 + q[1], 18.6, q[0] - 5.4, 8.6); c.closePath(); }, BONE, { k: 1.4, lw: 2.1, sh: COLD }); });
    P(c, function (c) { dropP(c, 20, 29.4, 5.8); }, BLOOD, { k: 1.4, lw: 2.1, sh: 'rgba(90,0,40,.42)', inn: function (c) { shine(c, 17.8, 30.6, .9, 2, .4, .75); } });
  },
  veneno: function (c) {
    odot(c, 32.6, 8, 2.5, '#b9f07a'); odot(c, 35.2, 16, 1.5, '#b9f07a'); odot(c, 6.4, 13.4, 1.7, '#b9f07a');
    P(c, function (c) { dropP(c, 19.6, 19.6, 13); }, '#7ccf3a', {
      k: 2.2, lw: 2.3, sh: 'rgba(10,70,20,.42)', hi: 'rgba(240,255,190,.4)', inn: function (c) {
        [-1, 1].forEach(function (d) { c.beginPath(); c.ellipse(19.6 + d * 4.6, 22.8, 3, 3.3, d * .2, 0, TAU); c.fillStyle = '#17401a'; c.fill(); });
        c.beginPath(); c.moveTo(19.6, 26.4); c.lineTo(18.2, 29); c.lineTo(21, 29); c.closePath(); c.fill();
        [16.4, 19.6, 22.8].forEach(function (x) { ln(c, [x, 31, x, 34], '#17401a', 1.3); });
        shine(c, 14.6, 13.6, 1.3, 2.8, .5, .6);
      },
    });
  },
  alcance: function (c) {
    facao(c, 6, 35, .8, .55);
    P(c, function (c) { c.moveTo(3.4, 3.4); c.arc(5, 35.6, 32.2, -1.62, -.03); c.quadraticCurveTo(22.4, 18.6, 3.4, 3.4); c.closePath(); }, '#ffe9a0', { k: 1.2, lw: 2.2, sh: 'rgba(190,90,0,.45)', hi: 'rgba(255,255,255,.55)' });
    
  },
  cura: function (c) {
    P(c, function (c) { poly(c, [14.6, 5.6, 25.4, 5.6, 25.4, 15.2, 35, 15.2, 35, 26, 25.4, 26, 25.4, 35.6, 14.6, 35.6, 14.6, 26, 5, 26, 5, 15.2, 14.6, 15.2]); }, GR, { k: 2, lw: 2.3, sh: LEAFSH, hi: 'rgba(240,255,190,.45)' });
    P(c, function (c) { heartP(c, 20, 20.4, 5.4); }, '#fff0e0', { k: .9, lw: 1.8, sh: 'rgba(200,60,60,.35)' });
  },
  regeneracao: function (c) {
    arcArrow(c, 20, 20, 15, 3.5, 5.72, UP, 3.2, 4.6); arcArrow(c, 20, 20, 15, .36, 2.58, UP, 3.2, 4.6);
    P(c, function (c) { heartP(c, 20, 20, 8.4); }, BLOOD, { k: 1.5, lw: 2.1, sh: 'rgba(90,0,40,.42)', inn: function (c) { shine(c, 15.4, 15.6, 2.2, 1.3, -.6, .75); } });
  },
  espinhos: function (c) {
    for (var i = 0; i < 7; i++) (function (a) {
      P(c, function (c) { poly(c, [20 + Math.cos(a - .42) * 8.6, 20 + Math.sin(a - .42) * 8.6, 20 + Math.cos(a + .24) * 19.6, 20 + Math.sin(a + .24) * 19.6, 20 + Math.cos(a + .42) * 8.6, 20 + Math.sin(a + .42) * 8.6]); }, '#f6ecc4', { k: .7, lw: 1.8, sh: 'rgba(160,70,20,.5)' });
    })(i * TAU / 7 + .2);
    rope(c, function (c) { c.moveTo(30.4, 20); c.arc(20, 20, 9.6, 0, TAU); }, '#6fb04a', 4);
    c.beginPath(); c.arc(20, 20, 9.6, 0, TAU); c.setLineDash([1.2, 4.2]); c.strokeStyle = 'rgba(20,70,24,.6)'; c.lineWidth = 4; c.lineCap = 'butt'; c.stroke(); c.setLineDash([]); c.lineCap = 'round';
    c.beginPath(); c.arc(19.3, 19.2, 9.6, 3.4, 5); c.strokeStyle = 'rgba(235,255,180,.55)'; c.lineWidth = 1.1; c.stroke();
  },
  projetil: function (c) { arrow(c, 5.4, 30.6, 22.6, 4.4, 1.05); arrow(c, 9.4, 35.6, 37, 23, 1.05); arrow(c, 6.4, 34, 33.6, 9.4, 1.2, GOLD); },
  perfurar: function (c) {
    ln(c, [26.4, 9.6, 29, 6.4], 'rgba(255,246,207,.9)', 1.6); ln(c, [28.6, 25.6, 31.6, 28.4], 'rgba(255,246,207,.9)', 1.6);
    c.save(); c.translate(1.6, 25.4); c.rotate(-.26);
    bar(c, [20, 0, 32, 0], '#d9b77a', 1.9);
    P(c, function (c) { poly(c, [30.4, -4.6, 38.6, 0, 30.4, 4.6]); }, '#dcd8cc', { k: .7, lw: 1.7, sh: COLD });
    c.restore();
    P(c, function (c) { el(c, 18.4, 20.4, 7, 15.6, -.14); }, '#b9773c', { k: 1.9, lw: 2.3, inn: function (c) { c.beginPath(); c.ellipse(18.4, 20.4, 4.4, 12, -.14, 0, TAU); c.strokeStyle = '#6b3a1e'; c.lineWidth = 1.6; c.stroke(); dot(c, 17.6, 9.6, 1, GOLD); dot(c, 19.2, 31.2, 1, GOLD); } });
    c.save(); c.translate(1.6, 25.4); c.rotate(-.26);
    dot(c, 17.6, .2, 2.5, '#2a1208');
    bar(c, [2, 0, 17, 0], '#d9b77a', 1.9);
    P(c, function (c) { poly(c, [2.6, 0, -.4, -3.6, 5.6, -3.6, 8.4, 0, 5.6, 3.6, -.4, 3.6]); }, RED, { k: .6, lw: 1.5 });
    c.restore();
  },
  explosao: function (c) {
    odot(c, 5, 7, 1.6, '#ffd84a'); odot(c, 35.6, 9, 1.3, '#ffd84a'); odot(c, 34, 34.4, 1.6, '#ffd84a'); odot(c, 6, 33, 1.2, '#ffd84a');
    P(c, function (c) { burstP(c, 20, 20, 19, 10.6, 9, .25); }, '#e2401f', { k: 1.6, lw: 2.3, sh: 'rgba(100,0,20,.4)', inn: function (c) { c.beginPath(); burstP(c, 20, 20, 13.6, 7, 9, .6); c.fillStyle = '#ff9d2e'; c.fill(); c.beginPath(); burstP(c, 20, 20.4, 8.4, 4.2, 8, .1); c.fillStyle = '#fff0a0'; c.fill(); } });
  },
  escudo: function (c) {
    P(c, function (c) { el(c, 20, 20, 16.6, 16.6); }, '#5fb8ea', { k: 1.6, lw: 2.3, out: WOUT, sh: WSH, inn: function (c) { dot(c, 20, 20, 12.8, '#b4e6fa'); c.beginPath(); c.arc(20, 20, 14.7, 3.5, 4.7); c.strokeStyle = '#fff'; c.lineWidth = 1.8; c.lineCap = 'round'; c.stroke(); } });
    P(c, function (c) { shieldP(c, 20, 19.4, 6.6); }, GOLD, { k: 1.2, lw: 1.9, sh: GSH, inn: function (c) { ln(c, [20, 12.4, 20, 27], 'rgba(140,80,0,.55)', 1.2); } });
  },
  pocao: function (c) {
    P(c, function (c) { c.moveTo(16, 12.6); c.lineTo(16, 17.4); c.quadraticCurveTo(7.2, 21, 7.2, 28); c.quadraticCurveTo(7.2, 36.8, 20, 36.8); c.quadraticCurveTo(32.8, 36.8, 32.8, 28); c.quadraticCurveTo(32.8, 21, 24, 17.4); c.lineTo(24, 12.6); c.closePath(); }, '#d5e6df', {
      k: 1.9, lw: 2.3, sh: 'rgba(60,10,30,.35)', hi: 'rgba(255,255,255,.4)', inn: function (c) {
        c.fillStyle = '#d8323f'; c.fillRect(4, 23.4, 32, 16); c.fillStyle = '#f0787a'; c.beginPath(); c.ellipse(20, 23.4, 12.4, 2, 0, 0, TAU); c.fill();
        dot(c, 24.6, 29, 1.4, 'rgba(255,200,200,.7)'); dot(c, 21, 32.6, 1, 'rgba(255,200,200,.7)');
        shine(c, 12.4, 27.6, 1.6, 4.2, .35, .8);
      },
    });
    P(c, function (c) { rr(c, 14, 10, 12, 3.8, 1); }, '#b6c9c2', { k: .7, lw: 1.9 });
    P(c, function (c) { poly(c, [16.2, 3.6, 23.8, 3.6, 23.2, 10.2, 16.8, 10.2]); }, '#b9945e', { k: .9, lw: 1.9 });
  },
  companheiro: function (c) { paw(c, 20, 20.4, 15, '#e0a252', '#ffd9a0'); },
  item: function (c) {
    rope(c, function (c) { c.moveTo(14.4, 8.6); c.quadraticCurveTo(20, -1, 25.6, 8.6); }, LE2, 2.2);
    P(c, function (c) { c.moveTo(8.6, 13); c.quadraticCurveTo(8.6, 7.6, 14, 7.6); c.lineTo(26, 7.6); c.quadraticCurveTo(31.4, 7.6, 31.4, 13); c.lineTo(33.4, 31); c.quadraticCurveTo(33.6, 36.6, 28, 36.6); c.lineTo(12, 36.6); c.quadraticCurveTo(6.4, 36.6, 6.6, 31); c.closePath(); }, LE, {
      k: 2.2, lw: 2.3, inn: function (c) {
        c.beginPath(); rr(c, 11.6, 25.4, 16.8, 8.4, 2); c.fillStyle = LE2; c.fill(); c.strokeStyle = DK; c.lineWidth = 1.1; c.stroke();
        ln(c, [13.4, 27.6, 26.6, 27.6], CRM, .9, [1.6, 1.7]);
      },
    });
    P(c, function (c) { c.moveTo(8, 13); c.quadraticCurveTo(8.4, 7.2, 14, 7.2); c.lineTo(26, 7.2); c.quadraticCurveTo(31.6, 7.2, 32, 13); c.lineTo(32.2, 17.6); c.quadraticCurveTo(20, 24.6, 7.8, 17.6); c.closePath(); }, '#b46c36', { k: 1.5, lw: 2.1, inn: function (c) { c.beginPath(); c.moveTo(9.6, 16.6); c.quadraticCurveTo(20, 22.4, 30.4, 16.6); c.strokeStyle = CRM; c.lineWidth = .9; c.setLineDash([1.6, 1.7]); c.stroke(); c.setLineDash([]); } });
    P(c, function (c) { rr(c, 17.2, 18.2, 5.6, 6.6, 1); }, GOLD, { k: .6, lw: 1.8 }); dot(c, 20, 21.6, 1.1, DK);
  },
  material: function (c) {
    P(c, function (c) { poly(c, [4.6, 26.4, 10.8, 11.6, 26.4, 5.6, 35.2, 12, 31, 27.2, 15.4, 34.6]); }, '#b07a44', {
      k: 2, lw: 2.3, inn: function (c) {
        c.beginPath(); c.moveTo(4.6, 26.4); c.lineTo(10.8, 11.6); c.lineTo(15.4, 13.4); c.lineTo(10, 30); c.closePath(); c.fillStyle = '#5e3c22'; c.fill();
        [[16, 15.4, 13, 30], [20.6, 12, 18, 31.4], [26, 10, 24.4, 22], [30.6, 12.6, 28.4, 26]].forEach(function (q) { ln(c, q, 'rgba(70,40,18,.5)', 1.1); });
      },
    });
    P(c, function (c) { dropP(c, 25, 26.6, 5.8); }, AMB, { k: 1.4, lw: 2, sh: 'rgba(150,50,0,.4)', hi: 'rgba(255,250,200,.5)', inn: function (c) { shine(c, 22.8, 27.6, 1, 2.2, .3, .7); } });
    leaf(c, 9.8, 10.4, -1, 1); leaf(c, 9.8, 10.4, -2.3, .75, '#4fa64e');
  },
  elite: function (c) {
    [-1, 1].forEach(function (d) { P(c, function (c) { c.moveTo(20 + d * 6, 12); c.quadraticCurveTo(20 + d * 12, 10.6, 20 + d * 16.6, 1.6); c.quadraticCurveTo(20 + d * 20.6, 12.6, 20 + d * 11.4, 19); c.closePath(); }, '#4b4346', { k: 1, lw: 2.1, hi: 'rgba(255,255,255,.18)' }); });
    skull(c, 20, 22.6, 12.4, '#c6c0cc', '#ff3d8a');
    ln(c, [10.6, 17.4, 17, 19.6], '#2a2028', 1.9); ln(c, [29.4, 17.4, 23, 19.6], '#2a2028', 1.9);
  },
  execucao: function (c) {
    bar(c, [8.4, 36.4, 26.6, 6], '#9a6a3a', 2.8);
    ln(c, [10, 33.6, 12.6, 35.2], DK, 1.2); ln(c, [11.8, 30.6, 14.4, 32.2], DK, 1.2);
    c.save(); c.translate(24.4, 9.8); c.rotate(.54);
    P(c, function (c) { poly(c, [-1, -4.6, -7.6, -.6, -1, 3.6]); }, IRON, { k: .7, lw: 1.9 });
    P(c, function (c) { c.moveTo(.6, -6.6); c.quadraticCurveTo(7, -9.6, 12.6, -13.6); c.quadraticCurveTo(19.6, 0, 12.6, 13.6); c.quadraticCurveTo(7, 8.6, .6, 6.2); c.closePath(); }, STEEL, { k: 1.6, lw: 2.2, sh: COLD, inn: function (c) { c.beginPath(); c.moveTo(11, -11); c.quadraticCurveTo(16.6, 0, 11, 11); c.strokeStyle = 'rgba(110,120,145,.7)'; c.lineWidth = 1.2; c.stroke(); c.fillStyle = BLOOD; c.beginPath(); c.moveTo(12.6, 13.6); c.quadraticCurveTo(17, 7, 16.4, 1.6); c.lineTo(19, 3); c.lineTo(15, 15); c.closePath(); c.fill(); } });
    c.restore();
    P(c, function (c) { dropP(c, 30.4, 33, 3.3); }, BLOOD, { k: .8, lw: 1.8 });
  },
  furia: function (c) {
    c.save(); c.translate(11.6, 25); c.rotate(-.5); P(c, function (c) { flameP(c, 0, 0, 7); }, '#c92a1c', { k: 1, lw: 2.1 }); c.restore();
    c.save(); c.translate(29.6, 24.6); c.rotate(.55); c.scale(-1, 1); P(c, function (c) { flameP(c, 0, 0, 6.6); }, '#c92a1c', { k: 1, lw: 2.1 }); c.restore();
    P(c, function (c) { flameP(c, 20, 20.6, 12.4); }, '#e2401f', { k: 1.8, lw: 2.3, sh: 'rgba(100,0,20,.4)', inn: function (c) { c.beginPath(); flameP(c, 20.6, 24.6, 8.6); c.fillStyle = '#ff8a1e'; c.fill(); c.beginPath(); flameP(c, 21, 28.8, 5); c.fillStyle = '#ffe066'; c.fill(); } });
  },
  altar: function (c) {
    P(c, function (c) { flameP(c, 20, 9.6, 5.4); }, '#ff9d2e', { k: .8, lw: 1.9, inn: function (c) { c.beginPath(); flameP(c, 20.2, 12, 3); c.fillStyle = '#fff0a0'; c.fill(); } });
    P(c, function (c) { poly(c, [11.4, 21.6, 28.6, 21.6, 27.6, 31.4, 12.4, 31.4]); }, STONE, { k: 1.4, lw: 2.1, sh: COLD, inn: function (c) { c.beginPath(); c.arc(20, 26.6, 2.9, -1, 4.2); c.strokeStyle = '#9ff0c8'; c.lineWidth = 1.5; c.lineCap = 'round'; c.stroke(); dot(c, 20, 26.6, .8, '#9ff0c8'); } });
    P(c, function (c) { poly(c, [5.6, 31, 34.4, 31, 36.4, 36.8, 3.6, 36.8]); }, '#8a887e', { k: 1.2, lw: 2.1, sh: COLD, inn: function (c) { c.fillStyle = 'rgba(86,130,70,.9)'; c.beginPath(); c.ellipse(8.6, 31, 4.4, 2, 0, 0, TAU); c.fill(); } });
    P(c, function (c) { poly(c, [4.6, 16, 35.4, 16, 33.4, 22, 6.6, 22]); }, '#a19e92', { k: 1.2, lw: 2.1, sh: COLD, inn: function (c) { c.fillStyle = 'rgba(86,130,70,.9)'; c.beginPath(); c.ellipse(30.6, 16.4, 4.6, 2, 0, 0, TAU); c.fill(); } });
  },
  relogio: function (c) {
    P(c, function (c) { rr(c, 17.2, 1.8, 5.6, 6, 1.2); }, GOLD2, { k: .7, lw: 1.9 });
    c.save(); c.translate(30.8, 9.4); c.rotate(.75); P(c, function (c) { rr(c, -2, -3, 4, 5, 1); }, GOLD2, { k: .5, lw: 1.8 }); c.restore();
    P(c, function (c) { el(c, 20, 22, 14.6, 14.6); }, GOLD, {
      k: 2, lw: 2.3, sh: GSH, inn: function (c) {
        dot(c, 20, 22, 11, '#8a5a12'); dot(c, 20, 22, 10.2, '#f8efd6');
        for (var i = 0; i < 4; i++) ln(c, [20 + Math.cos(i * 1.5708) * 7.4, 22 + Math.sin(i * 1.5708) * 7.4, 20 + Math.cos(i * 1.5708) * 9.2, 22 + Math.sin(i * 1.5708) * 9.2], '#6b3a10', 1.4);
        ln(c, [20, 22, 20, 14.6], '#3a2014', 2.1); ln(c, [20, 22, 25.4, 25], '#3a2014', 2.1); dot(c, 20, 22, 1.6, RED);
      },
    });
  },
  tomo: function (c) {
    c.save(); c.translate(20, 20); c.rotate(-.12);
    P(c, function (c) { rr(c, -10, -13.6, 23.4, 30.6, 1.6); }, '#f3e8c8', { k: 1, lw: 2.1, inn: function (c) { [11.6, 13.4, 15].forEach(function (y) { ln(c, [-8, y, 13, y], 'rgba(120,90,50,.55)', .9); }); ln(c, [11.4, -12, 11.4, 16], 'rgba(120,90,50,.45)', .9); } });
    P(c, function (c) { rr(c, -13.6, -16.6, 24, 30, 2); }, '#b0402e', {
      k: 2, lw: 2.3, sh: 'rgba(60,0,30,.4)', inn: function (c) {
        c.fillStyle = '#7a2a22'; c.fillRect(-14, -17, 5, 31); ln(c, [-9, -17, -9, 14], 'rgba(40,10,10,.5)', 1);
        c.fillStyle = GOLD; c.beginPath(); c.moveTo(10.6, -17); c.lineTo(10.6, -10.4); c.lineTo(4, -17); c.closePath(); c.fill(); c.beginPath(); c.moveTo(10.6, 13.6); c.lineTo(10.6, 7); c.lineTo(4, 13.6); c.closePath(); c.fill();
      },
    });
    odot(c, .8, -1.6, 4.6, GOLD); dot(c, .8, -1.6, 2.2, ESP); dot(c, .1, -2.4, .8, '#fff');
    c.restore();
  },
  bau: function (c) {
    P(c, function (c) { poly(c, [5, 19, 35, 19, 33.8, 35.6, 6.2, 35.6]); }, LE, { k: 1.8, lw: 2.3, inn: function (c) { [15.4, 24.6].forEach(function (x) { ln(c, [x, 19, x, 36], 'rgba(58,32,20,.5)', 1.1); }); c.fillStyle = GOLD; c.fillRect(8.4, 18, 3.8, 19); c.fillRect(27.8, 18, 3.8, 19); } });
    P(c, function (c) { c.moveTo(4, 20); c.quadraticCurveTo(4, 5.6, 14, 5.6); c.lineTo(26, 5.6); c.quadraticCurveTo(36, 5.6, 36, 20); c.closePath(); }, '#b46c36', {
      k: 2, lw: 2.3, inn: function (c) { ln(c, [5, 12.6, 35, 12.6], 'rgba(58,32,20,.45)', 1.1); c.fillStyle = GOLD; c.fillRect(8.4, 4, 3.8, 17); c.fillRect(27.8, 4, 3.8, 17); c.fillStyle = 'rgba(58,32,20,.7)'; c.fillRect(3, 18.4, 34, 1.8); shine(c, 18, 8.4, 4.6, 1.1, 0, .35); },
    });
    P(c, function (c) { poly(c, [16.6, 15.4, 23.4, 15.4, 23.4, 23.6, 20, 26.4, 16.6, 23.6]); }, GOLD, { k: .8, lw: 1.9, sh: GSH }); dot(c, 20, 19.6, 1.4, DK); ln(c, [20, 19.6, 20, 22.6], DK, 1.2);
  },

  /* ===== abas do acampamento ===== */
  mapa: function (c) {
    P(c, function (c) { c.moveTo(7.6, 8.6); c.quadraticCurveTo(14, 11, 20, 8); c.quadraticCurveTo(26, 5.4, 32.4, 7.6); c.lineTo(32.4, 31.4); c.quadraticCurveTo(26, 29, 20, 32); c.quadraticCurveTo(14, 34.6, 7.6, 32.4); c.closePath(); }, '#ecd9a6', {
      k: 1.8, lw: 2.1, sh: 'rgba(120,70,20,.35)', inn: function (c) {
        c.fillStyle = '#7fb85a'; c.beginPath(); c.ellipse(12.6, 14.6, 4.6, 3.4, .3, 0, TAU); c.fill(); c.fillStyle = '#6fb4d8'; c.beginPath(); c.ellipse(28.6, 27.6, 5, 3, -.3, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(11.4, 27.4); c.quadraticCurveTo(15, 19, 20.6, 22); c.quadraticCurveTo(25, 24, 26.4, 16.4); c.strokeStyle = '#7a4424'; c.lineWidth = 1.5; c.setLineDash([2.2, 2.2]); c.stroke(); c.setLineDash([]);
        ln(c, [24.4, 11, 29.4, 16], RED, 2); ln(c, [29.4, 11, 24.4, 16], RED, 2);
      },
    });
    [[7.2, .5], [32.8, -.4]].forEach(function (q) { P(c, function (c) { cap(c, q[0], 8.4 + q[1], q[0], 32 + q[1], 3); }, '#d2b983', { k: 1, lw: 2.1, inn: function (c) { ln(c, [q[0] + 1.2, 9, q[0] + 1.2, 32], 'rgba(120,70,20,.45)', .9); } }); });
  },
  heroi: function (c) {
    P(c, function (c) { c.moveTo(3.6, 38.6); c.quadraticCurveTo(4.6, 28, 14, 26.6); c.lineTo(26, 26.6); c.quadraticCurveTo(35.4, 28, 36.4, 38.6); c.closePath(); }, LE, { k: 1.8, lw: 2.3, inn: function (c) { ln(c, [20, 30, 20, 39], DK, 1.2); c.fillStyle = '#4a2614'; c.beginPath(); c.moveTo(8, 28.6); c.lineTo(12, 27); c.lineTo(22, 39); c.lineTo(17, 39); c.closePath(); c.fill(); } });
    P(c, function (c) { c.moveTo(11, 26.2); c.quadraticCurveTo(20, 33.6, 29, 26.2); c.lineTo(27.6, 31); c.quadraticCurveTo(20, 36.6, 12.4, 31); c.closePath(); }, RED, { k: 1, lw: 1.9 });
    P(c, function (c) { el(c, 20, 20, 9.4, 9.2); }, SK, { k: 1.8, lw: 2.2, inn: function (c) { dot(c, 25.4, 23.6, 2.2, 'rgba(214,80,60,.3)'); } });
    [16.4, 23.6].forEach(function (x) { c.beginPath(); c.ellipse(x, 20.6, 1.5, 2.1, 0, 0, TAU); c.fillStyle = '#1c0f0a'; c.fill(); dot(c, x + .5, 19.8, .6, '#fff'); });
    c.beginPath(); c.moveTo(17.4, 25); c.quadraticCurveTo(20, 26.8, 22.6, 25); c.strokeStyle = '#5a2f1a'; c.lineWidth = 1.2; c.stroke();
    P(c, function (c) { c.moveTo(1.6, 17); c.quadraticCurveTo(20, -13.6, 38.4, 17); c.quadraticCurveTo(20, 8.6, 1.6, 17); c.closePath(); }, '#8f5028', {
      k: 2, lw: 2.3, inn: function (c) {
        c.beginPath(); c.moveTo(4.4, 15); c.quadraticCurveTo(20, -9.6, 35.6, 15); c.strokeStyle = CRM; c.lineWidth = 1; c.setLineDash([1.9, 1.9]); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.moveTo(3.4, 16.4); c.quadraticCurveTo(20, 7.4, 36.6, 16.4); c.strokeStyle = '#5a2f18'; c.lineWidth = 2.6; c.stroke();
      },
    });
    c.beginPath(); burstP(c, 20, 7.6, 3.9, 1.75, 5); c.fillStyle = GOLD; c.fill(); c.strokeStyle = OUT; c.lineWidth = .9; c.stroke();
    odot(c, 11.4, 11, 1.5, GOLD); odot(c, 28.6, 11, 1.5, GOLD);
  },
  ferreiro: function (c) {
    anvil(c, 20.6, 28, 1.08);
    hammer(c, 7.6, 20.4, 1.02, .98);
    spark(c, 31.6, 13.4, 3, '#ffd84a', true);
  },
  talentos: function (c) {
    var N = [[20, 5.4, FOR], [34, 15.4, VIT], [29.4, 32.6, ESP], [10.6, 32.6, INT], [6, 15.4, SOR]];
    N.forEach(function (q, i) { var n = N[(i + 1) % 5]; bar(c, [q[0], q[1], n[0], n[1]], '#cfe6d6', 1.1); bar(c, [20, 20.6, q[0], q[1]], '#cfe6d6', 1.1); });
    N.forEach(function (q) { odot(c, q[0], q[1], 3.4, q[2]); dot(c, q[0] - .9, q[1] - .9, 1, 'rgba(255,255,255,.7)'); });
    P(c, function (c) { burstP(c, 20, 20.6, 7.4, 3.3, 5); }, GOLD, { k: .9, lw: 1.9, sh: GSH });
  },
  feiticos: function (c) {
    P(c, function (c) { poly(c, [2.6, 17, 20, 20.6, 37.4, 17, 37.4, 34.6, 20, 38.2, 2.6, 34.6]); }, LE2, { k: 1.2, lw: 2.2 });
    P(c, function (c) { c.moveTo(20, 19.6); c.quadraticCurveTo(12, 14, 4.8, 16); c.lineTo(4.8, 32.4); c.quadraticCurveTo(12, 30.6, 20, 35.6); c.closePath(); }, '#f8efd6', { k: 1.2, lw: 2, sh: 'rgba(120,70,20,.3)', inn: function (c) { [21, 24.6, 28.2].forEach(function (y) { c.beginPath(); c.moveTo(7.4, y - 2); c.quadraticCurveTo(12, y - 2.6, 17.6, y + 1); c.strokeStyle = 'rgba(120,90,50,.6)'; c.lineWidth = 1; c.stroke(); }); } });
    P(c, function (c) { c.moveTo(20, 19.6); c.quadraticCurveTo(28, 14, 35.2, 16); c.lineTo(35.2, 32.4); c.quadraticCurveTo(28, 30.6, 20, 35.6); c.closePath(); }, '#ecdfba', { k: 1.2, lw: 2, sh: 'rgba(120,70,20,.3)', inn: function (c) { [21, 24.6, 28.2].forEach(function (y) { c.beginPath(); c.moveTo(32.6, y - 2); c.quadraticCurveTo(28, y - 2.6, 22.4, y + 1); c.strokeStyle = 'rgba(120,90,50,.6)'; c.lineWidth = 1; c.stroke(); }); } });
    spark(c, 20, 8.6, 7.6, '#8fe3ff', WOUT); spark(c, 20, 8.6, 3.4, '#fff'); spark(c, 31.6, 7, 2.8, '#e6f6ff', WOUT); spark(c, 8.6, 6.4, 2.4, '#e6f6ff', WOUT);
  },
  companheiros: function (c) {
    paw(c, 27.6, 11, 7.4, '#ffd9a0');
    paw(c, 15.6, 22.6, 12.4, '#e0a252', '#ffd9a0');
  },
  opcoes: function (c) {
    P(c, function (c) { gearP(c, 20, 20, 17.2, 12.6, 8, 5.4); }, '#d6cfc0', { k: 1.7, lw: 2.3, sh: COLD, inn: function (c) { c.beginPath(); c.arc(20, 20, 9, 0, TAU); c.strokeStyle = 'rgba(70,60,60,.45)'; c.lineWidth = 1.3; c.stroke(); } });
    c.beginPath(); c.arc(20, 20, 5.4, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 2.1 * Q; c.stroke();
  },

  /* ===== ferreiro ===== */
  aprimorar: function (c) {
    hammer(c, 6.4, 36, .52, 1.12);
    P(c, function (c) { arrowP(c, 31.4, 37, 31.4, 15.4, 3.1, 7.2, 9); }, UP, { k: 1.2, lw: 2.1, sh: LEAFSH });
  },
  fundir: function (c) {
    [[8, 8.4, 19.4, 24], [20, 6, 20, 22], [32, 8.4, 20.6, 24]].forEach(function (q) { ln(c, q, 'rgba(255,246,207,.85)', 1.6, [1.6, 3]); });
    gem(c, 7.6, 8.6, 5.4, '#b9c0c9'); gem(c, 32.4, 8.6, 5.4, '#b9c0c9'); gem(c, 20, 6.6, 5.4, '#b9c0c9');
    P(c, function (c) { burstP(c, 20, 27, 12.6, 9, 8, .39); }, '#ffb52e', { k: 0, lw: 1.9 });
    gem(c, 20, 27, 9.6, GOLD, GSH);
    spark(c, 31.6, 21, 2.8, '#fff6cf', true);
  },
  encantar: function (c) {
    P(c, function (c) { poly(c, [7.6, 31, 6, 19.6, 12.6, 9.6, 24.6, 7, 33.4, 15, 33, 29.6, 22, 36.4]); }, '#7f7c8a', {
      k: 2, lw: 2.3, sh: 'rgba(30,20,60,.42)', inn: function (c) {
        ln(c, [12.6, 9.6, 16, 16, 6, 19.6], 'rgba(40,30,60,.4)', 1); ln(c, [24.6, 7, 16, 16], 'rgba(40,30,60,.4)', 1); ln(c, [33, 29.6, 26, 30, 22, 36.4], 'rgba(40,30,60,.4)', 1);
        c.beginPath(); c.arc(20.6, 22.4, 6.2, -1.9, 3.1); c.arc(19.6, 22.4, 3, 3.1, 7.6); c.strokeStyle = '#3a2a66'; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke(); c.strokeStyle = '#d9c2ff'; c.lineWidth = 1.7; c.stroke();
      },
    });
    spark(c, 31.6, 7, 4.4, '#e9dcff', '#2a1a55'); spark(c, 5.6, 9.6, 2.8, '#e9dcff', '#2a1a55'); spark(c, 35, 34, 2.4, '#e9dcff', '#2a1a55');
  },
  reforjar: function (c) {
    anvil(c, 20.6, 29, 1);
    arcArrow(c, 20, 10.4, 6.9, 3.5, 5.6, '#ffb52e', 2.6, 3.7); arcArrow(c, 20, 10.4, 6.9, .36, 2.46, '#ffb52e', 2.6, 3.7);
  },
  vender: function (c) {
    coin(c, 15.4, 24.4, 12.4);
    P(c, function (c) { arrowP(c, 21, 19.6, 37.4, 3.4, 2.9, 6.8, 9.4); }, UP, { k: 1.2, lw: 2.1, sh: LEAFSH });
  },
  desmontar: function (c) {
    P(c, function (c) { burstP(c, 20.4, 20.6, 9.6, 4.6, 7, .3); }, '#ffd84a', { k: 0, lw: 1.8 });
    c.save(); c.translate(7.6, 34.4); c.rotate(.62);
    P(c, function (c) { c.moveTo(-3.4, -2); c.lineTo(-4.2, -13.6); c.lineTo(-1.2, -10.6); c.lineTo(1.4, -15); c.lineTo(4.6, -11.4); c.lineTo(3.7, -2); c.closePath(); }, STEEL, { k: 1.3, lw: 2, sh: COLD, inn: function (c) { ln(c, [-1, -4, -1.4, -10], 'rgba(110,120,145,.7)', 1.1); } });
    P(c, function (c) { poly(c, [-6.8, -3.9, 7.2, -3.9, 7.2, -.5, -6.8, -.5]); }, GOLD, { k: .6, lw: 1.7 });
    P(c, function (c) { cap(c, 0, .6, 0, 7, 2.9); }, '#5a3218', { k: 1, lw: 1.9 });
    c.restore();
    c.save(); c.translate(27.4, 13.4); c.rotate(1.02);
    P(c, function (c) { c.moveTo(-4.4, 7.6); c.lineTo(-1.2, 10.6); c.lineTo(1.4, 6.2); c.lineTo(4.6, 9.8); c.lineTo(6.4, -1); c.quadraticCurveTo(7.6, -7.6, 2.6, -12.4); c.quadraticCurveTo(-2.8, -8.4, -4.4, -2); c.closePath(); }, STEEL, { k: 1.3, lw: 2, sh: COLD, inn: function (c) { ln(c, [4.4, -1, 5.4, -7], 'rgba(255,255,255,.7)', 1.1); ln(c, [-1.2, 6, -1.6, -3], 'rgba(110,120,145,.7)', 1.1); } });
    c.restore();
    P(c, function (c) { poly(c, [25.6, 28.4, 31.6, 29.6, 27.6, 34]); }, STEEL, { k: .5, lw: 1.7, sh: COLD }); P(c, function (c) { poly(c, [10, 12, 15.4, 9.6, 14, 15.4]); }, STEEL, { k: .5, lw: 1.7, sh: COLD });
  },

  /* ===== diversos ===== */
  cadeado: function (c) {
    rope(c, function (c) { c.moveTo(12.6, 20); c.lineTo(12.6, 12.6); c.quadraticCurveTo(12.6, 4.6, 20, 4.6); c.quadraticCurveTo(27.4, 4.6, 27.4, 12.6); c.lineTo(27.4, 20); }, '#c9c5bb', 3.3);
    P(c, function (c) { rr(c, 7, 17.4, 26, 19.4, 3.6); }, GOLD, { k: 2, lw: 2.3, sh: GSH, inn: function (c) { c.fillStyle = 'rgba(140,80,0,.4)'; c.fillRect(6, 31.6, 28, 1.4); shine(c, 11.6, 21.4, 2.6, 1.2, -.3, .6); } });
    dot(c, 20, 25, 3, DK); c.beginPath(); c.moveTo(18.6, 26); c.lineTo(21.4, 26); c.lineTo(22.2, 31.6); c.lineTo(17.8, 31.6); c.closePath(); c.fillStyle = DK; c.fill();
  },
  estrela: function (c) {
    P(c, function (c) { burstP(c, 20, 21.4, 17.4, 7.8, 5); }, GOLD, { k: 2.2, lw: 2.3, sh: GSH, hi: 'rgba(255,255,220,.5)', inn: function (c) { c.beginPath(); burstP(c, 20, 21.4, 8.6, 3.9, 5); c.fillStyle = '#fff3c4'; c.fill(); } });
  },
  caveira: function (c) { skull(c, 20, 19.6, 13.6, BONE); },
  coroa: function (c) {
    P(c, function (c) { poly(c, [5.6, 31, 3.6, 11.4, 12.6, 19.4, 20, 6.6, 27.4, 19.4, 36.4, 11.4, 34.4, 31]); }, GOLD, { k: 2, lw: 2.3, sh: GSH, hi: 'rgba(255,255,220,.45)' });
    P(c, function (c) { rr(c, 4.6, 27.4, 30.8, 7, 1.8); }, GOLD2, { k: 1, lw: 2.2, sh: GSH, inn: function (c) { ln(c, [6, 28.9, 34, 28.9], 'rgba(255,240,180,.6)', 1); } });
    odot(c, 20, 30.9, 2.3, BLOOD); odot(c, 10.6, 30.9, 1.6, INT); odot(c, 29.4, 30.9, 1.6, INT);
    odot(c, 3.6, 10.6, 2, GOLD); odot(c, 20, 5.6, 2.2, GOLD); odot(c, 36.4, 10.6, 2, GOLD);
  },
  supremo: function (c) {
    P(c, function (c) { burstP(c, 20, 19.6, 19.4, 13, 12, .13); }, GOLD, { k: 0, lw: 2.1, inn: function (c) { dot(c, 20, 19.6, 13, '#fff3c4'); } });
    P(c, function (c) { c.moveTo(20, 6.4); c.bezierCurveTo(27.6, 6.4, 29.6, 13.6, 28.8, 19); c.bezierCurveTo(28.2, 24, 30.4, 28.4, 33, 31.6); c.bezierCurveTo(28.6, 32.6, 26.6, 30.4, 24.6, 33); c.bezierCurveTo(22.6, 35.6, 20.4, 32, 18, 34); c.bezierCurveTo(15, 36.2, 12.4, 32.4, 7.6, 32.6); c.bezierCurveTo(10.6, 28.6, 11.8, 24, 11.2, 19); c.bezierCurveTo(10.4, 13, 13, 6.4, 20, 6.4); c.closePath(); }, '#1f5a48', { k: 1.6, lw: 2.2, sh: 'rgba(0,20,30,.45)', hi: 'rgba(160,255,210,.3)' });
    [16.4, 23.6].forEach(function (x) { c.beginPath(); c.ellipse(x, 16.6, 2, 2.7, 0, 0, TAU); c.fillStyle = '#eafff2'; c.fill(); });
  },
  seta: function (c) { P(c, function (c) { arrowP(c, 4.6, 20, 36.6, 20, 5, 12.4, 15); }, CRM, { k: 1.6, lw: 2.3 }); },
  fechar: function (c) { bar(c, [9.4, 9.4, 30.6, 30.6], CRM, 5.2); bar(c, [30.6, 9.4, 9.4, 30.6], CRM, 5.2); ln(c, [9.4, 9.4, 30.6, 30.6], CRM, 5.2); },
  som: function (c) {
    speaker(c);
    rope(c, function (c) { c.arc(20, 20, 7.4, -.8, .8); }, CRM, 2.5); rope(c, function (c) { c.arc(20, 20, 13.6, -.85, .85); }, CRM, 2.5);
  },
  mudo: function (c) { speaker(c); bar(c, [26, 14.6, 36, 25.4], '#f0604a', 3.3); bar(c, [36, 14.6, 26, 25.4], '#f0604a', 3.3); ln(c, [26, 14.6, 36, 25.4], '#f0604a', 3.3); },
  mais: function (c) { bar(c, [20, 6.6, 20, 33.4], UP, 6); bar(c, [6.6, 20, 33.4, 20], UP, 6); ln(c, [20, 6.6, 20, 33.4], UP, 6); },
  menos: function (c) { bar(c, [6.6, 20, 33.4, 20], '#f0604a', 6); },
  check: function (c) { bar(c, [6.6, 21.4, 15.6, 30.6, 33.4, 9.6], UP, 6); },
  novo: function (c) {
    P(c, function (c) { burstP(c, 20, 20, 19, 13.4, 10, .1); }, '#e2401f', { k: 1.6, lw: 2.3, sh: 'rgba(100,0,20,.4)', inn: function (c) { dot(c, 20, 20, 11.6, '#ff8a1e'); } });
    P(c, function (c) { c.moveTo(16.8, 9); c.quadraticCurveTo(20, 7.4, 23.2, 9); c.lineTo(21.6, 22.6); c.lineTo(18.4, 22.6); c.closePath(); }, '#fff6cf', { k: .7, lw: 1.9 });
    odot(c, 20, 28.2, 2.4, '#fff6cf');
  },
  gaiola: function (c) {
    dot(c, 20, 23.6, 5.6, 'rgba(159,240,200,.35)'); spark(c, 20, 23.6, 5, '#d2f8e2'); dot(c, 20, 23.6, 2, '#fff');
    rope(c, function (c) { c.moveTo(22.6, 4.6); c.arc(20, 4.6, 2.6, 0, TAU); }, GOLD, 1.5);
    [[7, 8.6], [33, 8.6], [13.6, 9.2], [26.4, 9.2]].forEach(function (q) { rope(c, function (c) { c.moveTo(q[0], 32); c.lineTo(q[0], 19); c.quadraticCurveTo(q[0], q[1] - 1, 20, 7.6); }, '#d9b25a', 1.6); });
    bar(c, [20, 7.6, 20, 32], '#d9b25a', 1.6);
    P(c, function (c) { rr(c, 4.6, 30.6, 30.8, 6, 2); }, GOLD2, { k: 1, lw: 2.2, sh: GSH, inn: function (c) { ln(c, [7, 32.2, 33, 32.2], 'rgba(255,240,180,.6)', 1); } });
    P(c, function (c) { rr(c, 5.6, 17.6, 28.8, 3.2, 1.4); }, GOLD2, { k: .5, lw: 1.8 });
  },

  /* ===== materiais ===== */
  resina: function (c) {
    P(c, function (c) { dropP(c, 18.6, 19.6, 12.8); }, AMB, {
      k: 2.3, lw: 2.3, sh: 'rgba(150,50,0,.42)', hi: 'rgba(255,250,200,.5)', inn: function (c) {
        dot(c, 19, 25, 6.4, 'rgba(255,220,120,.55)');
        c.fillStyle = '#9a4a08'; c.beginPath(); c.moveTo(16, 28.4); c.quadraticCurveTo(18, 21, 24, 21.6); c.quadraticCurveTo(22.6, 28, 16, 28.4); c.closePath(); c.fill();
        shine(c, 12.8, 21.6, 1.6, 4, .4, .8); dot(c, 15.4, 14.6, 1, 'rgba(255,255,255,.8)');
      },
    });
    P(c, function (c) { dropP(c, 32.4, 30.6, 3.6); }, AMB, { k: .8, lw: 1.8, sh: 'rgba(150,50,0,.42)' });
  },
  po: function (c) {
    P(c, function (c) { c.moveTo(3.6, 32); c.quadraticCurveTo(6.6, 26, 12.4, 24.2); c.quadraticCurveTo(16.4, 15.6, 21, 15); c.quadraticCurveTo(25.6, 15.8, 28.6, 23.4); c.quadraticCurveTo(34, 26, 36.4, 32); c.quadraticCurveTo(20, 37.8, 3.6, 32); c.closePath(); }, '#9c98a5', {
      k: 2.1, lw: 2.3, sh: 'rgba(30,20,50,.4)', inn: function (c) {
        [[12, 29, 1.1], [17, 24, 1.2], [24, 27, 1.3], [28.6, 30.6, 1.1], [20.6, 31.6, 1.1], [21.6, 20, 1], [9, 31.6, .9], [15.6, 32.4, .9]].forEach(function (q, n) { dot(c, q[0], q[1], q[2], n % 2 ? 'rgba(50,44,60,.5)' : 'rgba(255,255,255,.6)'); });
      },
    });
    spark(c, 21.4, 8.4, 5.4, '#fff', '#3a2a44'); spark(c, 8.6, 16.6, 3.2, '#ffe0f0', '#3a2a44'); spark(c, 32.6, 15.4, 3.6, '#ffe0f0', '#3a2a44');
  },
  lagrima: function (c) {
    P(c, function (c) { dropP(c, 19.6, 19.8, 12.8); }, '#7fe6f6', {
      k: 2.2, lw: 2.3, out: WOUT, sh: 'rgba(20,70,160,.4)', hi: 'rgba(255,255,255,.55)', inn: function (c) {
        c.beginPath(); c.moveTo(19.6, 5); c.lineTo(26, 23); c.lineTo(19.6, 35.6); c.lineTo(13.2, 23); c.closePath(); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill();
        ln(c, [13.2, 23, 26, 23], 'rgba(30,90,170,.45)', 1); ln(c, [8, 24.6, 13.2, 23], 'rgba(30,90,170,.35)', 1); ln(c, [31, 24.6, 26, 23], 'rgba(30,90,170,.35)', 1);
        shine(c, 16.2, 16.6, 1.3, 3.4, .35, .9);
      },
    });
    spark(c, 32.6, 9, 4.6, '#fff', WOUT); spark(c, 7, 12.6, 2.6, '#eaffff', WOUT);
  },

  /* ===== elementos ===== */
  natureza: function (c) {
    bar(c, [4, 36.4, 10.6, 29.6], '#4f8f3c', 2.2);
    P(c, function (c) { c.moveTo(9.4, 30.8); c.bezierCurveTo(2.6, 13.6, 17.6, 3.6, 36, 4.4); c.bezierCurveTo(37.6, 22, 27.4, 37.6, 9.4, 30.8); c.closePath(); }, GR, {
      k: 2.2, lw: 2.3, sh: LEAFSH, hi: 'rgba(240,255,190,.45)', inn: function (c) {
        c.beginPath(); c.moveTo(9.4, 30.8); c.quadraticCurveTo(18, 17, 34, 6.4); c.strokeStyle = GR2; c.lineWidth = 1.7; c.stroke();
        [[14.6, 23.6, 12.6, 15], [20.4, 17.6, 19.6, 9.6], [16.4, 21.6, 25.4, 25.6], [22.6, 15.6, 31, 17.6]].forEach(function (q) { ln(c, q, GR2, 1.1); });
      },
    });
  },
  agua: function (c) {
    P(c, function (c) { dropP(c, 20, 12.6, 8.6); }, WAT, { k: 1.7, lw: 2.2, out: WOUT, sh: WSH, hi: 'rgba(210,240,255,.4)', inn: function (c) { shine(c, 16.6, 14.6, 1.3, 3, .4, .8); } });
    P(c, function (c) { c.moveTo(2, 30.6); c.bezierCurveTo(6, 23.6, 10.6, 23.6, 14, 28.6); c.bezierCurveTo(17.4, 33, 22.6, 33, 26, 28.6); c.bezierCurveTo(29.4, 23.6, 34, 23.6, 38, 30.6); c.lineTo(38, 34); c.quadraticCurveTo(38, 37.4, 34.6, 37.4); c.lineTo(5.4, 37.4); c.quadraticCurveTo(2, 37.4, 2, 34); c.closePath(); }, WATD, {
      k: 1.4, lw: 2.2, out: WOUT, sh: 'rgba(8,20,80,.4)', inn: function (c) { c.beginPath(); c.moveTo(2, 31.6); c.bezierCurveTo(6, 25.2, 10.6, 25.2, 14, 30); c.bezierCurveTo(17.4, 34.4, 22.6, 34.4, 26, 30); c.bezierCurveTo(29.4, 25.2, 34, 25.2, 38, 31.6); c.strokeStyle = WAT2; c.lineWidth = 1.7; c.stroke(); },
    });
  },

  /* ===== feitiços ===== */
  dardo: function (c) {
    [[13.6, 9.6, .78, '#8fd05a'], [28.4, 24, .78, '#8fd05a'], [23, 15, 1.08, '#a9e06a']].forEach(function (q) {
      c.save(); c.translate(q[0], q[1]); c.rotate(-.76); c.scale(q[2], q[2]);
      ln(c, [-20, -1.4, -13.4, -1.4], 'rgba(200,255,150,.85)', 1.6); ln(c, [-18, 2.4, -12.6, 2.4], 'rgba(200,255,150,.6)', 1.3);
      P(c, function (c) { c.moveTo(-11, 0); c.quadraticCurveTo(-8, -5.4, 0, -3.8); c.lineTo(14, 0); c.lineTo(0, 3.8); c.quadraticCurveTo(-8, 5.4, -11, 0); c.closePath(); }, q[3], { k: 1, lw: 2 / q[2], sh: LEAFSH, inn: function (c) { c.fillStyle = '#8a3d22'; c.fillRect(6, -4, 10, 8); ln(c, [-8, -.6, 4, -.6], 'rgba(240,255,190,.6)', 1); } });
      c.restore();
    });
  },
  sementes: function (c) {
    P(c, function (c) { burstP(c, 20, 20.6, 13.4, 6.6, 8, .2); }, '#ff9d2e', { k: 0, lw: 2, inn: function (c) { c.beginPath(); burstP(c, 20, 20.6, 8, 4, 8, .2); c.fillStyle = '#fff0a0'; c.fill(); } });
    [[9.4, 29.4, -2.3], [21.4, 7.6, .1], [31.6, 27.6, 2.1]].forEach(function (q) {
      c.save(); c.translate(q[0], q[1]); c.rotate(q[2]);
      P(c, function (c) { c.moveTo(0, -6.6); c.bezierCurveTo(5.8, -3.2, 5, 6, 0, 6.8); c.bezierCurveTo(-5, 6, -5.8, -3.2, 0, -6.6); c.closePath(); }, '#b07a44', { k: 1.2, lw: 2, inn: function (c) { ln(c, [0, -4.6, 0, 5.2], 'rgba(70,40,18,.6)', 1.1); shine(c, -2, -1, 1, 2.4, 0, .45); } });
      c.restore();
    });
    leaf(c, 22.6, 2.6, -2.5, .62);
  },
  cipo: function (c) {
    function lp1(c) { c.moveTo(12.4, 22.6); c.bezierCurveTo(6, 10, 22, 2.6, 31, 9); c.bezierCurveTo(38.6, 15.4, 27, 27.6, 12.4, 22.6); }
    function tail(c) { c.moveTo(12.4, 22.6); c.bezierCurveTo(5, 27, 9.6, 35.4, 18, 33); c.bezierCurveTo(24, 31.2, 30.6, 35.6, 32.6, 31.4); c.bezierCurveTo(33.6, 28.4, 29.6, 27.4, 29.2, 30); }
    [lp1, tail].forEach(function (f) {
      rope(c, f, '#62a84c', 3.3); c.beginPath(); f(c); c.lineCap = 'butt'; c.setLineDash([.9, 3.4]); c.strokeStyle = 'rgba(40,96,40,.6)'; c.lineWidth = 3.3; c.stroke(); c.setLineDash([]); c.lineCap = 'round';
      c.save(); c.translate(-.7, -.8); c.beginPath(); f(c); c.strokeStyle = 'rgba(235,255,180,.4)'; c.lineWidth = .9; c.stroke(); c.restore();
    });
    P(c, function (c) { el(c, 12.4, 22.6, 3.9, 3.4, .5); }, '#4f9440', { k: .9, lw: 1.9, sh: LEAFSH });
    leaf(c, 30.6, 8.6, -.9, 1); leaf(c, 20.6, 32.4, .9, .9); leaf(c, 8.6, 13, -2.6, .9, '#4fa64e'); leaf(c, 22, 5.6, -1.9, .75, '#4fa64e');
  },
  casca: function (c) {
    P(c, function (c) { c.moveTo(7, 8.4); c.quadraticCurveTo(12.6, 5.4, 16.4, 7.4); c.lineTo(20, 4); c.lineTo(23.6, 7.4); c.quadraticCurveTo(27.4, 5.4, 33, 8.4); c.lineTo(33.2, 21); c.quadraticCurveTo(32, 31.8, 20, 37.2); c.quadraticCurveTo(8, 31.8, 6.8, 21); c.closePath(); }, '#946238', {
      k: 2.4, lw: 2.3, inn: function (c) {
        [[11.6, 7, 12.6, 18, 10.6, 27], [16.4, 7.6, 15, 20, 17, 33], [23, 7.6, 24.6, 19, 22.6, 34], [28.4, 7, 27.4, 17, 29.4, 27]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[2], q[3], q[4], q[5]); c.strokeStyle = 'rgba(50,26,12,.6)'; c.lineWidth = 1.4; c.stroke(); });
        c.beginPath(); c.ellipse(20, 19.6, 2.8, 3.8, 0, 0, TAU); c.fillStyle = 'rgba(50,26,12,.6)'; c.fill(); c.beginPath(); c.ellipse(20, 19.6, 4.8, 6, 0, 0, TAU); c.strokeStyle = 'rgba(50,26,12,.5)'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#6a9a4a'; c.beginPath(); c.ellipse(10.4, 10, 5, 3.6, .3, 0, TAU); c.fill(); c.beginPath(); c.ellipse(28, 29.6, 4.4, 3.2, -.5, 0, TAU); c.fill();
      },
    });
    leaf(c, 29.6, 8.4, -.7, .95);
  },
  broto: function (c) {
    P(c, function (c) { c.moveTo(6.6, 33.4); c.quadraticCurveTo(11.6, 27, 20, 27); c.quadraticCurveTo(28.4, 27, 33.4, 33.4); c.quadraticCurveTo(20, 38, 6.6, 33.4); c.closePath(); }, '#6a4423', { k: 1.3, lw: 2.2, inn: function (c) { dot(c, 14, 31.6, 1, 'rgba(30,14,6,.5)'); dot(c, 25, 32, 1.1, 'rgba(30,14,6,.5)'); } });
    rope(c, function (c) { c.moveTo(20, 28.6); c.quadraticCurveTo(18.6, 22, 20.4, 15.6); }, '#4f9a45', 2.1);
    P(c, function (c) { c.moveTo(20.4, 17); c.quadraticCurveTo(9, 18.2, 5.6, 8); c.quadraticCurveTo(17.4, 5, 20.4, 17); c.closePath(); }, GR, { k: 1.5, lw: 2.1, sh: LEAFSH, hi: 'rgba(240,255,190,.45)', inn: function (c) { ln(c, [19.4, 15.6, 9, 9.6], GR2, 1.1); } });
    P(c, function (c) { c.moveTo(20.4, 16); c.quadraticCurveTo(22, 3, 34.4, 3.8); c.quadraticCurveTo(34.2, 15.8, 20.4, 16); c.closePath(); }, '#7fdc6c', { k: 1.6, lw: 2.1, sh: LEAFSH, hi: 'rgba(240,255,190,.45)', inn: function (c) { ln(c, [21.4, 14.6, 31, 6.4], GR2, 1.1); } });
    P(c, function (c) { poly(c, [29.4, 17.6, 33.4, 17.6, 33.4, 21.4, 37.2, 21.4, 37.2, 25.4, 33.4, 25.4, 33.4, 29.2, 29.4, 29.2, 29.4, 25.4, 25.6, 25.4, 25.6, 21.4, 29.4, 21.4]); }, '#f2ffe0', { k: 0, lw: 1.9, out: '#1d4a22' });
    P(c, function (c) { poly(c, [5.8, 18.6, 8.6, 18.6, 8.6, 21.2, 11.2, 21.2, 11.2, 24, 8.6, 24, 8.6, 26.6, 5.8, 26.6, 5.8, 24, 3.2, 24, 3.2, 21.2, 5.8, 21.2]); }, '#f2ffe0', { k: 0, lw: 1.7, out: '#1d4a22' });
  },
  jato: function (c) {
    odot(c, 36, 5, 1.7, WAT2, WOUT); odot(c, 37, 17.6, 1.4, WAT2, WOUT); odot(c, 23.6, 3.4, 1.4, WAT2, WOUT);
    P(c, function (c) { c.moveTo(3.4, 37); c.quadraticCurveTo(9, 22, 21.6, 10.6); c.lineTo(29.6, 18.6); c.quadraticCurveTo(18, 31, 3.4, 37); c.closePath(); }, WAT, { k: 1.4, lw: 2.2, out: WOUT, sh: WSH, inn: function (c) { c.beginPath(); c.moveTo(6.6, 33.6); c.quadraticCurveTo(13, 23, 23.6, 13.6); c.strokeStyle = '#e6f6ff'; c.lineWidth = 1.7; c.stroke(); } });
    P(c, function (c) { c.moveTo(19, 12.6); c.bezierCurveTo(15.6, 6.6, 21.6, 2.6, 26, 6); c.bezierCurveTo(29, 1.6, 36, 3.6, 34.4, 9.4); c.bezierCurveTo(39, 12.6, 36.6, 19.6, 31.4, 18.4); c.bezierCurveTo(31.6, 23, 25.6, 24, 24, 20); c.bezierCurveTo(21, 20, 18, 16.6, 19, 12.6); c.closePath(); }, WAT2, { k: 1.6, lw: 2.2, out: WOUT, sh: 'rgba(20,70,160,.4)', inn: function (c) { dot(c, 25, 10, 2.2, '#fff'); dot(c, 30.4, 12.6, 1.2, '#fff'); } });
  },
  onda: function (c) {
    P(c, function (c) { c.moveTo(2, 35.6); c.bezierCurveTo(3, 18, 12.6, 5.4, 25, 5.4); c.bezierCurveTo(32.6, 5.4, 38, 11, 37.4, 17.4); c.bezierCurveTo(36.8, 22, 31, 23.4, 28.6, 19.6); c.bezierCurveTo(31, 17.4, 29.6, 13.4, 25.6, 13.6); c.bezierCurveTo(19, 14, 17, 23.6, 24, 29.4); c.bezierCurveTo(28, 32.6, 34, 33.4, 38, 35.6); c.closePath(); }, '#3f8fe8', {
      k: 2, lw: 2.3, out: WOUT, sh: WSH, inn: function (c) {
        c.beginPath(); c.moveTo(5, 34); c.bezierCurveTo(6.6, 20, 14.6, 9.6, 25, 9.4); c.strokeStyle = WAT2; c.lineWidth = 1.8; c.stroke();
        c.beginPath(); c.moveTo(11, 34.6); c.bezierCurveTo(11.6, 26, 14, 20.6, 17.6, 17.6); c.strokeStyle = 'rgba(159,224,250,.6)'; c.lineWidth = 1.3; c.stroke();
      },
    });
    [[25, 6.4, 2.5], [30.6, 7.6, 2.3], [35, 11.6, 2.1], [35.6, 17, 2], [31.6, 20.4, 1.9]].forEach(function (q) { odot(c, q[0], q[1], q[2], '#f4fbff', WOUT); });
    [[25, 6.4, 2.5], [30.6, 7.6, 2.3], [35, 11.6, 2.1], [35.6, 17, 2], [31.6, 20.4, 1.9]].forEach(function (q) { dot(c, q[0], q[1], q[2], '#f4fbff'); });
  },
  bolha: function (c) {
    function bub(x, y, r) { P(c, function (c) { el(c, x, y, r, r); }, '#6fc4ee', { k: r * .14, lw: r > 6 ? 2.3 : 1.9, out: WOUT, sh: WSH, inn: function (c) { dot(c, x - r * .06, y - r * .06, r * .74, '#c2ecfb'); c.beginPath(); c.arc(x, y, r * .78, 3.5, 4.6); c.strokeStyle = '#fff'; c.lineWidth = Math.max(1.1, r * .16); c.lineCap = 'round'; c.stroke(); dot(c, x + r * .42, y + r * .46, r * .1, '#fff'); } }); }
    bub(31.6, 9.6, 5.6); bub(33.4, 28, 3.6); bub(16, 23, 13);
  },
  correnteza: function (c) {
    P(c, function (c) { trailP(c, 3, 10.6, 16, 4, 33.6, 11.6, .5, 3); }, WAT2, { k: .8, lw: 1.9, out: WOUT, sh: WSH });
    P(c, function (c) { trailP(c, 5, 33.6, 17, 27, 30, 32.4, .5, 2.8); }, WAT2, { k: .8, lw: 1.9, out: WOUT, sh: WSH });
    P(c, function (c) { trailP(c, 1.6, 23.6, 15, 12.6, 33, 21.6, .6, 5.2); }, WAT, { k: 1.4, lw: 2.2, out: WOUT, sh: WSH, inn: function (c) { c.beginPath(); c.moveTo(8, 20); c.quadraticCurveTo(18, 14.6, 31, 20); c.strokeStyle = '#e6f6ff'; c.lineWidth = 1.5; c.stroke(); dot(c, 32.6, 20.4, 1.5, '#fff'); } });
  },
  chuva: function (c) {
    [[10.6, 30.6], [20.4, 33], [30, 30.6]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.rotate(.3); P(c, function (c) { dropP(c, 0, 0, 3.5); }, WAT, { k: .8, lw: 1.9, out: WOUT, sh: WSH }); c.restore(); });
    P(c, function (c) { c.moveTo(9.4, 22.6); c.bezierCurveTo(1.6, 22.6, 1.6, 12.4, 9.6, 12.4); c.bezierCurveTo(10, 4.4, 20.6, 2.4, 24, 8.6); c.bezierCurveTo(30, 5.6, 36, 10.4, 34, 15.4); c.bezierCurveTo(39.6, 16.6, 38.4, 22.6, 32.6, 22.6); c.closePath(); }, '#aebfcc', { k: 2, lw: 2.3, out: WOUT, sh: 'rgba(30,50,90,.42)', hi: 'rgba(255,255,255,.5)' });
  },
};

function unknown(c) { P(c, function (c) { poly(c, [20, 6, 34, 20, 20, 34, 6, 20]); }, CRM, { k: 2 }); dot(c, 20, 20, 3, DK); }

/** Desenha o ícone `key` num quadrado de `size` px com origem em (0,0). Chave desconhecida vira um losango neutro. */
export function drawUiIcon(c, key, size) {
  size = size || 40;
  var f = Object.prototype.hasOwnProperty.call(I, key) ? I[key] : unknown, q = Q;
  Q = size >= 36 ? 1 : Math.min(1.3, 36 / size);
  c.save(); c.scale(size / 40, size / 40); c.lineCap = 'round'; c.lineJoin = 'round';
  try { f(c); } finally { c.restore(); Q = q; }
}
