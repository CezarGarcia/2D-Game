// @ts-nocheck
/**
 * Arte do Capítulo 8, "Terra Sem Nome": o lugar que foi esquecido.
 * Assombros sem rosto, de papel apagado e rabisco, com rasgos de vazio preto e olhos rosa; os companheiros
 * (mico e botinho) são coloridos. Mesmo estilo recortado de characters.ts: todos virados para a direita,
 * pés/base em (0,0), y negativo para cima. Contrato em src/art/kit.ts; chão, moldura e mapa em ch8_cena.ts.
 */
import { OUT, TAU, el, cap, poly, cel, ln, dot, glow, star, ik } from './characters';
import { paintGround, paintCanopy, paintMap } from './ch8_cena';

var EYE = '#ffe0f0', EYEG = '#ff3d8a', PI = Math.PI, VOID = '#0d0a14', PW = '#f7f5f0', P1 = '#e3e0e6', P2 = '#c8c4ce', P3 = '#a7a2b0', GR = 'rgba(46,40,60,';
function cl(v) { return v == null ? 0 : Math.max(0, Math.min(1, v)); }
function lp(a, b, k) { return a + (b - a) * k; }
function sm(k) { return k * k * (3 - 2 * k); }
/* ruído determinístico de 0 a 1 */
function hs(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function rope(c, fn, col, lw, out) { c.beginPath(); fn(c); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + 2.2; c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
function bz(x0, y0, x1, y1, x2, y2, x3, y3, n, r0, r1) { var P = [], i, u, v; for (i = 0; i <= n; i++) { u = i / n; v = 1 - u; P.push([v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3, r0 + (r1 - r0) * u]); } return P; }
function tube(P) {
  return function (c) {
    var n = P.length, i, S = [];
    for (i = 0; i < n; i++) { var a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)]; S.push(Math.atan2(b[1] - a[1], b[0] - a[0])); }
    for (i = 0; i < n; i++) c[i ? 'lineTo' : 'moveTo'](P[i][0] - Math.sin(S[i]) * P[i][2], P[i][1] + Math.cos(S[i]) * P[i][2]);
    c.arc(P[n - 1][0], P[n - 1][1], P[n - 1][2], S[n - 1] + PI / 2, S[n - 1] - PI / 2, true);
    for (i = n - 1; i >= 0; i--) c.lineTo(P[i][0] + Math.sin(S[i]) * P[i][2], P[i][1] - Math.cos(S[i]) * P[i][2]);
    c.arc(P[0][0], P[0][1], P[0][2], S[0] - PI / 2, S[0] + PI / 2, true); c.closePath();
  };
}
/* braço de dois segmentos: escolhe a dobra com o cotovelo mais baixo; no empate, o lado `pref` */
function arm2(c, sx, sy, hx, hy, l1, l2, pref, r1, r2, c1, c2, op) {
  var k1 = ik(sx, sy, hx, hy, l1, l2, 1), k2 = ik(sx, sy, hx, hy, l1, l2, -1), k = Math.abs(k1[1] - k2[1]) < 3 ? ((k1[0] - k2[0]) * pref > 0 ? k1 : k2) : (k1[1] > k2[1] ? k1 : k2);
  cel(c, function (c) { cap(c, sx, sy, k[0], k[1], r1); }, c1, op); cel(c, function (c) { cap(c, k[0], k[1], hx, hy, r2); }, c2, op); return k;
}
/* traços de lápis soltos por cima de um contorno; mudam a cada quadro (o rabisco "ferve") */
function sketch(c, fn, sd, al) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 0.75; c.strokeStyle = GR + (al || 0.5) + ')';
  for (var i = 0; i < 2; i++) { c.save(); c.translate((hs(sd + i * 3) - 0.5) * 2.4, (hs(sd + i * 3 + 1) - 0.5) * 2.4); c.beginPath(); fn(c); c.stroke(); c.restore(); }
  c.restore();
}
/* hachura diagonal (para usar dentro do recorte de uma peça) */
function hatch(c, x0, y0, x1, y1, gap, col, lw, sd) {
  c.beginPath(); for (var x = x0 - (y1 - y0), i = 0; x < x1; x += gap, i++) { var j = (hs(sd + i) - 0.5) * gap * 0.6; c.moveTo(x + j, y1); c.lineTo(x + j + (y1 - y0), y0); }
  c.strokeStyle = col; c.lineWidth = lw || 0.8; c.lineCap = 'round'; c.stroke();
}
/* linhas de escrita apagada */
function writing(c, x0, y0, x1, y1, gap, col, sd) {
  c.beginPath();
  for (var y = y0, r = 0; y < y1; y += gap, r++) { var x = x0 + hs(r * 3 + sd) * 4; while (x < x1) { var w = 2 + hs(x * 7 + y + sd) * 7; c.moveTo(x, y); c.lineTo(Math.min(x1, x + w), y + (hs(x + y) - 0.5) * 0.7); x += w + 1.6 + hs(x + y * 5) * 2.4; } }
  c.strokeStyle = col; c.lineWidth = 0.8; c.lineCap = 'round'; c.stroke();
}
/* rasgo de vazio: preto, com borda branca */
function tear(c, x, y, w, h, rot, sd) {
  c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); var n = 7, i, u;
  c.moveTo(-w, 0); for (i = 1; i < n; i++) { u = i / n; c.lineTo(-w + 2 * w * u, -h * Math.sin(u * PI) * (0.5 + hs(sd + i) * 0.8)); }
  c.lineTo(w, 0); for (i = n - 1; i > 0; i--) { u = i / n; c.lineTo(-w + 2 * w * u, h * Math.sin(u * PI) * (0.4 + hs(sd + i + 9) * 0.7)); } c.closePath();
  c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.2; c.stroke(); c.strokeStyle = PW; c.lineWidth = 1.9; c.stroke(); c.fillStyle = VOID; c.fill();
  dot(c, -w * 0.3, -h * 0.1, 0.45, 'rgba(255,255,255,.75)'); dot(c, w * 0.35, h * 0.1, 0.35, 'rgba(220,200,255,.6)');
  c.restore();
}
function paperBit(c, x, y, s, rot, al) {
  c.save(); c.globalAlpha = al == null ? 1 : al; c.translate(x, y); c.rotate(rot);
  c.beginPath(); poly(c, [-3 * s, -3.6 * s, 2.6 * s, -3.2 * s, 3.2 * s, 3.4 * s, -2.8 * s, 3 * s]); c.fillStyle = PW; c.fill(); c.strokeStyle = OUT; c.lineWidth = 0.8; c.lineJoin = 'round'; c.stroke();
  ln(c, [-1.8 * s, -1.4 * s, 1.6 * s, -1.2 * s], GR + '.5)', 0.5); ln(c, [-1.8 * s, 0.4 * s, 1.2 * s, 0.6 * s], GR + '.5)', 0.5); ln(c, [-1.8 * s, 2 * s, 1.8 * s, 2.1 * s], GR + '.4)', 0.5);
  c.restore();
}

/* ---------------- Vulto: silhueta de gente em rabisco ---------------- */
function drawVulto(c, anim, k) {
  var mv = anim === 'move', w = mv ? k * TAU : 0, a = anim === 'atk' ? k : 0, wd = sm(cl(a / 0.62)), sk = sm(cl((a - 0.62) / 0.38)),
    st = Math.sin(w), co = Math.cos(w), b = mv ? Math.abs(co) * 1.4 : 0, sd = Math.round(k * 17) + (mv ? 0 : 40),
    lean = mv ? 0.1 + Math.sin(w * 2) * 0.02 : lp(lp(0.04, -0.2, wd), 0.42, sk), hy = -21 - b + sk * 3, i, AO = { k: 1, lw: 1.9 };
  var f1 = mv ? [3 + st * 7, -Math.max(0, -co) * 3.5] : [lp(4, 11, sk), 0], f2 = mv ? [-3 - st * 7, -Math.max(0, co) * 3.5] : [lp(-4, -8, sk), 0];
  /* fio de rabisco que escapa das costas */
  c.beginPath();
  for (i = 0; i <= 44; i++) { var u = i / 44, x = -3 - u * 17 - (mv ? u * 5 : 0) - sk * u * 6, y = hy - 22 + u * 12 + Math.sin(u * 8 + k * TAU) * 2.4; x += Math.cos(i * 1.7 + k * TAU) * 2.3 * (1 - u * 0.4); y += Math.sin(i * 1.7 + k * TAU) * 2.3 * (1 - u * 0.4); c[i ? 'lineTo' : 'moveTo'](x, y); }
  c.strokeStyle = GR + '.5)'; c.lineWidth = 0.9; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  /* pernas: terminam num enrosco de rabisco no lugar do pé */
  function leg(hx, f, far) {
    var kn = ik(hx, hy, f[0], f[1] - 2.4, 10.5, 10.5, -1);
    cel(c, function (c) { cap(c, hx, hy, kn[0], kn[1], 3.2); }, far ? P2 : P1, AO);
    cel(c, function (c) { cap(c, kn[0], kn[1], f[0], f[1] - 2.4, 2.6); }, far ? P2 : P1, AO);
    c.beginPath(); for (var j = 0; j < 3; j++) c.ellipse(f[0] + 1.6 + j * 0.7, f[1] - 1.3 - j * 0.2, 4.4 - j * 0.9, 1.6, 0, 0, TAU);
    c.strokeStyle = GR + '.7)'; c.lineWidth = 0.9; c.stroke();
  }
  leg(1.5, f2, true);
  c.save(); c.translate(0, hy); c.rotate(lean); c.translate(0, -hy);
  /* braços: descanso/andar, erguidos no aviso, para a frente no golpe */
  var rb = mv ? [-2 + st * 5, hy + 1] : [-3, hy + 1], rf = mv ? [4 - st * 5, hy + 1] : [5, hy + 1],
    hb = [lp(lp(rb[0], -4, wd), 16, sk), lp(lp(rb[1], hy - 33, wd), hy - 13, sk)], hf = [lp(lp(rf[0], 6, wd), 18, sk), lp(lp(rf[1], hy - 35, wd), hy - 7, sk)];
  function claws(hx, hy2, ex, ey) { var a2 = Math.atan2(hy2 - ey, hx - ex); [-0.5, 0, 0.5].forEach(function (d) { ln(c, [hx, hy2, hx + Math.cos(a2 + d) * 4.6, hy2 + Math.sin(a2 + d) * 4.6], OUT, 1.3); }); }
  var eb = arm2(c, -3.5, hy - 14, hb[0], hb[1], 8.5, 8.5, -1, 2.3, 2, P2, P2, AO); claws(hb[0], hb[1], eb[0], eb[1]);
  leg(-1.5, f1, false);
  /* tronco */
  function torso(c) { c.moveTo(-5.5, hy + 1); c.bezierCurveTo(-8, hy - 6, -9.5, hy - 12, -7.5, hy - 16); c.quadraticCurveTo(0, hy - 20, 7.5, hy - 15.5); c.bezierCurveTo(8.5, hy - 10, 6.5, hy - 5, 5.5, hy + 1); c.quadraticCurveTo(0, hy + 3, -5.5, hy + 1); c.closePath(); }
  cel(c, torso, P1, { k: 2, lw: 2.1, inn: function (c) { hatch(c, -10, hy - 20, 10, hy + 3, 2.4, GR + '.22)', 0.7, sd); } });
  sketch(c, torso, sd, 0.45);
  tear(c, 0.5, hy - 8.5, 3.8, 2.1, -0.5, 7);
  /* pescoço e cabeça sem rosto */
  cel(c, function (c) { cap(c, 1, hy - 16, 2, hy - 19.5, 2.2); }, P2, { k: 0.6, lw: 1.7 });
  function head(c) { el(c, 2.6, hy - 24, 6, 6.8, 0.1); }
  cel(c, head, P1, { k: 1.8, lw: 2.1, inn: function (c) { hatch(c, -4, hy - 31, 9, hy - 17, 2.2, GR + '.18)', 0.6, sd + 5); } });
  sketch(c, head, sd + 2, 0.45);
  glow(c, 6.4, hy - 24.6, 1.3, 1.7, EYE, EYEG, 8); glow(c, 3, hy - 24.8, 1.1, 1.5, EYE, EYEG, 8);
  var ef = arm2(c, 4, hy - 14.5, hf[0], hf[1], 8.5, 8.5, 1, 2.4, 2.1, P1, P1, AO); claws(hf[0], hf[1], ef[0], ef[1]);
  /* arranhão de rabisco no golpe */
  if (sk > 0.3) {
    c.save(); c.globalAlpha = sk;
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(12, hy - 14, 9 + i * 3.4, -1.15 + i * 0.1, 0.85); c.lineCap = 'round'; c.strokeStyle = OUT; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = PW; c.lineWidth = 1.7; c.stroke(); }
    c.restore();
  }
  c.restore();
}

/* ---------------- Vazio: bolha preta com borda branca ---------------- */
function drawVazio(c, anim, k) {
  var mv = anim === 'move', a = anim === 'atk' ? k : 0, sw = sm(a), ph = k * TAU, i,
    lift = mv ? Math.sin(k * PI) * 7 : 0, sq = mv ? Math.pow(1 - Math.sin(k * PI), 3) : 0,
    R = 12 * (1 + sw * 0.42), sx = (1 + sq * 0.16 - (mv ? Math.sin(k * PI) * 0.06 : 0)) * (1 + (a > 0.6 ? Math.sin(a * 40) * 0.03 : 0)), sy = 1 - sq * 0.14 + (mv ? Math.sin(k * PI) * 0.08 : 0),
    cx = a > 0.3 ? Math.sin(a * 31) * 0.9 * a : 0, cy = -R * sy - lift - 1;
  function blob(c, g) { for (var j = 0; j <= 40; j++) { var t = j / 40 * TAU, q = (R + g) * (1 + 0.055 * Math.sin(t * 3 + ph) + 0.035 * Math.sin(t * 5 - ph * 2)); c[j ? 'lineTo' : 'moveTo'](cx + Math.cos(t) * q * sx, cy + Math.sin(t) * q * sy); } c.closePath(); }
  if (sw > 0) { var gg = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.9); gg.addColorStop(0, 'rgba(255,255,255,' + 0.6 * sw + ')'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4); }
  /* marca de pouso */
  if (sq > 0.4) { c.beginPath(); c.ellipse(0, -0.6, R * 1.15, 2.6, 0, 0.2, PI - 0.2); c.strokeStyle = 'rgba(46,40,60,.4)'; c.lineWidth = 1.2; c.stroke(); }
  /* pingos de vazio que ficam para trás */
  if (mv) for (i = 0; i < 2; i++) { var u = (k + i * 0.5) % 1; dot(c, -R * 0.9 - u * 9, cy + R * 0.4 + u * 6, 1.6 * (1 - u) + 0.3, 'rgba(13,10,20,' + (1 - u) + ')'); }
  c.beginPath(); blob(c, 0); c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 5.6; c.stroke(); c.strokeStyle = PW; c.lineWidth = 3.4; c.stroke();
  var g = c.createRadialGradient(cx + R * 0.1, cy, 1, cx, cy, R); g.addColorStop(0, '#000'); g.addColorStop(0.7, '#0d0a16'); g.addColorStop(1, '#2c2342'); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  /* estrelinhas lá dentro */
  for (i = 0; i < 8; i++) { var an = i * 2.3 + ph * 0.5, rr = R * (0.2 + hs(i) * 0.6); dot(c, cx + Math.cos(an) * rr * sx, cy + Math.sin(an) * rr * sy, 0.35 + hs(i + 4) * 0.5, 'rgba(255,255,255,' + (0.35 + hs(i + 9) * 0.5) + ')'); }
  /* rachaduras de luz quando vai estourar */
  if (sw > 0.15) {
    c.globalCompositeOperation = 'lighter';
    for (i = 0; i < 7; i++) {
      var a0 = i * 0.9 + 0.3, x = cx + Math.cos(a0) * R * 0.15, y = cy + Math.sin(a0) * R * 0.15; c.beginPath(); c.moveTo(x, y);
      for (var j = 1; j <= 4; j++) { var q = R * (0.15 + j * 0.24 * sw), aj = a0 + (hs(i * 5 + j) - 0.5) * 0.6; c.lineTo(cx + Math.cos(aj) * q * sx, cy + Math.sin(aj) * q * sy); }
      c.strokeStyle = 'rgba(255,220,240,' + sw + ')'; c.lineWidth = 0.6 + sw * 1.1; c.lineCap = 'round'; c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  }
  c.beginPath(); c.ellipse(cx - R * 0.2, cy - R * 0.1, R * 0.74 * sx, R * 0.7 * sy, 0, PI * 1.08, PI * 1.45); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke();
  c.restore();
  var es = 1 + sw * 0.45; glow(c, cx + R * 0.32, cy - R * 0.14, 1.6 * es, 2.1 * es, EYE, EYEG, 9); glow(c, cx + R * 0.7, cy - R * 0.18, 1.3 * es, 1.8 * es, EYE, EYEG, 9);
  if (a > 0.9) { c.save(); c.setLineDash([2.4, 3.2]); c.beginPath(); blob(c, 3); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.4; c.stroke(); c.restore(); }
}

/* ---------------- Lembrança: retrato flutuante rasgado ---------------- */
function drawLembranca(c, anim, k) {
  var ph = k * TAU, a = anim === 'atk' ? k : 0, wd = sm(cl(a / 0.66)), sh = sm(cl((a - 0.66) / 0.34)), bob = Math.sin(ph) * 2.2 * (1 - a), i,
    rot = Math.sin(ph) * 0.08 * (1 - a) - 0.32 * wd * (1 - sh) + 0.2 * sh;
  var J = [[15, 2.5], [11.6, 5.4], [12.8, 8.6], [8.2, 10.6], [9.4, 14.2], [4.6, 15.6], [5.4, 19]];
  function outer(c) { c.moveTo(-15, -19); c.lineTo(15, -19); J.forEach(function (p) { c.lineTo(p[0], p[1]); }); c.lineTo(-15, 19); c.closePath(); }
  c.save(); c.translate(0, -31 + bob); c.rotate(rot);
  /* cordão e prego */
  ln(c, [-9, -19, 0, -27.5, 9, -19], 'rgba(46,40,60,.85)', 1); dot(c, 0, -27.8, 1.5, OUT); dot(c, -0.4, -28.2, 0.5, '#d9d6dc');
  /* lasquinhas de papel caindo do rasgo */
  for (i = 0; i < 3; i++) { var u = (k + i / 3) % 1; paperBit(c, 10 + i * 3 + u * 4, 13 + i * 3 + u * 12, 0.55, u * 4 + i, (1 - u) * 0.9); }
  /* moldura */
  cel(c, function (c) { c.moveTo(-6, -19); c.quadraticCurveTo(0, -25, 6, -19); c.closePath(); }, '#bdb6a6', { k: 0.8, lw: 1.6 });
  cel(c, outer, '#bdb6a6', {
    k: 1.8, lw: 2.2, sh: 'rgba(40,34,50,.32)', inn: function (c) {
      c.strokeStyle = 'rgba(60,50,40,.4)'; c.lineWidth = 1; c.strokeRect(-13, -17, 26, 34);
      [[-13.6, -17.6], [13.6, -17.6], [-13.6, 17.6]].forEach(function (q) { dot(c, q[0], q[1], 1.1, '#8f887c'); dot(c, q[0] - 0.3, q[1] - 0.3, 0.4, '#efe9dc'); });
      for (i = 0; i < 6; i++) { dot(c, -9 + i * 3.6, -18, 0.55, 'rgba(70,60,50,.5)'); }
    },
  });
  /* a foto: gente sem rosto, desbotada */
  c.save(); c.beginPath(); outer(c); c.clip();
  c.fillStyle = '#ddd5c4'; c.fillRect(-11, -15, 22, 30);
  var g = c.createRadialGradient(0, 0, 4, 0, 0, 19); g.addColorStop(0, 'rgba(255,250,240,.3)'); g.addColorStop(1, 'rgba(110,96,80,.35)'); c.fillStyle = g; c.fillRect(-11, -15, 22, 30);
  if (wd > 0) { g = c.createRadialGradient(1, -2, 1, 1, -2, 18); g.addColorStop(0, 'rgba(255,61,138,' + 0.45 * wd + ')'); g.addColorStop(1, 'rgba(255,61,138,0)'); c.fillStyle = g; c.fillRect(-11, -15, 22, 30); }
  c.beginPath(); c.moveTo(-11, 15); c.quadraticCurveTo(-10, 4.6, 0, 3.6); c.quadraticCurveTo(10, 4.6, 11, 15); c.closePath(); c.fillStyle = '#9b938b'; c.fill();
  c.beginPath(); c.ellipse(0.4, -3.4, 5.2, 6.2, 0, 0, TAU); c.fillStyle = '#a49c94'; c.fill();
  c.beginPath(); c.ellipse(0.4, -6.6, 5.6, 3.6, 0, PI, TAU); c.fillStyle = '#857d76'; c.fill();
  /* manchas e riscos de foto velha */
  c.fillStyle = 'rgba(255,252,240,.35)'; c.beginPath(); c.ellipse(-5, 8, 5, 3, 0.4, 0, TAU); c.fill();
  ln(c, [-8, -12, -2, 9], 'rgba(255,255,250,.35)', 0.7); ln(c, [6, -13, 9, -2], 'rgba(255,255,250,.3)', 0.6);
  dot(c, 6, 9, 1.6, 'rgba(120,100,80,.2)'); dot(c, -7, -9, 1.2, 'rgba(120,100,80,.2)');
  c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(-11, -15, 22, 30);
  c.restore();
  var es = 1 + wd * 0.4; glow(c, 2.6, -3.8, 1.1 * es, 1.4 * es, EYE, EYEG, 7); glow(c, -0.6, -3.8, 0.9 * es, 1.2 * es, EYE, EYEG, 7);
  /* borda do rasgo: fibra branca */
  var Jp = []; J.forEach(function (p) { Jp.push(p[0], p[1]); });
  ln(c, Jp, OUT, 3.2); ln(c, Jp, PW, 1.6);
  for (i = 0; i < J.length - 1; i++) { var mx = (J[i][0] + J[i + 1][0]) / 2, my = (J[i][1] + J[i + 1][1]) / 2; ln(c, [mx, my, mx + 1.4, my + 1.2], 'rgba(255,255,255,.9)', 0.6); }
  /* a lasca que dispara */
  if (sh > 0) {
    c.save(); c.globalAlpha = Math.min(1, sh * 1.5); var sx = 17 + sh * 12;
    for (i = 0; i < 3; i++) ln(c, [sx - 8 - i * 2, 2 + i * 2.4, sx - 16 - i * 3, 2 + i * 2.4], GR + '.45)', 0.8);
    cel(c, function (c) { poly(c, [sx - 5, 1, sx + 7, 4, sx - 4, 7.6, sx - 2, 4.2]); }, PW, { k: 0.6, lw: 1.5 });
    glow(c, sx + 5, 4, 1.4, 1, EYE, EYEG, 6);
    c.restore();
  }
  c.restore();
}

/* ---------------- Esquecido: estátua grande sem rosto ---------------- */
function drawEsquecido(c, anim, k) {
  var mv = anim === 'move', w = k * TAU, a = anim === 'atk' ? k : 0, up = sm(cl(a / 0.66)), sl = sm(cl((a - 0.66) / 0.34)),
    st = mv ? Math.sin(w) : 0, co = mv ? Math.cos(w) : 0, b = mv ? Math.abs(co) * 2 : 0, S1 = '#d3cec6', S2 = '#b9b3aa', S3 = '#958f88', CR = 'rgba(50,44,56,.5)', i,
    hy = -27 - b + sl * 3, lean = mv ? st * 0.035 : lp(-0.07 * up, 0.36, sl), AO = { k: 2, lw: 2.3, sh: 'rgba(40,34,50,.34)' };
  var f1 = mv ? [8 + st * 6, -Math.max(0, -co) * 4] : [lp(8, 11, sl), 0], f2 = mv ? [-6 - st * 6, -Math.max(0, co) * 4] : [lp(-6, -9, sl), 0];
  function rotP(x, y) { var dx = x, dy = y - hy, cs = Math.cos(lean), sn = Math.sin(lean); return [dx * cs - dy * sn, hy + dx * sn + dy * cs]; }
  function leg(hx, f, far) {
    var kn = ik(hx, hy, f[0], f[1] - 5, 14, 14, -1), col = far ? S2 : S1;
    cel(c, function (c) { cap(c, kn[0], kn[1], f[0], f[1] - 5, 5); }, col, AO);
    cel(c, function (c) { poly(c, [f[0] - 6, f[1], f[0] - 6, f[1] - 6, f[0] + 6, f[1] - 7, f[0] + 10, f[1] - 2, f[0] + 10, f[1]]); }, far ? S3 : S2, { k: 1.4, lw: 2.2, inn: function (c) { ln(c, [f[0] + 3, f[1] - 4, f[0] + 3.4, f[1] - 0.5], CR, 0.9); ln(c, [f[0] + 6.4, f[1] - 3.4, f[0] + 6.6, f[1] - 0.5], CR, 0.9); } });
    return kn;
  }
  /* braço de trás */
  c.save(); c.translate(0, hy); c.rotate(lean); c.translate(0, -hy);
  var HB = mv ? [-17 + st * 4, -30 - b] : [lp(lp(-17, -3, up), 13, sl), lp(lp(-30, -86, up), -24, sl)];
  var kb = arm2(c, -15, -55 - b + sl * 3, HB[0], HB[1], 16, 16, -1, 5.4, 5, S3, S2, AO);
  cel(c, function (c) { el(c, HB[0], HB[1], 6.4, 5.8, 0.3); }, S2, { k: 1.6, lw: 2.2, inn: function (c) { ln(c, [HB[0] + 1, HB[1] - 5, HB[0] + 2, HB[1] + 4], CR, 1); } });
  c.restore();
  leg(-6, f2, true);
  leg(6, f1, false);
  c.save(); c.translate(0, hy); c.rotate(lean); c.translate(0, -hy);
  var yb = -b + sl * 3;
  /* saiote de pano de pedra */
  cel(c, function (c) { c.moveTo(-13, -31 + yb); c.lineTo(13, -31 + yb); c.quadraticCurveTo(16, -22 + yb, 15, -13 + yb); c.lineTo(9, -15 + yb); c.lineTo(4, -12 + yb); c.lineTo(-2, -15 + yb); c.lineTo(-8, -12.4 + yb); c.lineTo(-15, -14 + yb); c.quadraticCurveTo(-16, -22 + yb, -13, -31 + yb); c.closePath(); }, S2, {
    k: 2, lw: 2.3, sh: 'rgba(40,34,50,.34)', inn: function (c) { [-9, -4, 1, 6, 11].forEach(function (x) { ln(c, [x, -30 + yb, x + 1.2, -14 + yb], CR, 1.1); }); },
  });
  /* tronco largo, com a faixa da toga */
  function body(c) { c.moveTo(-12, -29 + yb); c.bezierCurveTo(-15, -38 + yb, -20, -48 + yb, -17, -56 + yb); c.quadraticCurveTo(0, -63 + yb, 17, -56 + yb); c.bezierCurveTo(20, -48 + yb, 15, -38 + yb, 12, -29 + yb); c.quadraticCurveTo(0, -26 + yb, -12, -29 + yb); c.closePath(); }
  cel(c, body, S1, {
    k: 2.8, lw: 2.5, sh: 'rgba(40,34,50,.34)', inn: function (c) {
      c.fillStyle = 'rgba(255,255,250,.3)'; c.beginPath(); c.moveTo(-17, -55 + yb); c.lineTo(-10, -58 + yb); c.lineTo(14, -32 + yb); c.lineTo(8, -28 + yb); c.closePath(); c.fill();
      [[-13, -52, 9, -30], [-10, -55, 12, -33]].forEach(function (q) { ln(c, [q[0], q[1] + yb, q[2], q[3] + yb], CR, 1); });
      /* entalhe gasto no peito: um sol apagado */
      c.beginPath(); c.arc(-3, -42 + yb, 4.4, 0, TAU); c.strokeStyle = 'rgba(60,54,66,.3)'; c.lineWidth = 1.1; c.stroke();
      for (i = 0; i < 8; i++) { var an = i * 0.785; if (i % 3 === 1) continue; ln(c, [-3 + Math.cos(an) * 5.6, -42 + yb + Math.sin(an) * 5.6, -3 + Math.cos(an) * 7.6, -42 + yb + Math.sin(an) * 7.6], 'rgba(60,54,66,.28)', 1); }
      ln(c, [5, -50 + yb, 8, -45 + yb, 6, -40 + yb, 10, -36 + yb], CR, 1); ln(c, [-14, -37 + yb, -10, -34 + yb], CR, 0.9);
      dot(c, 10, -44 + yb, 1.4, 'rgba(60,54,66,.25)'); dot(c, -8, -32 + yb, 1, 'rgba(60,54,66,.25)');
    },
  });
  tear(c, -12.5, -53.5 + yb, 4, 2.2, 0.5, 13);
  /* pescoço e cabeça lisa, rachada */
  cel(c, function (c) { cap(c, 1, -58 + yb, 2, -62 + yb, 5); }, S2, { k: 1, lw: 2.1 });
  function head(c) { el(c, 2, -70 + yb, 8.2, 9.8, 0.06); }
  cel(c, head, S1, { k: 2.4, lw: 2.4, sh: 'rgba(40,34,50,.34)', inn: function (c) { c.fillStyle = 'rgba(255,255,250,.3)'; c.beginPath(); c.ellipse(-1, -75 + yb, 3, 4, -0.4, 0, TAU); c.fill(); ln(c, [-5, -64 + yb, -2, -61 + yb], CR, 0.9); } });
  /* a rachadura do rosto é de vazio, e os olhos moram nela */
  c.beginPath(); poly(c, [-3, -78 + yb, 1, -73.6 + yb, 3.4, -72 + yb, 7.6, -71.6 + yb, 10.2, -68 + yb, 9.6, -66.6 + yb, 6.6, -69.2 + yb, 2.6, -70.2 + yb, 0, -72 + yb]);
  c.fillStyle = VOID; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.lineJoin = 'round'; c.stroke();
  glow(c, 4.6, -71.4 + yb, 1.4, 1.1, EYE, EYEG, 8); glow(c, 8.2, -69.6 + yb, 1.2, 1, EYE, EYEG, 8);
  ln(c, [10, -67 + yb, 9.4, -63 + yb], CR, 0.9);
  /* braço da frente */
  var HF = mv ? [18 - st * 4, -30 - b] : [lp(lp(18, 7, up), 22, sl), lp(lp(-30, -88, up), -24, sl)];
  arm2(c, 15, -55 + yb, HF[0], HF[1], 16, 16, 1, 5.6, 5.2, S1, S1, AO);
  cel(c, function (c) { el(c, HF[0], HF[1], 7, 6.4, -0.2); }, S1, { k: 1.8, lw: 2.3, sh: 'rgba(40,34,50,.34)', inn: function (c) { [-2, 1.4, 4.6].forEach(function (d) { ln(c, [HF[0] + d, HF[1] - 5.6, HF[0] + d + 0.4, HF[1] - 1.6], CR, 1); }); } });
  c.restore();
  /* impacto no chão */
  if (sl > 0.5) {
    var P = rotP(22, -24), x = P[0] + 4, al = (sl - 0.5) * 2;
    c.save(); c.globalAlpha = al;
    [[-12, 0, 7], [-3, -3, 9], [8, -2, 8], [17, 0, 6]].forEach(function (q) { cel(c, function (c) { el(c, x + q[0], q[1] - 2, q[2], q[2] * 0.6); }, 'rgba(240,236,228,.9)', { k: 1, lw: 1.4, out: 'rgba(46,40,60,.5)' }); });
    [[-14, 0, -24, 2, -30, 0], [16, 0, 24, 3, 32, 1], [2, 0, 4, 3, 1, 5]].forEach(function (q) { ln(c, [x + q[0], q[1], x + q[2], q[3], x + q[4], q[5]], OUT, 1.4); });
    [[-18, -14], [22, -16], [6, -20]].forEach(function (q, n) { cel(c, function (c) { poly(c, [x + q[0], q[1], x + q[0] + 2.6, q[1] - 1, x + q[0] + 2, q[1] + 2]); }, S2, { k: 0, lw: 1 }); });
    c.restore();
  }
}

/* ---------------- Silêncio: figura de capuz com a mão sobre a boca ---------------- */
function drawSilencio(c, anim, k) {
  var ph = k * TAU, a = anim === 'atk' ? k : 0, rs = sm(cl(a / 0.6)), rl = sm(cl((a - 0.45) / 0.55)), bob = Math.sin(ph) * 1.4, R1 = '#d8d4dc', R2 = '#bcb7c4', TR = '#5a536c', i,
    base = -3 - bob, AO = { k: 1.6, lw: 2.1 };
  function hem(c, close) { for (var j = 8; j >= 0; j--) { var x = -15 + j * 4, d = j % 2 ? 4.6 + Math.sin(ph + j) * 1.6 : Math.sin(ph + j * 1.3) * 0.8; c.lineTo(x, base + d); } }
  function robe(c) { c.moveTo(-15, base); c.bezierCurveTo(-14, base - 18, -12, -34 - bob, -9, -43 - bob); c.quadraticCurveTo(0, -47 - bob, 9, -43 - bob); c.bezierCurveTo(12, -34 - bob, 15, base - 18, 17, base); hem(c); c.closePath(); }
  /* mão livre: escondida na manga, atrás; sobe para a frente no feitiço */
  var HX = lp(-12, 22, rs), HY = lp(-22, -44, rs) - bob;
  function freeArm() {
    var sx = rs > 0.3 ? 3 : -8, sy = -40 - bob, ang = Math.atan2(HY - sy, HX - sx);
    cel(c, function (c) { var nx = -Math.sin(ang), ny = Math.cos(ang), ex = HX - Math.cos(ang) * 3, ey = HY - Math.sin(ang) * 3; c.moveTo(sx + nx * 3.4, sy + ny * 3.4); c.lineTo(ex + nx * 5.4, ey + ny * 5.4); c.lineTo(ex - nx * 5.4, ey - ny * 5.4); c.lineTo(sx - nx * 3.4, sy - ny * 3.4); c.closePath(); }, R2, AO);
    if (rs > 0.15) {
      cel(c, function (c) { el(c, HX + 1, HY, 2.6, 3, 0); }, P1, { k: 0.6, lw: 1.6 });
      [-0.9, -0.3, 0.3, 0.9].forEach(function (d, n) { var fx = HX + 1.6 + Math.cos(-1.2 + d * 0.5) * 5, fy = HY - 1 + Math.sin(-1.2 + d * 0.5) * 5.6; ln(c, [HX + 1.4 + d, HY - 1.6, fx + d, fy], OUT, 2.4); ln(c, [HX + 1.4 + d, HY - 1.6, fx + d, fy], P1, 1.1); });
    }
  }
  if (rs <= 0.3) freeArm();
  cel(c, robe, R1, {
    k: 2.2, lw: 2.2, sh: 'rgba(40,34,56,.3)', inn: function (c) {
      [[-6, -40, -10, -6], [1, -42, 1, -6], [7, -40, 11, -6]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1] - bob); c.quadraticCurveTo(q[0] + Math.sin(ph + q[0]) * 2, (q[1] + base) / 2, q[2], base); c.strokeStyle = 'rgba(60,52,80,.28)'; c.lineWidth = 1.1; c.stroke(); });
      c.beginPath(); c.moveTo(-17, base - 1.6); hem(c); c.lineTo(19, base - 1.6); c.strokeStyle = TR; c.globalAlpha = 0.7; c.lineWidth = 2.6; c.stroke(); c.globalAlpha = 1;
      /* sinais de "não" bordados, quase apagados */
      [[-8, -14], [4, -20], [9, -9]].forEach(function (q) { c.beginPath(); c.arc(q[0], q[1] - bob, 2, 0, TAU); c.strokeStyle = 'rgba(70,62,90,.3)'; c.lineWidth = 0.8; c.stroke(); ln(c, [q[0] - 1.4, q[1] + 1.4 - bob, q[0] + 1.4, q[1] - 1.4 - bob], 'rgba(70,62,90,.3)', 0.8); });
    },
  });
  /* ponta do capuz caindo para trás */
  cel(c, function (c) { c.moveTo(-6, -60 - bob); c.quadraticCurveTo(-13, -63 - bob, -16 + Math.sin(ph) * 1.2, -58 - bob); c.quadraticCurveTo(-11, -58 - bob, -8, -54 - bob); c.closePath(); }, R2, AO);
  /* capuz */
  cel(c, function (c) { c.moveTo(-10, -42 - bob); c.bezierCurveTo(-14, -52 - bob, -9, -63 - bob, 0, -64 - bob); c.bezierCurveTo(9, -64.5 - bob, 15, -56 - bob, 14, -46 - bob); c.quadraticCurveTo(12, -40 - bob, 4, -39 - bob); c.quadraticCurveTo(-4, -38 - bob, -10, -42 - bob); c.closePath(); }, R1, {
    k: 2, lw: 2.2, sh: 'rgba(40,34,56,.3)', inn: function (c) { c.beginPath(); c.moveTo(-6, -59 - bob); c.quadraticCurveTo(-8, -50 - bob, -4, -42 - bob); c.strokeStyle = 'rgba(60,52,80,.3)'; c.lineWidth = 1.1; c.stroke(); },
  });
  /* a abertura do capuz é vazio */
  c.beginPath(); c.ellipse(7.4, -50.6 - bob, 5.4, 7.6, -0.15, 0, TAU); c.fillStyle = VOID; c.fill(); c.strokeStyle = TR; c.lineWidth = 2.4; c.stroke(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke();
  glow(c, 7.6, -53.4 - bob, 1.1, 1.4, EYE, EYEG, 7); glow(c, 10.4, -53 - bob, 0.95, 1.25, EYE, EYEG, 7);
  /* braço da frente: a mão tapa a boca */
  cel(c, function (c) { c.moveTo(4, -41 - bob); c.quadraticCurveTo(10, -36 - bob, 14.4, -37 - bob); c.lineTo(15.6, -43 - bob); c.quadraticCurveTo(9, -42 - bob, 5, -44 - bob); c.closePath(); }, R2, AO);
  cel(c, function (c) { el(c, 13.4, -46.4 - bob, 2.8, 3.2, 0.2); }, P1, { k: 0.7, lw: 1.6 });
  for (i = 0; i < 4; i++) { var fy = -48.4 + i * 1.5 - bob; ln(c, [13, fy, 7.6 + i * 0.4, fy - 0.6 + i * 0.3], OUT, 2.3); ln(c, [13, fy, 7.6 + i * 0.4, fy - 0.6 + i * 0.3], P1, 1.1); }
  if (rs > 0.3) freeArm();
  /* ondas de silêncio e o sinal que apaga feitiços */
  if (rl > 0) {
    c.save(); c.globalAlpha = rl; c.setLineDash([2.4, 2.6]);
    for (i = 0; i < 3; i++) { var r = 5 + i * 5 + rl * 6; c.beginPath(); c.arc(HX + 3, HY - 2, r, -0.9, 0.9); c.lineCap = 'round'; c.strokeStyle = GR + '.5)'; c.lineWidth = 3; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 1.5; c.stroke(); }
    c.setLineDash([]);
    if (rl > 0.6) { var sx = HX + 18, sy = HY - 3, s2 = (rl - 0.6) / 0.4; glow(c, sx, sy, 6 * s2, 6 * s2, 'rgba(255,224,240,.5)', EYEG, 8); c.beginPath(); c.arc(sx, sy, 5.4, 0, TAU); c.strokeStyle = OUT; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = PW; c.lineWidth = 1.8; c.stroke(); ln(c, [sx - 3.8, sy + 3.8, sx + 3.8, sy - 3.8], OUT, 3.4); ln(c, [sx - 3.8, sy + 3.8, sx + 3.8, sy - 3.8], '#ff8fbb', 1.8); }
    c.restore();
  }
  /* letras se apagando em volta */
  for (i = 0; i < 3; i++) { var u = (k + i / 3) % 1, x = -12 + i * 6 + Math.sin(u * 6 + i) * 2, y = -40 - u * 22 - bob; c.beginPath(); c.moveTo(x - 1.6, y); c.quadraticCurveTo(x - 0.6, y - 2, x, y); c.quadraticCurveTo(x + 0.6, y + 2, x + 1.6, y); c.strokeStyle = GR + (0.6 * (1 - u)) + ')'; c.lineWidth = 0.8; c.stroke(); }
}

/* ---------------- O Esquecimento (chefão final) ---------------- */
/* névoa e papel apagado, um vazio no lugar do rosto, mãos que apagam */
function drawEsq(c, A, k) {
  var ph = k * TAU, at = A === 'atk' ? k : -1, cs = A === 'cast' ? sm(k) : 0, dn = A === 'down' ? 1 : 0, sp = A === 'special' ? 1 : 0, mv = A === 'move' ? 1 : 0, i, j,
    br = Math.sin(ph), hov = dn ? 3 + br * 0.5 : 13 + br * 2.6, lean = mv * 0.12 + (at >= 0 ? lp(-0.1, 0.14, sm(at)) : 0) + dn * 0.16 - cs * 0.05,
    Y = -hov, SH = Y - (dn ? 58 : 74), HX = 4 + dn * 3, HY = SH - 15 + dn * 3, vo = sp ? 1.75 + Math.sin(ph) * 0.18 : dn ? 0.7 : 1 + cs * 0.08, hs2 = sp ? 1.4 : 1.18;
  var LT = '#ebe8ee', AO = { k: 1.6, lw: 2, sh: 'rgba(50,42,72,.26)' };
  /* chão: poça de névoa e um anel de chão apagado */
  c.beginPath(); c.ellipse(2, -1, 46, 8, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,.4)'; c.fill();
  c.save(); c.setLineDash([3, 4]); c.beginPath(); c.ellipse(2, -1, 52 + br * 2, 9.5, 0, 0, TAU); c.strokeStyle = 'rgba(60,52,80,.3)'; c.lineWidth = 1.2; c.stroke(); c.restore();
  /* aura de névoa atrás */
  var g = c.createRadialGradient(0, SH + 20, 10, 0, SH + 20, 92); g.addColorStop(0, 'rgba(236,232,244,.55)'); g.addColorStop(1, 'rgba(236,232,244,0)'); c.fillStyle = g; c.fillRect(-96, SH - 72, 192, 184);
  c.save(); c.translate(0, Y); c.rotate(lean); c.translate(0, -Y);
  /* papéis em órbita: os de trás */
  var orb = [];
  for (i = 0; i < 7; i++) {
    var an = ph + i * TAU / 7, ox, oy, os = 0.9 + hs(i) * 0.5, oa = 1;
    if (sp) { var u = (k + i / 7) % 1, rr = 56 * (1 - u); ox = HX + 5 + Math.cos(an * 1.6 + u * 5) * rr; oy = HY + 1 + Math.sin(an * 1.6 + u * 5) * rr * 0.7; os *= 0.4 + (1 - u) * 0.8; oa = Math.min(1, (1 - u) * 3); }
    else if (dn) { ox = HX + Math.cos(an * 2) * 14; oy = HY - 20 + Math.sin(an * 2) * 3.4; os *= 0.7; }
    else { ox = Math.cos(an) * 46; oy = SH + 26 + Math.sin(an) * 14 + Math.sin(an * 3) * 3; }
    orb.push([ox, oy, os, an * 0.7 + i, oa, sp ? Math.sin(an * 1.6) > 0 : Math.sin(an * (dn ? 2 : 1)) > 0]);
  }
  orb.forEach(function (o) { if (!o[5]) paperBit(c, o[0], o[1], o[2], o[3], o[4] * 0.85); });
  /* faixas de papel da capa, por trás */
  for (i = 0; i < 7; i++) {
    (function (i) {
      var x0 = -16 + i * 4.2, y0 = SH + 3 + Math.abs(i - 3) * 1.2, L = 68 + hs(i) * 8 - i * 3 - dn * 20, sw = Math.sin(ph + i * 0.9) * (3 + i * 0.3) * (dn ? 0.3 : 1), tr = -mv * 16 - (at >= 0 ? 8 * sm(at) : 0) - cs * 4, tx = x0 - 8 - (6 - i) * 2 + sw + tr, ty = y0 + L - (6 - i) * 1.5, wd = 5.6 - 0.25 * i;
      cel(c, function (c) { c.moveTo(x0 - wd, y0); c.quadraticCurveTo(x0 - wd + sw * 0.3 + tr * 0.3, y0 + L * 0.5, tx - wd * 0.6, ty - 2); c.lineTo(tx - wd * 0.1, ty + 2.6); c.lineTo(tx + wd * 0.3, ty - 0.6); c.lineTo(tx + wd * 0.7, ty + 3); c.quadraticCurveTo(x0 + wd + sw * 0.3 + tr * 0.3, y0 + L * 0.5, x0 + wd, y0); c.closePath(); }, i % 2 ? P2 : '#d6d2dc', {
        k: 1, lw: 1.6, sh: 'rgba(50,42,72,.26)', inn: function (c) { for (j = 0; j < 6; j++) { var yy = y0 + 8 + j * L / 7, xx = lp(x0, tx, (yy - y0) / L); ln(c, [xx - 2, yy, xx + 1.6, yy + 0.4], GR + '.3)', 0.7); } },
      });
      paperBit(c, tx + 2 + hs(i + 3) * 4, ty + 6 + ((k + hs(i)) % 1) * 6, 0.45, i + ph, 0.7 * (1 - (k + hs(i)) % 1));
    })(i);
  }
  /* braços: posições das mãos em cada gesto */
  var SB = [-13, SH + 5], SF = [12, SH + 5], HB, HF;
  if (sp) { HB = [-34, SH - 8 + br * 2]; HF = [36, SH - 12 - br * 2]; }
  else if (dn) { HB = [-24, Y - 6]; HF = [28, Y - 6]; }
  else if (at >= 0) {
    var K = [[22, SH - 4], [2, SH - 20], [40, SH + 22], [42, Y - 30]], s = at * 3, n = Math.min(2, Math.floor(s)), f = sm(s - n);
    HF = [lp(K[n][0], K[n + 1][0], f), lp(K[n][1], K[n + 1][1], f)]; HB = [-22, Y - 30];
  } else if (cs > 0) { HF = [lp(24, 28, cs), lp(Y - 28, SH - 24, cs)]; HB = [lp(-22, -30, cs), lp(Y - 30, SH + 6, cs)]; }
  else if (mv) { HB = [-30, Y - 32 + br]; HF = [28, Y - 36 - br]; }
  else { HB = [-24, Y - 28 + br * 1.5]; HF = [25, Y - 30 - br * 1.5]; }
  /* mão que apaga: dedos compridos, pontas se desfazendo em luz */
  function hand(x, y, ang, col, lit) {
    if (lit > 0) { var hg = c.createRadialGradient(x, y, 1, x, y, 15); hg.addColorStop(0, 'rgba(255,255,255,' + 0.85 * lit + ')'); hg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hg; c.fillRect(x - 16, y - 16, 32, 32); }
    [[-0.55, 8.4], [-0.18, 10], [0.18, 9.6], [0.52, 8]].forEach(function (q) { var a2 = ang + q[0], mx = x + Math.cos(a2) * q[1] * 0.55, my = y + Math.sin(a2) * q[1] * 0.55, ex = x + Math.cos(a2 + 0.12) * q[1], ey = y + Math.sin(a2 + 0.12) * q[1]; ln(c, [x, y, mx, my, ex, ey], OUT, 3.4); ln(c, [x, y, mx, my, ex, ey], col, 1.8); dot(c, ex, ey, 1.3, 'rgba(255,255,255,.9)'); });
    var ta = ang - 1.25; ln(c, [x, y, x + Math.cos(ta) * 6.4, y + Math.sin(ta) * 6.4], OUT, 3.4); ln(c, [x, y, x + Math.cos(ta) * 6.4, y + Math.sin(ta) * 6.4], col, 1.8);
    cel(c, function (c) { el(c, x, y, 4.2, 3.6, ang); }, col, { k: 0.9, lw: 1.8 });
  }
  function limb(S, H, pref, col, col2, lit) {
    var k1 = ik(S[0], S[1], H[0], H[1], 26, 25, 1), k2 = ik(S[0], S[1], H[0], H[1], 26, 25, -1), kk = Math.abs(k1[1] - k2[1]) < 3 ? ((k1[0] - k2[0]) * pref > 0 ? k1 : k2) : (k1[1] > k2[1] ? k1 : k2);
    /* antebraço fino e pálido */
    cel(c, function (c) { cap(c, kk[0], kk[1], H[0], H[1], 2.4); }, col2, { k: 0.8, lw: 1.8 });
    /* manga de sino, de papel, rasgada na boca */
    var a1 = Math.atan2(kk[1] - S[1], kk[0] - S[0]), ca = Math.cos(a1), sa = Math.sin(a1), nx = -sa, ny = ca, L = Math.hypot(kk[0] - S[0], kk[1] - S[1]) * 1.08, ex = S[0] + ca * L, ey = S[1] + sa * L, fl = Math.sin(ph + pref) * 1.2;
    cel(c, function (c) { c.moveTo(S[0] + nx * 5.4, S[1] + ny * 5.4); c.quadraticCurveTo(S[0] + ca * L * 0.6 + nx * 6.4, S[1] + sa * L * 0.6 + ny * 6.4, ex + nx * 10 + ca * fl, ey + ny * 10 + sa * fl);
      for (var m = 1; m < 6; m++) { var u = m / 6, dd = m % 2 ? -2.6 : 0.6; c.lineTo(ex + nx * (10 - 20 * u) + ca * (dd + fl * (1 - u)), ey + ny * (10 - 20 * u) + sa * (dd + fl * (1 - u))); }
      c.lineTo(ex - nx * 10, ey - ny * 10); c.quadraticCurveTo(S[0] + ca * L * 0.6 - nx * 6, S[1] + sa * L * 0.6 - ny * 6, S[0] - nx * 5.4, S[1] - ny * 5.4); c.closePath(); }, col, {
      k: 1.6, lw: 2, sh: 'rgba(50,42,72,.26)', inn: function (c) { ln(c, [S[0] + ca * L * 0.2, S[1] + sa * L * 0.2, ex - nx * 3, ey - ny * 3], GR + '.25)', 0.9); ln(c, [S[0] + ca * L * 0.3 + nx * 2, S[1] + sa * L * 0.3 + ny * 2, ex + nx * 5, ey + ny * 5], GR + '.2)', 0.8); writing(c, Math.min(S[0], ex) - 4, Math.min(S[1], ey) - 4, Math.max(S[0], ex) + 4, Math.max(S[1], ey) + 4, 3.2, GR + '.14)', 31); },
    });
    hand(H[0], H[1], Math.atan2(H[1] - kk[1], H[0] - kk[0]), col2, lit);
    return kk;
  }
  limb(SB, HB, -1, P2, '#d4d0da', cs * 0.5 + sp * 0.4);
  /* o corpo: folhas de papel em camadas que se desmancham em névoa embaixo */
  function robe(c) {
    c.moveTo(-3, SH - 3); c.bezierCurveTo(-12, SH - 3, -19, SH, -19.5, SH + 8); c.bezierCurveTo(-21, SH + 30, -27, Y - 24, -28, Y - 2);
    for (j = 0; j <= 12; j++) { var x = -28 + j * 4.8, d = (j % 2 ? 4 + hs(j + 3) * 4 : 0) + Math.sin(ph + j) * 1.2 * (1 - dn); c.lineTo(x, Y - 2 + d); }
    c.bezierCurveTo(26, Y - 26, 21, SH + 30, 20, SH + 8); c.bezierCurveTo(19.5, SH, 13, SH - 3, 4, SH - 3); c.closePath();
  }
  cel(c, robe, LT, {
    k: 3, lw: 2.4, sh: 'rgba(50,42,72,.26)', hi: 'rgba(255,255,255,.35)', inn: function (c) {
      /* folhas sobrepostas */
      [[-22, SH + 24, 6, SH + 16, 26, SH + 38], [-26, SH + 50, 0, SH + 40, 26, SH + 58]].forEach(function (q, n) {
        c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.lineTo(q[4], Y + 6); c.lineTo(q[0], Y + 6); c.closePath(); c.fillStyle = n ? 'rgba(200,196,210,.32)' : 'rgba(255,255,255,.3)'; c.fill();
        ln(c, [q[0], q[1], q[2], q[3], q[4], q[5]], GR + '.4)', 1);
      });
      for (j = 0; j < 5; j++) { var x0 = -12 + j * 6; c.beginPath(); c.moveTo(x0, SH + 6); c.quadraticCurveTo(x0 * 1.2 + Math.sin(ph + j) * 2, (SH + Y) / 2, x0 * 1.5, Y - 4); c.strokeStyle = 'rgba(70,60,96,.22)'; c.lineWidth = 1.2; c.stroke(); }
      writing(c, -14, SH + 9, 12, SH + 22, 2.8, GR + '.3)', 3); writing(c, -20, SH + 44, 4, SH + 56, 2.8, GR + '.24)', 8); writing(c, 6, SH + 62, 22, Y - 14, 2.8, GR + '.2)', 13);
      /* manchas de borracha */
      [[-8, SH + 34, 7, 3], [12, SH + 26, 5, 2.4], [-14, SH + 64, 8, 3.4]].forEach(function (q) { c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(q[0], q[1], q[2], q[3], -0.3, 0, TAU); c.fill(); });
      /* a barra vira névoa */
      var mg = c.createLinearGradient(0, Y - 30, 0, Y + 6); mg.addColorStop(0, 'rgba(255,255,255,0)'); mg.addColorStop(1, 'rgba(255,255,255,.9)'); c.fillStyle = mg; c.fillRect(-40, Y - 30, 80, 40);
    },
  });
  tear(c, -6, SH + 22, 6, 3, -0.3, 11); tear(c, 9, SH + 47, 4.4, 2.4, 0.4, 17);
  if (dn) { tear(c, -12, SH + 38, 8, 4, 0.2, 23); tear(c, 13, SH + 20, 5.4, 3, -0.6, 29); }
  /* névoa na barra */
  for (i = 0; i < 9; i++) { var mx = -26 + i * 6.6 + Math.sin(ph + i * 1.7) * 2, my = Y - 1 + Math.sin(ph * 2 + i) * 1.2, mr = 6 + hs(i + 2) * 5; var mg2 = c.createRadialGradient(mx, my, 1, mx, my, mr); mg2.addColorStop(0, 'rgba(255,255,255,.9)'); mg2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = mg2; c.fillRect(mx - mr, my - mr, mr * 2, mr * 2); }
  for (i = 0; i < 4; i++) { var u2 = (k + i / 4) % 1, wx = -18 + i * 12; c.beginPath(); c.moveTo(wx, Y + 2); c.quadraticCurveTo(wx + 4 + Math.sin(ph + i) * 3, Y + 2 + (hov - 2) * 0.5, wx - 2 + u2 * 4, -1); c.strokeStyle = 'rgba(255,255,255,' + (0.7 - u2 * 0.4) + ')'; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke(); }
  /* gola de papel dobrado */
  for (i = 0; i < 7; i++) { (function (i) { var a0 = PI + 0.2 + i * 0.46, x = 1 + Math.cos(a0) * 13, y = SH + 1 + Math.sin(a0) * -4; cel(c, function (c) { poly(c, [x - 4, y + 2, x + Math.cos(a0) * 2, y - 6 + Math.abs(i - 3), x + 4, y + 2]); }, i % 2 ? PW : '#dcd8e2', { k: 0.8, lw: 1.5 }); })(i); }
  /* cabeça: capuz de papel amassado em volta de um buraco */
  c.save(); c.translate(HX, HY); c.rotate(dn * 0.35 + (at >= 0 ? -0.05 : 0)); c.scale(hs2, hs2);
  function hood(c) { c.moveTo(-13, 14); c.bezierCurveTo(-17, 2, -15, -14, -6, -19); c.quadraticCurveTo(-12, -25, -21, -25 + br); c.quadraticCurveTo(-9, -31, 2, -21); c.bezierCurveTo(12, -19, 18, -8, 16, 6); c.quadraticCurveTo(14, 14, 6, 16); c.quadraticCurveTo(-4, 18, -13, 14); c.closePath(); }
  cel(c, hood, LT, {
    k: 2.6, lw: 2.4, sh: 'rgba(50,42,72,.28)', hi: 'rgba(255,255,255,.4)', inn: function (c) {
      [[-12, 8, -8, -2, -11, -10, -6, -16], [-3, -18, 2, -12, -1, -6], [10, -14, 8, -6, 13, 0], [-8, 12, -2, 9, 4, 14]].forEach(function (q, n) { ln(c, q, n % 2 ? 'rgba(255,255,255,.7)' : 'rgba(70,60,96,.35)', 1); });
      writing(c, -14, -10, -6, 8, 2.6, GR + '.22)', 21);
    },
  });
  c.restore();
  /* o vazio do rosto */
  var fx = HX + 5 * hs2 + dn * 1, fy = HY + 1, rx = 7.6 * vo * 1.12, ry = 10.4 * vo * 1.12;
  function hole(c) { for (j = 0; j <= 30; j++) { var t = j / 30 * TAU, q = 1 + (hs(j % 30 + 40) - 0.5) * 0.14; c[j ? 'lineTo' : 'moveTo'](fx + Math.cos(t) * rx * q, fy + Math.sin(t) * ry * q); } c.closePath(); }
  if (sp) { var vg = c.createRadialGradient(fx, fy, rx * 0.8, fx, fy, rx * 3.2); vg.addColorStop(0, 'rgba(40,30,70,.35)'); vg.addColorStop(1, 'rgba(40,30,70,0)'); c.fillStyle = vg; c.fillRect(fx - rx * 3.4, fy - rx * 3.4, rx * 6.8, rx * 6.8); }
  c.beginPath(); hole(c); c.lineJoin = 'round'; c.strokeStyle = OUT; c.lineWidth = 5.6; c.stroke(); c.strokeStyle = PW; c.lineWidth = 3.4; c.stroke();
  var hg2 = c.createRadialGradient(fx + 1, fy, 1, fx, fy, ry); hg2.addColorStop(0, '#000'); hg2.addColorStop(0.75, '#0c0818'); hg2.addColorStop(1, '#2d2350'); c.fillStyle = hg2; c.fill();
  c.save(); c.clip();
  for (i = 0; i < 16; i++) { var sa = i * 2.4 + ph * (sp ? 1.4 : 0.25), sr = (0.15 + hs(i + 60) * 0.8) * (sp ? ((1 - ((k * 2 + hs(i)) % 1)) * 1) : 1); dot(c, fx + Math.cos(sa) * rx * sr, fy + Math.sin(sa) * ry * sr, 0.35 + hs(i + 70) * 0.5, 'rgba(255,255,255,' + (0.3 + hs(i + 80) * 0.6) + ')'); }
  if (sp) for (j = 0; j < 3; j++) { c.beginPath(); for (i = 0; i <= 30; i++) { var t = i / 30, ang = t * 6 + j * 2.09 - ph * 1.2; c[i ? 'lineTo' : 'moveTo'](fx + Math.cos(ang) * rx * t, fy + Math.sin(ang) * ry * t); } c.strokeStyle = 'rgba(200,180,255,.38)'; c.lineWidth = 1.4; c.stroke(); }
  c.beginPath(); hole(c); c.strokeStyle = 'rgba(205,185,255,.4)'; c.lineWidth = 2.4; c.stroke();
  c.restore();
  /* franja de papel rasgado na borda do buraco */
  for (i = 0; i < 9; i++) { var ta = i / 9 * TAU + 0.3, tx = fx + Math.cos(ta) * rx * 1.04, ty = fy + Math.sin(ta) * ry * 1.04, tl = 1.4 + hs(i + 90) * 1.4; c.beginPath(); c.moveTo(tx + Math.cos(ta + 1.57) * 2.2, ty + Math.sin(ta + 1.57) * 2.2); c.quadraticCurveTo(tx - Math.cos(ta) * tl * 1.4, ty - Math.sin(ta) * tl * 1.4, tx - Math.cos(ta + 1.57) * 2.2, ty - Math.sin(ta + 1.57) * 2.2); c.closePath(); c.fillStyle = 'rgba(247,245,240,.9)'; c.fill(); }
  /* olhos lá no fundo */
  var ea = dn ? 0.35 : 1, ez = sp ? 1.5 : 1;
  glow(c, fx + 1.2 * vo, fy - 1.8 * vo, 1.4 * ez, 1.8 * ea * ez, EYE, EYEG, 9); glow(c, fx + 4.6 * vo, fy - 2 * vo, 1.2 * ez, 1.6 * ea * ez, EYE, EYEG, 9);
  /* braço da frente */
  limb(SF, HF, 1, LT, PW, (at >= 0 ? sm(at) * 0.7 : 0) + cs + sp * 0.4);
  /* papéis em órbita: os da frente */
  orb.forEach(function (o) { if (o[5]) paperBit(c, o[0], o[1], o[2], o[3], o[4]); });
  /* letras escapando do corpo */
  for (i = 0; i < 5; i++) { var u3 = (k + i / 5) % 1, lx = -14 + i * 7 + Math.sin(u3 * 6 + i) * 3, ly = SH + 4 - u3 * 30; c.beginPath(); c.moveTo(lx - 2, ly); c.quadraticCurveTo(lx - 0.8, ly - 2.6, lx, ly); c.quadraticCurveTo(lx + 0.8, ly + 2.6, lx + 2, ly); c.strokeStyle = GR + (0.7 * (1 - u3)) + ')'; c.lineWidth = 0.9; c.stroke(); }
  /* a varrida da mão */
  if (at > 0.4) {
    var sw = sm((at - 0.4) / 0.6), a1 = -1.5, a2 = lp(-1.2, 0.95, sw), R0 = 50;
    c.save(); c.lineCap = 'round';
    c.beginPath(); c.arc(SF[0], SF[1], R0, a1, a2); c.strokeStyle = GR + '.35)'; c.lineWidth = 13; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 11; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 4.6; c.stroke();
    for (i = 0; i < 6; i++) { var pa = lp(a1, a2, i / 6 + 0.06), pr = R0 + (hs(i + 30) - 0.5) * 16; paperBit(c, SF[0] + Math.cos(pa) * pr, SF[1] + Math.sin(pa) * pr, 0.5, pa * 3 + i, sw * 0.9); }
    c.restore();
  }
  /* a borracha de luz */
  if (cs > 0) {
    var ex = HF[0] + 2, ey = HF[1] - 8, bl = 8 + cs * 4;
    var eg = c.createRadialGradient(ex, ey, 2, ex, ey, 26 * cs + 4); eg.addColorStop(0, 'rgba(255,255,255,' + 0.9 * cs + ')'); eg.addColorStop(0.5, 'rgba(255,214,236,' + 0.4 * cs + ')'); eg.addColorStop(1, 'rgba(255,214,236,0)'); c.fillStyle = eg; c.fillRect(ex - 32, ey - 32, 64, 64);
    c.save(); c.translate(ex, ey); c.rotate(-0.5);
    c.beginPath(); c.moveTo(-bl + 2.6, -3.4); c.lineTo(bl - 2.6, -3.4); c.quadraticCurveTo(bl, -3.4, bl, 0); c.quadraticCurveTo(bl, 3.4, bl - 2.6, 3.4); c.lineTo(-bl + 2.6, 3.4); c.quadraticCurveTo(-bl, 3.4, -bl, 0); c.quadraticCurveTo(-bl, -3.4, -bl + 2.6, -3.4); c.closePath();
    c.fillStyle = PW; c.fill(); c.strokeStyle = '#ff7fb0'; c.lineWidth = 1.6; c.stroke(); c.fillStyle = 'rgba(255,190,220,.6)'; c.fillRect(-bl + 3, -3.4, bl * 0.6, 6.8);
    c.restore();
    if (cs > 0.55) {
      var bw = (cs - 0.55) / 0.45, gx = ex + 30, gy = -hov + 0;
      var bg = c.createLinearGradient(ex, ey, gx, gy); bg.addColorStop(0, 'rgba(255,255,255,' + 0.95 * bw + ')'); bg.addColorStop(1, 'rgba(255,255,255,' + 0.5 * bw + ')');
      c.beginPath(); c.moveTo(ex - 4, ey + 2); c.lineTo(ex + 6, ey - 2); c.lineTo(gx + 16, gy - 2); c.lineTo(gx - 14, gy + 2); c.closePath(); c.fillStyle = bg; c.fill();
      c.beginPath(); c.ellipse(gx, gy, 22 * bw, 4.4 * bw, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,' + 0.9 * bw + ')'; c.fill(); c.strokeStyle = GR + (0.3 * bw) + ')'; c.lineWidth = 1; c.stroke();
      for (i = 0; i < 5; i++) star(c, lp(ex, gx, 0.2 + i * 0.18) + (hs(i) - 0.5) * 14, lp(ey, gy, 0.2 + i * 0.18), 1.6 + hs(i + 3), '#fff4fa');
    }
  }
  c.restore();
  /* derrubado: pedaços dele se apagam de verdade */
  if (dn) {
    c.save(); c.globalCompositeOperation = 'destination-out';
    for (i = 0; i < 34; i++) { var qx = -26 + hs(i * 3 + Math.floor(k * 2) * 0.5) * 56, qy = Y - 2 - hs(i * 7 + 1) * 54, qs = 1.4 + hs(i * 5 + 2) * 2.6; c.fillStyle = 'rgba(0,0,0,' + (0.6 + hs(i) * 0.4) + ')'; c.fillRect(qx, qy, qs, qs); }
    c.restore();
    /* papéis caídos no chão */
    [[-34, -1, 0.3], [-20, 0, -0.8], [30, -1, 1.2], [42, 0, 0.4], [14, 1, 2]].forEach(function (q) { c.save(); c.translate(q[0], q[1]); c.scale(1, 0.5); paperBit(c, 0, 0, 0.9, q[2], 0.9); c.restore(); });
  }
}

/* ---------------- Mico-leão-dourado (companheiro) ---------------- */
function drawMico(c, anim, k) {
  var GO = '#f29a2e', GO2 = '#d4761a', MN = '#ffc85a', FC = '#5b3322', FC2 = '#2e1a12', i, ph = k * TAU,
    mv = anim === 'walk', w = mv ? ph : 0, ac = anim === 'act' ? k : -1, b = mv ? Math.abs(Math.sin(w)) * 3 : Math.sin(ph) * 0.4,
    rot = 0, lift = 0, cr = 0, joy = 0;
  if (ac >= 0) { cr = ac === 0 ? 1 : 0; rot = ac < 1 ? sm(ac) * TAU * 0.92 : TAU; lift = ac < 1 ? Math.sin(ac * PI) * 20 : 5; joy = ac >= 1 ? 1 : 0; b = -cr * 3; }
  if (ac > 0) {
    c.save(); c.beginPath(); c.arc(0, -14 - lift * 0.6, 17, PI * 0.7, PI * 1.95); c.strokeStyle = 'rgba(150,90,20,.45)'; c.lineWidth = 1.4; c.setLineDash([3, 3]); c.stroke(); c.restore();
    if (joy) { star(c, 14, -38, 3.2, '#ffd23f'); star(c, -12, -34, 2.2, '#ffd23f'); }
  }
  c.save(); c.translate(0, -12 - lift); c.rotate(rot); c.translate(0, 12);
  var sw = Math.sin(ph + 1) * 2;
  /* rabo comprido */
  var T = bz(-8, -12 - b, -18, -12 - b, -26, -18 + sw - b, -24 + sw * 0.5, -30 - b, 9, 2.3, 1.5);
  cel(c, tube(T), GO2, { k: 1, lw: 1.7, inn: function (c) { for (i = 6; i < T.length; i++) dot(c, T[i][0], T[i][1], T[i][2] + 0.4, 'rgba(90,40,14,.5)'); } });
  function leg(x, y, fx, fy, col) { cel(c, function (c) { cap(c, x, y, fx, fy, 1.8); }, col, { k: 0.6, lw: 1.5 }); cel(c, function (c) { el(c, fx + 0.6, fy, 1.9, 1.2); }, FC, { k: 0.3, lw: 1.2 }); }
  var s1 = mv ? Math.sin(w) : 0, s2 = mv ? Math.sin(w + 1.4) : 0, u1 = mv ? Math.max(0, Math.cos(w)) * 2.4 : 0, u2 = mv ? Math.max(0, Math.cos(w + 1.4)) * 2.4 : 0;
  var crl = cr * 3, jy = joy;
  leg(-5, -10 - b, -7 + s1 * 4 + crl, -1.2 - u1 + cr, GO2); leg(6, -10 - b, 7 + s2 * 4 - jy * 2, -1.2 - u2 - jy * 8 + cr, GO2);
  /* corpo */
  cel(c, function (c) { el(c, 0, -12 - b, 9.6, 6.2, -0.06); }, GO, { k: 1.7, lw: 1.9, inn: function (c) { for (i = 0; i < 7; i++) ln(c, [-7 + i * 2.3, -15 - b + (i % 2), -6 + i * 2.3, -12.6 - b + (i % 2)], 'rgba(150,70,10,.4)', 0.8); c.fillStyle = 'rgba(255,230,150,.45)'; c.beginPath(); c.ellipse(-1, -16.4 - b, 6, 1.6, 0, 0, TAU); c.fill(); } });
  leg(-3, -9 - b, -4 - s1 * 4 + crl, -1 - u2 + cr, GO); leg(8, -9 - b, 9.5 - s2 * 4 + jy * 3, -1 - u1 - jy * 12 + cr, GO);
  /* juba de leão */
  var hx = 11, hy2 = -18 - b + cr * 1.4;
  cel(c, function (c) { for (var j = 0; j <= 30; j++) { var t = j / 30 * TAU, r = 7.6 * (1 + 0.13 * Math.sin(t * 8 + 0.5)); c[j ? 'lineTo' : 'moveTo'](hx - 1 + Math.cos(t) * r, hy2 - 1 + Math.sin(t) * r * 0.95); } c.closePath(); }, MN, {
    k: 1.6, lw: 1.9, sh: 'rgba(170,80,0,.32)', inn: function (c) { for (i = 0; i < 9; i++) { var a = i * 0.7 + 2; ln(c, [hx - 1 + Math.cos(a) * 3, hy2 - 1 + Math.sin(a) * 3, hx - 1 + Math.cos(a) * 6.6, hy2 - 1 + Math.sin(a) * 6.6], 'rgba(200,110,20,.45)', 0.8); } },
  });
  /* cara escura */
  cel(c, function (c) { el(c, hx + 2.6, hy2 + 0.6, 3.6, 4.4, 0.18); }, FC, { k: 1, lw: 1.5, inn: function (c) { c.fillStyle = 'rgba(160,100,70,.5)'; c.beginPath(); c.ellipse(hx + 3.6, hy2 + 2.8, 2, 1.4, 0, 0, TAU); c.fill(); } });
  [[hx + 1.8, hy2 - 0.6], [hx + 4.4, hy2 - 0.4]].forEach(function (e) { dot(c, e[0], e[1], 1.15, '#fff3dc'); dot(c, e[0] + 0.25, e[1], 0.75, FC2); dot(c, e[0] + 0.5, e[1] - 0.4, 0.3, '#fff'); });
  dot(c, hx + 5.2, hy2 + 2.2, 0.5, FC2); c.beginPath(); c.arc(hx + 4, hy2 + 3, 1.2, 0.3, 2.2); c.strokeStyle = FC2; c.lineWidth = 0.8; c.stroke();
  c.restore();
}

/* ---------------- Botinho: boto-cor-de-rosa numa bolha d'água (companheiro) ---------------- */
function drawBotinho(c, anim, k) {
  var ph = k * TAU, ac = anim === 'act' ? k : -1, wv = ac >= 0 ? sm(ac) : 0, PK = '#f49ab8', PK2 = '#dc6f92', PKL = '#ffd6e2', i,
    bob = Math.sin(ph) * 2, cy = -24 + bob, R = 19, sx = 1 + (ac >= 0 ? wv * 0.08 : Math.sin(ph * 2) * 0.03), sy = 1 - (ac >= 0 ? wv * 0.06 : Math.sin(ph * 2) * 0.03),
    fl = ac >= 0 ? lp(-0.9, 0.7, wv) : Math.sin(ph * 2) * 0.35, arch = ac >= 0 ? (1 - wv) * 3 - wv * 1 : Math.sin(ph) * 0.6;
  /* bolha: água por trás */
  c.save(); c.translate(0, cy); c.scale(sx, sy);
  var g = c.createRadialGradient(-5, -6, 2, 0, 0, R); g.addColorStop(0, 'rgba(190,236,255,.35)'); g.addColorStop(0.75, 'rgba(110,196,236,.42)'); g.addColorStop(1, 'rgba(70,160,220,.62)');
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fillStyle = g; c.fill();
  c.save(); c.beginPath(); c.arc(0, 0, R - 1, 0, TAU); c.clip();
  /* raios de luz dentro d'água */
  for (i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-10 + i * 8, -R); c.lineTo(-6 + i * 8, -R); c.lineTo(-2 + i * 9, R); c.lineTo(-8 + i * 9, R); c.closePath(); c.fillStyle = 'rgba(255,255,255,.1)'; c.fill(); }
  /* o boto */
  var TP = bz(-14, 5 + arch, -10, 8 + arch, -3, 4, 5, -2, 8, 2.2, 5.6), tn = TP.length - 1;
  c.save(); c.translate(TP[0][0], TP[0][1]); c.rotate(PI + 0.3 + fl);
  cel(c, function (c) { c.moveTo(-1, -1.6); c.bezierCurveTo(2, -3, 4, -7.4, 7.6, -8); c.quadraticCurveTo(5.4, -3, 5.6, 0); c.quadraticCurveTo(5.4, 3, 7.6, 8); c.bezierCurveTo(4, 7.4, 2, 3, -1, 1.6); c.closePath(); }, PK2, { k: 0.9, lw: 1.6 });
  c.restore();
  cel(c, tube(TP), PK, { k: 1.4, lw: 1.8, sh: 'rgba(160,40,80,.3)', hi: 'rgba(255,240,245,.4)', inn: function (c) { c.fillStyle = PKL; c.beginPath(); c.ellipse(-2, 6 + arch * 0.4, 7, 2, 0.3, 0, TAU); c.fill(); } });
  cel(c, function (c) { c.moveTo(-4, -1); c.quadraticCurveTo(-3, -6, 1, -6.4); c.quadraticCurveTo(-1, -3, 0, -0.6); c.closePath(); }, PK2, { k: 0.6, lw: 1.4 });
  /* cabeça com o melão e o bico comprido */
  cel(c, function (c) { cap(c, 9, -3, 17.6, -1.4, 1.9); }, PK2, { k: 0.6, lw: 1.5 });
  cel(c, function (c) { el(c, 7.4, -4, 6.4, 5.2, -0.15); }, PK, { k: 1.3, lw: 1.8, sh: 'rgba(160,40,80,.3)', inn: function (c) { c.fillStyle = 'rgba(255,240,245,.55)'; c.beginPath(); c.ellipse(6, -7.2, 3, 1.4, -0.3, 0, TAU); c.fill(); } });
  c.beginPath(); c.moveTo(10.6, -1); c.quadraticCurveTo(13.6, 0.2, 16.6, -0.6); c.strokeStyle = '#8a2c4c'; c.lineWidth = 0.8; c.lineCap = 'round'; c.stroke();
  dot(c, 9.8, -4.6, 1.2, '#2a1020'); dot(c, 10.2, -5, 0.45, '#fff'); dot(c, 8.6, -1.6, 1.3, 'rgba(255,120,150,.45)');
  /* nadadeira peitoral */
  cel(c, function (c) { c.moveTo(3, 1); c.quadraticCurveTo(1, 6, -3, 7.6); c.quadraticCurveTo(1, 7, 5, 2.4); c.closePath(); }, PK2, { k: 0.6, lw: 1.4 });
  /* bolhinhas subindo */
  for (i = 0; i < 4; i++) { var u = (k + i / 4) % 1; c.beginPath(); c.arc(-9 + i * 5 + Math.sin(u * 6 + i) * 1.6, 13 - u * 28, 0.8 + (i % 2) * 0.6, 0, TAU); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 0.7; c.stroke(); }
  c.restore();
  /* bolha: borda e brilhos */
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.strokeStyle = 'rgba(27,74,107,.75)'; c.lineWidth = 2.2; c.stroke();
  c.beginPath(); c.arc(0, 0, R - 1.4, 0, TAU); c.strokeStyle = 'rgba(226,246,255,.85)'; c.lineWidth = 1; c.stroke();
  c.beginPath(); c.arc(0, 0, R - 4, 3.5, 4.5); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke();
  c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.ellipse(9, -12.6, 2.4, 1.5, 0.7, 0, TAU); c.fill();
  c.restore();
  /* a onda */
  if (wv > 0.3) {
    var q = (wv - 0.3) / 0.7, x0 = R * 0.75, wy = cy + 12;
    c.save(); c.globalAlpha = Math.min(1, q * 1.6);
    cel(c, function (c) { c.moveTo(x0 - 4, wy + 6); c.quadraticCurveTo(x0 + 6, wy + 2, x0 + 10 + q * 10, wy - 10 * q - 4); c.quadraticCurveTo(x0 + 20 + q * 14, wy - 18 * q - 4, x0 + 26 + q * 12, wy - 8 * q - 2); c.quadraticCurveTo(x0 + 20 + q * 10, wy - 9 * q - 4, x0 + 18 + q * 10, wy - 2 * q); c.quadraticCurveTo(x0 + 22 + q * 10, wy + 4, x0 + 30 + q * 10, wy + 6); c.closePath(); }, '#5fc2ea', {
      k: 1.4, lw: 1.8, out: '#1b4a6b', hi: 'rgba(255,255,255,.45)', inn: function (c) { c.beginPath(); c.moveTo(x0 + 10 + q * 10, wy - 10 * q - 3); c.quadraticCurveTo(x0 + 20 + q * 14, wy - 17 * q - 3, x0 + 25 + q * 12, wy - 8 * q - 2); c.strokeStyle = '#f0fbff'; c.lineWidth = 2.2; c.lineCap = 'round'; c.stroke(); },
    });
    for (i = 0; i < 5; i++) { var a2 = -2.4 + i * 0.4; c.beginPath(); c.arc(x0 + 22 + q * 12 + Math.cos(a2) * (8 + q * 4), wy - 10 * q + Math.sin(a2) * (8 + q * 4), 1.1, 0, TAU); c.fillStyle = '#e8f8ff'; c.fill(); c.strokeStyle = '#1b4a6b'; c.lineWidth = 0.6; c.stroke(); }
    c.restore();
  }
}

const SHEETS = {
  vulto: { key: 'vulto', cellW: 84, cellH: 76, ox: 36, oy: 68, scale: 1.1, anims: { move: 8, atk: 4 } },
  vazio: { key: 'vazio', cellW: 68, cellH: 68, ox: 32, oy: 60, scale: 1.4, anims: { move: 6, atk: 4 } },
  lembranca: { key: 'lembranca', cellW: 92, cellH: 84, ox: 38, oy: 74, scale: 1.22, anims: { move: 6, atk: 4 }, fly: true },
  esquecido: { key: 'esquecido', cellW: 148, cellH: 150, ox: 60, oy: 140, scale: 1.25, anims: { move: 8, atk: 4 } },
  silencio: { key: 'silencio', cellW: 120, cellH: 96, ox: 44, oy: 88, scale: 1.1, anims: { move: 6, atk: 4 } },
  esquecimento: { key: 'esquecimento', cellW: 300, cellH: 260, ox: 140, oy: 240, scale: 1.6, anims: { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 } },
  mico: { key: 'mico', cellW: 72, cellH: 76, ox: 36, oy: 64, scale: 0.9, anims: { idle: 4, walk: 8, act: 3 } },
  botinho: { key: 'botinho', cellW: 128, cellH: 90, ox: 42, oy: 80, scale: 1.4, anims: { fly: 6, act: 3 }, fly: true },
};

export const ART = {
  chapter: 8,
  sheets: SHEETS,
  bake(kit) {
    kit.creature(SHEETS.vulto, drawVulto);
    kit.creature(SHEETS.vazio, drawVazio);
    kit.creature(SHEETS.lembranca, drawLembranca);
    kit.creature(SHEETS.esquecido, drawEsquecido);
    kit.creature(SHEETS.silencio, drawSilencio);
    kit.creature(SHEETS.esquecimento, drawEsq);
    kit.creature(SHEETS.mico, drawMico);
    kit.creature(SHEETS.botinho, drawBotinho);
  },
  ground: paintGround,
  canopy: paintCanopy,
  map: paintMap,
};
