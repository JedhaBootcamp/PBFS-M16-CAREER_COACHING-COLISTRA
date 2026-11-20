import type { Label, Order } from '@colistra/sdk';
import { useCallback, useState } from 'react';
import { useColistra } from '../../shared/colistra/useColistra';
import { DEFAULT_CARRIER } from './defaultCarrier';

/** Buys a shipping label for an order with the default carrier. */
export function useCreateLabel() {
  const colistra = useColistra();
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [, setError] = useState<unknown>();

  const createLabel = useCallback(
    async (order: Order): Promise<Label | undefined> => {
      setPendingOrderId(order.id);
      try {
        return await colistra.labels.create({ orderId: order.id, carrier: DEFAULT_CARRIER });
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
