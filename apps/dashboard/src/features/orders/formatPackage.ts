import type { Order } from '@colistra/sdk';
import { LOCALE } from '../../shared/format/locale';

const weightFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** `{ value: 1.35, unit: 'kg' }` → `1,35 kg` */
export function formatWeight(weight: Order['package']['weight']): string {
  return `${weightFormatter.format(weight.value)} ${weight.unit}`;
}

/** → `30 × 22 × 18 cm` */
export function formatDimensions({ length, width, height, unit }: Order['package']['dimensions']): string {
  return `${length} × ${width} × ${height} ${unit}`;
}
