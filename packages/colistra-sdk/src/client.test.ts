import { describe, expect, it, vi } from 'vitest';
import {
  Colistra,
  ColistraNotFoundError,
  ColistraRateLimitError,
  ColistraServerError,
  ColistraValidationError,
} from './index';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function errorBody(type: string, code: string, extra: Record<string, unknown> = {}) {
  return { error: { type, code, message: `${code} happened`, requestId: 'req_123', ...extra } };
}

function makeClient(fetchMock: ReturnType<typeof vi.fn>, maxRetries?: number) {
  return new Colistra({ apiKey: 'sk_test_123', fetch: fetchMock as unknown as typeof fetch, maxRetries });
}

describe('Colistra client', () => {
  it('sends the API key and builds query strings', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [], nextCursor: null }));
    await makeClient(fetchMock).shipments.list({ status: 'exception', limit: 50 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.colistra.test/v1/shipments?status=exception&limit=50');
    expect(init.headers.Authorization).toBe('Bearer sk_test_123');
  });

  it('sends the idempotency key as a header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: 'lbl_1' }));
    await makeClient(fetchMock).labels.create({ orderId: 'ord_1', rateId: 'rate_1' }, { idempotencyKey: 'key-1' });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['Idempotency-Key']).toBe('key-1');
    expect(JSON.parse(init.body)).toEqual({ orderId: 'ord_1', rateId: 'rate_1' });
  });

  it('maps HTTP errors to typed errors', async () => {
    const cases = [
      [422, errorBody('validation_error', 'invalid_parcel', { fields: { 'parcel.weightGrams': 'must be an integer' } }), ColistraValidationError],
      [404, errorBody('not_found', 'shipment_not_found'), ColistraNotFoundError],
      [503, errorBody('server_error', 'carrier_unavailable'), ColistraServerError],
    ] as const;

    for (const [status, body, ErrorClass] of cases) {
      const client = makeClient(vi.fn().mockResolvedValue(jsonResponse(status, body)));
      await expect(client.shipments.retrieve('shp_1')).rejects.toBeInstanceOf(ErrorClass);
    }
  });

  it('exposes retryAfter on rate limit errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(429, errorBody('rate_limit_error', 'rate_limited'), { 'Retry-After': '3' }));
    const error = await makeClient(fetchMock).account.retrieve().catch((e) => e);

    expect(error).toBeInstanceOf(ColistraRateLimitError);
    expect(error.retryAfter).toBe(3);
    expect(error.requestId).toBe('req_123');
  });

  it('does not retry by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, errorBody('server_error', 'internal')));
    await expect(makeClient(fetchMock).account.retrieve()).rejects.toBeInstanceOf(ColistraServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries rate limits and server errors when maxRetries is set', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, errorBody('rate_limit_error', 'rate_limited'), { 'Retry-After': '0' }))
      .mockResolvedValueOnce(jsonResponse(200, { name: 'Atelier Lune' }));

    await expect(makeClient(fetchMock, 2).account.retrieve()).resolves.toEqual({ name: 'Atelier Lune' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries validation errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(422, errorBody('validation_error', 'invalid_parcel')));
    await expect(makeClient(fetchMock, 3).rates.quote({} as never)).rejects.toBeInstanceOf(ColistraValidationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('autoPaginate follows nextCursor until the last page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 'shp_1' }, { id: 'shp_2' }], nextCursor: 'c2' }))
      .mockResolvedValueOnce(jsonResponse(200, { data: [{ id: 'shp_3' }], nextCursor: null }));

    const ids: string[] = [];
    for await (const shipment of makeClient(fetchMock).shipments.autoPaginate({ status: 'delivered' })) {
      ids.push(shipment.id);
    }

    expect(ids).toEqual(['shp_1', 'shp_2', 'shp_3']);
    expect(fetchMock.mock.calls[1][0]).toContain('cursor=c2');
    expect(fetchMock.mock.calls[1][0]).toContain('status=delivered');
  });
});
