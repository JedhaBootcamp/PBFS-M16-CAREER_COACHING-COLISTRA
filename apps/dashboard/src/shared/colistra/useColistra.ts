import type { Colistra } from '@colistra/sdk';
import { useContext } from 'react';
import { ColistraContext } from './context';

/** Returns the shared Colistra client. Must be used inside `<ColistraProvider>`. */
export function useColistra(): Colistra {
  const client = useContext(ColistraContext);
  if (!client) throw new Error('useColistra must be used inside <ColistraProvider>');
  return client;
}
