import { open, stat } from 'node:fs/promises';

export interface AppendedLine {
  path: string;
  line: string;
}

interface TailState {
  offset: number;
  pending: Buffer;
}

const MAX_BYTES_PER_POLL = 1024 * 1024;

function isMissing(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EPERM')
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

  async prime(paths: string[]): Promise<void> {
    for (const path of [...new Set(paths)].sort()) {
      if (this.states.has(path)) continue;
      try {
        const info = await stat(path);
        if (info.isFile()) {
          this.states.set(path, { offset: info.size, pending: Buffer.alloc(0) });
        }
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
    }
  }

  async poll(paths: string[]): Promise<AppendedLine[]> {
    const appended: AppendedLine[] = [];

    for (const path of [...new Set(paths)].sort()) {
      let state = this.states.get(path);
      if (!state) {
        state = { offset: 0, pending: Buffer.alloc(0) };
        this.states.set(path, state);
      }

      let handle;
      try {
        handle = await open(path, 'r');
        const info = await handle.stat();
        if (!info.isFile()) continue;

        if (info.size < state.offset) {
          state.offset = 0;
          state.pending = Buffer.alloc(0);
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
        await handle?.close();
      }
    }

    return appended;
  }

  forget(path: string): void {
    this.states.delete(path);
  }

  clear(): void {
    this.states.clear();
  }
}
