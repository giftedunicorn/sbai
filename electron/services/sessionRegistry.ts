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

function sessionLabel(targetId: string): string {
  const number = targetId.replace(/^agent-/, '');
  return `Claude #${number}`;
}

export class SessionRegistry {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly targetIdByIdentity = new Map<string, string>();
  private readonly activeTargetIdByPath = new Map<string, string>();
  private nextTargetNumber = 1;

  constructor(private readonly now: () => number = Date.now) {}

  ingest(path: string, record: NormalizedTranscriptRecord): string {
    const identity = `${path}\0${record.sessionId}`;
    let targetId = this.targetIdByIdentity.get(identity);
    if (!targetId) {
      targetId = `agent-${this.nextTargetNumber}`;
      this.nextTargetNumber += 1;
      this.targetIdByIdentity.set(identity, targetId);
    }

    const previousTargetForPath = this.activeTargetIdByPath.get(path);
    if (previousTargetForPath && previousTargetForPath !== targetId) {
      this.endEntry(previousTargetForPath);
    }

    let entry = this.sessions.get(targetId);
    if (!entry) {
      entry = {
        path,
        id: targetId,
        label: sessionLabel(targetId),
        projectLabel: projectLabel(record.cwd),
        lastActivityAt: record.timestamp,
        ended: false,
        recent: [],
      };
      this.sessions.set(targetId, entry);
    } else {
      if (entry.path !== path) this.activeTargetIdByPath.delete(entry.path);
      entry.path = path;
      entry.projectLabel = projectLabel(record.cwd);
      entry.lastActivityAt = Math.max(entry.lastActivityAt, record.timestamp);
      entry.ended = false;
    }

    entry.recent.push(record);
    if (entry.recent.length > MAX_RECENT_RECORDS) {
      entry.recent.splice(0, entry.recent.length - MAX_RECENT_RECORDS);
    }
    this.activeTargetIdByPath.set(path, targetId);
    return targetId;
  }

  getRecent(sessionId: string): readonly NormalizedTranscriptRecord[] {
    return [...(this.sessions.get(sessionId)?.recent ?? [])];
  }

  getSession(sessionId: string): SessionSummary | undefined {
    const entry = this.sessions.get(sessionId);
    return entry ? this.toSummary(entry) : undefined;
  }

  snapshot(
    paused: boolean,
    processPresent: boolean,
    muted = false,
  ): CompanionSnapshot {
    return {
      paused,
      muted,
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
    const targetId = this.activeTargetIdByPath.get(path);
    if (targetId) this.endEntry(targetId);
  }

  clear(): void {
    this.sessions.clear();
    this.targetIdByIdentity.clear();
    this.activeTargetIdByPath.clear();
    this.nextTargetNumber = 1;
  }

  private endEntry(targetId: string): void {
    const entry = this.sessions.get(targetId);
    if (!entry) return;
    entry.ended = true;
    entry.recent = [];
    this.activeTargetIdByPath.delete(entry.path);
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
