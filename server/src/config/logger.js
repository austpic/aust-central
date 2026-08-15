import { env, isProduction, isTest } from './env.js';

/**
 * Pino configuration.
 *
 * The redaction list is the important part: credentials pass through headers
 * and bodies on nearly every auth route, and a debug-level log of a raw request
 * would otherwise write passwords and bearer tokens to disk in plaintext.
 */
export const loggerOptions = isTest
  ? false
  : {
      level: env.LOG_LEVEL,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]',
          '*.password',
          '*.currentPassword',
          '*.newPassword',
          '*.confirmPassword',
          '*.token',
          '*.refreshToken',
          '*.accessToken',
          '*.passwordHash',
          '*.tokenHash',
          '*.PASSWORD_PEPPER',
          '*.JWT_ACCESS_SECRET',
        ],
        censor: '[REDACTED]',
      },
      // Default serialisers dump every header and the full body; these keep
      // request logs to what is useful for tracing.
      serializers: {
        req(request) {
          return {
            method: request.method,
            url: request.url,
            // Trust the proxy's forwarded IP only where we terminate TLS.
            remoteAddress: request.ip,
            userAgent: request.headers['user-agent'],
          };
        },
        res(reply) {
          return { statusCode: reply.statusCode };
        },
      },
      transport: isProduction
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss.l' } },
    };
