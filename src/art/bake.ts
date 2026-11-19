/**
 * Transforma o desenho por código em texturas do Phaser. Cada personagem é desenhado uma vez,
 * quadro a quadro, numa folha de sprites; durante o jogo só se troca o quadro.
 */
import Phaser from 'phaser';
import { ARENA, VIEW } from '../data/balance';
import { paintCanopy, paintGround, paintRays } from './arena';
import { cel, drawCapi, drawCurupira, drawCuspidor, drawHero, drawQueixada, drawSauva, drawTronco, el, poly } from './characters';
import { drawAltar, drawCage, drawCaipora, drawCogumelo, drawOnca, drawUrutau } from './characters2';
import { drawMiscIcon } from './icons';

/** As texturas são geradas com o dobro da resolução lógica, para continuarem nítidas em tela cheia. */
export const BAKE = 2;

type Ctx = CanvasRenderingContext2D;
type Draw = (c: Ctx) => void;

export interface Sheet {
  key: string;
  cellW: number; cellH: number;
  /** Posição dos pés dentro da célula. */
  ox: number; oy: number;
  scale: number;
  anims: Record<string, number>;
}

const TAU = Math.PI * 2;

export const SHEETS = {
  hero: { key: 'hero', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_arco: { key: 'hero_arco', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  sauva: { key: 'sauva', cellW: 112, cellH: 88, ox: 46, oy: 76, scale: 1.45, anims: { walk: 8 } },
  queixada: { key: 'queixada', cellW: 172, cellH: 114, ox: 68, oy: 102, scale: 1.9, anims: { idle: 4, run: 8 } },
  tronco: { key: 'tronco', cellW: 204, cellH: 214, ox: 102, oy: 200, scale: 2.1, anims: { raise: 7 } },
  cuspidor: { key: 'cuspidor', cellW: 152, cellH: 142, ox: 60, oy: 128, scale: 1.9, anims: { open: 5 } },
  urutau: { key: 'urutau', cellW: 190, cellH: 150, ox: 95, oy: 128, scale: 1.6, anims: { perch: 3, fly: 8 } },
  cogumelo: { key: 'cogumelo', cellW: 120, cellH: 110, ox: 60, oy: 96, scale: 1.7, anims: { walk: 6, swell: 5 } },
  caipora: { key: 'caipora', cellW: 200, cellH: 190, ox: 82, oy: 170, scale: 1.9, anims: { idle: 4, run: 8, raise: 2 } },
  curupira: { key: 'curupira', cellW: 190, cellH: 240, ox: 86, oy: 218, scale: 1.75, anims: { idle: 8, cast: 3, fake: 8 } },
  curupira_m: { key: 'curupira_m', cellW: 220, cellH: 250, ox: 92, oy: 230, scale: 1.9, anims: { idle: 4, run: 8 } },
  capivara: { key: 'capivara', cellW: 110, cellH: 84, ox: 46, oy: 72, scale: 1.45, anims: { idle: 4, walk: 8 } },
  onca: { key: 'onca', cellW: 130, cellH: 90, ox: 56, oy: 76, scale: 1.45, anims: { idle: 4, walk: 8, pounce: 3 } },
} satisfies Record<string, Sheet>;

function canvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w); cv.height = Math.ceil(h);
  return [cv, cv.getContext('2d')!];
}

function bakeSheet(scene: Phaser.Scene, s: Sheet, frames: [string, Draw][]): void {
  const cols = Math.min(8, frames.length), rows = Math.ceil(frames.length / cols);
  const cw = s.cellW * BAKE, ch = s.cellH * BAKE;
  const [cv, c] = canvas(cols * cw, rows * ch);
  frames.forEach(([, draw], i) => {
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
    c.save();
    c.beginPath(); c.rect(x, y, cw, ch); c.clip();
    c.translate(x + s.ox * BAKE, y + s.oy * BAKE);
    c.scale(s.scale * BAKE, s.scale * BAKE);
    draw(c);
    c.restore();
  });
  const tex = scene.textures.addCanvas(s.key, cv)!;
  frames.forEach(([name], i) => tex.add(name, 0, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch));
}

/** `n` quadros de um ciclo; `k` vai de 0 a quase 1. */
function cycle(n: number, name: string, draw: (c: Ctx, k: number) => void): [string, Draw][] {
  return Array.from({ length: n }, (_, i) => [name + i, (c: Ctx) => draw(c, i / n)] as [string, Draw]);
}
/** `n` quadros de uma passagem; `k` vai de 0 a 1 inclusive. */
function ramp(n: number, name: string, draw: (c: Ctx, k: number) => void): [string, Draw][] {
  return Array.from({ length: n }, (_, i) => [name + i, (c: Ctx) => draw(c, n > 1 ? i / (n - 1) : 0)] as [string, Draw]);
}

function simple(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: Ctx) => void): void {
  const [cv, c] = canvas(w * BAKE, h * BAKE);
  c.scale(BAKE, BAKE);
  draw(c);
  scene.textures.addCanvas(key, cv);
}

export const ICON_KEYS = ['dardo', 'sementes', 'cipo', 'casca', 'broto', 'pocao', 'ouro', 'xp'] as const;

export function bakeAll(scene: Phaser.Scene): void {
  for (const weapon of ['facao', 'arco'] as const) {
    const s = weapon === 'arco' ? SHEETS.hero_arco : SHEETS.hero, A = s.anims;
    bakeSheet(scene, s, [
      ...cycle(A.idle, 'idle', (c, k) => drawHero(c, k * 2.618, { weapon })),
      ...cycle(A.walk, 'walk', (c, k) => drawHero(c, k * 2.618, { weapon, walk: k * TAU })),
      ...ramp(A.atk, 'atk', (c, k) => drawHero(c, 0, { weapon, swing: k })),
    ]);
  }
  bakeSheet(scene, SHEETS.sauva, cycle(SHEETS.sauva.anims.walk, 'walk', (c, k) => drawSauva(c, k * 2.094, { walk: k * TAU })));
  bakeSheet(scene, SHEETS.queixada, [
    ...cycle(SHEETS.queixada.anims.idle, 'idle', (c, k) => drawQueixada(c, k * Math.PI, {})),
    ...cycle(SHEETS.queixada.anims.run, 'run', (c, k) => drawQueixada(c, 0, { walk: k * TAU })),
  ]);
  bakeSheet(scene, SHEETS.tronco, ramp(SHEETS.tronco.anims.raise, 'raise', (c, k) => drawTronco(c, 0, { raise: k })));
  bakeSheet(scene, SHEETS.cuspidor, ramp(SHEETS.cuspidor.anims.open, 'open', (c, k) => drawCuspidor(c, 0, { open: k })));
  bakeSheet(scene, SHEETS.urutau, [
    ...ramp(SHEETS.urutau.anims.perch, 'perch', (c, k) => drawUrutau(c, 0, { hidden: 1 - k })),
    ...cycle(SHEETS.urutau.anims.fly, 'fly', (c, k) => drawUrutau(c, k * 2, { hidden: 0, fly: k * TAU })),
  ]);
  bakeSheet(scene, SHEETS.cogumelo, [
    ...cycle(SHEETS.cogumelo.anims.walk, 'walk', (c, k) => drawCogumelo(c, k * 2, { walk: k * TAU, swell: 0 })),
    ...ramp(SHEETS.cogumelo.anims.swell, 'swell', (c, k) => drawCogumelo(c, 0, { swell: 0.2 + k * 0.8 })),
  ]);
  bakeSheet(scene, SHEETS.caipora, [
    ...cycle(SHEETS.caipora.anims.idle, 'idle', (c, k) => drawCaipora(c, k * Math.PI, {})),
    ...cycle(SHEETS.caipora.anims.run, 'run', (c, k) => drawCaipora(c, 0, { walk: k * TAU })),
    ...ramp(SHEETS.caipora.anims.raise, 'raise', (c, k) => drawCaipora(c, 0, { raise: 0.5 + k * 0.5 })),
  ]);
  bakeSheet(scene, SHEETS.curupira, [
    ...cycle(SHEETS.curupira.anims.idle, 'idle', (c, k) => drawCurupira(c, k * 1.4, {})),
    ...ramp(SHEETS.curupira.anims.cast, 'cast', (c, k) => drawCurupira(c, k * 0.5, { cast: 0.4 + k * 0.6 })),
    ...cycle(SHEETS.curupira.anims.fake, 'fake', (c, k) => drawCurupira(c, k * 1.4, { fake: true })),
  ]);
  /* fase 3: o Curupira montado numa queixada */
  const mounted = (c: Ctx, t: number, walk: number | undefined) => {
    drawQueixada(c, t, walk == null ? {} : { walk });
    c.save(); c.translate(-2, -30); c.scale(0.62, 0.62); drawCurupira(c, t, {}); c.restore();
  };
  bakeSheet(scene, SHEETS.curupira_m, [
    ...cycle(SHEETS.curupira_m.anims.idle, 'idle', (c, k) => mounted(c, k * 1.4, undefined)),
    ...cycle(SHEETS.curupira_m.anims.run, 'run', (c, k) => mounted(c, k * 1.4, k * TAU)),
  ]);
  bakeSheet(scene, SHEETS.capivara, [
    ...cycle(SHEETS.capivara.anims.idle, 'idle', (c, k) => drawCapi(c, k * 2.417, {})),
    ...cycle(SHEETS.capivara.anims.walk, 'walk', (c, k) => drawCapi(c, 0, { walk: k * TAU / 1.4 * 1.4 })),
  ]);
  bakeSheet(scene, SHEETS.onca, [
    ...cycle(SHEETS.onca.anims.idle, 'idle', (c, k) => drawOnca(c, k * 2.4, {})),
    ...cycle(SHEETS.onca.anims.walk, 'walk', (c, k) => drawOnca(c, 0, { walk: k * TAU })),
    ...ramp(SHEETS.onca.anims.pounce, 'pounce', (c, k) => drawOnca(c, 0, { pounce: 0.4 + k * 0.6 })),
  ]);

  simple(scene, 'shadow', 128, 48, (c) => {
    const g = c.createRadialGradient(64, 24, 2, 64, 24, 62);
    g.addColorStop(0, 'rgba(6,16,10,.55)'); g.addColorStop(0.7, 'rgba(6,16,10,.38)'); g.addColorStop(1, 'rgba(6,16,10,0)');
    c.save(); c.translate(64, 24); c.scale(1, 0.36); c.translate(-64, -24); c.fillStyle = g; c.fillRect(0, -80, 128, 208); c.restore();
  });
  simple(scene, 'thorn', 48, 16, (c) => {
    c.fillStyle = 'rgba(120,220,90,.35)'; c.fillRect(0, 5.5, 30, 5);
    cel(c, (p: Ctx) => poly(p, [18, 2.5, 46, 8, 18, 13.5, 24, 8]), '#7bd45a', { k: 0.8, lw: 2 });
  });
  simple(scene, 'ethorn', 48, 16, (c) => {
    c.fillStyle = 'rgba(255,90,140,.4)'; c.fillRect(0, 5.5, 30, 5);
    cel(c, (p: Ctx) => poly(p, [18, 2.5, 46, 8, 18, 13.5, 24, 8]), '#8d8a94', { k: 0.8, lw: 2 });
  });
  simple(scene, 'arrow', 64, 14, (c) => {
    c.fillStyle = 'rgba(255,240,200,.3)'; c.fillRect(0, 5.5, 36, 3);
    c.fillStyle = '#7a4a22'; c.fillRect(10, 6, 40, 2.4);
    cel(c, (p: Ctx) => poly(p, [48, 2, 62, 7, 48, 12]), '#ebe6d6', { k: 0.6, lw: 1.6 });
    cel(c, (p: Ctx) => poly(p, [8, 2.5, 18, 7, 8, 11.5, 12, 7]), '#cf3b28', { k: 0, lw: 1.4 });
  });
  simple(scene, 'seed', 24, 24, (c) => {
    cel(c, (p: Ctx) => el(p, 12, 12, 8.5, 7, 0.4), '#8a9a5a', { k: 1.3, lw: 2.2 });
  });
  simple(scene, 'puff', 32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  });
  simple(scene, 'altar', 140, 130, (c) => { c.translate(70, 118); c.scale(1.8, 1.8); drawAltar(c, 0, {}); });
  simple(scene, 'cage', 110, 110, (c) => { c.translate(55, 100); c.scale(1.8, 1.8); drawCage(c, 0, { open: 0 }); });
  for (const k of ICON_KEYS) simple(scene, 'ic_' + k, 48, 48, (c) => drawMiscIcon(c, k, 48));

  for (let i = 0; i < 3; i++) simple(scene, 'bg' + i, VIEW.w, VIEW.h, (c) => paintGround(c, VIEW.w, VIEW.h, ARENA, 31 + i * 17));
  simple(scene, 'canopy', VIEW.w, VIEW.h, (c) => paintCanopy(c, VIEW.w, VIEW.h, 77));
  simple(scene, 'rays', VIEW.w, VIEW.h, (c) => paintRays(c, VIEW.w, VIEW.h));
}
