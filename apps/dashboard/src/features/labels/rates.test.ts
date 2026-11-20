import type { Rate } from '@colistra/sdk';
import { describe, expect, it } from 'vitest';
import { cheapestRate, fastestRate, isExpired, parcelFromOrder, sortRatesByPrice } from './rates';

function rate(id: string, amount: number, estimatedDays: number): Rate {
  return { id, carrier: 'colissimo', service: id, price: { amount, currency: 'EUR' }, estimatedDays, expiresAt: '2026-03-14T12:15:00Z' };
}

const rates = [rate('dhl', 1830, 1), rate('colissimo', 939, 2), rate('chrono', 1850, 1), rate('mondial', 569, 4)];

describe('parcelFromOrder', () => {
  it('converts kilograms to integer grams', () => {
    const parcel = parcelFromOrder({
      package: { weight: { value: 1.35, unit: 'kg' }, dimensions: { length: 30, width: 22, height: 18, unit: 'cm' } },
    });
    expect(parcel).toEqual({ weightGrams: 1350, lengthCm: 30, widthCm: 22, heightCm: 18 });
  });

  it('rounds floating point noise to whole grams', () => {
    const parcel = parcelFromOrder({
      package: { weight: { value: 0.29, unit: 'kg' }, dimensions: { length: 20.5, width: 15, height: 12, unit: 'cm' } },
    });
    expect(parcel.weightGrams).toBe(290); // 0.29 * 1000 = 290.00000000000006
    expect(parcel.lengthCm).toBe(21);
  });
});

describe('choosing a rate', () => {
  it('sorts by price', () => {
    expect(sortRatesByPrice(rates).map((r) => r.id)).toEqual(['mondial', 'colissimo', 'dhl', 'chrono']);
  });

  it('finds the cheapest', () => {
    expect(cheapestRate(rates)?.id).toBe('mondial');
  });

  it('finds the fastest, and the cheaper one when two are equally fast', () => {
    expect(fastestRate(rates)?.id).toBe('dhl');
  });

  it('handles an empty quote', () => {
    expect(cheapestRate([])).toBeUndefined();
    expect(fastestRate([])).toBeUndefined();
  });

  it('knows when a rate has expired', () => {
    expect(isExpired(rates[0], Date.parse('2026-03-14T12:00:00Z'))).toBe(false);
    expect(isExpired(rates[0], Date.parse('2026-03-14T12:16:00Z'))).toBe(true);
  });
});
