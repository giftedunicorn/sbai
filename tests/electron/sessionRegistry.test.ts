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
  it('isolates identical transcript session ids by stream path', () => {
    const registry = new SessionRegistry(() => 10_000);
    registry.ingest('/transcripts/one.jsonl', ownerRecord('same-id', 9_000, 'one'));
    registry.ingest('/transcripts/two.jsonl', ownerRecord('same-id', 9_500, 'two'));

    const sessions = registry.snapshot(false, false).sessions;
    expect(sessions).toHaveLength(2);
    expect(new Set(sessions.map((session) => session.id)).size).toBe(2);
    expect(registry.getRecent(sessions[0].id)).toHaveLength(1);
    expect(registry.getRecent(sessions[1].id)).toHaveLength(1);
  });

  it('keeps same-project transcript sessions separate with fallback labels', () => {
    const registry = new SessionRegistry(() => 10_000);
    const firstId = registry.ingest(
      '/transcripts/one.jsonl',
      ownerRecord('session-one', 9_000),
    );
    const secondId = registry.ingest(
      '/transcripts/two.jsonl',
      ownerRecord('session-two', 9_500),
    );

    expect(registry.getSession(firstId)).toMatchObject({
      id: firstId,
      label: 'Claude session-',
      projectLabel: 'same-project',
      status: 'active',
    });
    expect(registry.snapshot(false, true).sessions.map((session) => session.id)).toEqual([
      secondId,
      firstId,
    ]);
  });

  it('retains at most the 50 most recent records', () => {
    const registry = new SessionRegistry(() => 100);
    let targetId = '';
    for (let index = 0; index < 55; index += 1) {
      targetId = registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', index));
    }

    const recent = registry.getRecent(targetId);
    expect(recent).toHaveLength(50);
    expect(recent[0]).toMatchObject({ timestamp: 5 });
    expect(recent[49]).toMatchObject({ timestamp: 54 });
  });

  it('reports idle only after sixty seconds without transcript activity', () => {
    let now = 60_000;
    const registry = new SessionRegistry(() => now);
    const targetId = registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', 0));

    expect(registry.getSession(targetId)?.status).toBe('active');
    now = 60_001;
    expect(registry.getSession(targetId)?.status).toBe('idle');
  });

  it('marks a path ended and removes its retained context', () => {
    const registry = new SessionRegistry(() => 10_000);
    const targetId = registry.ingest(
      '/transcripts/one.jsonl',
      ownerRecord('s1', 9_000),
    );

    registry.markEndedByPath('/transcripts/one.jsonl');

    expect(registry.getSession(targetId)?.status).toBe('ended');
    expect(registry.getRecent(targetId)).toEqual([]);
  });

  it('clears every in-memory session and context', () => {
    const registry = new SessionRegistry();
    registry.ingest('/transcripts/one.jsonl', ownerRecord('s1', 1));
    registry.clear();

    expect(registry.snapshot(true, false)).toEqual({
      paused: true,
      muted: false,
      claudeProcessPresent: false,
      sessions: [],
    });
  });
});
