/** Etapa 4, fase 3 (docs/gdd/09 e 10): o Sonho. O mapa da noite, as salas de cada nó, as regras entre uma sala e outra e o que se traz ao acordar. */
import { describe, expect, it } from 'vitest';
import { UI_ICON_KEYS } from '../src/art/uiicons';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { AMULETS, AMULET_ORDER, AMULET_RARITY, type AmuletId } from '../src/data/amulets';
import { CAUSOS, CAUSO_ORDER, type DreamEffect } from '../src/data/causos';
import { BLESSINGS, ELEMENT_ORDER, STAGE_ONLY_BLESSINGS, type BlessingId } from '../src/data/content';
import { DREAM, dreamNight, dreamStage, isDreamId, nodeStageId, parseDreamId, type DreamNode, type NodeKind, type Trecho } from '../src/data/dream';
import { STAGES } from '../src/data/stages';
import { findStage } from '../src/data/tower';
import { BUILDINGS, BUILDING_ORDER } from '../src/data/village';
import { achievementProgress, checkAchievements } from '../src/meta/achievements';
import {
  abandonNight, build, buildCost, buyAmulet, buyBlessing, buyHeal, chooseAmulet, chooseBlessingOffer, chooseCauso, currentStageId, currentTrecho, defaultChoice, dreamContext, enterNode,
  feiraPrice, fountainHeal, isDreamUnlocked, leaveNode, memoryBonus, offerable, reachable, removeBlessing, rerollFeira, runStats, settleNode, startNight, useFountain, validChoice,
  type DreamRun, type NightChoice, type Pending,
} from '../src/meta/dream';
import { PROFILE_VERSION, migrate, newProfile, type Profile } from '../src/meta/profile';
import type { StageOutcome } from '../src/meta/rewards';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { HUMAN } from '../src/sim/bot';
import { playNight, playNode } from './sonho-bot';

const DAY = new Date(2026, 5, 10, 12);
const SETUP = { chapters: [1, 2, 3], patrons: ELEMENT_ORDER.slice(0, 3), level: 30 };
const CHOICE: NightChoice = { weapon: 'facao', spells: ['dardo', 'sementes', 'cipo'], companion: 'capivara', supremo: 'natureza' };

/** Um perfil com o Sonho aberto: `chapters` capítulos vencidos e os padrinhos deles. */
function dreamer(level = 30, chapters = 3, seed = 5): Profile {
  const p = newProfile(seed);
  p.level = level;
  for (const s of STAGES) if (s.chapter <= chapters) p.stages[s.id] = { cleared: true, stars: [true, true, true], bestTime: 60, pity: 0, clears: 1 };
  p.supremos = ELEMENT_ORDER.slice(0, chapters); p.supremo = p.supremos[0];
  p.companions.capivara = { level: 1 }; p.companion = 'capivara';
  p.dream.nights = 1; // a primeira noite de todas é curta; os testes querem a noite inteira
  return p;
}
function night(p: Profile, seed = 4242): DreamRun {
  const run = startNight(p, CHOICE, seed);
  if (!run) throw new Error('a noite não começou');
  return run;
}
/** Resultado de uma sala vencida, como a cena devolveria. */
function outcome(p: Profile, over: Partial<StageOutcome> = {}): StageOutcome {
  const run = p.dream.run!;
  return {
    stageId: currentStageId(run) ?? 'x', won: true, time: 30, deaths: 0, roomsCleared: 1, kills: 6, perfects: 0, hitsTaken: 0, blessings: run.blessings.slice(), chests: 0, foundGold: 0,
    left: { hpFrac: 0.8, potions: 1, supremo: 0.25, revives: 0, altarDry: 0 }, trial: null, ...over,
  };
}
/** Põe o herói num nó do tipo pedido, sem jogar o caminho até lá. */
function jump(p: Profile, kind: NodeKind, trial?: DreamNode['trial']): DreamNode {
  const run = p.dream.run!, t = currentTrecho(run);
  /* nem todo trecho tem provação ou elite: na falta, um combate do meio do caminho faz as vezes */
  const node = t.nodes.find((n) => n.kind === kind && (!trial || n.trial === trial)) ?? t.nodes.find((n) => n.kind === kind) ?? t.nodes.find((n) => n.kind === 'combate' && n.step > 0);
  if (!node) throw new Error(`o trecho não tem ${kind}`);
  node.kind = kind;
  if (trial) node.trial = trial;
  run.at = node.id; run.done = false; run.pending = null; run.path[run.trecho].push(node.id);
  return node;
}
/** Abre um causo de teste com os efeitos dados já resolvidos. */
function causo(p: Profile, effects: DreamEffect[], extra: { blessing?: BlessingId; amulet?: AmuletId } = {}): void {
  const run = p.dream.run!;
  run.pending = { kind: 'causo', id: 'matinta', outcomes: [effects.map((effect) => ({ effect, ...extra }))] };
  run.done = false;
}
const stepsOf = (t: Trecho): DreamNode[][] => { const out: DreamNode[][] = []; for (const n of t.nodes) (out[n.step] ??= []).push(n); return out; };

describe('o mapa da noite', () => {
  it('em 1.000 sementes, todo trecho segue as regras do mapa', () => {
    for (let seed = 1; seed <= 1000; seed++) {
      const map = dreamNight(seed * 7919, SETUP);
      expect(map.trechos).toHaveLength(DREAM.trechos);
      for (const t of map.trechos) {
        const steps = stepsOf(t), last = DREAM.steps - 1;
        expect(steps).toHaveLength(DREAM.steps);
        expect(steps[0].map((n) => n.kind)).toEqual(['combate']);
        expect(steps[last].map((n) => n.kind)).toEqual(['chefe']);
        expect(steps[last - 1].map((n) => n.kind).sort()).toEqual(['feira', 'fonte']);
        expect(steps[DREAM.altarStep].every((n) => n.kind === 'altar')).toBe(true);
        /* altares do mesmo passo são de padrinhos diferentes, e só de quem já foi libertado */
        const patrons = steps[DREAM.altarStep].map((n) => n.patron);
        expect(new Set(patrons).size).toBe(patrons.length);
        for (const n of t.nodes) if (n.kind === 'altar') expect(SETUP.patrons).toContain(n.patron);
        expect(t.nodes.filter((n) => n.kind === 'provacao').length).toBeLessThanOrEqual(1);
        /* todo nó tem saída (menos o chefe), toda saída vai para o passo seguinte e ninguém fica sem entrada */
        const entered = new Set<number>([steps[0][0].id]);
        for (const n of t.nodes) {
          if (n.kind !== 'chefe') expect(n.next.length).toBeGreaterThan(0);
          for (const to of n.next) { expect(t.nodes[to].step).toBe(n.step + 1); entered.add(to); }
          /* dois causos nunca em seguida */
          if (n.kind === 'causo') for (const to of n.next) expect(t.nodes[to].kind).not.toBe('causo');
        }
        expect(entered.size).toBe(t.nodes.length);
        /* o descanso é escolha: de qualquer faixa dá para ir à Fonte ou à Feira */
        for (const n of steps[last - 2]) expect(n.next.map((to) => t.nodes[to].kind).sort()).toEqual(['feira', 'fonte']);
      }
    }
  });

  it('a mesma semente dá a mesma noite, e sementes diferentes, noites diferentes', () => {
    expect(JSON.stringify(dreamNight(31337, SETUP))).toBe(JSON.stringify(dreamNight(31337, SETUP)));
    expect(JSON.stringify(dreamNight(31337, SETUP))).not.toBe(JSON.stringify(dreamNight(31339, SETUP)));
  });

  it('a primeira noite é curta e os trechos ficam mais difíceis', () => {
    expect(dreamNight(9, { ...SETUP, short: true }).trechos).toHaveLength(1);
    const levels = dreamNight(9, SETUP).trechos.map((t) => t.level);
    expect(levels[0]).toBeLessThan(levels[1]);
    expect(levels[1]).toBeLessThan(levels[2]);
    expect(levels[0]).toBeLessThanOrEqual(SETUP.level);
  });
});

describe('a sala de cada nó', () => {
  it('todo nó de sala vira uma fase de uma sala só, igual toda vez', () => {
    const seen = new Set<NodeKind>();
    for (let seed = 1; seed <= 40; seed++) {
      const map = dreamNight(seed * 104729, SETUP);
      for (const t of map.trechos) for (const n of t.nodes) {
        if (n.kind === 'feira' || n.kind === 'fonte' || n.kind === 'causo') continue;
        const id = nodeStageId(map, t, n), key = parseDreamId(id)!;
        expect(isDreamId(id)).toBe(true);
        expect(key.kind).toBe(n.kind);
        expect(key.chapter).toBe(t.chapter);
        const stage = dreamStage(id)!;
        expect(stage.rooms).toHaveLength(1);
        expect(stage.level).toBe(t.level);
        expect(JSON.stringify(findStage(id))).toBe(JSON.stringify(stage));
        const room = stage.rooms[0];
        if (n.kind === 'altar') { expect(room.altar?.patron).toBe(n.patron); expect(room.waves.flat()).toHaveLength(0); }
        else expect(room.waves.flat().length).toBeGreaterThan(0);
        if (n.kind === 'provacao' && n.trial !== 'tres') expect(room.trial?.kind).toBe(n.trial);
        if (n.kind === 'chefe') expect(JSON.stringify(room.waves)).toContain(`"${n.boss}"`);
        seen.add(n.kind);
      }
    }
    expect([...seen].sort()).toEqual(['altar', 'chefe', 'combate', 'elite', 'provacao']);
  });

  it('identificador torto não vira fase', () => {
    expect(dreamStage('sonho-combate-9-30-0-1-x')).toBeNull();
    expect(dreamStage('sonho-nada-1-30-0-1-x')).toBeNull();
    expect(dreamStage('1-3')).toBeNull();
    expect(findStage('1-3')?.id).toBe('1-3');
  });
});

describe('começar a noite', () => {
  it('abre ao libertar a Iara, pede uma escolha válida e não deixa duas noites de uma vez', () => {
    const p = dreamer(30, 1);
    expect(isDreamUnlocked(p)).toBe(false);
    expect(startNight(p, CHOICE, 1)).toBeNull();
    const q = dreamer();
    expect(isDreamUnlocked(q)).toBe(true);
    expect(validChoice(q, { ...CHOICE, spells: [null, null, null] })).toBe(false);
    expect(validChoice(q, { ...CHOICE, weapon: 'cajado' })).toBe(false); // não tem cajado
    expect(validChoice(q, defaultChoice(q)) || !defaultChoice(q).spells.some(Boolean)).toBe(true);
    expect(startNight(q, CHOICE, 1)).not.toBeNull();
    expect(startNight(q, CHOICE, 2)).toBeNull();
  });

  it('a primeira noite de todas tem um trecho só', () => {
    const p = dreamer(); p.dream.nights = 0;
    expect(night(p).map.trechos).toHaveLength(1);
  });

  it('o herói do Sonho não usa os itens da campanha', () => {
    const a = dreamer(30), b = dreamer(30);
    Object.assign(b, { equipped: referenceProfile(60).equipped, attrs: referenceProfile(60).attrs, talents: referenceProfile(60).talents });
    expect(JSON.stringify(runStats(night(a, 77)))).toBe(JSON.stringify(runStats(night(b, 77))));
    expect(deriveStats(b).maxHp).not.toBe(runStats(b.dream.run!).maxHp);
  });

  it('o Rancho dá vinténs, depois um amuleto comum, depois uma bênção comum à escolha', () => {
    const p = dreamer(); p.village.rancho = 1;
    expect(night(p).vintem).toBe(30);
    const q = dreamer(); q.village.rancho = 2;
    const run = night(q);
    expect(run.amulets).toHaveLength(1);
    expect(AMULETS[run.amulets[0]].rarity).toBe('comum');
    expect(q.dream.amuletsSeen).toEqual(run.amulets);
    const r = dreamer(); r.village.rancho = 3;
    const pend = night(r).pending as Extract<Pending, { kind: 'bencao' }>;
    expect(pend.kind).toBe('bencao');
    expect(pend.options).toHaveLength(3);
    for (const b of pend.options) expect(BLESSINGS[b].tier).toBe(1);
    expect(reachable(r.dream.run!)).toEqual([]); // primeiro escolhe, depois anda
    expect(chooseBlessingOffer(r, 1)).toBe(pend.options[1]);
    expect(r.dream.run!.blessings).toEqual([pend.options[1]]);
    expect(reachable(r.dream.run!).length).toBeGreaterThan(0);
  });

  it('bênção de ouro e de experiência não aparece no Sonho', () => {
    const p = dreamer(60, 7), run = night(p);
    for (const b of STAGE_ONLY_BLESSINGS) expect(offerable(run)).not.toContain(b);
    /* nem no altar da sala */
    jump(p, 'altar');
    for (let i = 0; i < 12; i++) {
      run.rolls = i;
      const o = playNode(p, HUMAN);
      for (const b of o.blessings ?? []) expect(STAGE_ONLY_BLESSINGS).not.toContain(b);
    }
  });
});

describe('de uma sala para a outra', () => {
  it('andar: só para um nó ao alcance, e só depois de resolver o atual', () => {
    const p = dreamer(), run = night(p), t = currentTrecho(run);
    expect(reachable(run)).toEqual([0]);
    expect(enterNode(p, 5)).toBeNull();
    expect(enterNode(p, 0)).toEqual({ stage: currentStageId(run) });
    expect(reachable(run)).toEqual([]);
    expect(enterNode(p, t.nodes[0].next[0])).toBeNull();
    settleNode(p, outcome(p));
    expect(reachable(run)).toEqual(t.nodes[0].next);
  });

  it('combate vencido paga vinténs e Lembranças e leva vida, poções e Supremo para a sala seguinte', () => {
    const p = dreamer(), run = night(p);
    enterNode(p, 0);
    const res = settleNode(p, outcome(p, { chests: 2, left: { hpFrac: 0.55, potions: 1, supremo: 0.4, revives: 0, altarDry: 1 } }))!;
    expect(res.vintem).toBe(DREAM.vintem.combate + 2 * DREAM.vintem.perChest);
    expect(res.memories).toBe(DREAM.memories.combate);
    expect(run.vintem).toBe(res.vintem);
    expect(run.earned).toBe(res.memories);
    expect(run.hpFrac).toBeCloseTo(0.55);
    expect(run.done).toBe(true);
    /* resolver duas vezes a mesma sala não paga de novo */
    expect(settleNode(p, outcome(p))).toBeNull();
    expect(run.vintem).toBe(res.vintem);
    const next = currentTrecho(run).nodes[0].next.find((id) => ['combate', 'elite'].includes(currentTrecho(run).nodes[id].kind));
    if (next != null) {
      enterNode(p, next);
      const carry = dreamContext(run).carry;
      expect(carry.hpFrac).toBeCloseTo(0.55);
      expect(carry.potions).toBe(1);
      expect(carry.supremo).toBeCloseTo(0.4);
      expect(carry.altarDry).toBe(1);
    }
  });

  it('elite dá dois amuletos para escolher um; recusar também vale', () => {
    const p = dreamer(), run = night(p);
    jump(p, 'elite');
    settleNode(p, outcome(p));
    const pend = run.pending as Extract<Pending, { kind: 'amuleto' }>;
    expect(pend.kind).toBe('amuleto');
    expect(pend.options).toHaveLength(2);
    expect(reachable(run)).toEqual([]);
    expect(chooseAmulet(p, 1)).toBe(pend.options[1]);
    expect(run.amulets).toEqual([pend.options[1]]);
    expect(run.pending).toBeNull();
    jump(p, 'elite'); settleNode(p, outcome(p));
    expect(chooseAmulet(p, -1)).toBeNull();
    expect(run.amulets).toHaveLength(1);
    expect(run.pending).toBeNull();
  });

  it('provação: vencer a regra paga bem e dá amuleto; perder a regra custa metade da vida', () => {
    const p = dreamer(), run = night(p);
    jump(p, 'provacao', 'ligeiro');
    const win = settleNode(p, outcome(p, { trial: 'vencido' }))!;
    expect(win.trial).toBe(true);
    expect(win.memories).toBe(DREAM.memories.provacao);
    expect(run.pending?.kind).toBe('amuleto');
    expect(p.dream.trials).toBe(1);
    chooseAmulet(p, -1);
    jump(p, 'provacao', 'intocado');
    const lose = settleNode(p, outcome(p, { trial: 'perdido', left: { hpFrac: 0.8, potions: 1, supremo: 0, revives: 0, altarDry: 0 } }))!;
    expect(lose.trial).toBe(false);
    expect(lose.memories).toBe(0);
    expect(run.hpFrac).toBeCloseTo(0.8 * DREAM.trialFail);
    expect(run.pending).toBeNull();
    expect(p.dream.trials).toBe(1);
  });

  it('altar: a bênção escolhida na sala entra na noite e conta no Almanaque', () => {
    const p = dreamer(), run = night(p);
    const node = jump(p, 'altar');
    const o = playNode(p, HUMAN);
    expect(o.won).toBe(true);
    expect(o.blessings).toHaveLength(1);
    expect(BLESSINGS[o.blessings![0]].patron).toBe(node.patron);
    settleNode(p, o);
    expect(run.blessings).toEqual(o.blessings);
    expect(p.life.blessings[o.blessings![0]]).toBe(1);
    expect(run.tally.altars).toBe(1);
    expect(run.done).toBe(true);
  });

  it('chefe vencido: cura, três amuletos para escolher, trecho seguinte e a maldição acaba', () => {
    const p = dreamer(), run = night(p);
    run.curse = { hp: 0.2, damage: 0.1 };
    jump(p, 'chefe');
    settleNode(p, outcome(p, { left: { hpFrac: 0.3, potions: 0, supremo: 0, revives: 0, altarDry: 0 } }));
    expect(run.trecho).toBe(1);
    expect(run.at).toBeNull();
    expect(run.hpFrac).toBeCloseTo(0.3 + DREAM.bossHeal);
    expect(run.curse).toEqual({ hp: 0, damage: 0 });
    expect((run.pending as Extract<Pending, { kind: 'amuleto' }>).options).toHaveLength(3);
    expect(p.dream.bestTrecho).toBe(1);
    chooseAmulet(p, 0);
    expect(reachable(run)).toEqual([0]);
  });

  it('a maldição deixa os monstros da sala mais fortes', () => {
    const p = dreamer(), run = night(p);
    enterNode(p, 0);
    expect(dreamContext(run).foes).toEqual({ hp: 1, damage: 1 });
    run.curse = { hp: 0.2, damage: 0.15 };
    expect(dreamContext(run).foes.hp).toBeCloseTo(1.2);
    expect(dreamContext(run).foes.damage).toBeCloseTo(1.15);
  });

  it('fechar o jogo no meio da noite e voltar dá na mesma que jogar direto', () => {
    const a = dreamer(), b0 = dreamer();
    night(a, 999); night(b0, 999);
    enterNode(a, 0); enterNode(b0, 0);
    settleNode(a, playNode(a, HUMAN)); settleNode(b0, playNode(b0, HUMAN));
    const b = migrate(JSON.parse(JSON.stringify(b0)) as Profile);
    expect(JSON.stringify(b.dream.run)).toBe(JSON.stringify(a.dream.run));
    const next = reachable(a.dream.run!)[0];
    expect(enterNode(b, next)).toEqual(enterNode(a, next));
    /* saiu no meio da sala: ao voltar, a mesma sala */
    const mid = migrate(JSON.parse(JSON.stringify(b)) as Profile);
    expect(currentStageId(mid.dream.run!)).toBe(currentStageId(a.dream.run!));
    if (currentStageId(a.dream.run!)) expect(JSON.stringify(playNode(mid, HUMAN))).toBe(JSON.stringify(playNode(a, HUMAN)));
  });
});

describe('Feira, Fonte e Causo', () => {
  function atFeira(vintem = 500): { p: Profile; run: DreamRun; f: Extract<Pending, { kind: 'feira' }> } {
    const p = dreamer(), run = night(p);
    const fair = currentTrecho(run).nodes.find((n) => n.kind === 'feira')!, before = currentTrecho(run).nodes.find((n) => n.next.includes(fair.id))!;
    run.at = before.id; run.done = true; run.vintem = vintem;
    expect(enterNode(p, fair.id)).toEqual({ panel: 'feira' });
    return { p, run, f: run.pending as Extract<Pending, { kind: 'feira' }> };
  }

  it('a Feira vende três bênçãos e dois amuletos, e cobra pela raridade', () => {
    const { p, run, f } = atFeira();
    expect(f.blessings).toHaveLength(3);
    expect(f.amulets).toHaveLength(2);
    const b = f.blessings[0]!, cost = feiraPrice(run, 'bencao', b);
    expect(cost).toBe(DREAM.price.blessing[BLESSINGS[b].tier]);
    expect(buyBlessing(p, 0)).toBe(true);
    expect(run.vintem).toBe(500 - cost);
    expect(run.blessings).toContain(b);
    expect(buyBlessing(p, 0)).toBe(false); // já levada
    const a = f.amulets[1]!, aCost = feiraPrice(run, 'amuleto', a);
    expect(aCost).toBe(AMULET_RARITY[AMULETS[a].rarity].price);
    expect(buyAmulet(p, 1)).toBe(true);
    expect(run.amulets).toContain(a);
    expect(leaveNode(p)).toBe(true);
    expect(run.done).toBe(true);
    expect(reachable(run).map((id) => currentTrecho(run).nodes[id].kind)).toEqual(['chefe']);
  });

  it('sem vinténs não se compra nada', () => {
    const { p, run } = atFeira(0);
    run.hpFrac = 0.5;
    expect(buyBlessing(p, 0)).toBe(false);
    expect(buyAmulet(p, 0)).toBe(false);
    expect(buyHeal(p)).toBe(false);
    expect(rerollFeira(p)).toBe(false);
    expect(run.blessings).toEqual([]);
    expect(run.amulets).toEqual([]);
  });

  it('garrafada uma vez por visita, troca de banca cada vez mais cara, e tirar bênção leva o Despertar junto', () => {
    const { p, run } = atFeira();
    run.hpFrac = 0.3;
    expect(buyHeal(p)).toBe(true);
    expect(run.hpFrac).toBeCloseTo(0.3 + DREAM.feiraHeal);
    expect(buyHeal(p)).toBe(false);
    const first = feiraPrice(run, 'trocar');
    expect(first).toBe(DREAM.price.reroll);
    const before = JSON.stringify(run.pending);
    expect(rerollFeira(p)).toBe(true);
    expect(JSON.stringify(run.pending)).not.toBe(before);
    expect(feiraPrice(run, 'trocar')).toBe(first * 2);
    expect((run.pending as Extract<Pending, { kind: 'feira' }>).healed).toBe(true);
    run.blessings = ['furia', 'furia', 'furia', 'furia', 'furia', 'furiaDoBoitata', 'vento'];
    const coins = run.vintem;
    expect(removeBlessing(p, 'furiaDoBoitata')).toBe(false); // só a bênção comum; a desperta sai com ela
    expect(removeBlessing(p, 'furia')).toBe(true);
    expect(run.blessings).toEqual(['vento']);
    expect(run.vintem).toBe(coins - DREAM.price.remove);
  });

  it('a Bolsa de Mascate dá desconto em tudo', () => {
    const { run } = atFeira();
    const full = feiraPrice(run, 'cura');
    run.amulets.push('bolsaDeMascate');
    expect(feiraPrice(run, 'cura')).toBe(Math.round(full * 0.75));
  });

  it('Fonte: beber cura e devolve as poções; fortalecer sobe uma bênção', () => {
    const p = dreamer(), run = night(p);
    run.hpFrac = 0.4; run.potions = 0; run.pending = { kind: 'fonte' };
    expect(useFountain(p, 'beber')).toBe(true);
    expect(run.hpFrac).toBeCloseTo(0.4 + DREAM.fountainHeal);
    expect(run.potions).toBe(runStats(run).potions);
    expect(run.pending).toBeNull();
    expect(useFountain(p, 'beber')).toBe(false); // uma vez só
    run.blessings = ['furia']; run.hpFrac = 0.4; run.pending = { kind: 'fonte' };
    expect(useFountain(p, 'subir', 'vento')).toBe(false); // não tem
    expect(useFountain(p, 'subir', 'furia')).toBe(true);
    expect(run.blessings).toEqual(['furia', 'furia']);
    expect(run.hpFrac).toBeCloseTo(0.4);
    /* a Figa Torta seca a Fonte e a Rede de Dormir enche tudo */
    run.amulets = ['figaTorta'];
    expect(fountainHeal(run)).toBe(0);
    run.amulets = ['redeDeDormir'];
    expect(fountainHeal(run)).toBe(1);
  });

  it('cada efeito de causo faz o que diz', () => {
    const p = dreamer(), run = night(p);
    run.vintem = 50; run.hpFrac = 0.5; run.potions = 1; run.blessings = ['furia', 'furia'];
    causo(p, [{ t: 'vintem', n: -30 }, { t: 'vida', frac: 0.25 }, { t: 'pocao', n: 1 }, { t: 'lembrancas', n: 7 }, { t: 'maldicao', hp: 0.15, damage: 0.1 }]);
    expect(chooseCauso(p, 0)).toBe(true);
    expect([run.vintem, run.potions, run.earned]).toEqual([20, 2, 7]);
    expect(run.hpFrac).toBeCloseTo(0.75);
    expect(run.curse).toEqual({ hp: 0.15, damage: 0.1 });
    expect(run.pending).toBeNull();
    expect(run.done).toBe(true);
    expect(p.dream.causosSeen).toEqual(['matinta']);
    causo(p, [{ t: 'bencao' }], { blessing: 'vento' }); chooseCauso(p, 0);
    causo(p, [{ t: 'subir' }], { blessing: 'furia' }); chooseCauso(p, 0);
    expect(run.blessings).toEqual(['furia', 'furia', 'vento', 'furia']);
    causo(p, [{ t: 'esquecer' }], { blessing: 'furia' }); chooseCauso(p, 0);
    expect(run.blessings.filter((b) => b === 'furia')).toHaveLength(2);
    causo(p, [{ t: 'amuleto' }], { amulet: 'patua' }); chooseCauso(p, 0);
    expect(run.amulets).toEqual(['patua']);
    /* vida nunca zera e o que não dá para pagar não se escolhe */
    causo(p, [{ t: 'vida', frac: -5 }]); chooseCauso(p, 0);
    expect(run.hpFrac).toBeGreaterThan(0);
    causo(p, [{ t: 'vintem', n: -999 }]);
    expect(chooseCauso(p, 0)).toBe(false);
    expect(run.pending?.kind).toBe('causo');
  });

  it('entrar num causo já mostra o que cada escolha vai dar', () => {
    const p = dreamer(), run = night(p);
    const t = currentTrecho(run), node = t.nodes.find((n) => n.kind === 'causo');
    if (!node) return;
    const before = t.nodes.find((n) => n.next.includes(node.id))!;
    run.at = before.id; run.done = true;
    expect(enterNode(p, node.id)).toEqual({ panel: 'causo' });
    const pend = run.pending as Extract<Pending, { kind: 'causo' }>;
    expect(pend.outcomes).toHaveLength(CAUSOS[pend.id].choices.length);
    pend.outcomes.forEach((o, i) => expect(o.map((x) => x.effect)).toEqual(CAUSOS[pend.id].choices[i].effects));
    for (const o of pend.outcomes.flat()) if (o.effect.t === 'bencao') expect(o.blessing).toBeTruthy();
  });
});

describe('acordar', () => {
  it('cair acaba a noite, mas as Lembranças vêm junto', () => {
    const p = dreamer(), run = night(p);
    enterNode(p, 0); settleNode(p, outcome(p));
    run.earned = 40;
    jump(p, 'elite');
    const end = settleNode(p, outcome(p, { won: false, deaths: 1 }))!.end!;
    expect(end.won).toBe(false);
    expect(end.how).toBe('caiu');
    expect(end.memories).toBe(40);
    expect(end.xp).toBe(0);
    expect(p.dream.run).toBeNull();
    expect([p.dream.memories, p.dream.total, p.dream.nights, p.dream.wins]).toEqual([40, 40, 2, 0]);
  });

  it('vencer o último chefe: noite vencida, ouro e experiência por trecho, e um ponto de talento na primeira vez com a arma', () => {
    const p = dreamer(), run = night(p), points = p.talentPoints, gold = p.gold;
    for (let i = 0; i < 3; i++) { jump(p, 'chefe'); const res = settleNode(p, outcome(p))!; if (i < 2) { expect(res.end).toBeNull(); chooseAmulet(p, -1); } else expect(res.end?.won).toBe(true); }
    expect(run.tally.bosses).toBe(3);
    expect(p.dream.run).toBeNull();
    expect(p.dream.wins).toBe(1);
    expect(p.dream.bestTrecho).toBe(3);
    expect(p.dream.weaponsWon).toEqual(['facao']);
    expect(p.talentPoints).toBe(points + 1);
    expect(p.gold).toBeGreaterThan(gold);
    expect(p.dream.memories).toBe(3 * DREAM.memories.chefe);
    /* a segunda vitória com a mesma arma não dá outro ponto */
    night(p, 5);
    for (let i = 0; i < 3; i++) { jump(p, 'chefe'); settleNode(p, outcome(p)); if (i < 2) chooseAmulet(p, -1); }
    expect(p.dream.wins).toBe(2);
    expect(p.talentPoints).toBe(points + 1);
  });

  it('acordar por conta própria leva o que juntou; o Mural e o Olho de Boi aumentam as Lembranças', () => {
    const p = dreamer(); p.village.mural = 2;
    const run = night(p);
    run.earned = 100; run.amulets.push('olhoDeBoi');
    expect(memoryBonus(p, run)).toBeCloseTo(1.2 * 1.3);
    const end = abandonNight(p)!;
    expect(end.how).toBe('desistiu');
    expect(end.memories).toBe(156);
    expect(p.dream.memories).toBe(156);
    expect(abandonNight(p)).toBeNull();
  });

  it('Aldeia: cada melhoria custa Lembranças e para no nível máximo', () => {
    const p = dreamer();
    expect(build(p, 'mural')).toBe(false);
    p.dream.memories = 10_000;
    for (const id of BUILDING_ORDER) {
      for (const lv of BUILDINGS[id].levels) { expect(buildCost(p, id)).toBe(lv.cost); expect(build(p, id)).toBe(true); }
      expect(buildCost(p, id)).toBeNull();
      expect(build(p, id)).toBe(false);
      expect(p.village[id]).toBe(BUILDINGS[id].levels.length);
    }
    expect(p.dream.memories).toBe(10_000 - BUILDING_ORDER.flatMap((id) => BUILDINGS[id].levels).reduce((n, l) => n + l.cost, 0));
    /* a Casa de Farinha rende ouro na campanha */
    expect(deriveStats(p).goldMult).toBeCloseTo(deriveStats(dreamer()).goldMult + 0.3);
  });
});

describe('amuletos, causos e conquistas', () => {
  it('20 amuletos e 10 causos, todos com ícone, texto e história', () => {
    expect(AMULET_ORDER).toHaveLength(20);
    for (const id of AMULET_ORDER) {
      const a = AMULETS[id];
      expect(UI_ICON_KEYS).toContain(a.icon);
      expect(a.desc.length).toBeGreaterThan(8);
      expect(a.lore.length).toBeGreaterThan(20);
      expect(AMULET_RARITY[a.rarity].price).toBeGreaterThan(0);
    }
    expect(CAUSO_ORDER).toHaveLength(10);
    for (const id of CAUSO_ORDER) {
      const c = CAUSOS[id];
      expect(c.choices.length).toBeGreaterThanOrEqual(2);
      expect(c.choices.length).toBeLessThanOrEqual(3);
      expect(c.lore.length).toBeGreaterThan(20);
      /* sempre há uma saída de graça */
      expect(c.choices.some((ch) => ch.effects.every((e) => !(e.t === 'vintem' && e.n < 0) && !(e.t === 'pocao' && e.n < 0) && e.t !== 'esquecer' && e.t !== 'subir'))).toBe(true);
    }
  });

  it('os amuletos de número mudam o herói', () => {
    const p = referenceProfile(30), base = deriveStats(p);
    expect(deriveStats(p, [], ['patua']).maxHp).toBeGreaterThan(base.maxHp);
    expect(deriveStats(p, [], ['denteDeOnca']).critChance).toBeCloseTo(base.critChance + 0.1);
    expect(deriveStats(p, [], ['penaDeArara']).moveSpeed).toBeGreaterThan(base.moveSpeed);
    expect(JSON.stringify(deriveStats(p, [], []))).toBe(JSON.stringify(base));
  });

  it('a Muiraquitã deixa cair uma vez e a Moringa devolve uma poção por sala', () => {
    const p = dreamer(), run = night(p);
    expect(run.revives).toBe(0);
    causo(p, [{ t: 'amuleto' }], { amulet: 'muiraquita' }); chooseCauso(p, 0);
    expect(run.revives).toBe(1);
    run.amulets.push('moringa'); run.potions = 0;
    enterNode(p, reachable(run)[0] ?? 0) ?? jump(p, 'combate');
    if (!currentStageId(run)) jump(p, 'combate');
    settleNode(p, outcome(p, { left: { hpFrac: 1, potions: 0, supremo: 0, revives: 1, altarDry: 0 } }));
    expect(run.potions).toBe(1);
  });

  it('as conquistas do Sonho são alcançáveis e têm ícone', () => {
    const p = dreamer(60, 8);
    Object.assign(p.dream, { nights: 99, wins: 99, bestTrecho: 3, total: 99_999, trials: 99, awakened: 99, compadrios: 9, synergy7: 9, weaponsWon: ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'], amuletsSeen: AMULET_ORDER.slice(), causosSeen: CAUSO_ORDER.slice() });
    p.village = { rancho: 3, mural: 3, casaDeFarinha: 3 };
    const got = checkAchievements(p, DAY), dream = ACHIEVEMENTS.filter((a) => a.group === 'sonho');
    expect(dream.length).toBeGreaterThanOrEqual(18);
    expect(dream.filter((a) => !got.includes(a.id)).map((a) => `${a.id} ${achievementProgress(p, a)}/${a.target}`)).toEqual([]);
    for (const a of dream) expect(UI_ICON_KEYS).toContain(a.icon);
  });

  it('um save da versão 2 ganha o Sonho e a Aldeia vazios', () => {
    const old = JSON.parse(JSON.stringify(referenceProfile(20))) as Record<string, unknown>;
    old.version = 2; delete old.dream; delete old.village;
    const p = migrate(old as unknown as Profile);
    expect(p.version).toBe(PROFILE_VERSION);
    expect(p.dream.run).toBeNull();
    expect([p.dream.memories, p.dream.nights, p.dream.amuletsSeen.length]).toEqual([0, 0, 0]);
    expect(p.village).toEqual({});
  });
});

describe('noites inteiras, jogadas pelo jogador automático', () => {
  it('a mesma semente e o mesmo jogador dão a mesma noite, do começo ao fim', () => {
    const a = playNight(dreamer(), CHOICE, 60606, { ...HUMAN, seed: 3 }), b = playNight(dreamer(), CHOICE, 60606, { ...HUMAN, seed: 3 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(a.nodes.length).toBeGreaterThan(0);
    expect(a.end.memories).toBeGreaterThan(0);
  }, 120_000);

  it('uma noite curta com cada uma das seis armas chega ao fim sem travar', () => {
    for (const weapon of ['facao', 'arco', 'borduna', 'peixeiras', 'zagaia', 'cajado'] as const) {
      const p = dreamer(34, 4);
      p.dream.nights = 0;
      Object.assign(p, { inventory: referenceProfile(34, false, weapon).inventory, equipped: referenceProfile(34, false, weapon).equipped });
      const log = playNight(p, { ...CHOICE, weapon }, 1234, { ...HUMAN, seed: 9 });
      expect(p.dream.run).toBeNull();
      expect(p.dream.nights).toBe(1);
      expect(log.end.of).toBe(1);
      expect(log.end.weapon).toBe(weapon);
      if (log.end.won) expect(p.dream.weaponsWon).toEqual([weapon]);
    }
  }, 240_000);
});
