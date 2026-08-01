import { basename } from 'node:path';

import type {
  CompanionSnapshot,
  SessionStatus,
  SessionSummary,
} from '../../src/shared/companion.js';
import type { NormalizedTranscriptRecord } from './transcriptParser.js';

interface SessionEntry {
  path: string;
  id: string;
  label: string;
  projectLabel: string;
  lastActivityAt: number;
  ended: boolean;
  recent: NormalizedTranscriptRecord[];
}

const MAX_RECENT_RECORDS = 50;
const IDLE_AFTER_MS = 60_000;

function projectLabel(cwd: string): string {
  return basename(cwd) || cwd || 'Unknown project';
}

function sessionLabel(sessionId: string): string {
  const shortId = sessionId.slice(0, 8).trim();
  return shortId ? `Claude ${shortId}` : 'Claude Agent';
}

export class SessionRegistry {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly sessionIdByPath = new Map<string, string>();

  constructor(private readonly now: () => number = Date.now) {}

  ingest(path: string, record: NormalizedTranscriptRecord): void {
    const previousIdForPath = this.sessionIdByPath.get(path);
    if (previousIdForPath && previousIdForPath !== record.sessionId) {
      this.endEntry(previousIdForPath);
    }

    let entry = this.sessions.get(record.sessionId);
    if (!entry) {
      entry = {
        path,
        id: record.sessionId,
        label: sessionLabel(record.sessionId),
        projectLabel: projectLabel(record.cwd),
        lastActivityAt: record.timestamp,
        ended: false,
        recent: [],
      };
      this.sessions.set(record.sessionId, entry);
    } else {
      if (entry.path !== path) this.sessionIdByPath.delete(entry.path);
      entry.path = path;
      entry.projectLabel = projectLabel(record.cwd);
      entry.lastActivityAt = Math.max(entry.lastActivityAt, record.timestamp);
      entry.ended = false;
    }

    entry.recent.push(record);
    if (entry.recent.length > MAX_RECENT_RECORDS) {
      entry.recent.splice(0, entry.recent.length - MAX_RECENT_RECORDS);
    }
    this.sessionIdByPath.set(path, record.sessionId);
  }

  getRecent(sessionId: string): readonly NormalizedTranscriptRecord[] {
    return [...(this.sessions.get(sessionId)?.recent ?? [])];
  }

  getSession(sessionId: string): SessionSummary | undefined {
    const entry = this.sessions.get(sessionId);
    return entry ? this.toSummary(entry) : undefined;
  }

  snapshot(paused: boolean, processPresent: boolean): CompanionSnapshot {
    return {
      paused,
      claudeProcessPresent: processPresent,
      sessions: [...this.sessions.values()]
        .map((entry) => this.toSummary(entry))
        .sort(
          (left, right) =>
            right.lastActivityAt - left.lastActivityAt || left.id.localeCompare(right.id),
        ),
    };
  }

  markEndedByPath(path: string): void {
    const sessionId = this.sessionIdByPath.get(path);
    if (sessionId) this.endEntry(sessionId);
  }

  clear(): void {
    this.sessions.clear();
    this.sessionIdByPath.clear();
  }

  private endEntry(sessionId: string): void {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;
    entry.ended = true;
    entry.recent = [];
    this.sessionIdByPath.delete(entry.path);
  }

  private toSummary(entry: SessionEntry): SessionSummary {
    let status: SessionStatus;
    if (entry.ended) {
      status = 'ended';
    } else if (this.now() - entry.lastActivityAt > IDLE_AFTER_MS) {
      status = 'idle';
    } else {
      status = 'active';
    }

    return {
      id: entry.id,
      label: entry.label,
      projectLabel: entry.projectLabel,
      status,
      lastActivityAt: entry.lastActivityAt,
    };
  }
}
