import { contextBridge, ipcRenderer } from 'electron';

import {
  IPC,
  isCatharsisEvent,
  isCompanionSnapshot,
  type CatharsisEvent,
  type CompanionBridge,
  type CompanionSnapshot,
} from '../src/shared/companion.js';

const bridge: CompanionBridge = {
  platform: process.platform,
  onSnapshot(listener: (snapshot: CompanionSnapshot) => void) {
    const handler = (_event: Electron.IpcRendererEvent, value: unknown) => {
      if (isCompanionSnapshot(value)) listener(value);
    };
    ipcRenderer.on(IPC.snapshot, handler);
    return () => ipcRenderer.removeListener(IPC.snapshot, handler);
  },
  onCatharsis(listener: (event: CatharsisEvent) => void) {
    const handler = (_event: Electron.IpcRendererEvent, value: unknown) => {
      if (isCatharsisEvent(value)) listener(value);
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
