import type { HttpClient } from '../http';
import type { Label, LabelCreateOptions, LabelCreateParams } from '../types';

export class Labels {
  constructor(private readonly http: HttpClient) {}

  /**
   * Buys a shipping label for an order and **charges your Colistra account**.
   * The order moves to `labelled` and a new shipment is created with status `label_created`.
   *
   * **Every successful call creates and charges a new label**, even for an order that
   * already has one, unless you pass an `idempotencyKey`. With a key, Colistra returns
   * the original label (without charging again) for any request with the same key
   * in the next 24 hours. Reusing a key with different parameters is rejected.
   *
   * @param params `{ orderId, rateId }` (from `rates.quote()`) or `{ orderId, carrier }`.
   * @param options `{ idempotencyKey }`, strongly recommended.
   *
   * @throws {ColistraValidationError} if the rate expired, or the idempotency key was reused with different parameters.
   * @throws {ColistraNotFoundError} if the order does not exist.
   *
   * @example
   * const label = await colistra.labels.create(
   *   { orderId: order.id, rateId: rate.id },
   *   { idempotencyKey: `label:${order.id}:${rate.id}` },
   * );
   */
  create(params: LabelCreateParams, options: LabelCreateOptions = {}): Promise<Label> {
    return this.http.request('POST', '/labels', { body: params, idempotencyKey: options.idempotencyKey });
  }
}
