import type { Order } from '@colistra/sdk';
import { CARRIER_NAMES } from '../../shared/colistra/carriers';
import { formatRelative } from '../../shared/format/date';
import { formatMoney } from '../../shared/format/money';
import { Button } from '../../shared/ui/Button';
import { Table, Td, Th } from '../../shared/ui/Table';
import { DEFAULT_CARRIER } from '../labels/defaultCarrier';
import { formatDimensions, formatWeight } from './formatPackage';

interface OrdersTableProps {
  orders: Order[];
  pendingOrderId: string | null;
  onCreateLabel: (order: Order) => void;
  onCompareRates: (order: Order) => void;
}

export function OrdersTable({ orders, pendingOrderId, onCreateLabel, onCompareRates }: OrdersTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Order</Th>
          <Th>Ship to</Th>
          <Th>Items</Th>
          <Th>Package</Th>
          <Th className="text-right">Total</Th>
          <Th className="text-right">
            <span className="sr-only">Actions</span>
          </Th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id} data-testid="order-row">
            <Td>
              <p className="font-medium">{order.number}</p>
              <p className="text-xs text-ink/50">{formatRelative(order.createdAt)}</p>
            </Td>
            <Td>
              <p>{order.shippingAddress.name}</p>
              <p className="text-xs text-ink/50">
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
              </p>
            </Td>
            <Td className="max-w-56">
              <p className="truncate">{order.items[0].name}</p>
              {order.items.length > 1 && <p className="text-xs text-ink/50">+ {order.items.length - 1} more</p>}
            </Td>
            <Td>
              <p>{formatWeight(order.package.weight)}</p>
              <p className="text-xs text-ink/50">{formatDimensions(order.package.dimensions)}</p>
            </Td>
            <Td className="text-right tabular-nums">{formatMoney(order.total)}</Td>
            <Td>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" disabled={pendingOrderId === order.id} onClick={() => onCompareRates(order)}>
                  Compare rates
                </Button>
                <Button
                  size="sm"
                  isLoading={pendingOrderId === order.id}
                  disabled={pendingOrderId === order.id}
                  onClick={() => onCreateLabel(order)}
                >
                  Create label · {CARRIER_NAMES[DEFAULT_CARRIER]}
                </Button>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
