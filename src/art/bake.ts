/**
 * Transforma o desenho por código em texturas do Phaser. Cada personagem é desenhado uma vez,
 * quadro a quadro, numa folha de sprites; durante o jogo só se troca o quadro.
 */
import Phaser from 'phaser';
import { ARENA, VIEW } from '../data/balance';
import { paintCanopy, paintGround, paintRays } from './arena';
import { paintRiverCanopy, paintRiverGround } from './arena2';
import { cel, drawCapi, drawCurupira, drawCuspidor, drawHero, drawQueixada, drawSauva, drawTronco, el, poly } from './characters';
import { drawAltar, drawCage, drawCaipora, drawCogumelo, drawOnca, drawUrutau } from './characters2';
import { drawArara, drawArraia, drawBoto, drawCaramujo, drawIara, drawJacare, drawPiranha, drawSapo } from './characters3';
import { drawMiscIcon } from './icons';
import { UI_ICON_KEYS, drawUiIcon } from './uiicons';
import { CHAPTER_ART, CHAPTER_SHEETS, SHEET_CHAPTER } from './chapters';
import { bakeFx } from './fx';
import { bakeLoot } from './loot';
import { RAMP_ANIMS, type Kit, type Sheet } from './kit';
import { TORRE } from './torre';

/** As texturas são geradas com o dobro da resolução lógica, para continuarem nítidas em tela cheia. */
export const BAKE = 2;

type Ctx = CanvasRenderingContext2D;
type Draw = (c: Ctx) => void;
export type { Sheet } from './kit';

const TAU = Math.PI * 2;

export const SHEETS = {
  hero: { key: 'hero', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_arco: { key: 'hero_arco', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_borduna: { key: 'hero_borduna', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_peixeiras: { key: 'hero_peixeiras', cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_zagaia: { key: 'hero_zagaia', cellW: 220, cellH: 200, ox: 90, oy: 182, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  hero_cajado: { key: 'hero_cajado', cellW: 200, cellH: 210, ox: 80, oy: 192, scale: 1.5, anims: { idle: 12, walk: 10, atk: 7 } },
  sauva: { key: 'sauva', cellW: 112, cellH: 88, ox: 46, oy: 76, scale: 1.45, anims: { walk: 8 } },
  queixada: { key: 'queixada', cellW: 172, cellH: 114, ox: 68, oy: 102, scale: 1.9, anims: { idle: 4, run: 8 } },
  tronco: { key: 'tronco', cellW: 204, cellH: 214, ox: 102, oy: 200, scale: 2.1, anims: { raise: 7 } },
  cuspidor: { key: 'cuspidor', cellW: 152, cellH: 142, ox: 60, oy: 128, scale: 1.9, anims: { open: 5 } },
  urutau: { key: 'urutau', cellW: 190, cellH: 150, ox: 95, oy: 128, scale: 1.6, anims: { perch: 3, fly: 8 } },
  cogumelo: { key: 'cogumelo', cellW: 124, cellH: 124, ox: 62, oy: 108, scale: 1.7, anims: { walk: 6, swell: 5 } },
  caipora: { key: 'caipora', cellW: 200, cellH: 190, ox: 82, oy: 170, scale: 1.9, anims: { idle: 4, run: 8, raise: 2 } },
  curupira: { key: 'curupira', cellW: 190, cellH: 240, ox: 86, oy: 218, scale: 1.75, anims: { idle: 8, cast: 3, fake: 8 } },
  curupira_m: { key: 'curupira_m', cellW: 220, cellH: 250, ox: 92, oy: 230, scale: 1.9, anims: { idle: 4, run: 8 } },
  capivara: { key: 'capivara', cellW: 110, cellH: 84, ox: 46, oy: 72, scale: 1.45, anims: { idle: 4, walk: 8 } },
  onca: { key: 'onca', cellW: 136, cellH: 90, ox: 62, oy: 76, scale: 1.45, anims: { idle: 4, walk: 8, pounce: 3 } },
  /* capítulo 2: Rios do Norte */
  piranha: { key: 'piranha', cellW: 76, cellH: 64, ox: 42, oy: 50, scale: 1.3, anims: { swim: 6, leap: 3 } },
  sapo: { key: 'sapo', cellW: 108, cellH: 76, ox: 58, oy: 56, scale: 1.25, anims: { idle: 4, hop: 4, spit: 4 } },
  arraia: { key: 'arraia', cellW: 120, cellH: 92, ox: 68, oy: 76, scale: 1.45, anims: { reveal: 4, swim: 6, sting: 3 } },
  caramujo: { key: 'caramujo', cellW: 106, cellH: 100, ox: 56, oy: 76, scale: 1.25, anims: { walk: 6 } },
  jacare: { key: 'jacare', cellW: 200, cellH: 96, ox: 112, oy: 80, scale: 1.55, anims: { walk: 8, bite: 4, tail: 4 } },
  boto: { key: 'boto', cellW: 150, cellH: 196, ox: 68, oy: 172, scale: 1.6, anims: { idle: 6, cast: 3, dive: 4, tired: 2 } },
  iara: { key: 'iara', cellW: 236, cellH: 236, ox: 116, oy: 210, scale: 1.66, anims: { idle: 8, cast: 3, sing: 4, dive: 4, down: 2 } },
  iara_free: { key: 'iara_free', cellW: 236, cellH: 236, ox: 116, oy: 210, scale: 1.66, anims: { idle: 6 } },
  arara: { key: 'arara', cellW: 72, cellH: 72, ox: 40, oy: 58, scale: 1.15, anims: { fly: 6, caged: 1 } },
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

/** Folha do herói para cada arma. */
export const HERO_SHEET: Record<string, Sheet> = {
  facao: SHEETS.hero, arco: SHEETS.hero_arco, borduna: SHEETS.hero_borduna, peixeiras: SHEETS.hero_peixeiras, zagaia: SHEETS.hero_zagaia, cajado: SHEETS.hero_cajado,
};

/** Todas as folhas de sprites, dos capítulos 1 e 2 e dos arquivos de capítulo. */
export const ALL_SHEETS: Record<string, Sheet> = { ...(SHEETS as unknown as Record<string, Sheet>), ...CHAPTER_SHEETS };

export function makeKit(scene: Phaser.Scene): Kit {
  return {
    creature(s, draw) {
      const frames: [string, Draw][] = [];
      for (const [name, n] of Object.entries(s.anims)) {
        const r = RAMP_ANIMS.includes(name);
        for (let i = 0; i < n; i++) { const k = r ? (n > 1 ? i / (n - 1) : 1) : i / n; frames.push([name + i, (c) => draw(c, name, k)]); }
      }
      if (!scene.textures.exists(s.key)) bakeSheet(scene, s, frames);
    },
    image(key, w, h, draw) { if (!scene.textures.exists(key)) simple(scene, key, w, h, draw); },
  };
}

const bakedChapters = new Set<number>();
/** Gera só os bichos de alguns capítulos (sem chão de arena): para companheiros e para o acampamento. */
export function bakeChapterSprites(scene: Phaser.Scene, chapters: number[]): void {
  const kit = makeKit(scene);
  for (const n of chapters) {
    const art = CHAPTER_ART[n];
    if (!art || bakedChapters.has(n)) continue;
    try { art.bake(kit); } catch (err) { console.error('arte do capítulo', n, err); }
    bakedChapters.add(n);
  }
}
/** Capítulo de onde vem a folha de sprites (0 se for dos capítulos 1 e 2). */
export function sheetChapter(key: string): number { return SHEET_CHAPTER[key] ?? 0; }
/**
 * Gera a arte de um capítulo de 3 a 8 na primeira vez que ela é pedida, e o chão das arenas dele.
 * Os chãos são texturas grandes: só fica na memória o do capítulo atual (e o da Torre, se for o caso).
 */
export function ensureChapterArt(scene: Phaser.Scene, chapters: number[], arenaOf: number | 'torre'): void {
  const kit = makeKit(scene);
  for (const n of chapters) {
    const art = CHAPTER_ART[n];
    if (!art || bakedChapters.has(n)) continue;
    try { art.bake(kit); } catch (err) { console.error('arte do capítulo', n, err); }
    bakedChapters.add(n);
  }
  for (const key of scene.textures.getTextureKeys()) {
    const m = /^(ch\d|torre)_(bg\d|canopy)$/.exec(key);
    if (m && m[1] !== (arenaOf === 'torre' ? 'torre' : 'ch' + arenaOf)) scene.textures.remove(key);
  }
  const src = arenaOf === 'torre' ? TORRE : CHAPTER_ART[arenaOf];
  if (!src) return;
  const pre = arenaOf === 'torre' ? 'torre' : 'ch' + arenaOf;
  for (let i = 0; i < 3; i++) kit.image(`${pre}_bg${i}`, VIEW.w, VIEW.h, (c) => src.ground(c, VIEW.w, VIEW.h, i, 31 + i * 17));
  kit.image(`${pre}_canopy`, VIEW.w, VIEW.h, (c) => src.canopy(c, VIEW.w, VIEW.h, 77));
}

export function bakeAll(scene: Phaser.Scene): void {
  for (const weapon of ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'] as const) {
    const s = HERO_SHEET[weapon], A = s.anims;
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
    ...ramp(SHEETS.caipora.anims.raise, 'raise', (c, k) => drawCaipora(c, 0, { raise: 0.85 + k * 0.15 })),
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
    ...cycle(SHEETS.capivara.anims.walk, 'walk', (c, k) => drawCapi(c, 0, { walk: (k * TAU) / 1.4 })),
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
  simple(scene, 'altar', 150, 160, (c) => { c.translate(75, 148); c.scale(1.8, 1.8); drawAltar(c, 0, {}); });
  simple(scene, 'cage', 110, 110, (c) => { c.translate(55, 100); c.scale(1.8, 1.8); drawCage(c, 0, { open: 0 }); });
  for (const k of ICON_KEYS) simple(scene, 'ic_' + k, 48, 48, (c) => drawMiscIcon(c, k, 48));

  for (let i = 0; i < 3; i++) simple(scene, 'bg' + i, VIEW.w, VIEW.h, (c) => paintGround(c, VIEW.w, VIEW.h, ARENA, 31 + i * 17));
  simple(scene, 'canopy', VIEW.w, VIEW.h, (c) => paintCanopy(c, VIEW.w, VIEW.h, 77));
  simple(scene, 'rays', VIEW.w, VIEW.h, (c) => paintRays(c, VIEW.w, VIEW.h));

  bakeRio(scene);
  bakeFx(makeKit(scene));
  bakeLoot(makeKit(scene));
  for (const k of UI_ICON_KEYS) simple(scene, 'ui_' + k, 64, 64, (c) => drawUiIcon(c, k, 64));
}

/** Um ciclo de animação dos bichos do rio fecha em TAU / 2,4 segundos. */
const LOOP = TAU / 2.4;

/** Capítulo 2, "Rios do Norte": bichos do rio, chefes, a arara e o cenário. */
function bakeRio(scene: Phaser.Scene): void {
  const S = SHEETS;
  bakeSheet(scene, S.piranha, [
    ...cycle(S.piranha.anims.swim, 'swim', (c, k) => drawPiranha(c, k * LOOP, { leap: 0 })),
    ...ramp(S.piranha.anims.leap, 'leap', (c, k) => drawPiranha(c, 0, { leap: 0.3 + k * 0.7 })),
  ]);
  bakeSheet(scene, S.sapo, [
    ...cycle(S.sapo.anims.idle, 'idle', (c, k) => drawSapo(c, k * LOOP, {})),
    ...ramp(S.sapo.anims.hop, 'hop', (c, k) => drawSapo(c, 0, { hop: 0.25 + k * 0.75 })),
    ...ramp(S.sapo.anims.spit, 'spit', (c, k) => drawSapo(c, 0, { spit: 0.25 + k * 0.75 })),
  ]);
  bakeSheet(scene, S.arraia, [
    ...ramp(S.arraia.anims.reveal, 'reveal', (c, k) => drawArraia(c, 0, { hidden: 1 - k })),
    ...cycle(S.arraia.anims.swim, 'swim', (c, k) => drawArraia(c, k * LOOP, { hidden: 0 })),
    ...ramp(S.arraia.anims.sting, 'sting', (c, k) => drawArraia(c, 0, { hidden: 0, sting: 0.3 + k * 0.7 })),
  ]);
  bakeSheet(scene, S.caramujo, cycle(S.caramujo.anims.walk, 'walk', (c, k) => drawCaramujo(c, k * LOOP, { walk: k * TAU, aura: 0.55 + 0.45 * Math.sin(k * TAU) })));
  bakeSheet(scene, S.jacare, [
    ...cycle(S.jacare.anims.walk, 'walk', (c, k) => drawJacare(c, 0, { walk: k * TAU })),
    ...ramp(S.jacare.anims.bite, 'bite', (c, k) => drawJacare(c, 0, { bite: 0.2 + k * 0.8 })),
    ...ramp(S.jacare.anims.tail, 'tail', (c, k) => drawJacare(c, 0, { tail: 0.2 + k * 0.8 })),
  ]);
  bakeSheet(scene, S.boto, [
    ...cycle(S.boto.anims.idle, 'idle', (c, k) => drawBoto(c, k * LOOP, {})),
    ...ramp(S.boto.anims.cast, 'cast', (c, k) => drawBoto(c, k * 0.5, { cast: 0.4 + k * 0.6 })),
    ...ramp(S.boto.anims.dive, 'dive', (c, k) => drawBoto(c, k * 0.6, { dive: 0.15 + k * 0.85 })),
    ...cycle(S.boto.anims.tired, 'tired', (c, k) => drawBoto(c, k * LOOP, { tired: true })),
  ]);
  bakeSheet(scene, S.iara, [
    ...cycle(S.iara.anims.idle, 'idle', (c, k) => drawIara(c, k * LOOP, {})),
    ...ramp(S.iara.anims.cast, 'cast', (c, k) => drawIara(c, k * 0.5, { cast: 0.4 + k * 0.6 })),
    ...cycle(S.iara.anims.sing, 'sing', (c, k) => drawIara(c, k * LOOP, { sing: 1 })),
    ...ramp(S.iara.anims.dive, 'dive', (c, k) => drawIara(c, k * 0.6, { dive: 0.15 + k * 0.85 })),
    ...cycle(S.iara.anims.down, 'down', (c, k) => drawIara(c, k * LOOP, { down: true })),
  ]);
  bakeSheet(scene, S.iara_free, cycle(S.iara_free.anims.idle, 'idle', (c, k) => drawIara(c, k * LOOP, { gray: false })));
  bakeSheet(scene, S.arara, [
    ...cycle(S.arara.anims.fly, 'fly', (c, k) => drawArara(c, k * LOOP, { fly: k * TAU })),
    ...ramp(S.arara.anims.caged, 'caged', (c) => drawArara(c, 0, { caged: true })),
  ]);

  /* projéteis e efeitos de água */
  const jet = (c: Ctx, body: string, light: string, out: string, trail: string) => {
    c.fillStyle = trail; c.beginPath(); c.moveTo(1, 7); c.quadraticCurveTo(14, 3.6, 26, 4.4); c.lineTo(26, 9.6); c.quadraticCurveTo(14, 10.4, 1, 7); c.fill();
    cel(c, (p: Ctx) => { p.moveTo(8, 7); p.bezierCurveTo(20, 5.4, 28, 1.6, 36, 1.8); p.bezierCurveTo(44.6, 2.2, 44.6, 11.8, 36, 12.2); p.bezierCurveTo(28, 12.4, 20, 8.6, 8, 7); p.closePath(); }, body, {
      k: 1.1, lw: 1.5, out, hi: 'rgba(255,255,255,.4)', inn: (p: Ctx) => {
        p.fillStyle = light; p.beginPath(); p.ellipse(35, 5, 4.4, 1.7, -0.1, 0, TAU); p.fill();
        p.strokeStyle = light; p.lineWidth = 1; p.lineCap = 'round'; p.beginPath(); p.moveTo(14, 6.8); p.quadraticCurveTo(22, 5.4, 29, 4.6); p.stroke();
      },
    });
  };
  simple(scene, 'jet', 44, 14, (c) => jet(c, '#7fd3f2', 'rgba(255,255,255,.85)', '#1b4a6b', 'rgba(140,220,255,.38)'));
  simple(scene, 'ejet', 44, 14, (c) => jet(c, '#b89aa8', 'rgba(255,224,240,.85)', '#3a2032', 'rgba(255,90,140,.4)'));
  simple(scene, 'bubble', 56, 56, (c) => {
    const g = c.createRadialGradient(24, 23, 4, 28, 28, 26);
    g.addColorStop(0, 'rgba(170,230,255,.1)'); g.addColorStop(0.72, 'rgba(150,220,255,.26)'); g.addColorStop(1, 'rgba(120,200,250,.55)');
    c.fillStyle = g; c.beginPath(); c.arc(28, 28, 25.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(27,74,107,.7)'; c.lineWidth = 2.6; c.stroke();
    c.strokeStyle = 'rgba(226,246,255,.9)'; c.lineWidth = 1.4; c.beginPath(); c.arc(28, 28, 24, 0, TAU); c.stroke();
    c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3.2; c.beginPath(); c.arc(28, 28, 19, 3.5, 4.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.ellipse(38, 13.6, 2.6, 1.7, 0.7, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.8; c.beginPath(); c.arc(28, 28, 20, 0.5, 1.3); c.stroke();
  });
  simple(scene, 'sting', 30, 8, (c) => {
    c.fillStyle = 'rgba(255,90,140,.4)'; c.fillRect(0, 2.8, 14, 2.4);
    cel(c, (p: Ctx) => poly(p, [7, 1.6, 20, 1.2, 29, 4, 20, 6.8, 7, 6.4, 10, 4]), '#a29fa9', { k: 0.6, lw: 1.3, inn: (p: Ctx) => { p.fillStyle = '#ff5c9a'; p.beginPath(); poly(p, [21, 0, 30, 4, 21, 8]); p.fill(); } });
  });
  simple(scene, 'spit', 22, 22, (c) => {
    cel(c, (p: Ctx) => { el(p, 11, 11.4, 7.8, 7.2, 0); el(p, 4.6, 15.6, 2.6, 2.3, 0); el(p, 16.8, 5.4, 2.2, 2, 0); }, '#8c9a7c', {
      k: 1.3, lw: 2, sh: 'rgba(30,44,20,.38)', hi: 'rgba(240,255,200,.36)', inn: (p: Ctx) => {
        p.fillStyle = 'rgba(240,255,210,.6)'; p.beginPath(); p.ellipse(8.4, 8.4, 2.6, 1.6, -0.6, 0, TAU); p.fill();
        p.fillStyle = 'rgba(40,56,30,.4)'; p.beginPath(); p.arc(13.6, 13.4, 1.3, 0, TAU); p.fill(); p.beginPath(); p.arc(9.6, 14.6, 0.9, 0, TAU); p.fill();
      },
    });
  });

  for (let i = 0; i < 3; i++) simple(scene, 'rio' + i, VIEW.w, VIEW.h, (c) => paintRiverGround(c, VIEW.w, VIEW.h, i, 41 + i * 17));
  simple(scene, 'riocanopy', VIEW.w, VIEW.h, (c) => paintRiverCanopy(c, VIEW.w, VIEW.h, 91));
}
