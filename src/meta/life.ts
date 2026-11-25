/**
 * Contadores de longo prazo do perfil (docs/gdd/09): o que o jogador já fez na jornada inteira.
 * Alimentam as conquistas, o Almanaque e o bônus de conhecer o inimigo. Só somam; nada aqui paga recompensa.
 */
import type { EnemyKind } from '../data/balance';
import type { ItemType } from '../data/items';
import type { LifeStats, Profile } from './profile';
import type { StageOutcome, StageRewards } from './rewards';

/** Conhecer o inimigo: abates de um tipo de monstro que dão dano a mais contra ele. */
export const KNOWLEDGE = [{ kills: 100, bonus: 0.03 }, { kills: 500, bonus: 0.06 }];

export function killsOf(life: LifeStats, kind: string): number { return life.kills[kind] ?? 0; }

/** Dano a mais contra um tipo de monstro, pelo número de abates. */
export function knowledgeBonus(kills: number): number {
  let b = 0;
  for (const k of KNOWLEDGE) if (kills >= k.kills) b = k.bonus;
  return b;
}

/** Próxima marca de abates e quanto falta, ou nulo se já passou de todas. */
export function knowledgeNext(kills: number): { kills: number; bonus: number } | null {
  return KNOWLEDGE.find((k) => kills < k.kills) ?? null;
}

/** Bônus de dano por tipo de monstro (só os que já têm algum). */
export function knowledgeMap(life: LifeStats): Partial<Record<EnemyKind, number>> {
  const out: Partial<Record<EnemyKind, number>> = {};
  for (const kind of Object.keys(life.kills)) { const b = knowledgeBonus(life.kills[kind]); if (b > 0) out[kind as EnemyKind] = b; }
  return out;
}

const add = (rec: Record<string, number>, key: string, n: number) => { if (n > 0) rec[key] = (rec[key] ?? 0) + n; };

/** Soma uma partida terminada (fase, Torre ou expedição) aos contadores. Chame uma vez por partida. */
export function recordRun(p: Profile, o: StageOutcome, r: StageRewards, ctx: { weapon: ItemType; expedition?: boolean }): void {
  const L = p.life, t = o.tally;
  L.runs++; L.deaths += o.deaths; L.perfects += o.perfects; L.seconds += Math.max(0, Math.round(o.time));
  L.chests += o.chests ?? 0; L.gold += Math.max(0, r.gold);
  if (o.won) {
    L.wins++;
    if (o.deaths === 0) L.flawless++;
    add(L.winsBy, ctx.weapon, 1);
    if (ctx.expedition) L.expeditions++;
    if (t?.auto) L.autoWins++;
  }
  L.towerFloors += r.tower?.floors ?? 0;
  for (const b of o.blessings ?? []) add(L.blessings, b, 1);
  if (t) {
    for (const kind of Object.keys(t.killsBy)) add(L.kills, kind, t.killsBy[kind]);
    L.champions += t.champions; L.elites += t.elites; L.bosses += t.bosses;
    L.parries += t.parries; L.pots += t.pots; L.wisps += t.wisps; L.casts += t.casts; L.reactions += t.reactions; L.supremos += t.supremos; L.potions += t.potions;
    for (const el of Object.keys(t.castsBy)) add(L.castsBy, el, t.castsBy[el as keyof typeof t.castsBy] ?? 0);
    if (t.maxHit > L.maxHit) L.maxHit = t.maxHit;
  }
  for (const it of [...r.items, ...r.soldOverflow.map((s) => s.item)]) if (it.unique && !p.uniquesFound.includes(it.unique)) p.uniquesFound.push(it.unique);
}

/** Total de monstros derrotados. */
export function totalKills(life: LifeStats): number {
  let n = 0;
  for (const k of Object.keys(life.kills)) n += life.kills[k];
  return n;
}
