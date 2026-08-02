import { describe, expect, it } from 'vitest';

import {
  parseAgentProcessPresence,
  parseClaudeProcessPresence,
} from '../../electron/services/processWatcher';

describe('parseClaudeProcessPresence', () => {
  it('detects an actual Claude executable token', () => {
    const output = [
      '  101 /usr/bin/login -fp owner',
      '  202 /Users/owner/.local/bin/claude --resume abc',
    ].join('\n');

    expect(parseClaudeProcessPresence(output)).toBe(true);
  });

  it('ignores unrelated processes and claude text in arguments', () => {
    const output = [
      '  101 /usr/bin/node /tmp/server.js --prompt claude',
      '  202 /bin/zsh -c echo claude',
      '  303 /Applications/Claude.app/Contents/MacOS/Claude',
    ].join('\n');

    expect(parseClaudeProcessPresence(output)).toBe(false);
  });

  it('returns only presence and does not expose raw command text', () => {
    const secretCommand = '  404 /usr/local/bin/claude --resume private-session-id';
    const presence = parseClaudeProcessPresence(secretCommand);

    expect(presence).toBe(true);
    expect(typeof presence).toBe('boolean');
    expect(JSON.stringify(presence)).not.toContain('private-session-id');
  });
});

describe('parseAgentProcessPresence', () => {
  it('reports Claude Code and Codex CLI presence without returning commands', () => {
    const output = [
      '  202 /Users/owner/.local/bin/claude --resume private-claude-id',
      '  303 /opt/homebrew/bin/codex resume private-codex-id',
    ].join('\n');

    const presence = parseAgentProcessPresence(output);
    expect(presence).toEqual({ claudeCode: true, codex: true });
    expect(JSON.stringify(presence)).not.toContain('private-');
  });

  it('does not mistake desktop app processes or arguments for CLI agents', () => {
    const output = [
      '  101 /Applications/Codex.app/Contents/MacOS/Codex',
      '  202 /usr/bin/node server.js --agent codex',
    ].join('\n');

    expect(parseAgentProcessPresence(output)).toEqual({
      claudeCode: false,
      codex: false,
    });
  });
});
