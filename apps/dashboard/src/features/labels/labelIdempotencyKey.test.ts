import { describe, expect, it } from 'vitest';
import { labelIdempotencyKey } from './labelIdempotencyKey';

describe('labelIdempotencyKey', () => {
  const order = { id: 'ord_123' };

  it('is the same for the same order and choice, so retries never buy twice', () => {
    expect(labelIdempotencyKey(order, { carrier: 'colissimo' })).toBe(labelIdempotencyKey(order, { carrier: 'colissimo' }));
    expect(labelIdempotencyKey(order, { rateId: 'rate_1' })).toBe(labelIdempotencyKey(order, { rateId: 'rate_1' }));
  });

  it('differs between orders, carriers and rates', () => {
    const keys = new Set([
      labelIdempotencyKey(order, { carrier: 'colissimo' }),
      labelIdempotencyKey(order, { carrier: 'dhl' }),
      labelIdempotencyKey(order, { rateId: 'rate_1' }),
      labelIdempotencyKey(order, { rateId: 'rate_2' }),
      labelIdempotencyKey({ id: 'ord_456' }, { carrier: 'colissimo' }),
    ]);
    expect(keys.size).toBe(5);
  });

  it('fits in the 255 characters Colistra accepts', () => {
    expect(labelIdempotencyKey(order, { rateId: 'rate_' + 'x'.repeat(40) }).length).toBeLessThanOrEqual(255);
  });
});
