/**
 * A monetary amount.
 *
 * `amount` is always an **integer number of the smallest currency unit** (cents for EUR).
 * `{ amount: 1290, currency: 'EUR' }` means €12.90.
 */
export interface Money {
  /** Integer amount in cents. Never a decimal. */
  amount: number;
  /** ISO 4217 currency code. Colistra currently bills in EUR only. */
  currency: 'EUR';
}

/** Carriers available through Colistra. */
export type Carrier = 'colissimo' | 'chronopost' | 'mondial_relay' | 'dhl';

/** Every carrier, in the order Colistra lists them. */
export const CARRIERS: readonly Carrier[] = ['colissimo', 'chronopost', 'mondial_relay', 'dhl'];

/**
 * Lifecycle of a shipment.
 *
 * `label_created` → `in_transit` → `out_for_delivery` → `delivered`.
 * A shipment can move to `exception` at any point after `label_created`
 * (damaged parcel, incomplete address, recipient absent…), and to `returned`
 * when the parcel goes back to the sender.
 */
export const ShipmentStatus = {
  LabelCreated: 'label_created',
  InTransit: 'in_transit',
  OutForDelivery: 'out_for_delivery',
  Delivered: 'delivered',
  Exception: 'exception',
  Returned: 'returned',
} as const;

export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

/** Every shipment status, in lifecycle order. */
export const SHIPMENT_STATUSES: readonly ShipmentStatus[] = Object.values(ShipmentStatus);

/** A postal address. Colistra currently ships within metropolitan France only. */
export interface Address {
  name: string;
  company?: string;
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2 country code. Always `FR` for now. */
  country: 'FR';
  phone?: string;
  email?: string;
}

/** A page of results from a cursor-paginated endpoint. */
export interface Page<T> {
  data: T[];
  /**
   * Opaque cursor to pass as `cursor` to get the next page,
   * or `null` when this is the last page.
   */
  nextCursor: string | null;
}

/** Parameters shared by every paginated `list()` method. */
export interface PaginationParams {
  /** Cursor returned as `nextCursor` by the previous page. Omit for the first page. */
  cursor?: string;
  /** Page size, between 1 and 100. Defaults to 20. */
  limit?: number;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus = 'awaiting_label' | 'labelled';

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: Money;
}

/**
 * An order synced from your shop.
 *
 * The package information is stored **as your shop sends it** (weight in kilograms,
 * dimensions in centimeters). Colistra does not convert it for you.
 */
export interface Order {
  id: string;
  /** Your shop's order number, e.g. `AL-10234`. */
  number: string;
  status: OrderStatus;
  customer: { name: string; email: string };
  shippingAddress: Address;
  items: OrderItem[];
  total: Money;
  package: {
    weight: { value: number; unit: 'kg' };
    dimensions: { length: number; width: number; height: number; unit: 'cm' };
  };
  /** ISO 8601 date-time, UTC. */
  createdAt: string;
}

export interface OrderListParams extends PaginationParams {
  status?: OrderStatus;
}

// ─── Rates ───────────────────────────────────────────────────────────────────

/** The physical parcel to ship. Weight in **grams**, dimensions in **centimeters**, integers only. */
export interface Parcel {
  /** Integer, 1 to 30 000. */
  weightGrams: number;
  /** Integer, 1 to 150. */
  lengthCm: number;
  /** Integer, 1 to 150. */
  widthCm: number;
  /** Integer, 1 to 150. */
  heightCm: number;
}

export interface RateQuoteParams {
  from: Address;
  to: Address;
  parcel: Parcel;
}

export interface Rate {
  /** Pass this to `labels.create({ rateId })`. Valid until `expiresAt`. */
  id: string;
  carrier: Carrier;
  /** Human-readable service name, e.g. `Colissimo Domicile`. */
  service: string;
  price: Money;
  /** Estimated number of business days from drop-off to delivery. */
  estimatedDays: number;
  /** ISO 8601 date-time, UTC. Quotes are valid for 15 minutes. */
  expiresAt: string;
}

export interface RateQuote {
  rates: Rate[];
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export type LabelCreateParams =
  | {
      orderId: string;
      /** A rate id returned by `rates.quote()`. Preferred. */
      rateId: string;
    }
  | {
      orderId: string;
      /** Use this carrier's standard service at the current price, without a quote. */
      carrier: Carrier;
    };

export interface LabelCreateOptions {
  /**
   * A unique key for this label purchase. If Colistra has already processed a request
   * with the same key in the last 24 hours, it returns the original label instead of
   * creating (and charging) a new one. See "Idempotency" in the README.
   */
  idempotencyKey?: string;
}

export interface Label {
  id: string;
  orderId: string;
  shipmentId: string;
  carrier: Carrier;
  service: string;
  trackingNumber: string;
  /** URL of the printable PDF label. */
  labelUrl: string;
  /** What your Colistra account was charged for this label. */
  charged: Money;
  /** ISO 8601 date-time, UTC. */
  createdAt: string;
}

// ─── Shipments ───────────────────────────────────────────────────────────────

export interface TrackingEvent {
  status: ShipmentStatus;
  /** Carrier message, in French, as the carrier sends it. */
  description: string;
  location: string | null;
  /** ISO 8601 date-time, UTC. */
  occurredAt: string;
}

export interface Shipment {
  id: string;
  orderId: string;
  orderNumber: string;
  carrier: Carrier;
  service: string;
  trackingNumber: string;
  status: ShipmentStatus;
  /** What the label cost. */
  cost: Money;
  recipient: { name: string; postalCode: string; city: string };
  /** ISO 8601 date (`YYYY-MM-DD`), or `null` once delivered, returned, or when the carrier gives no estimate. */
  estimatedDelivery: string | null;
  /** ISO 8601 date-time, UTC. */
  createdAt: string;
  /** ISO 8601 date-time, UTC. */
  updatedAt: string;
}

/** A shipment with its full tracking history, as returned by `shipments.retrieve()`. */
export interface ShipmentDetail extends Shipment {
  /** Most recent first. */
  events: TrackingEvent[];
  labelUrl: string;
}

export interface ShipmentListParams extends PaginationParams {
  /** Only return shipments with this status. */
  status?: ShipmentStatus;
  /** Only return shipments whose order number contains this text (case-insensitive). */
  orderNumber?: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export interface Account {
  name: string;
  /** Number of labels created since the 1st of the current month (UTC). */
  labelsThisMonth: number;
  /** Total charged for labels since the 1st of the current month (UTC). */
  chargesThisMonth: Money;
}
