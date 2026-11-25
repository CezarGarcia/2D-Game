import { describe, expect, it } from 'vitest';
import { TICK } from '../src/data/balance';
import { STAGES } from '../src/data/stages';
import { deriveStats, referenceProfile } from '../src/meta/stats';
import { Recorder, decodeInputs, quantize, replayRun, resultOf, type Replay } from '../src/sim/replay';
import { createWorld, fingerprint, step, type StageConfig, type World } from '../src/sim/world';
import { HUMAN, makeBot } from './bot';

/** Joga a fase com o jogador automático gravando, como a cena faz. */
function playRecorded(index: number, seed: number): { cfg: StageConfig; w: World; rec: Replay; restat: Parameters<typeof replayRun>[2] } {
  const s = STAGES[index], prof = referenceProfile(s.level), restat = (b: Parameters<typeof deriveStats>[1]) => deriveStats(prof, b);
  const cfg: StageConfig = { stageId: s.id, level: s.level, rooms: s.rooms, stats: deriveStats(prof), seed };
  const w = createWorld(cfg), bot = makeBot(prof, { ...HUMAN, seed: seed & 0xff }), rec = new Recorder();
  while (w.phase !== 'won' && w.phase !== 'lost' && rec.ticks < 60 * 600) {
    const altar = w.phase === 'altar', offer = !!w.offer, before = w.blessings.length;
    const inp = quantize(bot(w));
    // o jogador automático escolhe a primeira carta dentro de bot(w), fora do passo
    if ((altar && w.phase !== 'altar') || (offer && !w.offer) || w.blessings.length !== before) rec.pick(altar ? 'a' : 'o', 0);
    rec.input(inp);
    step(w, inp, TICK);
    w.events.length = 0;
  }
  return { cfg, w, rec: rec.finish(), restat };
}

describe('gravação e verificação de partidas', () => {
  it('os comandos voltam iguais da codificação', () => {
    const rec = new Recorder(), sent = [];
    for (let i = 0; i < 500; i++) {
      const inp = quantize({ mx: Math.sin(i / 7), my: -Math.cos(i / 5), aimX: 300 + i * 1.37, aimY: -20 + (i % 13) * 7.9, attackPressed: i % 9 === 0, attackHeld: i % 4 < 2, altHeld: i > 300, dodgePressed: i === 77, spell: [i % 50 === 0, false, i === 499], petPressed: false, potionPressed: i === 3, supremoPressed: false });
      rec.input(inp); sent.push(inp);
    }
    expect(decodeInputs(rec.finish())).toEqual(sent);
  });

  it('refazer a partida dá o mesmo resultado em todos os capítulos', () => {
    for (const idx of [0, 5, 11, 17, 23, 30, 35, 41, 47, 54, 59, 66, 71, 78, 83, 90, 95]) {
      const { cfg, w, rec, restat } = playRecorded(idx, 400 + idx);
      const again = replayRun(cfg, rec, restat);
      expect(fingerprint(again), STAGES[idx].id).toBe(fingerprint(w));
      expect(resultOf(again)).toEqual(resultOf(w));
      expect(rec.data.length).toBeLessThan(120_000);
    }
  });

  it('gravação adulterada não chega ao mesmo resultado', () => {
    const { cfg, w, rec, restat } = playRecorded(8, 77);
    expect(w.phase).toBe('won');
    // semente trocada
    expect(fingerprint(replayRun({ ...cfg, seed: cfg.seed + 1 }, rec, restat))).not.toBe(fingerprint(w));
    // um trecho de comandos apagado (o fim da gravação)
    const bytes = atob(rec.data);
    const cut: Replay = { ...rec, data: btoa(bytes.slice(0, Math.floor(bytes.length * 0.6))) };
    let cutOk = true;
    try { cutOk = fingerprint(replayRun(cfg, cut, restat)) === fingerprint(w); } catch { cutOk = false; }
    expect(cutOk).toBe(false);
    // herói mais forte do que o declarado
    const strong = { ...cfg, stats: { ...cfg.stats, damageMult: cfg.stats.damageMult * 3 } };
    expect(resultOf(replayRun(strong, rec, restat))).not.toEqual(resultOf(w));
  });

  it('recusa gravação malformada ou longa demais', () => {
    const { cfg, rec, restat } = playRecorded(0, 5);
    expect(() => replayRun(cfg, { ...rec, format: 99 }, restat)).toThrow();
    expect(() => replayRun(cfg, { ...rec, ticks: 1e9 }, restat)).toThrow();
    expect(() => decodeInputs({ ...rec, ticks: 3 })).toThrow();
  });
});

describe('versão da simulação', () => {
  it('existe e tem 10 dígitos hexadecimais', async () => {
    const { SIM_VERSION } = await import('../src/sim/replay');
    expect(SIM_VERSION).toMatch(/^[0-9a-f]{10}$/);
  });
});
