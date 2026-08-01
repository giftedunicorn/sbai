import { describe, expect, it } from 'vitest';

import { parseClaudeProcessPresence } from '../../electron/services/processWatcher';

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
