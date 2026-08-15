import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

/**
 * JWT verification and the route guards built on it.
 *
 * Access tokens are stateless: they are NOT checked against the database on
 * every request, which is what keeps reads cheap. The trade-off is that a
 * token stays valid until it expires, so the TTL is deliberately short (15m)
 * and anything that must take effect immediately — a ban, a password change —
 * revokes the refresh-token family instead.
 */
async function authPlugin(app) {
  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    sign: {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_TTL,
      iss: 'aust-central',
      aud: 'aust-central-app',
    },
    verify: {
      // Pinning the algorithm blocks the "alg: none" and RS/HS confusion
      // attacks, where a token declares its own weaker verification scheme.
      algorithms: ['HS256'],
      allowedIss: 'aust-central',
      allowedAud: 'aust-central-app',
    },
  });

  /**
   * Require a valid access token. Populates `request.user` with the claims.
   *
   * Used as an `onRequest` hook so it runs before body parsing — an
   * unauthenticated caller never gets to spend our CPU on their payload.
   */
  app.decorate('requireAuth', async function requireAuth(request) {
    try {
      await request.jwtVerify();
    } catch (error) {
      request.log.info({ reason: error.code ?? error.message }, 'rejected unauthenticated request');
      // The specific reason (expired vs malformed vs bad signature) is logged
      // but never returned: it tells an attacker which half of a forged token
      // to keep working on.
      throw new UnauthorizedError();
    }

    if (!request.user?.sub) {
      throw new UnauthorizedError();
    }
  });

  /**
   * Require one of the given roles. Always composed AFTER requireAuth.
   *
   * The role is read from the token, so a role change only takes effect on the
   * next refresh — acceptable for promotion, and demotion is paired with a
   * family revoke by the admin path.
   *
   * @param {...('STUDENT'|'MODERATOR'|'ADMIN')} roles
   */
  app.decorate('requireRole', function requireRole(...roles) {
    return async function roleGuard(request) {
      if (!request.user?.sub) throw new UnauthorizedError();
      if (!roles.includes(request.user.role)) {
        request.log.warn(
          { userId: request.user.sub, role: request.user.role, required: roles },
          'blocked request lacking required role',
        );
        throw new ForbiddenError();
      }
    };
  });

  /**
   * Optional authentication: populates `request.user` when a valid token is
   * present, but does not reject anonymous callers. For endpoints whose
   * response is richer when signed in (e.g. listings marked as bookmarked).
   */
  app.decorate('optionalAuth', async function optionalAuth(request) {
    try {
      await request.jwtVerify();
    } catch {
      // Swallowed on purpose. jwtVerify only populates `request.user` on
      // success, so an invalid or absent token simply leaves it undefined —
      // which every consumer already handles via `request.user?.sub`.
    }
  });

  /**
   * Mint an access token for a user row.
   * `sub` is the user id; the rest are convenience claims that save a lookup.
   */
  app.decorate('signAccessToken', function signAccessToken(user) {
    return app.jwt.sign({
      sub: user.id,
      role: user.role,
      // Lets a route refuse unverified accounts without a database read.
      verified: Boolean(user.emailVerifiedAt),
    });
  });
}

export default fp(authPlugin, { name: 'auth', dependencies: ['security'] });
