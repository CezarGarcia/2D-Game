// @ts-nocheck
/**
 * Projéteis e efeitos da etapa 3 (feitiços dos elementos novos, armas novas e ataques dos monstros).
 * Cada textura aponta para a DIREITA (a cena gira na direção do voo) e é centrada no quadro.
 * Os de inimigo (`e_*`) são Assombros: cinzentos, com um resto de cor (rosa ou a cor do capítulo).
 * São desenhados uma vez só, no carregamento: aqui gradiente e brilho podem.
 */
import { OUT, TAU, el, cap, poly, cel, ln, dot } from './characters';
export const FX: Record<string, { w: number; h: number; color: string; desc: string }> = {
  p_faisca: { w: 46, h: 18, color: '#ffe066', desc: 'Faísca de Tempestade: raio curto em zigue-zague, amarelo-branco' },
  p_brasa: { w: 40, h: 22, color: '#ff7a2a', desc: 'Brasa: bola de fogo com rastro' },
  p_pedra: { w: 30, h: 28, color: '#b08a5a', desc: 'Pedrada: pedra lascada' },
  p_garra: { w: 44, h: 30, color: '#9a6aff', desc: 'Garra Sombria: três riscos roxos curvos' },
  p_sussurro: { w: 40, h: 26, color: '#ff7ad9', desc: 'Sussurro: espiral rosa com notas' },
  p_cajado: { w: 36, h: 20, color: '#fff1b0', desc: 'Disparo do cajado: orbe claro com rastro (a cena tinge pela cor do elemento)' },
  orb_fatuo: { w: 30, h: 30, color: '#7ad0ff', desc: 'Fogo-Fátuo do herói: chama azulada que gira em volta dele' },
  estaca: { w: 50, h: 70, color: '#8a6a4a', desc: 'Estaca: torre de pedra pontuda com um olho âmbar, vista 3/4, base embaixo' },
  muralha: { w: 64, h: 64, color: '#7a6a5a', desc: 'Muralha: bloco de pedra que brota do chão, base embaixo' },
  nuvem: { w: 96, h: 60, color: '#6a7a9a', desc: 'Nuvem Carregada: nuvem escura com faíscas' },
  sapinho: { w: 40, h: 34, color: '#7ac85a', desc: 'Sapinho (Supremo da Cuca): sapinho verde bobo, base embaixo' },
  e_espinho: { w: 36, h: 10, color: '#c9c4bd', desc: 'Espinho de mandacaru, cinza com ponta rosa' },
  e_pequi: { w: 26, h: 26, color: '#ff8a2a', desc: 'Pequi em brasa' },
  e_pedra: { w: 22, h: 22, color: '#9a948a', desc: 'Pedra do macaco' },
  e_foice: { w: 40, h: 40, color: '#c9c4bd', desc: 'Foice girando (a cena gira a textura)' },
  e_bico: { w: 40, h: 12, color: '#d9d4cc', desc: 'Bico do socó, lança fina' },
  e_sombra: { w: 34, h: 18, color: '#7a5aaa', desc: 'Projétil de sombra genérico' },
  e_caco: { w: 30, h: 16, color: '#e9e4d8', desc: 'Caco de retrato (Lembrança)' },
  e_pocao: { w: 26, h: 30, color: '#ff4ad0', desc: 'Frasco de poção magenta (Cuca e Cururu), arremessado em arco' },
};

type Ctx = CanvasRenderingContext2D;

function halo(c: Ctx, x: number, y: number, r: number, rgb: string, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}
/* traço com contorno */
function rope(c: Ctx, p: number[], col: string, lw: number, out?: string, olw?: number) {
  c.beginPath(); c.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1]);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = out || OUT; c.lineWidth = lw + (olw == null ? 2.2 : olw); c.stroke(); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
}
function spark(c: Ctx, x: number, y: number, r: number, col: string) {
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.closePath(); c.fillStyle = col; c.fill();
}
function flameP(c: Ctx, x: number, y: number, s: number) {
  c.moveTo(x, y - s * 1.4); c.bezierCurveTo(x + s * .2, y - s * .7, x + s, y - s * .3, x + s * .85, y + s * .5); c.bezierCurveTo(x + s * .75, y + s * 1.1, x + s * .3, y + s * 1.3, x, y + s * 1.3);
  c.bezierCurveTo(x - s * .5, y + s * 1.3, x - s * .95, y + s * .95, x - s * .9, y + s * .35); c.bezierCurveTo(x - s * .88, y - s * .05, x - s * .6, y - s * .3, x - s * .5, y - s * .65);
  c.bezierCurveTo(x - s * .3, y - s * .35, x - s * .2, y - s * .3, x - s * .1, y - s * .4); c.bezierCurveTo(x - s * .25, y - s * .9, x - s * .1, y - s * 1.2, x, y - s * 1.4); c.closePath();
}
/* bola com rastro em gota, ponta arredondada à direita em (x,y) */
function cometP(c: Ctx, x0: number, y: number, x: number, r: number) {
  c.moveTo(x0, y); c.bezierCurveTo(x0 + (x - x0) * .4, y - r * .4, x - r * 1.2, y - r, x, y - r); c.arc(x, y, r, -Math.PI / 2, Math.PI / 2); c.bezierCurveTo(x - r * 1.2, y + r, x0 + (x - x0) * .4, y + r * .4, x0, y); c.closePath();
}
const COLD = 'rgba(50,60,90,.42)';

const DRAW: Record<string, (c: Ctx) => void> = {
  p_faisca(c) {
    const P = [2.5, 9.5, 10, 4.5, 15, 12.5, 23, 3.5, 28, 11.5, 35, 6, 41, 9.5];
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 30, 9, 16, '255,224,102', .45); c.restore();
    rope(c, P, 'rgba(255,224,102,.35)', 7, 'rgba(0,0,0,0)', 0);
    rope(c, P, '#ffd23f', 2.8, '#5a3a00', 2);
    rope(c, P, '#fffbe0', 1, '#fffbe0', 0);
    rope(c, [15, 12.5, 17, 16], '#ffd23f', 1.2, '#5a3a00', 1.4); rope(c, [28, 11.5, 31, 15.5], '#ffd23f', 1.2, '#5a3a00', 1.4);
    spark(c, 42.5, 9.5, 3.4, '#ffffff'); dot(c, 42.5, 9.5, 1.4, '#fff6c0');
  },
  p_brasa(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 28, 11, 12, '255,140,40', .55); c.restore();
    cel(c, (p: Ctx) => cometP(p, 2, 11, 28.5, 7.4), '#e2401f', { k: 1, lw: 1.8, out: '#4a1206', sh: 'rgba(120,0,20,.35)', hi: 'rgba(255,230,120,.35)', inn: (p: Ctx) => {
      p.beginPath(); cometP(p, 9, 11, 29, 5.2); p.fillStyle = '#ff9d2e'; p.fill();
      p.beginPath(); cometP(p, 18, 11, 29.6, 3); p.fillStyle = '#ffe680'; p.fill();
      dot(p, 30.6, 9.6, 1.4, '#fffbe6');
    } });
    [[8, 5, 1.1], [13, 17, .9], [5, 15, .8]].forEach((q) => dot(c, q[0], q[1], q[2], '#ffb347'));
  },
  p_pedra(c) {
    ln(c, [1.5, 10, 6.5, 10], 'rgba(230,205,160,.75)', 1.4); ln(c, [2.5, 18, 7, 18], 'rgba(230,205,160,.6)', 1.2);
    const R = [5.5, 19, 7, 8.5, 13, 3.5, 22, 4, 27.5, 11, 25.5, 21, 15, 25];
    cel(c, (p: Ctx) => poly(p, R), '#b08a5a', { k: 1.8, lw: 2, sh: 'rgba(70,40,10,.45)', hi: 'rgba(255,240,200,.35)', inn: (p: Ctx) => {
      ln(p, [7, 8.5, 15, 12, 22, 4], 'rgba(70,40,10,.45)', 1); ln(p, [15, 12, 15, 25], 'rgba(70,40,10,.45)', 1); ln(p, [15, 12, 27.5, 11], 'rgba(70,40,10,.3)', .9);
      p.fillStyle = 'rgba(255,240,200,.3)'; p.beginPath(); poly(p, [8, 9, 13, 4.5, 20, 5, 15, 11]); p.fill();
      dot(p, 20, 17, 1, 'rgba(70,40,10,.4)');
    } });
  },
  p_garra(c) {
    [[6, 0], [14, 1], [22, 2]].forEach(([x, i]) => { ln(c, [x - 5, 8 + i * 7, x + 2, 8 + i * 7], 'rgba(205,184,255,.45)', 1.2); });
    [[14, .85], [23, 1], [32, .85]].forEach(([x, k]) => {
      const t = 3 + (1 - k) * 6, b = 27 - (1 - k) * 6;
      cel(c, (p: Ctx) => { p.moveTo(x, t); p.quadraticCurveTo(x + 17 * k, 15, x, b); p.quadraticCurveTo(x + 6 * k, 15, x, t); p.closePath(); }, '#9a6aff', { k: .8, lw: 1.5, out: '#2e1660', sh: 'rgba(30,10,80,.45)', hi: 'rgba(240,230,255,.5)', inn: (p: Ctx) => {
        p.beginPath(); p.moveTo(x + 1, t + 3); p.quadraticCurveTo(x + 12.6 * k, 15, x + 1, b - 3); p.strokeStyle = '#ece2ff'; p.lineWidth = 1.2; p.stroke();
      } });
    });
  },
  p_sussurro(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 28, 13, 13, '255,122,217', .35); c.restore();
    const S: number[] = []; for (let i = 0; i <= 40; i++) { const u = i / 40, a = 3.4 + u * 1.8 * TAU, q = 9.4 * (.12 + .88 * u); S.push(28 + Math.cos(a) * q, 13 + Math.sin(a) * q); }
    rope(c, S, '#ffc8ef', 2, '#7a1a60', 1.8);
    const note = (x: number, y: number, s: number) => {
      c.save(); c.translate(x, y); c.scale(s, s);
      cel(c, (p: Ctx) => el(p, 0, 0, 2.4, 1.8, -.4), '#ff7ad9', { k: .5, lw: 1.3, out: '#7a1a60' });
      rope(c, [2, -.6, 2, -8, 5, -6.4], '#ff7ad9', 1.1, '#7a1a60', 1.3);
      c.restore();
    };
    note(5, 18, .95); note(12.5, 11, .8);
    dot(c, 3, 8, 1, '#ffc8ef'); dot(c, 17, 21, .9, '#ffc8ef');
  },
  p_cajado(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 27, 10, 10, '255,250,225', .65); c.restore();
    c.beginPath(); cometP(c, 2, 10, 27, 5.6); c.fillStyle = 'rgba(255,248,220,.45)'; c.fill();
    c.beginPath(); cometP(c, 10, 10, 27.4, 4); c.fillStyle = 'rgba(255,250,232,.7)'; c.fill();
    cel(c, (p: Ctx) => el(p, 27.5, 10, 5.2, 5.2), '#fff6d6', { k: .9, lw: 1.5, out: '#6a5a30', sh: 'rgba(150,120,40,.3)', hi: 'rgba(255,255,255,.6)', inn: (p: Ctx) => dot(p, 26.4, 8.8, 1.8, '#ffffff') });
    spark(c, 31.5, 4, 2.4, '#ffffff'); spark(c, 18, 15.5, 1.6, '#ffffff');
  },
  orb_fatuo(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 15, 16, 14, '122,208,255', .55); c.restore();
    cel(c, (p: Ctx) => flameP(p, 15, 15.4, 9), '#7ad0ff', { k: 1.2, lw: 1.8, out: '#0e2c4a', sh: 'rgba(10,40,120,.4)', hi: 'rgba(230,250,255,.45)', inn: (p: Ctx) => {
      p.beginPath(); flameP(p, 15.4, 18.4, 5.6); p.fillStyle = '#c8efff'; p.fill();
      p.beginPath(); flameP(p, 15.6, 21, 2.8); p.fillStyle = '#ffffff'; p.fill();
    } });
    dot(c, 12.4, 18.6, 1.1, '#0e2c4a'); dot(c, 18, 18.6, 1.1, '#0e2c4a');
    spark(c, 25.5, 6, 2, '#e6f8ff'); spark(c, 5, 10, 1.5, '#e6f8ff');
  },
  estaca(c) {
    /* entulho na base */
    cel(c, (p: Ctx) => { p.moveTo(3, 68); p.quadraticCurveTo(6, 58, 16, 58); p.lineTo(34, 58); p.quadraticCurveTo(45, 58, 47, 68); p.closePath(); }, '#7a6450', { k: 1.4, lw: 2, sh: 'rgba(40,24,10,.45)' });
    /* torre: face clara à esquerda, escura à direita */
    const T = [10, 62, 15, 36, 24, 4, 33, 34, 40, 62];
    cel(c, (p: Ctx) => poly(p, T), '#9a8470', { k: 1.6, lw: 2.2, sh: 'rgba(40,24,10,.4)', hi: 'rgba(255,240,220,.3)', inn: (p: Ctx) => {
      p.fillStyle = 'rgba(40,26,14,.32)'; p.beginPath(); poly(p, [24, 4, 33, 34, 40, 62, 27, 62, 26, 34]); p.fill();
      ln(p, [24, 4, 26, 34, 27, 62], 'rgba(40,26,14,.5)', 1.1);
      [[12.6, 49, 26.6, 47, 38, 50], [14.6, 38, 26, 36.4, 34.6, 39], [18, 24, 25.4, 23, 30, 25]].forEach((q) => ln(p, q, 'rgba(40,26,14,.45)', 1.1));
      ln(p, [17, 54, 19, 58, 17.4, 61], 'rgba(40,26,14,.45)', 1); ln(p, [33, 42, 31, 46], 'rgba(40,26,14,.45)', 1);
      p.fillStyle = 'rgba(255,240,220,.25)'; p.beginPath(); poly(p, [24, 6, 16, 34, 21, 33]); p.fill();
      p.fillStyle = 'rgba(96,130,70,.85)'; p.beginPath(); p.ellipse(15, 58, 4, 2.2, 0, 0, TAU); p.fill();
    } });
    /* olho âmbar */
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 25, 29.5, 9, '255,170,40', .5); c.restore();
    cel(c, (p: Ctx) => { p.moveTo(19, 29.5); p.quadraticCurveTo(25, 24.4, 31, 29.5); p.quadraticCurveTo(25, 34.6, 19, 29.5); p.closePath(); }, '#f5a732', { k: .6, lw: 1.7, sh: 'rgba(150,50,0,.4)', hi: 'rgba(255,250,200,.5)' });
    c.beginPath(); c.ellipse(25, 29.5, 1.1, 3, 0, 0, TAU); c.fillStyle = '#2a1000'; c.fill(); dot(c, 23.6, 28, .8, '#fff6d0');
  },
  muralha(c) {
    cel(c, (p: Ctx) => { p.moveTo(1, 63); p.quadraticCurveTo(4, 54, 12, 55); p.lineTo(52, 55); p.quadraticCurveTo(61, 54, 63, 63); p.closePath(); }, '#7a5a3a', { k: 1.2, lw: 2, sh: 'rgba(40,24,10,.45)' });
    /* topo (vista 3/4) */
    cel(c, (p: Ctx) => poly(p, [6, 20, 11, 10, 22, 11, 28, 8, 40, 9, 47, 7.5, 54, 10, 58, 20]), '#c2b2a0', { k: 1, lw: 2.2, sh: 'rgba(40,24,10,.3)', hi: 'rgba(255,250,240,.35)', inn: (p: Ctx) => { ln(p, [18, 20, 22, 11], 'rgba(60,40,30,.4)', 1); ln(p, [34, 20, 33, 9], 'rgba(60,40,30,.4)', 1); ln(p, [47, 20, 49, 9], 'rgba(60,40,30,.4)', 1); } });
    /* frente */
    cel(c, (p: Ctx) => poly(p, [6, 20, 58, 20, 57, 58, 7, 58]), '#a08c78', { k: 2, lw: 2.2, sh: 'rgba(40,24,10,.42)', hi: 'rgba(255,240,220,.3)', inn: (p: Ctx) => {
      [29.5, 39, 48.5].forEach((y) => ln(p, [6, y, 58, y], 'rgba(50,34,24,.55)', 1.3));
      const V: number[][] = [[19, 20, 29.5], [33, 20, 29.5], [46, 20, 29.5], [13, 29.5, 39], [26, 29.5, 39], [40, 29.5, 39], [52, 29.5, 39], [19, 39, 48.5], [33, 39, 48.5], [46, 39, 48.5], [12, 48.5, 58], [27, 48.5, 58], [41, 48.5, 58]];
      V.forEach((q) => ln(p, [q[0], q[1], q[0], q[2]], 'rgba(50,34,24,.55)', 1.3));
      p.fillStyle = 'rgba(255,240,220,.2)'; p.fillRect(7, 21, 11, 7.5); p.fillRect(27, 40, 12, 7.5); p.fillRect(41, 30.5, 10, 7.5);
      p.fillStyle = 'rgba(96,130,70,.85)'; p.beginPath(); p.ellipse(10, 56, 5, 2.6, 0, 0, TAU); p.fill(); p.beginPath(); p.ellipse(54, 21, 4, 2, 0, 0, TAU); p.fill();
      ln(p, [36, 22, 38, 26, 36.4, 29], 'rgba(50,34,24,.5)', 1);
    } });
    [[4, 61, 1.6], [60, 60, 1.4], [30, 62, 1.2]].forEach((q) => cel(c, (p: Ctx) => el(p, q[0], q[1], q[2] * 1.4, q[2]), '#9a8470', { k: 0, lw: 1.4 }));
  },
  nuvem(c) {
    const cp = (p: Ctx, cx: number, cy: number, s: number) => {
      const X = (v: number) => cx + (v - 20) * s, Y = (v: number) => cy + (v - 14) * s;
      p.moveTo(X(9.4), Y(22.6)); p.bezierCurveTo(X(1.6), Y(22.6), X(1.6), Y(12.4), X(9.6), Y(12.4)); p.bezierCurveTo(X(10), Y(4.4), X(20.6), Y(2.4), X(24), Y(8.6));
      p.bezierCurveTo(X(30), Y(5.6), X(36), Y(10.4), X(34), Y(15.4)); p.bezierCurveTo(X(39.6), Y(16.6), X(38.4), Y(22.6), X(32.6), Y(22.6)); p.closePath();
    };
    c.save(); c.globalAlpha = .94;
    cel(c, (p: Ctx) => cp(p, 48, 28, 2.4), '#56607a', { k: 3, lw: 2.6, out: '#141c33', sh: 'rgba(10,16,50,.45)', hi: 'rgba(220,230,255,.28)', inn: (p: Ctx) => {
      p.fillStyle = 'rgba(20,26,50,.35)'; p.beginPath(); p.ellipse(48, 52, 40, 8, 0, 0, TAU); p.fill();
      p.beginPath(); p.moveTo(22, 30); p.quadraticCurveTo(32, 22, 44, 26); p.strokeStyle = 'rgba(200,214,240,.35)'; p.lineWidth = 2; p.stroke();
      p.beginPath(); p.moveTo(52, 22); p.quadraticCurveTo(62, 14, 72, 22); p.stroke();
    } });
    c.restore();
    const bolt = (x: number, y: number, s: number) => {
      const B = [x + .2 * s, y - 1.4 * s, x - .62 * s, y + .16 * s, x - .06 * s, y + .16 * s, x - .36 * s, y + 1.4 * s, x + .66 * s, y - .3 * s, x + .1 * s, y - .3 * s, x + .56 * s, y - 1.4 * s];
      cel(c, (p: Ctx) => poly(p, B), '#ffd23f', { k: 0, lw: 1.6, out: '#3a2400' });
    };
    bolt(30, 50, 5.4); bolt(64, 52, 4.6); bolt(47, 44, 4);
    [[20, 40], [74, 38], [40, 32], [58, 30]].forEach((q) => spark(c, q[0], q[1], 2.4, '#fff3a8'));
  },
  sapinho(c) {
    cel(c, (p: Ctx) => el(p, 20, 33, 13, 2), 'rgba(0,0,0,.18)', { k: 0, lw: 0 });
    [[-1], [1]].forEach(([d]) => cel(c, (p: Ctx) => el(p, 20 + d * 11.6, 29.6, 5.4, 3), '#5fae46', { k: .6, lw: 1.7 }));
    cel(c, (p: Ctx) => { p.moveTo(7, 27); p.quadraticCurveTo(6, 14, 20, 14); p.quadraticCurveTo(34, 14, 33, 27); p.quadraticCurveTo(32, 32.6, 20, 32.6); p.quadraticCurveTo(8, 32.6, 7, 27); p.closePath(); }, '#7ac85a', { k: 1.8, lw: 2, sh: 'rgba(10,60,30,.4)', hi: 'rgba(240,255,190,.4)', inn: (p: Ctx) => {
      p.fillStyle = '#d9f2a8'; p.beginPath(); p.ellipse(20, 28.4, 7.4, 4, 0, 0, TAU); p.fill();
      dot(p, 11, 21, 1.2, 'rgba(40,110,40,.5)'); dot(p, 30, 22, 1.4, 'rgba(40,110,40,.5)');
    } });
    /* boca larga e boba */
    c.beginPath(); c.moveTo(11.6, 21.4); c.quadraticCurveTo(20, 27, 28.4, 21.4); c.strokeStyle = '#2a4a1a'; c.lineWidth = 1.4; c.lineCap = 'round'; c.stroke();
    dot(c, 23, 24.2, 1.3, '#ff7a9a');
    /* olhos saltados, cada um para um lado */
    [[13, 12, -1.4, 0], [27, 11.4, 1, 1.2]].forEach((q) => {
      cel(c, (p: Ctx) => el(p, q[0], q[1], 5, 5), '#7ac85a', { k: .8, lw: 1.8 });
      dot(c, q[0], q[1], 3.5, '#ffffff'); dot(c, q[0] + q[2], q[1] + q[3], 1.7, '#1c0f0a'); dot(c, q[0] + q[2] - .5, q[1] + q[3] - .6, .6, '#fff');
    });
    [[-1], [1]].forEach(([d]) => cel(c, (p: Ctx) => el(p, 20 + d * 5.4, 31.6, 2.8, 1.8), '#5fae46', { k: 0, lw: 1.5 }));
  },
  e_espinho(c) {
    ln(c, [1, 5, 12, 5], 'rgba(255,90,160,.45)', 2.2);
    cel(c, (p: Ctx) => poly(p, [4, 2, 34.5, 5, 4, 8, 7, 5]), '#c9c4bd', { k: .6, lw: 1.4, out: '#2a2028', sh: COLD, inn: (p: Ctx) => {
      p.fillStyle = '#ff5c9a'; p.beginPath(); poly(p, [25, 0, 36, 5, 25, 10]); p.fill();
      ln(p, [6, 4.4, 26, 4.6], 'rgba(255,255,255,.55)', .7);
    } });
  },
  e_pequi(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 13, 13, 13, '255,138,42', .45); c.restore();
    cel(c, (p: Ctx) => { p.moveTo(13, 3); p.quadraticCurveTo(23.4, 3.4, 23, 13.6); p.quadraticCurveTo(22.4, 23, 13, 23); p.quadraticCurveTo(3.4, 23, 3.4, 13.4); p.quadraticCurveTo(3.6, 3.2, 13, 3); p.closePath(); }, '#8d8a80', { k: 1.4, lw: 1.8, out: '#2a2020', sh: 'rgba(30,20,20,.4)', inn: (p: Ctx) => {
      /* rachaduras em brasa */
      ln(p, [8, 6, 11, 11, 7.6, 16, 10, 21], '#ff8a2a', 2); ln(p, [11, 11, 16, 12.6, 19, 8], '#ff8a2a', 2); ln(p, [16, 12.6, 17, 19], '#ff8a2a', 1.8);
      ln(p, [8, 6, 11, 11, 7.6, 16, 10, 21], '#ffe680', .8); ln(p, [11, 11, 16, 12.6, 19, 8], '#ffe680', .8);
    } });
    cel(c, (p: Ctx) => el(p, 13, 3.4, 2.4, 1.4), '#6a6258', { k: 0, lw: 1.3 });
    spark(c, 22, 4, 1.8, '#ffd27a'); dot(c, 3, 6, .8, '#ffb347');
  },
  e_pedra(c) {
    ln(c, [1, 9, 5, 9], 'rgba(255,92,154,.5)', 1.3); ln(c, [1.5, 14, 5, 14], 'rgba(255,92,154,.4)', 1.1);
    cel(c, (p: Ctx) => poly(p, [5, 13, 6.4, 6, 11, 3, 17, 4, 20, 10, 18, 17.4, 11, 19.4]), '#9a948a', { k: 1.3, lw: 1.7, out: '#2a2028', sh: 'rgba(30,24,30,.45)', hi: 'rgba(255,255,255,.25)', inn: (p: Ctx) => {
      ln(p, [6.4, 6, 11, 9.6, 17, 4], 'rgba(40,34,40,.45)', .9); ln(p, [11, 9.6, 11, 19.4], 'rgba(40,34,40,.45)', .9);
      dot(p, 15.4, 13.4, 1, '#ff5c9a');
    } });
  },
  e_foice(c) {
    c.beginPath(); c.arc(20, 20, 17.4, -.6, 1.6); c.strokeStyle = 'rgba(255,92,154,.3)'; c.lineWidth = 2; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(20, 20, 17.4, 2.5, 4.7); c.stroke();
    cel(c, (p: Ctx) => cap(p, 11, 31, 20, 20, 1.8), '#7a6e66', { k: .6, lw: 1.6, out: '#2a2028', inn: (p: Ctx) => { ln(p, [12.4, 27.6, 15.4, 30.4], '#3a3034', .8); ln(p, [14.4, 25.2, 17.4, 28], '#3a3034', .8); } });
    cel(c, (p: Ctx) => { p.moveTo(18.6, 21.6); p.quadraticCurveTo(10, 6, 26, 3.6); p.quadraticCurveTo(35.6, 3, 37, 12); p.quadraticCurveTo(30, 6.6, 23, 10.6); p.quadraticCurveTo(20, 13.6, 21.6, 20); p.closePath(); }, '#c9c4bd', { k: 1.2, lw: 1.8, out: '#2a2028', sh: COLD, hi: 'rgba(255,255,255,.4)', inn: (p: Ctx) => {
      p.beginPath(); p.moveTo(22, 11); p.quadraticCurveTo(30, 6.4, 36.4, 11.6); p.strokeStyle = '#ff5c9a'; p.lineWidth = 1.4; p.stroke();
      ln(p, [17, 15, 21, 7.6], 'rgba(255,255,255,.6)', .8);
    } });
    cel(c, (p: Ctx) => el(p, 20, 20.6, 2.2, 2.2), '#5a5258', { k: 0, lw: 1.4, out: '#2a2028' });
  },
  e_bico(c) {
    ln(c, [1, 6, 10, 6], 'rgba(255,92,154,.4)', 1.8);
    cel(c, (p: Ctx) => { p.moveTo(3, 3.4); p.lineTo(30, 4); p.quadraticCurveTo(36, 5, 39.4, 6); p.quadraticCurveTo(36, 7, 30, 8); p.lineTo(3, 8.6); p.quadraticCurveTo(1.4, 6, 3, 3.4); p.closePath(); }, '#d9d4cc', { k: .7, lw: 1.4, out: '#2a2028', sh: COLD, inn: (p: Ctx) => {
      ln(p, [4, 6, 37, 6], 'rgba(60,54,60,.5)', .7); p.fillStyle = '#ff5c9a'; p.beginPath(); poly(p, [31, 2, 40, 6, 31, 10]); p.fill();
      ln(p, [6, 4.6, 26, 4.9], 'rgba(255,255,255,.6)', .6);
    } });
    dot(c, 6, 6, 1.1, '#2a2028');
  },
  e_sombra(c) {
    [[2, 5, 14, 7], [1, 13, 12, 11]].forEach((q) => ln(c, q, 'rgba(122,90,170,.55)', 1.8));
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 24, 9, 10, '255,61,138', .35); c.restore();
    cel(c, (p: Ctx) => cometP(p, 3, 9, 25, 6.4), '#7a5aaa', { k: 1.1, lw: 1.7, out: '#1e1030', sh: 'rgba(20,6,40,.45)', hi: 'rgba(220,200,255,.3)', inn: (p: Ctx) => {
      p.beginPath(); cometP(p, 12, 9, 25.4, 4.2); p.fillStyle = '#3a2a5a'; p.fill();
    } });
    c.save(); c.shadowColor = '#ff3d8a'; c.shadowBlur = 5; dot(c, 26.4, 9, 2, '#ffe0f0'); c.restore(); dot(c, 26.6, 9, .9, '#ff3d8a');
  },
  e_caco(c) {
    cel(c, (p: Ctx) => poly(p, [3, 12.6, 9, 2, 28.6, 6.4, 19, 14.4]), '#e9e4d8', { k: .9, lw: 1.5, out: '#2a2028', sh: 'rgba(60,50,70,.35)', hi: 'rgba(255,255,255,.5)', inn: (p: Ctx) => {
      /* pedaço apagado de um retrato */
      p.fillStyle = 'rgba(150,146,150,.55)'; p.beginPath(); p.ellipse(15, 9, 3, 3.6, 0, 0, TAU); p.fill(); p.fillRect(10, 11.6, 10, 4);
      p.fillStyle = '#b8a888'; p.beginPath(); poly(p, [3, 12.6, 9, 2, 10.6, 2.4, 5, 13]); p.fill();
      ln(p, [11, 3.6, 27, 7], '#ff8fc0', 1); ln(p, [20, 13.6, 27.6, 7.2], 'rgba(255,255,255,.7)', .8);
    } });
    ln(c, [27, 9, 29.6, 11], 'rgba(255,143,192,.8)', 1); ln(c, [24, 12.6, 25.6, 15], 'rgba(255,143,192,.6)', 1);
  },
  e_pocao(c) {
    c.save(); c.globalCompositeOperation = 'lighter'; halo(c, 13, 20, 12, '255,74,208', .35); c.restore();
    cel(c, (p: Ctx) => { p.moveTo(10.4, 7); p.lineTo(10.4, 11.4); p.quadraticCurveTo(4, 14, 4, 20); p.quadraticCurveTo(4, 28.4, 13, 28.4); p.quadraticCurveTo(22, 28.4, 22, 20); p.quadraticCurveTo(22, 14, 15.6, 11.4); p.lineTo(15.6, 7); p.closePath(); }, '#e2d6e8', { k: 1.4, lw: 1.8, out: '#2a1028', sh: 'rgba(60,10,60,.35)', hi: 'rgba(255,255,255,.4)', inn: (p: Ctx) => {
      p.fillStyle = '#ff4ad0'; p.fillRect(2, 16.6, 22, 14); p.fillStyle = '#ffa0e6'; p.beginPath(); p.ellipse(13, 16.6, 8.6, 1.6, 0, 0, TAU); p.fill();
      [[10, 22, 1.4], [16, 20.4, 1.1], [13.6, 25.4, .9]].forEach((q) => { p.beginPath(); p.arc(q[0], q[1], q[2], 0, TAU); p.strokeStyle = '#fff0fa'; p.lineWidth = .8; p.stroke(); });
      p.fillStyle = 'rgba(255,255,255,.75)'; p.beginPath(); p.ellipse(7.4, 20.4, 1.1, 3, .35, 0, TAU); p.fill();
    } });
    cel(c, (p: Ctx) => poly(p, [9.4, 6, 16.6, 6, 16.6, 8.4, 9.4, 8.4]), '#c9bcd6', { k: 0, lw: 1.4, out: '#2a1028' });
    cel(c, (p: Ctx) => poly(p, [10.6, 1.4, 15.4, 1.4, 15, 6, 11, 6]), '#9a7a5a', { k: .6, lw: 1.4, out: '#2a1028' });
    dot(c, 19, 5, 1.1, '#ffa0e6'); dot(c, 21.4, 2.4, .8, '#ffa0e6');
  },
};

export function bakeFx(kit) {
  for (const [key, f] of Object.entries(FX)) {
    kit.image(key, f.w, f.h, (c) => {
      const d = DRAW[key];
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      if (d) d(c);
      else { c.fillStyle = f.color; c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.ellipse(f.w / 2, f.h / 2, f.w / 2 - 2, f.h / 2 - 2, 0, 0, TAU); c.fill(); c.stroke(); }
      c.restore();
    });
  }
}
