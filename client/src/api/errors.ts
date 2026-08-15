/**
 * A failure the UI can show a user.
 *
 * Mirrors lib/data/api/api_exception.dart's ApiException: the server replies
 * with a consistent envelope —
 *   { error: { code, message, details: { fields } }, requestId }
 * — and this unwraps it so views never parse a raw fetch Response.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;
  readonly fieldErrors: Record<string, string[]>;
  readonly requestId?: string;

  constructor(params: {
    message: string;
    code?: string;
    status?: number | null;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.code = params.code ?? 'UNKNOWN';
    this.status = params.status ?? null;
    this.fieldErrors = params.fieldErrors ?? {};
    this.requestId = params.requestId;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isNotFound() {
    return this.status === 404;
  }
  get isValidation() {
    return this.status === 422;
  }
  get isRateLimited() {
    return this.status === 429;
  }

  /** First validation message for a field, if any — for inline field errors. */
  errorFor(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }

  /** Build from a fetch Response whose body is the server's error envelope. */
  static async fromResponse(response: Response): Promise<ApiError> {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // Non-JSON body (proxy error page, etc.) — fall through to the generic case.
    }

    if (
      body &&
      typeof body === 'object' &&
      'error' in body &&
      body.error &&
      typeof body.error === 'object'
    ) {
      const err = body.error as {
        code?: string;
        message?: string;
        details?: { fields?: Record<string, string[]> };
      };
      return new ApiError({
        message: err.message ?? 'Something went wrong',
        code: err.code ?? 'UNKNOWN',
        status: response.status,
        fieldErrors: err.details?.fields ?? {},
        requestId: (body as { requestId?: string }).requestId,
      });
    }

    return new ApiError({
      message: 'Something went wrong. Please try again.',
      code: 'UNKNOWN',
      status: response.status,
    });
  }

  /** Network failure — no response reached us at all. */
  static network(cause?: unknown): ApiError {
    const timedOut = cause instanceof DOMException && cause.name === 'AbortError';
    return new ApiError({
      message: timedOut
        ? 'The server took too long to respond. Check your connection and try again.'
        : 'Could not reach the server. Check your connection and try again.',
      code: 'NETWORK',
    });
  }
}
