/**
 * Desenho dos companheiros e dos Encantados libertados para os retratos do menu.
 * Os bichos dos capítulos 1 e 2 vêm das funções de characters*.ts; os dos capítulos 3 a 8 vêm das folhas
 * de cada arquivo de capítulo (src/art/ch3.ts … ch8.ts): um kit de mentira só anota a função de desenho
 * de cada folha, e o retrato chama essa função direto no canvas do menu.
 */
import { drawCapi, drawCurupira, drawCuspidor, drawHero, drawQueixada, drawSauva, drawTronco } from '../art/characters';
import { drawCaipora, drawCogumelo, drawOnca, drawUrutau } from '../art/characters2';
import { drawArara, drawArraia, drawBoto, drawCaramujo, drawIara, drawJacare, drawPiranha, drawSapo } from '../art/characters3';
import { CHAPTER_ART } from '../art/chapters';
import type { Kit, Sheet } from '../art/kit';

type G = CanvasRenderingContext2D;
type SheetDraw = (c: G, anim: string, k: number) => void;

/** Medidas de uma folha: só o que o enquadramento usa. */
interface Frame { cellW: number; cellH: number; ox: number; oy: number; scale: number }
interface Figure { frame: Frame; draw: (c: G, t: number) => void }

/* folhas dos capítulos 3 a 8, anotadas na primeira vez que alguém pede */
let sheets: Map<string, { sheet: Sheet; draw: SheetDraw }> | null = null;
function chapterSheets(): Map<string, { sheet: Sheet; draw: SheetDraw }> {
  if (sheets) return sheets;
  const found = new Map<string, { sheet: Sheet; draw: SheetDraw }>();
  const kit: Kit = { creature: (sheet, draw) => { found.set(sheet.key, { sheet, draw }); }, image: () => undefined };
  for (const art of Object.values(CHAPTER_ART)) {
    try { art.bake(kit); } catch (err) { console.warn('Retratos: arte do capítulo', art.chapter, err); }
  }
  sheets = found;
  return found;
}

/** Ciclo parado (idle ou voo) de uma folha dos capítulos 3 a 8, no tempo `t` em segundos. */
function fromSheet(key: string, speed = 0.55): Figure | null {
  const got = chapterSheets().get(key);
  if (!got) return null;
  const { sheet, draw } = got;
  const anim = sheet.anims.idle ? 'idle' : sheet.anims.fly ? 'fly' : sheet.anims.move ? 'move' : Object.keys(sheet.anims)[0];
  return { frame: sheet, draw: (c, t) => draw(c, anim, ((t * speed) % 1 + 1) % 1) };
}

/* medidas iguais às de src/art/bake.ts, para o enquadramento bater com o jogo */
const OLD: Record<string, Figure> = {
  capivara: { frame: { cellW: 110, cellH: 84, ox: 46, oy: 72, scale: 1.45 }, draw: (c, t) => drawCapi(c, t, {}) },
  onca: { frame: { cellW: 136, cellH: 90, ox: 62, oy: 76, scale: 1.45 }, draw: (c, t) => drawOnca(c, t, {}) },
  arara: { frame: { cellW: 72, cellH: 72, ox: 40, oy: 58, scale: 1.15 }, draw: (c, t) => drawArara(c, t, { fly: t * 6 }) },
  curupira: { frame: { cellW: 190, cellH: 240, ox: 86, oy: 218, scale: 1.75 }, draw: (c, t) => drawCurupira(c, t, { gray: false }) },
  iara: { frame: { cellW: 236, cellH: 236, ox: 116, oy: 210, scale: 1.66 }, draw: (c, t) => drawIara(c, t, { gray: false }) },
  heroi: { frame: { cellW: 200, cellH: 200, ox: 80, oy: 182, scale: 1.5 }, draw: (c, t) => drawHero(c, t, {}) },
  /* bestiário: os bichos dos capítulos 1 e 2 como aparecem na fase (sem cor), com `_g` nos dois Encantados */
  sauva: { frame: { cellW: 112, cellH: 88, ox: 46, oy: 76, scale: 1.45 }, draw: (c, t) => drawSauva(c, t, { walk: t * 5 }) },
  queixada: { frame: { cellW: 172, cellH: 114, ox: 68, oy: 102, scale: 1.9 }, draw: (c, t) => drawQueixada(c, t, {}) },
  tronco: { frame: { cellW: 204, cellH: 214, ox: 102, oy: 200, scale: 2.1 }, draw: (c, t) => drawTronco(c, t, { raise: 0.15 + 0.1 * Math.sin(t * 1.4) }) },
  cuspidor: { frame: { cellW: 152, cellH: 142, ox: 60, oy: 128, scale: 1.9 }, draw: (c, t) => drawCuspidor(c, t, {}) },
  urutau: { frame: { cellW: 190, cellH: 150, ox: 95, oy: 128, scale: 1.6 }, draw: (c, t) => drawUrutau(c, t, { hidden: 0, fly: t * 7 }) },
  cogumelo: { frame: { cellW: 124, cellH: 124, ox: 62, oy: 108, scale: 1.7 }, draw: (c, t) => drawCogumelo(c, t, { swell: 0 }) },
  caipora: { frame: { cellW: 200, cellH: 190, ox: 82, oy: 170, scale: 1.9 }, draw: (c, t) => drawCaipora(c, t, {}) },
  curupira_g: { frame: { cellW: 190, cellH: 240, ox: 86, oy: 218, scale: 1.75 }, draw: (c, t) => drawCurupira(c, t, {}) },
  piranha: { frame: { cellW: 76, cellH: 64, ox: 42, oy: 50, scale: 1.3 }, draw: (c, t) => drawPiranha(c, t, { leap: 0 }) },
  sapo: { frame: { cellW: 108, cellH: 76, ox: 58, oy: 56, scale: 1.25 }, draw: (c, t) => drawSapo(c, t, {}) },
  arraia: { frame: { cellW: 120, cellH: 92, ox: 68, oy: 76, scale: 1.45 }, draw: (c, t) => drawArraia(c, t, { hidden: 0 }) },
  caramujo: { frame: { cellW: 106, cellH: 100, ox: 56, oy: 76, scale: 1.25 }, draw: (c, t) => drawCaramujo(c, t, { aura: 0.6 }) },
  jacare: { frame: { cellW: 200, cellH: 96, ox: 112, oy: 80, scale: 1.55 }, draw: (c, t) => drawJacare(c, t, {}) },
  boto: { frame: { cellW: 150, cellH: 196, ox: 68, oy: 172, scale: 1.6 }, draw: (c, t) => drawBoto(c, t, {}) },
  iara_g: { frame: { cellW: 236, cellH: 236, ox: 116, oy: 210, scale: 1.66 }, draw: (c, t) => drawIara(c, t, {}) },
};

/** Chave do retrato de um inimigo para o bestiário (os Encantados do começo têm a versão sem cor à parte). */
export function enemyFigure(kind: string): string {
  return kind === 'curupira' ? 'curupira_g' : kind === 'iara' ? 'iara_g' : kind;
}

function figure(key: string): Figure | null {
  return OLD[key] ?? fromSheet(key);
}

/** Retrato provisório: círculo com a cor do elemento (só se a arte faltar). */
function standIn(c: G, w: number, h: number, color: string): void {
  c.save();
  c.fillStyle = color; c.strokeStyle = '#1c0f0a'; c.lineWidth = 3;
  c.beginPath(); c.arc(w / 2, h * 0.55, Math.min(w, h) * 0.3, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
}

/**
 * Desenha a figura `key` dentro da caixa (x, y, w, h), com os pés perto da base da caixa.
 * `fill` é a fração da caixa que a figura pode ocupar.
 */
export function drawFigure(c: G, key: string, box: { x: number; y: number; w: number; h: number }, t: number, fill = 0.9, fallback = '#888'): void {
  const f = figure(key);
  if (!f) { c.save(); c.translate(box.x, box.y); standIn(c, box.w, box.h, fallback); c.restore(); return; }
  const fr = f.frame, rw = fr.cellW / fr.scale, rh = fr.cellH / fr.scale;
  const k = Math.min((box.w * fill) / rw, (box.h * fill) / rh);
  /* a célula fica centrada na horizontal e encostada embaixo */
  const left = box.x + (box.w - rw * k) / 2, top = box.y + box.h * (1 - (1 - fill) / 2) - rh * k;
  c.save();
  c.translate(left + (fr.ox / fr.scale) * k, top + (fr.oy / fr.scale) * k);
  c.scale(k, k);
  c.lineCap = 'round'; c.lineJoin = 'round';
  try { f.draw(c, t); } catch (err) { console.warn('Retrato falhou:', key, err); }
  c.restore();
}

/** Encantados libertados, coloridos, para a tela do final (na ordem dos capítulos). */
export const FREED = ['curupira', 'iara', 'saci_free', 'boitata_free', 'mapinguari_free', 'lobisomem_free', 'cuca_free'] as const;
