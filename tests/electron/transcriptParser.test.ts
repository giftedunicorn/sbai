import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseTranscriptLine } from '../../electron/services/transcriptParser';

const fixturePath = resolve(
  process.cwd(),
  'tests/fixtures/claude/basic-session.jsonl',
);
const fixtureLines = readFileSync(fixturePath, 'utf8').trim().split('\n');

describe('parseTranscriptLine', () => {
  it('normalizes an owner message', () => {
    expect(parseTranscriptLine(fixtureLines[0])).toEqual({
      kind: 'owner-message',
      sessionId: 's1',
      cwd: '/tmp/demo',
      timestamp: Date.parse('2026-08-01T10:00:00Z'),
      text: '为什么又没跑测试？',
    });
  });

  it('normalizes a tool use', () => {
    expect(parseTranscriptLine(fixtureLines[1])).toEqual({
      kind: 'tool-use',
      sessionId: 's1',
      cwd: '/tmp/demo',
      timestamp: Date.parse('2026-08-01T10:00:01Z'),
      toolUseId: 't1',
      toolName: 'Bash',
      input: { command: 'npm test' },
    });
  });

  it('normalizes a tool result before classifying its user role', () => {
    const result = parseTranscriptLine(fixtureLines[2]);

    expect(result).toEqual({
      kind: 'tool-result',
      sessionId: 's1',
      cwd: '/tmp/demo',
      timestamp: Date.parse('2026-08-01T10:00:02Z'),
      toolUseId: 't1',
      isError: true,
      text: '2 tests failed',
    });
    expect(result?.kind).not.toBe('owner-message');
  });

  it('joins text blocks for assistant messages', () => {
    expect(
      parseTranscriptLine(
        JSON.stringify({
          type: 'assistant',
          sessionId: 's2',
          cwd: '/tmp/other',
          timestamp: '2026-08-01T11:00:00Z',
          message: {
            role: 'assistant',
            content: [
              { type: 'text', text: '先检查。' },
              { type: 'text', text: '然后修复。' },
            ],
          },
        }),
      ),
    ).toEqual({
      kind: 'assistant-message',
      sessionId: 's2',
      cwd: '/tmp/other',
      timestamp: Date.parse('2026-08-01T11:00:00Z'),
      text: '先检查。\n然后修复。',
    });
  });

  it('returns null for malformed, incomplete, and unknown records', () => {
    expect(parseTranscriptLine('{bad json')).toBeNull();
    expect(parseTranscriptLine(JSON.stringify({ type: 'user' }))).toBeNull();
    expect(
      parseTranscriptLine(
        JSON.stringify({
          type: 'progress',
          sessionId: 's1',
          cwd: '/tmp/demo',
          timestamp: '2026-08-01T10:00:03Z',
        }),
      ),
    ).toBeNull();
  });
});
