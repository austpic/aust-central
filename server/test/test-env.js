/**
 * Canonical test environment.
 *
 * Imported by BOTH the global setup (which migrates the database) and the
 * per-file setup (which boots the app), so the two can never disagree about
 * which database they are pointed at.
 *
 * Values are only applied when absent, letting CI override the connection
 * string without editing this file.
 */
export const TEST_DATABASE_URL =
  'postgresql://aust:aust_test_password@localhost:5433/aust_central_test?schema=public';

export function applyTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL ??= TEST_DATABASE_URL;

  // Fixed, obviously-fake secrets. Long enough to satisfy the env schema's
  // 32-character floor, and distinct from each other because production
  // validation forbids reuse — tests should exercise the same shape.
  process.env.JWT_ACCESS_SECRET ??= 'test-jwt-access-secret-not-for-real-use-0001';
  process.env.PASSWORD_PEPPER ??= 'test-password-pepper-not-for-real-use-000002';

  process.env.LOG_LEVEL ??= 'silent';
  process.env.PUBLIC_URL ??= 'http://localhost:3000';
  process.env.CORS_ORIGINS ??= 'http://localhost:3000';
  process.env.STORAGE_DIR ??= './storage-test';

  // Forced, not defaulted: every test that creates a user registers with an
  // @example.com address (test/helpers/auth.js), so a developer's local
  // ALLOWED_EMAIL_DOMAIN=aust.edu must never leak in from .env and break the
  // whole suite. Setting it here — before src/config/env.js ever loads
  // .env — wins, since loadEnvFile does not overwrite values already present.
  process.env.ALLOWED_EMAIL_DOMAIN = '';

  // Effectively disable throttling by default so functional tests are not
  // flaky. The auth suite re-enables real limits for the cases that need them.
  process.env.RATE_LIMIT_MAX ??= '100000';
  process.env.AUTH_RATE_LIMIT_MAX ??= '100000';
}
