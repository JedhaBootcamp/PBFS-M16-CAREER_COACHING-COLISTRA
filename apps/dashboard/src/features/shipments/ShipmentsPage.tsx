import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../shared/ui/Card';
import { EmptyState } from '../../shared/ui/EmptyState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { ShipmentDetailPanel } from './ShipmentDetailPanel';
import { ShipmentsTable } from './ShipmentsTable';
import { useShipments } from './useShipments';

export function ShipmentsPage() {
  const { shipmentId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useShipments();

  return (
    <>
      <PageHeader title="Shipments" description="Every parcel since it left the workshop, most recent first." />

      {/* TODO: filters */}
      <Card>
        {isLoading && !data ? (
          <LoadingState label="Loading shipments…" />
        ) : data?.data.length === 0 ? (
          <EmptyState title="No shipments yet" />
        ) : (
          <>
            <ShipmentsTable shipments={data?.data ?? []} selectedId={shipmentId} onSelect={(shipment) => navigate(`/shipments/${shipment.id}`)} />
            <p className="px-4 py-3 text-xs text-ink/50">Showing {data?.data.length} shipments</p>
          </>
        )}
      </Card>

      {shipmentId && <ShipmentDetailPanel shipmentId={shipmentId} onClose={() => navigate('/shipments')} />}
    </>
  );
}
