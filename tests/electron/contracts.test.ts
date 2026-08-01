import { describe, expect, it } from 'vitest';

import {
  isCatharsisEvent,
  isCompanionSnapshot,
} from '../../src/shared/companion';

describe('companion contracts', () => {
  it('rejects catharsis events without a target session', () => {
    expect(isCatharsisEvent({ intensity: 'angry', roast: 'x' })).toBe(false);
  });

  it('rejects evidence that was not directly observed', () => {
    expect(
      isCatharsisEvent({
        sessionId: 's1',
        trigger: 'owner-anger',
        intensity: 'angry',
        evidence: [
          { kind: 'test-failure', value: 'maybe failed', confidence: 'guessed' },
        ],
        roast: '测试都炸了，你宣布什么完成？',
        animation: 'slap-combo',
      }),
    ).toBe(false);
  });

  it('accepts a complete catharsis event', () => {
    expect(
      isCatharsisEvent({
        sessionId: 's1',
        trigger: 'owner-anger',
        intensity: 'angry',
        evidence: [],
        roast: '测试都炸了，你宣布什么完成？',
        animation: 'slap-combo',
      }),
    ).toBe(true);
  });

  it('validates renderer snapshots', () => {
    expect(
      isCompanionSnapshot({
        paused: false,
        claudeProcessPresent: true,
        sessions: [
          {
            id: 's1',
            label: 'Claude #1',
            projectLabel: 'sbai',
            status: 'active',
            lastActivityAt: 123,
          },
        ],
      }),
    ).toBe(true);

    expect(
      isCompanionSnapshot({
        paused: false,
        claudeProcessPresent: true,
        sessions: [{ id: 's1', status: 'invented' }],
      }),
    ).toBe(false);
  });
});
