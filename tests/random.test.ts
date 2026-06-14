import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/game/random';

describe('createRandom', () => {
  it('returns deterministic choices for the same seed', () => {
    const a = createRandom(123);
    const b = createRandom(123);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('chooses an item from a non-empty list', () => {
    const random = createRandom(7);

    expect(['left', 'right', 'up']).toContain(random.pick(['left', 'right', 'up']));
  });
});
