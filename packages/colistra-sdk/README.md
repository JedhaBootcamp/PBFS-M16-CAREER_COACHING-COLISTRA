# Colistra TypeScript SDK

The official TypeScript client for the [Colistra](#) shipping API.

Colistra compares French carriers (Colissimo, Chronopost, Mondial Relay and DHL), buys shipping labels, and tracks parcels until they're delivered, all through one API.

```ts
import { Colistra } from '@colistra/sdk';

const colistra = new Colistra({ apiKey: process.env.COLISTRA_API_KEY! });

const { data: shipments } = await colistra.shipments.list({ status: 'exception' });
```

- [Installation](#installation)
- [Configuration](#configuration)
- [Core concepts](#core-concepts): money, dates, pagination, errors, retries, idempotency, rate limits
- [API reference](#api-reference): orders, rates, labels, shipments, account
- [Changelog](#changelog)

---

## Installation

```bash
npm install @colistra/sdk
```

Requires Node.js 18+ or any modern browser (the SDK uses the global `fetch`).

> In this repository the SDK is a local workspace package (`packages/colistra-sdk`). It is already installed.

## Configuration

```ts
const colistra = new Colistra({
  apiKey: 'sk_test_…',     // required
  maxRetries: 2,           // optional, default 0
  baseUrl: 'https://…',    // optional, default https://api.colistra.test/v1
  fetch: customFetch,      // optional, default globalThis.fetch
});
```

| Option       | Type           | Default                        | Description                                                                                                                     |
| ------------ | -------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`     | `string`       | —                              | Your secret key. Test keys start with `sk_test_`.                                                                               |
| `maxRetries` | `number`       | **`0`**                        | How many times to retry a request after a rate limit (429), a server error (5xx) or a network error. See [Retries](#retries). |
| `baseUrl`    | `string`       | `https://api.colistra.test/v1` | API base URL.                                                                                                                   |
| `fetch`      | `typeof fetch` | `globalThis.fetch`             | Custom fetch implementation (useful in tests).                                                                                  |

Create **one** client and reuse it. Each instance is cheap, but sharing one makes behaviour (retries, keys) consistent across your app.

---

## Core concepts

### Money

Every amount is a `Money` object: an **integer number of cents** plus a currency.

```ts
{ amount: 1290, currency: 'EUR' } // €12.90, not €1,290
```

Never do arithmetic on formatted strings, and never store euros as floats. To display an amount, divide by 100 at the very last moment, ideally with `Intl.NumberFormat`:

```ts
new Intl.NumberFormat('fr-FR', { style: 'currency', currency: money.currency }).format(money.amount / 100);
// "12,90 €"
```

### Dates

All date-times are ISO 8601 strings **in UTC** (`2026-03-14T08:30:00.000Z`). Fields that are a calendar date (like `Shipment.estimatedDelivery`) are `YYYY-MM-DD` strings. Format them in the user's time zone when you display them.

### Units

Parcel weights are in **grams** and dimensions in **centimeters**, as **integers**:

```ts
parcel: { weightGrams: 1350, lengthCm: 30, widthCm: 20, heightCm: 15 }
```

Order data synced from your shop keeps the shop's own units (`order.package.weight` is in kilograms). Convert it before requesting a quote: `Math.round(order.package.weight.value * 1000)`.

### Pagination

List endpoints are **cursor-paginated**. Each call returns one page:

```ts
interface Page<T> {
  data: T[];
  nextCursor: string | null; // null on the last page
}
```

Pages contain **20 items by default** (`limit` can go from 1 to 100). To get the next page, pass `nextCursor` back as `cursor`, **with the same filters**:

```ts
const page1 = await colistra.shipments.list({ status: 'in_transit' });
if (page1.nextCursor) {
  const page2 = await colistra.shipments.list({ status: 'in_transit', cursor: page1.nextCursor });
}
```

Cursors are opaque: don't parse or build them. There is no `page` or `offset` parameter.

#### Auto-pagination

`shipments.autoPaginate()` returns an async iterator that fetches pages as you consume them:

```ts
for await (const shipment of colistra.shipments.autoPaginate({ status: 'exception', limit: 100 })) {
  console.log(shipment.orderNumber);
}
```

Every page is a separate request and counts towards the [rate limit](#rate-limits). Iterating over a large result set with a small `limit` will hit it.

### Errors

Every error thrown by the SDK extends `ColistraError`:

| Class                     | When                                                              | Useful properties              | Retry?                       |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| `ColistraValidationError` | 400 / 422: invalid or missing parameter, expired rate, reused key | `fields`, `code`               | No: fix the request          |
| `ColistraNotFoundError`   | 404: the object doesn't exist                                     | `code`                         | No                           |
| `ColistraRateLimitError`  | 429: more than 10 requests in 5 seconds                           | **`retryAfter`** (seconds)     | Yes, after `retryAfter`      |
| `ColistraServerError`     | 5xx, or network failure (`status: null`)                          | `status`                       | Yes, with backoff            |
| `ColistraError`           | Anything else (e.g. 401 invalid API key)                          | `status`, `code`, `requestId`  | No                           |

```ts
import { ColistraRateLimitError, ColistraValidationError } from '@colistra/sdk';

try {
  await colistra.rates.quote(params);
} catch (error) {
  if (error instanceof ColistraRateLimitError) {
    showMessage(`Too many requests, try again in ${error.retryAfter}s`);
  } else if (error instanceof ColistraValidationError) {
    showFieldErrors(error.fields); // { 'parcel.weightGrams': 'must be an integer between 1 and 30000' }
  } else {
    throw error;
  }
}
```

Always include `error.requestId` when contacting Colistra support.

### Retries

The SDK **does not retry by default** (`maxRetries: 0`). When you set `maxRetries`, the SDK retries:

- `ColistraRateLimitError`: waits exactly `retryAfter` seconds, then retries.
- `ColistraServerError` (5xx and network errors): exponential backoff with jitter (≈0.5 s, 1 s, 2 s… capped at 8 s).

Validation and not-found errors are never retried. After the last attempt, the SDK throws the last error, so you still need to handle it in your UI.

> ⚠️ **Retries and label creation.** A server error or a network failure doesn't always mean the label was *not* created: the label may have been bought and charged, and only the response lost. If you retry `labels.create()` (automatically with `maxRetries`, or manually), **always pass an `idempotencyKey`**, or you may buy the same label twice.

### Idempotency

`labels.create()` charges your account. To make it safe to retry, pass an **idempotency key**:

```ts
const label = await colistra.labels.create(
  { orderId: order.id, rateId: rate.id },
  { idempotencyKey: `label:${order.id}:${rate.id}` },
);
```

- If Colistra already processed a request with the same key in the last **24 hours**, it returns the **original** label, and you are **not** charged again.
- If the key is reused with **different parameters**, the request fails with a `ColistraValidationError` (`code: 'idempotency_key_reused'`).
- Keys are up to 255 characters. Use something that identifies *the operation* (this order, with this rate), not the HTTP request: a random value generated on every call protects you from nothing.

Without a key, **every** successful call creates and charges a new label, including double clicks and retries.

### Rate limits

Each API key can send **10 requests per 5-second sliding window**. Requests above the limit get a `429` with a `Retry-After` header, surfaced as `ColistraRateLimitError.retryAfter`.

Tips: avoid sending a request on every keystroke (debounce search inputs), use a larger `limit` instead of many small pages, and don't fetch details for every row of a list.

---

## API reference

### Orders

Orders synced from your shop (Shopify, WooCommerce, PrestaShop…).

#### `orders.list(params?): Promise<Page<Order>>`

| Param    | Type                             | Description          |
| -------- | -------------------------------- | -------------------- |
| `status` | `'awaiting_label' \| 'labelled'` | Filter by status.    |
| `cursor` | `string`                         | See Pagination.      |
| `limit`  | `number`                         | 1–100, default 20.   |

Returns orders, most recent first.

#### `orders.retrieve(id): Promise<Order>`

Throws `ColistraNotFoundError` if the order doesn't exist.

```ts
interface Order {
  id: string;                 // "ord_…"
  number: string;             // "AL-10234"
  status: 'awaiting_label' | 'labelled';
  customer: { name: string; email: string };
  shippingAddress: Address;
  items: { sku: string; name: string; quantity: number; unitPrice: Money }[];
  total: Money;
  package: {
    weight: { value: number; unit: 'kg' };                                   // ⚠️ kilograms
    dimensions: { length: number; width: number; height: number; unit: 'cm' };
  };
  createdAt: string;          // ISO 8601, UTC
}
```

### Rates

#### `rates.quote(params): Promise<{ rates: Rate[] }>`

Compares every available carrier service for a parcel.

```ts
const { rates } = await colistra.rates.quote({
  from: shopAddress,
  to: order.shippingAddress,
  parcel: { weightGrams: 1350, lengthCm: 30, widthCm: 20, heightCm: 15 },
});
```

| Param    | Type      | Description                                                                 |
| -------- | --------- | --------------------------------------------------------------------------- |
| `from`   | `Address` | Sender address.                                                             |
| `to`     | `Address` | Recipient address.                                                          |
| `parcel` | `Parcel`  | `weightGrams` (integer, 1–30 000), `lengthCm`/`widthCm`/`heightCm` (integers, 1–150). |

```ts
interface Rate {
  id: string;            // pass to labels.create({ rateId })
  carrier: 'colissimo' | 'chronopost' | 'mondial_relay' | 'dhl';
  service: string;       // "Colissimo Domicile"
  price: Money;          // integer cents
  estimatedDays: number; // business days
  expiresAt: string;     // ISO 8601 UTC; quotes are valid for 15 minutes
}
```

Rates are returned **unsorted**. Express carriers (Chronopost, DHL) price by volumetric weight (`L × W × H / 5000` kg) when it's higher than the real weight.

Quotes call live carrier APIs and **fail occasionally** with a `ColistraServerError` (`code: 'carrier_unavailable'`). They are always safe to retry.

### Labels

#### `labels.create(params, options?): Promise<Label>`

Buys a label for an order and charges your account. The order becomes `labelled` and a shipment is created with status `label_created`.

```ts
// Recommended: with a rate from rates.quote()
colistra.labels.create({ orderId, rateId }, { idempotencyKey });

// Shortcut: a carrier's standard service at the current price, no quote needed
colistra.labels.create({ orderId, carrier: 'colissimo' }, { idempotencyKey });
```

| Option           | Type     | Description                                                                 |
| ---------------- | -------- | --------------------------------------------------------------------------- |
| `idempotencyKey` | `string` | See [Idempotency](#idempotency). Without it, every call charges a new label. |

Errors: `ColistraValidationError` with `code: 'rate_expired'` if the rate is older than 15 minutes, or `'idempotency_key_reused'`; `ColistraNotFoundError` if the order or rate doesn't exist.

```ts
interface Label {
  id: string;             // "lbl_…"
  orderId: string;
  shipmentId: string;
  carrier: Carrier;
  service: string;
  trackingNumber: string;
  labelUrl: string;       // printable PDF
  charged: Money;
  createdAt: string;
}
```

### Shipments

#### `shipments.list(params?): Promise<Page<Shipment>>`

| Param         | Type             | Description                                                              |
| ------------- | ---------------- | ------------------------------------------------------------------------ |
| `status`      | `ShipmentStatus` | Only shipments with this status.                                         |
| `orderNumber` | `string`         | Only shipments whose order number **contains** this text (case-insensitive). `"1023"` matches `AL-10231`. |
| `cursor`      | `string`         | See Pagination.                                                          |
| `limit`       | `number`         | 1–100, default 20.                                                       |

Filters are applied by the API before pagination. Returns shipments, most recent first.

#### `shipments.autoPaginate(params?): AsyncIterable<Shipment>`

Same params as `list()` (without `cursor`). See [Auto-pagination](#auto-pagination).

#### `shipments.retrieve(id): Promise<ShipmentDetail>`

A shipment with its tracking history (`events`, most recent first) and `labelUrl`.

```ts
interface Shipment {
  id: string;                         // "shp_…"
  orderId: string;
  orderNumber: string;                // "AL-10234"
  carrier: Carrier;
  service: string;
  trackingNumber: string;
  status: ShipmentStatus;
  cost: Money;                        // integer cents
  recipient: { name: string; postalCode: string; city: string };
  estimatedDelivery: string | null;   // "YYYY-MM-DD", null when delivered/returned or unknown
  createdAt: string;
  updatedAt: string;
}
```

#### Shipment statuses

Use the `ShipmentStatus` constant rather than raw strings:

```ts
import { ShipmentStatus, SHIPMENT_STATUSES } from '@colistra/sdk';

ShipmentStatus.Exception; // 'exception'
SHIPMENT_STATUSES;        // all six, in lifecycle order
```

| Value              | Meaning                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `label_created`    | Label bought, parcel not yet handed to the carrier.                           |
| `in_transit`       | The carrier has the parcel.                                                   |
| `out_for_delivery` | On the delivery van today.                                                    |
| `delivered`        | Delivered to the recipient or the pickup point.                               |
| `exception`        | A problem needs attention: damaged parcel, incomplete address, failed delivery. |
| `returned`         | The parcel is going (or went) back to the sender.                              |

### Account

#### `account.retrieve(): Promise<Account>`

```ts
interface Account {
  name: string;
  labelsThisMonth: number;
  chargesThisMonth: Money;
}
```

---

## Changelog

### 2.3.0

- Added `ShipmentStatus.Returned` (`'returned'`). Parcels sent back to the sender used to stay in `exception`.
- Added the `orderNumber` filter to `shipments.list()`.

### 2.2.0

- Added `shipments.autoPaginate()`.

### 2.0.0

- **Breaking:** all amounts are now integer cents (`Money`). Version 1 returned euros as decimal numbers.
- **Breaking:** `maxRetries` now defaults to `0`. Set it explicitly to enable retries.
- **Breaking:** list methods return `{ data, nextCursor }` instead of an array.
