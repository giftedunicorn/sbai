import { describe, expect, it } from 'vitest';
import {
  APOLOGY_CAPTIONS,
  IMPACT_WORDS,
  MISTAKE_LABELS,
  PARTICLE_KINDS,
} from '../src/game/content';

describe('content pools', () => {
  it('provides enough apology captions for repeat hits', () => {
    expect(APOLOGY_CAPTIONS.length).toBeGreaterThanOrEqual(8);
    expect(APOLOGY_CAPTIONS).toContain('你说得对，我刚才确实没有充分理解你的意图。');
  });

  it('provides short developer-specific mistake labels', () => {
    expect(MISTAKE_LABELS.length).toBeGreaterThanOrEqual(10);
    expect(MISTAKE_LABELS).toContain('0 tests run');
    expect(MISTAKE_LABELS).toContain('+2400 lines');
    expect(MISTAKE_LABELS.every((label) => label.length <= 28)).toBe(true);
  });

  it('provides arcade impact words and particle kinds', () => {
    expect(IMPACT_WORDS).toEqual(expect.arrayContaining(['BONK', 'SMASH']));
    expect(PARTICLE_KINDS).toEqual(expect.arrayContaining(['token', 'bug', 'diff']));
  });
});
