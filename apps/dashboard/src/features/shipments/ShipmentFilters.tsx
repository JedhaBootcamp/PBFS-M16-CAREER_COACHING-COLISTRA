import { SHIPMENT_STATUSES, ShipmentStatus } from '@colistra/sdk';
import { Button } from '../../shared/ui/Button';
import type { ShipmentFilters as Filters } from './useShipmentFilters';
import { getStatusDisplay } from './shipmentStatus';

interface ShipmentFiltersProps {
  filters: Filters;
  onStatusChange: (status: ShipmentStatus | undefined) => void;
  onSearchChange: (search: string) => void;
}

const inputClass = 'rounded-lg bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-clay-200 focus:ring-2 focus:ring-clay-500 focus:outline-none';

export function ShipmentFilters({ filters, onStatusChange, onSearchChange }: ShipmentFiltersProps) {
  const showingProblems = filters.status === ShipmentStatus.Exception;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <label className="sr-only" htmlFor="shipment-search">
        Search by order number
      </label>
      <input
        id="shipment-search"
        type="search"
        placeholder="Order number, e.g. AL-10042"
        value={filters.search}
        onChange={(event) => onSearchChange(event.target.value)}
        className={`${inputClass} w-64`}
      />

      <label className="sr-only" htmlFor="shipment-status">
        Status
      </label>
      <select
        id="shipment-status"
        value={filters.status ?? ''}
        onChange={(event) => onStatusChange((event.target.value || undefined) as ShipmentStatus | undefined)}
        className={inputClass}
      >
        <option value="">All statuses</option>
        {SHIPMENT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {getStatusDisplay(status).label}
          </option>
        ))}
      </select>

      <Button variant={showingProblems ? 'primary' : 'secondary'} onClick={() => onStatusChange(showingProblems ? undefined : ShipmentStatus.Exception)}>
        {showingProblems ? 'Showing problems only' : 'Show problems only'}
      </Button>

      {(filters.status || filters.search) && (
        <Button
          variant="ghost"
          onClick={() => {
            onStatusChange(undefined);
            onSearchChange('');
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
