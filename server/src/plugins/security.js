import fp from 'fastify-plugin';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import underPressure from '@fastify/under-pressure';

import { env, isProduction, isTest } from '../config/env.js';

/**
 * Transport-level hardening: headers, origin policy, and abuse limits.
 *
 * Per-route auth throttling is layered on top of the global limiter inside the
 * auth module; this plugin sets the floor that applies to everything.
 */
async function securityPlugin(app) {
  await app.register(helmet, {
    // This is a JSON API — it serves no HTML, so the strictest CSP possible is
    // free. It matters for the one route that does stream bytes back
    // (GET /files/:id): if a stored SVG or HTML file is ever served inline,
    // this policy stops it executing script.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        sandbox: [],
      },
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    // Only meaningful over TLS, and setting it in dev poisons localhost for
    // other projects on the same host.
    hsts: isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  });

  await app.register(cors, {
    /**
     * Explicit allowlist. `credentials: true` with a reflected origin would let
     * any site drive authenticated requests, so unknown origins are rejected
     * rather than echoed.
     */
    origin(origin, callback) {
      // Same-origin, curl, and mobile apps send no Origin header at all.
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
      app.log.warn({ origin }, 'blocked cross-origin request');
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  await app.register(cookie, {
    // Refresh tokens are already opaque and hashed at rest, so cookies carry no
    // secret needing signing; the flags below are what actually protect them.
    parseOptions: {
      httpOnly: true,
      sameSite: 'strict',
      secure: isProduction,
      path: '/',
    },
  });

  await app.register(multipart, {
    limits: {
      // Enforced while streaming, so an oversized upload is cut off rather
      // than buffered into memory first.
      fileSize: env.MAX_UPLOAD_BYTES,
      files: env.MAX_UPLOADS_PER_REQUEST,
      // Bound the non-file parts too: unbounded field counts and header sizes
      // are a cheap way to exhaust the parser.
      fields: 20,
      fieldSize: 100 * 1024,
      headerPairs: 100,
    },
  });

  await app.register(rateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    // Authenticated callers are bucketed per user so one busy campus NAT does
    // not starve everyone behind it; anonymous callers fall back to IP.
    keyGenerator: (request) => request.user?.sub ?? request.ip,
    // Never rate-limit health checks — the orchestrator would mark us unhealthy.
    allowList: (request) => request.url === '/health' || request.url === '/ready',
    enableDraftSpec: true,
  });

  if (!isTest) {
    await app.register(underPressure, {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 512 * 1024 * 1024,
      maxRssBytes: 768 * 1024 * 1024,
      retryAfter: 30,
      // Shedding load beats falling over: an overloaded process that still
      // answers 503 quickly recovers; one that queues forever does not.
      message: 'Server under heavy load, please retry shortly',
      exposeStatusRoute: false,
    });
  }

  // Strip headers that advertise the stack to scanners.
  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.removeHeader('X-Powered-By');
  });
}

export default fp(securityPlugin, { name: 'security' });
