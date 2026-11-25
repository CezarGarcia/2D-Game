/** Jogador automático nos testes e na calibração: o mesmo de src/sim/bot.ts, mais a partida inteira sem tela. */
import { TICK } from '../src/data/balance';
import { STAGES } from '../src/data/stages';
import type { Profile } from '../src/meta/profile';
import { deriveStats } from '../src/meta/stats';
import { PERFECT, makeBot, type BotOpts } from '../src/sim/bot';
import { createWorld, step, type World } from '../src/sim/world';

export * from '../src/sim/bot';

export function playStage(index: number, profile: Profile, seed: number, opts: BotOpts = PERFECT, maxSeconds = 600): World {
  const s = STAGES[index], w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(profile), seed });
  const bot = makeBot(profile, { ...opts, seed: opts.seed + seed });
  for (let i = 0; i < 60 * maxSeconds && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
  return w;
}
