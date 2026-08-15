import { z } from 'zod';

/**
 * Liveness and readiness probes.
 *
 * Deliberately unauthenticated and rate-limit exempt — orchestrators call them
 * constantly and must not be throttled. For that reason they expose no build,
 * version, or dependency detail: an unauthenticated endpoint is a
 * reconnaissance surface, so it says only "up" or "not up".
 */
export default async function healthRoutes(app) {
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: z.object({ status: z.literal('ok'), uptimeSeconds: z.number() }),
        },
      },
    },
    async () => ({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) }),
  );

  app.get(
    '/ready',
    {
      schema: {
        response: {
          200: z.object({ status: z.literal('ready') }),
          503: z.object({ status: z.literal('not-ready') }),
        },
      },
    },
    async (request, reply) => {
      try {
        // Cheapest possible round-trip that proves the pool can still serve.
        await app.prisma.$queryRaw`SELECT 1`;
        return { status: 'ready' };
      } catch (error) {
        request.log.error({ err: error }, 'readiness check failed');
        return reply.code(503).send({ status: 'not-ready' });
      }
    },
  );
}
