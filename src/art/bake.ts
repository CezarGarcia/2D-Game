/**
 * Transforma o desenho por código em texturas do Phaser. Cada personagem é desenhado uma vez,
 * quadro a quadro, numa folha de sprites; durante o jogo só se troca o quadro.
 */
import Phaser from 'phaser';
import { ARENA, VIEW } from '../data/balance';
import { paintCanopy, paintGround, paintRays } from './arena';
import { cel, drawCuspidor, drawHero, drawQueixada, drawSauva, drawTronco, el, poly } from './characters';

/** As texturas são geradas com o dobro da resolução lógica, para continuarem nítidas em tela cheia. */
export const BAKE = 2;

type Draw = (c: CanvasRenderingContext2D) => void;

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
  sauva: { key: 'sauva', cellW: 112, cellH: 88, ox: 46, oy: 76, scale: 1.45, anims: { walk: 8 } },
  queixada: { key: 'queixada', cellW: 172, cellH: 114, ox: 68, oy: 102, scale: 1.9, anims: { idle: 4, run: 8 } },
  tronco: { key: 'tronco', cellW: 204, cellH: 214, ox: 102, oy: 200, scale: 2.1, anims: { raise: 7 } },
  cuspidor: { key: 'cuspidor', cellW: 152, cellH: 142, ox: 60, oy: 128, scale: 1.9, anims: { open: 5 } },
} satisfies Record<string, Sheet>;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
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

function frames(n: number, name: string, draw: (c: CanvasRenderingContext2D, k: number) => void): [string, Draw][] {
  return Array.from({ length: n }, (_, i) => [name + i, (c: CanvasRenderingContext2D) => draw(c, i / n)] as [string, Draw]);
}

function simple(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): void {
  const [cv, c] = canvas(w * BAKE, h * BAKE);
  c.scale(BAKE, BAKE);
  draw(c);
  scene.textures.addCanvas(key, cv);
}

export function bakeAll(scene: Phaser.Scene): void {
  const H = SHEETS.hero.anims;
  bakeSheet(scene, SHEETS.hero, [
    ...frames(H.idle, 'idle', (c, k) => drawHero(c, k * 2.618, {})),
    ...frames(H.walk, 'walk', (c, k) => drawHero(c, k * 2.618, { walk: k * TAU })),
    ...Array.from({ length: H.atk }, (_, i) => ['atk' + i, (c: CanvasRenderingContext2D) => drawHero(c, 0, { swing: i / (H.atk - 1) })] as [string, Draw]),
  ]);
  bakeSheet(scene, SHEETS.sauva, frames(SHEETS.sauva.anims.walk, 'walk', (c, k) => drawSauva(c, k * 2.094, { walk: k * TAU })));
  bakeSheet(scene, SHEETS.queixada, [
    ...frames(SHEETS.queixada.anims.idle, 'idle', (c, k) => drawQueixada(c, k * Math.PI, {})),
    ...frames(SHEETS.queixada.anims.run, 'run', (c, k) => drawQueixada(c, 0, { walk: k * TAU })),
  ]);
  const R = SHEETS.tronco.anims.raise;
  bakeSheet(scene, SHEETS.tronco, Array.from({ length: R }, (_, i) => ['raise' + i, (c: CanvasRenderingContext2D) => drawTronco(c, 0, { raise: i / (R - 1) })] as [string, Draw]));
  const O = SHEETS.cuspidor.anims.open;
  bakeSheet(scene, SHEETS.cuspidor, Array.from({ length: O }, (_, i) => ['open' + i, (c: CanvasRenderingContext2D) => drawCuspidor(c, 0, { open: i / (O - 1) })] as [string, Draw]));

  simple(scene, 'shadow', 128, 48, (c) => {
    const g = c.createRadialGradient(64, 24, 2, 64, 24, 62);
    g.addColorStop(0, 'rgba(6,16,10,.55)'); g.addColorStop(0.7, 'rgba(6,16,10,.38)'); g.addColorStop(1, 'rgba(6,16,10,0)');
    c.save(); c.translate(64, 24); c.scale(1, 0.36); c.translate(-64, -24); c.fillStyle = g; c.fillRect(0, -80, 128, 208); c.restore();
  });
  simple(scene, 'thorn', 48, 16, (c) => {
    c.fillStyle = 'rgba(120,220,90,.35)'; c.fillRect(0, 5.5, 30, 5);
    cel(c, (p: CanvasRenderingContext2D) => poly(p, [18, 2.5, 46, 8, 18, 13.5, 24, 8]), '#7bd45a', { k: 0.8, lw: 2 });
  });
  simple(scene, 'seed', 24, 24, (c) => {
    cel(c, (p: CanvasRenderingContext2D) => el(p, 12, 12, 8.5, 7, 0.4), '#8a9a5a', { k: 1.3, lw: 2.2 });
  });
  simple(scene, 'puff', 32, 32, (c) => {
    const g = c.createRadialGradient(16, 16, 1, 16, 16, 15);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  });

  simple(scene, 'bg', VIEW.w, VIEW.h, (c) => paintGround(c, VIEW.w, VIEW.h, ARENA, 31));
  simple(scene, 'canopy', VIEW.w, VIEW.h, (c) => paintCanopy(c, VIEW.w, VIEW.h, 77));
  simple(scene, 'rays', VIEW.w, VIEW.h, (c) => paintRays(c, VIEW.w, VIEW.h));
}
