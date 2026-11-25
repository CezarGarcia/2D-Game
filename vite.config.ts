import { defineConfig } from 'vite';
import simVersion from './sim-version.plugin';

export default defineConfig({
  base: './',
  plugins: [simVersion()],
  build: { chunkSizeWarningLimit: 2000 },
  server: { host: true },
});
