/**
 * Application error taxonomy.
 *
 * Services throw these; the error plugin turns them into responses. Anything
 * that is NOT an AppError is treated as an unexpected fault and reported to the
 * client as a bare 500 with no detail — that boundary is what stops stack
 * traces and driver messages from leaking.
 */

export class AppError extends Error {
  /**
   * @param {string} message  Safe to show the client.
   * @param {object} options
   * @param {number} options.statusCode
   * @param {string} options.code      Stable machine-readable code for the app.
   * @param {object} [options.details] Extra safe context (e.g. field errors).
   */
  constructor(message, { statusCode, code, details }) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Marks this as intentional, so the handler knows the message is publishable.
    this.expose = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(message, { statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 422, code: 'VALIDATION_FAILED', details });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this resource') {
    super(message, { statusCode: 403, code: 'FORBIDDEN' });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details) {
    super(message, { statusCode: 409, code: 'CONFLICT', details });
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = 'Payload too large') {
    super(message, { statusCode: 413, code: 'PAYLOAD_TOO_LARGE' });
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported media type') {
    super(message, { statusCode: 415, code: 'UNSUPPORTED_MEDIA_TYPE' });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', details) {
    super(message, { statusCode: 429, code: 'TOO_MANY_REQUESTS', details });
  }
}

/**
 * Deliberately indistinguishable from NotFound.
 *
 * When a user asks for a row that exists but belongs to someone else, replying
 * 403 confirms the row exists. Ownership failures therefore surface as 404 —
 * the caller cannot tell "no such record" from "not yours".
 */
export function notFoundOrForbidden(resource = 'Resource') {
  return new NotFoundError(`${resource} not found`);
}
