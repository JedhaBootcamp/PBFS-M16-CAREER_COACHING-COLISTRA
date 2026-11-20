import type { Order } from '@colistra/sdk';
import { useColistraQuery } from '../../shared/colistra/useColistraQuery';
import { SHOP_ADDRESS } from '../../shared/shop';
import { parcelFromOrder } from './rates';

/** Asks Colistra for every carrier's price and delivery time for an order. */
export function useRateQuote(order: Order) {
  return useColistraQuery(
    (colistra) => colistra.rates.quote({ from: SHOP_ADDRESS, to: order.shippingAddress, parcel: parcelFromOrder(order) }),
    [order.id],
  );
}
