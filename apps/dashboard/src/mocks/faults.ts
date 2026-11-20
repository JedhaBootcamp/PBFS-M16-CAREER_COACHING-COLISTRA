/**
 * Realistic network behaviour for the mock API: latency, rate limiting and
 * random failures. See ./README.md for the `?chaos=` switch.
 */

export type ChaosMode = 'normal' | 'off' | 'ratelimit' | 'flaky' | 'down';

const CHAOS_MODES: ChaosMode[] = ['normal', 'off', 'ratelimit', 'flaky', 'down'];

function readChaosMode(): ChaosMode {
  if (typeof window === 'undefined') return 'off';
  const value = new URLSearchParams(window.location.search).get('chaos');
  return CHAOS_MODES.includes(value as ChaosMode) ? (value as ChaosMode) : 'normal';
}

/** Read once when the page loads, so it survives client-side navigation. */
let chaosMode: ChaosMode = readChaosMode();

export function getChaosMode(): ChaosMode {
  return chaosMode;
}

export function setChaosMode(mode: ChaosMode): void {
  chaosMode = mode;
  requestTimestamps.length = 0;
  flakyCounter = 0;
}

// ─── Latency ─────────────────────────────────────────────────────────────────

export function randomLatency(): number {
  if (typeof window === 'undefined') return 0; // unit tests
  return 200 + Math.random() * 400;
}

// ─── Rate limit: 10 requests per sliding 5-second window ─────────────────────

const WINDOW_MS = 5000;
const requestTimestamps: number[] = [];

/** Returns `null` if the request is allowed, or the number of seconds to wait. */
export function checkRateLimit(now = Date.now()): number | null {
  const limit = chaosMode === 'ratelimit' ? 3 : 10;
  while (requestTimestamps.length && requestTimestamps[0] <= now - WINDOW_MS) requestTimestamps.shift();
  if (requestTimestamps.length >= limit) {
    return Math.max(1, Math.ceil((requestTimestamps[0] + WINDOW_MS - now) / 1000));
  }
  requestTimestamps.push(now);
  return null;
}

// ─── Random failures ─────────────────────────────────────────────────────────

let flakyCounter = 0;

/** In `flaky` mode, every other request fails (the 1st, 3rd, 5th…). */
export function nextFlakyRequestFails(): boolean {
  if (chaosMode !== 'flaky') return false;
  flakyCounter++;
  return flakyCounter % 2 === 1;
}

/** Carrier APIs behind `POST /rates` fail about 5% of the time. */
export function carrierQuoteFails(): boolean {
  return chaosMode === 'normal' && Math.random() < 0.05;
}

/** About 3% of label purchases succeed but the response is lost on the way back. */
export function labelResponseLost(): boolean {
  return chaosMode === 'normal' && Math.random() < 0.03;
}
