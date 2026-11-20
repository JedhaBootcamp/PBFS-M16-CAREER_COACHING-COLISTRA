import type { Money } from '@colistra/sdk';
import { LOCALE } from './locale';

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency });
    formatters.set(currency, formatter);
  }
  return formatter;
}

/** Formats a Colistra amount (integer cents) for display: `{ amount: 1290 }` → `12,90 €`. */
export function formatMoney(money: Money): string {
  return formatterFor(money.currency).format(money.amount / 100);
}
