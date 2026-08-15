import { buildApp } from './app.js';
import { env } from './config/env.js';

/**
 * Process entrypoint: boot, listen, and shut down cleanly.
 *
 * Graceful shutdown matters more than it looks. On redeploy the orchestrator
 * sends SIGTERM; without draining, in-flight requests are severed mid-write and
 * Postgres connections are abandoned rather than returned to the pool.
 */

const app = await buildApp();

// Belt-and-braces: a rejection that escapes a handler should not leave the
// process running in an undefined state.
process.on('unhandledRejection', (reason) => {
  app.log.fatal({ err: reason }, 'unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  app.log.fatal({ err: error }, 'uncaught exception');
  process.exit(1);
});

let shuttingDown = false;

/** @param {NodeJS.Signals} signal */
async function shutdown(signal) {
  // A second Ctrl-C should not race two close() calls against each other.
  if (shuttingDown) return;
  shuttingDown = true;

  app.log.info({ signal }, 'shutting down');

  // Hard ceiling: if draining stalls, exit anyway rather than hang the deploy.
  const forceExit = setTimeout(() => {
    app.log.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    // Runs onClose hooks in reverse order, so Prisma disconnects last.
    await app.close();
    app.log.info('shutdown complete');
    process.exit(0);
  } catch (error) {
    app.log.error({ err: error }, 'error during shutdown');
    process.exit(1);
  }
}

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => void shutdown(signal));
}

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.fatal({ err: error }, 'failed to start server');
  process.exit(1);
}
