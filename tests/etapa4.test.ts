/** Etapa 4, fases 0 e 1 (docs/gdd/10): perfil v2, contadores, conquistas, filtro de saque, builds e troca de missão. */
import { afterEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { TICK } from '../src/data/balance';
import { BLESSING_ORDER, COMPANION_ORDER } from '../src/data/content';
import { MISSIONS, type MissionKind } from '../src/data/daily';
import { UNIQUES, makeItem, makeSetItem, makeUnique } from '../src/data/items';
import { BESTIARY, BESTIARY_KINDS, COMPANION_LORE, ENEMY_LORE } from '../src/data/lore';
import { makeRng } from '../src/data/rng';
import { STAGES, STAGE_BY_ID } from '../src/data/stages';
import { UI_ICON_KEYS } from '../src/art/uiicons';
import { achievementProgress, checkAchievements, claimAchievement, claimAllAchievements, claimableAchievements } from '../src/meta/achievements';
import { canReroll, countEvent, newTally, rerollMission, rerollsLeft, setClock, settleStage, touchDay } from '../src/meta/daily';
import { KNOWLEDGE, knowledgeBonus, recordRun } from '../src/meta/life';
import {
  PROFILE_VERSION, addItem, addTalent, allocAttr, applyBuild, buildMatches, equip, migrate, newLife, newProfile, saveBuild, type Profile,
} from '../src/meta/profile';
import { applyOutcome, filterDismantles, type StageOutcome } from '../src/meta/rewards';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { HUMAN, makeBot } from '../src/sim/bot';
import { createWorld, fingerprint, step } from '../src/sim/world';
import { damageEnemy } from '../src/sim/core';

const DAY = new Date(2026, 10, 25, 10);
const outcome = (stageId: string, over: Partial<StageOutcome> = {}): StageOutcome => ({ stageId, won: true, time: 60, deaths: 0, roomsCleared: 5, kills: 20, perfects: 0, hitsTaken: 3, tally: newTally(), ...over });
function progressed(lastId: string, seed = 7): Profile {
  const p = newProfile(seed), last = STAGES.findIndex((s) => s.id === lastId);
  for (const s of STAGES.slice(0, last + 1)) p.stages[s.id] = { cleared: true, stars: [true, false, false], bestTime: 100, pity: 0, clears: 1 };
  p.level = STAGES[last].level;
  return p;
}

afterEach(() => setClock());

describe('perfil versão 2', () => {
  it('um save da versão 1 vira versão 2 sem perder nada', () => {
    const v2 = referenceProfile(20);
    v2.stages['1-1'] = { cleared: true, stars: [true, true, false], bestTime: 80, pity: 0, clears: 4 };
    v2.tower.best = 20; v2.gold = 777;
    const unique = makeUnique(v2.nextItemId++, makeRng(3), Object.keys(UNIQUES)[0], 20);
    v2.inventory.push(unique);
    /* como era o save antigo: sem os campos novos */
    const v1 = JSON.parse(JSON.stringify(v2)) as Record<string, unknown>;
    v1.version = 1;
    for (const k of ['life', 'achievements', 'uniquesFound', 'lootFilter', 'builds']) delete v1[k];
    delete (v1.daily as Record<string, unknown>).rerolls;

    const p = migrate(v1 as unknown as Profile);
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.gold).toBe(777);
    expect(p.level).toBe(20);
    expect(p.equipped.arma?.id).toBe(v2.equipped.arma?.id);
    expect(p.inventory).toHaveLength(1);
    expect(p.stages['1-1'].clears).toBe(4);
    expect(p.life.wins).toBe(4);
    expect(p.life.towerFloors).toBe(20);
    expect(p.uniquesFound).toEqual([unique.unique]);
    expect(p.achievements).toEqual({});
    expect(p.lootFilter.dismantle).toBe(-1);
    expect(p.builds).toEqual([null, null, null]);
    expect(p.daily.rerolls).toBe(0);
    expect(() => deriveStats(p)).not.toThrow();
  });

  it('migrar duas vezes não muda mais nada, e um save já novo fica igual', () => {
    const p = referenceProfile(12);
    p.life.kills.sauva = 30; p.lootFilter.dismantle = 1;
    const once = migrate(JSON.parse(JSON.stringify(p)) as Profile), twice = migrate(JSON.parse(JSON.stringify(once)) as Profile);
    expect(twice).toEqual(once);
    expect(once.life.kills.sauva).toBe(30);
    expect(once.lootFilter.dismantle).toBe(1);
  });
});

describe('contadores de longo prazo', () => {
  it('a contagem da partida soma abates por tipo, elites, chefes e o maior golpe', () => {
    const t = newTally();
    countEvent(t, { type: 'kill', kind: 'sauva', value: 0 });
    countEvent(t, { type: 'kill', kind: 'sauva', value: 1 });
    countEvent(t, { type: 'kill', kind: 'tronco', value: 2 });
    countEvent(t, { type: 'kill', kind: 'curupira', value: 3 });
    countEvent(t, { type: 'kill', kind: 'cogumelo' }); // estourou sozinho: não é abate
    countEvent(t, { type: 'hit', value: 120 }); countEvent(t, { type: 'hit', value: 90 });
    countEvent(t, { type: 'parry' }); countEvent(t, { type: 'pot' }); countEvent(t, { type: 'wisp', kind: 'caught' }); countEvent(t, { type: 'wisp', kind: 'hit' });
    expect(t.killsBy).toEqual({ sauva: 2, tronco: 1, curupira: 1 });
    expect([t.champions, t.elites, t.bosses, t.maxHit, t.parries, t.pots, t.wisps]).toEqual([1, 1, 1, 120, 1, 1, 1]);
  });

  it('o fim de qualquer partida entra nos contadores, uma vez só', () => {
    setClock(() => DAY);
    const p = progressed('1-6');
    const t = newTally();
    t.killsBy = { sauva: 12, queixada: 3 }; t.elites = 1; t.reactions = 4; t.casts = 9; t.castsBy = { natureza: 9 }; t.maxHit = 321;
    settleStage(p, outcome('1-3', { kills: 15, perfects: 2, deaths: 1, tally: t, blessings: ['furia', 'furia', 'olho'], chests: 2 }));
    const L = p.life;
    expect(L.kills).toEqual({ sauva: 12, queixada: 3 });
    expect([L.runs, L.wins, L.flawless, L.deaths, L.perfects, L.elites, L.reactions, L.casts, L.maxHit, L.chests]).toEqual([1, 1, 0, 1, 2, 1, 4, 9, 321, 2]);
    expect(L.winsBy).toEqual({ facao: 1 });
    expect(L.blessings).toEqual({ furia: 2, olho: 1 });
    expect(L.castsBy).toEqual({ natureza: 9 });
    expect(L.gold).toBeGreaterThan(0);
    settleStage(p, outcome('1-3', { won: false, roomsCleared: 1, tally: newTally() }));
    expect([p.life.runs, p.life.wins]).toEqual([2, 1]);
  });

  it('itens com nome encontrados ficam no Almanaque', () => {
    const p = newProfile(5), id = Object.keys(UNIQUES)[0];
    const it = makeUnique(p.nextItemId++, makeRng(1), id, 5);
    const r = applyOutcome(p, outcome('1-1'));
    r.items.push(it);
    recordRun(p, outcome('1-1'), r, { weapon: 'facao' });
    recordRun(p, outcome('1-1'), r, { weapon: 'facao' });
    expect(p.uniquesFound).toEqual([id]);
  });

  it('conhecer o inimigo: 100 abates dão 3% e 500 dão 6%, menos onde há ranking', () => {
    expect(KNOWLEDGE.map((k) => [k.kills, k.bonus])).toEqual([[100, 0.03], [500, 0.06]]);
    expect([0, 99, 100, 499, 500, 9999].map(knowledgeBonus)).toEqual([0, 0, 0.03, 0.03, 0.06, 0.06]);
    const hit = (kills: number, ranked: boolean) => {
      const p = referenceProfile(10);
      p.life.kills.sauva = kills;
      const s = STAGE_BY_ID.get('1-1')!, w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(p), seed: 5, ranked });
      const e = { ...spawn(w), state: 'chase' as const };
      w.enemies = [e];
      w.stats = { ...w.stats, critChance: 0 };
      return damageEnemy(w, e, 1000, 'spell', 0);
    };
    const base = hit(0, false);
    expect(hit(100, false) / base).toBeCloseTo(1.03, 2);
    expect(hit(500, false) / base).toBeCloseTo(1.06, 2);
    expect(hit(500, true)).toBe(base);
  });
});

import { spawnEnemy } from '../src/sim/world';
function spawn(w: ReturnType<typeof createWorld>) { return spawnEnemy(w, { kind: 'sauva', x: 600, y: 400 }); }

describe('conquistas', () => {
  it('identificadores únicos, ícones que existem e prêmio em todas', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(40);
    for (const a of ACHIEVEMENTS) {
      expect(UI_ICON_KEYS as readonly string[], a.id).toContain(a.icon);
      expect(a.target, a.id).toBeGreaterThan(0);
      expect(a.reward.gold, a.id).toBeGreaterThan(0);
      expect(a.name.length, a.id).toBeLessThanOrEqual(28);
    }
  });

  it('um perfil novo não tem nenhuma, e nenhuma dispara duas vezes', () => {
    const p = newProfile(3);
    expect(checkAchievements(p, DAY)).toEqual([]);
    p.stages['1-1'] = { cleared: true, stars: [true, false, false], bestTime: 50, pity: 0, clears: 1 };
    expect(checkAchievements(p, DAY)).toEqual(['primeira_trilha']);
    expect(p.achievements.primeira_trilha).toEqual({ day: '2026-11-25', claimed: false });
    expect(checkAchievements(p, DAY)).toEqual([]);
  });

  it('todas são alcançáveis: um perfil que fez tudo tem as 100%', () => {
    const p = referenceProfile(60);
    for (const s of STAGES) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 50, pity: 0, clears: 3 };
    for (const id of COMPANION_ORDER) p.companions[id] = { level: 1 };
    p.uniquesFound = Object.keys(UNIQUES);
    const L = p.life;
    for (const k of BESTIARY_KINDS) L.kills[k] = 600;
    Object.assign(L, { elites: 999, champions: 999, bosses: 999, perfects: 999, parries: 999, reactions: 9999, supremos: 999, flawless: 999, maxHit: 99999, forges: 999, expeditions: 999, autoWins: 999, wisps: 99, pots: 999, potions: 999, deaths: 999, gold: 999999, seconds: 99999 });
    for (const w of ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado']) L.winsBy[w] = 1;
    for (const b of BLESSING_ORDER) L.blessings[b] = 1;
    p.tower.best = 100;
    p.equipped.arma!.rarity = 5; p.equipped.arma!.plus = 15; p.gems['fogo:6'] = 1; p.spellLevels.dardo = 10;
    const got = checkAchievements(p, DAY);
    const missing = ACHIEVEMENTS.filter((a) => !got.includes(a.id)).map((a) => `${a.id} ${achievementProgress(p, a)}/${a.target}`);
    expect(missing).toEqual([]);
  });

  it('pegar o prêmio paga uma vez só', () => {
    const p = newProfile(3);
    p.stages['1-1'] = { cleared: true, stars: [true, false, false], bestTime: 50, pity: 0, clears: 1 };
    p.level = 20;
    checkAchievements(p, DAY);
    expect(claimableAchievements(p).map((a) => a.id)).toEqual(['primeira_trilha', 'nivel_20']);
    const gold = p.gold, r = claimAchievement(p, 'primeira_trilha')!;
    expect(p.gold).toBe(gold + r.gold);
    expect(claimAchievement(p, 'primeira_trilha')).toBeNull();
    expect(claimAchievement(p, 'estrelas_36')).toBeNull();
    const all = claimAllAchievements(p);
    expect(all.count).toBe(1);
    expect(p.gold).toBe(gold + r.gold + all.reward.gold);
    expect(claimableAchievements(p)).toEqual([]);
  });

  it('o fim da partida avisa as conquistas novas', () => {
    setClock(() => DAY);
    const p = newProfile(9);
    const r = settleStage(p, outcome('1-1'));
    expect(r.achievements).toContain('primeira_trilha');
    expect(settleStage(p, outcome('1-1')).achievements).toEqual([]);
  });
});

describe('almanaque', () => {
  it('todo bicho e todo companheiro tem texto, e o bestiário cobre os oito capítulos', () => {
    for (const b of BESTIARY) expect(ENEMY_LORE[b.kind], b.kind).toBeTruthy();
    for (const id of COMPANION_ORDER) expect(COMPANION_LORE[id], id).toBeTruthy();
    for (let ch = 1; ch <= 8; ch++) {
      const list = BESTIARY.filter((b) => b.chapter === ch);
      expect(list.filter((b) => b.role === 'chefe'), `cap ${ch}`).toHaveLength(1);
      expect(list.filter((b) => b.role === 'elite'), `cap ${ch}`).toHaveLength(1);
      expect(list.filter((b) => b.role === 'comum').length, `cap ${ch}`).toBeGreaterThanOrEqual(5);
    }
    /* todo monstro que aparece numa fase está no bestiário */
    for (const s of STAGES) for (const k of s.kinds) expect(BESTIARY_KINDS, k).toContain(k);
  });
});

describe('filtro de saque', () => {
  const junk = (p: Profile, rarity: number, lvl = 1) => makeItem(p.nextItemId++, makeRng(rarity + 9), lvl, rarity, 'chapeu');

  it('desligado por padrão; ligado, desmonta só até a raridade escolhida', () => {
    const p = referenceProfile(30);
    expect(filterDismantles(p, junk(p, 0))).toBe(false);
    p.lootFilter.dismantle = 1;
    expect(filterDismantles(p, junk(p, 0))).toBe(true);
    expect(filterDismantles(p, junk(p, 1))).toBe(true);
    expect(filterDismantles(p, junk(p, 2))).toBe(false);
  });

  it('nunca desmonta item de conjunto, com nome, travado ou que aumenta o Poder', () => {
    const p = referenceProfile(30);
    p.lootFilter.dismantle = 2;
    const set = makeSetItem(p.nextItemId++, makeRng(2), 'andarilho', 1, 2), uni = makeUnique(p.nextItemId++, makeRng(2), Object.keys(UNIQUES)[0], 1);
    uni.rarity = 2;
    expect(filterDismantles(p, set)).toBe(false);
    expect(filterDismantles(p, uni)).toBe(false);
    expect(filterDismantles(p, { ...junk(p, 0), locked: true })).toBe(false);
    /* um chapéu comum de nível muito mais alto ainda é uma melhoria: fica */
    expect(filterDismantles(p, junk(p, 1, 60))).toBe(false);
  });

  it('o material entra no resultado e os itens não ocupam a mochila', () => {
    const run = (dismantle: number) => {
      const p = referenceProfile(40);
      p.seed = 4242; p.lootFilter.dismantle = dismantle;
      p.stages['1-1'] = { cleared: true, stars: [true, true, true], bestTime: 50, pity: 0, clears: 1 };
      const mata = p.materials.mata, r = applyOutcome(p, outcome('1-1'));
      return { r, p, gained: p.materials.mata - mata };
    };
    const off = run(-1), on = run(1);
    expect(off.r.dismantled).toBeUndefined();
    expect(on.r.dismantled!.count).toBeGreaterThan(0);
    expect(on.r.items.length + on.r.dismantled!.count).toBe(off.r.items.length);
    expect(on.p.inventory.length).toBeLessThan(off.p.inventory.length);
    expect(on.gained).toBe(off.gained + on.r.dismantled!.mata);
    expect(on.r.materials.mata).toBe(on.gained);
  });
});

describe('builds salvas', () => {
  it('guarda e devolve equipamento, atributos, talentos, feitiços e companheiro', () => {
    const p = referenceProfile(20);
    p.attrPoints = 4;
    const bow = makeItem(p.nextItemId++, makeRng(8), 20, 2, 'arco');
    addItem(p, bow);
    saveBuild(p, 0, 'Facão');
    expect(buildMatches(p, 0)).toBe(true);
    const before = JSON.stringify([p.equipped, p.attrs, p.talents, p.loadout, p.companion]);

    equip(p, bow.id); allocAttr(p, 'agilidade', 4); addTalent(p, 'raizAgilidade'); p.loadout = ['sementes', null, 'dardo']; p.companion = null;
    expect(buildMatches(p, 0)).toBe(false);
    saveBuild(p, 1, 'Arco');
    expect(p.builds[1]!.equipped.arma).toBe(bow.id);

    const res = applyBuild(p, 0)!;
    expect(res).toEqual({ missing: 0, attrsKept: false, talentsKept: false });
    expect(JSON.stringify([p.equipped, p.attrs, p.talents, p.loadout, p.companion])).toBe(before);
    expect(p.attrPoints).toBe(4);
    expect(p.inventory.map((i) => i.id)).toContain(bow.id);
    applyBuild(p, 1);
    expect(p.equipped.arma?.id).toBe(bow.id);
    expect(p.attrPoints).toBe(0);
    expect(buildMatches(p, 1)).toBe(true);
  });

  it('item que não existe mais é pulado e avisado; espaço vazio não faz nada', () => {
    const p = referenceProfile(20);
    saveBuild(p, 0);
    const lost = p.equipped.cabeca!.id;
    delete p.equipped.cabeca;
    const res = applyBuild(p, 0)!;
    expect(res.missing).toBe(1);
    expect(p.equipped.cabeca).toBeUndefined();
    expect(p.builds[0]!.equipped.cabeca).toBe(lost);
    expect(applyBuild(p, 2)).toBeNull();
    expect(saveBuild(p, 5)).toBeNull();
  });

  it('o nome é cortado e nunca fica vazio', () => {
    const p = referenceProfile(5);
    expect(saveBuild(p, 0, '   ')!.name).toBe('Build 1');
    expect(saveBuild(p, 1, 'Um nome comprido demais para caber')!.name.length).toBeLessThanOrEqual(18);
  });
});

describe('troca de missão', () => {
  it('uma por dia, por outra de grupo livre, e volta no dia seguinte', () => {
    setClock(() => DAY);
    const p = progressed('2-6', 11);
    touchDay(p);
    expect(rerollsLeft(p)).toBe(1);
    const before = p.daily.missions.map((m) => m.kind), groups = before.map((k) => MISSIONS[k as MissionKind].group);
    const fresh = rerollMission(p, 1)!;
    expect(fresh.progress).toBe(0);
    expect(groups).not.toContain(MISSIONS[fresh.kind as MissionKind].group);
    expect(p.daily.missions[0].kind).toBe(before[0]);
    expect(p.daily.missions[2].kind).toBe(before[2]);
    expect(rerollsLeft(p)).toBe(0);
    expect(canReroll(p, 0)).toBe(false);
    expect(rerollMission(p, 0)).toBeNull();
    setClock(() => new Date(2026, 10, 26, 9));
    touchDay(p);
    expect(rerollsLeft(p)).toBe(1);
  });

  it('missão cumprida não pode ser trocada', () => {
    setClock(() => DAY);
    const p = progressed('2-6', 12);
    touchDay(p);
    p.daily.missions[0].progress = p.daily.missions[0].target;
    expect(canReroll(p, 0)).toBe(false);
    expect(canReroll(p, 1)).toBe(true);
    expect(canReroll(p, 9)).toBe(false);
  });
});

describe('jogador automático dentro do jogo', () => {
  it('dá o mesmo resultado duas vezes com a mesma semente', () => {
    const run = () => {
      const p = referenceProfile(3), s = STAGES[2], w = createWorld({ stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(p), seed: 99 });
      const bot = makeBot(p, { ...HUMAN, seed: 5 });
      for (let i = 0; i < 60 * 20 && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
      return fingerprint(w);
    };
    expect(run()).toBe(run());
  });
});

void newLife;
