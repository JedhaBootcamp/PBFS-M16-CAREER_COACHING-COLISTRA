import type { Label, Order } from '@colistra/sdk';
import { useCallback, useState } from 'react';
import { useColistra } from '../../shared/colistra/useColistra';
import { labelIdempotencyKey, type LabelChoice } from './labelIdempotencyKey';

/**
 * Buys a shipping label for an order.
 *
 * Every purchase carries an idempotency key, so a double click, an SDK retry or a
 * manual retry after an error never charges Atelier Lune twice for the same label.
 */
export function useCreateLabel() {
  const colistra = useColistra();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ order: Order; choice: LabelChoice; error: unknown } | null>(null);

  const createLabel = useCallback(
    async (order: Order, choice: LabelChoice): Promise<Label | undefined> => {
      setPendingOrderId(order.id);
      setFailure(null);
      try {
        return await colistra.labels.create(
          { orderId: order.id, ...choice },
          { idempotencyKey: labelIdempotencyKey(order, choice) },
        );
      } catch (error) {
        setFailure({ order, choice, error });
      } finally {
        setPendingOrderId(null);
      }
    },
    [colistra],
  );

  const dismissFailure = useCallback(() => setFailure(null), []);

  return { createLabel, pendingOrderId, failure, dismissFailure };
}
