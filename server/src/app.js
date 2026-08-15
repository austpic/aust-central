import Fastify from 'fastify';

import { loggerOptions } from './config/logger.js';
import { registerZodCompilers } from './lib/validation.js';
import authPlugin from './plugins/auth.js';
import errorsPlugin from './plugins/errors.js';
import prismaPlugin from './plugins/prisma.js';
import securityPlugin from './plugins/security.js';
import authRoutes from './modules/auth/routes.js';
import bloodRoutes from './modules/blood/routes.js';
import bookRoutes from './modules/books/routes.js';
import cgpaRoutes from './modules/cgpa/routes.js';
import classReminderRoutes from './modules/class-reminders/routes.js';
import fileRoutes from './modules/files/routes.js';
import healthRoutes from './modules/health/routes.js';
import labReportRoutes from './modules/lab-reports/routes.js';
import lostFoundRoutes from './modules/lost-found/routes.js';
import meRoutes from './modules/me/routes.js';
import noticeRoutes from './modules/notices/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import taskRoutes from './modules/tasks/routes.js';
import transportRoutes from './modules/transport/routes.js';

export const API_PREFIX = '/api/v1';

/**
 * Assemble the application.
 *
 * Exported separately from the listen() call so tests can build a full instance
 * and drive it through `app.inject()` without binding a port.
 *
 * @param {object} [options] Fastify overrides, used by tests.
 */
export async function buildApp(options = {}) {
  const app = Fastify({
    logger: loggerOptions,
    // Correlates every log line for one request; echoed back on errors so a
    // user-reported failure can be found in the logs without guesswork.
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: false,
    // Only meaningful behind our own reverse proxy. Left on because rate
    // limiting and audit logs need the real client IP, not the proxy's.
    trustProxy: true,
    // Cap request bodies globally; multipart uploads set their own tighter cap.
    bodyLimit: 1024 * 1024,
    // Bound how long a slow client may hold a connection open.
    requestTimeout: 30_000,
    ...options,
  });

  registerZodCompilers(app);

  // Order matters: the error handler must be installed before anything that
  // could throw, and security headers before any route can reply.
  await app.register(errorsPlugin);
  await app.register(securityPlugin);
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // Probes sit at the root, outside the versioned API surface.
  await app.register(healthRoutes);

  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(meRoutes, { prefix: '/me' });

      // Academic
      await api.register(taskRoutes, { prefix: '/tasks' });
      await api.register(classReminderRoutes, { prefix: '/class-reminders' });
      await api.register(cgpaRoutes, { prefix: '/cgpa' });
      await api.register(labReportRoutes, { prefix: '/lab-reports' });

      // Community
      await api.register(noticeRoutes, { prefix: '/notices' });
      await api.register(bloodRoutes, { prefix: '/blood' });
      await api.register(lostFoundRoutes, { prefix: '/lost-found' });
      await api.register(bookRoutes, { prefix: '/books' });

      // Platform
      await api.register(transportRoutes, { prefix: '/transport' });
      await api.register(notificationRoutes, { prefix: '/notifications' });
      await api.register(fileRoutes, { prefix: '/files' });

      // Unauthenticated, so it names the API and nothing else — no environment,
      // version, or dependency detail for a scanner to collect.
      api.get('/', async () => ({ name: 'aust-central-api', version: 'v1' }));
    },
    { prefix: API_PREFIX },
  );

  return app;
}

export default buildApp;
