import { constants } from 'node:fs';
import { open, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative } from 'node:path';

export interface AppendedLine {
  path: string;
  line: string;
}

interface TailState {
  offset: number;
  pending: Buffer;
  device: number;
  inode: number;
}

const MAX_BYTES_PER_POLL = 1024 * 1024;

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ENOENT' ||
      error.code === 'EACCES' ||
      error.code === 'EPERM' ||
      error.code === 'ELOOP')
  );
}

function isInsideRoot(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === '' ||
    (!pathFromRoot.startsWith('..') && !isAbsolute(pathFromRoot))
  );
}

function completeLines(path: string, bytes: Buffer, state: TailState): AppendedLine[] {
  const combined =
    state.pending.length === 0 ? bytes : Buffer.concat([state.pending, bytes]);
  const lines: AppendedLine[] = [];
  let start = 0;

  for (let index = 0; index < combined.length; index += 1) {
    if (combined[index] !== 0x0a) continue;
    let end = index;
    if (end > start && combined[end - 1] === 0x0d) end -= 1;
    lines.push({ path, line: combined.subarray(start, end).toString('utf8') });
    start = index + 1;
  }

  state.pending = Buffer.from(combined.subarray(start));
  return lines;
}

export class TranscriptTailer {
  private readonly states = new Map<string, TailState>();
  private readonly resetPaths = new Set<string>();
  private approvedRealRoot: string | null = null;

  async setApprovedRoot(root: string): Promise<boolean> {
    try {
      this.approvedRealRoot = await realpath(root);
      return true;
    } catch (error) {
      if (!isMissing(error)) throw error;
      this.approvedRealRoot = null;
      return false;
    }
  }

  async prime(paths: string[]): Promise<void> {
    for (const path of [...new Set(paths)].sort()) {
      if (this.states.has(path)) continue;
      let opened;
      try {
        opened = await this.openVerified(path);
        if (!opened) continue;
        const { info } = opened;
        this.states.set(path, {
          offset: info.size,
          pending: Buffer.alloc(0),
          device: info.dev,
          inode: info.ino,
        });
      } catch (error) {
        if (!isMissing(error)) throw error;
      } finally {
        await opened?.handle.close();
      }
    }
  }

  async poll(paths: string[]): Promise<AppendedLine[]> {
    const appended: AppendedLine[] = [];

    for (const path of [...new Set(paths)].sort()) {
      let state = this.states.get(path);
      let opened;
      try {
        opened = await this.openVerified(path);
        if (!opened) continue;
        const { handle, info } = opened;

        if (!state) {
          state = {
            offset: 0,
            pending: Buffer.alloc(0),
            device: info.dev,
            inode: info.ino,
          };
          this.states.set(path, state);
        }

        if (
          state.device !== info.dev ||
          state.inode !== info.ino ||
          info.size < state.offset
        ) {
          state.offset = 0;
          state.pending = Buffer.alloc(0);
          state.device = info.dev;
          state.inode = info.ino;
          this.resetPaths.add(path);
        }

        const available = info.size - state.offset;
        if (available <= 0) continue;
        const bytesToRead = Math.min(available, MAX_BYTES_PER_POLL);
        const bytes = Buffer.allocUnsafe(bytesToRead);
        const { bytesRead } = await handle.read(bytes, 0, bytesToRead, state.offset);
        if (bytesRead <= 0) continue;

        state.offset += bytesRead;
        appended.push(...completeLines(path, bytes.subarray(0, bytesRead), state));
      } catch (error) {
        if (!isMissing(error)) throw error;
      } finally {
        await opened?.handle.close();
      }
    }

    return appended;
  }

  forget(path: string): void {
    this.states.delete(path);
    this.resetPaths.delete(path);
  }

  takeResetPaths(): string[] {
    const paths = [...this.resetPaths].sort();
    this.resetPaths.clear();
    return paths;
  }

  clear(): void {
    this.states.clear();
    this.resetPaths.clear();
    this.approvedRealRoot = null;
  }

  private async openVerified(path: string) {
    const canonicalBefore = await realpath(path);
    if (
      this.approvedRealRoot &&
      !isInsideRoot(this.approvedRealRoot, canonicalBefore)
    ) {
      return null;
    }

    const noFollow = constants.O_NOFOLLOW ?? 0;
    const handle = await open(path, constants.O_RDONLY | noFollow);
    try {
      const info = await handle.stat();
      if (!info.isFile()) {
        await handle.close();
        return null;
      }

      const [canonicalAfter, pathInfo] = await Promise.all([
        realpath(path),
        stat(path),
      ]);
      const sameOpenedFile = pathInfo.dev === info.dev && pathInfo.ino === info.ino;
      const remainsInside =
        !this.approvedRealRoot || isInsideRoot(this.approvedRealRoot, canonicalAfter);
      if (!sameOpenedFile || !remainsInside || canonicalAfter !== canonicalBefore) {
        await handle.close();
        return null;
      }
      return { handle, info };
    } catch (error) {
      await handle.close();
      throw error;
    }
  }
}
