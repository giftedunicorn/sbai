import { contextBridge, ipcRenderer } from 'electron';

import type {
  CatharsisEvent,
  CompanionBridge,
  CompanionSnapshot,
  Evidence,
  SessionSummary,
} from '../src/shared/companion.js';

const IPC = {
  snapshot: 'companion:snapshot',
  catharsis: 'companion:catharsis',
  manualRoast: 'companion:manual-roast',
  copyText: 'companion:copy-text',
  setPaused: 'companion:set-paused',
  setMuted: 'companion:set-muted',
  stopAnimation: 'companion:stop-animation',
  approveRoot: 'companion:approve-root',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEvidence(value: unknown): value is Evidence {
  return (
    isRecord(value) &&
    ['tool-failure', 'test-failure', 'file-edit'].includes(String(value.kind)) &&
    isText(value.value) &&
    value.confidence === 'observed'
  );
}

function isSession(value: unknown): value is SessionSummary {
  return (
    isRecord(value) &&
    isText(value.id) &&
    isText(value.label) &&
    isText(value.projectLabel) &&
    ['active', 'idle', 'ended', 'content-unavailable'].includes(String(value.status)) &&
    typeof value.lastActivityAt === 'number' &&
    Number.isFinite(value.lastActivityAt)
  );
}

function isSnapshot(value: unknown): value is CompanionSnapshot {
  return (
    isRecord(value) &&
    typeof value.paused === 'boolean' &&
    typeof value.muted === 'boolean' &&
    typeof value.claudeProcessPresent === 'boolean' &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isSession)
  );
}

function isCatharsis(value: unknown): value is CatharsisEvent {
  return (
    isRecord(value) &&
    isText(value.sessionId) &&
    ['owner-anger', 'manual'].includes(String(value.trigger)) &&
    ['annoyed', 'angry', 'furious'].includes(String(value.intensity)) &&
    Array.isArray(value.evidence) &&
    value.evidence.every(isEvidence) &&
    isText(value.roast) &&
    (value.copyText === undefined || typeof value.copyText === 'string') &&
    ['poke', 'slap-combo', 'token-explosion'].includes(String(value.animation))
  );
}

const bridge: CompanionBridge = {
  platform: process.platform,
  onSnapshot(listener: (snapshot: CompanionSnapshot) => void) {
    const handler = (_event: Electron.IpcRendererEvent, value: unknown) => {
      if (isSnapshot(value)) listener(value);
    };
    ipcRenderer.on(IPC.snapshot, handler);
    return () => ipcRenderer.removeListener(IPC.snapshot, handler);
  },
  onCatharsis(listener: (event: CatharsisEvent) => void) {
    const handler = (_event: Electron.IpcRendererEvent, value: unknown) => {
      if (isCatharsis(value)) listener(value);
    };
    ipcRenderer.on(IPC.catharsis, handler);
    return () => ipcRenderer.removeListener(IPC.catharsis, handler);
  },
  manualRoast(sessionId: string) {
    ipcRenderer.send(IPC.manualRoast, sessionId);
  },
  copyText(text: string) {
    ipcRenderer.send(IPC.copyText, text);
  },
  setPaused(paused: boolean) {
    ipcRenderer.send(IPC.setPaused, paused);
  },
  setMuted(muted: boolean) {
    ipcRenderer.send(IPC.setMuted, muted);
  },
  stopAnimation() {
    ipcRenderer.send(IPC.stopAnimation);
  },
  approveRoot() {
    return ipcRenderer.invoke(IPC.approveRoot) as Promise<boolean>;
  },
};

contextBridge.exposeInMainWorld('companion', Object.freeze(bridge));
