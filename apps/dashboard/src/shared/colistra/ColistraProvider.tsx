import { Colistra } from '@colistra/sdk';
import { useState, type ReactNode } from 'react';
import { COLISTRA_API_KEY } from '../config';
import { ColistraContext } from './context';

/**
 * Creates the Colistra client once and shares it with the whole app.
 *
 * Rate limits and server errors are retried twice before surfacing an error.
 * This is safe for label purchases because they always carry an idempotency key.
 */
export function ColistraProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new Colistra({ apiKey: COLISTRA_API_KEY, maxRetries: 2 }));
  return <ColistraContext.Provider value={client}>{children}</ColistraContext.Provider>;
}
