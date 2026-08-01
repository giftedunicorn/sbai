import { appendFile, mkdtemp, rm, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { TranscriptTailer } from '../../electron/services/transcriptTailer';

let root: string;
let transcriptPath: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'sbai-tailer-'));
  transcriptPath = join(root, 'session.jsonl');
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('TranscriptTailer', () => {
  it('primes existing files at EOF without ingesting history', async () => {
    await writeFile(transcriptPath, 'old one\nold two\n');
    const tailer = new TranscriptTailer();

    await tailer.prime([transcriptPath]);

    expect(await tailer.poll([transcriptPath])).toEqual([]);
  });

  it('reads only lines appended after priming', async () => {
    await writeFile(transcriptPath, 'old\n');
    const tailer = new TranscriptTailer();
    await tailer.prime([transcriptPath]);
    await appendFile(transcriptPath, 'new one\nnew two\n');

    expect(await tailer.poll([transcriptPath])).toEqual([
      { path: transcriptPath, line: 'new one' },
      { path: transcriptPath, line: 'new two' },
    ]);
  });

  it('buffers a partial line until a newline arrives', async () => {
    await writeFile(transcriptPath, '');
    const tailer = new TranscriptTailer();
    await tailer.prime([transcriptPath]);
    await appendFile(transcriptPath, '半条');

    expect(await tailer.poll([transcriptPath])).toEqual([]);
    await appendFile(transcriptPath, '记录\n');
    expect(await tailer.poll([transcriptPath])).toEqual([
      { path: transcriptPath, line: '半条记录' },
    ]);
  });

  it('resets safely after truncation', async () => {
    await writeFile(transcriptPath, 'history\n');
    const tailer = new TranscriptTailer();
    await tailer.prime([transcriptPath]);
    await truncate(transcriptPath, 0);
    await appendFile(transcriptPath, 'fresh\n');

    expect(await tailer.poll([transcriptPath])).toEqual([
      { path: transcriptPath, line: 'fresh' },
    ]);
  });

  it('starts later-discovered files at byte zero and never emits bytes twice', async () => {
    await writeFile(transcriptPath, 'first\n');
    const tailer = new TranscriptTailer();

    expect(await tailer.poll([transcriptPath])).toEqual([
      { path: transcriptPath, line: 'first' },
    ]);
    expect(await tailer.poll([transcriptPath])).toEqual([]);
    await appendFile(transcriptPath, 'second\n');
    expect(await tailer.poll([transcriptPath])).toEqual([
      { path: transcriptPath, line: 'second' },
    ]);
    expect(await tailer.poll([transcriptPath])).toEqual([]);
  });
});
