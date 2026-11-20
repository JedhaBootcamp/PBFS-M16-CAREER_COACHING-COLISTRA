import type { Order, Parcel, Rate } from '@colistra/sdk';

/**
 * Converts the package as the shop stores it (kilograms, centimeters) into the
 * parcel Colistra expects for a quote: **integer grams** and integer centimeters.
 */
export function parcelFromOrder(order: Pick<Order, 'package'>): Parcel {
  const { weight, dimensions } = order.package;
  return {
    weightGrams: Math.max(1, Math.round(weight.value * 1000)),
    lengthCm: Math.ceil(dimensions.length),
    widthCm: Math.ceil(dimensions.width),
    heightCm: Math.ceil(dimensions.height),
  };
}

/** Cheapest first; same price → fastest first. Colistra returns rates unsorted. */
export function sortRatesByPrice(rates: Rate[]): Rate[] {
  return [...rates].sort((a, b) => a.price.amount - b.price.amount || a.estimatedDays - b.estimatedDays);
}

export function cheapestRate(rates: Rate[]): Rate | undefined {
  return sortRatesByPrice(rates)[0];
}

/** Fewest delivery days; between equally fast rates, the cheapest. */
export function fastestRate(rates: Rate[]): Rate | undefined {
  return [...rates].sort((a, b) => a.estimatedDays - b.estimatedDays || a.price.amount - b.price.amount)[0];
}

export function isExpired(rate: Rate, now: number = Date.now()): boolean {
  return Date.parse(rate.expiresAt) <= now;
}
