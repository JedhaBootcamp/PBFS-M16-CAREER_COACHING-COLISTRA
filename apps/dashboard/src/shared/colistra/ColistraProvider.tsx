import { Colistra } from '@colistra/sdk';
import { useState, type ReactNode } from 'react';
import { COLISTRA_API_KEY } from '../config';
import { ColistraContext } from './context';

/** Creates the Colistra client once and shares it with the whole app. */
export function ColistraProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new Colistra({ apiKey: COLISTRA_API_KEY }));
  return <ColistraContext.Provider value={client}>{children}</ColistraContext.Provider>;
}
