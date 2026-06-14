import { describe, expect, it } from 'vitest';
import { BOXING_GLOVE_CURSOR } from '../src/game/cursor';

describe('boxing glove cursor', () => {
  it('provides a CSS cursor value backed by an SVG data URL', () => {
    expect(BOXING_GLOVE_CURSOR).toContain('data:image/svg+xml');
    expect(BOXING_GLOVE_CURSOR).toContain('cursor');
    expect(BOXING_GLOVE_CURSOR).toContain('pointer');
  });
});
