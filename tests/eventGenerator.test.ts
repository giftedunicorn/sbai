import { describe, expect, it } from 'vitest';
import { createRandom } from '../src/game/random';
import { createHitEvent } from '../src/game/eventGenerator';
import {
  APOLOGY_CAPTIONS,
  IMPACT_WORDS,
  MISTAKE_LABELS,
  PARTICLE_KINDS,
} from '../src/game/content';

describe('createHitEvent', () => {
  it('creates a complete hit event from content pools', () => {
    const event = createHitEvent({ combo: 3, random: createRandom(42) });

    expect(APOLOGY_CAPTIONS).toContain(event.apology);
    expect(MISTAKE_LABELS).toContain(event.mistakeLabel);
    expect(IMPACT_WORDS).toContain(event.impactWord);
    expect(PARTICLE_KINDS).toContain(event.particleKind);
    expect(event.force.x).not.toBe(0);
    expect(event.force.y).toBeLessThan(0);
    expect(event.screenShake).toBeGreaterThan(0);
  });

  it('scales screen shake with combo without exceeding the cap', () => {
    const low = createHitEvent({ combo: 1, random: createRandom(1) });
    const high = createHitEvent({ combo: 20, random: createRandom(1) });

    expect(high.screenShake).toBeGreaterThan(low.screenShake);
    expect(high.screenShake).toBeLessThanOrEqual(22);
  });
});
