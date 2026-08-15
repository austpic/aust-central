import { env, isProduction } from '../../config/env.js';
import { UnauthorizedError } from '../../lib/errors.js';
import * as authService from './service.js';
import {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  messageResponseSchema,
  publicUserSchema,
  refreshBodySchema,
  registerBodySchema,
  resendVerificationBodySchema,
  resetPasswordBodySchema,
  sessionResponseSchema,
  toPublicUser,
  verifyEmailBodySchema,
} from './schema.js';

const REFRESH_COOKIE = 'refresh_token';

/**
 * Cookie carrying the refresh token.
 *
 * `httpOnly` keeps it out of reach of any script on the page, which is what
 * makes it safer than localStorage; `sameSite: strict` means it is not attached
 * to cross-site requests at all, removing CSRF as a concern for the refresh
 * endpoint. Path is scoped so it is only ever sent to the auth routes.
 */
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
  };
}

/**
 * Mobile clients read the token from the JSON body and keep it in the OS
 * keychain; browsers use the cookie and ignore the body copy.
 */
function sendSession(reply, session) {
  reply.setCookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
  return session;
}

/** Prefer the cookie, fall back to the body. */
function readRefreshToken(request) {
  return request.cookies?.[REFRESH_COOKIE] ?? request.body?.refreshToken ?? null;
}

export default async function authRoutes(app) {
  /**
   * Every route here is credential-adjacent, so they share a much tighter
   * budget than the global limiter: enough for a person mistyping a password,
   * far too little for credential stuffing.
   */
  const strictLimit = {
    rateLimit: {
      max: env.AUTH_RATE_LIMIT_MAX,
      timeWindow: env.AUTH_RATE_LIMIT_WINDOW,
      // Keyed by IP alone — these callers are unauthenticated by definition.
      keyGenerator: (request) => request.ip,
    },
  };

  app.post(
    '/register',
    {
      config: strictLimit,
      schema: {
        body: registerBodySchema,
        response: { 201: sessionResponseSchema },
      },
    },
    async (request, reply) => {
      const session = await authService.register(app, request, request.body);
      reply.code(201);
      return sendSession(reply, session);
    },
  );

  app.post(
    '/login',
    {
      config: strictLimit,
      schema: {
        body: loginBodySchema,
        response: { 200: sessionResponseSchema },
      },
    },
    async (request, reply) => {
      const session = await authService.login(app, request, request.body);
      return sendSession(reply, session);
    },
  );

  app.post(
    '/refresh',
    {
      // Deliberately looser than login: a client whose access token expires
      // mid-session refreshes legitimately and often, and this endpoint is
      // already self-limiting because each token works exactly once.
      config: {
        rateLimit: { max: 60, timeWindow: '15 minutes', keyGenerator: (r) => r.ip },
      },
      schema: {
        body: refreshBodySchema,
        response: { 200: sessionResponseSchema },
      },
    },
    async (request, reply) => {
      const session = await authService.refresh(app, request, readRefreshToken(request));
      return sendSession(reply, session);
    },
  );

  app.post(
    '/logout',
    {
      schema: {
        body: refreshBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request, reply) => {
      await authService.logout(app, request, readRefreshToken(request));
      reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
      return { message: 'Signed out.' };
    },
  );

  app.post(
    '/forgot-password',
    {
      config: strictLimit,
      schema: {
        body: forgotPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request) => authService.forgotPassword(app, request, request.body),
  );

  app.post(
    '/reset-password',
    {
      config: strictLimit,
      schema: {
        body: resetPasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await authService.resetPassword(app, request, request.body);
      // The old session is gone; make sure the browser drops its copy too.
      reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
      return result;
    },
  );

  app.post(
    '/verify-email',
    {
      config: strictLimit,
      schema: {
        body: verifyEmailBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request) => authService.verifyEmail(app, request, request.body),
  );

  app.post(
    '/resend-verification',
    {
      config: strictLimit,
      schema: {
        body: resendVerificationBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request) => authService.resendVerification(app, request, request.body),
  );

  // --- Authenticated ------------------------------------------------------

  app.get(
    '/me',
    {
      onRequest: [app.requireAuth],
      schema: { response: { 200: publicUserSchema } },
    },
    async (request) => {
      const user = await app.prisma.user.findUnique({ where: { id: request.user.sub } });
      // The token outlives the row it describes (deletion, deactivation), so
      // the claim is re-checked against the database on this route.
      if (!user || user.deletedAt) {
        throw new UnauthorizedError();
      }
      return toPublicUser(user);
    },
  );

  app.patch(
    '/password',
    {
      onRequest: [app.requireAuth],
      config: strictLimit,
      schema: {
        body: changePasswordBodySchema,
        response: { 200: messageResponseSchema },
      },
    },
    async (request, reply) => {
      const result = await authService.changePassword(
        app,
        request,
        request.user.sub,
        request.body,
      );
      reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
      return result;
    },
  );
}
