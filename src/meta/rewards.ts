/**
 * O que uma fase paga e quando ela está disponível. Regras de docs/gdd/01-progressao-e-dificuldade.md:
 * XP e ouro caem em fase fácil, o item com nome não sofre redução e tem azar com limite.
 */
import { SUPREMOS, blessingCounts, type BlessingId, type CompanionId, type ElementId, type SpellId } from '../data/content';
import { makeItem, makeUnique, rollRarity, sellValue, type Item } from '../data/items';
import { BOSS_STAGE_XP_BONUS, FIRST_CLEAR_XP_BONUS, goldMultiplier, stageGold, stageXp, xpMultiplier } from '../data/progression';
import { CHAPTERS, STAGES, STAGE_BY_ID, stagesOf, type StageDef } from '../data/stages';
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
  /** Bênçãos escolhidas nos altares desta tentativa. */
  blessings?: BlessingId[];
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
  /** Encantado libertado nesta vitória, que passa a poder ser chamado como Supremo. */
  supremo: ElementId | null;
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

export function isChapterOpen(p: Profile, chapter: number): boolean {
  const def = CHAPTERS.find((c) => c.id === chapter);
  if (!def || !def.available) return false;
  if (chapter === 1) return true;
  const prev = stagesOf(chapter - 1);
  return recordOf(p, prev[prev.length - 1].id).cleared;
}

export function isUnlocked(p: Profile, stage: StageDef): boolean {
  if (!isChapterOpen(p, stage.chapter)) return false;
  return stage.index === 0 || recordOf(p, STAGES[stage.index - 1].id).cleared;
}

/** Estrelas ganhas no jogo todo, ou só num capítulo. */
export function totalStars(p: Profile, chapter?: number): number {
  let n = 0;
  for (const s of STAGES) if (chapter == null || s.chapter === chapter) n += recordOf(p, s.id).stars.filter(Boolean).length;
  return n;
}

/** Baús de estrelas: 3 por capítulo, pelo total de estrelas do jogo. */
export const STAR_CHESTS = [12, 24, 36, 48, 60, 72];

/** O ferreiro abre depois da fase 1-2. */
export function isForgeUnlocked(p: Profile): boolean {
  return recordOf(p, '1-2').cleared;
}

export function stageInfo(p: Profile, stage: StageDef): StageInfo {
  const diff = p.level - stage.level, record = recordOf(p, stage.id);
  const power = powerOf(deriveStats(p)), recommended = recommendedPower(stage.level);
  let tag: StageTag, tagText: string;
  if (power < recommended * 0.85 || diff <= -3) { tag = 'vermelha'; tagText = 'Difícil para o seu poder'; }
  else if (diff <= 2) { tag = 'verde'; tagText = 'No ponto'; }
  else if (diff <= 7) { tag = 'amarela'; tagText = 'Fácil: rende menos'; }
  else { tag = 'cinza'; tagText = 'Fácil demais: quase não rende'; }
  return {
    stage, unlocked: isUnlocked(p, stage), record,
    xpMult: xpMultiplier(p.level, stage.level), goldMult: goldMultiplier(p.level, stage.level),
    tag, tagText, power, recommended,
    namedChance: namedChance(p, stage),
  };
}

/** Chance, em porcento, do item com nome da fase: base, azar acumulado e o Dom Dedo de Ouro. */
export function namedChance(p: Profile, stage: StageDef): number {
  if (!stage.named) return 0;
  return (stage.named.chance + recordOf(p, stage.id).pity) * (p.talents.dedoDeOuro ? 2 : 1);
}

/** Aplica o resultado de uma fase ao perfil e devolve o resumo para a tela de resultado. */
export function applyOutcome(p: Profile, o: StageOutcome): StageRewards {
  const stage = STAGE_BY_ID.get(o.stageId)!;
  const rng = profileRng(p), stats = deriveStats(p);
  const rec = recordOf(p, stage.id);
  const firstClear = o.won && !rec.cleared;
  const xpMult = xpMultiplier(p.level, stage.level), goldMult = goldMultiplier(p.level, stage.level);
  const progress = o.won ? 1 : (Math.max(0, o.roomsCleared) / stage.rooms.length) * 0.4;

  const bl = blessingCounts(o.blessings ?? []), t = p.talents;
  const xp = Math.round(stageXp(stage.level) * xpMult * progress * stats.xpMult * (1 + 0.25 * (bl.sabedoria ?? 0))
    * (firstClear ? FIRST_CLEAR_XP_BONUS : 1) * (stage.final === 'chefao' && o.won ? BOSS_STAGE_XP_BONUS : 1));
  let gold = Math.round(stageGold(stage.level) * goldMult * progress * stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0)));

  const out: StageRewards = {
    won: o.won, xp, gold, xpMult, goldMult, firstClear, items: [], soldOverflow: [], named: null,
    namedChance: namedChance(p, stage),
    materials: { mata: 0, po: 0, lagrima: 0, tomo: 0 },
    stars: [rec.stars[0], rec.stars[1], rec.stars[2]], newStars: 0, bestTime: false,
    levels: 0, spells: [], rescued: null, supremo: null, talentPoints: 0, starChest: null,
  };

  if (o.won) {
    const drops: Item[] = [];
    if (firstClear) for (const type of stage.firstClear ?? []) drops.push(makeItem(p.nextItemId++, rng, stage.level, 1, type));
    const count = 2 + (stage.rooms.length >= 6 ? 1 : 0) + (stage.final !== 'normal' ? 1 : 0) + (firstClear ? 1 : 0)
      + (t.farejador ? 1 : 0) + (bl.fartura ?? 0);
    for (let i = 0; i < count; i++) {
      let rarity = rollRarity(rng, stage.chapter, stats.luck);
      if (i === 0 && stage.final === 'elite') rarity = Math.max(rarity, 1);
      if (i === 0 && (stage.final === 'chefao' || t.dedoDeOuro)) rarity = Math.max(rarity, 2);
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
    const mat = t.catador ? 1.5 : 1;
    out.materials.mata = Math.round((3 + Math.floor(stage.level / 2) + (stage.final !== 'normal' ? 3 : 0) + Math.floor(rng() * 3)) * mat);
    out.materials.po = Math.round(((rng() < 0.35 ? 1 : 0) + (stage.final === 'elite' ? 1 : 0)) * mat);
    out.materials.tomo = (stage.final === 'elite' ? 1 : 0) + (stage.final === 'chefao' ? 2 : 0) + (firstClear && stage.number % 3 === 0 ? 1 : 0);
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
    if (stage.id === '1-12') p.curupiraFreed = true;
    for (const el of Object.keys(SUPREMOS) as ElementId[]) {
      if (SUPREMOS[el].stage === stage.id && !p.supremos.includes(el)) {
        p.supremos.push(el); out.supremo = el;
        if (!p.supremo) p.supremo = el;
      }
    }
  }

  p.stages[stage.id] = rec;
  out.gold = gold;
  p.gold += gold;
  p.materials.mata += out.materials.mata; p.materials.po += out.materials.po; p.materials.lagrima += out.materials.lagrima; p.materials.tomo += out.materials.tomo;
  p.talentPoints += out.talentPoints;
  const up = addXp(p, xp);
  out.levels = up.levels; out.spells = up.spells;

  const stars = totalStars(p);
  if (p.starChests < STAR_CHESTS.length && stars >= STAR_CHESTS[p.starChests]) {
    const tier = p.starChests, chest = { stars: STAR_CHESTS[tier], gold: 150 * (tier + 1), mata: 12 * (tier + 1), talent: tier % 3 === 2 };
    p.starChests++; p.gold += chest.gold; p.materials.mata += chest.mata;
    if (chest.talent) p.talentPoints += 1;
    out.starChest = chest;
  }
  refillPotions(p);
  return out;
}
