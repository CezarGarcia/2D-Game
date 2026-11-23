/* Mede o custo da simulação por passo: `npx vite-node tests/bench.ts`. Não é um teste. */
import { TICK } from '../src/data/balance';
import { STAGES } from '../src/data/stages';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { createWorld, step } from '../src/sim/world';
import { HUMAN, makeBot } from './bot';

for (const id of ['1-6', '3-10', '5-8', '6-8', '7-12', '8-10']) {
  const i = STAGES.findIndex((s) => s.id === id), s = STAGES[i], prof = referenceProfile(s.level);
  const w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(prof), seed: 7 });
  const bot = makeBot(prof, { ...HUMAN, seed: 3 });
  let worst = 0, total = 0, n = 0, maxEnemies = 0, maxProj = 0;
  for (let k = 0; k < 60 * 240 && w.phase !== 'won' && w.phase !== 'lost'; k++) {
    const inp = bot(w), t0 = performance.now();
    step(w, inp, TICK);
    const dt = performance.now() - t0;
    total += dt; n++; worst = Math.max(worst, dt);
    maxEnemies = Math.max(maxEnemies, w.enemies.length); maxProj = Math.max(maxProj, w.projectiles.length);
    w.events.length = 0;
  }
  console.log(`${id}: ${n} passos, média ${(total / n * 1000).toFixed(0)} µs, pior ${worst.toFixed(2)} ms, até ${maxEnemies} inimigos e ${maxProj} projéteis`);
}
