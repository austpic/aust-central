import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Loads test env vars and applies migrations to the test database once.
    globalSetup: ['./test/global-setup.js'],
    setupFiles: ['./test/setup.js'],
    // Integration tests share one Postgres instance; running files in parallel
    // would let one suite's truncate wipe another's fixtures mid-assertion.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
    },
  },
});
