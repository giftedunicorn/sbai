import { readdir } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

function isInsideRoot(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === '' ||
    (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot))
  );
}

function isSkippable(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false;
  return error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM';
}

export async function discoverTranscriptFiles(root: string): Promise<string[]> {
  const approvedRoot = resolve(root);
  const discovered: string[] = [];

  async function walk(directory: string): Promise<void> {
    if (!isInsideRoot(approvedRoot, directory)) return;

    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (isSkippable(error)) return;
      throw error;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const candidate = resolve(directory, entry.name);
      if (!isInsideRoot(approvedRoot, candidate)) continue;

      if (entry.isDirectory()) {
        await walk(candidate);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        discovered.push(candidate);
      }
    }
  }

  await walk(approvedRoot);
  return discovered.sort();
}
