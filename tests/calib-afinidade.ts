/* Calibração das afinidades: `npx vite-node tests/calib-afinidade.ts [partidas por fase]`. Compara, capítulo a capítulo,
   o herói de referência que nunca troca de feitiço com o que troca conforme a fase. Não é um teste. */
import { stageAffinity } from '../src/data/affinity';
import { ELEMENT_ORDER, SPELL_ORDER, SPELLS } from '../src/data/content';
import { STAGES } from '../src/data/stages';
import { adaptedLoadout } from '../src/meta/afinidade';
import { referenceProfile } from '../src/meta/stats';
import { HUMAN, playStage } from './bot';

declare const process: { argv: string[] };
const N = Number(process.argv[2] ?? 6);
const fixed: Record<number, number> = {}, smart: Record<number, number> = {}, brewed: Record<number, number> = {}, total: Record<number, number> = {};
const swaps: Record<number, Set<string>> = {};
for (let i = 0; i < STAGES.length; i++) {
  const s = STAGES[i], a = referenceProfile(s.level), b = referenceProfile(s.level);
  b.loadout = adaptedLoadout(SPELL_ORDER.filter((id) => SPELLS[id].unlock <= s.level), s.kinds, a.loadout);
  (swaps[s.chapter] ??= new Set()).add(b.loadout.map((x) => (x ? SPELLS[x].element.slice(0, 3) : '-')).join('/'));
  /* só de elemento que o jogador já tem naquele capítulo: o Encantado do capítulo c só é libertado no fim dele */
  const weak = stageAffinity(s.kinds).weak.find((el) => ELEMENT_ORDER.indexOf(el) < s.chapter - 1) ?? null;
  for (let k = 0; k < N; k++) {
    if (playStage(i, a, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 }).phase === 'won') fixed[s.chapter] = (fixed[s.chapter] ?? 0) + 1;
    if (playStage(i, b, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 }).phase === 'won') smart[s.chapter] = (smart[s.chapter] ?? 0) + 1;
    /* e ainda com a Têmpera do elemento que a fase mais teme */
    if (playStage(i, b, 500 + k * 37 + i, { ...HUMAN, seed: k + 1 }, 600, weak ? { weaponEl: weak } : {}).phase === 'won') brewed[s.chapter] = (brewed[s.chapter] ?? 0) + 1;
    total[s.chapter] = (total[s.chapter] ?? 0) + 1;
  }
}
let f = 0, m = 0, g = 0, t = 0;
for (const ch of Object.keys(total).map(Number)) {
  console.log(`capítulo ${ch}: sem trocar ${fixed[ch] ?? 0}/${total[ch]}  ·  trocando ${smart[ch] ?? 0}/${total[ch]}  ·  com Têmpera ${brewed[ch] ?? 0}/${total[ch]}  ·  feitiços ${[...swaps[ch]].join(' ')}`);
  f += fixed[ch] ?? 0; m += smart[ch] ?? 0; g += brewed[ch] ?? 0; t += total[ch];
}
console.log(`total: sem trocar ${f}/${t} (${Math.round((f / t) * 100)}%)  ·  trocando ${m}/${t} (${Math.round((m / t) * 100)}%)  ·  com Têmpera ${g}/${t} (${Math.round((g / t) * 100)}%)`);
