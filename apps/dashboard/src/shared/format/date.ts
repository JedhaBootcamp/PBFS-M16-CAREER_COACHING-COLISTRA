import { LOCALE, TIME_ZONE } from './locale';

const dateFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

/** `2026-03-14` or `2026-03-14T08:30:00Z` → `14 mars 2026`, or `—` when there is no date. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return dateFormatter.format(new Date(iso));
}

/** `2026-03-14T08:30:00Z` → `14 mars, 09:30` (Paris time) */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });

/** `2026-03-14T08:30:00Z` → `il y a 3 heures` */
export function formatRelative(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return relativeFormatter.format(0, 'minute');
}
