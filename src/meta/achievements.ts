/** Regras das conquistas: conferir o que foi alcançado e pegar o prêmio. Os dados estão em src/data/achievements.ts. */
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID, type AchievementDef, type AchievementReward } from '../data/achievements';
import type { Profile } from './profile';

const day = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Progresso de uma conquista, limitado à meta. */
export function achievementProgress(p: Profile, a: AchievementDef): number {
  let v = 0;
  try { v = a.progress(p); } catch { /* perfil antigo sem o campo: conta como zero */ }
  return Math.max(0, Math.min(a.target, Number.isFinite(v) ? v : 0));
}

export function isAchieved(p: Profile, id: string): boolean { return !!p.achievements[id]; }

/**
 * Marca as conquistas que acabaram de ser alcançadas e devolve os identificadores, na ordem da lista.
 * Chame depois de qualquer coisa que mude o perfil (fim de partida, ferreiro, resgate).
 */
export function checkAchievements(p: Profile, now: Date = new Date()): string[] {
  const fresh: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (p.achievements[a.id]) continue;
    if (achievementProgress(p, a) >= a.target) { p.achievements[a.id] = { day: day(now), claimed: false }; fresh.push(a.id); }
  }
  return fresh;
}

/** Conquistas alcançadas com o prêmio ainda por pegar. */
export function claimableAchievements(p: Profile): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => p.achievements[a.id] && !p.achievements[a.id].claimed);
}

function give(p: Profile, r: AchievementReward): void {
  p.gold += r.gold;
  p.materials.mata += r.mata ?? 0; p.materials.po += r.po ?? 0; p.materials.tomo += r.tomo ?? 0; p.materials.lagrima += r.lagrima ?? 0;
}

/** Pega o prêmio de uma conquista alcançada. Devolve o prêmio, ou nulo se não havia o que pegar. */
export function claimAchievement(p: Profile, id: string): AchievementReward | null {
  const a = ACHIEVEMENT_BY_ID.get(id), rec = p.achievements[id];
  if (!a || !rec || rec.claimed) return null;
  rec.claimed = true;
  give(p, a.reward);
  return { ...a.reward };
}

/** Pega todos os prêmios pendentes de uma vez e devolve a soma. */
export function claimAllAchievements(p: Profile): { count: number; reward: Required<AchievementReward> } {
  const sum: Required<AchievementReward> = { gold: 0, mata: 0, po: 0, tomo: 0, lagrima: 0 };
  let count = 0;
  for (const a of claimableAchievements(p)) {
    const r = claimAchievement(p, a.id);
    if (!r) continue;
    count++;
    sum.gold += r.gold; sum.mata += r.mata ?? 0; sum.po += r.po ?? 0; sum.tomo += r.tomo ?? 0; sum.lagrima += r.lagrima ?? 0;
  }
  return { count, reward: sum };
}

export function achievementCounts(p: Profile): { done: number; total: number } {
  return { done: ACHIEVEMENTS.filter((a) => p.achievements[a.id]).length, total: ACHIEVEMENTS.length };
}
