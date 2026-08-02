import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_SETTINGS,
  SettingsStore,
  type CompanionSettings,
} from '../../electron/services/settingsStore';

let userDataDirectory: string;

beforeEach(async () => {
  userDataDirectory = await mkdtemp(join(tmpdir(), 'sbai-settings-'));
});

afterEach(async () => {
  await rm(userDataDirectory, { recursive: true, force: true });
});

describe('SettingsStore', () => {
  it('persists only the approved privacy settings shape', async () => {
    const store = new SettingsStore(userDataDirectory);
    await store.save({
      approvedClaudeRoot: '/approved/path',
      approvedCodexRoot: '/approved/codex',
      paused: false,
      muted: false,
      transcriptContent: 'private words',
      sessionId: 'secret-session',
      roast: 'private roast',
      angerScore: 99,
      evidence: ['secret evidence'],
    } as CompanionSettings);

    const serialized = JSON.parse(
      await readFile(join(userDataDirectory, 'companion-settings.json'), 'utf8'),
    );
    expect(serialized).toEqual({
      approvedClaudeRoot: '/approved/path',
      approvedCodexRoot: '/approved/codex',
      paused: false,
      muted: false,
    });
    expect(await readdir(userDataDirectory)).toEqual(['companion-settings.json']);
  });

  it('returns safe defaults for missing, malformed, or invalid settings', async () => {
    const store = new SettingsStore(userDataDirectory);
    expect(await store.load()).toEqual(DEFAULT_SETTINGS);

    await writeFile(join(userDataDirectory, 'companion-settings.json'), '{broken');
    expect(await store.load()).toEqual(DEFAULT_SETTINGS);

    await writeFile(
      join(userDataDirectory, 'companion-settings.json'),
      JSON.stringify({ approvedClaudeRoot: '/ok', paused: 'no', muted: false }),
    );
    expect(await store.load()).toEqual(DEFAULT_SETTINGS);
  });

  it('strips unknown fields when reading valid settings', async () => {
    await writeFile(
      join(userDataDirectory, 'companion-settings.json'),
      JSON.stringify({
        approvedClaudeRoot: '/approved/path',
        paused: true,
        muted: false,
        transcript: 'must disappear',
      }),
    );

    expect(await new SettingsStore(userDataDirectory).load()).toEqual({
      approvedClaudeRoot: '/approved/path',
      approvedCodexRoot: null,
      paused: true,
      muted: false,
    });
  });

  it('persists a separately approved Codex sessions root', async () => {
    const store = new SettingsStore(userDataDirectory);
    await store.save({
      approvedClaudeRoot: null,
      approvedCodexRoot: '/Users/owner/.codex/sessions',
      paused: false,
      muted: true,
    });

    expect(await store.load()).toEqual({
      approvedClaudeRoot: null,
      approvedCodexRoot: '/Users/owner/.codex/sessions',
      paused: false,
      muted: true,
    });
  });
});
