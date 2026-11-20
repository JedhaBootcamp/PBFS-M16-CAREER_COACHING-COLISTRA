import type { HttpClient } from '../http';
import type { RateQuote, RateQuoteParams } from '../types';

export class Rates {
  constructor(private readonly http: HttpClient) {}

  /**
   * Compares carriers for a parcel. Returns one rate per available carrier service,
   * with its price and estimated delivery time. Rates are not sorted.
   *
   * The parcel must be described with **integer grams and centimeters**
   * (`weightGrams`, `lengthCm`, `widthCm`, `heightCm`).
   *
   * Each rate id is valid for 15 minutes (`expiresAt`); pass it to `labels.create()`.
   *
   * @throws {ColistraValidationError} if an address or the parcel is invalid.
   * @throws {ColistraServerError} if carriers could not be reached. Quotes depend on
   *   live carrier APIs and fail occasionally; they are safe to retry.
   *
   * @example
   * const { rates } = await colistra.rates.quote({
   *   from: warehouseAddress,
   *   to: order.shippingAddress,
   *   parcel: { weightGrams: 1350, lengthCm: 30, widthCm: 20, heightCm: 15 },
   * });
   */
  quote(params: RateQuoteParams): Promise<RateQuote> {
    return this.http.request('POST', '/rates', { body: params });
  }
}
