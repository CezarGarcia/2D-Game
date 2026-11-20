// @ts-nocheck
/**
 * Arte do Capítulo 3, "Sertão" (elemento Tempestade): folhas dos bichos, chão da arena, moldura e mapa.
 * Contrato em src/art/kit.ts; lista de criaturas em docs/arte/etapa3-criaturas.md.
 * Desenhos: ch3_mobs.ts (monstros comuns), ch3_bosses.ts (Corpo-Seco, Saci, companheiros, poeira),
 * ch3_scene.ts (chão, moldura e mapa).
 */
import { drawCalango, drawCascavel, drawMandacaru, drawBode, drawUrubu } from './ch3_mobs';
import { drawCorpoSeco, drawSaci, drawTatu, drawCarcara, drawPoeira } from './ch3_bosses';
import { paintGround, paintCanopy, paintMap } from './ch3_scene';

const MOB = { move: 8, atk: 4 };
const BOSS = { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 };

const sheets = {
  calango: { key: 'calango', cellW: 54, cellH: 36, ox: 27, oy: 31, scale: 1.0, anims: { ...MOB } },
  cascavel: { key: 'cascavel', cellW: 96, cellH: 72, ox: 44, oy: 66, scale: 1.4, anims: { ...MOB, hide: 3 } },
  mandacaru: { key: 'mandacaru', cellW: 96, cellH: 76, ox: 38, oy: 70, scale: 1.35, anims: { move: 6, atk: 4 } },
  bode: { key: 'bode', cellW: 84, cellH: 78, ox: 36, oy: 72, scale: 1.4, anims: { ...MOB } },
  urubu: { key: 'urubu', cellW: 80, cellH: 92, ox: 38, oy: 70, scale: 1.0, anims: { move: 6, atk: 4 }, fly: true },
  corposeco: { key: 'corposeco', cellW: 172, cellH: 158, ox: 72, oy: 146, scale: 1.65, anims: { ...BOSS } },
  saci: { key: 'saci', cellW: 150, cellH: 152, ox: 66, oy: 138, scale: 1.45, anims: { ...BOSS } },
  saci_free: { key: 'saci_free', cellW: 120, cellH: 124, ox: 54, oy: 112, scale: 1.45, anims: { idle: 6 } },
  tatu: { key: 'tatu', cellW: 64, cellH: 48, ox: 30, oy: 40, scale: 1.3, anims: { idle: 4, walk: 8, act: 3 } },
  carcara: { key: 'carcara', cellW: 76, cellH: 84, ox: 36, oy: 70, scale: 1.25, anims: { fly: 6, act: 3 }, fly: true },
  poeira: { key: 'poeira', cellW: 96, cellH: 118, ox: 48, oy: 108, scale: 1.5, anims: { move: 6 } },
};

export const ART = {
  chapter: 3,
  sheets,
  bake(kit) {
    kit.creature(sheets.calango, drawCalango);
    kit.creature(sheets.cascavel, drawCascavel);
    kit.creature(sheets.mandacaru, drawMandacaru);
    kit.creature(sheets.bode, drawBode);
    kit.creature(sheets.urubu, drawUrubu);
    kit.creature(sheets.corposeco, drawCorpoSeco);
    kit.creature(sheets.saci, (c, a, k) => drawSaci(c, a, k, false));
    kit.creature(sheets.saci_free, (c, a, k) => drawSaci(c, a, k, true));
    kit.creature(sheets.tatu, drawTatu);
    kit.creature(sheets.carcara, drawCarcara);
    kit.creature(sheets.poeira, drawPoeira);
  },
  ground(c, W, H, variant, seed) { paintGround(c, W, H, variant, seed); },
  canopy(c, W, H, seed) { paintCanopy(c, W, H, seed); },
  map(c, w, h, points) { paintMap(c, w, h, points); },
};
