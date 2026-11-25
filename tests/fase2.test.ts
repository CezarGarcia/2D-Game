/** Etapa 4, fase 2 (docs/gdd/09 e 10): padrinhos, bênçãos novas, Despertar, Compadrio, sinergias e o sorteio do altar. */
import { describe, expect, it } from 'vitest';
import { UI_ICON_KEYS } from '../src/art/uiicons';
import { TICK } from '../src/data/balance';
import {
  ALTAR_PITY, AWAKENINGS, BLESSINGS, BLESSING_ORDER, COMPADRIOS, ELEMENT_ORDER, PATRONS, PATRON_STEPS, PATRON_TIERS, awakeningsFor, compadriosFor, patronCounts, patronTier,
  type BaseBlessingId, type BlessingId,
} from '../src/data/content';
import { STAGE_BY_ID } from '../src/data/stages';
import { addTalent } from '../src/meta/profile';
import { deriveStats, referenceProfile, type HeroStats } from '../src/meta/stats';
import { damageEnemy, hurtPlayer } from '../src/sim/core';
import { blessingPool, chooseBlessing, createWorld, rollBlessings, spawnEnemy, step, type Enemy, type Input, type World } from '../src/sim/world';

const idle: Input = { mx: 0, my: 0, aimX: 700, aimY: 400, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false };
const times = (id: BlessingId, n: number): BlessingId[] => Array.from({ length: n }, () => id);
const maxed = (id: BaseBlessingId): BlessingId[] => times(id, BLESSINGS[id].max);
/** Herói sem companheiro e sem talentos, para nada já vir ligado. */
const hero = (level = 30) => { const p = referenceProfile(level); p.companion = null; p.talents = {}; return p; };

/** Uma sala em luta, com as bênçãos dadas e sem sorte no crítico (para os números fecharem). */
function world(blessings: BlessingId[] = [], seed = 7, over: (s: HeroStats) => void = () => undefined, p = hero()): World {
  const s = STAGE_BY_ID.get('1-3')!, stats = deriveStats(p, blessings);
  stats.critChance = 0; stats.spellCrit = 0;
  over(stats);
  const w = createWorld({ stageId: s.id, level: 30, rooms: s.rooms, stats, seed });
  w.blessings = blessings.slice();
  w.pet = null;
  return w;
}
function foe(w: World, kind: Enemy['kind'] = 'tronco', x = 600, y = 400): Enemy {
  const e = spawnEnemy(w, { kind, x, y });
  e.state = 'chase'; e.stateT = 1;
  return e;
}
const json = (s: HeroStats) => JSON.stringify(s);

describe('bênçãos e padrinhos', () => {
  it('64 bênçãos comuns: 8 de cada padrinho e 8 neutras, todas com ícone que existe', () => {
    expect(BLESSING_ORDER).toHaveLength(64);
    expect(new Set(BLESSING_ORDER).size).toBe(64);
    for (const el of ELEMENT_ORDER) expect(BLESSING_ORDER.filter((b) => BLESSINGS[b].patron === el), PATRONS[el].name).toHaveLength(8);
    expect(BLESSING_ORDER.filter((b) => BLESSINGS[b].patron === null)).toHaveLength(8);
    for (const id of Object.keys(BLESSINGS) as BlessingId[]) {
      const b = BLESSINGS[id];
      expect(UI_ICON_KEYS as readonly string[], id).toContain(b.icon);
      expect(b.name.length, id).toBeLessThanOrEqual(22);
      expect(b.desc.length, id).toBeLessThanOrEqual(110);
      expect(b.kind === 'normal' ? b.tier <= 3 : b.tier === 4, id).toBe(true);
    }
  });

  it('toda bênção comum muda alguma coisa no herói', () => {
    const p = hero();
    p.companions.capivara = { level: 1 }; p.companion = 'capivara';
    const base = json(deriveStats(p));
    /* estas agem na hora ou no fim da fase, não nos números do herói */
    const elsewhere: BlessingId[] = ['cura', 'ouro', 'sabedoria', 'fartura'];
    for (const id of BLESSING_ORDER) {
      if (elsewhere.includes(id)) continue;
      expect(json(deriveStats(p, [id])), id).not.toBe(base);
    }
  });

  it('Despertar: 20 bênçãos com duas formas cada, do mesmo padrinho, e cada forma muda o herói', () => {
    const bases = Object.keys(AWAKENINGS) as BaseBlessingId[], p = referenceProfile(30);
    expect(bases).toHaveLength(20);
    for (const el of ELEMENT_ORDER) expect(bases.filter((b) => BLESSINGS[b].patron === el).length, PATRONS[el].name).toBeGreaterThanOrEqual(2);
    for (const base of bases) {
      expect(BLESSINGS[base].max, base).toBeGreaterThan(1);
      const full = maxed(base), before = json(deriveStats(p, full));
      for (const form of AWAKENINGS[base]!) {
        const d = BLESSINGS[form];
        expect([d.kind, d.awakens, d.patron, d.max], form).toEqual(['desperta', base, BLESSINGS[base].patron, 1]);
        expect(json(deriveStats(p, [...full, form])), form).not.toBe(before);
      }
    }
  });

  it('Compadrio: 8 pares, cada padrinho em pelo menos dois, e cada um muda o herói', () => {
    const p = referenceProfile(30), base = json(deriveStats(p));
    expect(COMPADRIOS).toHaveLength(8);
    for (const el of ELEMENT_ORDER) expect(COMPADRIOS.filter((c) => c.a === el || c.b === el).length, PATRONS[el].name).toBeGreaterThanOrEqual(2);
    expect(new Set(COMPADRIOS.map((c) => [c.a, c.b].sort().join('+'))).size).toBe(8);
    for (const c of COMPADRIOS) {
      expect(c.a).not.toBe(c.b);
      expect(BLESSINGS[c.id].pair).toEqual([c.a, c.b]);
      expect(json(deriveStats(p, [c.id])), c.id).not.toBe(base);
    }
  });
});

describe('sinergia de padrinho', () => {
  it('conta cada escolha, o Compadrio vale para os dois e o companheiro do elemento soma um', () => {
    const n = patronCounts(['furia', 'furia', 'chama', 'vento', 'banhoMaria', 'ouro']);
    expect([n.fogo, n.tempestade, n.agua, n.terra]).toEqual([4, 1, 1, 0]);
    expect(patronCounts(['furia', 'furia'], 'fogo').fogo).toBe(3);
    expect(PATRON_STEPS).toEqual([3, 5, 7]);
    expect([0, 2, 3, 4, 5, 6, 7, 12].map(patronTier)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    for (const el of ELEMENT_ORDER) expect(PATRON_TIERS[el]).toHaveLength(3);
  });

  it('cada faixa de cada padrinho muda o herói, e a de baixo continua valendo', () => {
    const p = hero();
    for (const el of ELEMENT_ORDER) {
      /* bênçãos do padrinho que não mexem em mais nada que a sinergia mexe: usa a mais repetível */
      const pick = BLESSING_ORDER.filter((b) => BLESSINGS[b].patron === el).sort((a, b) => BLESSINGS[b].max - BLESSINGS[a].max);
      const list = (n: number): BlessingId[] => { const out: BlessingId[] = []; for (const b of pick) for (let i = 0; i < BLESSINGS[b].max && out.length < n; i++) out.push(b); return out; };
      let last = '';
      for (const [k, need] of PATRON_STEPS.entries()) {
        const below = deriveStats(p, list(need - 1)), at = deriveStats(p, list(need));
        expect(below.patronTiers[el], `${el} ${need - 1}`).toBe(k);
        expect(at.patronTiers[el], `${el} ${need}`).toBe(k + 1);
        expect(json(at), `${el} ${need}`).not.toBe(last);
        last = json(at);
      }
    }
    const s = deriveStats(p, times('vento', 3));
    expect(s.dodgeCharges).toBe(deriveStats(p, times('vento', 2)).dodgeCharges + 1);
    expect(deriveStats(p, [...times('pressa', 4), ...times('vento', 3)]).bless.dodgeHaste).toBeCloseTo(0.4);
  });
});

describe('sorteio do altar', () => {
  it('nunca oferece o que está no máximo, nem repete na mesma mesa', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const w = world(['peconha', ...maxed('furia'), 'furiaCega', ...maxed('vento'), 'vendaval'], seed);
      const picks = rollBlessings(w);
      expect(picks).toHaveLength(3);
      expect(new Set(picks).size).toBe(3);
      for (const id of picks) expect(['peconha', 'furia', 'vento', 'furiaCega', 'furiaDoBoitata', 'vendaval', 'peDeMoleque'], `semente ${seed}`).not.toContain(id);
    }
  });

  it('altar de um padrinho só dá bênçãos dele', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const picks = rollBlessings(world([], seed), { patron: 'sombra' });
      expect(picks).toHaveLength(3);
      for (const id of picks) expect(BLESSINGS[id].patron).toBe('sombra');
    }
    expect(blessingPool(world(), 'agua').every((b) => BLESSINGS[b].patron === 'agua')).toBe(true);
  });

  it('Despertar: só com a bênção no máximo; as duas formas vêm juntas e a escolhida fecha a outra', () => {
    expect(awakeningsFor(times('furia', 4))).toEqual([]);
    expect(awakeningsFor(maxed('furia'))).toEqual([['furiaDoBoitata', 'furiaCega']]);
    for (let seed = 1; seed <= 20; seed++) expect(rollBlessings(world(times('furia', 4), seed)).some((id) => BLESSINGS[id].kind === 'desperta')).toBe(false);
    const w = world(maxed('furia'), 3);
    w.phase = 'altar'; w.altar = rollBlessings(w);
    expect(w.altar.slice(0, 2)).toEqual(['furiaDoBoitata', 'furiaCega']);
    expect(w.altar).toHaveLength(3);
    expect(BLESSINGS[w.altar[2]].kind).toBe('normal');
    const p = hero();
    chooseBlessing(w, 1, (b) => deriveStats(p, b));
    expect(w.blessings.filter((b) => b === 'furia')).toHaveLength(5);
    expect(w.blessings).toContain('furiaCega');
    expect(awakeningsFor(w.blessings)).toEqual([]);
    for (let seed = 1; seed <= 20; seed++) { w.rng = seed; expect(rollBlessings(w).some((id) => BLESSINGS[id].kind === 'desperta')).toBe(false); }
    /* no altar de outro padrinho, o Despertar do Boitatá não aparece */
    expect(rollBlessings(world(maxed('furia'), 5), { patron: 'agua' }).some((id) => BLESSINGS[id].kind === 'desperta')).toBe(false);
  });

  it('Compadrio: só com duas bênçãos de cada padrinho do par, em cerca de metade dos altares, e uma vez só', () => {
    expect(compadriosFor(['vento', 'vento', 'olho'])).toEqual([]);
    expect(compadriosFor(['vento', 'vento', 'olho', 'olho'])).toEqual(['luaVentosa']);
    expect(compadriosFor(['vento', 'vento', 'olho', 'olho', 'luaVentosa'])).toEqual([]);
    let seen = 0;
    for (let seed = 1; seed <= 200; seed++) {
      expect(rollBlessings(world(['vento', 'vento', 'olho'], seed)).some((id) => BLESSINGS[id].kind === 'compadrio')).toBe(false);
      const picks = rollBlessings(world(['vento', 'vento', 'olho', 'olho'], seed));
      expect(picks).toHaveLength(3);
      if (picks[0] === 'luaVentosa') seen++;
      expect(picks.slice(1).every((id) => BLESSINGS[id].kind === 'normal')).toBe(true);
    }
    expect(seen).toBeGreaterThan(70);
    expect(seen).toBeLessThan(130);
  });

  it('azar com limite: depois de dois altares só com comuns, o terceiro traz uma rara ou melhor', () => {
    expect(ALTAR_PITY).toBe(2);
    let dryRuns = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const w = world([], seed);
      const a = rollBlessings(w), common = (list: BlessingId[]) => list.every((id) => BLESSINGS[id].tier === 1);
      expect(w.altarDry).toBe(common(a) ? 1 : 0);
      const b = rollBlessings(w);
      if (!common(a) || !common(b)) continue;
      expect(w.altarDry).toBe(2);
      dryRuns++;
      const c = rollBlessings(w);
      expect(common(c), `semente ${seed}`).toBe(false);
      expect(new Set(c).size).toBe(3);
      expect(w.altarDry).toBe(0);
    }
    expect(dryRuns).toBeGreaterThan(3);
  });

  it('não oferece a bênção que um talento ou conjunto já liga', () => {
    const p = hero();
    p.talentPoints = 60;
    for (const t of ['raizForca', 'maoPesada', 'maoPesada', 'maoPesada', 'sedeDeBriga']) addTalent(p, t);
    expect(deriveStats(p).talents.sedeDeBriga).toBe(true);
    expect(blessingPool(world([], 1, undefined, p))).not.toContain('sedeDeSangue');
    expect(blessingPool(world())).toContain('sedeDeSangue');
  });
});

describe('efeitos novos no combate', () => {
  it('Fúria do Boitatá: todo golpe de arma queima; sem ela, não', () => {
    const w = world([...maxed('furia'), 'furiaDoBoitata']), e = foe(w);
    damageEnemy(w, e, 10, 'melee', 0);
    expect(e.burnT).toBeGreaterThan(0);
    const w2 = world(maxed('furia')), e2 = foe(w2);
    damageEnemy(w2, e2, 10, 'melee', 0);
    expect(e2.burnT).toBe(0);
    /* feitiço não aciona o efeito de golpe de arma */
    const e3 = foe(w);
    damageEnemy(w, e3, 10, 'spell', 0);
    expect(e3.burnT).toBe(0);
  });

  it('os "toques" de elemento acertam na proporção da chance', () => {
    let wet = 0;
    for (let seed = 1; seed <= 300; seed++) { const w = world(['aguaBenta'], seed), e = foe(w); damageEnemy(w, e, 10, 'melee', 0); if (e.wetT > 0) wet++; }
    expect(wet).toBeGreaterThan(35);
    expect(wet).toBeLessThan(90);
  });

  it('Cipoal prende; Cipoal Fechado prende por mais tempo e envenena; chefão não fica preso', () => {
    const w = world(['cipoal'], 1, (s) => { s.bless.rootChance = 1; }), e = foe(w);
    damageEnemy(w, e, 10, 'melee', 0);
    expect(e.rootT).toBe(1);
    expect(e.poisonT).toBe(0);
    const w2 = world([...maxed('cipoal'), 'cipoalFechado'], 1, (s) => { s.bless.rootChance = 1; }), e2 = foe(w2), boss = foe(w2, 'caipora');
    damageEnemy(w2, e2, 10, 'melee', 0); damageEnemy(w2, boss, 10, 'melee', 0);
    expect(e2.rootT).toBe(2);
    expect(e2.poisonT).toBeGreaterThan(0);
    expect(boss.rootT).toBe(0);
  });

  it('bônus de dano por estado do inimigo: Faro, Lenha Seca, Mata Viva e Reza Brava', () => {
    const ratio = (blessings: BlessingId[], prep: (e: Enemy) => void, source: 'melee' | 'spell' = 'spell') => {
      const hit = (b: BlessingId[]) => { const w = world(b), e = foe(w, 'sauva'); e.maxHp = e.hp = 1e7; prep(e); return damageEnemy(w, e, 1000, source, 0); };
      return hit(blessings) / hit([]);
    };
    expect(ratio(times('faro', 2), (e) => { e.hp = e.maxHp * 0.2; })).toBeCloseTo(1.5, 2);
    expect(ratio(times('faro', 2), () => undefined)).toBeCloseTo(1, 2);
    expect(ratio(times('lenha', 3), (e) => { e.burnT = 3; e.burnTick = 9; })).toBeCloseTo(1.45, 2);
    expect(ratio(['mataViva'], (e) => { e.slowT = 2; })).toBeCloseTo(1.25, 2);
    expect(ratio([...maxed('mandinga'), 'rezaBrava'], (e) => { e.wetT = 3; }) / ratio(maxed('mandinga'), (e) => { e.wetT = 3; })).toBeCloseTo(1.35, 2);
    expect(ratio([...maxed('mandinga'), 'rezaBrava'], (e) => { e.wetT = 3; }, 'melee')).toBeCloseTo(1, 2);
  });

  it('Canto da Iara: só o primeiro golpe encanta, e chefão não', () => {
    const w = world(['canto']), e = foe(w), boss = foe(w, 'caipora');
    damageEnemy(w, e, 5, 'melee', 0);
    expect(e.charmT).toBeGreaterThan(1);
    e.charmT = 0;
    damageEnemy(w, e, 5, 'melee', 0);
    expect(e.charmT).toBe(0);
    damageEnemy(w, boss, 5, 'melee', 0);
    expect(boss.charmT).toBe(0);
  });

  it('Pisada: um tremor a cada 8 golpes de arma', () => {
    const w = world(['pisada']), e = foe(w);
    e.maxHp = e.hp = 1e7;
    for (let i = 0; i < 7; i++) damageEnemy(w, e, 5, 'melee', 0);
    expect(w.zones.filter((z) => z.kind === 'pop')).toHaveLength(0);
    damageEnemy(w, e, 5, 'melee', 0);
    expect(w.zones.filter((z) => z.kind === 'pop')).toHaveLength(1);
  });

  it('esquiva: Sumiço deixa o próximo golpe crítico, Molecagem deixa um sósia, Vendaval um redemoinho', () => {
    const dodge = (blessings: BlessingId[]) => {
      const w = world(blessings), e = foe(w);
      e.maxHp = e.hp = 1e7;
      for (let i = 0; i < 80; i++) step(w, idle, TICK);
      step(w, { ...idle, mx: -1, dodgePressed: true }, TICK);
      return { w, e };
    };
    const a = dodge([...maxed('passo'), 'sumico']);
    expect(a.w.player.state).toBe('dodge');
    expect(a.w.player.critNext).toBe(true);
    expect(dodge([]).w.player.critNext).toBe(false);
    expect(dodge(['molecagem']).w.allies.filter((x) => x.kind === 'decoy')).toHaveLength(1);
    expect(dodge([...maxed('vento'), 'vendaval']).w.zones.some((z) => z.kind === 'redemoinho')).toBe(true);
    /* sinergia do Saci com 7: pressa depois da esquiva */
    const s = dodge([...maxed('pressa'), ...maxed('vento')]);
    expect(s.w.player.hasteT).toBeGreaterThan(2.5);
  });

  it('quem apanha: Abraço de Mandacaru prende, Sangue Frio corta o dano com pouca vida, Pé Fincado não é empurrado', () => {
    const w = world([...maxed('espinhos'), 'mandacaru']), e = foe(w, 'sauva');
    hurtPlayer(w, 50, e.x, e.y, 300, { src: e, melee: true });
    expect(e.rootT).toBeCloseTo(1.5);
    const taken = (blessings: BlessingId[], frac: number) => { const x = world(blessings); x.player.hp = Math.round(x.stats.maxHp * frac); const hp = x.player.hp; hurtPlayer(x, 200, 0, 0, 0, {}); return hp - x.player.hp; };
    const guard = [...maxed('vigor'), 'sangueFrio'] as BlessingId[];
    expect(taken(guard, 0.3) / taken(guard, 0.9)).toBeCloseTo(0.7, 1);
    const firm = world([...maxed('couro'), 'peFincado']);
    hurtPlayer(firm, 50, 0, 0, 400, {});
    expect([firm.player.kx, firm.player.ky, firm.player.state]).toEqual([0, 0, 'idle']);
    const loose = world(maxed('couro'));
    hurtPlayer(loose, 50, 0, 0, 400, {});
    expect(loose.player.state).toBe('hurt');
  });

  it('sinergia da Iara com 7: uma vez por sala, com pouca vida, recupera 35%', () => {
    const list = [...maxed('vigor'), ...maxed('mare')] as BlessingId[], w = world(list);
    expect(w.stats.patronTiers.agua).toBe(3);
    w.player.hp = Math.round(w.stats.maxHp * 0.31);
    hurtPlayer(w, 400, 0, 0, 0, {});
    expect(w.player.secondWind).toBe(true);
    expect(w.player.hp).toBeGreaterThan(w.stats.maxHp * 0.5);
    w.player.hp = Math.round(w.stats.maxHp * 0.31); w.player.hurtInv = 0; w.player.state = 'idle';
    hurtPlayer(w, 400, 0, 0, 0, {});
    expect(w.player.hp).toBeLessThan(w.stats.maxHp * 0.31);
  });

  it('abates: Cinzas Quentes devolve mana, Lua Ventosa acelera até 5 vezes e passa', () => {
    const w = world(['cinzas', 'luaVentosa']);
    w.player.mana = 0;
    for (let i = 0; i < 7; i++) { const e = foe(w, 'sauva'); e.burnT = 3; e.burnTick = 9; damageEnemy(w, e, 1e6, 'spell', 0); }
    expect(w.player.mana).toBeGreaterThanOrEqual(8 * 7 > w.stats.maxMana ? w.stats.maxMana : 56);
    expect(w.player.windStacks).toBe(5);
    w.enemies = [];
    for (let i = 0; i < 60 * 5; i++) step(w, idle, TICK);
    expect(w.player.windStacks).toBe(0);
  });

  it('ao escolher: Cantil dá uma poção na hora, Assobio uma esquiva, Água Funda cura a vida que acrescenta', () => {
    const p = hero(), w = world(maxed('passo')), restat = (b: BlessingId[]) => deriveStats(p, b);
    w.player.potions = 1;
    const give = (id: BlessingId) => { w.phase = 'altar'; w.altar = [id]; chooseBlessing(w, 0, restat); };
    give('cantil');
    expect([w.player.potions, w.stats.potions]).toEqual([2, 3]);
    const d = w.player.dodgeCharges;
    give('assobio');
    expect(w.player.dodgeCharges).toBe(d + 1);
    const hp = w.player.hp, max = w.stats.maxHp;
    for (let i = 0; i < 4; i++) give('vigor');
    give('aguaFunda');
    expect(w.stats.maxHp).toBeGreaterThan(max * 1.6);
    expect(w.player.hp - hp).toBeGreaterThanOrEqual(w.stats.maxHp - max - 2);
  });

  it('último golpe da sequência: Mão de Pedra racha e Magma deixa fogo no chão', () => {
    const w = world(['magma', ...maxed('pilao'), 'maoDePedra']), e = foe(w, 'tronco', w.player.x + 70, w.player.y);
    e.maxHp = e.hp = 1e7; e.state = 'exposed'; e.stateT = -99;
    for (let i = 0; i < 60 * 3 && !w.zones.some((z) => z.kind === 'fire'); i++) step(w, { ...idle, aimX: e.x, aimY: e.y, attackHeld: true }, TICK);
    expect(w.zones.some((z) => z.kind === 'fire' && !z.hostile)).toBe(true);
    expect(e.crackT).toBeGreaterThan(0);
    /* sem as bênçãos, nada disso */
    const w2 = world([]), e2 = foe(w2, 'tronco', w2.player.x + 70, w2.player.y);
    e2.maxHp = e2.hp = 1e7; e2.state = 'exposed'; e2.stateT = -99;
    for (let i = 0; i < 60 * 3; i++) step(w2, { ...idle, aimX: e2.x, aimY: e2.y, attackHeld: true }, TICK);
    expect(w2.zones.some((z) => z.kind === 'fire')).toBe(false);
    expect(e2.crackT).toBe(0);
  });

  it('Rastro Aceso: correr na luta deixa fogo; parado ou sem inimigo, não', () => {
    const w = world(['rastro']), e = foe(w, 'tronco', 1000, 600);
    e.maxHp = e.hp = 1e7; e.state = 'exposed'; e.stateT = -99;
    for (let i = 0; i < 60; i++) step(w, idle, TICK);
    expect(w.zones.filter((z) => z.kind === 'fire')).toHaveLength(0);
    for (let i = 0; i < 90; i++) step(w, { ...idle, mx: 1 }, TICK);
    expect(w.zones.filter((z) => z.kind === 'fire' && !z.hostile).length).toBeGreaterThanOrEqual(2);
  });

  it('Compadrios de estado: Igarapé, Banho-Maria, Raiz de Pedra, Acalanto e Pesadelo', () => {
    /* Igarapé: a poção prende e envenena em volta */
    const a = world(['igarape']), near = foe(a, 'sauva', a.player.x + 100, a.player.y), far = foe(a, 'sauva', a.player.x + 600, a.player.y);
    a.player.hp = 10;
    for (let i = 0; i < 3; i++) step(a, { ...idle, potionPressed: i === 0 }, TICK);
    expect(near.rootT).toBeGreaterThan(1.5);
    expect(near.poisonT).toBeGreaterThan(0);
    expect(far.rootT).toBe(0);
    /* Banho-Maria: a nuvem do Vapor fere */
    /* Banho-Maria: um golpe que queima um inimigo molhado faz o Vapor, e a nuvem fere */
    const b = world(['banhoMaria', 'ticao'], 1, (st) => { st.bless.hitElements = [{ el: 'fogo', chance: 1 }]; }), eb = foe(b);
    eb.maxHp = eb.hp = 1e7; eb.wetT = 5;
    damageEnemy(b, eb, 1, 'melee', 0);
    expect(b.zones.find((z) => z.kind === 'vapor')!.power).toBeGreaterThan(0);
    const hp = eb.hp;
    for (let i = 0; i < 40; i++) step(b, idle, TICK);
    expect(eb.hp).toBeLessThan(hp);
    const c = world(['ticao'], 1, (st) => { st.bless.hitElements = [{ el: 'fogo', chance: 1 }]; }), ec = foe(c);
    ec.maxHp = ec.hp = 1e7; ec.wetT = 5;
    damageEnemy(c, ec, 1, 'melee', 0);
    expect(c.zones.find((z) => z.kind === 'vapor')!.power).toBe(0);
    /* Raiz de Pedra, Acalanto e Pesadelo */
    const d = world(['raizDePedra', 'acalanto', 'pesadelo']), rooted = foe(d, 'sauva'), dazed = foe(d, 'sauva', 700, 400);
    rooted.maxHp = rooted.hp = 1e7; dazed.maxHp = dazed.hp = 1e7;
    rooted.rootT = 2; dazed.confuseT = 3;
    damageEnemy(d, rooted, 5, 'spell', 0);
    expect(rooted.crackT).toBeGreaterThan(0);
    damageEnemy(d, dazed, 5, 'melee', 0, true);
    expect(dazed.slowT).toBeGreaterThan(2);
    expect(dazed.fearT).toBeGreaterThan(1.5);
  });

  it('críticos: Olho de Lobo amaldiçoa; a sinergia do Lobisomem com 7 cura', () => {
    const w = world([...maxed('olho'), 'olhoDeLobo', ...maxed('ferocidade')]), e = foe(w);
    expect(w.stats.patronTiers.sombra).toBe(3);
    e.maxHp = e.hp = 1e7;
    w.player.hp = 100;
    damageEnemy(w, e, 50, 'melee', 0, true);
    expect(e.curseT).toBeGreaterThan(0);
    expect(w.player.hp).toBeGreaterThan(100);
  });

  it('sinergias com 7: o Curupira protege de quem está envenenado, o Mapinguari bate mais forte com a vida cheia', () => {
    const cur = [...maxed('seiva'), ...maxed('ourico'), ...maxed('espinhos')] as BlessingId[];
    const taken = (poisoned: boolean) => { const w = world(cur), e = foe(w, 'sauva'); if (poisoned) e.poisonT = 3; const hp = w.player.hp; hurtPlayer(w, 400, e.x, e.y, 0, { src: e }); return hp - w.player.hp; };
    expect(taken(true) / taken(false)).toBeCloseTo(0.75, 1);
    const map = [...maxed('couro'), ...maxed('pilao'), 'amparo'] as BlessingId[], w = world(map);
    expect(w.stats.bless.fullHpDamage).toBeCloseTo(0.3);
    expect(w.stats.patronTiers.terra).toBe(3);
  });

  it('quem explode não quebra o jogo quando o golpe volta e o derruba', () => {
    /* o herói esquiva no último instante com a Onda Mansa: a água reage com o Carregado e derruba o Fogo-Fátuo que estava estourando */
    const w = world(['ondaMansa'], 4);
    w.level = 30;
    const e = foe(w, 'fatuo', w.player.x + 30, w.player.y);
    e.hp = 1; e.chargeT = 5; e.state = 'fuse'; e.stateT = 0;
    e.tele = { shape: 'circle', x: e.x, y: e.y, r: 100, t: 0, dur: 0.05 };
    const p = w.player;
    p.state = 'dodge'; p.stateT = 0.02; p.iframes = 0.3; p.perfectUsed = false; p.dx = 1; p.dy = 0;
    expect(() => { for (let i = 0; i < 10; i++) step(w, idle, TICK); }).not.toThrow();
    expect(w.perfects).toBe(1);
  });
});
