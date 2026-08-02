import { basename } from 'node:path';

import type {
  AgentSource,
  AgentProcessPresence,
  CompanionSnapshot,
  SessionStatus,
  SessionSummary,
} from '../../src/shared/companion.js';
import type { NormalizedTranscriptRecord } from './transcriptParser.js';

interface SessionEntry {
  source: AgentSource;
  streamKey: string;
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

function sessionLabel(targetId: string, source: AgentSource): string {
  const number = targetId.replace(/^agent-/, '');
  return `${source === 'codex' ? 'Codex' : 'Claude'} #${number}`;
}

function streamKey(source: AgentSource, path: string): string {
  return `${source}\0${path}`;
}

export class SessionRegistry {
  private readonly sessions = new Map<string, SessionEntry>();
  private readonly targetIdByIdentity = new Map<string, string>();
  private readonly activeTargetIdByPath = new Map<string, string>();
  private nextTargetNumber = 1;

  constructor(private readonly now: () => number = Date.now) {}

  ingest(path: string, record: NormalizedTranscriptRecord): string;
  ingest(
    path: string,
    source: AgentSource,
    record: NormalizedTranscriptRecord,
  ): string;
  ingest(
    path: string,
    sourceOrRecord: AgentSource | NormalizedTranscriptRecord,
    possibleRecord?: NormalizedTranscriptRecord,
  ): string {
    const source: AgentSource =
      typeof sourceOrRecord === 'string' ? sourceOrRecord : 'claude-code';
    const record =
      typeof sourceOrRecord === 'string' ? possibleRecord! : sourceOrRecord;
    const currentStreamKey = streamKey(source, path);
    const identity = `${currentStreamKey}\0${record.sessionId}`;
    let targetId = this.targetIdByIdentity.get(identity);
    if (!targetId) {
      targetId = `agent-${this.nextTargetNumber}`;
      this.nextTargetNumber += 1;
      this.targetIdByIdentity.set(identity, targetId);
    }

    const previousTargetForPath = this.activeTargetIdByPath.get(currentStreamKey);
    if (previousTargetForPath && previousTargetForPath !== targetId) {
      this.endEntry(previousTargetForPath);
    }

    let entry = this.sessions.get(targetId);
    if (!entry) {
      entry = {
        source,
        streamKey: currentStreamKey,
        path,
        id: targetId,
        label: sessionLabel(targetId, source),
        projectLabel: projectLabel(record.cwd),
        lastActivityAt: record.timestamp,
        ended: false,
        recent: [],
      };
      this.sessions.set(targetId, entry);
    } else {
      if (entry.streamKey !== currentStreamKey) {
        this.activeTargetIdByPath.delete(entry.streamKey);
      }
      entry.streamKey = currentStreamKey;
      entry.path = path;
      entry.projectLabel = projectLabel(record.cwd);
      entry.lastActivityAt = Math.max(entry.lastActivityAt, record.timestamp);
      entry.ended = false;
    }

    entry.recent.push(record);
    if (entry.recent.length > MAX_RECENT_RECORDS) {
      entry.recent.splice(0, entry.recent.length - MAX_RECENT_RECORDS);
    }
    this.activeTargetIdByPath.set(currentStreamKey, targetId);
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
    processPresent: boolean | AgentProcessPresence,
    muted = false,
  ): CompanionSnapshot {
    return {
      paused,
      muted,
      processPresence:
        typeof processPresent === 'boolean'
          ? { claudeCode: processPresent, codex: false }
          : processPresent,
      sessions: [...this.sessions.values()]
        .map((entry) => this.toSummary(entry))
        .sort(
          (left, right) =>
            right.lastActivityAt - left.lastActivityAt || left.id.localeCompare(right.id),
        ),
    };
  }

  markEndedByPath(path: string, source?: AgentSource): void {
    if (source) {
      const targetId = this.activeTargetIdByPath.get(streamKey(source, path));
      if (targetId) this.endEntry(targetId);
      return;
    }
    for (const candidateSource of ['claude-code', 'codex'] as const) {
      const targetId = this.activeTargetIdByPath.get(streamKey(candidateSource, path));
      if (targetId) this.endEntry(targetId);
    }
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
    this.activeTargetIdByPath.delete(entry.streamKey);
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
