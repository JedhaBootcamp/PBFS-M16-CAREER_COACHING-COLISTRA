import {
  ColistraError,
  ColistraNotFoundError,
  ColistraRateLimitError,
  ColistraServerError,
  ColistraValidationError,
} from '@colistra/sdk';

export interface ErrorDescription {
  title: string;
  message: string;
  /** Whether trying the same thing again can work. */
  canRetry: boolean;
  /** Colistra request id, to give to support. */
  reference: string | null;
}

/** Turns any error into a message Inès can understand and act on. */
export function describeError(error: unknown): ErrorDescription {
  const reference = error instanceof ColistraError ? error.requestId : null;

  if (error instanceof ColistraRateLimitError) {
    return {
      title: 'Colistra asked us to slow down',
      message: `Too many requests in a short time. Wait ${error.retryAfter} second${error.retryAfter > 1 ? 's' : ''} and try again.`,
      canRetry: true,
      reference,
    };
  }
  if (error instanceof ColistraServerError) {
    return error.status === null
      ? { title: "Can't reach Colistra", message: 'Check your internet connection, then try again.', canRetry: true, reference }
      : { title: 'Colistra is having trouble', message: 'This is usually temporary. Try again in a moment.', canRetry: true, reference };
  }
  if (error instanceof ColistraValidationError && error.code === 'rate_expired') {
    return { title: 'These prices have expired', message: 'Prices are valid for 15 minutes. Refresh them to see current prices.', canRetry: true, reference };
  }
  if (error instanceof ColistraValidationError) {
    return { title: 'Colistra refused the request', message: error.message, canRetry: false, reference };
  }
  if (error instanceof ColistraNotFoundError) {
    return { title: 'Not found', message: "This item doesn't exist anymore. It may have been removed.", canRetry: false, reference };
  }
  if (error instanceof ColistraError) {
    return { title: 'Something went wrong with Colistra', message: error.message, canRetry: true, reference };
  }
  return { title: 'Something went wrong', message: 'An unexpected error happened. Reload the page to try again.', canRetry: true, reference };
}
