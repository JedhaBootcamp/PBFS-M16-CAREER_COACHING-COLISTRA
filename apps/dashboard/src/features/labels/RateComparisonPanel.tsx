import { ColistraValidationError, type Order, type Rate } from '@colistra/sdk';
import { useState } from 'react';
import { CARRIER_NAMES } from '../../shared/colistra/carriers';
import { formatMoney } from '../../shared/format/money';
import { Badge } from '../../shared/ui/Badge';
import { Button } from '../../shared/ui/Button';
import { cn } from '../../shared/ui/cn';
import { ErrorState } from '../../shared/ui/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState';
import { formatDimensions, formatWeight } from '../orders/formatPackage';
import { cheapestRate, fastestRate, isExpired, sortRatesByPrice } from './rates';
import { useRateQuote } from './useRateQuote';

interface RateComparisonPanelProps {
  order: Order;
  isBuying: boolean;
  /** The error from the last purchase attempt for this order, if any. */
  buyError: unknown;
  onBuy: (rate: Rate) => void;
  onDismissError: () => void;
  onClose: () => void;
}

export function RateComparisonPanel({ order, isBuying, buyError, onBuy, onDismissError, onClose }: RateComparisonPanelProps) {
  const quote = useRateQuote(order);
  const rates = quote.data ? sortRatesByPrice(quote.data.rates) : [];
  const cheapest = cheapestRate(rates);
  const fastest = fastestRate(rates);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const selected = rates.find((rate) => rate.id === selectedId) ?? cheapest;

  function refreshPrices(message: string) {
    onDismissError();
    setSelectedId(null);
    setNotice(message);
    quote.reload();
  }

  function buy() {
    if (!selected) return;
    if (isExpired(selected)) {
      refreshPrices('Prices had expired and were refreshed. Check them, then buy again.');
      return;
    }
    setNotice(null);
    onBuy(selected);
  }

  const rateExpired = buyError instanceof ColistraValidationError && buyError.code === 'rate_expired';

  return (
    <aside
      aria-label={`Compare rates for ${order.number}`}
      className="fixed inset-y-0 right-0 z-10 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-clay-200"
    >
      <div className="flex items-center justify-between border-b border-clay-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Compare rates · {order.number}</h2>
          <p className="text-xs text-ink/50">
            {order.shippingAddress.postalCode} {order.shippingAddress.city} · {formatWeight(order.package.weight)} ·{' '}
            {formatDimensions(order.package.dimensions)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {notice && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">{notice}</p>}

        {quote.error ? (
          <ErrorState error={quote.error} onRetry={quote.reload} />
        ) : quote.isLoading ? (
          <LoadingState label="Asking carriers for prices…" />
        ) : rates.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink/60">No carrier can ship this parcel.</p>
        ) : (
          <fieldset>
            <legend className="sr-only">Carrier</legend>
            <ul className="space-y-2">
              {rates.map((rate) => (
                <li key={rate.id}>
                  <label
                    data-testid="rate-option"
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 ring-1 transition-colors',
                      rate.id === selected?.id ? 'bg-clay-50 ring-2 ring-clay-500' : 'ring-clay-200 hover:bg-clay-50',
                    )}
                  >
                    <input
                      type="radio"
                      name="rate"
                      className="accent-clay-600"
                      checked={rate.id === selected?.id}
                      onChange={() => setSelectedId(rate.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2 font-medium">
                        {CARRIER_NAMES[rate.carrier]}
                        {rate.id === cheapest?.id && <Badge tone="success">Cheapest</Badge>}
                        {rate.id === fastest?.id && <Badge tone="progress">Fastest</Badge>}
                      </span>
                      <span className="block text-xs text-ink/50">
                        {rate.service} · {rate.estimatedDays} business day{rate.estimatedDays > 1 ? 's' : ''}
                      </span>
                    </span>
                    <span className="font-semibold tabular-nums">{formatMoney(rate.price)}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}
      </div>

      <div className="space-y-3 border-t border-clay-200 px-6 py-4">
        {buyError != null &&
          (rateExpired ? (
            <ErrorState compact error={buyError} onRetry={() => refreshPrices('Prices were refreshed. Check them, then buy again.')} />
          ) : (
            <ErrorState
              compact
              error={buyError}
              hint="The label may or may not have been bought. Trying again is safe: Colistra never charges twice for the same label."
              onRetry={buy}
            />
          ))}
        <Button className="w-full" disabled={!selected || isBuying || quote.isLoading} isLoading={isBuying} onClick={buy}>
          {selected ? `Buy label · ${CARRIER_NAMES[selected.carrier]} · ${formatMoney(selected.price)}` : 'Buy label'}
        </Button>
      </div>
    </aside>
  );
}
