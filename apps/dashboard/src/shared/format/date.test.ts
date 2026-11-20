import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatRelative } from './date';

describe('date formatting', () => {
  it('shows date-times in Paris time', () => {
    // 23:30 UTC on 14 March is already 15 March in Paris.
    expect(formatDateTime('2026-03-14T23:30:00Z')).toContain('15 mars');
    expect(formatDateTime('2026-03-14T23:30:00Z')).toContain('00:30');
  });

  it('formats calendar dates', () => {
    expect(formatDate('2026-03-14')).toBe('14 mars 2026');
  });

  it('formats relative times', () => {
    const now = Date.parse('2026-03-14T12:00:00Z');
    expect(formatRelative('2026-03-14T09:00:00Z', now)).toBe('il y a 3 heures');
    expect(formatRelative('2026-03-13T12:00:00Z', now)).toBe('hier');
  });
});
