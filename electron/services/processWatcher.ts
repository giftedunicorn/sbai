import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import { promisify } from 'node:util';

import type { AgentProcessPresence } from '../../src/shared/companion.js';

const execFileAsync = promisify(execFile);

export function parseClaudeProcessPresence(output: string): boolean {
  return parseAgentProcessPresence(output).claudeCode;
}

export function parseAgentProcessPresence(output: string): AgentProcessPresence {
  const presence: AgentProcessPresence = { claudeCode: false, codex: false };
  for (const line of output.split(/\r?\n/)) {
    const match = line.trim().match(/^\d+\s+(\S+)/);
    if (!match) continue;
    const executable = match[1];
    if (/\.app\/contents\/macos\//i.test(executable)) continue;
    const name = basename(executable).toLocaleLowerCase();
    if (name === 'claude') presence.claudeCode = true;
    if (name === 'codex') presence.codex = true;
  }
  return presence;
}

export async function getAgentProcessPresence(): Promise<AgentProcessPresence> {
  if (process.platform !== 'darwin') return { claudeCode: false, codex: false };
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command='], {
      encoding: 'utf8',
      timeout: 2_000,
      maxBuffer: 1024 * 1024,
    });
    return parseAgentProcessPresence(stdout);
  } catch {
    return { claudeCode: false, codex: false };
  }
}

export async function hasClaudeProcess(): Promise<boolean> {
  if (process.platform !== 'darwin') return false;
  try {
    const { stdout } = await execFileAsync('ps', ['-axo', 'pid=,command='], {
      encoding: 'utf8',
      timeout: 2_000,
      maxBuffer: 1024 * 1024,
    });
    return parseAgentProcessPresence(stdout).claudeCode;
  } catch {
    return false;
  }
}
