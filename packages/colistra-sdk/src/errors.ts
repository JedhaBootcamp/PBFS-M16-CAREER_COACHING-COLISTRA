/** Shape of the JSON body Colistra returns for every non-2xx response. */
export interface ColistraErrorBody {
  error: {
    type: string;
    code: string;
    message: string;
    requestId?: string;
    fields?: Record<string, string>;
    retryAfter?: number;
  };
}

/**
 * Base class for every error thrown by the SDK.
 * Use `instanceof` on the subclasses to handle specific cases.
 */
export class ColistraError extends Error {
  /** HTTP status code, or `null` if the request never got a response (network failure). */
  readonly status: number | null;
  /** Machine-readable error code, e.g. `rate_limited` or `invalid_parcel`. */
  readonly code: string;
  /** Colistra request id. Include it when contacting support. */
  readonly requestId: string | null;

  constructor(message: string, options: { status: number | null; code: string; requestId?: string | null }) {
    super(message);
    this.name = 'ColistraError';
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId ?? null;
  }
}

/**
 * The request was rejected because a parameter is missing or invalid (HTTP 400 or 422).
 * Retrying the same request will fail again.
 */
export class ColistraValidationError extends ColistraError {
  /** Field-level messages, keyed by parameter path (e.g. `parcel.weightGrams`). */
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    options: { status: number; code: string; requestId?: string | null; fields?: Record<string, string> },
  ) {
    super(message, options);
    this.name = 'ColistraValidationError';
    this.fields = options.fields ?? {};
  }
}

/**
 * Too many requests were sent in a short period (HTTP 429).
 * Colistra allows 10 requests per 5 seconds per API key.
 */
export class ColistraRateLimitError extends ColistraError {
  /** Number of seconds to wait before sending another request. */
  readonly retryAfter: number;

  constructor(message: string, options: { code: string; requestId?: string | null; retryAfter: number }) {
    super(message, { ...options, status: 429 });
    this.name = 'ColistraRateLimitError';
    this.retryAfter = options.retryAfter;
  }
}

/** The requested object does not exist (HTTP 404). */
export class ColistraNotFoundError extends ColistraError {
  constructor(message: string, options: { code: string; requestId?: string | null }) {
    super(message, { ...options, status: 404 });
    this.name = 'ColistraNotFoundError';
  }
}

/**
 * Colistra or a carrier failed to process the request (HTTP 5xx),
 * or the network failed before a response was received (`status` is `null`).
 * These errors are usually temporary.
 */
export class ColistraServerError extends ColistraError {
  constructor(message: string, options: { status: number | null; code: string; requestId?: string | null }) {
    super(message, options);
    this.name = 'ColistraServerError';
  }
}

/** @internal Builds the right error subclass from an HTTP response. */
export function errorFromResponse(status: number, body: unknown, retryAfterHeader: string | null): ColistraError {
  const parsed = (body as Partial<ColistraErrorBody> | null)?.error;
  const message = parsed?.message ?? `Colistra API responded with HTTP ${status}`;
  const code = parsed?.code ?? 'unknown_error';
  const requestId = parsed?.requestId ?? null;

  if (status === 429) {
    const fromHeader = retryAfterHeader === null ? NaN : Number(retryAfterHeader);
    const retryAfter = Number.isFinite(fromHeader) ? fromHeader : (parsed?.retryAfter ?? 1);
    return new ColistraRateLimitError(message, { code, requestId, retryAfter });
  }
  if (status === 404) return new ColistraNotFoundError(message, { code, requestId });
  if (status === 400 || status === 422) {
    return new ColistraValidationError(message, { status, code, requestId, fields: parsed?.fields });
  }
  if (status >= 500) return new ColistraServerError(message, { status, code, requestId });
  return new ColistraError(message, { status, code, requestId });
}
