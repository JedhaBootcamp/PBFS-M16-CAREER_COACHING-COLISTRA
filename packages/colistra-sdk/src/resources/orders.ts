import type { HttpClient } from '../http';
import type { Order, OrderListParams, Page } from '../types';

export class Orders {
  constructor(private readonly http: HttpClient) {}

  /**
   * Lists orders synced from your shop, most recent first.
   *
   * Cursor-paginated: returns at most `limit` orders (default 20, max 100)
   * and a `nextCursor` to fetch the next page.
   *
   * @example
   * const { data, nextCursor } = await colistra.orders.list({ status: 'awaiting_label' });
   */
  list(params: OrderListParams = {}): Promise<Page<Order>> {
    return this.http.request('GET', '/orders', { query: { ...params } });
  }

  /**
   * Retrieves a single order.
   *
   * @throws {ColistraNotFoundError} if no order has this id.
   */
  retrieve(id: string): Promise<Order> {
    return this.http.request('GET', `/orders/${encodeURIComponent(id)}`);
  }
}
