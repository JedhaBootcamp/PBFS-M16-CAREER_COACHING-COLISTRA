import type { Shipment } from '@colistra/sdk';
import { CARRIER_NAMES } from '../../shared/colistra/carriers';
import { formatRelative } from '../../shared/format/date';
import { formatMoney } from '../../shared/format/money';
import { cn } from '../../shared/ui/cn';
import { Table, Td, Th } from '../../shared/ui/Table';
import { ShipmentStatusBadge } from './ShipmentStatusBadge';

interface ShipmentsTableProps {
  shipments: Shipment[];
  selectedId: string | undefined;
  onSelect: (shipment: Shipment) => void;
}

export function ShipmentsTable({ shipments, selectedId, onSelect }: ShipmentsTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Order</Th>
          <Th>Recipient</Th>
          <Th>Carrier</Th>
          <Th>Status</Th>
          <Th className="text-right">Cost</Th>
          <Th className="text-right">Last update</Th>
        </tr>
      </thead>
      <tbody>
        {shipments.map((shipment) => (
          <tr
            key={shipment.id}
            data-testid="shipment-row"
            onClick={() => onSelect(shipment)}
            className={cn('cursor-pointer transition-colors hover:bg-clay-50', shipment.id === selectedId && 'bg-clay-100 hover:bg-clay-100')}
          >
            <Td>
              <p className="font-medium">{shipment.orderNumber}</p>
              <p className="font-mono text-xs text-ink/50">{shipment.trackingNumber}</p>
            </Td>
            <Td>
              <p>{shipment.recipient.name}</p>
              <p className="text-xs text-ink/50">
                {shipment.recipient.postalCode} {shipment.recipient.city}
              </p>
            </Td>
            <Td>
              <p>{CARRIER_NAMES[shipment.carrier]}</p>
              <p className="text-xs text-ink/50">{shipment.service}</p>
            </Td>
            <Td>
              <ShipmentStatusBadge status={shipment.status} />
            </Td>
            <Td className="text-right tabular-nums" data-testid="shipment-cost">
              {formatMoney(shipment.cost)}
            </Td>
            <Td className="text-right text-ink/60">{formatRelative(shipment.updatedAt)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
