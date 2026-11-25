/**
 * Um jogador automático para noites inteiras do Sonho: escolhe o caminho, compra na Feira, bebe na Fonte,
 * responde aos causos e joga as salas com o mesmo `makeBot` das fases. Serve aos testes e à calibração.
 */
import { AMULETS } from '../src/data/amulets';
import { BLESSINGS, type BlessingId } from '../src/data/content';
import { TICK } from '../src/data/balance';
import { findStage } from '../src/data/tower';
import {
  buyBlessing, buyHeal, causoAffordable, chooseAmulet, chooseBlessingOffer, chooseCauso, collectRoda, currentStageId, currentTrecho, dreamContext, enterNode, feiraPrice, leaveNode, reachable,
  rodaCost, settleNode, spinRoda, startNight, upgradable, useFountain, type NightChoice, type NightEnd,
} from '../src/meta/dream';
import type { Profile } from '../src/meta/profile';
import type { StageOutcome } from '../src/meta/rewards';
import { deriveStats } from '../src/meta/stats';
import { HUMAN, makeBot, type BotOpts } from '../src/sim/bot';
import { createWorld, step, type World } from '../src/sim/world';

/** Joga a sala do nó atual e devolve o resultado como a cena devolveria. */
export function playNode(p: Profile, opts: BotOpts, maxSeconds = 420): StageOutcome {
  const run = p.dream.run!, id = currentStageId(run)!, stage = findStage(id)!, ctx = dreamContext(run);
  const restat = (b: BlessingId[]) => deriveStats(ctx.profile, b, ctx.amulets, ctx.boost);
  const seed = Number(id.split('-')[5]) | 1;
  const w: World = createWorld({ stageId: id, level: stage.level, rooms: stage.rooms, stats: restat(ctx.carry.blessings), seed, ranked: true, carry: ctx.carry, foes: ctx.foes });
  const bot = makeBot(ctx.profile, { ...opts, seed: opts.seed + seed }, restat);
  for (let i = 0; i < 60 * maxSeconds && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
  return {
    stageId: id, won: w.phase === 'won', time: w.time, deaths: w.deaths, roomsCleared: w.roomsCleared, kills: w.kills, perfects: w.perfects, hitsTaken: w.hitsTaken,
    blessings: w.blessings.slice(), chests: w.loot.chests, foundGold: w.loot.gold,
    left: { hpFrac: Math.max(0, w.player.hp) / w.stats.maxHp, potions: w.player.potions, supremo: w.player.supremo, revives: w.revives, altarDry: w.altarDry },
    trial: w.challenge?.state ?? null,
  };
}

export interface NightLog { end: NightEnd; nodes: string[]; diedAt: { trecho: number; kind: string } | null; seconds: number }

/** Joga uma noite do começo ao fim. O perfil precisa ter o Sonho aberto e nenhuma noite em andamento. */
export function playNight(p: Profile, choice: NightChoice, seed: number, opts: BotOpts = HUMAN): NightLog {
  if (!startNight(p, choice, seed)) throw new Error('não deu para começar a noite');
  const nodes: string[] = [];
  let diedAt: NightLog['diedAt'] = null, seconds = 0;
  for (let guard = 0; guard < 200; guard++) {
    const run = p.dream.run;
    if (!run) throw new Error('a noite sumiu sem acordar');
    const pend = run.pending;
    if (pend?.kind === 'amuleto') { const i = pend.options.findIndex((a) => AMULETS[a].rarity !== 'figa'); chooseAmulet(p, i >= 0 ? i : 0); continue; }
    if (pend?.kind === 'bencao') { chooseBlessingOffer(p, 0); continue; }
    if (pend?.kind === 'feira') {
      if (run.hpFrac < 0.7) buyHeal(p);
      /* compra o que der, da mais rara para a mais comum */
      const order = pend.blessings.map((b, i) => ({ b, i })).filter((x) => x.b).sort((x, y) => BLESSINGS[y.b!].tier - BLESSINGS[x.b!].tier);
      for (const x of order) if (run.vintem >= feiraPrice(run, 'bencao', x.b!)) buyBlessing(p, x.i);
      leaveNode(p);
      continue;
    }
    if (pend?.kind === 'roda') {
      /* gira o que for de graça e, sobrando vintém, o primeiro giro pago; depois recebe e segue */
      if (pend.grid && !pend.collected) { collectRoda(p); continue; }
      const cost = rodaCost(run, pend);
      if (cost != null && (cost === 0 || (pend.paid === 0 && run.vintem >= cost + 40))) { spinRoda(p); continue; }
      leaveNode(p);
      continue;
    }
    if (pend?.kind === 'fonte') { const up = upgradable(run); if (run.hpFrac < 0.75 || !up.length) useFountain(p, 'beber'); else useFountain(p, 'subir', up[0]); continue; }
    if (pend?.kind === 'causo') {
      const i = pend.outcomes.findIndex((o) => causoAffordable(run, o) && !(run.hpFrac < 0.45 && o.some((x) => x.effect.t === 'vida' && x.effect.frac < 0)));
      if (!chooseCauso(p, i >= 0 ? i : pend.outcomes.length - 1)) throw new Error('causo sem saída');
      continue;
    }
    const options = reachable(run);
    if (!options.length) throw new Error(`sem caminho no trecho ${run.trecho}, nó ${run.at}`);
    const t = currentTrecho(run), hp = run.hpFrac;
    const score = (k: string): number => ({ altar: 5, combate: 3, elite: hp > 0.6 ? 4 : 1, provacao: hp > 0.75 ? 2.5 : 0.2, causo: 2.8, fonte: hp < 0.6 ? 6 : 2, feira: hp < 0.6 ? 2 : 6, roda: 4.5, chefe: 9 } as Record<string, number>)[k] ?? 1;
    const pickId = options.slice().sort((a, b) => score(t.nodes[b].kind) - score(t.nodes[a].kind))[0];
    const kind = t.nodes[pickId].kind, trecho = run.trecho;
    nodes.push(`${trecho}:${kind}`);
    const entered = enterNode(p, pickId);
    if (!entered) throw new Error('nó fora de alcance');
    if ('panel' in entered) continue;
    const o = playNode(p, opts);
    seconds += o.time;
    const res = settleNode(p, o);
    if (!res) throw new Error('sala sem resultado');
    if (res.end) { if (!res.end.won) diedAt = { trecho, kind }; return { end: res.end, nodes, diedAt, seconds }; }
  }
  throw new Error('a noite não acabou');
}
