/**
 * O que uma fase paga e quando ela está disponível. Regras de docs/gdd/01-progressao-e-dificuldade.md:
 * XP e ouro caem em fase fácil, o item com nome não sofre redução e tem azar com limite.
 */
import type { Replay } from '../sim/replay';
import { TEMPER_ORDER } from '../data/tempers';
import { OMEN } from '../data/omens';
import { SUPREMOS, blessingCounts, type BlessingId, type CompanionId, type ElementId, type SpellId } from '../data/content';
import { ELEMENT_ORDER } from '../data/content';
import { makeItem, makeSetItem, makeUnique, rollRarity, sellValue, setsOfChapter, type Gem, type Item } from '../data/items';
import { BOSS_STAGE_XP_BONUS, FIRST_CLEAR_XP_BONUS, goldMultiplier, stageGold, stageXp, xpMultiplier } from '../data/progression';
import { CHAPTERS, STAGES, STAGE_BY_ID, stagesOf, type StageDef } from '../data/stages';
import { FLOORS_PER_RUN, isTowerId, towerChapter, towerRun } from '../data/tower';
import { addGem, addItem, addXp, dismantleYield, profileRng, refillPotions, weekKey, type Materials, type Profile, type StageRecord } from './profile';
import { bestSlot } from './mochila';
import type { RunTally } from './daily';
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
  /** Itens afanados pelo graxaim de elites e chefões. */
  stolen?: number;
  /** Contagens da cena para as missões do dia (poções, feitiços, reações, Supremo). */
  tally?: RunTally;
  /** Ouro achado na fase (baús, moedas, potes), antes dos multiplicadores. Vale mesmo na derrota. */
  foundGold?: number;
  /** Baús abertos na fase. */
  chests?: number;
  /** Gravação dos comandos, para o ranking refazer a partida no servidor (fora da Caçada automática). */
  replay?: Replay;
  /** Como o herói saiu (o Sonho leva isto para a sala seguinte): fração da vida, poções, carga do Supremo, quedas que sobraram e o azar do altar. */
  left?: { hpFrac: number; potions: number; supremo: number; revives: number; altarDry: number };
  /** Peso dos Presságios ligados nesta partida da campanha (0 ou ausente = nenhum). */
  omens?: number;
  /** Desafio da última sala (a Provação do Sonho): como terminou. */
  trial?: 'ativo' | 'vencido' | 'perdido' | null;
}

/** O companheiro que está com o herói ganha Laço: uma fase (ou um trecho do Sonho) juntos. O Leal ganha em dobro. */
export function bondUp(p: Profile, n: number): void {
  const c = p.companion ? p.companions[p.companion] : null;
  if (c) c.bond = (c.bond ?? 0) + n * (c.temper === 'leal' ? 2 : 1);
}

export interface StageRewards {
  won: boolean;
  xp: number; gold: number;
  xpMult: number; goldMult: number;
  firstClear: boolean;
  items: Item[];
  /** Itens que não couberam na mochila e foram vendidos na hora. */
  soldOverflow: { item: Item; gold: number }[];
  /** Itens desmontados na hora pelo filtro de saque, e o material que renderam (já somado em `materials`). */
  dismantled?: { count: number; mata: number; po: number };
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
  gems: Gem[];
  /** Venceu o Esquecimento pela primeira vez: mostrar o final. */
  credits: boolean;
  talentPoints: number;
  starChest: { stars: number; gold: number; mata: number; talent: boolean } | null;
  /** Ouro achado dentro da fase (já somado em `gold`) e baús abertos. */
  found?: { gold: number; chests: number };
  /** Torre: andares vencidos nesta subida e o recorde. */
  tower?: { from: number; floors: number; best: number; newBest: boolean; weekBest: number };
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

/** A Torre abre depois de libertar o Curupira. */
export function isTowerUnlocked(p: Profile): boolean {
  return recordOf(p, '1-12').cleared;
}

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

/** O filtro de saque desmonta este item? Nunca os de conjunto, os com nome, nem o que aumenta o Poder. */
export function filterDismantles(p: Profile, it: Item): boolean {
  const max = p.lootFilter?.dismantle ?? -1;
  if (max < 0 || it.rarity > max || it.set || it.unique || it.locked) return false;
  /* confere numa cópia com o item na mochila: equipar exige que ele esteja lá */
  const trial: Profile = { ...p, inventory: [...p.inventory, it] };
  return bestSlot(trial, it).delta <= 0;
}

/**
 * Guarda os itens de uma partida: o filtro de saque desmonta as sobras, o resto vai para a mochila,
 * e o que não couber é vendido. Devolve o ouro das vendas; o material das desmontagens entra em `out.materials`.
 */
export function stashDrops(p: Profile, drops: Item[], out: StageRewards): number {
  let gold = 0;
  for (const it of drops) {
    if (filterDismantles(p, it)) {
      const y = dismantleYield(it);
      out.materials.mata += y.mata; out.materials.po += y.po;
      const d = out.dismantled ?? (out.dismantled = { count: 0, mata: 0, po: 0 });
      d.count++; d.mata += y.mata; d.po += y.po;
    } else if (addItem(p, it)) out.items.push(it);
    else { const g = sellValue(it); gold += g; out.soldOverflow.push({ item: it, gold: g }); }
  }
  return gold;
}

/** Ouro achado na fase, com os mesmos multiplicadores do ouro da fase. */
function foundGold(o: StageOutcome, mult: number): { gold: number; chests: number } {
  return { gold: Math.round(Math.max(0, o.foundGold ?? 0) * mult), chests: o.chests ?? 0 };
}

/** Aplica o resultado de uma fase ao perfil e devolve o resumo para a tela de resultado. */
export function applyOutcome(p: Profile, o: StageOutcome): StageRewards {
  if (isTowerId(o.stageId)) return applyTowerOutcome(p, o);
  const stage = STAGE_BY_ID.get(o.stageId)!;
  const rng = profileRng(p), stats = deriveStats(p);
  stats.luck += 15 * (blessingCounts(o.blessings ?? []).trevo ?? 0);
  const rec = recordOf(p, stage.id);
  const firstClear = o.won && !rec.cleared;
  const xpMult = xpMultiplier(p.level, stage.level), goldMult = goldMultiplier(p.level, stage.level);
  const progress = o.won ? 1 : (Math.max(0, o.roomsCleared) / stage.rooms.length) * 0.4;

  const bl = blessingCounts(o.blessings ?? []), t = p.talents;
  const xp = Math.round(stageXp(stage.level) * xpMult * progress * stats.xpMult * (1 + 0.25 * (bl.sabedoria ?? 0))
    * (firstClear ? FIRST_CLEAR_XP_BONUS : 1) * (stage.final === 'chefao' && o.won ? BOSS_STAGE_XP_BONUS : 1));
  /* Presságios na campanha: só valem em fase que já tinha as 3 estrelas; cada ponto melhora o ouro e a raridade */
  const peso = rec.stars.every(Boolean) ? Math.max(0, Math.min(OMEN.campaignMax, Math.floor(o.omens ?? 0))) : 0;
  let gold = Math.round(stageGold(stage.level) * goldMult * progress * stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0)) * (1 + OMEN.goldPerPoint * peso));
  const found = foundGold(o, goldMult * stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0)));
  gold += found.gold;

  const out: StageRewards = {
    won: o.won, xp, gold, xpMult, goldMult, firstClear, items: [], soldOverflow: [], named: null,
    namedChance: namedChance(p, stage),
    materials: { mata: 0, po: 0, lagrima: 0, tomo: 0 },
    stars: [rec.stars[0], rec.stars[1], rec.stars[2]], newStars: 0, bestTime: false,
    levels: 0, spells: [], rescued: null, supremo: null, gems: [], credits: false, talentPoints: 0, starChest: null, found,
  };

  if (o.won) {
    const drops: Item[] = [];
    if (firstClear) for (const type of stage.firstClear ?? []) drops.push(makeItem(p.nextItemId++, rng, stage.level, 1, type));
    const count = 2 + (stage.rooms.length >= 6 ? 1 : 0) + (stage.final !== 'normal' ? 1 : 0) + (firstClear ? 1 : 0)
      + (t.farejador ? 1 : 0) + (bl.fartura ?? 0) + Math.min(1, o.stolen ?? 0);
    const sets = setsOfChapter(stage.chapter);
    for (let i = 0; i < count; i++) {
      let rarity = rollRarity(rng, stage.chapter, stats.luck);
      if (peso > 0 && rarity < 5 && rng() < OMEN.rarityPerPoint * peso) rarity++;
      if (i === 0 && stage.final === 'elite') rarity = Math.max(rarity, 1);
      if (i === 0 && (stage.final === 'chefao' || t.dedoDeOuro)) rarity = Math.max(rarity, 2);
      /* peça de conjunto do capítulo: mais chance nas fases finais */
      const setChance = rarity >= 2 ? (stage.final === 'chefao' ? 0.25 : stage.final === 'elite' ? 0.14 : 0.07) : 0;
      if (sets.length && rng() < setChance) drops.push(makeSetItem(p.nextItemId++, rng, sets[Math.floor(rng() * sets.length)].key, stage.level, rarity));
      else drops.push(makeItem(p.nextItemId++, rng, stage.level, rarity, undefined, stage.chapter));
    }
    /* gemas: elites e chefões sempre, fase comum às vezes */
    const gemLvl = Math.min(3, 1 + Math.floor((stage.chapter - 1) / 3));
    const gemN = stage.final === 'chefao' ? 2 : stage.final === 'elite' ? 1 : rng() < 0.18 ? 1 : 0;
    for (let i = 0; i < gemN; i++) {
      const g: Gem = { el: ELEMENT_ORDER[Math.floor(rng() * ELEMENT_ORDER.length)], lvl: Math.max(1, gemLvl - (i === 0 ? 0 : 1)) };
      addGem(p, g); out.gems.push(g);
    }
    if (stage.named) {
      if (rng() * 100 < out.namedChance) { out.named = makeUnique(p.nextItemId++, rng, stage.named.unique, stage.level); drops.push(out.named); rec.pity = 0; }
      else rec.pity += 0.5;
    }
    gold += stashDrops(p, drops, out);
    const mat = t.catador ? 1.5 : 1;
    out.materials.mata += Math.round((3 + Math.floor(stage.level / 2) + (stage.final !== 'normal' ? 3 : 0) + Math.floor(rng() * 3)) * mat);
    out.materials.po += Math.round(((rng() < 0.35 ? 1 : 0) + (stage.final === 'elite' ? 1 : 0)) * mat);
    out.materials.tomo = (stage.final === 'elite' ? 1 : 0) + (stage.final === 'chefao' ? 2 : 0) + (firstClear && stage.number % 3 === 0 ? 1 : 0);
    if (stage.final === 'chefao' && firstClear) { out.materials.lagrima = 1; out.talentPoints += 1; }

    const stars: [boolean, boolean, boolean] = [true, o.deaths === 0, o.time <= stage.starTime];
    for (let i = 0; i < 3; i++) if (stars[i] && !rec.stars[i]) { rec.stars[i] = true; out.newStars++; }
    out.stars = [rec.stars[0], rec.stars[1], rec.stars[2]];
    if (rec.bestTime == null || o.time < rec.bestTime) { rec.bestTime = Math.round(o.time * 10) / 10; out.bestTime = true; }
    rec.cleared = true; rec.clears++;
    bondUp(p, 1);
    if (peso > 0) rec.omen = Math.max(rec.omen ?? 0, peso);

    if (stage.rescue && !p.companions[stage.rescue] && (stage.rescue !== 'onca' || o.deaths === 0)) {
      /* o Temperamento é sorteado no resgate */
      p.companions[stage.rescue] = { level: 1, temper: TEMPER_ORDER[Math.floor(profileRng(p)() * TEMPER_ORDER.length)], bond: 0 };
      if (!p.companion) p.companion = stage.rescue;
      out.rescued = stage.rescue;
    }
    if (stage.id === '1-12') p.curupiraFreed = true;
    if (stage.id === '8-12' && !p.credits) { p.credits = true; out.credits = true; }
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

/** Resultado de uma subida da Torre: paga por andar vencido e guarda o recorde. */
export function applyTowerOutcome(p: Profile, o: StageOutcome): StageRewards {
  const run = towerRun(Number(o.stageId.slice(6))), rng = profileRng(p), stats = deriveStats(p), bl = blessingCounts(o.blessings ?? []);
  const floors = run.rooms.slice(0, Math.max(0, o.roomsCleared)).filter((r) => r.floor != null);
  const top = floors.length ? floors[floors.length - 1].floor! : run.number - 1;
  const out: StageRewards = {
    won: o.won, xp: 0, gold: 0, xpMult: 1, goldMult: 1, firstClear: false, items: [], soldOverflow: [], named: null, namedChance: 0,
    materials: { mata: 0, po: 0, lagrima: 0, tomo: 0 }, stars: [false, false, false], newStars: 0, bestTime: false,
    levels: 0, spells: [], rescued: null, supremo: null, gems: [], credits: false, talentPoints: 0, starChest: null,
  };
  let xp = 0, gold = 0;
  const drops: Item[] = [];
  for (const r of floors) {
    const f = r.floor!, lv = r.level ?? run.level, ch = towerChapter(f);
    xp += stageXp(lv) * 0.45 * xpMultiplier(p.level, lv);
    gold += stageGold(lv) * 0.5;
    out.materials.mata += 1 + Math.floor(lv / 12);
    if (f % 5 === 0) out.materials.tomo += 1;
    if (f % 10 === 0) {
      for (let i = 0; i < 2; i++) { const g = { el: ELEMENT_ORDER[Math.floor(rng() * ELEMENT_ORDER.length)], lvl: Math.min(6, 1 + Math.floor(f / 25) + (i === 0 ? 1 : 0)) }; addGem(p, g); out.gems.push(g); }
      const rarity = Math.max(2, rollRarity(rng, ch, stats.luck));
      drops.push(rng() < 0.3 ? makeSetItem(p.nextItemId++, rng, rng() < 0.5 ? 'andarilho' : 'sentinela', lv, rarity) : makeItem(p.nextItemId++, rng, lv, rarity, undefined, ch));
      out.materials.po += 1;
      if (f === 50 && !p.companions.mico) { p.companions.mico = { level: 1 }; out.rescued = 'mico'; }
    }
  }
  if (o.won) for (let i = 0; i < 2; i++) drops.push(makeItem(p.nextItemId++, rng, run.level, rollRarity(rng, towerChapter(top), stats.luck), undefined, towerChapter(top)));
  const sold = stashDrops(p, drops, out);
  out.xp = Math.round(xp * stats.xpMult * (1 + 0.25 * (bl.sabedoria ?? 0)));
  out.found = foundGold(o, stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0)));
  out.gold = Math.round(gold * stats.goldMult * (1 + 0.4 * (bl.ouro ?? 0))) + out.found.gold + sold;
  const t = p.tower, wk = weekKey(), climbed = top >= run.number ? top : 0;
  if (t.week !== wk) { t.week = wk; t.weekBest = 0; t.weekTime = 0; }
  const newBest = climbed > t.best;
  if (newBest) t.best = climbed;
  if (climbed > t.weekBest || (climbed === t.weekBest && climbed > 0 && o.time < t.weekTime)) { t.weekBest = climbed; t.weekTime = Math.round(o.time * 10) / 10; }
  /* vencido o andar 100, a subida continua nas Profundezas, de dez em dez */
  if (o.won) t.checkpoint = t.best >= 100 ? run.number + FLOORS_PER_RUN : Math.min(91, run.number + FLOORS_PER_RUN);
  out.tower = { from: run.number, floors: floors.length, best: t.best, newBest, weekBest: t.weekBest };
  p.gold += out.gold;
  p.materials.mata += out.materials.mata; p.materials.po += out.materials.po; p.materials.tomo += out.materials.tomo;
  const up = addXp(p, out.xp);
  out.levels = up.levels; out.spells = up.spells;
  refillPotions(p);
  return out;
}
