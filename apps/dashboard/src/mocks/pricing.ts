import type { Carrier, Parcel } from '@colistra/sdk';

export interface CarrierService {
  carrier: Carrier;
  service: string;
  estimatedDays: number;
  /** Express carriers bill the volumetric weight when it is higher than the real weight. */
  volumetric: boolean;
  baseCents: number;
  perKgCents: number;
  maxWeightGrams: number;
}

export const SERVICES: CarrierService[] = [
  { carrier: 'colissimo', service: 'Colissimo Domicile', estimatedDays: 2, volumetric: false, baseCents: 749, perKgCents: 95, maxWeightGrams: 30000 },
  { carrier: 'colissimo', service: 'Colissimo Domicile avec signature', estimatedDays: 2, volumetric: false, baseCents: 949, perKgCents: 95, maxWeightGrams: 30000 },
  { carrier: 'chronopost', service: 'Chrono 13', estimatedDays: 1, volumetric: true, baseCents: 1490, perKgCents: 180, maxWeightGrams: 30000 },
  { carrier: 'mondial_relay', service: 'Mondial Relay Point Relais', estimatedDays: 4, volumetric: false, baseCents: 449, perKgCents: 60, maxWeightGrams: 25000 },
  { carrier: 'dhl', service: 'DHL Express Domestic', estimatedDays: 1, volumetric: true, baseCents: 1690, perKgCents: 140, maxWeightGrams: 30000 },
];

/** The service used by `labels.create({ carrier })`. */
export function standardService(carrier: Carrier): CarrierService {
  return SERVICES.find((s) => s.carrier === carrier)!;
}

export function priceFor(service: CarrierService, parcel: Parcel): number {
  const volumetricGrams = (parcel.lengthCm * parcel.widthCm * parcel.heightCm) / 5;
  const billableGrams = service.volumetric ? Math.max(parcel.weightGrams, volumetricGrams) : parcel.weightGrams;
  return service.baseCents + service.perKgCents * Math.ceil(billableGrams / 1000);
}

/** Adds business days (Mon–Fri) to a date and returns a `YYYY-MM-DD` string. */
export function addBusinessDays(from: Date, days: number): string {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  let remaining = days;
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return date.toISOString().slice(0, 10);
}
