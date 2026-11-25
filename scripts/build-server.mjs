/**
 * Empacota o lado do servidor (src/server/tentativa.ts, com a simulação inteira) num arquivo só,
 * que a função do Supabase importa: supabase/functions/_shared/servidor.js.
 * Rode com `npm run build:server` antes de `supabase functions deploy`.
 */
import { createServer } from 'vite';
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';

/* a mesma versão da simulação que o jogo recebe no build */
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { simVersion } = await vite.ssrLoadModule('/sim-version.plugin.ts');
const version = simVersion();
await vite.close();

const out = 'supabase/functions/_shared/servidor.js';
await build({
  entryPoints: ['src/server/tentativa.ts'], outfile: out, bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', minify: true, legalComments: 'none',
  plugins: [{
    name: 'sim-version',
    setup(b) {
      b.onResolve({ filter: /^virtual:sim-version$/ }, () => ({ path: 'sim-version', namespace: 'sim-version' }));
      b.onLoad({ filter: /.*/, namespace: 'sim-version' }, () => ({ contents: `export const SIM_VERSION = ${JSON.stringify(version)};`, loader: 'js' }));
    },
  }],
});
writeFileSync('supabase/functions/_shared/servidor.d.ts', `export * from '../../../src/server/tentativa';\n`);
console.log(`servidor empacotado em ${out} (simulação ${version})`);
