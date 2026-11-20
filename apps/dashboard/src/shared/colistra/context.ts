import type { Colistra } from '@colistra/sdk';
import { createContext } from 'react';

export const ColistraContext = createContext<Colistra | null>(null);
