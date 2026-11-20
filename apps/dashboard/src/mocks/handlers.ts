import {
  DEFAULT_BASE_URL,
  SHIPMENT_STATUSES,
  type Account,
  type Carrier,
  type ColistraErrorBody,
  type Label,
  type LabelCreateParams,
  type Order,
  type Parcel,
  type Rate,
  type RateQuoteParams,
  type ShipmentDetail,
  type ShipmentStatus,
} from '@colistra/sdk';
import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw';
import { db } from './db';
import {
  carrierQuoteFails,
  checkRateLimit,
  getChaosMode,
  labelResponseLost,
  nextFlakyRequestFails,
  randomLatency,
} from './faults';
import { addBusinessDays, priceFor, SERVICES, standardService, type CarrierService } from './pricing';
import { runtimeRandom } from './random';
import { parcelOf, trackingNumberFor } from './seed';

const api = (path: string) => `${DEFAULT_BASE_URL}${path}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function apiError(
  status: number,
  type: string,
  code: string,
  message: string,
  extra: Partial<ColistraErrorBody['error']> = {},
  headers: Record<string, string> = {},
) {
  const body: ColistraErrorBody = { error: { type, code, message, requestId: runtimeRandom.id('req', 12), ...extra } };
  return HttpResponse.json(body, { status, headers });
}

const validationError = (code: string, message: string, fields?: Record<string, string>) =>
  apiError(422, 'validation_error', code, message, fields ? { fields } : {});

const notFound = (what: string, id: string) => apiError(404, 'not_found', `${what}_not_found`, `No ${what} with id '${id}'`);

const serverError = (code: string, message: string, status = 503) => apiError(status, 'server_error', code, message);

/**
 * Wraps every route with what a real API does before reaching business logic:
 * latency, authentication, rate limiting and injected failures.
 */
function route(resolver: HttpResponseResolver, options: { commitsBeforeFailing?: boolean } = {}): HttpResponseResolver {
  return async (info) => {
    await delay(randomLatency());

    if (!info.request.headers.get('Authorization')?.startsWith('Bearer sk_')) {
      return apiError(401, 'authentication_error', 'invalid_api_key', 'Missing or invalid API key');
    }

    const retryAfter = checkRateLimit();
    if (retryAfter !== null) {
      return apiError(
        429,
        'rate_limit_error',
        'rate_limited',
        'Too many requests: the limit is 10 requests per 5 seconds',
        { retryAfter },
        { 'Retry-After': String(retryAfter) },
      );
    }

    if (getChaosMode() === 'down') return serverError('service_unavailable', 'Colistra is temporarily unavailable');
    if (!options.commitsBeforeFailing && nextFlakyRequestFails()) {
      return serverError('service_unavailable', 'Colistra is temporarily unavailable');
    }

    return resolver(info);
  };
}

/** Pagination with opaque cursors that remember the filters they were created with. */
function paginate<T extends { id: string }>(items: T[], url: URL, filterKey: string) {
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam === null ? 20 : Number(limitParam);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return { error: validationError('invalid_limit', 'limit must be an integer between 1 and 100', { limit: 'must be an integer between 1 and 100' }) };
  }

  let start = 0;
  const cursor = url.searchParams.get('cursor');
  if (cursor) {
    let decoded: { after?: string; filters?: string } = {};
    try {
      decoded = JSON.parse(atob(cursor));
    } catch {
      return { error: validationError('invalid_cursor', 'cursor is not valid', { cursor: 'is not a cursor returned by the API' }) };
    }
    if (decoded.filters !== filterKey) {
      return { error: validationError('invalid_cursor', 'cursor was created with different filters', { cursor: 'send the same filters as the first page' }) };
    }
    start = items.findIndex((item) => item.id === decoded.after) + 1;
  }

  const data = items.slice(start, start + limit);
  const hasMore = start + limit < items.length;
  const nextCursor = hasMore ? btoa(JSON.stringify({ after: data[data.length - 1].id, filters: filterKey })) : null;
  return { page: { data, nextCursor } };
}

function byNewest<T extends { createdAt: string }>(a: T, b: T) {
  return b.createdAt.localeCompare(a.createdAt);
}

function toListShipment({ events: _events, labelUrl: _labelUrl, ...shipment }: ShipmentDetail) {
  return shipment;
}

function validateParcel(parcel: Partial<Parcel> | undefined): Record<string, string> {
  const fields: Record<string, string> = {};
  const check = (key: keyof Parcel, max: number) => {
    const value = parcel?.[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > max) {
      fields[`parcel.${key}`] = `must be an integer between 1 and ${max}`;
    }
  };
  check('weightGrams', 30000);
  check('lengthCm', 150);
  check('widthCm', 150);
  check('heightCm', 150);
  return fields;
}

function validateAddress(prefix: string, address: RateQuoteParams['from'] | undefined): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!address || typeof address !== 'object') return { [prefix]: 'is required' };
  for (const key of ['name', 'line1', 'postalCode', 'city'] as const) {
    if (!address[key] || typeof address[key] !== 'string') fields[`${prefix}.${key}`] = 'is required';
  }
  if (address.postalCode && !/^\d{5}$/.test(address.postalCode)) fields[`${prefix}.postalCode`] = 'must be a 5-digit French postal code';
  if (address.country !== 'FR') fields[`${prefix}.country`] = "must be 'FR'";
  return fields;
}

function buyLabel(order: Order, service: CarrierService, priceCents: number): Label {
  const now = new Date();
  const trackingNumber = trackingNumberFor(runtimeRandom, service.carrier);
  const shipment: ShipmentDetail = {
    id: runtimeRandom.id('shp'),
    orderId: order.id,
    orderNumber: order.number,
    carrier: service.carrier,
    service: service.service,
    trackingNumber,
    status: 'label_created',
    cost: { amount: priceCents, currency: 'EUR' },
    recipient: { name: order.shippingAddress.name, postalCode: order.shippingAddress.postalCode, city: order.shippingAddress.city },
    estimatedDelivery: addBusinessDays(now, service.estimatedDays),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    events: [{ status: 'label_created', description: 'Étiquette créée, en attente de dépôt', location: null, occurredAt: now.toISOString() }],
    labelUrl: `https://labels.colistra.test/${trackingNumber}.pdf`,
  };
  db.shipments.unshift(shipment);
  order.status = 'labelled';

  const label: Label = {
    id: runtimeRandom.id('lbl'),
    orderId: order.id,
    shipmentId: shipment.id,
    carrier: service.carrier,
    service: service.service,
    trackingNumber,
    labelUrl: shipment.labelUrl,
    charged: { amount: priceCents, currency: 'EUR' },
    createdAt: now.toISOString(),
  };
  db.labels.set(label.id, label);
  return label;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export const handlers = [
  http.get(
    api('/account'),
    route(() => {
      const monthStart = new Date();
      monthStart.setUTCDate(1);
      monthStart.setUTCHours(0, 0, 0, 0);
      const thisMonth = db.shipments.filter((s) => Date.parse(s.createdAt) >= monthStart.getTime());
      const account: Account = {
        name: 'Atelier Lune',
        labelsThisMonth: thisMonth.length,
        chargesThisMonth: { amount: thisMonth.reduce((sum, s) => sum + s.cost.amount, 0), currency: 'EUR' },
      };
      return HttpResponse.json(account);
    }),
  ),

  http.get(
    api('/orders'),
    route(({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      if (status && status !== 'awaiting_label' && status !== 'labelled') {
        return validationError('invalid_status', "status must be 'awaiting_label' or 'labelled'", { status: 'is not a valid order status' });
      }
      const orders = db.orders.filter((o) => !status || o.status === status).sort(byNewest);
      const result = paginate(orders, url, `status=${status ?? ''}`);
      return result.error ?? HttpResponse.json(result.page);
    }),
  ),

  http.get(
    api('/orders/:id'),
    route(({ params }) => {
      const order = db.orders.find((o) => o.id === params.id);
      return order ? HttpResponse.json(order) : notFound('order', String(params.id));
    }),
  ),

  http.post(
    api('/rates'),
    route(async ({ request }) => {
      if (carrierQuoteFails()) {
        return serverError('carrier_unavailable', 'One or more carriers did not respond in time. Retry the quote.');
      }
      const body = (await request.json().catch(() => null)) as Partial<RateQuoteParams> | null;
      const fields = {
        ...validateAddress('from', body?.from),
        ...validateAddress('to', body?.to),
        ...validateParcel(body?.parcel),
      };
      if (Object.keys(fields).length > 0) {
        return validationError('invalid_quote_request', 'The quote request is invalid. See `fields` for details.', fields);
      }
      const parcel = body!.parcel as Parcel;
      const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
      const rates: Rate[] = SERVICES.filter((service) => parcel.weightGrams <= service.maxWeightGrams).map((service) => {
        const rate: Rate = {
          id: runtimeRandom.id('rate'),
          carrier: service.carrier,
          service: service.service,
          price: { amount: priceFor(service, parcel), currency: 'EUR' },
          estimatedDays: service.estimatedDays,
          expiresAt,
        };
        db.rates.set(rate.id, { ...rate, parcelWeightGrams: parcel.weightGrams });
        return rate;
      });
      // Carriers answer in whatever order they answer.
      rates.sort(() => runtimeRandom.next() - 0.5);
      return HttpResponse.json({ rates });
    }),
  ),

  http.post(
    api('/labels'),
    route(async ({ request }) => {
      const body = (await request.json().catch(() => null)) as Partial<LabelCreateParams> & { rateId?: string; carrier?: Carrier };
      const idempotencyKey = request.headers.get('Idempotency-Key');
      const fingerprint = JSON.stringify(body);

      if (idempotencyKey) {
        if (idempotencyKey.length > 255) {
          return validationError('invalid_idempotency_key', 'Idempotency-Key must be at most 255 characters');
        }
        const previous = db.idempotency.get(idempotencyKey);
        if (previous && Date.now() - previous.createdAt < 24 * 3_600_000) {
          if (previous.fingerprint !== fingerprint) {
            return validationError(
              'idempotency_key_reused',
              'This Idempotency-Key was already used with different parameters',
            );
          }
          if (nextFlakyRequestFails()) return serverError('upstream_timeout', 'The carrier did not confirm in time', 502);
          return HttpResponse.json(previous.body, { status: previous.status, headers: { 'Idempotent-Replayed': 'true' } });
        }
      }

      const order = db.orders.find((o) => o.id === body?.orderId);
      if (!body?.orderId) return validationError('missing_order', 'orderId is required', { orderId: 'is required' });
      if (!order) return notFound('order', body.orderId);

      let service: CarrierService;
      let priceCents: number;
      if (body.rateId) {
        const rate = db.rates.get(body.rateId);
        if (!rate) return notFound('rate', body.rateId);
        if (Date.parse(rate.expiresAt) < Date.now()) {
          return validationError('rate_expired', 'This rate has expired. Request a new quote.', { rateId: 'has expired' });
        }
        service = SERVICES.find((s) => s.service === rate.service)!;
        priceCents = rate.price.amount;
      } else if (body.carrier) {
        if (!SERVICES.some((s) => s.carrier === body.carrier)) {
          return validationError('invalid_carrier', `Unknown carrier '${body.carrier}'`, { carrier: 'is not a supported carrier' });
        }
        service = standardService(body.carrier);
        priceCents = priceFor(service, parcelOf(order));
      } else {
        return validationError('missing_rate', 'Either rateId or carrier is required', { rateId: 'is required' });
      }

      const label = buyLabel(order, service, priceCents);
      if (idempotencyKey) {
        db.idempotency.set(idempotencyKey, { fingerprint, status: 201, body: label, createdAt: Date.now() });
      }

      // The label is bought and charged, but the client never hears about it.
      if (nextFlakyRequestFails() || labelResponseLost()) {
        return serverError('upstream_timeout', 'The carrier did not confirm in time', 502);
      }
      return HttpResponse.json(label, { status: 201 });
    }, { commitsBeforeFailing: true }),
  ),

  http.get(
    api('/shipments'),
    route(({ request }) => {
      const url = new URL(request.url);
      const status = url.searchParams.get('status');
      const orderNumber = url.searchParams.get('orderNumber')?.trim().toLowerCase() ?? '';
      if (status && !SHIPMENT_STATUSES.includes(status as ShipmentStatus)) {
        return validationError('invalid_status', `status must be one of: ${SHIPMENT_STATUSES.join(', ')}`, { status: 'is not a valid shipment status' });
      }
      const shipments = db.shipments
        .filter((s) => (!status || s.status === status) && (!orderNumber || s.orderNumber.toLowerCase().includes(orderNumber)))
        .sort(byNewest)
        .map(toListShipment);
      const result = paginate(shipments, url, `status=${status ?? ''}&orderNumber=${orderNumber}`);
      return result.error ?? HttpResponse.json(result.page);
    }),
  ),

  http.get(
    api('/shipments/:id'),
    route(({ params }) => {
      const shipment = db.shipments.find((s) => s.id === params.id);
      return shipment ? HttpResponse.json(shipment) : notFound('shipment', String(params.id));
    }),
  ),
];
