import { afterAll, beforeEach } from 'vitest';

import { buildApp } from '../../src/app.js';

/**
 * Boot one app instance for a test file and keep the database clean between
 * cases.
 *
 * Tests drive the real Fastify instance through `inject()` rather than a mock,
 * so plugins, hooks, validation, and the error handler are all exercised — the
 * security behaviour we care about lives in those layers, not in the handlers.
 */

/** @returns {Promise<import('fastify').FastifyInstance>} */
export async function createTestApp() {
  const app = await buildApp();
  await app.ready();

  afterAll(async () => {
    await app.close();
  });

  return app;
}

/**
 * Truncate every application table between tests.
 *
 * Derived from the live catalogue rather than a hardcoded list, so a new model
 * cannot silently start leaking rows across tests. `_prisma_migrations` is
 * preserved — dropping it would force a re-migrate on every case.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 */
export async function truncateAll(prisma) {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT LIKE '_prisma%'
  `;

  if (tables.length === 0) return;

  const list = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  // RESTART IDENTITY resets sequences; CASCADE handles FK order for us.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

/** Register the between-test cleanup for a suite. */
export function useCleanDatabase(getApp) {
  beforeEach(async () => {
    await truncateAll(getApp().prisma);
  });
}
