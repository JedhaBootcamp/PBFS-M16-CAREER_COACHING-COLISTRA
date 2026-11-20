import type { Label, Order, Rate, ShipmentDetail } from '@colistra/sdk';
import { generateSeed } from './seed';

interface StoredRate extends Rate {
  parcelWeightGrams: number;
}

interface IdempotentResult {
  fingerprint: string;
  status: number;
  body: Label;
  createdAt: number;
}

export interface Database {
  orders: Order[];
  shipments: ShipmentDetail[];
  rates: Map<string, StoredRate>;
  labels: Map<string, Label>;
  idempotency: Map<string, IdempotentResult>;
}

function createDatabase(): Database {
  const { orders, shipments } = generateSeed();
  return { orders, shipments, rates: new Map(), labels: new Map(), idempotency: new Map() };
}

/** In-memory data. It lives as long as the page: a full reload resets it to the seed. */
export let db: Database = createDatabase();

export function resetDatabase(): void {
  db = createDatabase();
}
