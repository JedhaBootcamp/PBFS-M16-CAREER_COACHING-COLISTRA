import type { ShipmentStatus } from '@colistra/sdk';
import { Badge } from '../../shared/ui/Badge';
import { getStatusDisplay } from './shipmentStatus';

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  const { label, tone } = getStatusDisplay(status);
  return <Badge tone={tone}>{label}</Badge>;
}
