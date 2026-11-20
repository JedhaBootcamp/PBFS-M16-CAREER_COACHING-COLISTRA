/** Small deterministic PRNG (mulberry32), so the seed data is the same on every load. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
    id: (prefix: string, length = 14) => {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let out = '';
      for (let i = 0; i < length; i++) out += alphabet[Math.floor(next() * alphabet.length)];
      return `${prefix}_${out}`;
    },
    digits: (length: number) => {
      let out = '';
      for (let i = 0; i < length; i++) out += Math.floor(next() * 10);
      return out;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;

/** Non-deterministic generator for runtime objects (labels, rates, request ids). */
export const runtimeRandom = createRandom(Date.now());
