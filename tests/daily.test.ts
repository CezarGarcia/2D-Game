import { afterEach, describe, expect, it } from 'vitest';
import { TICK } from '../src/data/balance';
import { EXP_REWARDED_RUNS, MISSIONS, expeditionStage, isExpeditionId, parseExpeditionId, restCap, restPerDay } from '../src/data/daily';
import { STAGES } from '../src/data/stages';
import { findStage } from '../src/data/tower';
import {
  chestReady, claimChest, claimMission, clockNow, countEvent, dayKey, daysBetween, expeditionsToday, makeExpeditions, missionOptions, missionText,
  newTally, pickMissions, recordForge, setClock, settleStage, touchDay,
} from '../src/meta/daily';
import { migrate, newProfile, type MissionState, type Profile } from '../src/meta/profile';
import type { StageOutcome } from '../src/meta/rewards';
import { deriveStats } from '../src/meta/stats';
import { createWorld, step } from '../src/sim/world';
import { makeBot, PERFECT } from './bot';

/** Meio-dia local de um dia qualquer. */
const at = (y: number, m: number, d: number, hour = 12) => new Date(y, m - 1, d, hour, 0, 0);
const DAY = at(2026, 11, 23);

/** Perfil que venceu todas as fases até `lastId` (inclusive) e está no nível dela. */
function progressed(lastId: string, seed = 7): Profile {
  const p = newProfile(seed), last = STAGES.findIndex((s) => s.id === lastId);
  for (const s of STAGES.slice(0, last + 1)) p.stages[s.id] = { cleared: true, stars: [true, false, false], bestTime: 100, pity: 0, clears: 1 };
  p.level = STAGES[last].level;
  return p;
}

const outcome = (stageId: string, over: Partial<StageOutcome> = {}): StageOutcome => ({ stageId, won: true, time: 60, deaths: 0, roomsCleared: 5, kills: 20, perfects: 0, hitsTaken: 3, tally: newTally(), ...over });
const mission = (kind: string, target: number, param?: string | number): MissionState => ({ kind, target, progress: 0, claimed: false, reward: { gold: 100, mata: 5, po: 1, tomo: 0 }, ...(param != null ? { param } : {}) });

afterEach(() => setClock());

describe('dia local', () => {
  it('formata o dia local e conta dias', () => {
    expect(dayKey(at(2026, 1, 5, 23))).toBe('2026-01-05');
    expect(dayKey(at(2026, 1, 6, 0))).toBe('2026-01-06');
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('a hora pode ser trocada para testes', () => {
    setClock(() => DAY);
    expect(dayKey(clockNow())).toBe('2026-11-23');
    setClock();
    expect(Math.abs(clockNow().getTime() - Date.now())).toBeLessThan(1000);
  });
});

describe('missões do dia', () => {
  it('o sorteio depende só do dia e da semente do perfil', () => {
    const a = progressed('2-6', 11), b = progressed('2-6', 11);
    a.seed = 999; // a semente que muda a cada sorteio não interfere
    expect(pickMissions(a, '2026-11-23')).toEqual(pickMissions(b, '2026-11-23'));
    const days = new Set(Array.from({ length: 12 }, (_, i) => JSON.stringify(pickMissions(a, `2026-11-${String(i + 1).padStart(2, '0')}`).map((m) => [m.kind, m.param, m.target]))));
    expect(days.size).toBeGreaterThan(8);
  });

  it('três missões de grupos diferentes, só do que o jogador já pode fazer', () => {
    const fresh = newProfile(3), kinds = missionOptions(fresh).map((o) => o.kind);
    for (const k of ['torre', 'forja', 'expedicao', 'supremo', 'arma', 'capitulo', 'reacoes'] as const) expect(kinds).not.toContain(k);
    for (let d = 1; d <= 28; d++) {
      const list = pickMissions(fresh, `2026-02-${String(d).padStart(2, '0')}`);
      expect(list).toHaveLength(3);
      expect(new Set(list.map((m) => MISSIONS[m.kind as keyof typeof MISSIONS].group)).size).toBe(3);
      for (const m of list) {
        expect(kinds).toContain(m.kind);
        if (m.kind === 'elemento') expect(m.param).toBe('natureza');
        expect(missionText(m)).not.toContain('?');
      }
    }
    const late = progressed('4-12', 5), lateKinds = missionOptions(late).map((o) => o.kind);
    for (const k of ['torre', 'forja', 'expedicao', 'capitulo', 'reacoes', 'elite'] as const) expect(lateKinds).toContain(k);
    const chapters = missionOptions(late).find((o) => o.kind === 'capitulo')!.params;
    expect(chapters).toEqual([1, 2, 3, 4]);
  });

  it('progresso vem das partidas e do ferreiro; pegar paga uma vez só', () => {
    setClock(() => DAY);
    const p = progressed('1-6');
    touchDay(p);
    p.daily.missions = [mission('monstros', 30), mission('elemento', 5, 'natureza'), mission('semPocao', 1)];
    const t = newTally();
    for (let i = 0; i < 6; i++) countEvent(t, { type: 'cast', kind: 'dardo' });
    countEvent(t, { type: 'potion' });
    settleStage(p, outcome('1-3', { kills: 20, tally: t }));
    expect(p.daily.missions.map((m) => m.progress)).toEqual([20, 5, 0]);
    expect(claimMission(p, 1)).not.toBeNull();
    expect(claimMission(p, 1)).toBeNull();
    expect(claimMission(p, 0)).toBeNull();
    const r = settleStage(p, outcome('1-3', { kills: 15 }));
    expect(r.daily?.missions).toEqual([0, 2]);
    expect(p.daily.missions[0].progress).toBe(30);
    const gold = p.gold;
    claimMission(p, 0); claimMission(p, 2);
    expect(p.gold).toBe(gold + 200);
    expect(chestReady(p)).toBe(true);
    const mats = p.materials.tomo, chest = claimChest(p)!;
    expect(chest.gem).toBeDefined();
    expect(p.materials.tomo).toBe(mats + chest.tomo);
    expect(claimChest(p)).toBeNull();

    p.daily.missions = [mission('forja', 2), mission('capitulo', 1, 1), mission('estrelas', 1)];
    recordForge(p); recordForge(p);
    settleStage(p, outcome('1-7', { won: true, deaths: 1, time: 999 })); // fase nova (não é repetição) e só 1 estrela
    expect(p.daily.missions.map((m) => m.progress)).toEqual([2, 0, 0]);
    settleStage(p, outcome('1-2', { time: 10 })); // fase já vencida, 3 estrelas
    expect(p.daily.missions.map((m) => m.progress)).toEqual([2, 1, 1]);
  });

  it('vira à meia-noite: missões novas, baú e expedições de volta', () => {
    const p = progressed('1-8');
    setClock(() => at(2026, 11, 23, 23));
    touchDay(p);
    const first = p.daily.missions.map((m) => m.kind + m.target);
    p.daily.chest = true; p.daily.expRuns = 3; p.daily.expFirst = [0, 1]; p.daily.missions[0].progress = 99;
    expect(touchDay(p)).toBe(false);
    setClock(() => at(2026, 11, 24, 0));
    expect(touchDay(p)).toBe(true);
    expect(p.daily.day).toBe('2026-11-24');
    expect(p.daily.chest).toBe(false);
    expect(p.daily.expRuns).toBe(0);
    expect(p.daily.expFirst).toEqual([]);
    expect(p.daily.missions.every((m) => m.progress === 0 && !m.claimed)).toBe(true);
    expect(p.daily.expeditions.every((id) => id.startsWith('exp-20261124-'))).toBe(true);
    expect(first.length).toBe(3);
  });
});

describe('bônus de descanso', () => {
  it('quem fica fora acumula descanso, com limite; quem volta no dia seguinte não', () => {
    const p = progressed('1-10');
    touchDay(p, at(2026, 11, 1));
    touchDay(p, at(2026, 11, 2));
    expect(p.daily.rest).toBe(0);
    touchDay(p, at(2026, 11, 4)); // ficou o dia 3 fora
    expect(p.daily.rest).toBe(restPerDay(p.level));
    expect(p.daily.restDays).toBe(1);
    touchDay(p, at(2026, 11, 20));
    expect(p.daily.rest).toBe(restCap(p.level));
  });

  it('dobra a experiência até acabar', () => {
    setClock(() => at(2026, 11, 10));
    const a = progressed('1-10'), b = progressed('1-10');
    touchDay(a, at(2026, 11, 1)); touchDay(b, at(2026, 11, 9));
    touchDay(a); touchDay(b);
    expect(b.daily.rest).toBe(0);
    const pool = a.daily.rest;
    expect(pool).toBeGreaterThan(0);
    const ra = settleStage(a, outcome('1-9')), rb = settleStage(b, outcome('1-9'));
    expect(ra.daily!.rest).toBe(rb.xp);
    expect(ra.xp).toBe(rb.xp * 2);
    expect(a.daily.rest).toBe(pool - rb.xp);
    for (let i = 0; i < 20 && a.daily.rest > 0; i++) settleStage(a, outcome('1-9'));
    expect(a.daily.rest).toBe(0);
    const after = settleStage(a, outcome('1-9'));
    expect(after.daily!.rest).toBe(0);
  });

  it('save antigo ganha o diário sem perder nada', () => {
    const old = progressed('2-3') as Partial<Profile>;
    delete old.daily;
    const p = migrate(old as Profile);
    expect(p.daily.missions).toEqual([]);
    expect(p.daily.lastSeen).toBe('');
    expect(p.stages['2-3'].cleared).toBe(true);
    touchDay(p, DAY);
    expect(p.daily.rest).toBe(0);
    expect(p.daily.missions).toHaveLength(3);
  });
});

describe('expedições', () => {
  it('fecham até o ferreiro e abrem com capítulos já jogados', () => {
    const fresh = newProfile(1);
    touchDay(fresh, DAY);
    expect(fresh.daily.expeditions).toEqual([]);
    const p = progressed('1-2');
    touchDay(p, DAY);
    expect(p.daily.expeditions).toHaveLength(2);
    for (const id of p.daily.expeditions) {
      const k = parseExpeditionId(id)!;
      expect(k.chapter).toBe(1);
      expect(k.upto).toBe(2);
      expect(expeditionStage(id)!.kinds.every((kind) => ['sauva', 'cuspidor'].includes(kind))).toBe(true);
    }
  });

  it('geradas pelo dia, válidas e jogáveis em todos os capítulos', () => {
    const p = progressed('8-11', 21);
    const seen = new Set<number>();
    for (let d = 1; d <= 20; d++) {
      const day = `2026-03-${String(d).padStart(2, '0')}`, ids = makeExpeditions(p, day);
      expect(ids).toEqual(makeExpeditions(p, day));
      expect(ids).toHaveLength(2);
      for (const id of ids) {
        expect(isExpeditionId(id)).toBe(true);
        const st = findStage(id)!;
        seen.add(st.chapter);
        expect(st.rooms.length).toBeGreaterThanOrEqual(2);
        expect(st.level).toBeLessThanOrEqual(STAGES.find((s) => s.id === '8-11')!.level);
        for (const r of st.rooms) expect(r.waves.flat().length).toBeGreaterThan(0);
        const w = createWorld({ stageId: id, level: st.level, rooms: st.rooms, stats: deriveStats(p), seed: 5 });
        for (let i = 0; i < 120; i++) { step(w, { mx: 0, my: 0, aimX: 0, aimY: 0, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false }, TICK); w.events.length = 0; }
        expect(w.phase).not.toBe('lost');
      }
    }
    expect(seen.size).toBeGreaterThan(4);
  });

  it('o jogador automático vence uma expedição do começo do jogo', () => {
    const p = progressed('1-4', 2);
    const id = makeExpeditions(p, '2026-11-23')[0], st = findStage(id)!;
    const w = createWorld({ stageId: id, level: st.level, rooms: st.rooms, stats: deriveStats(p), seed: 3 }), bot = makeBot(p, PERFECT);
    for (let i = 0; i < 60 * 240 && w.phase !== 'won' && w.phase !== 'lost'; i++) { step(w, bot(w), TICK); w.events.length = 0; }
    expect(w.phase).toBe('won');
    expect(w.roomsCleared).toBe(st.rooms.length);
  });

  it('a primeira vitória do dia paga mais; só três vitórias pagam', () => {
    setClock(() => DAY);
    const p = progressed('3-6', 4);
    const exps = expeditionsToday(p);
    expect(exps).toHaveLength(2);
    const id = exps[1].id, rooms = exps[1].stage.rooms.length;
    const first = settleStage(p, outcome(id, { roomsCleared: rooms }));
    expect(first.daily!.expedition!.first).toBe(true);
    expect(first.materials.tomo).toBe(1);
    expect(first.items.length + first.soldOverflow.length).toBe(1);
    const second = settleStage(p, outcome(id, { roomsCleared: rooms }));
    expect(second.daily!.expedition!.first).toBe(false);
    expect(second.materials.tomo).toBe(0);
    expect(second.materials.mata).toBeLessThan(first.materials.mata);
    expect(second.gold).toBeGreaterThan(0);
    settleStage(p, outcome(exps[0].id, { roomsCleared: 2 }));
    expect(p.daily.expRuns).toBe(EXP_REWARDED_RUNS);
    const fourth = settleStage(p, outcome(id, { roomsCleared: rooms }));
    expect(fourth.gold).toBe(0);
    expect(fourth.materials.mata).toBe(0);
    expect(fourth.xp).toBeGreaterThan(0);
    expect(fourth.daily!.expedition!.runsLeft).toBe(0);
    /* expedição de ontem não paga */
    const old = makeExpeditions(p, '2026-11-22')[0];
    p.daily.expRuns = 0;
    expect(settleStage(p, outcome(old, { roomsCleared: 3 })).gold).toBe(0);
  });
});
