// @ts-nocheck
/**
 * Achados da fase: baús (madeira, bronze, dourado, encantado; fechados e abertos), moeda, orbes de
 * vida e de mana, pote de barro, a Mãe-do-Ouro, o totem do desafio e os ícones dos efeitos de baú.
 * Mesmo estilo dos personagens: contorno escuro quente, sombra em meia-lua, brilho do lado da luz.
 * Tudo é desenhado uma vez, no carregamento.
 */
import { OUT, TAU, el, poly, cel, ln, dot, star } from './characters';

const GOLD = '#f2c14e', GOLD2 = '#c98f2a', DK = '#3a2014';

function halo(c, x, y, r, rgb, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
function spark(c, x, y, r, col) {
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill();
}
function rrect(c, x, y, w, h, r) {
  c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}

/* ---------- baús ---------- */

/** Cores de cada baú: madeira do corpo, da tampa, ferragem, brilho da ferragem e a peça da fechadura. */
const TIER = {
  madeira: { body: '#a8683a', lid: '#bd7c46', band: '#6e625c', bandHi: '#a69a90', lock: '#8e8278', glow: null, gem: null },
  bronze: { body: '#5e3420', lid: '#71422a', band: '#cf8040', bandHi: '#f2b070', lock: '#d98a48', glow: null, gem: '#5fc9a0' },
  dourado: { body: '#9a3426', lid: '#b04030', band: GOLD, bandHi: '#fff0b0', lock: GOLD, glow: '255,210,80', gem: '#4fb6f0' },
  encantado: { body: '#3e2a62', lid: '#523a7e', band: '#7af0d8', bandHi: '#d8fff6', lock: '#b98cff', glow: '190,140,255', gem: '#ff7ad9' },
};

/** Baú com os pés em (32, 56), 64×60. `open` desenha a tampa jogada para trás e o brilho de dentro. */
function chest(c, tier, open) {
  const T = TIER[tier];
  c.fillStyle = 'rgba(20,10,6,.35)'; c.beginPath(); c.ellipse(32, 55, 25, 5, 0, 0, TAU); c.fill();
  if (T.glow && !open) halo(c, 32, 34, 30, T.glow, 0.35);
  if (open) {
    /* tampa jogada para trás: mostra a madeira de dentro, mais escura */
    cel(c, (p) => { p.moveTo(10, 24); p.lineTo(6, 6); p.quadraticCurveTo(32, -1, 58, 6); p.lineTo(54, 24); p.closePath(); }, '#5a3018', { k: 1, lw: 2.2, inn: (p) => {
      [12, 18].forEach((y) => ln(p, [8, y, 56, y], 'rgba(20,8,4,.4)', 1));
      p.fillStyle = T.band; p.fillRect(14.5, 2, 5, 23); p.fillRect(44.5, 2, 5, 23);
    } });
  }
  /* corpo */
  cel(c, (p) => rrect(p, 8, 27, 48, 28, 4), T.body, { k: 2, lw: 2.6, sh: 'rgba(40,10,10,.4)', inn: (p) => {
    [20, 32, 44].forEach((y) => ln(p, [9, y + 4, 55, y + 4], 'rgba(40,16,8,.35)', 1));
    p.fillStyle = T.band; p.fillRect(15.5, 26, 5, 30); p.fillRect(43.5, 26, 5, 30);
    p.fillStyle = T.bandHi; p.fillRect(15.5, 26, 1.6, 30); p.fillRect(43.5, 26, 1.6, 30);
    p.fillStyle = T.band; p.fillRect(7, 50, 50, 5);
    if (tier === 'encantado') { ln(p, [24, 34, 27, 40, 24, 46], '#7af0d8', 1.4); ln(p, [40, 34, 37, 40, 40, 46], '#7af0d8', 1.4); }
    if (tier === 'dourado') [11, 53].forEach((x) => { dot(p, x, 31, 1.4, GOLD); dot(p, x, 47, 1.4, GOLD); });
  } });
  if (!open) {
    /* tampa curva */
    cel(c, (p) => { p.moveTo(7, 29); p.quadraticCurveTo(7, 11, 20, 11); p.lineTo(44, 11); p.quadraticCurveTo(57, 11, 57, 29); p.closePath(); }, T.lid, { k: 2, lw: 2.6, sh: 'rgba(40,10,10,.4)', inn: (p) => {
      ln(p, [8, 20, 56, 20], 'rgba(40,16,8,.35)', 1);
      p.fillStyle = T.band; p.fillRect(15.5, 9, 5, 21); p.fillRect(43.5, 9, 5, 21);
      p.fillStyle = T.bandHi; p.fillRect(15.5, 9, 1.6, 21); p.fillRect(43.5, 9, 1.6, 21);
      p.fillStyle = 'rgba(255,240,200,.28)'; p.beginPath(); p.ellipse(28, 15, 9, 2, 0, 0, TAU); p.fill();
    } });
    ln(c, [7, 29, 57, 29], OUT, 2.4);
  }
  if (open) {
    /* boca aberta com o tesouro transbordando e o brilho subindo */
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 32, 20, 30, T.glow ?? '255,220,120', 0.8); c.restore();
    cel(c, (p) => el(p, 32, 28, 23, 5.6), '#2a120a', { k: 0, lw: 2.2 });
    cel(c, (p) => { p.moveTo(12, 29); p.quadraticCurveTo(18, 17, 32, 16); p.quadraticCurveTo(46, 17, 52, 29); p.quadraticCurveTo(32, 33, 12, 29); p.closePath(); }, GOLD, { k: 1.2, lw: 1.8, out: '#5a3200', sh: 'rgba(140,70,0,.45)', hi: 'rgba(255,250,210,.5)', inn: (p) => {
      [[20, 25], [27, 21], [35, 20.4], [42, 24], [31, 26.6], [24, 28.4], [39, 28]].forEach((q) => { p.beginPath(); p.ellipse(q[0], q[1], 3.4, 1.7, 0, 0, TAU); p.strokeStyle = 'rgba(140,80,0,.6)'; p.lineWidth = 0.9; p.stroke(); });
    } });
    if (T.gem) cel(c, (p) => poly(p, [36, 18, 40, 16, 42.6, 19, 38.6, 21.6]), T.gem, { k: 0.5, lw: 1.2 });
    spark(c, 22, 12, 3.2, '#fffbe6'); spark(c, 44, 9, 2.6, '#fffbe6'); spark(c, 33, 6, 2, '#fffbe6');
  }
  /* fechadura */
  cel(c, (p) => poly(p, [27, 25, 37, 25, 37, 35, 32, 39, 27, 35]), T.lock, { k: 0.8, lw: 2, inn: (p) => {
    if (T.gem) { cel(p, (q) => el(q, 32, 30.5, 2.6, 2.6), T.gem, { k: 0.5, lw: 1 }); dot(p, 31.2, 29.7, 0.8, '#fff'); }
    else { dot(p, 32, 29.5, 1.5, DK); ln(p, [32, 30, 32, 33.4], DK, 1.3); }
  } });
  if (!open && T.glow) { spark(c, 13, 13, 3.6, '#fff'); spark(c, 53, 36, 2.6, '#fff'); }
}

/* ---------- moeda, orbes, pote ---------- */

function coin(c) {
  cel(c, (p) => el(p, 11, 11, 9, 9), GOLD, { k: 1.6, lw: 2, sh: 'rgba(120,60,0,.45)', hi: 'rgba(255,250,210,.5)', inn: (p) => {
    p.beginPath(); p.arc(11, 11, 6.2, 0, TAU); p.strokeStyle = 'rgba(140,80,0,.6)'; p.lineWidth = 1.1; p.stroke();
  } });
  star(c, 11, 11, 3.8, '#fff0b0');
  spark(c, 6, 5.4, 2.2, '#fffbe6');
}

function orb(c, rgb, base, light, out) {
  c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 13, 13, 13, rgb, 0.55); c.restore();
  cel(c, (p) => el(p, 13, 13, 7.6, 7.6), base, { k: 1.4, lw: 1.8, out, hi: 'rgba(255,255,255,.45)', inn: (p) => {
    const g = p.createRadialGradient(11, 11, 0.5, 13, 13, 7); g.addColorStop(0, light); g.addColorStop(1, 'rgba(255,255,255,0)'); p.fillStyle = g; p.fillRect(4, 4, 18, 18);
  } });
  spark(c, 10.4, 9.6, 2.4, '#ffffff');
}
function orbVida(c) {
  orb(c, '255,90,90', '#e2443c', 'rgba(255,220,210,.95)', '#4a0e0a');
  /* folhinha: é uma fruta do mato */
  cel(c, (p) => { p.moveTo(13, 6); p.quadraticCurveTo(17, 1.6, 21, 3.4); p.quadraticCurveTo(17.6, 7, 13, 6); p.closePath(); }, '#5fbf5a', { k: 0.5, lw: 1.2 });
}
function orbMana(c) {
  orb(c, '90,170,255', '#3f8fe0', 'rgba(220,240,255,.95)', '#0e2a5a');
}

function pot(c) {
  c.fillStyle = 'rgba(20,10,6,.35)'; c.beginPath(); c.ellipse(23, 49, 16, 3.6, 0, 0, TAU); c.fill();
  cel(c, (p) => { p.moveTo(16, 12); p.lineTo(30, 12); p.quadraticCurveTo(29, 17, 33, 20); p.quadraticCurveTo(42, 27, 39, 39); p.quadraticCurveTo(36, 49, 23, 49); p.quadraticCurveTo(10, 49, 7, 39); p.quadraticCurveTo(4, 27, 13, 20); p.quadraticCurveTo(17, 17, 16, 12); p.closePath(); }, '#b8693a', {
    k: 2.2, lw: 2.4, sh: 'rgba(70,20,10,.42)', hi: 'rgba(255,220,170,.3)', inn: (p) => {
      /* faixas de barro pintado, à moda marajoara */
      p.fillStyle = '#e8d2a8'; p.fillRect(4, 26, 38, 4.6);
      ln(p, [6, 28.3, 10, 26.4, 14, 28.3, 18, 26.4, 22, 28.3, 26, 26.4, 30, 28.3, 34, 26.4, 38, 28.3, 42, 26.4], '#7a2a1a', 1.2);
      p.fillStyle = 'rgba(122,42,26,.75)'; [12, 23, 34].forEach((x) => { p.beginPath(); p.arc(x, 37, 2.2, 0, TAU); p.fill(); });
      ln(p, [9, 43, 37, 43], 'rgba(90,30,14,.4)', 1);
    },
  });
  cel(c, (p) => el(p, 23, 12, 8.6, 2.8), '#9a5430', { k: 0.6, lw: 2, inn: (p) => { p.fillStyle = '#3a160a'; p.beginPath(); p.ellipse(23, 12.4, 5.6, 1.6, 0, 0, TAU); p.fill(); } });
  dot(c, 33, 18, 1.2, 'rgba(255,240,210,.7)');
}

/* ---------- Mãe-do-Ouro ---------- */

/** Bola de fogo dourada com rosto, centrada em (32, 36), 64×72. `k` de 0 a 1 faz a chama tremer. */
function maeDoOuro(c, k) {
  const a = k * TAU, f = Math.sin(a), g = Math.cos(a);
  c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 32, 38, 32, '255,190,60', 0.55); c.restore();
  /* labareda: três línguas que se mexem */
  const flame = (p, s, dx) => {
    p.moveTo(32 + dx, 6 + s); p.bezierCurveTo(36 + dx + f * 3, 16, 50, 22 + g * 2, 50, 38); p.bezierCurveTo(50, 50, 42, 58, 32, 58);
    p.bezierCurveTo(22, 58, 14, 50, 14, 38); p.bezierCurveTo(14, 26, 22, 24 - f * 2, 24 + dx * 0.4, 14 + s); p.bezierCurveTo(27, 20, 28, 22, 29 + dx * 0.2, 20 + s * 0.5);
    p.bezierCurveTo(29, 14, 30, 10, 32 + dx, 6 + s); p.closePath();
  };
  cel(c, (p) => flame(p, 0, f * 3), '#ff9a2a', { k: 1.4, lw: 2.2, out: '#5a1e04', sh: 'rgba(160,30,0,.35)', hi: 'rgba(255,250,200,.4)', inn: (p) => {
    p.beginPath(); flame(p, 8, f * 2); p.save(); p.translate(32, 44); p.scale(0.74, 0.72); p.translate(-32, -44); p.fillStyle = '#ffc93f'; p.fill(); p.restore();
    p.fillStyle = '#fff3b0'; p.beginPath(); p.ellipse(32, 44, 10, 9, 0, 0, TAU); p.fill();
  } });
  /* rosto */
  c.fillStyle = '#5a1e04';
  [26.4, 37.6].forEach((x) => { c.beginPath(); c.ellipse(x, 40, 2, 2.8, 0, 0, TAU); c.fill(); dot(c, x + 0.6, 39, 0.8, '#fff'); });
  c.beginPath(); c.moveTo(28, 47); c.quadraticCurveTo(32, 50.4, 36, 47); c.strokeStyle = '#5a1e04'; c.lineWidth = 1.5; c.lineCap = 'round'; c.stroke();
  dot(c, 23.4, 45, 1.6, 'rgba(255,120,60,.5)'); dot(c, 40.6, 45, 1.6, 'rgba(255,120,60,.5)');
  /* faíscas de ouro em volta */
  [[10, 20 + f * 4, 2.6], [54, 16 - g * 4, 2.2], [56, 50 + f * 3, 1.8], [8, 52 - g * 3, 2]].forEach((q) => spark(c, q[0], q[1], q[2], '#fff6c0'));
}

/* ---------- totem do desafio ---------- */

/** Totem de madeira entalhada com os pés em (30, 100), 60×104. */
function totem(c) {
  c.fillStyle = 'rgba(20,10,6,.35)'; c.beginPath(); c.ellipse(30, 99, 20, 4.6, 0, 0, TAU); c.fill();
  const W = '#8a5a34', W2 = '#6e4426';
  cel(c, (p) => rrect(p, 14, 18, 32, 82, 5), W, { k: 2.4, lw: 2.6, sh: 'rgba(40,14,6,.45)', inn: (p) => {
    [44, 70].forEach((y) => { p.fillStyle = W2; p.fillRect(13, y, 34, 4); });
    /* rosto de cima: olhos que acendem */
    p.fillStyle = '#2a1408'; p.beginPath(); p.ellipse(24, 30, 3.6, 4.4, 0, 0, TAU); p.ellipse(36, 30, 3.6, 4.4, 0, 0, TAU); p.fill();
    p.fillStyle = '#ffd23f'; p.beginPath(); p.arc(24, 30.6, 1.9, 0, TAU); p.arc(36, 30.6, 1.9, 0, TAU); p.fill();
    p.fillStyle = '#2a1408'; p.fillRect(23, 37, 14, 3);
    /* rosto do meio, boca aberta */
    p.beginPath(); p.ellipse(24, 55, 3, 2, 0, 0, TAU); p.ellipse(36, 55, 3, 2, 0, 0, TAU); p.fill();
    p.beginPath(); p.ellipse(30, 63, 5, 3.4, 0, 0, TAU); p.fill();
    p.fillStyle = '#cf3b28'; p.beginPath(); p.ellipse(30, 64, 3, 1.6, 0, 0, TAU); p.fill();
    /* grafismo de baixo */
    ln(p, [17, 82, 23, 76, 30, 82, 37, 76, 43, 82], '#e8d2a8', 1.6); ln(p, [17, 90, 23, 84, 30, 90, 37, 84, 43, 90], '#e8d2a8', 1.6);
  } });
  /* cocar de penas */
  [[-0.7, '#cf3b28'], [-0.25, GOLD], [0.25, '#5fbf5a'], [0.7, '#3fa7e0']].forEach(([a, col]) => {
    c.save(); c.translate(30, 20); c.rotate(a);
    cel(c, (p) => { p.moveTo(0, 0); p.quadraticCurveTo(-5, -9, 0, -19); p.quadraticCurveTo(5, -9, 0, 0); p.closePath(); }, col, { k: 0.6, lw: 1.6 });
    c.restore();
  });
  cel(c, (p) => rrect(p, 12, 16, 36, 6, 2), '#cf8040', { k: 0.6, lw: 2 });
}

/* ---------- ícones dos efeitos (caixa de 40×40) ---------- */

const BUFF_ICON = {
  /* garra de onça: três riscos */
  furia(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 20, 20, 18, '255,120,40', 0.4); c.restore();
    cel(c, (p) => el(p, 20, 21, 13, 13), '#e8a040', { k: 1.6, lw: 2.2, sh: 'rgba(110,40,0,.4)', inn: (p) => {
      [[13, 17], [24, 14], [27, 27], [15, 28]].forEach((q) => { p.fillStyle = '#5a2a10'; p.beginPath(); p.ellipse(q[0], q[1], 2.4, 1.8, 0.5, 0, TAU); p.fill(); });
    } });
    [[-7, 0], [0, -1.5], [7, 0]].forEach(([dx, dy]) => { ln(c, [12 + dx + 6, 6 + dy, 6 + dx + 6, 34 + dy], OUT, 5.4); ln(c, [12 + dx + 6, 6 + dy, 6 + dx + 6, 34 + dy], '#fff4e0', 2.6); });
  },
  /* pé com asinha de vento */
  vento(c) {
    [[4, 13, 16], [2, 20, 14], [5, 27, 12]].forEach((q) => ln(c, [q[0], q[1], q[0] + q[2], q[1]], 'rgba(155,231,255,.9)', 2.2));
    cel(c, (p) => { p.moveTo(18, 6); p.lineTo(28, 6); p.lineTo(29, 24); p.quadraticCurveTo(38, 26, 37, 32); p.lineTo(17, 33); p.closePath(); }, '#c88a5a', { k: 1.4, lw: 2.2 });
    cel(c, (p) => { p.moveTo(16, 32); p.lineTo(38, 31); p.lineTo(38, 35); p.lineTo(16, 36); p.closePath(); }, '#7a4a26', { k: 0.6, lw: 2 });
    c.save(); c.translate(19, 12);
    cel(c, (p) => { p.moveTo(0, 0); p.quadraticCurveTo(-10, -6, -14, 2); p.quadraticCurveTo(-8, 2, -6, 6); p.quadraticCurveTo(-3, 3, 0, 4); p.closePath(); }, '#e9f8ff', { k: 0.8, lw: 1.8 });
    c.restore();
  },
  /* casco de jabuti */
  jabuti(c) {
    cel(c, (p) => { p.moveTo(4, 30); p.quadraticCurveTo(6, 6, 20, 6); p.quadraticCurveTo(34, 6, 36, 30); p.closePath(); }, '#a07a40', { k: 2, lw: 2.4, inn: (p) => {
      p.fillStyle = '#7a5a2a';
      [[20, 14, 5], [11, 22, 4], [29, 22, 4], [20, 25, 4]].forEach((q) => { p.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; p[i ? 'lineTo' : 'moveTo'](q[0] + Math.cos(a) * q[2], q[1] + Math.sin(a) * q[2] * 0.8); } p.closePath(); p.fill(); });
    } });
    cel(c, (p) => rrect(p, 3, 29, 34, 5, 2), '#d8b070', { k: 0.6, lw: 2 });
    cel(c, (p) => el(p, 36, 27, 4, 3.4), '#9aa86a', { k: 0.6, lw: 1.8 }); dot(c, 37.4, 26, 0.9, DK);
  },
  /* nuvem que chove mana */
  mana(c) {
    [[12, 26], [20, 30], [28, 26], [16, 34], [25, 35]].forEach((q) => cel(c, (p) => { p.moveTo(q[0], q[1] - 3.4); p.quadraticCurveTo(q[0] + 2.4, q[1], q[0], q[1] + 2); p.quadraticCurveTo(q[0] - 2.4, q[1], q[0], q[1] - 3.4); p.closePath(); }, '#5cb8ff', { k: 0, lw: 1.2, out: '#0e2a5a' }));
    cel(c, (p) => { el(p, 14, 17, 8, 6.4); el(p, 23, 13, 9, 7.6); el(p, 30, 18, 7, 5.6); p.moveTo(8, 18); p.lineTo(36, 18); p.lineTo(34, 22); p.lineTo(9, 22); p.closePath(); }, '#e8f2ff', { k: 1.4, lw: 2.2, out: '#1e3a6a', sh: 'rgba(40,70,140,.35)' });
  },
  /* punho com faísca */
  elemento(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 22, 18, 18, '255,224,102', 0.45); c.restore();
    cel(c, (p) => rrect(p, 9, 14, 20, 18, 6), '#c88a5a', { k: 1.6, lw: 2.2, inn: (p) => { [15, 20, 25].forEach((x) => ln(p, [x, 15, x, 21], 'rgba(90,40,20,.5)', 1)); } });
    cel(c, (p) => rrect(p, 12, 31, 14, 6, 2), '#7a4a26', { k: 0.6, lw: 2 });
    cel(c, (p) => poly(p, [31, 2, 23, 16, 29, 16, 25, 28, 37, 12, 31, 12, 35, 2]), '#ffe066', { k: 0.8, lw: 1.8, out: '#5a3a00' });
  },
  /* ímã em ferradura com moedas */
  ima(c) {
    c.save(); c.translate(17, 18); c.rotate(-0.5);
    c.beginPath(); c.arc(0, 0, 10, Math.PI, 0); c.lineCap = 'butt'; c.strokeStyle = OUT; c.lineWidth = 9.6; c.stroke(); c.strokeStyle = '#cf3b28'; c.lineWidth = 6.6; c.stroke();
    [[-10, 0], [10, 0]].forEach(([x]) => { cel(c, (p) => rrect(p, x - 4, 0, 8, 9, 1), '#d8d4cc', { k: 0.6, lw: 1.8 }); });
    c.restore();
    [[31, 26], [26, 33], [34, 34]].forEach((q) => { cel(c, (p) => el(p, q[0], q[1], 4.4, 4.4), GOLD, { k: 0.8, lw: 1.6 }); dot(c, q[0] - 1, q[1] - 1, 1, '#fff6cf'); });
  },
};

export function bakeLoot(kit) {
  for (const tier of Object.keys(TIER)) {
    kit.image('bau_' + tier, 64, 60, (c) => chest(c, tier, false));
    kit.image('bau_' + tier + '_aberto', 64, 60, (c) => chest(c, tier, true));
  }
  kit.image('moeda', 22, 22, coin);
  kit.image('orbe_vida', 26, 26, orbVida);
  kit.image('orbe_mana', 26, 26, orbMana);
  kit.image('pote', 46, 52, pot);
  kit.image('totem', 60, 104, totem);
  for (let i = 0; i < 4; i++) kit.image('maedoouro' + i, 64, 72, (c) => maeDoOuro(c, i / 4));
  for (const [k, draw] of Object.entries(BUFF_ICON)) kit.image('buff_' + k, 40, 40, (c) => { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; draw(c); c.restore(); });
}
