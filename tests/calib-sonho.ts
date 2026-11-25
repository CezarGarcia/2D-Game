/* Calibração do Sonho: rode com `npx vite-node tests/calib-sonho.ts [noites] [nível] [capítulos vencidos]`. Não é um teste. */
import { DREAM } from '../src/data/dream';
import { STAGES } from '../src/data/stages';
import { ELEMENT_ORDER } from '../src/data/content';
import { newProfile } from '../src/meta/profile';
import { HUMAN } from '../src/sim/bot';
import { playNight } from './sonho-bot';

declare const process: { argv: string[] };
const N = Number(process.argv[2] ?? 30), level = Number(process.argv[3] ?? 30), chapters = Number(process.argv[4] ?? 3), weapon = (process.argv[5] ?? 'facao') as 'facao';
/* ajustes de teste: `chave=valor` troca um número de DREAM só nesta rodada (por exemplo budget=1.1) */
for (const a of process.argv.slice(6)) { const [k, v] = a.split('='); if (k in DREAM) (DREAM as unknown as Record<string, number>)[k] = Number(v); }
let wins = 0, time = 0, rooms = 0, memories = 0;
const died: Record<string, number> = {}, trechos = [0, 0, 0, 0];
for (let k = 0; k < N; k++) {
  const p = newProfile(77 + k);
  p.level = level;
  for (const s of STAGES) if (s.chapter <= chapters) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 60, pity: 0, clears: 1 };
  p.supremos = ELEMENT_ORDER.slice(0, Math.min(7, chapters)); p.supremo = p.supremos[0];
  p.companions.capivara = { level: 1 }; p.companion = 'capivara';
  p.dream.nights = 1; // pula a primeira noite, que é curta
  const log = playNight(p, { weapon, spells: ['dardo', 'sementes', 'cipo'], companion: 'capivara', supremo: p.supremo }, 9000 + k * 131, { ...HUMAN, seed: k + 1 });
  if (log.end.won) wins++; else if (log.diedAt) died[`trecho ${log.diedAt.trecho + 1} ${log.diedAt.kind}`] = (died[`trecho ${log.diedAt.trecho + 1} ${log.diedAt.kind}`] ?? 0) + 1;
  trechos[log.end.trechos]++;
  time += log.seconds; rooms += log.end.tally.rooms; memories += log.end.memories;
}
console.log(`nível ${level}, ${chapters} capítulos, ${weapon}: ${wins}/${N} noites completas (${Math.round((wins / N) * 100)}%)`);
console.log(`tempo de luta médio ${Math.round(time / N / 60)} min; salas vencidas ${(rooms / N).toFixed(1)}; Lembranças ${(memories / N).toFixed(0)} por noite`);
console.log(`trechos completos: 0→${trechos[0]}  1→${trechos[1]}  2→${trechos[2]}  3→${trechos[3]}`);
console.log('quedas:', Object.entries(died).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(', '));
