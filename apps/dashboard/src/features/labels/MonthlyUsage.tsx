import type { Account } from '@colistra/sdk';
import { formatMoney } from '../../shared/format/money';

export function MonthlyUsage({ account, error }: { account: Account | undefined; error?: unknown }) {
  if (error) {
    return <p className="text-sm text-ink/50">This month's usage is unavailable right now.</p>;
  }

  return (
    <dl className="flex gap-6 rounded-xl bg-white px-5 py-3 text-sm shadow-sm ring-1 ring-clay-200" data-testid="monthly-usage">
      <div>
        <dt className="text-xs text-ink/50">Labels this month</dt>
        <dd className="font-semibold tabular-nums" data-testid="labels-this-month">
          {account ? account.labelsThisMonth : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-ink/50">Charged this month</dt>
        <dd className="font-semibold tabular-nums" data-testid="charged-this-month">
          {account ? formatMoney(account.chargesThisMonth) : '—'}
        </dd>
      </div>
    </dl>
  );
}
