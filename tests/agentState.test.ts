import { describe, expect, it } from 'vitest';
import { createInitialAgentState, registerHit } from '../src/game/agentState';

describe('agentState', () => {
  it('starts with zero hits and calm rage', () => {
    expect(createInitialAgentState()).toEqual({
      hitCount: 0,
      combo: 0,
      rage: 0,
    });
  });

  it('increments hit count, combo, and rage on hit', () => {
    const state = registerHit(createInitialAgentState());

    expect(state.hitCount).toBe(1);
    expect(state.combo).toBe(1);
    expect(state.rage).toBe(8);
  });

  it('caps rage at 100', () => {
    let state = createInitialAgentState();

    for (let i = 0; i < 20; i += 1) {
      state = registerHit(state);
    }

    expect(state.rage).toBe(100);
  });
});
