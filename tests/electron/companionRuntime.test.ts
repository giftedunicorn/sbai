import { appendFile, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CompanionRuntime } from '../../electron/services/companionRuntime';
import type { MouthpieceProvider } from '../../electron/services/pluginHost';
import type {
  CatharsisEvent,
  CompanionSnapshot,
} from '../../src/shared/companion';

let root: string;
let transcriptOne: string;

const line = (value: unknown) => `${JSON.stringify(value)}\n`;

function owner(sessionId: string, text: string, timestamp: string) {
  return {
    type: 'user',
    sessionId,
    cwd: '/work/shared-project',
    timestamp,
    message: { role: 'user', content: text },
  };
}

function toolUse(sessionId: string, id: string, command: string, timestamp: string) {
  return {
    type: 'assistant',
    sessionId,
    cwd: '/work/shared-project',
    timestamp,
    message: {
      role: 'assistant',
      content: [{ type: 'tool_use', id, name: 'Bash', input: { command } }],
    },
  };
}

function toolResult(sessionId: string, id: string, text: string, timestamp: string) {
  return {
    type: 'user',
    sessionId,
    cwd: '/work/shared-project',
    timestamp,
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: id, is_error: true, content: text }],
    },
  };
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'sbai-runtime-'));
  transcriptOne = join(root, 'session-one.jsonl');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('CompanionRuntime', () => {
  it('orchestrates isolated read-only automatic and manual catharsis', async () => {
    await writeFile(
      transcriptOne,
      line(owner('s1', '你他妈又乱改', '2026-08-01T10:00:00Z')),
    );
    const snapshots: CompanionSnapshot[] = [];
    const catharsis: CatharsisEvent[] = [];
    const runtime = new CompanionRuntime({
      intervalMs: 0,
      now: () => Date.parse('2026-08-01T10:01:00Z'),
      processPresent: async () => true,
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onCatharsis: (event) => catharsis.push(event),
    });

    await runtime.start(root);
    await runtime.tick();
    expect(catharsis).toEqual([]);
    expect(snapshots.at(-1)?.sessions).toEqual([]);

    await appendFile(
      transcriptOne,
      line(owner('s1', '这里类型不对，请修改', '2026-08-01T10:01:01Z')),
    );
    await runtime.tick();
    const targetOneId = snapshots.at(-1)?.sessions[0]?.id;
    expect(targetOneId).toBe('agent-1');
    expect(catharsis).toEqual([]);

    await appendFile(
      transcriptOne,
      line(toolUse('s1', 't1', 'npm test', '2026-08-01T10:01:02Z')) +
        line(toolResult('s1', 't1', 'S1: 2 tests failed', '2026-08-01T10:01:03Z')),
    );
    await runtime.tick();
    expect(catharsis).toEqual([]);

    const transcriptTwo = join(root, 'session-two.jsonl');
    await writeFile(
      transcriptTwo,
      line(toolUse('s2', 't2', 'pytest', '2026-08-01T10:01:04Z')) +
        line(toolResult('s2', 't2', 'S2_SECRET failure', '2026-08-01T10:01:05Z')),
    );
    await runtime.tick();

    await appendFile(
      transcriptOne,
      line(owner('s1', '谁让你乱改二十个文件的？', '2026-08-01T10:01:06Z')),
    );
    await runtime.tick();
    await runtime.tick();

    expect(catharsis).toHaveLength(1);
    expect(catharsis[0]).toMatchObject({
      sessionId: targetOneId,
      trigger: 'owner-anger',
      intensity: 'angry',
    });
    expect(catharsis[0].evidence.some((item) => item.value.includes('S1:'))).toBe(true);
    expect(catharsis[0].evidence.some((item) => item.value.includes('S2_SECRET'))).toBe(
      false,
    );

    runtime.setPaused(true);
    await appendFile(
      transcriptOne,
      line(owner('s1', '你他妈又删我代码，真是个傻逼', '2026-08-01T10:01:07Z')),
    );
    await runtime.tick();
    expect(catharsis).toHaveLength(1);

    await runtime.manualRoast(targetOneId!);
    expect(catharsis).toHaveLength(2);
    expect(catharsis[1]).toMatchObject({ sessionId: targetOneId, trigger: 'manual' });

    await rm(transcriptOne);
    await runtime.tick();
    expect(
      snapshots.at(-1)?.sessions.find((session) => session.id === targetOneId)?.status,
    ).toBe('ended');
    await runtime.manualRoast(targetOneId!);
    expect(catharsis).toHaveLength(2);

    runtime.stop();
  });

  it('serializes overlapping ticks', async () => {
    await writeFile(transcriptOne, '');
    let inFlight = 0;
    let maximumInFlight = 0;
    const runtime = new CompanionRuntime({
      intervalMs: 0,
      processPresent: async () => {
        inFlight += 1;
        maximumInFlight = Math.max(maximumInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;
        return false;
      },
      onSnapshot: () => undefined,
      onCatharsis: () => undefined,
    });
    await runtime.start(root);

    await Promise.all([runtime.tick(), runtime.tick(), runtime.tick()]);

    expect(maximumInFlight).toBe(1);
    runtime.stop();
  });

  it('cancels an in-flight provider and never emits after stop', async () => {
    await writeFile(transcriptOne, '');
    let releaseProvider: ((value: string) => void) | undefined;
    let providerStarted: (() => void) | undefined;
    const started = new Promise<void>((resolve) => {
      providerStarted = resolve;
    });
    let providerSignal: AbortSignal | undefined;
    const provider: MouthpieceProvider = {
      generate: (_input, context) => {
        providerSignal = context.signal;
        providerStarted?.();
        return new Promise<string>((resolve) => {
          releaseProvider = resolve;
        });
      },
    };
    const catharsis: CatharsisEvent[] = [];
    const runtime = new CompanionRuntime({
      intervalMs: 0,
      provider,
      processPresent: async () => false,
      onSnapshot: () => undefined,
      onCatharsis: (event) => catharsis.push(event),
    });
    await runtime.start(root);
    await appendFile(
      transcriptOne,
      line(owner('s1', '谁让你乱改二十个文件的？', '2026-08-01T10:02:00Z')),
    );

    const tick = runtime.tick();
    await started;
    runtime.stop();
    expect(providerSignal?.aborted).toBe(true);
    releaseProvider?.('这条旧消息不该出现');
    await tick;

    expect(catharsis).toEqual([]);
  });

  it('clears old evidence when a transcript path rotates to a new inode', async () => {
    await writeFile(transcriptOne, '');
    const catharsis: CatharsisEvent[] = [];
    const runtime = new CompanionRuntime({
      intervalMs: 0,
      processPresent: async () => false,
      onSnapshot: () => undefined,
      onCatharsis: (event) => catharsis.push(event),
    });
    await runtime.start(root);
    await appendFile(
      transcriptOne,
      line(toolUse('s1', 'old-tool', 'npm test', '2026-08-01T10:03:00Z')) +
        line(
          toolResult(
            's1',
            'old-tool',
            'OLD_STREAM_SECRET failure',
            '2026-08-01T10:03:01Z',
          ),
        ),
    );
    await runtime.tick();

    const replacement = join(root, 'replacement.jsonl');
    await writeFile(
      replacement,
      line(owner('s1', '谁让你乱改二十个文件的？', '2026-08-01T10:03:02Z')),
    );
    await rename(replacement, transcriptOne);
    await runtime.tick();

    expect(catharsis).toHaveLength(1);
    expect(catharsis[0].evidence).toEqual([]);
    expect(JSON.stringify(catharsis[0])).not.toContain('OLD_STREAM_SECRET');
    runtime.stop();
  });
});
