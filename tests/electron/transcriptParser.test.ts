import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CodexTranscriptParser,
  parseTranscriptLine,
} from '../../electron/services/transcriptParser';

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

describe('CodexTranscriptParser', () => {
  it('uses session metadata and turn context to normalize owner messages', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'session_meta',
          timestamp: '2026-08-01T12:00:00Z',
          payload: { id: 'codex-session-1', cwd: '/work/codex-project' },
        }),
      ),
    ).toBeNull();
    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'turn_context',
          timestamp: '2026-08-01T12:00:01Z',
          payload: { cwd: '/work/codex-project' },
        }),
      ),
    ).toBeNull();
    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:00:02Z',
          payload: {
            type: 'message',
            role: 'user',
            content: [
              { type: 'input_text', text: '你为什么又没跑测试？' },
              { type: 'input_image', image_url: 'data:image/png;base64,secret' },
            ],
          },
        }),
      ),
    ).toEqual({
      kind: 'owner-message',
      sessionId: 'codex-session-1',
      cwd: '/work/codex-project',
      timestamp: Date.parse('2026-08-01T12:00:02Z'),
      text: '你为什么又没跑测试？',
    });
  });

  it('normalizes assistant text and ignores duplicate event messages', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';
    parser.parse(
      transcriptPath,
      JSON.stringify({
        type: 'turn_context',
        timestamp: '2026-08-01T12:10:00Z',
        payload: { cwd: '/work/codex-project' },
      }),
    );

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'event_msg',
          timestamp: '2026-08-01T12:10:01Z',
          payload: { type: 'user_message', message: 'duplicated text' },
        }),
      ),
    ).toBeNull();
    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:10:02Z',
          payload: {
            type: 'message',
            role: 'assistant',
            content: [
              { type: 'output_text', text: '先检查。' },
              { type: 'output_text', text: '然后修复。' },
            ],
          },
        }),
      ),
    ).toEqual({
      kind: 'assistant-message',
      sessionId: transcriptPath,
      cwd: '/work/codex-project',
      timestamp: Date.parse('2026-08-01T12:10:02Z'),
      text: '先检查。\n然后修复。',
    });
  });

  it('forgets path metadata after transcript rotation', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';
    parser.parse(
      transcriptPath,
      JSON.stringify({
        type: 'session_meta',
        timestamp: '2026-08-01T12:20:00Z',
        payload: { id: 'old-session', cwd: '/work/old-project' },
      }),
    );
    parser.forget(transcriptPath);

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:20:01Z',
          payload: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'new stream' }],
          },
        }),
      ),
    ).toEqual({
      kind: 'owner-message',
      sessionId: transcriptPath,
      cwd: 'Codex workspace',
      timestamp: Date.parse('2026-08-01T12:20:01Z'),
      text: 'new stream',
    });
  });

  it('normalizes Codex function calls and explicit failed results', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';
    parser.parse(
      transcriptPath,
      JSON.stringify({
        type: 'turn_context',
        timestamp: '2026-08-01T12:30:00Z',
        payload: { cwd: '/work/codex-project' },
      }),
    );

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:30:01Z',
          payload: {
            type: 'function_call',
            call_id: 'call-1',
            name: 'exec_command',
            arguments: '{"command":"npm test"}',
          },
        }),
      ),
    ).toEqual({
      kind: 'tool-use',
      sessionId: transcriptPath,
      cwd: '/work/codex-project',
      timestamp: Date.parse('2026-08-01T12:30:01Z'),
      toolUseId: 'call-1',
      toolName: 'exec_command',
      input: { command: 'npm test' },
    });

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:30:02Z',
          payload: {
            type: 'function_call_output',
            call_id: 'call-1',
            output: { text: '2 tests failed', is_error: true },
          },
        }),
      ),
    ).toEqual({
      kind: 'tool-result',
      sessionId: transcriptPath,
      cwd: '/work/codex-project',
      timestamp: Date.parse('2026-08-01T12:30:02Z'),
      toolUseId: 'call-1',
      isError: true,
      text: '2 tests failed',
    });
  });

  it('normalizes Codex exec commands and non-zero process exits', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:40:00Z',
          payload: {
            type: 'function_call',
            call_id: 'call-2',
            name: 'exec_command',
            arguments: '{"cmd":"npm test","workdir":"/work/project"}',
          },
        }),
      ),
    ).toMatchObject({ input: { command: 'npm test', workdir: '/work/project' } });
    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:40:01Z',
          payload: {
            type: 'function_call_output',
            call_id: 'call-2',
            output: 'Chunk ID: safe\nProcess exited with code 1\nFinal output:\n2 failed',
          },
        }),
      ),
    ).toMatchObject({ kind: 'tool-result', isError: true });
  });

  it('normalizes Codex custom apply_patch calls as tool events', () => {
    const parser = new CodexTranscriptParser();
    const transcriptPath = '/approved/codex/rollout.jsonl';
    const patch = '*** Begin Patch\n*** Update File: src/main.ts\n*** End Patch';

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:50:00Z',
          payload: {
            type: 'custom_tool_call',
            call_id: 'patch-1',
            name: 'apply_patch',
            input: patch,
          },
        }),
      ),
    ).toMatchObject({
      kind: 'tool-use',
      toolUseId: 'patch-1',
      toolName: 'apply_patch',
      input: { patch },
    });

    expect(
      parser.parse(
        transcriptPath,
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:50:01Z',
          payload: {
            type: 'custom_tool_call_output',
            call_id: 'patch-1',
            output: [{ type: 'input_text', text: 'Success. Updated one file.' }],
          },
        }),
      ),
    ).toMatchObject({
      kind: 'tool-result',
      toolUseId: 'patch-1',
      isError: false,
    });
  });

  it('marks an explicitly failed custom tool output as an error', () => {
    const parser = new CodexTranscriptParser();
    expect(
      parser.parse(
        '/approved/codex/rollout.jsonl',
        JSON.stringify({
          type: 'response_item',
          timestamp: '2026-08-01T12:51:00Z',
          payload: {
            type: 'custom_tool_call_output',
            call_id: 'patch-failed',
            output: [{ type: 'input_text', text: 'Error: patch could not be applied' }],
          },
        }),
      ),
    ).toMatchObject({
      kind: 'tool-result',
      toolUseId: 'patch-failed',
      isError: true,
    });
  });
});
