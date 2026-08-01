import { describe, expect, it } from 'vitest';

import { SessionRegistry } from '../../electron/services/sessionRegistry';
import type { NormalizedTranscriptRecord } from '../../electron/services/transcriptParser';

function ownerRecord(
  sessionId: string,
  timestamp: number,
  text = `message-${timestamp}`,
  cwd = '/work/same-project',
): NormalizedTranscriptRecord {
  return {
    kind: 'owner-message',
    sessionId,
    cwd,
    timestamp,
    text,
  };
}

describe('SessionRegistry', () => {
  it('keeps same-project transcript sessions separate with fallback labels', () => {
    const registry = new SessionRegistry(() => 10_000);
    registry.ingest('/transcripts/one.jsonl', ownerRecord('session-one', 9_000));
    registry.ingest('/transcripts/two.jsonl', ownerRecord('session-two', 9_500));

    expect(registry.getSession('session-one')).toMatchObject({
      id: 'session-one',
      label: 'Claude session-',
      projectLabel: 'same-project',
      status: 'active',
    });
    expect(registry.snapshot(false, true).sessions.map((session) => session.id)).toEqual([
      'session-two',
      'session-one',
    ]);
  });

  it('retains at most the 50 most recent records', () => {
    const registry = new SessionRegistry(() => 100);
    for (let index = 0; index < 55; index += 1) {
      registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', index));
    }

    const recent = registry.getRecent('s1');
    expect(recent).toHaveLength(50);
    expect(recent[0]).toMatchObject({ timestamp: 5 });
    expect(recent[49]).toMatchObject({ timestamp: 54 });
  });

  it('reports idle only after sixty seconds without transcript activity', () => {
    let now = 60_000;
    const registry = new SessionRegistry(() => now);
    registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', 0));

    expect(registry.getSession('s1')?.status).toBe('active');
    now = 60_001;
    expect(registry.getSession('s1')?.status).toBe('idle');
  });

  it('marks a path ended and removes its retained context', () => {
    const registry = new SessionRegistry(() => 10_000);
    registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', 9_000));

    registry.markEndedByPath('/transcripts/one.jsonl');

    expect(registry.getSession('s1')?.status).toBe('ended');
    expect(registry.getRecent('s1')).toEqual([]);
  });

  it('clears every in-memory session and context', () => {
    const registry = new SessionRegistry();
    registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', 1));
    registry.clear();

    expect(registry.snapshot(true, false)).toEqual({
      paused: true,
      claudeProcessPresent: false,
      sessions: [],
    });
  });
});
