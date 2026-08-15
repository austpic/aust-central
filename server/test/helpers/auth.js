/**
 * Helpers for tests that need a signed-in caller.
 *
 * Registers through the real HTTP surface rather than inserting rows directly,
 * so every test exercises the same password hashing and token issuance the app
 * uses in production.
 */

let counter = 0;

/**
 * Create a user and return their credentials plus an auth header.
 * @param {import('fastify').FastifyInstance} app
 */
export async function createUser(app, overrides = {}) {
  counter += 1;
  const payload = {
    name: `Test User ${counter}`,
    email: `user${counter}-${Date.now()}@example.com`,
    password: 'CorrectHorse7',
    ...overrides,
  };

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload,
  });

  if (response.statusCode !== 201) {
    throw new Error(`Failed to create test user: ${response.body}`);
  }

  const body = response.json();
  return {
    ...body.user,
    password: payload.password,
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    headers: { authorization: `Bearer ${body.accessToken}` },
  };
}

/** Promote a user's role directly, for testing moderator/admin gates. */
export async function promote(app, userId, role) {
  await app.prisma.user.update({ where: { id: userId }, data: { role } });
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  const accessToken = app.signAccessToken(user);
  return { accessToken, headers: { authorization: `Bearer ${accessToken}` } };
}
