export interface RandomSource {
  next(): number;
  integer(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
}

export function createRandom(seed = Date.now()): RandomSource {
  let state = seed >>> 0;

  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return {
    next,
    integer(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error('maxExclusive must be a positive integer');
      }

      return Math.floor(next() * maxExclusive);
    },
    pick<T>(items: readonly T[]) {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty list');
      }

      return items[this.integer(items.length)];
    },
  };
}
