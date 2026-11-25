/** Etapa 4, fase 5 (docs/gdd/09 e 10): Aldeia, Temperamento e Laço, Andanças, falas, Noite da Semana e Profundezas da Torre. */
import { afterEach, describe, expect, it } from 'vitest';
import { UI_ICON_KEYS } from '../src/art/uiicons';
import { VILLAGE_SPOTS } from '../src/art/aldeia';
import { ELEMENT_ORDER } from '../src/data/content';
import { FALAS } from '../src/data/falas';
import { STAGES, STAGE_BY_ID } from '../src/data/stages';
import { BOND, TEMPERS, TEMPER_ORDER, bondLevel, bondNext } from '../src/data/tempers';
import { DEPTHS, TOWER_FLOORS, depthsScale, towerChapter, towerRun } from '../src/data/tower';
import { BUILDINGS, BUILDING_ORDER } from '../src/data/village';
import { WALK, cancelWalk, collectWalk, sendWalk, walkHoursLeft, walkProgress, walkSlots, walkers } from '../src/meta/andancas';
import { setClock } from '../src/meta/daily';
import { abandonNight, currentTrecho, enterNode, rerollTemper, startNight, startWeeklyNight, wake, weeklyNight, weeklyRecord, type NightChoice, type Pending } from '../src/meta/dream';
import { PROFILE_VERSION, migrate, newProfile, type Profile } from '../src/meta/profile';
import { applyOutcome, bondUp } from '../src/meta/rewards';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { createWorld, spawnEnemy } from '../src/sim/world';

const CHOICE: NightChoice = { weapon: 'facao', spells: ['dardo', 'sementes', 'cipo'], companion: null, supremo: 'natureza' };
const HOUR = 3_600_000, T0 = new Date(2026, 5, 10, 9).getTime();
const at = (ms: number) => new Date(T0 + ms);
afterEach(() => setClock());

function dreamer(chapters = 3): Profile {
  const p = newProfile(5);
  p.level = 30;
  for (const s of STAGES) if (s.chapter <= chapters) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 60, pity: 0, clears: 1 };
  p.supremos = ELEMENT_ORDER.slice(0, chapters); p.supremo = p.supremos[0];
  p.dream.nights = 1;
  return p;
}
/** Um perfil com três companheiros, o primeiro ao lado do herói. */
function keeper(): Profile {
  const p = dreamer();
  p.companions = { capivara: { level: 1, temper: 'manso', bond: 0 }, onca: { level: 1, temper: 'guloso', bond: 0 }, arara: { level: 1, temper: 'curioso', bond: 0 } };
  p.companion = 'capivara'; p.village.viveiro = 2;
  return p;
}

describe('Aldeia', () => {
  it('seis construções, todas com lugar na cena, ícone e níveis que custam cada vez mais', () => {
    expect(BUILDING_ORDER).toHaveLength(6);
    for (const id of BUILDING_ORDER) {
      const b = BUILDINGS[id];
      expect(VILLAGE_SPOTS[id]).toBeTruthy();
      expect(UI_ICON_KEYS).toContain(b.icon);
      expect(b.levels.length).toBeGreaterThanOrEqual(3);
      for (let i = 1; i < b.levels.length; i++) expect(b.levels[i].cost).toBeGreaterThan(b.levels[i - 1].cost);
    }
  });

  it('a Barraca do Saci dá um Pulo, depois um Assobio, depois um giro grátis em cada Roda', () => {
    const roda = (level: number) => {
      const p = dreamer(); p.village.barracaDoSaci = level;
      const run = startNight(p, CHOICE, 4242)!, t = currentTrecho(run);
      const node = t.nodes.find((n) => n.kind === 'roda') ?? t.nodes.find((n) => n.kind === 'combate' && n.step >= 3)!;
      node.kind = 'roda';
      run.at = t.nodes.find((n) => n.next.includes(node.id))!.id; run.done = true;
      enterNode(p, node.id);
      const w = run.pending as Extract<Pending, { kind: 'roda' }>;
      return [w.pulos, w.assobios, w.free];
    };
    expect(roda(0)).toEqual([1, 0, 1]);
    expect(roda(1)).toEqual([2, 0, 1]);
    expect(roda(2)).toEqual([2, 1, 1]);
    expect(roda(3)).toEqual([2, 1, 2]);
  });
});

describe('Temperamento e Laço', () => {
  it('oito temperamentos; o resgate sorteia um, e um save antigo ganha o dele sempre igual', () => {
    expect(TEMPER_ORDER).toHaveLength(8);
    for (const id of TEMPER_ORDER) expect(UI_ICON_KEYS).toContain(TEMPERS[id].icon);
    const p = referenceProfile(10); p.companions = {}; p.companion = null;
    const rescue = STAGES.find((s) => s.rescue && s.rescue !== 'onca')!;
    applyOutcome(p, { stageId: rescue.id, won: true, time: 40, deaths: 0, roomsCleared: rescue.rooms.length, kills: 20, perfects: 0, hitsTaken: 1 });
    const got = p.companions[rescue.rescue!]!;
    expect(TEMPER_ORDER).toContain(got.temper);
    expect(got.bond).toBe(0); // o Laço começa a contar na fase seguinte
    /* migração: um save da versão 4, sem temperamento */
    const old = JSON.parse(JSON.stringify(referenceProfile(30))) as Profile;
    old.version = 4; old.companions = { capivara: { level: 1 }, onca: { level: 2 } };
    const a = migrate(JSON.parse(JSON.stringify(old)) as Profile), b = migrate(JSON.parse(JSON.stringify(old)) as Profile);
    expect(a.version).toBe(PROFILE_VERSION);
    expect(TEMPER_ORDER).toContain(a.companions.capivara!.temper);
    expect(a.companions).toEqual(b.companions);
    expect(a.companions.onca!.level).toBe(2);
    expect(a.andancas).toEqual({ slots: [null, null, null], day: '', hours: 0 });
  });

  it('o Laço sobe com as fases juntos, até o nível 5; o Leal ganha em dobro', () => {
    expect([0, 3, 4, 12, 28, 60, 999].map((n) => bondLevel(n))).toEqual([1, 1, 2, 3, 4, 5, 5]);
    expect(bondNext(0)).toBe(4);
    expect(bondNext(60)).toBeNull();
    const p = keeper();
    bondUp(p, 3);
    expect(p.companions.capivara!.bond).toBe(3);
    expect(p.companions.onca!.bond).toBe(0); // só quem está com o herói
    p.companions.capivara!.temper = 'leal';
    bondUp(p, 2);
    expect(p.companions.capivara!.bond).toBe(7);
    /* e uma noite do Sonho conta os trechos vencidos */
    const run = startNight(p, CHOICE, 9)!;
    run.tally.bosses = 2;
    wake(p, 'caiu');
    expect(p.companions.capivara!.bond).toBe(7 + 2 * 2);
  });

  it('cada temperamento muda o companheiro do jeito que diz, e o Laço soma por cima', () => {
    const stats = (temper: string | undefined, bond = 0) => { const p = referenceProfile(30); p.companions.capivara = { level: 1, temper: temper as never, bond }; return deriveStats(p); };
    const none = stats(undefined);
    expect([none.petDamageMult, none.petHpMult]).toEqual([1, 1]);
    expect(stats('brabo').petDamageMult).toBeCloseTo(1.15);
    expect(stats('brabo').petHpMult).toBeCloseTo(0.9);
    expect(stats('manso').petHpMult).toBeCloseTo(1.2);
    expect(stats('manso').petDamageMult).toBeCloseTo(0.9);
    expect(stats('ligeiro').petCooldownMult).toBeCloseTo(none.petCooldownMult * 0.85);
    expect(stats('sortudo').luck).toBe(none.luck + 10);
    expect(stats('medroso').petFastRevive).toBe(true);
    expect(stats('guloso').petDamageMult).toBe(1);
    const bonded = stats(undefined, BOND.steps[4]);
    expect(bonded.petDamageMult).toBeCloseTo(1 + 4 * BOND.perLevel);
    expect(bonded.petHpMult).toBeCloseTo(1 + 4 * BOND.perLevel);
  });

  it('trocar de temperamento custa Lembranças e nunca sorteia o mesmo', () => {
    const p = keeper();
    expect(rerollTemper(p, 'capivara')).toBeNull();
    p.dream.memories = BOND.reroll * 30;
    for (let i = 0; i < 30; i++) { const before = p.companions.capivara!.temper; const got = rerollTemper(p, 'capivara'); expect(got).not.toBe(before); expect(TEMPER_ORDER).toContain(got); }
    expect(p.dream.memories).toBe(0);
  });
});

describe('Andanças', () => {
  it('o Viveiro abre as vagas; só sai quem foi resgatado, não está com o herói e não saiu ainda', () => {
    const p = keeper();
    expect(walkSlots(p)).toBe(2);
    expect(walkers(p).sort()).toEqual(['arara', 'onca']);
    expect(sendWalk(p, 0, 'capivara', 1, 4, at(0))).toBe(false); // está com o herói
    expect(sendWalk(p, 0, 'onca', 7, 4, at(0))).toBe(false);     // capítulo não vencido
    expect(sendWalk(p, 0, 'onca', 1, 3, at(0))).toBe(false);     // 3 horas não existe
    expect(sendWalk(p, 2, 'onca', 1, 4, at(0))).toBe(false);     // vaga fechada
    expect(sendWalk(p, 0, 'onca', 2, 4, at(0))).toBe(true);
    expect(sendWalk(p, 0, 'arara', 1, 1, at(0))).toBe(false);    // vaga ocupada
    expect(sendWalk(p, 1, 'onca', 1, 1, at(0))).toBe(false);     // já saiu
    expect(walkers(p)).toEqual(['arara']);
    p.village.viveiro = 0;
    expect(walkSlots(p)).toBe(0);
  });

  it('conta com o relógio e só paga na volta; o Guloso traz mais Resina', () => {
    const p = keeper(), gold = p.gold, mata = p.materials.mata;
    sendWalk(p, 0, 'onca', 2, 4, at(0));
    expect(walkProgress(p.andancas.slots[0]!, at(2 * HOUR))).toBeCloseTo(0.5);
    expect(collectWalk(p, 0, at(3.9 * HOUR))).toBeNull();
    const r = collectWalk(p, 0, at(4 * HOUR))!;
    expect(r.paid).toBe(4);
    expect(r.gold).toBeGreaterThan(0);
    expect(r.mata).toBe(Math.round(WALK.mataPerHour * 4 * 1.5)); // a onça deste teste é Gulosa
    expect(r.po).toBe(Math.floor(WALK.poPerHour * 4));
    expect([p.gold, p.materials.mata]).toEqual([gold + r.gold, mata + r.mata]);
    expect(p.andancas.slots[0]).toBeNull();
    expect(walkers(p).sort()).toEqual(['arara', 'onca']);
  });

  it('por dia, só as primeiras oito horas rendem; no dia seguinte volta', () => {
    const p = keeper();
    expect(walkHoursLeft(p, at(0))).toBe(WALK.dailyHours);
    sendWalk(p, 0, 'onca', 1, 8, at(0)); sendWalk(p, 1, 'arara', 1, 4, at(0));
    expect(collectWalk(p, 0, at(8 * HOUR))!.paid).toBe(8);
    expect(walkHoursLeft(p, at(8 * HOUR))).toBe(0);
    const tired = collectWalk(p, 1, at(8 * HOUR))!;
    expect([tired.paid, tired.gold, tired.mata]).toEqual([0, 0, 0]);
    expect(walkHoursLeft(p, at(24 * HOUR))).toBe(WALK.dailyHours);
    sendWalk(p, 0, 'onca', 1, 1, at(24 * HOUR));
    expect(collectWalk(p, 0, at(25 * HOUR))!.paid).toBe(1);
    expect(walkHoursLeft(p, at(25 * HOUR))).toBe(WALK.dailyHours - 1);
  });

  it('o relógio do jogo vale quando ninguém passa a hora, e chamar de volta não rende nada', () => {
    const p = keeper(), gold = p.gold;
    let now = T0;
    setClock(() => new Date(now));
    expect(sendWalk(p, 0, 'onca', 1, 1)).toBe(true);
    expect(collectWalk(p, 0)).toBeNull();
    now += HOUR;
    expect(collectWalk(p, 0)!.paid).toBe(1);
    sendWalk(p, 0, 'arara', 1, 8);
    expect(cancelWalk(p, 0)).toBe(true);
    expect(cancelWalk(p, 0)).toBe(false);
    expect(p.andancas.slots[0]).toBeNull();
    expect(p.gold).toBeGreaterThan(gold); // só o que a primeira trouxe
  });

  it('a gema é sorteada pela saída, não pela hora de receber: recarregar não muda o que veio', () => {
    const run = () => { const p = keeper(); sendWalk(p, 0, 'arara', 2, 8, at(0)); return collectWalk(p, 0, at(9 * HOUR))!.gem; };
    expect(run()).toBe(run());
    let gems = 0;
    for (let seed = 1; seed <= 200; seed++) { const p = keeper(); p.seed = seed; sendWalk(p, 0, 'arara', 2, 8, at(0)); if (collectWalk(p, 0, at(8 * HOUR))!.gem) gems++; }
    expect(gems).toBeGreaterThan(80);  // a arara deste teste é Curiosa: 8 h × 4% × 2 = 64%
    expect(gems).toBeLessThan(170);
  });
});

describe('falas e Noite da Semana', () => {
  it('ao acordar, um Encantado já libertado diz uma fala que ainda não tinha dito', () => {
    expect(new Set(FALAS.map((f) => f.id)).size).toBe(FALAS.length);
    for (const el of ELEMENT_ORDER) expect(FALAS.filter((f) => f.who === el).length).toBeGreaterThanOrEqual(3);
    const p = dreamer(), heard: string[] = [];
    for (let i = 0; i < 12; i++) {
      startNight(p, CHOICE, 100 + i);
      const end = abandonNight(p)!;
      if (!end.fala) break;
      expect(p.supremos).toContain(end.fala.who);
      expect(heard).not.toContain(end.fala.id);
      heard.push(end.fala.id);
    }
    expect(heard.length).toBeGreaterThan(1);
    expect(p.dream.falasSeen).toEqual(heard);
  });

  it('a Noite da Semana é a mesma para a semana toda e muda na seguinte', () => {
    expect(weeklyNight('2026-W24')).toEqual(weeklyNight('2026-W24'));
    const seeds = new Set(Array.from({ length: 20 }, (_, i) => weeklyNight(`2026-W${i}`).seed));
    expect(seeds.size).toBe(20);
    for (let i = 0; i < 20; i++) { const n = Object.keys(weeklyNight(`2026-W${i}`).omens).length; expect(n).toBeGreaterThanOrEqual(3); expect(n).toBeLessThanOrEqual(4); }
    const p = dreamer(), day = new Date(2026, 5, 10, 12), w = weeklyNight(weeklyRecord(p, day).week);
    const run = startWeeklyNight(p, CHOICE, day)!;
    expect([run.seed, run.weekly]).toEqual([w.seed, true]);
    expect(run.omens).toEqual(w.omens);
    /* a primeira noite de todas não pode ser a da semana */
    const fresh = dreamer(); fresh.dream.nights = 0;
    expect(startWeeklyNight(fresh, CHOICE, day)).toBeNull();
  });

  it('o recorde da semana guarda o melhor resultado, e uma noite comum não mexe nele', () => {
    const p = dreamer(), day = new Date(2026, 5, 10, 12);
    const play = (trechos: number, time: number, won = false) => { const run = startWeeklyNight(p, CHOICE, day)!; run.tally.bosses = trechos; run.tally.time = time; return wake(p, won ? 'venceu' : 'caiu', day).weekly!.best; };
    expect(play(1, 300)).toBe(true);
    expect(play(0, 100)).toBe(false);
    expect(play(1, 250)).toBe(true);  // mesmo trecho, mais rápido
    expect(play(1, 400)).toBe(false);
    expect(play(3, 900, true)).toBe(true);
    expect(weeklyRecord(p, day)).toMatchObject({ tries: 5, won: true, trechos: 3, time: 900 });
    startNight(p, CHOICE, 3);
    expect(wake(p, 'caiu', day).weekly).toBeNull();
    expect(weeklyRecord(p, day).tries).toBe(5);
    /* semana nova, recorde novo */
    expect(weeklyRecord(p, new Date(2026, 5, 20, 12)).tries).toBe(0);
  });
});

describe('Profundezas da Torre', () => {
  it('depois do andar 100 a subida continua de dez em dez, com monstros cada vez mais duros', () => {
    expect(depthsScale(100)).toEqual({ hp: 1, damage: 1 });
    expect(depthsScale(110).hp).toBeCloseTo(Math.pow(1 + DEPTHS.hpPerFloor, 10));
    expect(towerRun(95).number).toBe(91); // até o 100, o teto de partida é o 91
    const deep = towerRun(101);
    expect(deep.number).toBe(101);
    expect(deep.id).toBe('torre-101');
    expect(deep.name).toContain('Profundezas');
    const floors = deep.rooms.filter((r) => r.type !== 'altar');
    expect(floors.map((r) => r.floor)).toEqual([101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
    for (const r of floors) expect(r.deep!.hp).toBeCloseTo(depthsScale(r.floor!).hp);
    expect(floors[9].type).toBe('boss');
    /* cada bloco de dez andares é de um capítulo, em roda */
    expect([101, 111, 171, 181].map(towerChapter)).toEqual([1, 2, 8, 1]);
    expect(towerRun(141).rooms.length).toBe(deep.rooms.length);
    for (const r of towerRun(100).rooms) expect(r.deep).toBeUndefined();
  });

  it('na sala, os monstros das Profundezas têm a vida e o dano do andar', () => {
    const stats = deriveStats(referenceProfile(60)), stage = towerRun(121);
    const w = createWorld({ stageId: stage.id, level: stage.level, rooms: stage.rooms, stats, seed: 3 });
    /* a mesma subida, sem o que as Profundezas somam */
    const base = createWorld({ stageId: stage.id, level: stage.level, rooms: stage.rooms.map((r) => ({ ...r, deep: undefined })), stats, seed: 3 });
    const a = spawnEnemy(w, { kind: 'sauva', x: 600, y: 400 }), b = spawnEnemy(base, { kind: 'sauva', x: 600, y: 400 });
    expect(a.maxHp / b.maxHp).toBeCloseTo(depthsScale(121).hp, 1);
    expect(a.dmg / b.dmg).toBeCloseTo(depthsScale(121).damage, 2);
  });

  it('vencer os andares 91 a 100 abre as Profundezas; antes disso, a partida para no 91', () => {
    const p = referenceProfile(60);
    const win = (start: number) => { const run = towerRun(start); return applyOutcome(p, { stageId: run.id, won: true, time: 300, deaths: 0, roomsCleared: run.rooms.length, kills: 80, perfects: 0, hitsTaken: 5 }); };
    p.tower.checkpoint = 81; win(81);
    expect([p.tower.best, p.tower.checkpoint]).toEqual([90, 91]);
    win(91);
    expect([p.tower.best, p.tower.checkpoint]).toEqual([TOWER_FLOORS, 101]);
    win(101);
    expect([p.tower.best, p.tower.checkpoint]).toEqual([110, 111]);
    expect(STAGE_BY_ID.get('torre-101')).toBeUndefined(); // a Torre não entra na lista de fases da campanha
  });
});
