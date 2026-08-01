import type { AngerIntensity, Evidence } from '../../src/shared/companion.js';
import { RoastEngine } from './roastEngine.js';

export interface MouthpieceProvider {
  generate(input: {
    intensity: AngerIntensity;
    evidence: Evidence[];
  }, context: { signal: AbortSignal }): Promise<string>;
}

type RoastInput = {
  intensity: AngerIntensity;
  evidence: Evidence[];
};

const PROVIDER_EVIDENCE_SUMMARY: Record<Evidence['kind'], string> = {
  'test-failure': 'Observed test failure',
  'tool-failure': 'Observed tool failure',
  'file-edit': 'Observed file edit',
};

async function withTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const abortFromExternal = () => controller.abort(externalSignal?.reason);
  if (externalSignal?.aborted) abortFromExternal();
  else externalSignal?.addEventListener('abort', abortFromExternal, { once: true });

  try {
    timer = setTimeout(() => controller.abort(new Error('provider timeout')), timeoutMs);
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      new Promise<T>((_resolve, reject) => {
        const rejectOnAbort = () => reject(controller.signal.reason);
        if (controller.signal.aborted) rejectOnAbort();
        else controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}

export async function createRoastWithFallback(
  provider: MouthpieceProvider | undefined,
  input: RoastInput,
  fallback: RoastEngine,
  timeoutMs = 1_500,
  signal?: AbortSignal,
): Promise<ReturnType<RoastEngine['create']>> {
  const fallbackResult = fallback.create(input);
  if (!provider) return fallbackResult;

  const providerInput: RoastInput = {
    intensity: input.intensity,
    evidence: input.evidence.slice(0, 5).map((item) => ({
      kind: item.kind,
      value: PROVIDER_EVIDENCE_SUMMARY[item.kind],
      confidence: 'observed',
    })),
  };

  try {
    const generated = await withTimeout(
      (providerSignal) => provider.generate(providerInput, { signal: providerSignal }),
      timeoutMs,
      signal,
    );
    const roast = generated.trim();
    if (!roast) return fallbackResult;
    return { ...fallbackResult, roast: roast.slice(0, 500) };
  } catch {
    return fallbackResult;
  }
}
