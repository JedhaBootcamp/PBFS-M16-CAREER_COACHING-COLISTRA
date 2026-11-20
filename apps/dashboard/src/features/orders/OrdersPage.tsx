import type { Label, Order } from '@colistra/sdk';
import { useState } from 'react';
import { describeError } from '../../shared/colistra/describeError';
import { Card } from '../../shared/ui/Card';
import { EmptyState } from '../../shared/ui/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { PageHeader } from '../../shared/ui/PageHeader';
import { LabelCreatedBanner } from '../labels/LabelCreatedBanner';
import { DEFAULT_CARRIER } from '../labels/defaultCarrier';
import type { LabelChoice } from '../labels/labelIdempotencyKey';
import { MonthlyUsage } from '../labels/MonthlyUsage';
import { RateComparisonPanel } from '../labels/RateComparisonPanel';
import { useCreateLabel } from '../labels/useCreateLabel';
import { useMonthlyUsage } from '../labels/useMonthlyUsage';
import { OrdersTable } from './OrdersTable';
import { useAwaitingOrders } from './useAwaitingOrders';

export function OrdersPage() {
  const orders = useAwaitingOrders();
  const usage = useMonthlyUsage();
  const { createLabel, pendingOrderId, failure, dismissFailure } = useCreateLabel();
  const [lastLabel, setLastLabel] = useState<{ label: Label; order: Order } | null>(null);
  const [comparingOrder, setComparingOrder] = useState<Order | null>(null);

  async function handleCreateLabel(order: Order, choice: LabelChoice = { carrier: DEFAULT_CARRIER }) {
    const label = await createLabel(order, choice);
    if (!label) return;
    setComparingOrder(null);
    setLastLabel({ label, order });
    orders.reload();
    usage.reload();
  }

  const count = orders.data?.data.length;

  return (
    <>
      <PageHeader
        title="Orders to ship"
        description={count === undefined ? 'Loading orders…' : `${count} orders waiting for a label`}
        actions={<MonthlyUsage account={usage.data} error={usage.error} />}
      />

      {lastLabel && <LabelCreatedBanner {...lastLabel} onDismiss={() => setLastLabel(null)} />}

      {failure && failure.order.id !== comparingOrder?.id && (
        <div className="mb-4">
          <ErrorState
            compact
            error={failure.error}
            hint={
              describeError(failure.error).canRetry
                ? `The label for ${failure.order.number} may or may not have been bought. Trying again is safe: Colistra never charges twice for the same label.`
                : undefined
            }
            onRetry={() => {
              dismissFailure();
              handleCreateLabel(failure.order, failure.choice);
            }}
          />
        </div>
      )}

      <Card>
        {orders.error ? (
          <ErrorState error={orders.error} onRetry={orders.reload} />
        ) : orders.isLoading && !orders.data ? (
          <LoadingState label="Loading orders…" />
        ) : orders.data?.data.length === 0 ? (
          <EmptyState title="All caught up">Every order has a label. Time for a coffee.</EmptyState>
        ) : (
          <OrdersTable
            orders={orders.data?.data ?? []}
            pendingOrderId={pendingOrderId}
            onCreateLabel={handleCreateLabel}
            onCompareRates={(order) => {
              dismissFailure();
              setComparingOrder(order);
            }}
          />
        )}
      </Card>

      {comparingOrder && (
        <RateComparisonPanel
          key={comparingOrder.id}
          order={comparingOrder}
          isBuying={pendingOrderId === comparingOrder.id}
          buyError={failure?.order.id === comparingOrder.id ? failure.error : null}
          onBuy={(rate) => handleCreateLabel(comparingOrder, { rateId: rate.id })}
          onDismissError={dismissFailure}
          onClose={() => setComparingOrder(null)}
        />
      )}
    </>
  );
}
