import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function parseClaudeProcessPresence(output: string): boolean {
  return output.split(/\r?\n/).some((line) => {
    const match = line.trim().match(/^\d+\s+(\S+)/);
    if (!match) return false;
    const executable = match[1];
    if (/\.app\/contents\/macos\//i.test(executable)) return false;
    return basename(executable).toLocaleLowerCase() === 'claude';
  });
}

export async function hasClaudeProcess(): Promise<boolean> {
  if (process.platform !== 'darwin') return false;
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command='], {
      encoding: 'utf8',
      timeout: 2_000,
      maxBuffer: 1024 * 1024,
    });
    return parseClaudeProcessPresence(stdout);
  } catch {
    return false;
  }
}
