import type { BadgeTone } from '../../shared/ui/Badge';

interface StatusDisplay {
  label: string;
  tone: BadgeTone;
}

/** How each Colistra shipment status is shown to Inès. */
export const STATUS_DISPLAY: Record<string, StatusDisplay> = {
  label_created: { label: 'Label created', tone: 'neutral' },
  in_transit: { label: 'In transit', tone: 'info' },
  out_for_delivery: { label: 'Out for delivery', tone: 'progress' },
  delivered: { label: 'Delivered', tone: 'success' },
  exception: { label: 'Problem', tone: 'danger' },
};

export function getStatusDisplay(status: string): StatusDisplay {
  return STATUS_DISPLAY[status] ?? { label: status, tone: 'neutral' };
}
