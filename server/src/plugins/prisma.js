import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

import { isProduction, isTest } from '../config/env.js';

/**
 * Owns the PrismaClient lifecycle and hangs it off the Fastify instance.
 *
 * One client per process: Prisma manages its own connection pool internally, so
 * constructing extras would multiply open Postgres connections for no gain.
 */
async function prismaPlugin(app) {
  const prisma = new PrismaClient({
    // Route Prisma's own diagnostics through pino rather than stdout, so query
    // logs inherit our redaction rules and request correlation.
    log: isProduction
      ? [{ emit: 'event', level: 'warn' }, { emit: 'event', level: 'error' }]
      : [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
          ...(isTest ? [] : [{ emit: 'event', level: 'query' }]),
        ],
  });

  prisma.$on('warn', (event) => app.log.warn({ prisma: event }, 'prisma warning'));
  prisma.$on('error', (event) => app.log.error({ prisma: event }, 'prisma error'));
  if (!isProduction && !isTest) {
    prisma.$on('query', (event) =>
      app.log.debug({ durationMs: event.duration, query: event.query }, 'prisma query'),
    );
  }

  await prisma.$connect();

  app.decorate('prisma', prisma);

  // Fastify closes plugins in reverse registration order, so the pool is
  // released only after in-flight requests have drained.
  app.addHook('onClose', async (instance) => {
    instance.log.info('disconnecting prisma');
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
