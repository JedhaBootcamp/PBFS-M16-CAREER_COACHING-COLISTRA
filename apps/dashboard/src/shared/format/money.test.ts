import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

/** Intl uses non-breaking spaces; normalise them to compare. */
const normalise = (value: string) => value.replace(/\s/g, ' ');

describe('formatMoney', () => {
  it('formats cents as euros', () => {
    expect(normalise(formatMoney({ amount: 1290, currency: 'EUR' }))).toBe('12,90 €');
  });

  it('formats round amounts with two decimals', () => {
    expect(normalise(formatMoney({ amount: 700, currency: 'EUR' }))).toBe('7,00 €');
  });

  it('groups thousands', () => {
    expect(normalise(formatMoney({ amount: 183450, currency: 'EUR' }))).toBe('1 834,50 €');
  });
});
