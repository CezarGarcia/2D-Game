/** Afinidades elementais (docs/gdd/11): a Roda, a conta do dano, a Casca, os afixos de elemento e a leitura da fase. */
import { describe, expect, it } from 'vitest';
import { AFFINITY, BEATS, affinityMult, affinityOf, affinitySign, kindElement, stageShells, wheelAffinity } from '../src/data/affinity';
import { BOSSES, MONSTERS } from '../src/data/bestiary';
import type { EnemyKind } from '../src/data/balance';
import { ELEMENT_ORDER, SPELLS, SPELL_ORDER, type ElementId } from '../src/data/content';
import { BEATEN_BY, PACT_COST, affixText, makeItem, rollAffix } from '../src/data/items';
import { makeRng } from '../src/data/rng';
import { STAGES, STAGE_BY_ID } from '../src/data/stages';
import { adaptedLoadout, prepFor, readStage } from '../src/meta/afinidade';
import { currentTrecho, dreamContext, enterNode, startNight } from '../src/meta/dream';
import { migrate, newProfile, type Profile } from '../src/meta/profile';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { damageEnemy, hurtPlayer } from '../src/sim/core';
import { applyElement } from '../src/sim/status';
import { createWorld, spawnEnemy, step, type Enemy, type Input, type World } from '../src/sim/world';
import { TICK } from '../src/data/balance';

const idle: Input = { mx: 0, my: 0, aimX: 700, aimY: 400, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false };
const LEGACY: EnemyKind[] = ['sauva', 'queixada', 'cuspidor', 'tronco', 'urutau', 'cogumelo', 'caipora', 'curupira', 'piranha', 'sapo', 'arraia', 'caramujo', 'jacare', 'boto', 'iara'];
const ALL: EnemyKind[] = [...LEGACY, ...(Object.keys(MONSTERS) as EnemyKind[]), ...(Object.keys(BOSSES) as EnemyKind[])];

/** Uma sala sem ondas, com o herói sem sorte no crítico e sem nada que aplique elemento por conta própria. */
function arena(o: { shells?: 'boss' | 'all'; rooms?: number; level?: number; faro?: number; teimosia?: number } = {}): World {
  const p = referenceProfile(o.level ?? 30); p.companion = null; p.talents = {};
  const stats = deriveStats(p);
  /* o herói de referência tem uma gema de Fogo na arma: fora, para a conta ser só a da afinidade */
  stats.critChance = 0; stats.spellCrit = 0; stats.weaponGem = null; for (const el of ELEMENT_ORDER) stats.elemDamage[el] = 0;
  stats.faro = o.faro ?? 0; stats.teimosia = o.teimosia ?? 0;
  const w = createWorld({ stageId: '4-3', level: o.level ?? 30, rooms: Array.from({ length: o.rooms ?? 1 }, () => ({ type: 'combat' as const, waves: [], bg: 0 })), stats, seed: 11, shells: o.shells, ranked: true });
  w.pet = null;
  return w;
}
function foe(w: World, kind: EnemyKind, elite = false): Enemy {
  const e = spawnEnemy(w, { kind, x: 700, y: 400, elite });
  e.state = 'chase'; e.stateT = 1; e.cd = 99;
  return e;
}
/** Dano que um golpe de 100 causa, num monstro novo de cada vez. */
const hit = (w: World, kind: EnemyKind, el: ElementId | null, source: Parameters<typeof damageEnemy>[3] = 'spell'): number => damageEnemy(w, foe(w, kind), 100, source, 0, false, el);

describe('a Roda dos elementos', () => {
  it('cada elemento vence um e perde para um; Sombra e Encanto se desfazem um ao outro', () => {
    expect(BEATS).toMatchObject({ agua: ['fogo'], fogo: ['natureza'], natureza: ['terra'], terra: ['tempestade'], tempestade: ['agua'], sombra: ['encanto'], encanto: ['sombra'] });
    for (const el of ELEMENT_ORDER) {
      const a = wheelAffinity(el);
      expect(a.weak).toHaveLength(1);
      expect(BEATS[a.weak[0]]).toContain(el);
      expect(a.resist).toContain(el);
      expect(a.resist.some((x) => a.weak.includes(x))).toBe(false);
      expect(BEATEN_BY[el]).toBe(a.weak[0]);
    }
    expect(wheelAffinity('fogo')).toEqual({ weak: ['agua'], resist: ['fogo', 'natureza'] });
    expect(wheelAffinity('sombra')).toEqual({ weak: ['encanto'], resist: ['sombra'] });
    expect(wheelAffinity(null)).toEqual({ weak: [], resist: [] });
  });

  it('todo monstro e chefe tem afinidade coerente; os dos capítulos 1 e 2 só têm fraqueza; os sem elemento, nada', () => {
    for (const k of ALL) {
      const a = affinityOf(k);
      expect(a.weak.some((x) => a.resist.includes(x)), k).toBe(false);
      for (const el of ELEMENT_ORDER) expect(affinitySign(k, el)).toBe(a.weak.includes(el) ? 1 : a.resist.includes(el) ? -1 : 0);
    }
    for (const k of LEGACY) { expect(affinityOf(k).resist, k).toEqual([]); expect(affinityOf(k).weak.length, k).toBeGreaterThan(0); }
    for (const k of ['vulto', 'vazio', 'esquecido', 'ecos', 'esquecimento'] as EnemyKind[]) expect(affinityOf(k)).toEqual({ weak: [], resist: [] });
    /* do capítulo 3 em diante, todo monstro com elemento tem pelo menos uma fraqueza e resiste ao próprio elemento */
    for (const k of [...Object.keys(MONSTERS), ...Object.keys(BOSSES)] as EnemyKind[]) {
      const el = kindElement(k);
      if (!el) continue;
      expect(affinityOf(k).weak.length, k).toBeGreaterThan(0);
      expect(affinityOf(k).resist, k).toContain(el);
    }
    /* exceções escritas à mão */
    expect(affinityOf('formiga')).toEqual({ weak: ['agua'], resist: ['natureza', 'fogo'] });
    expect(affinityOf('morcego').weak).toEqual(['natureza', 'tempestade', 'fogo']);
    expect(affinityOf('morcego').resist).toEqual(['terra']); // a fraqueza tira Tempestade das resistências
    expect(affinityOf('caramujo').weak).toEqual(['tempestade', 'terra']);
  });

  it('fraqueza rende mais do que resistência custa; Faro e Teimosia mexem, mas nada vira imunidade nem zera o castigo', () => {
    expect(affinityMult(1)).toBe(AFFINITY.weak);
    expect(affinityMult(-1)).toBe(AFFINITY.resist);
    expect(affinityMult(0, 9, 9)).toBe(1);
    expect(AFFINITY.weak - 1).toBeGreaterThan(1 - AFFINITY.resist);
    expect(affinityMult(1, 0.2)).toBeCloseTo(1 + 0.5 * 1.2);
    expect(affinityMult(-1, 0, 0.2)).toBeCloseTo(1 - 0.35 * 0.8);
    expect(affinityMult(-1, 0, 99)).toBeCloseTo(1 - 0.35 * (1 - AFFINITY.maxTeimosia));
    expect(affinityMult(-1, 0, 99)).toBeLessThan(1);
    expect(affinityMult(-1)).toBeGreaterThan(0.5);
  });
});

describe('a conta do dano', () => {
  it('o elemento certo causa 50% a mais, o errado 35% a menos, e golpe sem elemento é neutro', () => {
    const w = arena(), neutral = hit(w, 'formiga', null, 'melee');
    expect(hit(w, 'formiga', 'agua') / neutral).toBeCloseTo(AFFINITY.weak, 1);
    expect(hit(w, 'formiga', 'fogo') / neutral).toBeCloseTo(AFFINITY.resist, 1);
    expect(hit(w, 'formiga', 'natureza') / neutral).toBeCloseTo(AFFINITY.resist, 1);
    expect(hit(w, 'formiga', 'sombra') / neutral).toBeCloseTo(1, 1);
    /* capítulo 1: nada resiste, e o Fogo pega */
    expect(hit(w, 'sauva', 'natureza') / hit(w, 'sauva', null, 'melee')).toBeCloseTo(1, 1);
    expect(hit(w, 'sauva', 'fogo') / hit(w, 'sauva', null, 'melee')).toBeCloseTo(AFFINITY.weak, 1);
  });

  it('o golpe avisa a tela: +1 na fraqueza, −1 na resistência', () => {
    const w = arena();
    const aff = (el: ElementId | null) => { w.events.length = 0; hit(w, 'formiga', el); return w.events.find((e) => e.type === 'hit')!.aff; };
    expect([aff('agua'), aff('fogo'), aff(null)]).toEqual([1, -1, 0]);
  });

  it('Faro e Teimosia entram na conta da sala', () => {
    const plain = arena(), sharp = arena({ faro: 0.2, teimosia: 0.4 });
    expect(hit(sharp, 'formiga', 'agua') / hit(plain, 'formiga', 'agua')).toBeCloseTo(1.6 / 1.5, 1);
    expect(hit(sharp, 'formiga', 'fogo') / hit(plain, 'formiga', 'fogo')).toBeCloseTo((1 - 0.35 * 0.6) / 0.65, 1);
  });

  it('veneno conta como Natureza, o companheiro bate com o elemento dele e a reação vale pelo melhor dos dois', () => {
    const w = arena(), base = hit(w, 'formiga', null, 'melee');
    expect(hit(w, 'formiga', null, 'poison') / base).toBeCloseTo(AFFINITY.resist, 1);
    const cal = hit(w, 'calango', null, 'melee');
    expect(hit(w, 'calango', null, 'poison') / cal).toBeCloseTo(AFFINITY.weak, 1); // o calango é fraco a Natureza
    w.stats.companion = 'botinho'; // Água
    expect(hit(w, 'formiga', null, 'pet') / base).toBeCloseTo(AFFINITY.weak, 1);
    w.stats.companion = null;
    /* Fogo em quem está Molhado é Vapor: na formiga, a Água é fraqueza, então a reação bate cheia apesar do Fogo */
    const e = foe(w, 'formiga'); applyElement(w, e, 'agua');
    w.events.length = 0;
    expect(applyElement(w, e, 'fogo')).not.toBeNull();
    expect(w.reacting).toBeNull();
    const react = w.events.filter((ev) => ev.type === 'hit' && ev.kind === 'reaction');
    if (react.length) expect(react[0].aff).toBe(1);
  });

  it('resistência negativa faz o herói apanhar mais, até o piso de −50%', () => {
    const dmg = (res: number) => { const w = arena(); w.stats.res.fogo = res; const src = foe(w, 'formiga'); const hp = w.player.hp; hurtPlayer(w, 100, src.x, src.y, 0, { src }); return hp - w.player.hp; };
    expect(dmg(-0.5) / dmg(0)).toBeCloseTo(1.5, 1);
    expect(dmg(0.5) / dmg(0)).toBeCloseTo(0.5, 1);
  });
});

describe('Casca elemental', () => {
  it('só elite e chefe têm, e só onde a fase manda', () => {
    expect(foe(arena(), 'formiga', true).shellMax).toBe(0);
    const w = arena({ shells: 'all' });
    expect(foe(w, 'formiga').shellMax).toBe(0);
    const e = foe(w, 'formiga', true);
    expect(e.shellMax).toBe(Math.round(e.maxHp * AFFINITY.shell.elite));
    expect([e.shell, e.shellEl]).toEqual([e.shellMax, 'fogo']);
    const boss = foe(w, 'boitata', true);
    expect(boss.shellMax).toBe(Math.round(boss.maxHp * AFFINITY.shell.boss));
    /* "boss": só na última sala */
    const two = arena({ shells: 'boss', rooms: 2 });
    expect(foe(two, 'formiga', true).shellMax).toBe(0);
    two.room = 1;
    expect(foe(two, 'formiga', true).shellMax).toBeGreaterThan(0);
  });

  it('quem não tem elemento ganha uma Casca sorteada, com a fraqueza que a Roda dá a ela', () => {
    const w = arena({ shells: 'all' }), seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const e = foe(w, 'esquecido', true);
      expect(e.shellEl).not.toBeNull();
      expect(e.weakEl).toBe(wheelAffinity(e.shellEl).weak[0]);
      expect(affinitySign('esquecido', e.weakEl!, e.weakEl)).toBe(1);
      seen.add(e.shellEl!);
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('segura 30% do dano e se gasta três vezes mais rápido com o elemento certo', () => {
    const w = arena({ shells: 'all' }), bare = arena();
    const a = foe(w, 'formiga', true), b = foe(bare, 'formiga', true);
    const got = damageEnemy(w, a, 100, 'melee', 0), free = damageEnemy(bare, b, 100, 'melee', 0);
    expect(got / free).toBeCloseTo(1 - AFFINITY.shell.guard, 1);
    expect(a.shellMax - a.shell).toBeCloseTo(free, -1);
    /* neutro tira o dano do golpe; a fraqueza tira três vezes o dano já aumentado; quem resiste tira a metade */
    const drain = (el: ElementId | null) => { const e = foe(w, 'formiga', true); damageEnemy(w, e, 100, el ? 'spell' : 'melee', 0, false, el); return e.shellMax - e.shell; };
    const n = drain(null);
    expect(drain('agua') / n).toBeCloseTo(AFFINITY.weak * AFFINITY.shell.weak, 0);
    expect(drain('fogo') / n).toBeCloseTo(AFFINITY.resist * AFFINITY.shell.resist, 1);
  });

  it('quebrada, o monstro fica Exposto e atordoado; depois a Casca volta', () => {
    const w = arena({ shells: 'all' }), e = foe(w, 'formiga', true);
    w.events.length = 0;
    for (let i = 0; i < 400 && e.shell > 0; i++) damageEnemy(w, e, 60, 'spell', 0, false, 'agua');
    expect(e.shell).toBe(0);
    expect(e.exposeT).toBeCloseTo(AFFINITY.exposed.seconds);
    expect(e.stunT).toBeGreaterThan(0);
    expect(w.events.some((ev) => ev.type === 'shellBreak' && ev.id === e.id)).toBe(true);
    /* Exposto: 50% a mais */
    const plain = arena(), ref = foe(plain, 'formiga', true);
    expect(damageEnemy(w, e, 100, 'melee', 0) / damageEnemy(plain, ref, 100, 'melee', 0)).toBeCloseTo(1 + AFFINITY.exposed.bonus, 1);
    /* o chefe não fica atordoado, só Exposto */
    const boss = foe(w, 'boitata', true);
    for (let i = 0; i < 2000 && boss.shell > 0; i++) damageEnemy(w, boss, 400, 'spell', 0, false, 'agua');
    expect(boss.exposeT).toBeGreaterThan(0);
    expect(boss.stunT).toBe(0);
    /* e a Casca volta */
    e.hp = e.maxHp; e.stunT = 0;
    for (let i = 0; i < 60 * (AFFINITY.exposed.regrow + 1); i++) step(w, { ...idle, mx: -1 }, TICK);
    expect(e.exposeT).toBe(0);
    expect(e.shell).toBe(e.shellMax);
  });

  it('a regra de cada conteúdo: campanha, Presságios, Torre e Sonho', () => {
    const st = (id: string) => STAGE_BY_ID.get(id)!;
    expect(stageShells(st('1-12'))).toBeUndefined();
    expect(stageShells(st('2-11'))).toBeUndefined();
    expect(stageShells(st('3-4'))).toBeUndefined();
    expect(stageShells(st('3-11'))).toBe('boss');
    expect(stageShells(st('8-12'))).toBe('boss');
    expect(stageShells(st('1-3'), 4)).toBe('all');
    expect(stageShells({ id: 'torre-10', chapter: 1, number: 0, index: -1 })).toBeUndefined();
    expect(stageShells({ id: 'torre-30', chapter: 3, number: 0, index: -1 })).toBe('boss');
    expect(stageShells({ id: 'torre-80', chapter: 6, number: 0, index: -1 })).toBe('all');
    expect(stageShells({ id: 'exp-1', chapter: 3, number: 0, index: -1 })).toBeUndefined();
    /* Sonho: no primeiro trecho só o chefe; do segundo em diante, toda elite */
    const p = newProfile(5); p.level = 30;
    for (const s of STAGES) if (s.chapter <= 3) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 60, pity: 0, clears: 1 };
    p.supremos = ['natureza', 'agua', 'tempestade']; p.dream.nights = 1;
    const run = startNight(p, { weapon: 'facao', spells: ['dardo', null, null], companion: null, supremo: null }, 77)!;
    enterNode(p, 0);
    expect(dreamContext(run).shells).toBeUndefined();
    const boss = currentTrecho(run).nodes.find((n) => n.kind === 'chefe')!;
    run.at = boss.id;
    expect(dreamContext(run).shells).toBe('all');
    run.trecho = 1; run.at = 0;
    expect(dreamContext(run).shells).toBe('all');
  });
});

describe('itens: os sete elementos, Faro, Teimosia e o item com preço', () => {
  const wearing = (affixes: Parameters<typeof affixText>[0][]): Profile => { const p = referenceProfile(30); p.equipped.cabeca!.affixes = affixes; return p; };

  it('resistência e dano valem para o elemento do afixo; item antigo, sem elemento, é de Natureza', () => {
    const base = deriveStats(referenceProfile(30));
    const s = deriveStats(wearing([{ k: 'resNatureza', v: 12, el: 'fogo' }, { k: 'danoNatureza', v: 10, el: 'agua' }, { k: 'resNatureza', v: 8 }, { k: 'faro', v: 15 }, { k: 'teimosia', v: 20 }]));
    expect(s.res.fogo - base.res.fogo).toBeCloseTo(0.12);
    expect(s.res.natureza - base.res.natureza).toBeCloseTo(0.08);
    expect(s.res.agua).toBeCloseTo(base.res.agua);
    expect(s.elemDamage.agua - base.elemDamage.agua).toBeCloseTo(0.1);
    expect([s.faro, s.teimosia]).toEqual([0.15, 0.2]);
    expect([base.faro, base.teimosia]).toEqual([0, 0]);
    expect(affixText({ k: 'resNatureza', v: 12, el: 'fogo' })).toBe('+12% de resistência a Fogo');
    expect(affixText({ k: 'danoNatureza', v: 9 })).toBe('+9% de dano de Natureza');
  });

  it('o item com preço dá dano de um elemento e cobra resistência ao que o vence; a resistência vai de −50% a 75%', () => {
    const s = deriveStats(wearing([{ k: 'pacto', v: 20, el: 'fogo' }]));
    expect(s.elemDamage.fogo).toBeGreaterThanOrEqual(0.2);
    expect(s.res.agua).toBeCloseTo(-Math.round(20 * PACT_COST) / 100);
    expect(affixText({ k: 'pacto', v: 20, el: 'fogo' })).toBe('+20% de dano de Fogo, −12% de resistência a Água');
    const low = deriveStats(wearing([{ k: 'pacto', v: 200, el: 'fogo' }])), high = deriveStats(wearing([{ k: 'resNatureza', v: 300, el: 'terra' }]));
    expect(low.res.agua).toBe(AFFINITY.minRes);
    expect(high.res.terra).toBe(AFFINITY.maxRes);
  });

  it('no sorteio, a resistência puxa para o elemento do capítulo seguinte e o dano sai entre os elementos já ganhos', () => {
    const r = makeRng(99), res: Partial<Record<ElementId, number>> = {}, dmg = new Set<ElementId>();
    for (let i = 0; i < 6000; i++) {
      const a = rollAffix(r, 26, [], 3); // capítulo 3: o seguinte é Fogo; o jogador tem Natureza, Água e Tempestade
      if (a.k === 'resNatureza') res[a.el!] = (res[a.el!] ?? 0) + 1;
      else if (a.k === 'danoNatureza' || a.k === 'pacto') dmg.add(a.el!);
      else expect(a.el).toBeUndefined();
    }
    const total = Object.values(res).reduce((n, v) => n + v!, 0);
    expect(res.fogo! / total).toBeGreaterThan(0.5);
    expect([...dmg].sort()).toEqual(['agua', 'natureza', 'tempestade']);
    /* os itens da fase carregam o capítulo dela */
    const item = makeItem(1, makeRng(5), 40, 5, 'anel', 1);
    for (const a of item.affixes) if (a.k === 'danoNatureza' || a.k === 'pacto') expect(a.el).toBe('natureza');
  });

  it('um save antigo, com afixos sem elemento, continua valendo', () => {
    const p = wearing([{ k: 'resNatureza', v: 10 }, { k: 'danoNatureza', v: 10 }]);
    const m = migrate(JSON.parse(JSON.stringify(p)) as Profile), base = deriveStats(referenceProfile(30)), s = deriveStats(m);
    expect(s.res.natureza - base.res.natureza).toBeCloseTo(0.1);
    expect(s.elemDamage.natureza - base.elemDamage.natureza).toBeCloseTo(0.1);
  });
});

describe('a fase avisa: Ameaça e Preparo', () => {
  const stage = STAGE_BY_ID.get('4-3')!;
  const veteran = (): Profile => { const p = referenceProfile(40); for (const k of stage.kinds) p.life.kills[k] = 3; return p; };

  it('as fraquezas só aparecem depois do primeiro encontro com o monstro', () => {
    const fresh = readStage(referenceProfile(40), stage);
    expect(fresh.threat).toEqual(['fogo']); // o que eles usam dá para ver de longe
    expect([fresh.weak, fresh.resist]).toEqual([[], []]);
    expect(fresh.unknown).toBe(fresh.total);
    expect(prepFor(referenceProfile(40), stage, ['dardo', 'sementes', 'cipo']).seal).toBe('cinza');
    const p = veteran(), known = readStage(p, stage);
    expect(known.unknown).toBe(0);
    expect(known.weak[0]).toBe('agua');
    expect(known.resist).toEqual(expect.arrayContaining(['fogo', 'natureza']));
  });

  it('o selo: vermelho com o elemento que a fase resiste, verde com o que ela teme', () => {
    const p = veteran();
    const nat = prepFor(p, stage, ['dardo', 'sementes', 'cipo']), agua = prepFor(p, stage, ['jato', 'onda', 'bolha']), misto = prepFor(p, stage, ['jato', 'sementes', null]);
    expect(nat.seal).toBe('vermelho');
    expect(nat.reason).toContain('Natureza');
    expect(agua.seal).toBe('verde');
    expect(agua.reason).toContain('Água');
    expect(misto.seal).toBe('amarelo');
    expect(agua.score).toBeGreaterThan(misto.score);
    expect(misto.score).toBeGreaterThan(nat.score);
    expect(prepFor(p, stage, [null, null, null]).seal).toBe('amarelo');
  });

  it('o jogador automático troca para o elemento que a fase teme, e só quando compensa', () => {
    const known = SPELL_ORDER.filter((id) => SPELLS[id].unlock <= 40);
    const smart = adaptedLoadout(known, stage.kinds, ['dardo', 'sementes', 'cipo']);
    expect(smart.map((s) => SPELLS[s!].element)).toEqual(['agua', 'agua', 'agua']);
    expect(smart.map((s) => SPELLS[s!].role)).toEqual(['Projétil', 'Área', 'Controle']);
    /* no capítulo 1 nada resiste a Natureza e o herói de nível baixo não tem Fogo: fica como está */
    const early = SPELL_ORDER.filter((id) => SPELLS[id].unlock <= 5);
    expect(adaptedLoadout(early, STAGE_BY_ID.get('1-5')!.kinds, ['dardo', 'sementes', 'cipo'])).toEqual(['dardo', 'sementes', 'cipo']);
    expect(adaptedLoadout(known, stage.kinds, ['dardo', null, null])).toEqual([smart[0], null, null]);
  });
});
