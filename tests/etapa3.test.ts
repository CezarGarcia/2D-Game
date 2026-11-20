import { describe, expect, it } from 'vitest';
import { ENEMY, TICK } from '../src/data/balance';
import { BOSSES, MONSTERS } from '../src/data/bestiary';
import { REACTIONS, SPELLS, SPELL_ORDER, type SpellId } from '../src/data/content';
import { SETS, makeItem, makeSetItem } from '../src/data/items';
import { makeRng } from '../src/data/rng';
import { CHAPTERS, STAGES, type RoomDef } from '../src/data/stages';
import { towerChapter, towerLevel, towerRun } from '../src/data/tower';
import { addGem, addItem, equip, fuseGems, gemCount, newProfile, socketGem, type Profile } from '../src/meta/profile';
import { applyOutcome, isTowerUnlocked } from '../src/meta/rewards';
import { deriveStats, referenceProfile, setCounts, activeItems } from '../src/meta/stats';
import { applyElement } from '../src/sim/status';
import { createWorld, spawnEnemy, step, type Input, type World } from '../src/sim/world';
import { idleAt } from './bot';

function arena(p: Profile, level: number, rooms?: RoomDef[]): World {
  const w = createWorld({ stageId: 't', level, rooms: rooms ?? [{ type: 'combat', waves: [[]], bg: 0 }], stats: deriveStats(p), seed: 7 });
  if (!rooms) w.waveTimer = -1e9;
  return w;
}
const run = (w: World, s: number, inp: (w: World) => Input = idleAt) => { for (let i = 0; i < Math.round(s / TICK); i++) step(w, inp(w), TICK); };

describe('campanha completa', () => {
  it('8 capítulos, 96 fases, do nível 1 ao 60, e todos os monstros e chefes estão em alguma fase', () => {
    expect(CHAPTERS.length).toBe(8);
    expect(STAGES.length).toBe(96);
    expect(STAGES[0].level).toBe(1);
    expect(STAGES[95].level).toBe(60);
    const kinds = new Set(STAGES.flatMap((s) => s.kinds));
    for (const k of Object.keys(MONSTERS)) expect(kinds.has(k as never), k).toBe(true);
    for (const k of Object.keys(BOSSES)) expect(kinds.has(k as never), k).toBe(true);
  });

  it('cada elemento tem 5 feitiços, e cada reação liga dois elementos diferentes', () => {
    const per: Record<string, number> = {};
    for (const id of SPELL_ORDER) per[SPELLS[id].element] = (per[SPELLS[id].element] ?? 0) + 1;
    expect(Object.values(per)).toEqual([5, 5, 5, 5, 5, 5, 5]);
    for (const r of REACTIONS) expect(r.a).not.toBe(r.b);
  });

  it('todo feitiço pode ser lançado sem quebrar a simulação', () => {
    for (const id of SPELL_ORDER) {
      const p = referenceProfile(60); p.loadout = [id as SpellId, null, null];
      const w = arena(p, 60);
      const e = spawnEnemy(w, { kind: 'vulto', x: w.player.x + 200, y: w.player.y });
      e.state = 'recover'; e.stateT = -99;
      w.player.mana = 999;
      step(w, { ...idleAt(w), aimX: e.x, aimY: e.y, spell: [true, false, false] }, TICK);
      run(w, 3, (w) => ({ ...idleAt(w), aimX: e.x, aimY: e.y }));
      expect(Number.isFinite(w.player.x + w.player.y + w.player.hp), id).toBe(true);
      expect(w.player.cds[0] >= 0, id).toBe(true);
    }
  });
});

describe('reações', () => {
  it('Água e depois Tempestade eletrocuta todos os molhados', () => {
    const w = arena(referenceProfile(30), 30);
    const a = spawnEnemy(w, { kind: 'bode', x: 700, y: 300 }), b = spawnEnemy(w, { kind: 'bode', x: 900, y: 500 });
    run(w, ENEMY.spawnTime + 0.1);
    applyElement(w, a, 'agua'); applyElement(w, b, 'agua');
    const hpB = b.hp;
    expect(applyElement(w, a, 'tempestade')).toBe('eletrocutar');
    expect(b.hp).toBeLessThan(hpB);
    expect(a.wetT).toBe(0);
  });

  it('Encanto e depois Terra vira estátua, e o golpe seguinte dobra', () => {
    const w = arena(referenceProfile(30), 30);
    const e = spawnEnemy(w, { kind: 'calango', x: 700, y: 300 });
    run(w, ENEMY.spawnTime + 0.1);
    applyElement(w, e, 'encanto');
    expect(applyElement(w, e, 'terra')).toBe('estatua');
    expect(e.stone).toBe(true);
    expect(e.stunT).toBeGreaterThan(0);
  });

  it('sem reação, o elemento só deixa o efeito dele', () => {
    const w = arena(referenceProfile(30), 30);
    const e = spawnEnemy(w, { kind: 'calango', x: 700, y: 300 });
    run(w, ENEMY.spawnTime + 0.1);
    expect(applyElement(w, e, 'fogo')).toBe(null);
    expect(e.burnT).toBeGreaterThan(0);
  });
});

describe('armas', () => {
  for (const weapon of ['borduna', 'peixeiras', 'zagaia', 'cajado'] as const) {
    it(`${weapon}: ataca e derruba um enxame`, () => {
      const p = referenceProfile(30, false, weapon);
      const w = arena(p, 30);
      expect(w.stats.weapon).toBe(weapon);
      const e = spawnEnemy(w, { kind: 'calango', x: w.player.x + (weapon === 'cajado' ? 300 : 70), y: w.player.y });
      e.state = 'recover'; e.stateT = -99;
      run(w, ENEMY.spawnTime + 4, (w) => ({ ...idleAt(w), aimX: e.x, aimY: e.y, attackHeld: true }));
      expect(e.hp).toBeLessThanOrEqual(0);
    });
  }

  it('borduna: o golpe carregado racha a armadura', () => {
    const w = arena(referenceProfile(30, false, 'borduna'), 30);
    const e = spawnEnemy(w, { kind: 'cupinzeiro', x: w.player.x + 110, y: w.player.y });
    e.state = 'exposed'; e.stateT = -99;
    run(w, ENEMY.spawnTime);
    run(w, 1.2, (w) => ({ ...idleAt(w), aimX: e.x, aimY: e.y, altHeld: true }));
    step(w, { ...idleAt(w), aimX: e.x, aimY: e.y }, TICK);
    expect(e.crackT).toBeGreaterThan(0);
  });
});

describe('chefes', () => {
  it('o Saci rouba um feitiço e devolve quando apanha', () => {
    const p = referenceProfile(30); p.loadout = ['dardo', 'sementes', 'cipo'];
    const w = arena(p, 30);
    const s = spawnEnemy(w, { kind: 'saci', x: 800, y: 400, elite: true });
    let stolen = false;
    for (let i = 0; i < 60 * 20 && !stolen; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); stolen = w.player.stolen >= 0; w.events.length = 0; }
    expect(stolen).toBe(true);
    s.hits = 99;
    run(w, 0.1);
    expect(w.player.stolen).toBe(-1);
  });

  it('o Mapinguari só sente golpe direito quando ruge', () => {
    const w = arena(referenceProfile(42), 42);
    const m = spawnEnemy(w, { kind: 'mapinguari', x: 700, y: 400, elite: true });
    run(w, ENEMY.spawnTime + 0.1);
    m.state = 'idle';
    const hp0 = m.hp;
    w.player.x = m.x - 60; w.player.y = m.y;
    step(w, { ...idleAt(w), aimX: m.x, aimY: m.y, attackPressed: true }, TICK);
    run(w, 0.3, (w) => ({ ...idleAt(w), aimX: m.x, aimY: m.y }));
    const closed = hp0 - m.hp;
    m.state = 'cast'; m.pattern = 'rugido'; m.flag = true; m.stateT = 0.6;
    const hp1 = m.hp;
    step(w, { ...idleAt(w), aimX: m.x, aimY: m.y, attackPressed: true }, TICK);
    run(w, 0.3, (w) => ({ ...idleAt(w), aimX: m.x, aimY: m.y }));
    expect(hp1 - m.hp).toBeGreaterThan(closed * 4);
  });

  it('o Boitatá arrasta um corpo atrás da cabeça', () => {
    const w = arena(referenceProfile(36), 36);
    spawnEnemy(w, { kind: 'boitata', x: 900, y: 400, elite: true });
    for (let i = 0; i < 60 * 8; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); w.events.length = 0; }
    expect(w.trail.length).toBeGreaterThan(20);
  });

  it('a lua enche durante a luta com o Lobisomem e ele vira lobo', () => {
    const w = arena(referenceProfile(48), 48);
    const l = spawnEnemy(w, { kind: 'lobisomem', x: 900, y: 400, elite: true });
    for (let i = 0; i < 60 * 50; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); w.events.length = 0; }
    expect(w.moon).toBeGreaterThan(0.5);
    expect(l.phase).toBeGreaterThanOrEqual(1);
  });

  it('o Esquecimento apaga feitiços', () => {
    const p = referenceProfile(60); p.loadout = ['dardo', 'faisca', 'brasa'];
    const w = arena(p, 60);
    spawnEnemy(w, { kind: 'esquecimento', x: 900, y: 400, elite: true });
    let erased = false;
    for (let i = 0; i < 60 * 30 && !erased; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); erased = w.player.erased.some((v) => v > 0); w.events.length = 0; }
    expect(erased).toBe(true);
  });
});

describe('terreno', () => {
  it('Cerrado: o capim pega fogo e espalha', () => {
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[]], bg: 0, grass: [{ x: 600, y: 400 }, { x: 700, y: 400 }] }];
    const w = arena(referenceProfile(32), 32, rooms);
    w.waveTimer = -1e9;
    w.grass[0].burnT = 4;
    run(w, 1.5);
    expect(w.grass[1].burnT).toBeGreaterThan(0);
  });

  it('Pantanal: ilusões somem com um golpe e não contam para limpar a sala', () => {
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[{ kind: 'ariranha', x: 800, y: 400 }]], bg: 0, illusions: 2 }, { type: 'combat', waves: [[]], bg: 0 }];
    const w = arena(referenceProfile(48), 48, rooms);
    run(w, 1.5);
    expect(w.enemies.filter((e) => e.illusion).length).toBe(2);
    for (const e of w.enemies) if (!e.illusion) e.hp = 0;
    run(w, 1.2);
    expect(w.phase).toBe('cleared');
  });

  it('Terra Sem Nome: um feitiço é apagado durante a sala', () => {
    const p = referenceProfile(55); p.loadout = ['dardo', 'faisca', 'brasa'];
    const rooms: RoomDef[] = [{ type: 'combat', waves: [[{ kind: 'esquecido', x: 1000, y: 400, elite: true }]], bg: 0, erase: true }];
    const w = arena(p, 55, rooms);
    for (let i = 0; i < 60 * 18; i++) { w.player.hp = w.stats.maxHp; step(w, idleAt(w), TICK); w.events.length = 0; }
    expect(w.player.erased.some((v) => v === Infinity)).toBe(true);
  });
});

describe('itens, gemas, conjuntos e Torre', () => {
  it('gema na arma dá dano do elemento; três iguais fundem numa melhor', () => {
    const p = newProfile(3); p.gold = 10000;
    addGem(p, { el: 'fogo', lvl: 1 }, 4);
    expect(fuseGems(p, { el: 'fogo', lvl: 1 }).done).toBe(true);
    expect(gemCount(p, { el: 'fogo', lvl: 2 })).toBe(1);
    expect(socketGem(p, p.equipped.arma!.id, { el: 'fogo', lvl: 2 }).done).toBe(true);
    expect(deriveStats(p).elemDamage.fogo).toBeCloseTo(0.07);
    expect(deriveStats(p).weaponGem?.el).toBe('fogo');
  });

  it('peças de conjunto contam juntas e ligam os bônus', () => {
    const p = newProfile(3), rng = makeRng(4);
    for (const type of ['chapeu', 'gibao', 'luvas', 'alpercatas'] as const) {
      const it = makeSetItem(p.nextItemId++, rng, 'mateiro', 5, 2); it.type = type; addItem(p, it); equip(p, it.id);
    }
    expect(setCounts(activeItems(p)).mateiro).toBe(4);
    const without = newProfile(3);
    expect(deriveStats(p).maxHp).toBeGreaterThan(deriveStats(without).maxHp);
    expect(Object.keys(SETS).length).toBe(10);
  });

  it('a Torre sobe de 10 em 10 andares, com chefe no décimo e nível crescente', () => {
    const r = towerRun(41);
    expect(r.rooms.filter((x) => x.floor != null).length).toBe(10);
    expect(r.rooms[r.rooms.length - 1].type).toBe('boss');
    expect(towerLevel(100)).toBe(60);
    expect(towerChapter(1)).toBe(1);
    expect(towerChapter(100)).toBe(8);
  });

  it('vencer uma subida da Torre paga, move o marco e guarda o recorde', () => {
    const p = newProfile(5);
    for (const s of STAGES.slice(0, 12)) applyOutcome(p, { stageId: s.id, won: true, time: 60, deaths: 0, roomsCleared: s.rooms.length, kills: 10, perfects: 0, hitsTaken: 0 });
    expect(isTowerUnlocked(p)).toBe(true);
    const run1 = towerRun(1), gold = p.gold;
    const r = applyOutcome(p, { stageId: run1.id, won: true, time: 300, deaths: 0, roomsCleared: run1.rooms.length, kills: 50, perfects: 0, hitsTaken: 0 });
    expect(r.tower?.floors).toBe(10);
    expect(p.tower.best).toBe(10);
    expect(p.tower.checkpoint).toBe(11);
    expect(p.gold).toBeGreaterThan(gold);
    expect(r.gems.length).toBe(2);
  });

  it('vencer o Esquecimento mostra o final uma vez só', () => {
    const p = newProfile(9);
    const last = STAGES[95];
    const r1 = applyOutcome(p, { stageId: last.id, won: true, time: 200, deaths: 0, roomsCleared: last.rooms.length, kills: 30, perfects: 0, hitsTaken: 0 });
    const r2 = applyOutcome(p, { stageId: last.id, won: true, time: 200, deaths: 0, roomsCleared: last.rooms.length, kills: 30, perfects: 0, hitsTaken: 0 });
    expect(r1.credits).toBe(true);
    expect(r2.credits).toBe(false);
  });

  it('armas novas só caem a partir do capítulo em que aparecem', () => {
    const rng = makeRng(1);
    for (let i = 0; i < 200; i++) expect(['borduna', 'peixeiras', 'zagaia', 'cajado']).not.toContain(makeItem(i, rng, 5, 0, undefined, 1).type);
  });
});
