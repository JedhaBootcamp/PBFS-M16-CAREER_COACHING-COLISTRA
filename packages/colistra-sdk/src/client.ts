import { HttpClient } from './http';
import { AccountResource } from './resources/account';
import { Labels } from './resources/labels';
import { Orders } from './resources/orders';
import { Rates } from './resources/rates';
import { Shipments } from './resources/shipments';

export const DEFAULT_BASE_URL = 'https://api.colistra.test/v1';

export interface ColistraOptions {
  /** Your secret API key (`sk_test_…` or `sk_live_…`). */
  apiKey: string;
  /** Override the API base URL. Defaults to `https://api.colistra.test/v1`. */
  baseUrl?: string;
  /**
   * How many times to retry a request that failed with a rate limit (429),
   * a server error (5xx) or a network error. Defaults to **0** (no retries).
   *
   * Rate-limited requests are retried after `retryAfter` seconds; other
   * errors with exponential backoff. See "Retries" in the README before
   * enabling retries on label creation.
   */
  maxRetries?: number;
  /** Custom `fetch` implementation. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/**
 * The Colistra API client. Create one instance and reuse it.
 *
 * @example
 * import { Colistra } from '@colistra/sdk';
 * const colistra = new Colistra({ apiKey: 'sk_test_…', maxRetries: 2 });
 */
export class Colistra {
  readonly orders: Orders;
  readonly shipments: Shipments;
  readonly rates: Rates;
  readonly labels: Labels;
  readonly account: AccountResource;

  constructor(options: ColistraOptions) {
    if (!options?.apiKey) throw new Error('Colistra: an apiKey is required');
    const maxRetries = options.maxRetries ?? 0;
    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
      throw new Error('Colistra: maxRetries must be a non-negative integer');
    }
    const http = new HttpClient({
      apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      maxRetries,
      fetch: options.fetch ?? ((...args) => globalThis.fetch(...args)),
    });
    this.orders = new Orders(http);
    this.shipments = new Shipments(http);
    this.rates = new Rates(http);
    this.labels = new Labels(http);
    this.account = new AccountResource(http);
  }
}
