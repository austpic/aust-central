import fp from 'fastify-plugin';
import { ZodError } from 'zod';

import { AppError } from '../lib/errors.js';
import { isProduction } from '../config/env.js';

/**
 * The single boundary between thrown errors and HTTP responses.
 *
 * Rule: only errors we constructed deliberately (AppError) may describe
 * themselves to the client. Everything else — Prisma faults, TypeErrors,
 * driver messages — collapses to an opaque 500. Those messages routinely
 * contain table names, SQL fragments, and file paths.
 */

/** Prisma error codes we can safely translate into a client-meaningful reply. */
function fromPrisma(error) {
  switch (error.code) {
    case 'P2002': // unique constraint violation
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'That value is already taken',
        // Field names are our own schema's, and knowing which field collided is
        // necessary for the client to render the error. No row data is exposed.
        details: { fields: error.meta?.target ?? undefined },
      };
    case 'P2025': // record required by the operation was not found
      return { statusCode: 404, code: 'NOT_FOUND', message: 'Resource not found' };
    case 'P2003': // foreign key constraint violation
      return {
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Referenced resource does not exist',
      };
    default:
      return null;
  }
}

/** Flatten a ZodError into `{ "field.path": ["message"] }`. */
function formatZodIssues(error) {
  const fields = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

async function errorsPlugin(app) {
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` },
      requestId: request.id,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const respond = ({ statusCode, code, message, details }) => {
      reply.code(statusCode).send({
        error: { code, message, ...(details ? { details } : {}) },
        requestId: request.id,
      });
    };

    if (error instanceof AppError) {
      // Client's own fault: log quietly, no stack.
      request.log.info(
        { code: error.code, statusCode: error.statusCode },
        'handled application error',
      );
      return respond(error);
    }

    if (error instanceof ZodError) {
      request.log.info('request failed validation');
      return respond({
        statusCode: 422,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: { fields: formatZodIssues(error) },
      });
    }

    // Fastify's own schema validation (body/params/query compiled by Zod).
    if (error.validation) {
      return respond({
        statusCode: 422,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: { fields: { [error.validationContext ?? '_']: [error.message] } },
      });
    }

    if (typeof error.code === 'string' && error.code.startsWith('P')) {
      const mapped = fromPrisma(error);
      if (mapped) {
        request.log.warn({ prismaCode: error.code }, 'handled database constraint error');
        return respond(mapped);
      }
    }

    if (error.statusCode === 429) {
      return respond({
        statusCode: 429,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests — slow down and try again shortly',
      });
    }

    if (error.statusCode === 413 || error.code === 'FST_REQ_FILE_TOO_LARGE') {
      return respond({
        statusCode: 413,
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Upload exceeds the maximum allowed size',
      });
    }

    // Anything reaching here is a bug. Log it in full; tell the client nothing.
    request.log.error({ err: error }, 'unhandled error');
    return respond({
      statusCode: error.statusCode && error.statusCode < 500 ? error.statusCode : 500,
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : `An unexpected error occurred: ${error.message}`,
    });
  });
}

export default fp(errorsPlugin, { name: 'errors' });
