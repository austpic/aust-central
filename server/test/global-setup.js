import { execSync } from 'node:child_process';

import { applyTestEnv } from './test-env.js';

/**
 * Runs once per `vitest run`, before any test file.
 *
 * Applies migrations to the test database so suites always run against the
 * current schema. Using `migrate deploy` (not `dev`) means it never prompts and
 * never generates new migration files from drift.
 */
export default function globalSetup() {
  applyTestEnv();

  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch {
    throw new Error(
      'Failed to migrate the test database.\n' +
        'Is it running?  docker compose up -d postgres-test\n' +
        `Expected at: ${process.env.DATABASE_URL}`,
    );
  }
}
