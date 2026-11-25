/**
 * Regras dos desafios com ranking fora do combate: quem pode jogar, o herói de cada um,
 * o recorde guardado no perfil e o pouco que pagam (o prêmio de verdade é o ranking).
 * Os dados de cada desafio estão em src/data/challenge.ts.
 */
import {
  ENCANTADOS_ID, WEAPONS, brDay, challengeSeed, dailyChallenge, dailyChallengeId, isDailyChallengeId, isEncantadosId, type HeroSpec,
} from '../data/challenge';
import { SPELLS, type SpellId } from '../data/content';
import type { WeaponKind } from '../data/items';
import { dreamProfile } from './dream';
import { knownSpells, type ChallengeResult, type Profile } from './profile';
import type { StageOutcome } from './rewards';

/** Nível do herói no Desafio dos Encantados (os chefes são do 45). */
export const ENCANTADOS_HERO_LEVEL = 50;

export function isChallengeId(id: string): boolean { return isDailyChallengeId(id) || isEncantadosId(id); }

/** O Desafio do Dia abre ao libertar o Curupira; o dos Encantados, depois do final. */
export function dailyOpen(p: Profile): boolean { return p.curupiraFreed; }
export function encantadosOpen(p: Profile): boolean { return p.credits; }

/** Herói de referência com a arma, os feitiços, o companheiro e o Supremo escolhidos. */
export function challengeProfile(spec: HeroSpec): Profile {
  return dreamProfile(spec.level, { weapon: spec.weapon, spells: spec.spells, companion: spec.companion, supremo: spec.supremo });
}

/** Herói do dia: o mesmo para todos. */
export function dailySpec(day = brDay()): HeroSpec { return dailyChallenge(day).spec; }

/** Herói do Desafio dos Encantados a partir do que o jogador usa na campanha, com a arma escolhida. */
export function encantadosSpec(p: Profile, weapon?: WeaponKind): HeroSpec {
  const known = knownSpells(p), w = p.equipped.arma?.type as WeaponKind | undefined;
  const spells = [0, 1, 2].map((i) => { const s = p.loadout[i]; return s && known.includes(s) ? s : null; }) as (SpellId | null)[];
  return {
    level: ENCANTADOS_HERO_LEVEL,
    weapon: weapon ?? (w && WEAPONS.includes(w) ? w : 'facao'),
    spells, companion: p.companion && p.companions[p.companion] ? p.companion : null,
    supremo: p.supremo && p.supremos.includes(p.supremo) ? p.supremo : null,
  };
}

/** A escolha vale? (Feitiços que o jogador conhece, companheiro resgatado, Supremo libertado.) */
export function validEncantadosSpec(p: Profile, s: HeroSpec): boolean {
  const known = knownSpells(p);
  return s.level === ENCANTADOS_HERO_LEVEL && WEAPONS.includes(s.weapon)
    && s.spells.length === 3 && s.spells.every((x) => x === null || (known.includes(x) && !!SPELLS[x]))
    && (s.companion === null || !!p.companions[s.companion]) && (s.supremo === null || p.supremos.includes(s.supremo));
}

/** Ordem do ranking: vencer, depois mais salas, depois menos tempo. Positivo se `a` é melhor. */
export function compareResults(a: ChallengeResult | null, b: ChallengeResult | null): number {
  if (!a) return b ? -1 : 0;
  if (!b) return 1;
  if (a.won !== b.won) return a.won ? 1 : -1;
  if (a.rooms !== b.rooms) return a.rooms - b.rooms;
  return b.time - a.time;
}

/** Zera o dia do Desafio quando o dia de Brasília muda. */
export function touchChallengeDay(p: Profile, now = new Date()): void {
  const d = p.challenges.daily, day = brDay(now);
  if (d.day !== day) { d.day = day; d.tries = 0; d.first = null; d.best = null; }
}

export interface ChallengeSettled {
  kind: 'dia' | 'encantados';
  result: ChallengeResult;
  /** Primeira tentativa do dia (a que vale para o ranking do Desafio do Dia). */
  ranked: boolean;
  /** Bateu um recorde que já existia. */
  newBest: boolean;
  reward: { mata: number; po: number; tomo: number; lagrima: number };
}

/** Guarda a tentativa e paga o prêmio. */
export function settleChallenge(p: Profile, o: StageOutcome, now = new Date()): ChallengeSettled | null {
  const weapon = (o.hero?.weapon ?? 'facao') as WeaponKind;
  const result: ChallengeResult = { won: o.won, rooms: o.roomsCleared, time: Math.round(o.time * 1000) / 1000, weapon };
  const reward = { mata: 0, po: 0, tomo: 0, lagrima: 0 };
  if (isDailyChallengeId(o.stageId)) {
    touchChallengeDay(p, now);
    const d = p.challenges.daily;
    /* uma tentativa de outro dia (a fase ficou aberta na virada) não conta */
    if (o.stageId !== dailyChallengeId(d.day)) return null;
    const ranked = d.tries === 0;
    d.tries++;
    if (ranked) {
      d.first = result;
      reward.mata = 4 + 2 * result.rooms;
      if (result.won) {
        reward.po = 2; reward.tomo = 1;
        const yesterday = brDay(new Date(now.getTime() - 86400_000));
        d.streak = d.lastWon === yesterday ? d.streak + 1 : 1; d.lastWon = d.day;
      }
    }
    const newBest = !!d.best && compareResults(result, d.best) > 0;
    if (!d.best || newBest) d.best = result;
    pay(p, reward);
    return { kind: 'dia', result, ranked, newBest, reward };
  }
  if (isEncantadosId(o.stageId)) {
    const e = p.challenges.encantados;
    e.tries++;
    if (result.won) { if (e.wins === 0) reward.lagrima = 2; e.wins++; }
    const newBest = !!e.best && compareResults(result, e.best) > 0;
    if (!e.best || newBest) e.best = result;
    if (compareResults(result, e.bestByWeapon[weapon] ?? null) > 0) e.bestByWeapon[weapon] = result;
    pay(p, reward);
    return { kind: 'encantados', result, ranked: true, newBest, reward };
  }
  return null;
}

function pay(p: Profile, r: { mata: number; po: number; tomo: number; lagrima: number }): void {
  p.materials.mata += r.mata; p.materials.po += r.po; p.materials.tomo += r.tomo; p.materials.lagrima += r.lagrima;
}

export { ENCANTADOS_ID, challengeSeed, dailyChallengeId };
