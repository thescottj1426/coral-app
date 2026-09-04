import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          // Named `guard`, not `unit`: these cover the logic where a wrong
          // answer is silent — the cap counting the wrong rows, the sitemap
          // emitting localhost, the test guard letting a pooler host through.
          // They render nothing. `component` is where the UI is exercised.
          name: 'guard',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.feature.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.component.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'feature',
          environment: 'node',
          include: ['src/**/*.feature.test.ts'],
          testTimeout: 30000,
          // Load-bearing, not tuning: every feature test truncates the same
          // shared tables, so parallel workers would wipe each other's rows
          // mid-test and fail nondeterministically.
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});
