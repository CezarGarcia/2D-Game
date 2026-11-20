// @ts-nocheck
/**
 * Arte do Capítulo 7, "Pantanal da Cuca" (elemento Encanto).
 * Contrato em src/art/kit.ts; lista de criaturas em docs/arte/etapa3-criaturas.md.
 * Os bichos ficam em ch7_mobs.ts, ch7_boss.ts e ch7_pets.ts; o cenário (chão, moldura e mapa) em ch7_scene.ts.
 */
import { drawAriranha, drawSoco, drawJararaca, drawCururu, drawTracaja, drawCaldeirao } from './ch7_mobs';
import { drawPisadeira, drawCuca } from './ch7_boss';
import { drawJacarezinho, drawTuiuiu } from './ch7_pets';
import { paintPantanalGround, paintPantanalCanopy, paintPantanalMap } from './ch7_scene';

const MOB = { move: 8, atk: 4 };
const BOSS = { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 };
const sheets = {
  ariranha: { key: 'ariranha', cellW: 84, cellH: 50, ox: 34, oy: 42, scale: 1.4, anims: MOB },
  soco: { key: 'soco', cellW: 100, cellH: 76, ox: 30, oy: 70, scale: 1.45, anims: MOB },
  jararaca: { key: 'jararaca', cellW: 92, cellH: 50, ox: 36, oy: 42, scale: 1.4, anims: { ...MOB, hide: 3 } },
  cururu: { key: 'cururu', cellW: 88, cellH: 76, ox: 46, oy: 66, scale: 1.45, anims: MOB },
  pisadeira: { key: 'pisadeira', cellW: 128, cellH: 186, ox: 52, oy: 176, scale: 1.8, anims: BOSS },
  cuca: { key: 'cuca', cellW: 170, cellH: 196, ox: 74, oy: 178, scale: 1.7, anims: BOSS },
  cuca_free: { key: 'cuca_free', cellW: 170, cellH: 196, ox: 74, oy: 178, scale: 1.7, anims: { idle: 6 } },
  jacarezinho: { key: 'jacarezinho', cellW: 98, cellH: 46, ox: 46, oy: 38, scale: 1.5, anims: { idle: 4, walk: 8, act: 3 } },
  tuiuiu: { key: 'tuiuiu', cellW: 90, cellH: 80, ox: 40, oy: 66, scale: 1.1, anims: { fly: 6, act: 3 }, fly: true },
  tracaja: { key: 'tracaja', cellW: 118, cellH: 78, ox: 50, oy: 66, scale: 1.45, anims: MOB },
};

export const ART = {
  chapter: 7,
  sheets,
  bake(kit) {
    kit.creature(sheets.ariranha, drawAriranha);
    kit.creature(sheets.soco, drawSoco);
    kit.creature(sheets.jararaca, drawJararaca);
    kit.creature(sheets.cururu, drawCururu);
    kit.creature(sheets.tracaja, drawTracaja);
    kit.creature(sheets.pisadeira, drawPisadeira);
    kit.creature(sheets.cuca, (c, a, k) => drawCuca(c, a, k, false));
    kit.creature(sheets.cuca_free, (c, a, k) => drawCuca(c, a, k, true));
    kit.creature(sheets.jacarezinho, drawJacarezinho);
    kit.creature(sheets.tuiuiu, drawTuiuiu);
    kit.image('caldeirao', 80, 76, (c) => drawCaldeirao(c, 80, 76));
  },
  ground: (c, W, H, variant, seed) => paintPantanalGround(c, W, H, variant, seed),
  canopy: (c, W, H, seed) => paintPantanalCanopy(c, W, H, seed),
  map: (c, w, h, points) => paintPantanalMap(c, w, h, points),
};
