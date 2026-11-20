import type { Label, Order } from '@colistra/sdk';
import { CARRIER_NAMES } from '../../shared/colistra/carriers';
import { formatMoney } from '../../shared/format/money';
import { Button } from '../../shared/ui/Button';

interface LabelCreatedBannerProps {
  label: Label;
  order: Order;
  onDismiss: () => void;
}

export function LabelCreatedBanner({ label, order, onDismiss }: LabelCreatedBannerProps) {
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
      <p>
        Label created for <strong>{order.number}</strong> · {CARRIER_NAMES[label.carrier]} · {label.trackingNumber} · charged{' '}
        {formatMoney(label.charged)}
      </p>
      <div className="flex gap-2">
        <a href={label.labelUrl} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 font-medium underline-offset-2 hover:underline">
          Print label
        </a>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
