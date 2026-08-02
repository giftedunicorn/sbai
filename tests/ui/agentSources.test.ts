import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { connectionLabel } from '../../src/ui/connectionStatus';

describe('agent source controls', () => {
  it('renders separate approval controls for Claude Code and Codex', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(html).toContain('id="approve-claude-button"');
    expect(html).toContain('id="approve-codex-button"');
  });

  it('summarizes simultaneous CLI presence without process details', () => {
    expect(
      connectionLabel({ claudeCode: true, codex: true }, 2, true),
    ).toBe('CLAUDE + CODEX / 2 AGENTS');
    expect(
      connectionLabel({ claudeCode: false, codex: true }, 1, true),
    ).toBe('CODEX ONLINE / 1 AGENT');
    expect(
      connectionLabel({ claudeCode: false, codex: false }, 0, true),
    ).toBe('LOCAL ONLY');
  });
});
