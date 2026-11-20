import { useColistraQuery } from '../../shared/colistra/useColistraQuery';

/** A single shipment with its tracking history. */
export function useShipment(id: string) {
  return useColistraQuery((colistra) => colistra.shipments.retrieve(id), [id]);
}
