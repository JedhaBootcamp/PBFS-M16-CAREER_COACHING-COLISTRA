import type { ShipmentStatus } from '@colistra/sdk';
import type { BadgeTone } from '../../shared/ui/Badge';

interface StatusDisplay {
  label: string;
  tone: BadgeTone;
}

/**
 * How each Colistra shipment status is shown to Inès.
 * Typed with `ShipmentStatus` so a status added to the SDK fails the type check here.
 */
export const STATUS_DISPLAY: Record<ShipmentStatus, StatusDisplay> = {
  label_created: { label: 'Label created', tone: 'neutral' },
  in_transit: { label: 'In transit', tone: 'info' },
  out_for_delivery: { label: 'Out for delivery', tone: 'progress' },
  delivered: { label: 'Delivered', tone: 'success' },
  exception: { label: 'Problem', tone: 'danger' },
  returned: { label: 'Returned to sender', tone: 'warning' },
};

export function getStatusDisplay(status: string): StatusDisplay {
  return STATUS_DISPLAY[status as ShipmentStatus] ?? { label: status, tone: 'neutral' };
}
