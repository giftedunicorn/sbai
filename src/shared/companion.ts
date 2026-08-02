export type SessionStatus =
  | 'active'
  | 'idle'
  | 'ended'
  | 'content-unavailable';

export type AgentSource = 'claude-code' | 'codex';

export type AngerIntensity = 'annoyed' | 'angry' | 'furious';
export type TriggerKind = 'owner-anger' | 'manual';
export type AttackAnimation = 'poke' | 'slap-combo' | 'token-explosion';

export type EvidenceKind = 'tool-failure' | 'test-failure' | 'file-edit';

export interface Evidence {
  kind: EvidenceKind;
  value: string;
  confidence: 'observed';
}

export interface SessionSummary {
  id: string;
  label: string;
  projectLabel: string;
  status: SessionStatus;
  lastActivityAt: number;
}

export interface AgentProcessPresence {
  claudeCode: boolean;
  codex: boolean;
}

export interface CompanionSnapshot {
  paused: boolean;
  muted: boolean;
  processPresence: AgentProcessPresence;
  sessions: SessionSummary[];
}

export interface CatharsisEvent {
  sessionId: string;
  trigger: TriggerKind;
  intensity: AngerIntensity;
  evidence: Evidence[];
  roast: string;
  copyText?: string;
  animation: AttackAnimation;
}

export interface CompanionBridge {
  platform: string;
  onSnapshot(listener: (snapshot: CompanionSnapshot) => void): () => void;
  onCatharsis(listener: (event: CatharsisEvent) => void): () => void;
  manualRoast(sessionId: string): void;
  copyText(text: string): void;
  setPaused(paused: boolean): void;
  setMuted(muted: boolean): void;
  stopAnimation(): void;
  approveRoot(source: AgentSource): Promise<boolean>;
}

export const IPC = {
  snapshot: 'companion:snapshot',
  catharsis: 'companion:catharsis',
  manualRoast: 'companion:manual-roast',
  copyText: 'companion:copy-text',
  setPaused: 'companion:set-paused',
  setMuted: 'companion:set-muted',
  stopAnimation: 'companion:stop-animation',
  approveRoot: 'companion:approve-root',
} as const;

const SESSION_STATUSES = new Set<SessionStatus>([
  'active',
  'idle',
  'ended',
  'content-unavailable',
]);
const INTENSITIES = new Set<AngerIntensity>(['annoyed', 'angry', 'furious']);
const TRIGGERS = new Set<TriggerKind>(['owner-anger', 'manual']);
const ANIMATIONS = new Set<AttackAnimation>([
  'poke',
  'slap-combo',
  'token-explosion',
]);
const EVIDENCE_KINDS = new Set<EvidenceKind>([
  'tool-failure',
  'test-failure',
  'file-edit',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEvidence(value: unknown): value is Evidence {
  return (
    isRecord(value) &&
    EVIDENCE_KINDS.has(value.kind as EvidenceKind) &&
    isNonEmptyString(value.value) &&
    value.confidence === 'observed'
  );
}

function isSessionSummary(value: unknown): value is SessionSummary {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.label) &&
    isNonEmptyString(value.projectLabel) &&
    SESSION_STATUSES.has(value.status as SessionStatus) &&
    typeof value.lastActivityAt === 'number' &&
    Number.isFinite(value.lastActivityAt)
  );
}

export function isCompanionSnapshot(value: unknown): value is CompanionSnapshot {
  return (
    isRecord(value) &&
    typeof value.paused === 'boolean' &&
    typeof value.muted === 'boolean' &&
    isRecord(value.processPresence) &&
    typeof value.processPresence.claudeCode === 'boolean' &&
    typeof value.processPresence.codex === 'boolean' &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isSessionSummary)
  );
}

export function isCatharsisEvent(value: unknown): value is CatharsisEvent {
  return (
    isRecord(value) &&
    isNonEmptyString(value.sessionId) &&
    TRIGGERS.has(value.trigger as TriggerKind) &&
    INTENSITIES.has(value.intensity as AngerIntensity) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidence) &&
    isNonEmptyString(value.roast) &&
    (value.copyText === undefined || typeof value.copyText === 'string') &&
    ANIMATIONS.has(value.animation as AttackAnimation)
  );
}
