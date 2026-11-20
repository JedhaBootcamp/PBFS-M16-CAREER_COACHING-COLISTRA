import type { ReactNode } from 'react';
import { CARRIER_NAMES } from '../../shared/colistra/carriers';
import { formatDate, formatDateTime } from '../../shared/format/date';
import { formatMoney } from '../../shared/format/money';
import { Button } from '../../shared/ui/Button';
import { LoadingState } from '../../shared/ui/LoadingState';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';
import { getStatusDisplay } from './shipmentStatus';
import { useShipment } from './useShipment';

export function ShipmentDetailPanel({ shipmentId, onClose }: { shipmentId: string; onClose: () => void }) {
  const { data: shipment, isLoading } = useShipment(shipmentId);

  return (
    <aside
      aria-label="Shipment details"
      className="fixed inset-y-0 right-0 z-10 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl ring-1 ring-clay-200"
    >
      <div className="flex items-center justify-between border-b border-clay-200 px-6 py-4">
        <h2 className="text-lg font-semibold">{shipment && !isLoading ? shipment.orderNumber : 'Shipment'}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {isLoading || !shipment ? (
        <LoadingState label="Loading shipment…" />
      ) : (
        <div className="space-y-6 px-6 py-5 text-sm">
          <div className="flex items-center gap-3">
            <ShipmentStatusBadge status={shipment.status} />
            <span className="text-ink/60">Updated {formatDateTime(shipment.updatedAt)}</span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Detail label="Carrier">
              {CARRIER_NAMES[shipment.carrier]}
              <span className="block text-xs text-ink/50">{shipment.service}</span>
            </Detail>
            <Detail label="Tracking number">
              <span className="font-mono">{shipment.trackingNumber}</span>
            </Detail>
            <Detail label="Recipient">
              {shipment.recipient.name}
              <span className="block text-xs text-ink/50">
                {shipment.recipient.postalCode} {shipment.recipient.city}
              </span>
            </Detail>
            <Detail label="Estimated delivery">{formatDate(shipment.estimatedDelivery)}</Detail>
            <Detail label="Label cost">{formatMoney(shipment.cost)}</Detail>
            <Detail label="Label">
              <a href={shipment.labelUrl} target="_blank" rel="noreferrer" className="font-medium text-clay-700 hover:underline">
                Open PDF
              </a>
            </Detail>
          </dl>

          <section>
            <h3 className="mb-3 text-xs font-medium tracking-wide text-ink/50 uppercase">Tracking history</h3>
            <ol className="space-y-4 border-l border-clay-200 pl-4">
              {shipment.events.map((event) => (
                <li key={event.occurredAt + event.status} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-clay-500 ring-4 ring-white" />
                  <p className="font-medium">{event.description}</p>
                  <p className="text-xs text-ink/50">
                    {formatDateTime(event.occurredAt)}
                    {event.location && ` · ${event.location}`} · {getStatusDisplay(event.status).label}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </aside>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink/50">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
