/**
 * Versão da simulação: um resumo do código que decide o combate e as recompensas.
 * Quando qualquer número ou regra muda, a versão muda junto, e o ranking da versão antiga fecha.
 * Fica disponível como `import { SIM_VERSION } from 'virtual:sim-version'`.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/** Arquivos que não mudam o resultado de uma partida (só textos). */
const IGNORE = new Set(['src/data/lore.ts', 'src/data/falas.ts', 'src/data/achievements.ts']);

export function simVersion(root = process.cwd()): string {
  const h = createHash('sha256');
  for (const dir of ['src/sim', 'src/data', 'src/meta']) {
    for (const f of readdirSync(join(root, dir)).filter((x) => x.endsWith('.ts')).sort()) {
      const rel = `${dir}/${f}`;
      if (IGNORE.has(rel)) continue;
      h.update(rel).update('\0').update(readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n')).update('\0');
    }
  }
  return h.digest('hex').slice(0, 10);
}

export default function simVersionPlugin(): Plugin {
  const id = 'virtual:sim-version', resolved = '\0' + id;
  return {
    name: 'sim-version',
    resolveId: (s) => (s === id ? resolved : null),
    load: (s) => (s === resolved ? `export const SIM_VERSION = ${JSON.stringify(simVersion())};` : null),
  };
}
