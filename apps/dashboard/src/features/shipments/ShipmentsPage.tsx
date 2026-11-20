import { useNavigate, useParams } from 'react-router-dom';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { Button } from '../../shared/ui/Button';
import { Card } from '../../shared/ui/Card';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ShipmentDetailPanel } from './ShipmentDetailPanel';
import { ShipmentFilters } from './ShipmentFilters';
import { ShipmentsTable } from './ShipmentsTable';
import { useShipmentFilters } from './useShipmentFilters';
import { useShipments } from './useShipments';

export function ShipmentsPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { filters, setStatus, setSearch, searchParams } = useShipmentFilters();
  // Wait until Inès stops typing: one request per search, not one per keystroke (rate limit).
  const orderNumber = useDebouncedValue(filters.search.trim(), 300);
  const { shipments, error, isLoading, reload, hasMore, loadMore, isLoadingMore, loadMoreError } = useShipments({
    status: filters.status,
    orderNumber: orderNumber || undefined,
  });

  const isFiltered = Boolean(filters.status || orderNumber);
  // Keep the filters in the URL when opening or closing a shipment.
  const goTo = (path: string) => navigate({ pathname: path, search: searchParams.toString() });

  return (
    <>
      <PageHeader title="Shipments" description="Every parcel since it left the workshop, most recent first." />

      <ShipmentFilters filters={filters} onStatusChange={setStatus} onSearchChange={setSearch} />

      <Card>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : isLoading && !shipments ? (
          <LoadingState label="Loading shipments…" />
        ) : shipments?.length === 0 ? (
          isFiltered ? <EmptyState title="No shipments match these filters" /> : <EmptyState title="No shipments yet" />
        ) : (
          <div className={isLoading ? 'opacity-60 transition-opacity' : undefined}>
            <ShipmentsTable shipments={shipments ?? []} selectedId={shipmentId} onSelect={(shipment) => goTo(`/shipments/${shipment.id}`)} />
            {loadMoreError ? (
              <div className="p-4">
                <ErrorState compact error={loadMoreError} onRetry={loadMore} />
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <p className="text-xs text-ink/50">
                Showing {shipments?.length} shipments{hasMore ? '' : ' · that’s all of them'}
              </p>
              {hasMore && (
                <Button variant="secondary" size="sm" isLoading={isLoadingMore} disabled={isLoadingMore} onClick={loadMore}>
                  Load more
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {shipmentId && <ShipmentDetailPanel shipmentId={shipmentId} onClose={() => goTo('/shipments')} />}
    </>
  );
}
