import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { discoverTranscriptFiles } from '../../electron/services/sessionDiscovery';

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'sbai-discovery-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

describe('discoverTranscriptFiles', () => {
  it('returns only sorted jsonl files nested under the approved root', async () => {
    const root = await temporaryRoot();
    await mkdir(join(root, 'project', 'nested'), { recursive: true });
    await writeFile(join(root, 'project', 'z.jsonl'), '');
    await writeFile(join(root, 'project', 'notes.txt'), '');
    await writeFile(join(root, 'project', 'nested', 'a.jsonl'), '');

    expect(await discoverTranscriptFiles(root)).toEqual(
      [
        resolve(root, 'project', 'nested', 'a.jsonl'),
        resolve(root, 'project', 'z.jsonl'),
      ].sort(),
    );
  });

  it('does not follow a symlink outside the approved root', async () => {
    const root = await temporaryRoot();
    const outside = await temporaryRoot();
    await writeFile(join(outside, 'secret.jsonl'), 'do not read');
    await symlink(outside, join(root, 'escape'));

    expect(await discoverTranscriptFiles(root)).toEqual([]);
  });

  it('returns an empty list when the approved root is missing', async () => {
    const root = await temporaryRoot();
    await rm(root, { recursive: true });

    expect(await discoverTranscriptFiles(root)).toEqual([]);
  });
});
