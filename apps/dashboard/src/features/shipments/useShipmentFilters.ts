import { SHIPMENT_STATUSES, type ShipmentStatus } from '@colistra/sdk';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface ShipmentFilters {
  status: ShipmentStatus | undefined;
  /** Order number search, as typed by Inès. */
  search: string;
}

function parseStatus(value: string | null): ShipmentStatus | undefined {
  return SHIPMENT_STATUSES.includes(value as ShipmentStatus) ? (value as ShipmentStatus) : undefined;
}

/**
 * Shipment filters, stored in the URL (`?status=exception&q=10042`) so Inès can
 * bookmark "problem parcels" and keep her filters when she opens a shipment.
 */
export function useShipmentFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters: ShipmentFilters = {
    status: parseStatus(searchParams.get('status')),
    search: searchParams.get('q') ?? '',
  };

  const update = useCallback(
    (key: 'status' | 'q', value: string | undefined) => {
      setSearchParams(
        (params) => {
          if (value) params.set(key, value);
          else params.delete(key);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setStatus = useCallback((status: ShipmentStatus | undefined) => update('status', status), [update]);
  const setSearch = useCallback((search: string) => update('q', search), [update]);

  return { filters, setStatus, setSearch, searchParams };
}
