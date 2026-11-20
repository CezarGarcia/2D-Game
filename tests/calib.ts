/* Calibração: rode com `npx vite-node tests/calib.ts [de] [até] [delta de nível]`. Não é um teste. */
import { STAGES } from '../src/data/stages';
import { deriveStats, powerOf, recommendedPower, referenceProfile } from '../src/meta/stats';
import { HUMAN, PERFECT, playStage } from './bot';

declare const process: { argv: string[] };
const from = Number(process.argv[2] ?? 0), to = Number(process.argv[3] ?? STAGES.length - 1), delta = Number(process.argv[4] ?? 0), N = Number(process.argv[5] ?? 6);
for (let i = from; i <= to; i++) {
  const s = STAGES[i], level = Math.max(1, s.level + delta), prof = referenceProfile(level);
  let wins = 0, hp = 0, time = 0, deaths = 0, hits = 0;
  const rooms: number[] = [];
  for (let k = 0; k < N; k++) {
    const w = playStage(i, prof, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 });
    if (w.phase === 'won') { wins++; hp += w.player.hp / w.stats.maxHp; time += w.time; } else rooms.push(w.room + 1);
    deaths += w.deaths; hits += w.hitsTaken;
  }
  const pw = playStage(i, prof, 500 + i, PERFECT);
  const enemies = s.rooms.reduce((a, r) => a + r.waves.reduce((b, w) => b + w.length, 0), 0);
  console.log(`${s.id} nv${s.level} (herói nv${level}, poder ${powerOf(deriveStats(prof))}/${recommendedPower(s.level)}) ${enemies} inimigos: humano ${wins}/${N}` +
    (wins ? ` vida ${(hp / wins * 100).toFixed(0)}% ${Math.round(time / wins)}s` : '') + ` quedas ${(deaths / N).toFixed(1)} golpes ${(hits / N).toFixed(0)}` + (rooms.length ? ` caiu nas salas ${rooms.join(',')}` : '') +
    ` | perfeito: ${pw.phase === 'won' ? 'venceu' : 'caiu sala ' + (pw.room + 1)} ${Math.round(pw.time)}s golpes ${pw.hitsTaken} (alvo ${s.starTime}s)`);
}
