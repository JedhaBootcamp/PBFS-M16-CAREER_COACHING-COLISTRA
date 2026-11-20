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
  const [, setError] = useState<unknown>();

  const createLabel = useCallback(
    async (order: Order, choice: LabelChoice): Promise<Label | undefined> => {
      setPendingOrderId(order.id);
      try {
        return await colistra.labels.create(
          { orderId: order.id, ...choice },
          { idempotencyKey: labelIdempotencyKey(order, choice) },
        );
      } catch (error) {
        setError(() => {
          throw error;
        });
      } finally {
        setPendingOrderId(null);
      }
    },
    [colistra],
  );

  return { createLabel, pendingOrderId };
}
