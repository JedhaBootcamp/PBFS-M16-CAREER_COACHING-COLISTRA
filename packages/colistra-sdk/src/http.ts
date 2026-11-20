import { ColistraError, ColistraRateLimitError, ColistraServerError, errorFromResponse } from './errors';

export interface HttpClientOptions {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  fetch: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  idempotencyKey?: string;
}

const SDK_VERSION = '2.3.1';

/** @internal Thin wrapper around `fetch` that handles auth, errors and retries. */
export class HttpClient {
  constructor(private readonly options: HttpClientOptions) {}

  async request<T>(method: 'GET' | 'POST', path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.query);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.options.apiKey}`,
      Accept: 'application/json',
      'Colistra-Sdk-Version': SDK_VERSION,
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

    for (let attempt = 0; ; attempt++) {
      let error: ColistraError;
      try {
        const response = await this.options.fetch(url, {
          method,
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
        });
        const body: unknown = await response.json().catch(() => null);
        if (response.ok) return body as T;
        error = errorFromResponse(response.status, body, response.headers.get('Retry-After'));
      } catch (cause) {
        if (cause instanceof ColistraError) throw cause;
        error = new ColistraServerError('Could not reach the Colistra API', { status: null, code: 'network_error' });
      }

      if (attempt >= this.options.maxRetries || !isRetryable(error)) throw error;
      await sleep(retryDelayMs(error, attempt));
    }
  }

  private buildUrl(path: string, query: RequestOptions['query']): string {
    const url = new URL(this.options.baseUrl.replace(/\/$/, '') + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
    }
    return url.toString();
  }
}

function isRetryable(error: ColistraError): boolean {
  return error instanceof ColistraRateLimitError || error instanceof ColistraServerError;
}

function retryDelayMs(error: ColistraError, attempt: number): number {
  if (error instanceof ColistraRateLimitError) return error.retryAfter * 1000;
  const backoff = Math.min(500 * 2 ** attempt, 8000);
  return backoff / 2 + Math.random() * (backoff / 2);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
