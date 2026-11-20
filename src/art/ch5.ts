// @ts-nocheck
/**
 * Arte do Capítulo 5 · Selva Profunda (elemento Terra).
 * Contrato em src/art/kit.ts; lista de criaturas em docs/arte/etapa3-criaturas.md.
 * Os desenhos estão em ch5_mobs.ts (monstros), ch5_boss.ts (Capelobo e Mapinguari), ch5_pets.ts
 * (companheiros) e ch5_scene.ts (chão, moldura e mapa). As arenas deste capítulo são escuras: os
 * Assombros ganham um fio de luz em volta da silhueta e olhos rosa com halo (veja ch5_util.ts).
 */
import { bakeRimmed, cl } from './ch5_util';
import { morcego, morcegoFx, besouro, besouroFx, aranha, aranhaFx, macaco, macacoFx, totem, totemFx } from './ch5_mobs';
import { capelobo, capeloboFx, mapinguari, mapinguariFx, mapinguariFree, mapinguariFreeFx } from './ch5_boss';
import { vagalume, vagalumeFx, preguica, preguicaFx, sucuri, sucuriFx } from './ch5_pets';
import { paintGround, paintCanopy, paintMap } from './ch5_scene';

const S = (key, cellW, cellH, ox, oy, scale, anims, fly = false) => ({ key, cellW, cellH, ox, oy, scale, anims, fly });
const MOB = { move: 8, atk: 4 }, BOSS = { idle: 6, move: 8, atk: 4, cast: 4, down: 2, special: 6 };

const sheets = {
  morcego: S('morcego', 78, 70, 40, 58, 1.3, MOB, true),
  besouro: S('besouro', 124, 96, 54, 84, 1.45, MOB),
  aranha: S('aranha', 104, 156, 50, 142, 1.35, { move: 8, atk: 4, hide: 3 }),
  macaco: S('macaco', 100, 96, 50, 86, 1.25, MOB),
  totem: S('totem', 100, 104, 50, 92, 1.35, { move: 6, atk: 4 }),
  capelobo: S('capelobo', 236, 232, 112, 214, 1.7, BOSS),
  mapinguari: S('mapinguari', 256, 268, 124, 252, 1.55, BOSS),
  mapinguari_free: S('mapinguari_free', 256, 268, 124, 252, 1.55, { idle: 6 }),
  vagalume: S('vagalume', 84, 84, 42, 66, 1.2, { fly: 6, act: 3 }, true),
  preguica: S('preguica', 100, 104, 48, 92, 1.4, { idle: 4, walk: 8, act: 3 }),
  sucuri: S('sucuri', 130, 100, 62, 84, 1.5, { idle: 4, walk: 8, act: 3 }),
};

/* corpo e efeitos de cada folha; `rim` escolhe o fio de luz por quadro */
const ASSOMBRO = 'rgba(196,228,216,.92)', PET = 'rgba(255,236,196,.55)';
const DRAW = {
  morcego: [morcego, morcegoFx], besouro: [besouro, besouroFx], aranha: [aranha, aranhaFx], macaco: [macaco, macacoFx], totem: [totem, totemFx],
  capelobo: [capelobo, capeloboFx], mapinguari: [mapinguari, mapinguariFx], mapinguari_free: [mapinguariFree, mapinguariFreeFx, PET],
  vagalume: [vagalume, vagalumeFx, PET], preguica: [preguica, preguicaFx, PET], sucuri: [sucuri, sucuriFx, PET],
};
function rimOf(key, anim, k) {
  const col = DRAW[key][2] || ASSOMBRO;
  /* a aranha pendurada no escuro: só os olhos aparecem */
  if (key === 'aranha' && anim === 'hide') { const h = 1 - cl(k); return { col, rim: 1.3 * (1 - h * .8), dim: h * .72 }; }
  return { col, rim: col === PET ? 1 : 1.3 };
}

export const ART = {
  chapter: 5,
  sheets,
  bake(kit) {
    for (const key of Object.keys(sheets)) {
      const s = sheets[key], [body, fx] = DRAW[key];
      bakeRimmed(kit, s, body, fx, (anim, k) => rimOf(key, anim, k));
    }
  },
  ground: paintGround,
  canopy: paintCanopy,
  map: paintMap,
};
