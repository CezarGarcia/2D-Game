import { describe, expect, it } from 'vitest';
import { fatan2, fcos, fexp, fhypot, flog, fpow, fsin } from '../src/sim/fmath';
import { makeRng } from '../src/data/rng';

/** Diferença em unidades relativas (tolerância para ruído de última casa). */
function close(a: number, b: number, tol = 4e-16): boolean {
  if (a === b) return true;
  return Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
}

describe('contas iguais em todo navegador', () => {
  const rng = makeRng(17);
  const xs = Array.from({ length: 20000 }, (_, i) => (rng() - 0.5) * (i % 4 === 0 ? 20000 : i % 4 === 1 ? 50 : 7));

  it('seno e cosseno batem com o Math até a última casa', () => {
    for (const x of xs) { expect(close(fsin(x), Math.sin(x), 2e-15)).toBe(true); expect(close(fcos(x), Math.cos(x), 2e-15)).toBe(true); }
    expect(fsin(0)).toBe(0); expect(fcos(0)).toBe(1);
  });

  it('arco-tangente cobre os quatro quadrantes e os eixos', () => {
    for (let i = 0; i < 20000; i++) { const y = xs[i], x = xs[(i * 7 + 3) % xs.length]; expect(close(fatan2(y, x), Math.atan2(y, x))).toBe(true); }
    for (const [y, x] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 0], [3, 3], [-3, -3]]) expect(close(fatan2(y, x), Math.atan2(y, x))).toBe(true);
  });

  it('exp, log, pow e hypot', () => {
    for (const x of xs) {
      expect(close(fexp(x / 100), Math.exp(x / 100))).toBe(true);
      const p = Math.abs(x) + 1e-3;
      expect(close(flog(p), Math.log(p))).toBe(true);
      expect(close(fpow(p, 1.2), Math.pow(p, 1.2), 1e-14)).toBe(true);
      expect(close(fhypot(x, x / 3), Math.hypot(x, x / 3))).toBe(true);
    }
    expect(fpow(0.88, 3)).toBe(0.88 * 0.88 * 0.88);
    expect(fpow(2, -2)).toBe(0.25);
    expect(fexp(0)).toBe(1); expect(flog(1)).toBe(0);
  });

  it('a simulação, os dados e as regras não usam as contas do navegador', () => {
    const bad = /Math\.(sin|cos|tan|atan2?|asin|acos|exp|log|pow|hypot|cbrt|sinh|cosh|tanh|log2|log10|expm1|log1p)\b/;
    const found: string[] = [];
    const files = import.meta.glob(['../src/sim/*.ts', '../src/data/*.ts', '../src/meta/*.ts', '!../src/sim/fmath.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(files).length).toBeGreaterThan(40);
    for (const [f, text] of Object.entries(files)) text.split('\n').forEach((line, i) => { if (bad.test(line)) found.push(`${f}:${i + 1}`); });
    expect(found).toEqual([]);
  });
});
