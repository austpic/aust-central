import { ZodType } from 'zod';

/**
 * Wires Zod into Fastify's schema slots.
 *
 * On plain JavaScript there is no compile-time type checking, so these runtime
 * schemas are the only thing standing between a request body and the database.
 * Registering them as Fastify's validator means a route physically cannot skip
 * validation — it is declarative, not a call the author might forget.
 */

/**
 * Validates body / params / query / headers.
 * Non-Zod schemas fall through untouched so Fastify's JSON Schema still works.
 */
export function zodValidatorCompiler({ schema }) {
  if (!(schema instanceof ZodType)) {
    return (data) => ({ value: data });
  }
  return (data) => {
    const result = schema.safeParse(data);
    if (result.success) {
      // Return the PARSED value, not the raw input: coercions, defaults, and
      // stripped unknown keys only take effect if the parsed object is used.
      return { value: result.data };
    }
    return { error: result.error };
  };
}

/**
 * Validates responses on the way out.
 *
 * This is the allowlist that keeps `passwordHash`, `tokenHash`, and internal
 * columns out of payloads: anything not named in the response schema is
 * stripped before serialisation, no matter what the service returned.
 */
export function zodSerializerCompiler({ schema }) {
  if (!(schema instanceof ZodType)) {
    return (data) => JSON.stringify(data);
  }
  return (data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      // A response that fails its own contract is a server bug. Throwing here
      // surfaces it as a 500 rather than quietly shipping a malformed body.
      throw new ResponseValidationError(result.error);
    }
    return JSON.stringify(result.data);
  };
}

export class ResponseValidationError extends Error {
  /** @param {import('zod').ZodError} zodError */
  constructor(zodError) {
    super('Response failed its schema contract');
    this.name = 'ResponseValidationError';
    this.cause = zodError;
    this.statusCode = 500;
  }
}

/** Apply both compilers to a Fastify instance (or encapsulated scope). */
export function registerZodCompilers(app) {
  app.setValidatorCompiler(zodValidatorCompiler);
  app.setSerializerCompiler(zodSerializerCompiler);
  return app;
}
