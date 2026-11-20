// @ts-nocheck
/**
 * Arte do Capítulo 4, "Cerrado em chamas" (elemento Fogo).
 * Contrato em src/art/kit.ts; lista de criaturas em docs/arte/etapa3-criaturas.md.
 * Desenhos em ch4_mobs.ts (monstros), ch4_boss.ts (Mula-sem-Cabeça e Boitatá), ch4_pets.ts (companheiros, fogo, capim)
 * e ch4_scene.ts (chão, moldura e mapa).
 */
import { drawFormiga, drawSeriema, drawPequizeiro, drawCupinzeiro, drawTaturana } from './ch4_mobs';
import { drawMula, drawBoitata, drawBoitataSeg, drawBoitataTail } from './ch4_boss';
import { drawLoboguara, drawTamandua, drawChama, drawCapim } from './ch4_pets';
import { paintGround, paintCanopy, paintMap } from './ch4_scene';

const MOB = { move: 6, atk: 4 };
const BOSS = { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 };
const PET = { idle: 4, walk: 8, act: 3 };

const S = (key, cellW, cellH, ox, oy, scale, anims, fly) => ({ key, cellW, cellH, ox, oy, scale, anims, ...(fly ? { fly: true } : {}) });

const sheets = {
  formiga: S('formiga', 40, 34, 19, 28, 0.62, MOB),
  seriema: S('seriema', 84, 78, 38, 72, 0.76, { move: 8, atk: 4 }),
  pequizeiro: S('pequizeiro', 100, 96, 50, 90, 0.8, MOB),
  cupinzeiro: S('cupinzeiro', 110, 136, 55, 126, 0.92, MOB),
  taturana: S('taturana', 56, 44, 28, 36, 0.68, MOB),
  mula: S('mula', 268, 190, 114, 176, 1.1, BOSS),
  boitata: S('boitata', 250, 130, 76, 112, 1, BOSS),
  boitata_free: S('boitata_free', 170, 130, 76, 112, 1, { idle: 6 }),
  loboguara: S('loboguara', 100, 66, 60, 60, 0.78, PET),
  tamandua: S('tamandua', 76, 60, 40, 54, 0.62, PET),
  chama: S('chama', 72, 84, 36, 76, 1, { move: 6 }),
};

const DRAW = {
  formiga: drawFormiga, seriema: drawSeriema, pequizeiro: drawPequizeiro, cupinzeiro: drawCupinzeiro, taturana: drawTaturana,
  mula: drawMula, boitata: drawBoitata, boitata_free: (c, a, k) => drawBoitata(c, a, k, { free: true }),
  loboguara: drawLoboguara, tamandua: drawTamandua, chama: drawChama,
};

export const ART = {
  chapter: 4,
  sheets,
  bake(kit) {
    for (const key of Object.keys(sheets)) kit.creature(sheets[key], DRAW[key]);
    kit.image('boitata_seg', 70, 70, (c) => drawBoitataSeg(c, false));
    kit.image('boitata_cauda', 70, 70, (c) => drawBoitataTail(c, false));
    kit.image('capim', 96, 96, (c) => drawCapim(c));
  },
  ground(c, W, H, variant, seed) { c.save(); paintGround(c, W, H, variant, seed); c.restore(); },
  canopy(c, W, H, seed) { c.save(); paintCanopy(c, W, H, seed); c.restore(); },
  map(c, w, h, points) { c.save(); paintMap(c, w, h, points); c.restore(); },
};
