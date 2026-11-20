import {
  ColistraError,
  ColistraNotFoundError,
  ColistraRateLimitError,
  ColistraServerError,
  ColistraValidationError,
} from '@colistra/sdk';
import { describe, expect, it } from 'vitest';
import { describeError } from './describeError';

describe('describeError', () => {
  it('tells Inès how long to wait after a rate limit', () => {
    const description = describeError(new ColistraRateLimitError('slow down', { code: 'rate_limited', retryAfter: 3, requestId: 'req_1' }));
    expect(description.message).toContain('3 seconds');
    expect(description.canRetry).toBe(true);
    expect(description.reference).toBe('req_1');
  });

  it('distinguishes network failures from server errors', () => {
    expect(describeError(new ColistraServerError('offline', { status: null, code: 'network_error' })).title).toBe("Can't reach Colistra");
    expect(describeError(new ColistraServerError('down', { status: 503, code: 'service_unavailable' })).title).toBe('Colistra is having trouble');
  });

  it('explains expired rates', () => {
    const error = new ColistraValidationError('expired', { status: 422, code: 'rate_expired' });
    expect(describeError(error).title).toBe('These prices have expired');
  });

  it('does not offer to retry requests that will fail again', () => {
    expect(describeError(new ColistraValidationError('bad', { status: 422, code: 'invalid_parcel' })).canRetry).toBe(false);
    expect(describeError(new ColistraNotFoundError('gone', { code: 'shipment_not_found' })).canRetry).toBe(false);
  });

  it('handles other errors', () => {
    expect(describeError(new ColistraError('nope', { status: 401, code: 'invalid_api_key' })).message).toBe('nope');
    expect(describeError(new TypeError('x is undefined')).title).toBe('Something went wrong');
  });
});
