import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

/** Shipments, most recent first. */
export function useShipments() {
  return useColistraQuery((colistra) => colistra.shipments.list(), []);
}
