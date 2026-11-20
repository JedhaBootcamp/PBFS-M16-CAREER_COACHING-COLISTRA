import type { Carrier, Order } from '@colistra/sdk';

/** How Inès chose the carrier: a rate from a quote, or the default carrier's standard service. */
export type LabelChoice = { rateId: string } | { carrier: Carrier };

/**
 * The idempotency key for buying a label.
 *
 * It identifies the *purchase* (this order, with this rate or carrier), not the HTTP
 * request: double clicks, SDK retries and manual retries after an error all send the
 * same key, so Colistra returns the label it already bought instead of charging again.
 * A new quote gives new rate ids, hence a new key, so a deliberate second label is still possible.
 */
export function labelIdempotencyKey(order: Pick<Order, 'id'>, choice: LabelChoice): string {
  return 'rateId' in choice ? `label:${order.id}:rate:${choice.rateId}` : `label:${order.id}:carrier:${choice.carrier}`;
}
