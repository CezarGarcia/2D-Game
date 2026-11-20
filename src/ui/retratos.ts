/** Desenho dos companheiros para os retratos do menu. A arara só existe se a arte dela já chegou. */
import { drawCapi } from '../art/characters';
import { drawOnca } from '../art/characters2';
import type { CompanionId } from '../data/content';

type DrawFn = (c: CanvasRenderingContext2D, t: number, o: Record<string, unknown>) => void;

/* characters3.ts pode ainda não existir: o glob devolve vazio nesse caso, sem quebrar a página */
let drawArara: DrawFn | null = null;
const extra = import.meta.glob('../art/characters3.ts');
for (const load of Object.values(extra)) {
  void load().then((m) => {
    const f = (m as Record<string, unknown>).drawArara;
    if (typeof f === 'function') drawArara = f as DrawFn;
  }).catch(() => undefined);
}

/** Arara provisória, no mesmo traço recortado: só até a arte final entrar. */
function araraStandIn(c: CanvasRenderingContext2D, t: number): void {
  const OUT = '#22100a', bob = Math.sin(t * 2.6) * 1.2, wing = Math.sin(t * 5) * 0.12;
  const shape = (fill: string, path: () => void) => { c.beginPath(); path(); c.fillStyle = fill; c.fill(); c.lineWidth = 2.2; c.strokeStyle = OUT; c.lineJoin = 'round'; c.stroke(); };
  c.save();
  c.translate(0, -30 + bob);
  shape('#2f6fd0', () => { c.moveTo(-10, 6); c.quadraticCurveTo(-30, 16, -40, 34); c.quadraticCurveTo(-22, 22, -4, 14); c.closePath(); });
  shape('#d8342a', () => { c.ellipse(0, 0, 15, 11, -0.25, 0, Math.PI * 2); });
  c.save(); c.rotate(wing);
  shape('#f2c14e', () => { c.moveTo(-12, -4); c.quadraticCurveTo(-4, -22, 10, -6); c.quadraticCurveTo(0, -2, -12, -4); c.closePath(); });
  shape('#2f6fd0', () => { c.moveTo(-14, -3); c.quadraticCurveTo(-12, -18, 0, -12); c.quadraticCurveTo(-4, -4, -14, -3); c.closePath(); });
  c.restore();
  shape('#d8342a', () => { c.arc(15, -8, 8, 0, Math.PI * 2); });
  shape('#f3ead0', () => { c.ellipse(18, -8, 4, 5, 0, 0, Math.PI * 2); });
  shape('#2a2a2a', () => { c.moveTo(21, -11); c.quadraticCurveTo(31, -9, 26, 0); c.quadraticCurveTo(24, -4, 20, -4); c.closePath(); });
  c.beginPath(); c.arc(17.5, -9, 1.6, 0, Math.PI * 2); c.fillStyle = OUT; c.fill();
  c.restore();
}

/** Desenha o companheiro com os pés na origem, virado para a direita. */
export function drawCompanion(c: CanvasRenderingContext2D, id: CompanionId, t: number): void {
  if (id === 'capivara') drawCapi(c, t, {});
  else if (id === 'onca') drawOnca(c, t, {});
  else if (drawArara) drawArara(c, t, {});
  else araraStandIn(c, t);
}
