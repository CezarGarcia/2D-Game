import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/data/stages';
import { towerRun } from '../src/data/tower';
import { DEFAULT_VOLUMES, loadVolumes } from '../src/game/audio';
import { PERCUSSION, TRACKS, composeSting, composeTrack, pluck, songSeconds, stepSeconds, trackFor, type Song } from '../src/game/tracks';

const melodic = (s: Song) => s.notes.filter((n) => !PERCUSSION.has(n.inst));

describe('música', () => {
  it('cada capítulo, o acampamento e a Torre têm a sua faixa', () => {
    for (let ch = 1; ch <= 8; ch++) {
      const st = STAGES.find((s) => s.chapter === ch)!;
      expect(trackFor(st)).toBe(`cap${ch}`);
    }
    expect(trackFor(towerRun(1))).toBe('torre');
    expect(TRACKS).toContain('acampamento');
    const keys = new Set(TRACKS.map((id) => JSON.stringify(composeTrack(id).notes)));
    expect(keys.size).toBe(TRACKS.length);
  });

  it('a mesma faixa sai sempre igual', () => {
    for (const id of TRACKS) {
      expect(composeTrack(id)).toEqual(composeTrack(id));
      expect(composeTrack(id, true)).toEqual(composeTrack(id, true));
    }
  });

  it('as notas ficam na partitura, na tessitura e na escala da faixa', () => {
    for (const id of TRACKS) for (const boss of [false, true]) {
      const s = composeTrack(id, boss), total = s.steps * s.bars;
      expect(s.notes.length).toBeGreaterThan(40);
      for (const n of s.notes) {
        expect(n.s).toBeGreaterThanOrEqual(0);
        expect(n.s).toBeLessThan(total);
        expect(n.len).toBeGreaterThan(0);
        expect(n.vel).toBeGreaterThan(0);
        expect(n.vel).toBeLessThanOrEqual(1);
      }
      for (const n of melodic(s)) {
        expect(n.midi).toBeGreaterThanOrEqual(33);
        expect(n.midi).toBeLessThanOrEqual(96);
        expect(s.scale).toContain((((n.midi - s.root) % 12) + 12) % 12);
      }
    }
  });

  it('o modo chefe é mais rápido, mais cheio e mantém a melodia', () => {
    for (const id of TRACKS) {
      const a = composeTrack(id), b = composeTrack(id, true);
      expect(b.bpm).toBeGreaterThan(a.bpm);
      expect(b.notes.length).toBeGreaterThan(a.notes.length);
      const lead = (s: Song) => JSON.stringify(s.notes.filter((n) => ['pifano', 'canto', 'sanfona', 'ocarina', 'caixinha', 'clarim'].includes(n.inst)));
      expect(lead(b)).toBe(lead(a));
    }
  });

  it('a melodia volta com variação na segunda metade', () => {
    const s = composeTrack('cap3'), half = s.steps * 8;
    const lead = s.notes.filter((n) => n.inst === 'sanfona' && n.vel > 0.3);
    const first = lead.filter((n) => n.s < half).map((n) => `${n.s}:${n.midi}`);
    const second = lead.filter((n) => n.s >= half).map((n) => `${n.s - half}:${n.midi}`);
    const same = first.filter((x) => second.includes(x)).length;
    expect(same).toBeGreaterThan(first.length * 0.3);
    expect(same).toBeLessThan(first.length);
  });

  it('as vinhetas são curtas e tocam uma vez', () => {
    for (const k of ['vitoria', 'derrota'] as const) {
      const s = composeSting(k, 55);
      expect(s.once).toBe(true);
      expect(songSeconds(s)).toBeGreaterThan(1.5);
      expect(songSeconds(s)).toBeLessThan(8);
      expect(stepSeconds(s)).toBeGreaterThan(0);
    }
  });

  it('a corda dedilhada soa afinada e vai sumindo', () => {
    const rate = 44100, { data, freq } = pluck(220, rate, 1.5, { decay: 0.996, bright: 0.5, seed: 3 });
    expect(Math.abs(freq - 220) / 220).toBeLessThan(0.01);
    const rms = (a: number, b: number) => { let x = 0; for (let i = a; i < b; i++) x += data[i] * data[i]; return Math.sqrt(x / (b - a)); };
    expect(data.every(Number.isFinite)).toBe(true);
    expect(rms(0, 4000)).toBeGreaterThan(rms(data.length - 4000, data.length) * 4);
  });

  it('sem armazenamento, os volumes ficam no padrão', () => {
    expect(loadVolumes()).toEqual(DEFAULT_VOLUMES);
    expect(DEFAULT_VOLUMES.musica).toBeLessThan(DEFAULT_VOLUMES.efeitos);
  });
});
