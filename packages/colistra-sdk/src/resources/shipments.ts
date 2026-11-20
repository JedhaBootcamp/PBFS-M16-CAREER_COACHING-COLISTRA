import type { HttpClient } from '../http';
import type { Page, Shipment, ShipmentDetail, ShipmentListParams } from '../types';

export class Shipments {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists shipments, most recent first.
   *
   * Cursor-paginated: returns **at most `limit` shipments (default 20, max 100)** and a
   * `nextCursor`. Pass `nextCursor` back as `cursor` to get the next page. `nextCursor`
   * is `null` on the last page. Filters (`status`, `orderNumber`) are applied by the API,
   * before pagination, and must be sent again with every page.
   *
   * @example
   * const firstPage = await colistra.shipments.list({ status: ShipmentStatus.Exception });
   * const secondPage = await colistra.shipments.list({ status: ShipmentStatus.Exception, cursor: firstPage.nextCursor! });
   */
  list(params: ShipmentListParams = {}): Promise<Page<Shipment>> {
    return this.http.request('GET', '/shipments', { query: { ...params } });
  }

  /**
   * Iterates over every shipment matching `params`, fetching pages lazily as you go.
   *
   * Each page is one API request and counts towards the rate limit. Use a larger
   * `limit` (up to 100) to send fewer requests.
   *
   * @example
   * for await (const shipment of colistra.shipments.autoPaginate({ status: 'exception' })) {
   *   console.log(shipment.trackingNumber);
   * }
   */
  async *autoPaginate(params: Omit<ShipmentListParams, 'cursor'> = {}): AsyncGenerator<Shipment, void, undefined> {
    let cursor: string | undefined;
    do {
      const page = await this.list({ ...params, cursor });
      yield* page.data;
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
  }

  /**
   * Retrieves a shipment with its full tracking history.
   *
   * @throws {ColistraNotFoundError} if no shipment has this id.
   */
  retrieve(id: string): Promise<ShipmentDetail> {
    return this.http.request('GET', `/shipments/${encodeURIComponent(id)}`);
  }
}
