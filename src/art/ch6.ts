// @ts-nocheck
/**
 * Arte do Capítulo 6, "Pampa de lua cheia" (elemento Sombra).
 * Bichos em ch6_mobs.ts e ch6_boss.ts, cenário (chão, moldura e mapa) em ch6_scene.ts.
 * Contrato em src/art/kit.ts; lista de criaturas em docs/arte/etapa3-criaturas.md.
 */
import { TAU } from './ch6_common';
import { drawQueroquero, drawBoi, drawAlma, drawFatuo, drawEspantalho } from './ch6_mobs';
import { drawTeiniagua, drawLobisomemH, drawLobisomem } from './ch6_boss';
import { drawGraxaim, drawCoruja } from './ch6_pets';
import { paintGround, paintCanopy, paintMap } from './ch6_scene';

const S = (key, cellW, cellH, ox, oy, scale, anims, fly) => ({ key, cellW, cellH, ox, oy, scale, anims, ...(fly ? { fly: true } : {}) });

const BOSS = { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 };

const sheets = {
  queroquero: S('queroquero', 64, 60, 30, 46, 1.15, { move: 6, atk: 4 }, true),
  boibarroso: S('boibarroso', 136, 92, 58, 84, 1.4, { move: 8, atk: 4 }),
  almapenada: S('almapenada', 84, 96, 40, 82, 1.4, { move: 6, atk: 4 }, true),
  fatuo: S('fatuo', 84, 84, 42, 60, 1.3, { move: 6, atk: 4 }, true),
  espantalho: S('espantalho', 104, 104, 46, 96, 1.4, { move: 8, atk: 4 }),
  teiniagua: S('teiniagua', 150, 124, 76, 112, 1.35, BOSS),
  lobisomem_h: S('lobisomem_h', 140, 136, 62, 124, 1.55, BOSS),
  lobisomem: S('lobisomem', 200, 210, 86, 196, 1.62, BOSS),
  lobisomem_free: S('lobisomem_free', 190, 180, 90, 168, 1.62, { idle: 6 }),
  graxaim: S('graxaim', 84, 64, 46, 56, 1.3, { idle: 4, walk: 8, act: 3 }),
  coruja: S('coruja', 76, 64, 38, 52, 1.2, { fly: 6, act: 3 }, true),
};

export const ART = {
  chapter: 6,
  sheets,
  bake(kit) {
    kit.creature(sheets.queroquero, (c, a, k) => (a === 'atk' ? drawQueroquero(c, { atk: k }) : drawQueroquero(c, { flap: k * TAU })));
    kit.creature(sheets.boibarroso, (c, a, k) => (a === 'atk' ? drawBoi(c, { atk: k }) : drawBoi(c, { walk: k * TAU })));
    kit.creature(sheets.almapenada, (c, a, k) => (a === 'atk' ? drawAlma(c, { t: k * .5, atk: k }) : drawAlma(c, { t: k })));
    kit.creature(sheets.fatuo, (c, a, k) => (a === 'atk' ? drawFatuo(c, { t: k * .3, atk: k }) : drawFatuo(c, { t: k })));
    kit.creature(sheets.espantalho, (c, a, k) => (a === 'atk' ? drawEspantalho(c, { atk: k }) : drawEspantalho(c, { walk: k * TAU })));
    kit.creature(sheets.teiniagua, drawTeiniagua);
    kit.creature(sheets.lobisomem_h, drawLobisomemH);
    kit.creature(sheets.lobisomem, (c, a, k) => drawLobisomem(c, a, k, false));
    kit.creature(sheets.lobisomem_free, (c, a, k) => drawLobisomem(c, a, k, true));
    kit.creature(sheets.graxaim, (c, a, k) => (a === 'act' ? drawGraxaim(c, { act: k }) : a === 'walk' ? drawGraxaim(c, { walk: k * TAU }) : drawGraxaim(c, { t: k })));
    kit.creature(sheets.coruja, (c, a, k) => (a === 'act' ? drawCoruja(c, { act: k }) : drawCoruja(c, { flap: k * TAU })));
  },
  ground(c, W, H, variant, seed) { c.save(); paintGround(c, W, H, variant, seed); c.restore(); },
  canopy(c, W, H, seed) { c.save(); paintCanopy(c, W, H, seed); c.restore(); },
  map(c, w, h, points) { c.save(); paintMap(c, w, h, points || []); c.restore(); },
};
