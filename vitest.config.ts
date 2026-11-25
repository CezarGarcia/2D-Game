import { defineConfig } from 'vitest/config';
import simVersion from './sim-version.plugin';

export default defineConfig({
  plugins: [simVersion()],
  test: { exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'] },
});
