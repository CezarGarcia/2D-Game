/** Etapa 4, fase 4 (docs/gdd/09 e 10): Roda do Saci, Presságios, Cordéis e Aspectos de arma. */
import { describe, expect, it } from 'vitest';
import { UI_ICON_KEYS } from '../src/art/uiicons';
import { ASPECTS, ASPECT_ORDER, aspectsOf, type AspectId } from '../src/data/aspects';
import { TICK } from '../src/data/balance';
import { BLESSINGS, ELEMENT_ORDER, type BlessingId } from '../src/data/content';
import { CORDEIS, CORDEL, CORDEL_ORDER, cordelCost, cordelPrice, isFullCordel, type CordelId } from '../src/data/cordeis';
import { DREAM, dreamNight, dreamStage, parseDreamId, type DreamNode, type NodeKind } from '../src/data/dream';
import type { WeaponKind } from '../src/data/items';
import { HURRY_SECONDS, OMEN, OMENS, OMEN_FOES, OMEN_ORDER, cleanOmens, omenFoes, omenMemories, omenWeight, type OmenPick } from '../src/data/omens';
import { makeRng } from '../src/data/rng';
import { STAGES, STAGE_BY_ID } from '../src/data/stages';
import {
  breath, buyAspect, buyCordel, chooseBlessingOffer, collectRoda, cordel, cordelNext, currentStageId, currentTrecho, dreamContext, enterNode, equipAspect, equippedCordeis, feiraPrice, forgottenSlot,
  fountainHeal, isLate, leaveNode, memoryBonus, reachable, rodaAssobio, rodaCost, rodaPulo, runStats, settleNode, spinRoda, startNight, toggleCordel, buyBlessing, chooseCauso,
  type DreamRun, type NightChoice, type Pending,
} from '../src/meta/dream';
import { migrate, newProfile, type Profile } from '../src/meta/profile';
import { applyOutcome, type StageOutcome } from '../src/meta/rewards';
import { LINES, lineSymbol, readGrid, rodaOdds, rodaWeights, spinGrid, type RodaSymbol } from '../src/meta/roda';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { hurtPlayer } from '../src/sim/core';
import { HUMAN } from '../src/sim/bot';
import { createWorld, rollBlessings, spawnEnemy, step, type Enemy, type Input, type World } from '../src/sim/world';
import { playNight } from './sonho-bot';

const CHOICE: NightChoice = { weapon: 'facao', spells: ['dardo', 'sementes', 'cipo'], companion: 'capivara', supremo: 'natureza' };
const idle: Input = { mx: 0, my: 0, aimX: 700, aimY: 400, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false };
type Roda = Extract<Pending, { kind: 'roda' }>;

function dreamer(level = 30, chapters = 3, seed = 5): Profile {
  const p = newProfile(seed);
  p.level = level;
  for (const s of STAGES) if (s.chapter <= chapters) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 60, pity: 0, clears: 1 };
  p.supremos = ELEMENT_ORDER.slice(0, chapters); p.supremo = p.supremos[0];
  p.companions.capivara = { level: 1 }; p.companion = 'capivara';
  p.dream.nights = 1;
  return p;
}
/** Dá e equipa os folhetos pedidos, com o Fôlego que eles pedem. */
function wear(p: Profile, ids: Partial<Record<CordelId, number>>): Profile {
  p.village.casaDeCordel = 5;
  for (const [id, lv] of Object.entries(ids) as [CordelId, number][]) { p.cordeis.levels[id] = lv; p.cordeis.equipped.push(id); }
  return p;
}
function night(p: Profile, omens: OmenPick = {}, seed = 4242): DreamRun {
  const run = startNight(p, { ...CHOICE, omens }, seed);
  if (!run) throw new Error('a noite não começou');
  return run;
}
function outcome(p: Profile, over: Partial<StageOutcome> = {}): StageOutcome {
  const run = p.dream.run!;
  return {
    stageId: currentStageId(run) ?? 'x', won: true, time: 30, deaths: 0, roomsCleared: 1, kills: 6, perfects: 0, hitsTaken: 3, blessings: run.blessings.slice(), chests: 0, foundGold: 0,
    left: { hpFrac: 0.8, potions: 1, supremo: 0, revives: 0, altarDry: 0 }, trial: null, ...over,
  };
}
function jump(p: Profile, kind: NodeKind, trial?: DreamNode['trial']): DreamNode {
  const run = p.dream.run!, t = currentTrecho(run);
  const node = t.nodes.find((n) => n.kind === kind) ?? t.nodes.find((n) => n.kind === 'combate' && n.step > 2)!;
  node.kind = kind;
  if (trial) node.trial = trial;
  run.at = node.id; run.done = false; run.pending = null; run.path[run.trecho].push(node.id);
  return node;
}
/** Abre uma Roda no nó atual, como se o herói tivesse acabado de chegar nela. */
function atRoda(p: Profile, vintem = 500): Roda {
  const run = p.dream.run!, t = currentTrecho(run);
  const node = t.nodes.find((n) => n.kind === 'roda') ?? t.nodes.find((n) => n.kind === 'combate' && n.step >= 3)!;
  node.kind = 'roda';
  const before = t.nodes.find((n) => n.next.includes(node.id))!;
  run.at = before.id; run.done = true; run.pending = null; run.vintem = vintem;
  expect(enterNode(p, node.id)).toEqual({ panel: 'roda' });
  return run.pending as unknown as Roda;
}

describe('Roda do Saci: a conta', () => {
  const pats = ELEMENT_ORDER.slice(0, 3);

  it('o Gorro vale por qualquer símbolo e a grade é lida linha por linha', () => {
    const g: RodaSymbol[] = ['agua', 'gorro', 'agua', 'vintem', 'agua', 'olho', 'agua', 'natureza', 'vintem'];
    expect(lineSymbol(g, LINES[0])).toBe('agua');
    expect(lineSymbol(g, LINES[1])).toBeNull();
    const read = readGrid(g, pats);
    expect(read.lines.map((l) => l.cells.join(''))).toEqual(['012', '246']);
    expect(read.patrons).toEqual({ agua: 2 });
    expect([read.vintem, read.olho, read.jackpot]).toEqual([0, 0, null]);
    /* linha só de Gorros conta para o padrinho com mais linhas; grade cheia é sorte grande */
    expect(readGrid(Array(9).fill('gorro'), pats).patrons).toEqual({ natureza: 8 });
    expect(readGrid(Array(9).fill('agua'), pats).jackpot).toBe('agua');
    expect(readGrid(['vintem', 'vintem', 'vintem', 'olho', 'olho', 'olho', 'agua', 'natureza', 'agua'], pats)).toMatchObject({ vintem: 1, olho: 1, patrons: {} });
  });

  it('cada bênção de um padrinho puxa o símbolo dele, e as chances de uma casa somam 1', () => {
    const plain = rodaWeights(pats, {}), pulled = rodaWeights(pats, { agua: 4 });
    expect(pulled.agua).toBeCloseTo(plain.agua! * (1 + 4 * DREAM.roda.buildPull));
    expect(pulled.natureza).toBe(plain.natureza);
    const odds = rodaOdds(pulled);
    expect(Object.values(odds.symbol).reduce((a, b) => a + b!, 0)).toBeCloseTo(1, 10);
    expect(odds.symbol.agua!).toBeGreaterThan(odds.symbol.natureza!);
  });

  it('o painel de chances bate com 100 mil giros de verdade', () => {
    const w = rodaWeights(pats, { natureza: 3, tempestade: 1 }), odds = rodaOdds(w), r = makeRng(2024), N = 100_000;
    let any = 0, bless = 0, jack = 0;
    for (let i = 0; i < N; i++) {
      const read = readGrid(spinGrid(r, w), pats);
      if (read.lines.length) any++;
      if (Object.values(read.patrons).some((n) => n! > 0)) bless++;
      if (read.jackpot) jack++;
    }
    expect(Math.abs(any / N - odds.anyLine)).toBeLessThan(0.01);
    expect(Math.abs(bless / N - odds.blessing)).toBeLessThan(0.01);
    expect(Math.abs(jack / N - odds.jackpot)).toBeLessThan(0.002);
    expect(odds.blessing).toBeLessThan(odds.anyLine);
    expect(odds.jackpot).toBeGreaterThan(0);
  }, 30_000);
});

describe('Roda do Saci: na noite', () => {
  it('só aparece depois de libertar o Saci, uma por trecho no máximo e do meio do caminho em diante', () => {
    const base = { chapters: [1, 2, 3], patrons: ELEMENT_ORDER.slice(0, 3), level: 30 };
    let seen = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const t of dreamNight(seed * 7919, base).trechos) expect(t.nodes.some((n) => n.kind === 'roda')).toBe(false);
      for (const t of dreamNight(seed * 7919, { ...base, roda: true }).trechos) {
        const rodas = t.nodes.filter((n) => n.kind === 'roda');
        expect(rodas.length).toBeLessThanOrEqual(1);
        for (const n of rodas) { expect(n.step).toBeGreaterThanOrEqual(3); seen++; }
      }
    }
    expect(seen).toBeGreaterThan(100);
    expect(night(dreamer(30, 2)).map.trechos.flatMap((t) => t.nodes).some((n) => n.kind === 'roda')).toBe(false);
  });

  it('o primeiro giro é grátis, os outros custam 20, 40 e 80, e depois acabou', () => {
    const p = dreamer(); night(p);
    const w = atRoda(p), run = p.dream.run!;
    expect([w.patrons.length, w.pulos, w.assobios, w.free]).toEqual([DREAM.roda.patrons, 1, 0, 1]);
    const paid: number[] = [];
    for (let i = 0; i < 6; i++) {
      const cost = rodaCost(run, w);
      if (cost == null) break;
      const before = run.vintem;
      expect(spinRoda(p)).toBe(true);
      expect(spinRoda(p)).toBe(false); // tem de receber antes de girar de novo
      paid.push(before - run.vintem);
      expect(collectRoda(p)).not.toBeNull();
      if (run.pending?.kind === 'bencao') chooseBlessingOffer(p, 0);
    }
    expect(paid).toEqual([0, 20, 40, 80]);
    expect(rodaCost(run, w)).toBeNull();
    expect(p.dream.spins).toBe(4);
    expect(leaveNode(p)).toBe(true);
    expect(run.pending).toBeNull();
    expect(reachable(run).length).toBeGreaterThan(0);
  });

  it('sem vinténs não gira; a Moeda Furada, o Fiado do Saci e o Dado Viciado mexem no custo', () => {
    const p = wear(dreamer(), { fiadoSaci: 2 }); night(p);
    p.dream.run!.amulets.push('moedaFurada', 'dadoViciado');
    const w = atRoda(p, 0), run = p.dream.run!;
    expect(w.free).toBe(2 + 2);
    for (let i = 0; i < 4; i++) { expect(spinRoda(p)).toBe(true); collectRoda(p); if (run.pending?.kind === 'bencao') chooseBlessingOffer(p, 0); }
    run.vintem = 0;
    expect(rodaCost(run, w)).toBe(10);
    expect(spinRoda(p)).toBe(false);
  });

  it('o Pulo gira de novo uma coluna só; o Assobio põe um Gorro numa casa', () => {
    const p = wear(dreamer(), { mocaVento: 1, assobiador: 2 }); night(p);
    const w = atRoda(p);
    expect([w.pulos, w.assobios]).toEqual([2, 2]);
    expect(rodaPulo(p, 0)).toBe(false); // nada na mesa ainda
    spinRoda(p);
    const before = w.grid!.slice();
    expect(rodaPulo(p, 1)).toBe(true);
    for (const c of [0, 2, 3, 5, 6, 8]) expect(w.grid![c]).toBe(before[c]);
    expect(w.pulos).toBe(1);
    const cell = w.grid!.findIndex((s) => s !== 'gorro');
    expect(rodaAssobio(p, cell)).toBe(true);
    expect(w.grid![cell]).toBe('gorro');
    expect(rodaAssobio(p, cell)).toBe(false); // já é Gorro
    expect(w.assobios).toBe(1);
    collectRoda(p);
    expect(rodaPulo(p, 0)).toBe(false); // giro já recebido
  });

  it('linha de padrinho dá bênção dele (rara com duas), linha de vinténs paga e linha de Olhos amaldiçoa e dobra as Lembranças', () => {
    const p = dreamer(); night(p);
    const w = atRoda(p, 100), run = p.dream.run!, el = w.patrons[0];
    spinRoda(p);
    w.grid = [el, el, el, el, 'vintem', 'olho', el, 'vintem', 'olho']; // linha de cima e coluna da esquerda
    const out = collectRoda(p)!;
    expect(out.lines).toHaveLength(2);
    expect(out.blessings).toHaveLength(1);
    expect(BLESSINGS[out.blessings[0]].patron).toBe(el);
    expect(BLESSINGS[out.blessings[0]].tier).toBeGreaterThanOrEqual(2);
    expect(run.blessings).toEqual(out.blessings);
    spinRoda(p);
    w.grid = ['vintem', 'vintem', 'vintem', 'olho', 'olho', 'olho', el, 'agua', 'natureza'].map((s) => s as RodaSymbol);
    const coins = run.vintem, pay = collectRoda(p)!;
    expect(pay.vintem).toBe(DREAM.roda.vintemPay);
    expect(run.vintem).toBe(coins + DREAM.roda.vintemPay);
    expect(pay.cursed).toBe(true);
    expect(run.curse).toEqual(DREAM.roda.curse);
    leaveNode(p);
    /* as Lembranças do resto do trecho vêm em dobro */
    jump(p, 'combate');
    expect(settleNode(p, outcome(p))!.memories).toBe(DREAM.memories.combate * 2);
  });

  it('depois de três giros sem linha, o próximo fecha uma', () => {
    const p = dreamer(); night(p);
    const w = atRoda(p), run = p.dream.run!;
    for (let k = 0; k < 40; k++) {
      run.dry = DREAM.roda.pityAfter; w.free = 1; w.collected = true;
      expect(spinRoda(p)).toBe(true);
      expect(readGrid(w.grid!, w.patrons).lines.length).toBeGreaterThan(0);
      collectRoda(p);
      if (run.pending?.kind === 'bencao') chooseBlessingOffer(p, 0);
      expect(run.dry).toBe(0);
    }
    /* e um giro sem linha conta para o azar */
    w.free = 1; spinRoda(p); w.grid = ['agua', 'vintem', 'olho', 'olho', 'natureza', 'vintem', 'vintem', 'olho', 'agua']; collectRoda(p);
    expect(run.dry).toBe(1);
  });

  it('sorte grande: desperta na hora uma bênção à escolha, e a Roda volta depois', () => {
    const p = dreamer(); night(p);
    const w = atRoda(p), run = p.dream.run!, el = w.patrons[0];
    run.blessings = ['furia', 'vento'];
    spinRoda(p);
    w.grid = Array(9).fill(el);
    const out = collectRoda(p)!;
    expect(out.jackpot).toBe(true);
    expect(p.dream.jackpots).toBe(1);
    const pend = run.pending as Extract<Pending, { kind: 'bencao' }>;
    expect(pend.kind).toBe('bencao');
    for (const b of pend.options) expect(BLESSINGS[b].kind).toBe('desperta');
    const got = chooseBlessingOffer(p, 0)!;
    expect(run.blessings).toContain(got);
    expect(p.dream.awakened).toBe(1);
    expect(run.pending).toBe(w); // de volta à Roda
  });

  it('uma noite inteira com Rodas no caminho chega ao fim, e sempre igual', () => {
    const a = playNight(dreamer(), CHOICE, 31337, { ...HUMAN, seed: 4 }), b = playNight(dreamer(), CHOICE, 31337, { ...HUMAN, seed: 4 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  }, 120_000);
});

describe('Presságios', () => {
  it('doze Presságios; o Peso é a soma dos graus e rende Lembranças até o teto', () => {
    expect(OMEN_ORDER).toHaveLength(12);
    for (const id of OMEN_ORDER) { expect(UI_ICON_KEYS).toContain(OMENS[id].icon); for (let g = 1; g <= OMENS[id].grades; g++) expect(OMENS[id].desc(g).length).toBeGreaterThan(10); }
    expect(omenWeight({})).toBe(0);
    expect(omenWeight({ luaCheia: 2, fome: 1, chefeTeimoso: 1 })).toBe(2 + 2 + 3);
    expect(omenWeight({ luaCheia: 99 })).toBe(3); // grau acima do máximo não vale
    expect(omenMemories({ fome: 3 })).toBeCloseTo(6 * OMEN.memoriesPerPoint);
    const all = Object.fromEntries(OMEN_ORDER.map((id) => [id, OMENS[id].grades]));
    expect(omenWeight(all)).toBeGreaterThanOrEqual(OMEN.marks[3]);
    expect(omenMemories(all)).toBe(OMEN.maxBonus);
    expect(Object.keys(cleanOmens(all, true)).sort()).toEqual(['bando', 'chefeTeimoso', 'fome', 'luaCheia', 'maoPesada']);
  });

  it('os de combate deixam os monstros mais fortes na sala', () => {
    const stage = STAGE_BY_ID.get('3-11')!, stats = deriveStats(referenceProfile(30));
    const world = (omens: OmenPick): World => createWorld({ stageId: stage.id, level: 30, rooms: stage.rooms, stats, seed: 9, foes: omenFoes(omens) });
    const base = world({}), hard = world({ luaCheia: 2, fome: 1, maoPesada: 3, bando: 2, chefeTeimoso: 1 });
    const a = spawnEnemy(base, { kind: 'calango', x: 600, y: 400 }), b = spawnEnemy(hard, { kind: 'calango', x: 600, y: 400 });
    expect(b.maxHp / a.maxHp).toBeCloseTo(1 + 2 * OMEN_FOES.hp, 1);
    expect(b.dmg / a.dmg).toBeCloseTo(1 + OMEN_FOES.damage);
    expect(b.windupMult / a.windupMult).toBeCloseTo(1 / (1 + 3 * OMEN_FOES.haste));
    const ea = spawnEnemy(base, { kind: 'calango', x: 600, y: 400, elite: true, mods: ['veloz'] }), eb = spawnEnemy(hard, { kind: 'calango', x: 600, y: 400, elite: true, mods: ['veloz'] });
    expect(eb.mods.length).toBe(ea.mods.length + 2);
    expect(new Set(eb.mods).size).toBe(eb.mods.length);
    const ba = spawnEnemy(base, { kind: 'saci', x: 600, y: 400, elite: true }), bb = spawnEnemy(hard, { kind: 'saci', x: 600, y: 400, elite: true });
    expect(bb.maxHp / ba.maxHp).toBeCloseTo((1 + 2 * OMEN_FOES.hp) * (1 + OMEN_FOES.bossHp), 1);
  });

  it('a primeira noite de todas não aceita Presságios', () => {
    const p = dreamer(); p.dream.nights = 0;
    expect(night(p, { fome: 3 }).omens).toEqual({});
  });

  it('Sem Padrinho tira o passo de altares; Poucas Velas seca a Fonte; Feira Cara encarece', () => {
    const p = dreamer(), run = night(p, { semPadrinho: 1, poucasVelas: 1, feiraCara: 2 });
    for (const t of run.map.trechos) expect(t.nodes.filter((n) => n.step === DREAM.altarStep).every((n) => n.kind === 'combate')).toBe(true);
    expect(fountainHeal(run)).toBeCloseTo(DREAM.fountainHeal / 2);
    run.omens.poucasVelas = 2;
    expect(fountainHeal(run)).toBe(0);
    expect(feiraPrice(run, 'cura')).toBe(Math.round(DREAM.price.heal * 1.6));
  });

  it('Pressa: passou do tempo de luta do trecho, os monstros batem mais forte até o chefe', () => {
    const p = dreamer(), run = night(p, { pressa: 2, fome: 1 });
    enterNode(p, 0);
    expect(dreamContext(run).foes.damage).toBeCloseTo(1 + OMEN_FOES.damage);
    settleNode(p, outcome(p, { time: HURRY_SECONDS[2] + 1 }));
    expect(isLate(run)).toBe(true);
    expect(dreamContext(run).foes.damage).toBeCloseTo((1 + OMEN_FOES.damage) * 1.5);
    jump(p, 'chefe'); settleNode(p, outcome(p));
    expect(run.trecho).toBe(1);
    expect(isLate(run)).toBe(false);
  });

  it('Esquecimento: em cada trecho um feitiço fica de fora da sala, mas quem só tem um não esquece', () => {
    const p = dreamer(), run = night(p, { esquecimento: 1 });
    const slot = forgottenSlot(run);
    expect(slot).toBeGreaterThanOrEqual(0);
    enterNode(p, 0);
    const loadout = dreamContext(run).profile.loadout;
    expect(loadout[slot]).toBeNull();
    expect(loadout.filter(Boolean)).toHaveLength(2);
    expect(runStats(run).loadout.filter(Boolean)).toHaveLength(3); // fora da sala, o herói continua inteiro
    const q = dreamer();
    const one = startNight(q, { ...CHOICE, spells: ['dardo', null, null], omens: { esquecimento: 1 } }, 7)!;
    expect(forgottenSlot(one)).toBe(-1);
  });

  it('Juízo: perder uma Provação acaba com a noite', () => {
    const p = dreamer(); night(p, { juizo: 1 });
    jump(p, 'provacao', 'ligeiro');
    const res = settleNode(p, outcome(p, { trial: 'perdido' }))!;
    expect(res.end?.won).toBe(false);
    expect(p.dream.run).toBeNull();
  });

  it('o Peso aumenta as Lembranças e fica registrado ao vencer', () => {
    const p = dreamer(), run = night(p, { luaCheia: 3, fome: 3, maoPesada: 2 });
    expect(memoryBonus(p, run)).toBeCloseTo(1 + 11 * OMEN.memoriesPerPoint);
    for (let i = 0; i < 3; i++) { jump(p, 'chefe'); settleNode(p, outcome(p)); if (p.dream.run?.pending) p.dream.run.pending = null; }
    expect(p.dream.wins).toBe(1);
    expect(p.dream.bestWeight).toBe(11);
  });

  it('na campanha, só em fase com 3 estrelas: mais ouro, raridade melhor e o Peso anotado', () => {
    const play = (omens: number, stars: boolean) => {
      const p = referenceProfile(30);
      p.stages['3-4'] = { cleared: true, stars: [true, true, stars], bestTime: 40, pity: 0, clears: 2 };
      const r = applyOutcome(p, { stageId: '3-4', won: true, time: 50, deaths: 0, roomsCleared: 5, kills: 30, perfects: 0, hitsTaken: 2, omens });
      return { gold: r.gold, rarity: r.items.reduce((n, it) => n + it.rarity, 0), omen: p.stages['3-4'].omen };
    };
    const plain = play(0, true), hard = play(10, true), denied = play(10, false);
    expect(hard.gold).toBeGreaterThan(plain.gold * 1.25);
    expect(hard.omen).toBe(10);
    expect(plain.omen).toBeUndefined();
    expect(denied.omen).toBeUndefined();
    expect(denied.gold).toBe(play(0, false).gold);
    /* em muitas fases, a raridade média sobe */
    let a = 0, b = 0;
    for (let seed = 1; seed <= 60; seed++) {
      for (const [omens, add] of [[0, (n: number) => { a += n; }], [10, (n: number) => { b += n; }]] as [number, (n: number) => void][]) {
        const p = referenceProfile(30); p.seed = seed * 97; p.nextItemId = seed * 1000;
        p.stages['3-4'] = { cleared: true, stars: [true, true, true], bestTime: 40, pity: 0, clears: 2 };
        add(applyOutcome(p, { stageId: '3-4', won: true, time: 50, deaths: 0, roomsCleared: 5, kills: 30, perfects: 0, hitsTaken: 2, omens }).items.reduce((n, it) => n + it.rarity, 0));
      }
    }
    expect(b).toBeGreaterThan(a);
  });
});

describe('Cordéis', () => {
  it('vinte folhetos, com custo de 1 a 5, três níveis crescentes e ícone', () => {
    expect(CORDEL_ORDER).toHaveLength(20);
    for (const id of CORDEL_ORDER) {
      const d = CORDEIS[id];
      expect(UI_ICON_KEYS).toContain(d.icon);
      expect(d.values[0]).toBeLessThan(d.values[2]);
      expect(d.values[1]).toBeGreaterThanOrEqual(d.values[0]);
      expect(new Set(d.values.map((v) => d.desc(v))).size).toBe(3);
      expect(cordelPrice(id, 1)).toBeLessThan(cordelPrice(id, 2));
      expect(cordelPrice(id, 2)).toBeLessThan(cordelPrice(id, 3));
    }
    for (const c of [1, 2, 3, 4, 5]) expect(CORDEL_ORDER.filter((id) => CORDEIS[id].cost === c).length).toBeGreaterThanOrEqual(3);
  });

  it('comprar custa Lembranças, sobe até o nível 3, e equipar respeita o Fôlego', () => {
    const p = dreamer();
    expect(buyCordel(p, 'vaqueiro')).toBe(false);
    expect(toggleCordel(p, 'vaqueiro')).toBe(false); // não tem
    p.dream.memories = 2000;
    for (let lv = 1; lv <= 3; lv++) { const cost = cordelNext(p, 'vaqueiro')!; const before = p.dream.memories; expect(buyCordel(p, 'vaqueiro')).toBe(true); expect(p.dream.memories).toBe(before - cost); expect(p.cordeis.levels.vaqueiro).toBe(lv); }
    expect(cordelNext(p, 'vaqueiro')).toBeNull();
    expect(buyCordel(p, 'vaqueiro')).toBe(false);
    buyCordel(p, 'romanceFeira'); buyCordel(p, 'peleja');
    expect(breath(p)).toBe(CORDEL.breath);
    expect(toggleCordel(p, 'vaqueiro')).toBe(true);       // 4 de 5
    expect(toggleCordel(p, 'romanceFeira')).toBe(false);  // 4 + 2 não cabe
    expect(toggleCordel(p, 'peleja')).toBe(true);         // 4 + 1
    expect(equippedCordeis(p)).toEqual(['vaqueiro', 'peleja']);
    expect(toggleCordel(p, 'vaqueiro')).toBe(true);
    expect(equippedCordeis(p)).toEqual(['peleja']);
    p.village.casaDeCordel = 5;
    expect(breath(p)).toBe(20);
    /* um save com folheto equipado que não cabe mais (ou que não existe) não quebra a noite */
    p.cordeis.equipped = ['peleja', 'vaqueiro', 'fantasma' as CordelId, 'peleja'];
    p.village.casaDeCordel = 0;
    expect(equippedCordeis(p)).toEqual(['peleja', 'vaqueiro']);
    expect(cordelCost(equippedCordeis(p))).toBeLessThanOrEqual(breath(p));
  });

  it('os que mexem no herói: vida, dano, recarga, crítico e poções', () => {
    const plain = runStats(night(dreamer()));
    const p = wear(dreamer(), { peleja: 3, valentao: 2, viola: 1, donzela: 3, sacoSemFundo: 2 }), run = night(p), s = runStats(run);
    expect(s.maxHp / plain.maxHp).toBeCloseTo(1.1, 2);
    expect(s.damageMult / plain.damageMult).toBeCloseTo(1.08);
    expect(s.spellPower / plain.spellPower).toBeCloseTo(1.08);
    expect(s.cooldownMult / plain.cooldownMult).toBeCloseTo(0.95);
    expect(s.critChance - plain.critChance).toBeCloseTo(0.1);
    expect(s.potions).toBe(plain.potions + 2);
    expect(run.potions).toBe(s.potions);
    /* e a sala recebe o mesmo herói */
    enterNode(p, 0);
    const ctx = dreamContext(run);
    expect(deriveStats(ctx.profile, ctx.carry.blessings, ctx.amulets, ctx.boost).maxHp).toBe(s.maxHp);
  });

  it('os que mexem na noite fazem o que dizem', () => {
    const q = wear(dreamer(), { vaqueiro: 2, rezadeira: 1 }), other = night(q);
    expect(other.revives).toBe(2);
    expect(fountainHeal(other)).toBeCloseTo(DREAM.fountainHeal + 0.08);
    const p = wear(dreamer(), { cantador: 2, romanceFeira: 3, boiMisterioso: 2, lampiao: 1, matuto: 3, princesa: 3, saoSarue: 1 }), run = night(p);
    expect(Object.keys(run.cordeis)).toHaveLength(7); // 1+2+2+3+3+4+5 = 20 de Fôlego
    expect(run.vintem).toBe(18);
    expect(feiraPrice(run, 'cura')).toBe(Math.round(DREAM.price.heal * 0.8));
    expect(memoryBonus(p, run)).toBeCloseTo(1.15 + CORDEL.fullBonus); // a Princesa, mais o Cordel Completo (há um folheto de cada custo)
    /* São Saruê paga a sala sem golpe; Lampião mostra um amuleto a mais */
    enterNode(p, 0);
    expect(settleNode(p, outcome(p, { hitsTaken: 0 }))!.vintem).toBe(DREAM.vintem.combate + 6);
    jump(p, 'elite'); settleNode(p, outcome(p));
    expect((run.pending as Extract<Pending, { kind: 'amuleto' }>).options).toHaveLength(3);
    run.pending = null;
    /* o Matuto engorda todo causo */
    run.pending = { kind: 'causo', id: 'matinta', outcomes: [[]] };
    const coins = run.vintem; chooseCauso(p, 0);
    expect(run.vintem).toBe(coins + 30);
    /* o Boi Misterioso cura mais depois do chefe, e o Cantador paga de novo no trecho seguinte */
    const before = run.vintem;
    jump(p, 'chefe'); settleNode(p, outcome(p, { left: { hpFrac: 0.2, potions: 0, supremo: 0, revives: 0, altarDry: 0 } }));
    expect(run.hpFrac).toBeCloseTo(0.2 + DREAM.bossHeal + 0.2);
    expect(run.revives).toBe(0);
    expect(run.vintem).toBe(before + DREAM.vintem.chefe + 18);
  });

  it('Malasartes barateia só a primeira compra de cada Feira', () => {
    const p = wear(dreamer(), { malasartes: 1 }), run = night(p);
    const t = currentTrecho(run), fair = t.nodes.find((n) => n.kind === 'feira')!, before = t.nodes.find((n) => n.next.includes(fair.id))!;
    run.at = before.id; run.done = true; run.vintem = 500;
    enterNode(p, fair.id);
    const f = run.pending as Extract<Pending, { kind: 'feira' }>, b0 = f.blessings[0]!, b1 = f.blessings[1]!;
    expect(feiraPrice(run, 'bencao', b0)).toBe(Math.round(DREAM.price.blessing[BLESSINGS[b0].tier] * 0.7));
    expect(feiraPrice(run, 'cura')).toBe(DREAM.price.heal); // serviço não entra
    expect(buyBlessing(p, 0)).toBe(true);
    expect(feiraPrice(run, 'bencao', b1)).toBe(DREAM.price.blessing[BLESSINGS[b1].tier]);
  });

  it('o Pavão Misterioso faz os primeiros altares do trecho trazerem rara ou melhor', () => {
    const p = wear(dreamer(60, 7), { pavao: 1 }), run = night(p);
    jump(p, 'altar');
    const id = currentStageId(run)!;
    expect(parseDreamId(id)!.extra.endsWith('R')).toBe(true);
    const stage = dreamStage(id)!;
    expect(stage.rooms[0].altar?.minTier).toBe(2);
    const w = createWorld({ stageId: id, level: stage.level, rooms: stage.rooms, stats: runStats(run), seed: 5, carry: dreamContext(run).carry });
    for (let k = 0; k < 20; k++) { w.altarDry = 0; for (const b of rollBlessings(w, stage.rooms[0].altar!)) expect(BLESSINGS[b].tier).toBeGreaterThanOrEqual(2); }
    /* o segundo altar do trecho já é comum de novo */
    settleNode(p, outcome(p, { blessings: [...run.blessings, 'furia' as BlessingId] }));
    jump(p, 'altar');
    expect(parseDreamId(currentStageId(run)!)!.extra.endsWith('R')).toBe(false);
  });

  it('o Afilhado dos Encantados começa a noite com uma escolha, depois da do Rancho', () => {
    const p = wear(dreamer(), { encantado: 2 }); p.village.rancho = 3;
    const run = night(p), first = run.pending as Extract<Pending, { kind: 'bencao' }>;
    expect(first.options.every((b) => BLESSINGS[b].tier === 1)).toBe(true);
    chooseBlessingOffer(p, 0);
    const second = run.pending as Extract<Pending, { kind: 'bencao' }>;
    expect(second.kind).toBe('bencao');
    expect(second.options.every((b) => BLESSINGS[b].tier === 2)).toBe(true);
    chooseBlessingOffer(p, 0);
    expect(run.pending).toBeNull();
    expect(run.blessings).toHaveLength(2);
  });

  it('um folheto de cada custo, de 1 a 5, é o Cordel Completo', () => {
    expect(isFullCordel(['peleja', 'viola', 'pavao', 'princesa'])).toBe(false);
    expect(isFullCordel(['peleja', 'viola', 'pavao', 'princesa', 'saoSarue'])).toBe(true);
    const p = wear(dreamer(), { peleja: 1, viola: 1, pavao: 1, vaqueiro: 1, saoSarue: 1 }), run = night(p);
    expect(cordel(run, 'vaqueiro')).toBe(1);
    expect(memoryBonus(p, run)).toBeCloseTo(1 + CORDEL.fullBonus);
  });
});

describe('Aspectos de arma', () => {
  /** Uma sala com o herói armado, um inimigo na frente e sem sorte no crítico. */
  function arena(weapon: WeaponKind, aspect: AspectId | null): { w: World; e: Enemy } {
    const p = referenceProfile(30, weapon === 'arco' || weapon === 'peixeiras', weapon);
    p.companion = null; p.talents = {}; p.loadout = ['dardo', 'jato', 'faisca'];
    if (aspect) p.aspects = { owned: [aspect], equipped: { [weapon]: aspect } };
    const s = STAGE_BY_ID.get('1-3')!, stats = deriveStats(p);
    /* sem crítico e sem gema na arma, para o elemento do golpe ser só o do Aspecto */
    stats.critChance = 0; stats.weaponGem = null;
    const w = createWorld({ stageId: s.id, level: 30, rooms: [{ type: 'combat', waves: [], bg: 0 }], stats, seed: 3 });
    w.pet = null; w.player.x = 500; w.player.y = 400;
    const e = spawnEnemy(w, { kind: 'tronco', x: 580, y: 400 });
    e.state = 'chase'; e.stateT = 1; e.cd = 99;
    return { w, e };
  }
  const run = (w: World, seconds: number, inp: (i: number) => Partial<Input>) => { for (let i = 0; i < Math.round(seconds / TICK); i++) step(w, { ...idle, aimX: 900, aimY: 400, ...inp(i) }, TICK); };
  const heavy = (w: World) => run(w, 2.2, (i) => ({ altHeld: i < 90 }));
  const parry = (w: World, e: Enemy) => { w.player.state = 'block'; w.player.blockT = 0; w.player.aim = 0; hurtPlayer(w, 20, e.x, e.y, 0, { src: e, melee: true }); };

  it('doze Aspectos, dois por arma, e só vale o que foi comprado para a arma em uso', () => {
    expect(ASPECT_ORDER).toHaveLength(12);
    for (const weapon of ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'] as WeaponKind[]) expect(aspectsOf(weapon)).toHaveLength(2);
    const p = referenceProfile(30);
    expect(deriveStats(p).aspect).toBeNull();
    expect(buyAspect(p, 'facaoCurupira')).toBe(false); // sem Lembranças
    p.dream.memories = 500;
    expect(buyAspect(p, 'facaoCurupira')).toBe(true);
    expect(p.dream.memories).toBe(500 - ASPECTS.facaoCurupira.cost);
    expect(buyAspect(p, 'facaoCurupira')).toBe(false); // já tem
    expect(deriveStats(p).aspect).toBe('facaoCurupira');
    expect(equipAspect(p, 'facao', 'facaoVaqueiro')).toBe(false); // não comprou
    expect(equipAspect(p, 'arco', 'facaoCurupira')).toBe(false);  // arma errada
    expect(equipAspect(p, 'facao', null)).toBe(true);
    expect(deriveStats(p).aspect).toBeNull();
    /* o Sonho leva o Aspecto da arma escolhida */
    const d = dreamer(); d.aspects = { owned: ['facaoVaqueiro'], equipped: { facao: 'facaoVaqueiro' } };
    expect(runStats(night(d)).aspect).toBe('facaoVaqueiro');
    /* e um save antigo, sem Aspectos, continua abrindo */
    const old = JSON.parse(JSON.stringify(referenceProfile(20))) as Record<string, unknown>;
    old.version = 3; delete old.aspects; delete old.cordeis;
    const m = migrate(old as unknown as Profile);
    expect(m.aspects).toEqual({ owned: [], equipped: {} });
    expect(m.cordeis).toEqual({ levels: {}, equipped: [] });
  });

  it('facão do Curupira: aparar fere e prende quem está em volta', () => {
    const plain = arena('facao', null), asp = arena('facao', 'facaoCurupira');
    parry(plain.w, plain.e); parry(asp.w, asp.e);
    expect(plain.e.hp).toBe(plain.e.maxHp);
    expect(asp.e.hp).toBeLessThan(asp.e.maxHp);
    expect(asp.e.rootT).toBeGreaterThan(0);
  });

  it('facão do Vaqueiro: aparar dá uma investida que fere quem está no caminho', () => {
    const { w, e } = arena('facao', 'facaoVaqueiro');
    parry(w, e);
    expect(w.player.x).toBeGreaterThan(560);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('arco da Iara molha em volta do alvo; arco do Carcará marca o alvo', () => {
    const shoot = (aspect: AspectId | null) => { const a = arena('arco', aspect); a.e.x = 760; const near = spawnEnemy(a.w, { kind: 'tronco', x: 760, y: 470 }); near.state = 'chase'; near.cd = 99; heavy(a.w); return { ...a, near }; };
    const plain = shoot(null), iara = shoot('arcoIara'), carcara = shoot('arcoCarcara');
    expect(plain.e.hp).toBeLessThan(plain.e.maxHp); // o tiro carregado acertou
    expect([plain.near.wetT, plain.e.markT]).toEqual([0, 0]);
    expect(iara.near.wetT).toBeGreaterThan(0);
    expect(carcara.e.markT).toBeGreaterThan(0);
  });

  it('borduna do Mapinguari abre uma fenda em linha; a do Pajé cura por inimigo acertado', () => {
    const swing = (aspect: AspectId | null) => { const a = arena('borduna', aspect); const far = spawnEnemy(a.w, { kind: 'tronco', x: 800, y: 400 }); far.state = 'chase'; far.cd = 99; a.w.player.hp = Math.round(a.w.stats.maxHp * 0.5); heavy(a.w); return { ...a, far }; };
    const plain = swing(null), fenda = swing('bordunaMapinguari'), paje = swing('bordunaPaje');
    expect(plain.e.hp).toBeLessThan(plain.e.maxHp);
    expect(plain.far.hp).toBe(plain.far.maxHp);
    expect(fenda.far.hp).toBeLessThan(fenda.far.maxHp);
    expect(paje.w.player.hp).toBeGreaterThan(plain.w.player.hp);
  });

  it('zagaia do Boitatá deixa fogo no caminho; a do Pescador molha e puxa', () => {
    const plain = arena('zagaia', null), fogo = arena('zagaia', 'zagaiaBoitata'), pesca = arena('zagaia', 'zagaiaPescador');
    for (const a of [plain, fogo, pesca]) a.e.x = 640;
    run(plain.w, 1.6, (i) => ({ altHeld: i < 90 })); run(fogo.w, 1.6, (i) => ({ altHeld: i < 90 }));
    expect(plain.w.zones.filter((z) => z.kind === 'fire')).toHaveLength(0);
    expect(fogo.w.zones.filter((z) => z.kind === 'fire').length).toBeGreaterThanOrEqual(3);
    /* o Pescador: confere logo depois da estocada */
    for (let i = 0; i < 200 && pesca.e.wetT === 0; i++) step(pesca.w, { ...idle, aimX: 900, aimY: 400, altHeld: i < 90 }, TICK);
    expect(pesca.e.wetT).toBeGreaterThan(0);
    expect(pesca.e.x).toBeLessThan(640);
  });

  it('peixeiras do Saci ligam o redemoinho da esquiva perfeita; as de Lampião arremessam no último corte', () => {
    const p = referenceProfile(30, true, 'peixeiras'); p.aspects = { owned: ['peixeirasSaci'], equipped: { peixeiras: 'peixeirasSaci' } };
    expect(deriveStats(p).passives.perfectWhirl).toBe(true);
    expect(deriveStats(referenceProfile(30, true, 'peixeiras')).passives.perfectWhirl).toBe(false);
    const count = (aspect: AspectId | null) => { const { w } = arena('peixeiras', aspect); let seen = 0; for (let i = 0; i < 60 * 4; i++) { step(w, { ...idle, aimX: 900, aimY: 400, attackHeld: true }, TICK); seen = Math.max(seen, w.projectiles.filter((pr) => pr.kind === 'arrow').length); } return seen; };
    expect(count(null)).toBe(0);
    expect(count('peixeirasLampiao')).toBeGreaterThanOrEqual(2);
  });

  it('cajado da Cuca alterna os elementos dos feitiços; o da Benzedeira estoura em volta', () => {
    const elements = (aspect: AspectId | null) => { const { w, e } = arena('cajado', aspect); e.x = 2000; const got: string[] = []; let last = -1; for (let i = 0; i < 60 * 3; i++) { step(w, { ...idle, aimX: 900, aimY: 400, attackHeld: true }, TICK); for (const pr of w.projectiles) if (pr.kind === 'staff' && pr.id > last) { last = pr.id; got.push(String(pr.element)); } } return got; };
    expect(new Set(elements(null)).size).toBe(1);
    const cuca = elements('cajadoCuca');
    expect(cuca.slice(0, 3)).toEqual(['natureza', 'agua', 'tempestade']);
    expect(cuca[3]).toBe('natureza');
    const splash = (aspect: AspectId | null) => { const a = arena('cajado', aspect); a.e.x = 700; const near = spawnEnemy(a.w, { kind: 'tronco', x: 700, y: 460 }); near.state = 'chase'; near.cd = 99; for (let i = 0; i < 60 * 3 && a.e.hp === a.e.maxHp; i++) step(a.w, { ...idle, aimX: 900, aimY: 400, attackHeld: true }, TICK); return near; };
    expect(splash(null).hp).toBe(splash(null).maxHp);
    const near = splash('cajadoBenzedeira');
    expect(near.hp).toBeLessThan(near.maxHp);
  });
});
