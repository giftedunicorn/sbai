import { describe, expect, it } from 'vitest';

import { extractEvidence } from '../../electron/services/contextExtractor';
import type { NormalizedTranscriptRecord } from '../../electron/services/transcriptParser';

const base = { sessionId: 's1', cwd: '/tmp/demo', timestamp: 1 };

function toolUse(
  toolUseId: string,
  toolName: string,
  input: Record<string, unknown>,
): NormalizedTranscriptRecord {
  return { kind: 'tool-use', ...base, toolUseId, toolName, input };
}

function toolResult(
  toolUseId: string,
  isError: boolean,
  text: string,
): NormalizedTranscriptRecord {
  return { kind: 'tool-result', ...base, toolUseId, isError, text };
}

describe('extractEvidence', () => {
  it('turns a failed test command into observed test-failure evidence', () => {
    expect(
      extractEvidence([
        toolUse('t1', 'Bash', { command: 'npm test' }),
        toolResult('t1', true, '2 tests failed'),
      ]),
    ).toEqual([
      {
        kind: 'test-failure',
        value: 'npm test - 2 tests failed',
        confidence: 'observed',
      },
    ]);
  });

  it('records failed non-test tools and observed Edit/Write paths', () => {
    expect(
      extractEvidence([
        toolUse('t1', 'Read', { file_path: '/tmp/missing.ts' }),
        toolResult('t1', true, 'ENOENT'),
        toolUse('t2', 'Edit', { file_path: '/tmp/app.ts' }),
        toolUse('t3', 'Write', { path: '/tmp/new.ts' }),
      ]),
    ).toEqual([
      { kind: 'tool-failure', value: 'Read - ENOENT', confidence: 'observed' },
      { kind: 'file-edit', value: '/tmp/app.ts', confidence: 'observed' },
      { kind: 'file-edit', value: '/tmp/new.ts', confidence: 'observed' },
    ]);
  });

  it('does not invent a zero-test claim when no failed test was observed', () => {
    const evidence = extractEvidence([
      toolUse('t1', 'Bash', { command: 'npm test' }),
      toolResult('t1', false, '12 tests passed'),
    ]);

    expect(evidence).toEqual([]);
    expect(evidence.some((item) => item.value.includes('0 tests'))).toBe(false);
  });

  it('deduplicates facts and caps the result at five', () => {
    const records: NormalizedTranscriptRecord[] = [];
    for (let index = 0; index < 7; index += 1) {
      records.push(toolUse(`t${index}`, 'Edit', { file_path: `/tmp/${index}.ts` }));
    }
    records.push(toolUse('duplicate', 'Edit', { file_path: '/tmp/0.ts' }));

    expect(extractEvidence(records)).toHaveLength(5);
    expect(extractEvidence(records).map((item) => item.value)).toEqual([
      '/tmp/0.ts',
      '/tmp/1.ts',
      '/tmp/2.ts',
      '/tmp/3.ts',
      '/tmp/4.ts',
    ]);
  });
});
