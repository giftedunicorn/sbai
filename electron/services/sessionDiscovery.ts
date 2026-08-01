import { readdir, realpath } from 'node:fs/promises';
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
  let approvedRoot: string;
  try {
    approvedRoot = await realpath(resolve(root));
  } catch (error) {
    if (isSkippable(error)) return [];
    throw error;
  }
  const discovered: string[] = [];

  async function walk(directory: string): Promise<void> {
    let canonicalDirectory: string;
    try {
      canonicalDirectory = await realpath(directory);
    } catch (error) {
      if (isSkippable(error)) return;
      throw error;
    }
    if (!isInsideRoot(approvedRoot, canonicalDirectory)) return;

    let entries;
    try {
      entries = await readdir(canonicalDirectory, { withFileTypes: true });
    } catch (error) {
      if (isSkippable(error)) return;
      throw error;
    }

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const candidate = resolve(canonicalDirectory, entry.name);

      if (entry.isDirectory()) {
        await walk(candidate);
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        try {
          const canonicalFile = await realpath(candidate);
          if (isInsideRoot(approvedRoot, canonicalFile)) discovered.push(canonicalFile);
        } catch (error) {
          if (!isSkippable(error)) throw error;
        }
      }
    }
  }

  await walk(approvedRoot);
  return discovered.sort();
}
