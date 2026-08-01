import type { AngerIntensity, Evidence } from '../../src/shared/companion.js';
import { RoastEngine } from './roastEngine.js';

export interface MouthpieceProvider {
  generate(input: {
    intensity: AngerIntensity;
    evidence: Evidence[];
  }): Promise<string>;
}

type RoastInput = {
  intensity: AngerIntensity;
  evidence: Evidence[];
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('provider timeout')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function createRoastWithFallback(
  provider: MouthpieceProvider | undefined,
  input: RoastInput,
  fallback: RoastEngine,
  timeoutMs = 1_500,
): Promise<ReturnType<RoastEngine['create']>> {
  const fallbackResult = fallback.create(input);
  if (!provider) return fallbackResult;

  const providerInput: RoastInput = {
    intensity: input.intensity,
    evidence: input.evidence.slice(0, 5).map((item) => ({ ...item })),
  };

  try {
    const generated = await withTimeout(
      Promise.resolve().then(() => provider.generate(providerInput)),
      timeoutMs,
    );
    const roast = generated.trim();
    if (!roast) return fallbackResult;
    return { ...fallbackResult, roast: roast.slice(0, 500) };
  } catch {
    return fallbackResult;
  }
}
