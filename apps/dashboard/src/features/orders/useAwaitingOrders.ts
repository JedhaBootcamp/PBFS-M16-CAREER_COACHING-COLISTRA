import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

/** Orders that still need a shipping label, most recent first. */
export function useAwaitingOrders() {
  return useColistraQuery((colistra) => colistra.orders.list({ status: 'awaiting_label', limit: 50 }), []);
}
