import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * Rate-limit bucketing, with real (small) limits.
 *
 * The audience is a university: hundreds of students commonly share one
 * campus NAT address. Any limit keyed only by IP is shared by all of them, so
 * signed-in traffic must be bucketed per user, and per-IP limits on routes
 * every page load hits (refresh) must be sized for a crowd.
 *
 * Env is set before the app is imported because src/config/env.js freezes it
 * at import time; the dynamic imports below are what make that ordering hold.
 */

const saved = { ...process.env };
process.env.RATE_LIMIT_MAX = '5';
process.env.AUTH_RATE_LIMIT_MAX = '100000';
process.env.REFRESH_RATE_LIMIT_MAX = '3';

let app;
let createUser;
beforeAll(async () => {
  const { createTestApp, useCleanDatabase } = await import('./helpers/app.js');
  ({ createUser } = await import('./helpers/auth.js'));
  app = await createTestApp();
  useCleanDatabase(() => app);
});

afterAll(() => {
  process.env = saved;
});

const get = (headers) => app.inject({ method: 'GET', url: '/api/v1/tasks', headers });

describe('global limiter', () => {
  it('buckets signed-in callers per user, not per shared IP', async () => {
    const alice = await createUser(app);
    const bob = await createUser(app);

    // Same source address for both (inject always uses 127.0.0.1).
    for (let i = 0; i < 5; i += 1) {
      expect((await get(alice.headers)).statusCode).toBe(200);
    }
    expect((await get(alice.headers)).statusCode).toBe(429);

    // Bob, behind the same "NAT", still has his own budget.
    expect((await get(bob.headers)).statusCode).toBe(200);
  });
});

describe('refresh limiter', () => {
  it('is sized by REFRESH_RATE_LIMIT_MAX', async () => {
    const refresh = () =>
      app.inject({ method: 'POST', url: '/api/v1/auth/refresh', payload: { refreshToken: 'x' } });
    const codes = [];
    for (let i = 0; i < 4; i += 1) codes.push((await refresh()).statusCode);
    expect(codes).toEqual([401, 401, 401, 429]);
  });
});
