import type { ShipmentStatus } from '@colistra/sdk';
import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

/** Shipments, most recent first, filtered by the API. */
export function useShipments({ status, orderNumber }: { status?: ShipmentStatus; orderNumber?: string }) {
  return useColistraQuery((colistra) => colistra.shipments.list({ status, orderNumber }), [status, orderNumber]);
}
