/**
 * O que uma fase paga e quando ela está disponível. Regras de docs/gdd/01-progressao-e-dificuldade.md:
 * XP e ouro caem em fase fácil, o item com nome não sofre redução e tem azar com limite.
 */
import type { CompanionId, SpellId } from '../data/content';
import { makeItem, makeUnique, rollRarity, sellValue, type Item } from '../data/items';
import { BOSS_STAGE_XP_BONUS, FIRST_CLEAR_XP_BONUS, goldMultiplier, stageGold, stageXp, xpMultiplier } from '../data/progression';
import { STAGES, STAGE_BY_ID, type StageDef } from '../data/stages';
import { addItem, addXp, profileRng, refillPotions, type Materials, type Profile, type StageRecord } from './profile';
import { deriveStats, powerOf, recommendedPower } from './stats';

export interface StageOutcome {
  stageId: string;
  won: boolean;
  /** Tempo de combate, em segundos. */
  time: number;
  /** Vezes em que o herói caiu (a primeira queda permite continuar; a segunda encerra a fase). */
  deaths: number;
  roomsCleared: number;
  kills: number;
  perfects: number;
  hitsTaken: number;
}

export interface StageRewards {
  won: boolean;
  xp: number; gold: number;
  xpMult: number; goldMult: number;
  firstClear: boolean;
  items: Item[];
  /** Itens que não couberam na mochila e foram vendidos na hora. */
  soldOverflow: { item: Item; gold: number }[];
  named: Item | null;
  namedChance: number;
  materials: Materials;
  stars: [boolean, boolean, boolean];
  newStars: number;
  bestTime: boolean;
  levels: number;
  spells: SpellId[];
  rescued: CompanionId | null;
  talentPoints: number;
  starChest: { stars: number; gold: number; mata: number; talent: boolean } | null;
}

export type StageTag = 'verde' | 'amarela' | 'cinza' | 'vermelha';

export interface StageInfo {
  stage: StageDef;
  unlocked: boolean;
  record: StageRecord;
  xpMult: number; goldMult: number;
  tag: StageTag;
  tagText: string;
  power: number; recommended: number;
  /** Chance atual do item com nome, já com o azar acumulado. */
  namedChance: number;
}

export function recordOf(p: Profile, stageId: string): StageRecord {
  return p.stages[stageId] ?? { cleared: false, stars: [false, false, false], bestTime: null, pity: 0, clears: 0 };
}

export function isUnlocked(p: Profile, stage: StageDef): boolean {
  return stage.index === 0 || recordOf(p, STAGES[stage.index - 1].id).cleared;
}

export function totalStars(p: Profile): number {
  let n = 0;
  for (const s of STAGES) n += recordOf(p, s.id).stars.filter(Boolean).length;
  return n;
}

export const STAR_CHESTS = [12, 24, 36];

/** O ferreiro abre depois da fase 1-2. */
export function isForgeUnlocked(p: Profile): boolean {
  return recordOf(p, '1-2').cleared;
}

export function stageInfo(p: Profile, stage: StageDef): StageInfo {
  const diff = p.level - stage.level, record = recordOf(p, stage.id);
  const power = powerOf(deriveStats(p)), recommended = recommendedPower(stage.level);
  let tag: StageTag, tagText: string;
  if (power < recommended * 0.85 || diff <= -3) { tag = 'vermelha'; tagText = 'Vermelha · acima do seu poder'; }
  else if (diff <= 2) { tag = 'verde'; tagText = 'Verde · no ponto'; }
  else if (diff <= 7) { tag = 'amarela'; tagText = 'Amarela · fácil, rende menos'; }
  else { tag = 'cinza'; tagText = 'Cinza · não vale o XP'; }
  return {
    stage, unlocked: isUnlocked(p, stage), record,
    xpMult: xpMultiplier(p.level, stage.level), goldMult: goldMultiplier(p.level, stage.level),
    tag, tagText, power, recommended,
    namedChance: stage.named ? stage.named.chance + record.pity : 0,
  };
}

/** Aplica o resultado de uma fase ao perfil e devolve o resumo para a tela de resultado. */
export function applyOutcome(p: Profile, o: StageOutcome): StageRewards {
  const stage = STAGE_BY_ID.get(o.stageId)!;
  const rng = profileRng(p), stats = deriveStats(p);
  const rec = recordOf(p, stage.id);
  const firstClear = o.won && !rec.cleared;
  const xpMult = xpMultiplier(p.level, stage.level), goldMult = goldMultiplier(p.level, stage.level);
  const progress = o.won ? 1 : (Math.max(0, o.roomsCleared) / stage.rooms.length) * 0.4;

  const xp = Math.round(stageXp(stage.level) * xpMult * progress * (firstClear ? FIRST_CLEAR_XP_BONUS : 1) * (stage.final === 'chefao' && o.won ? BOSS_STAGE_XP_BONUS : 1));
  let gold = Math.round(stageGold(stage.level) * goldMult * progress * stats.goldMult);

  const out: StageRewards = {
    won: o.won, xp, gold, xpMult, goldMult, firstClear, items: [], soldOverflow: [], named: null,
    namedChance: stage.named ? stage.named.chance + rec.pity : 0,
    materials: { mata: 0, po: 0, lagrima: 0 },
    stars: [rec.stars[0], rec.stars[1], rec.stars[2]], newStars: 0, bestTime: false,
    levels: 0, spells: [], rescued: null, talentPoints: 0, starChest: null,
  };

  if (o.won) {
    const drops: Item[] = [];
    if (firstClear) for (const type of stage.firstClear ?? []) drops.push(makeItem(p.nextItemId++, rng, stage.level, 1, type));
    const count = 2 + (stage.rooms.length >= 6 ? 1 : 0) + (stage.final !== 'normal' ? 1 : 0) + (firstClear ? 1 : 0);
    for (let i = 0; i < count; i++) {
      let rarity = rollRarity(rng, stage.chapter, stats.luck);
      if (i === 0 && stage.final === 'elite') rarity = Math.max(rarity, 1);
      if (i === 0 && stage.final === 'chefao') rarity = Math.max(rarity, 2);
      drops.push(makeItem(p.nextItemId++, rng, stage.level, rarity));
    }
    if (stage.named) {
      if (rng() * 100 < out.namedChance) { out.named = makeUnique(p.nextItemId++, rng, stage.named.unique, stage.level); drops.push(out.named); rec.pity = 0; }
      else rec.pity += 0.5;
    }
    for (const it of drops) {
      if (addItem(p, it)) out.items.push(it);
      else { const g = sellValue(it); gold += g; out.soldOverflow.push({ item: it, gold: g }); }
    }
    out.materials.mata = 3 + Math.floor(stage.level / 2) + (stage.final !== 'normal' ? 3 : 0) + Math.floor(rng() * 3);
    out.materials.po = rng() < 0.35 ? 1 : 0;
    if (stage.final === 'chefao' && firstClear) { out.materials.lagrima = 1; out.talentPoints += 1; }

    const stars: [boolean, boolean, boolean] = [true, o.deaths === 0, o.time <= stage.starTime];
    for (let i = 0; i < 3; i++) if (stars[i] && !rec.stars[i]) { rec.stars[i] = true; out.newStars++; }
    out.stars = [rec.stars[0], rec.stars[1], rec.stars[2]];
    if (rec.bestTime == null || o.time < rec.bestTime) { rec.bestTime = Math.round(o.time * 10) / 10; out.bestTime = true; }
    rec.cleared = true; rec.clears++;

    if (stage.rescue && !p.companions[stage.rescue] && (stage.rescue !== 'onca' || o.deaths === 0)) {
      p.companions[stage.rescue] = { level: 1 };
      if (!p.companion) p.companion = stage.rescue;
      out.rescued = stage.rescue;
    }
    if (stage.final === 'chefao' && stage.number === 12) p.curupiraFreed = true;
  }

  p.stages[stage.id] = rec;
  out.gold = gold;
  p.gold += gold;
  p.materials.mata += out.materials.mata; p.materials.po += out.materials.po; p.materials.lagrima += out.materials.lagrima;
  p.talentPoints += out.talentPoints;
  const up = addXp(p, xp);
  out.levels = up.levels; out.spells = up.spells;

  const stars = totalStars(p);
  if (p.starChests < STAR_CHESTS.length && stars >= STAR_CHESTS[p.starChests]) {
    const tier = p.starChests, chest = { stars: STAR_CHESTS[tier], gold: 150 * (tier + 1), mata: 12 * (tier + 1), talent: tier === 2 };
    p.starChests++; p.gold += chest.gold; p.materials.mata += chest.mata;
    if (chest.talent) p.talentPoints += 1;
    out.starChest = chest;
  }
  refillPotions(p);
  return out;
}
