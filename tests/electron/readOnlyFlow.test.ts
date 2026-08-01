import { appendFile, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { CompanionRuntime } from '../../electron/services/companionRuntime';
import { SettingsStore } from '../../electron/services/settingsStore';
import type { CatharsisEvent, CompanionSnapshot } from '../../src/shared/companion';

const roots: string[] = [];
const jsonLine = (value: unknown) => `${JSON.stringify(value)}\n`;

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  roots.push(directory);
  return directory;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('read-only companion flow', () => {
  it('emits catharsis without transcript writes, network calls, or private persistence', async () => {
    const claudeRoot = await temporaryDirectory('sbai-readonly-');
    const userData = await temporaryDirectory('sbai-userdata-');
    const transcriptPath = join(claudeRoot, 'session.jsonl');
    await writeFile(transcriptPath, '');

    const network = vi.fn();
    vi.stubGlobal('fetch', network);
    const catharsisEvents: CatharsisEvent[] = [];
    const snapshots: CompanionSnapshot[] = [];
    const runtime = new CompanionRuntime({
      intervalMs: 0,
      processPresent: async () => false,
      onCatharsis: (event) => catharsisEvents.push(event),
      onSnapshot: (snapshot) => snapshots.push(snapshot),
    });
    await runtime.start(claudeRoot);

    const appended =
      jsonLine({
        type: 'assistant',
        sessionId: 'private-session',
        cwd: '/work/private-project',
        timestamp: '2026-08-01T10:00:00Z',
        message: {
          role: 'assistant',
          content: [
            { type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'npm test' } },
          ],
        },
      }) +
      jsonLine({
        type: 'user',
        sessionId: 'private-session',
        cwd: '/work/private-project',
        timestamp: '2026-08-01T10:00:01Z',
        message: {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: 't1',
              is_error: true,
              content: 'PRIVATE_FAILURE: 2 tests failed',
            },
          ],
        },
      }) +
      jsonLine({
        type: 'user',
        sessionId: 'private-session',
        cwd: '/work/private-project',
        timestamp: '2026-08-01T10:00:02Z',
        message: { role: 'user', content: '谁让你乱改二十个文件的？' },
      });
    await appendFile(transcriptPath, appended);
    const originalBytes = await readFile(transcriptPath);

    await runtime.tick();
    const targetId = snapshots.at(-1)?.sessions[0]?.id;
    expect(targetId).toBe('agent-1');
    await runtime.manualRoast(targetId!);

    expect(await readFile(transcriptPath)).toEqual(originalBytes);
    expect(network).not.toHaveBeenCalled();
    expect(catharsisEvents).toHaveLength(2);
    expect(catharsisEvents.map((event) => event.trigger)).toEqual([
      'owner-anger',
      'manual',
    ]);

    const settingsStore = new SettingsStore(userData);
    await settingsStore.save({ approvedClaudeRoot: claudeRoot, paused: false, muted: false });
    const serializedSettings = await readFile(
      join(userData, 'companion-settings.json'),
      'utf8',
    );
    expect(serializedSettings).not.toContain('private-session');
    expect(serializedSettings).not.toContain('PRIVATE_FAILURE');
    expect(serializedSettings).not.toContain('谁让你');
    expect(Object.keys(JSON.parse(serializedSettings)).sort()).toEqual([
      'approvedClaudeRoot',
      'muted',
      'paused',
    ]);

    runtime.stop();
    runtime.setPaused(false);
    expect(snapshots.at(-1)?.sessions).toEqual([]);
    await runtime.manualRoast(targetId!);
    expect(catharsisEvents).toHaveLength(2);
  });
});
