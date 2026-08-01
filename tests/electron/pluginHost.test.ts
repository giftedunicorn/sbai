import { describe, expect, it } from 'vitest';

import {
  createRoastWithFallback,
  type MouthpieceProvider,
} from '../../electron/services/pluginHost';
import { RoastEngine } from '../../electron/services/roastEngine';
import type { Evidence } from '../../src/shared/companion';

const evidence: Evidence[] = [
  { kind: 'test-failure', value: 'npm test failed', confidence: 'observed' },
];

describe('createRoastWithFallback', () => {
  it('gives a provider only intensity and bounded evidence', async () => {
    const calls: unknown[] = [];
    let signal: AbortSignal | undefined;
    const provider: MouthpieceProvider = {
      async generate(input, context) {
        calls.push(input);
        signal = context.signal;
        return '外部嘴替只返回这一句';
      },
    };

    const result = await createRoastWithFallback(
      provider,
      { intensity: 'angry', evidence },
      new RoastEngine(),
    );

    expect(calls).toEqual([
      {
        intensity: 'angry',
        evidence: [
          {
            kind: 'test-failure',
            value: 'Observed test failure',
            confidence: 'observed',
          },
        ],
      },
    ]);
    expect(Object.keys(calls[0] as object).sort()).toEqual(['evidence', 'intensity']);
    expect(result.roast).toBe('外部嘴替只返回这一句');
    expect(result.animation).toBe('slap-combo');
    expect(signal?.aborted).toBe(false);
  });

  it.each([
    ['rejection', { generate: async () => Promise.reject(new Error('offline')) }],
    ['blank output', { generate: async () => '   ' }],
  ] satisfies Array<[string, MouthpieceProvider]>)('uses fallback on %s', async (_name, provider) => {
    const result = await createRoastWithFallback(
      provider,
      { intensity: 'angry', evidence },
      new RoastEngine(),
      20,
    );

    expect(result.roast.trim().length).toBeGreaterThan(0);
    expect(result.roast).not.toBe('外部嘴替只返回这一句');
  });

  it('uses fallback when the provider times out', async () => {
    let signal: AbortSignal | undefined;
    const provider: MouthpieceProvider = {
      generate: (_input, context) => {
        signal = context.signal;
        return new Promise(() => undefined);
      },
    };

    const result = await createRoastWithFallback(
      provider,
      { intensity: 'furious', evidence: [] },
      new RoastEngine(),
      5,
    );

    expect(result.roast.trim().length).toBeGreaterThan(0);
    expect(result.animation).toBe('token-explosion');
    expect(signal?.aborted).toBe(true);
  });
});
