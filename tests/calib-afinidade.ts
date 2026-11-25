/* Calibração das afinidades: `npx vite-node tests/calib-afinidade.ts [partidas por fase]`. Compara, capítulo a capítulo,
   o herói de referência que nunca troca de feitiço com o que troca conforme a fase. Não é um teste. */
import { SPELL_ORDER, SPELLS } from '../src/data/content';
import { STAGES } from '../src/data/stages';
import { adaptedLoadout } from '../src/meta/afinidade';
import { referenceProfile } from '../src/meta/stats';
import { HUMAN, playStage } from './bot';

declare const process: { argv: string[] };
const N = Number(process.argv[2] ?? 6);
const fixed: Record<number, number> = {}, smart: Record<number, number> = {}, total: Record<number, number> = {};
const swaps: Record<number, Set<string>> = {};
for (let i = 0; i < STAGES.length; i++) {
  const s = STAGES[i], a = referenceProfile(s.level), b = referenceProfile(s.level);
  b.loadout = adaptedLoadout(SPELL_ORDER.filter((id) => SPELLS[id].unlock <= s.level), s.kinds, a.loadout);
  (swaps[s.chapter] ??= new Set()).add(b.loadout.map((x) => (x ? SPELLS[x].element.slice(0, 3) : '-')).join('/'));
  for (let k = 0; k < N; k++) {
    if (playStage(i, a, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 }).phase === 'won') fixed[s.chapter] = (fixed[s.chapter] ?? 0) + 1;
    if (playStage(i, b, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 }).phase === 'won') smart[s.chapter] = (smart[s.chapter] ?? 0) + 1;
    total[s.chapter] = (total[s.chapter] ?? 0) + 1;
  }
}
let f = 0, m = 0, t = 0;
for (const ch of Object.keys(total).map(Number)) {
  console.log(`capítulo ${ch}: sem trocar ${fixed[ch] ?? 0}/${total[ch]}  ·  trocando ${smart[ch] ?? 0}/${total[ch]}  ·  feitiços ${[...swaps[ch]].join(' ')}`);
  f += fixed[ch] ?? 0; m += smart[ch] ?? 0; t += total[ch];
}
console.log(`total: sem trocar ${f}/${t} (${Math.round((f / t) * 100)}%)  ·  trocando ${m}/${t} (${Math.round((m / t) * 100)}%)`);
