import { describe, expect, it } from 'vitest';
import { TICK } from '../src/data/balance';
import { brDay, challengeSeed, dailyChallenge, dailyChallengeId, encantadosStage, ENCANTADOS_ID, secondsToNextBrDay, type HeroSpec } from '../src/data/challenge';
import { findStage } from '../src/data/tower';
import { challengeProfile, compareResults, encantadosSpec, settleChallenge, touchChallengeDay, validEncantadosSpec } from '../src/meta/challenge';
import { migrate, newProfile } from '../src/meta/profile';
import type { StageOutcome } from '../src/meta/rewards';
import { deriveStats } from '../src/meta/stats';
import { Recorder, quantize, replayRun } from '../src/sim/replay';
import { createWorld, fingerprint, step, type StageConfig } from '../src/sim/world';
import { HUMAN, makeBot } from './bot';

const out = (stageId: string, won: boolean, rooms: number, time: number, hero?: HeroSpec): StageOutcome =>
  ({ stageId, won, time, deaths: 0, roomsCleared: rooms, kills: 0, perfects: 0, hitsTaken: 0, hero });

describe('Desafio do Dia', () => {
  it('o dia vira à meia-noite de Brasília', () => {
    expect(brDay(new Date('2026-11-25T02:59:00Z'))).toBe('2026-11-24');
    expect(brDay(new Date('2026-11-25T03:00:00Z'))).toBe('2026-11-25');
    expect(secondsToNextBrDay(new Date('2026-11-25T02:59:00Z'))).toBe(60);
  });

  it('cada dia monta sempre a mesma fase válida, e os dias variam', () => {
    const chapters = new Set<number>(), weapons = new Set<string>();
    for (let d = 1; d <= 60; d++) {
      const day = `2027-0${1 + Math.floor((d - 1) / 30)}-${String(((d - 1) % 30) + 1).padStart(2, '0')}`, def = dailyChallenge(day);
      expect(dailyChallenge(day)).toEqual(def);
      const st = findStage(def.id)!;
      expect(st.rooms.length).toBe(5);
      expect(st.rooms.filter((r) => r.type === 'altar').length).toBe(1);
      expect(def.spec.spells.filter(Boolean).length).toBe(3);
      chapters.add(def.chapter); weapons.add(def.spec.weapon);
      const w = createWorld({ stageId: st.id, level: st.level, rooms: st.rooms, stats: deriveStats(challengeProfile(def.spec)), seed: challengeSeed(st.id), ranked: true });
      for (let i = 0; i < 120; i++) step(w, { mx: 0, my: 0, aimX: 0, aimY: 0, attackPressed: false, attackHeld: false, altHeld: false, dodgePressed: false, spell: [false, false, false], petPressed: false, potionPressed: false, supremoPressed: false }, TICK);
    }
    expect(chapters.size).toBeGreaterThanOrEqual(6);
    expect(weapons.size).toBe(6);
  });

  it('a primeira tentativa do dia vale; as outras são treino; o dia novo zera', () => {
    const p = newProfile(3), now = new Date('2026-11-25T15:00:00Z'), id = dailyChallengeId(brDay(now));
    touchChallengeDay(p, now);
    const a = settleChallenge(p, out(id, false, 2, 80), now)!;
    expect(a.ranked).toBe(true);
    expect(p.materials.mata).toBe(8);
    const b = settleChallenge(p, out(id, true, 5, 120), now)!;
    expect(b.ranked).toBe(false);
    expect(b.newBest).toBe(true);
    expect(p.challenges.daily.first?.won).toBe(false);
    expect(p.challenges.daily.best?.won).toBe(true);
    expect(p.materials.tomo).toBe(0);
    const next = new Date('2026-11-26T15:00:00Z');
    touchChallengeDay(p, next);
    expect(p.challenges.daily.tries).toBe(0);
    /* partida começada ontem e terminada hoje não conta */
    expect(settleChallenge(p, out(id, true, 5, 100), next)).toBeNull();
    const c = settleChallenge(p, out(dailyChallengeId(brDay(next)), true, 5, 100), next)!;
    expect(c.ranked).toBe(true);
    expect(p.materials.tomo).toBe(1);
    expect(p.challenges.daily.streak).toBe(1);
  });
});

describe('Desafio dos Encantados', () => {
  it('oito chefes e três altares, todos no mesmo nível', () => {
    const st = encantadosStage();
    expect(st.rooms.length).toBe(11);
    expect(st.rooms.filter((r) => r.type === 'altar').length).toBe(3);
    expect(new Set(st.rooms.map((r) => r.level)).size).toBe(1);
    expect(findStage(ENCANTADOS_ID)?.rooms.length).toBe(11);
  });

  it('o herói usa só o que o jogador tem; recordes por arma', () => {
    const p = newProfile(4);
    p.level = 40; p.loadout = ['dardo', 'sementes', null];
    const spec = encantadosSpec(p, 'arco');
    expect(spec.weapon).toBe('arco');
    expect(validEncantadosSpec(p, spec)).toBe(true);
    expect(validEncantadosSpec(p, { ...spec, supremo: 'fogo' })).toBe(false);
    expect(validEncantadosSpec(p, { ...spec, level: 99 })).toBe(false);
    settleChallenge(p, out(ENCANTADOS_ID, false, 4, 200, spec));
    const r = settleChallenge(p, out(ENCANTADOS_ID, true, 11, 300, spec))!;
    expect(r.newBest).toBe(true);
    expect(p.materials.lagrima).toBe(2);
    expect(p.challenges.encantados.bestByWeapon.arco?.won).toBe(true);
    expect(compareResults({ won: true, rooms: 11, time: 250, weapon: 'arco' }, p.challenges.encantados.best)).toBeGreaterThan(0);
  });
});

describe('o servidor consegue refazer um desafio', () => {
  it('só com a gravação e a escolha do herói', () => {
    const def = dailyChallenge('2026-12-04'), st = findStage(def.id)!, prof = challengeProfile(def.spec);
    const cfg: StageConfig = { stageId: st.id, level: st.level, rooms: st.rooms, stats: deriveStats(prof), seed: challengeSeed(st.id), ranked: true };
    const w = createWorld(cfg), bot = makeBot(prof, { ...HUMAN, seed: 9 }), rec = new Recorder();
    while (w.phase !== 'won' && w.phase !== 'lost' && rec.ticks < 60 * 400) {
      const altar = w.phase === 'altar', before = w.blessings.length, inp = quantize(bot(w));
      if (altar && (w.phase !== 'altar' || w.blessings.length !== before)) rec.pick('a', 0);
      rec.input(inp); step(w, inp, TICK); w.events.length = 0;
    }
    /* o servidor monta tudo de novo a partir do identificador e da escolha do herói */
    const sProf = challengeProfile(JSON.parse(JSON.stringify(def.spec)) as HeroSpec), sStage = findStage(def.id)!;
    const again = replayRun({ stageId: sStage.id, level: sStage.level, rooms: sStage.rooms, stats: deriveStats(sProf), seed: challengeSeed(sStage.id), ranked: true }, rec.finish(), (b) => deriveStats(sProf, b));
    expect(fingerprint(again)).toBe(fingerprint(w));
  }, 60_000);
});

describe('save antigo', () => {
  it('ganha o registro dos desafios', () => {
    const old = newProfile(5) as unknown as Record<string, unknown>;
    delete old.challenges; old.version = 5;
    const p = migrate(old as never);
    expect(p.version).toBe(6);
    expect(p.challenges.daily.tries).toBe(0);
    expect(p.challenges.encantados.bestByWeapon).toEqual({});
  });
});
