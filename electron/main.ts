import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent,
} from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import {
  IPC,
  type AgentSource,
  type CompanionSnapshot,
} from '../src/shared/companion.js';
import { CompanionRuntime } from './services/companionRuntime.js';
import { getAgentProcessPresence } from './services/processWatcher.js';
import {
  SettingsStore,
  type CompanionSettings,
} from './services/settingsStore.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const rendererPath = path.join(moduleDir, '../../dist/index.html');
const trustedRendererUrl = pathToFileURL(rendererPath).href;
let mainWindow: BrowserWindow | null = null;
let runtime: CompanionRuntime | null = null;
let settingsStore: SettingsStore | null = null;
let settings: CompanionSettings | null = null;
let latestSnapshot: CompanionSnapshot | null = null;
let settingsWrite = Promise.resolve();

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 420,
    height: 560,
    minWidth: 420,
    minHeight: 560,
    maxWidth: 420,
    maxHeight: 560,
    frame: false,
    resizable: false,
    backgroundColor: '#f4e7bd',
    webPreferences: {
      preload: path.join(moduleDir, 'preload.cjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  window.webContents.on('did-finish-load', () => {
    if (latestSnapshot) window.webContents.send(IPC.snapshot, latestSnapshot);
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== trustedRendererUrl) event.preventDefault();
  });
  window.webContents.on('will-redirect', (event, url) => {
    if (url !== trustedRendererUrl) event.preventDefault();
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  void window.loadFile(rendererPath);
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null;
  });
  return window;
}

function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return Boolean(
    mainWindow &&
      !mainWindow.isDestroyed() &&
      event.sender === mainWindow.webContents &&
      event.senderFrame === mainWindow.webContents.mainFrame &&
      event.senderFrame.url === trustedRendererUrl,
  );
}

function sendToRenderer(channel: string, value: unknown): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, value);
}

function persistSettings(): void {
  if (!settingsStore || !settings) return;
  const snapshot = { ...settings };
  settingsWrite = settingsWrite
    .then(() => settingsStore?.save(snapshot))
    .catch(() => undefined);
}

function registerIpc(): void {
  ipcMain.on(IPC.manualRoast, (event, sessionId: unknown) => {
    if (!isTrustedSender(event) || typeof sessionId !== 'string' || sessionId.length > 200) {
      return;
    }
    void runtime?.manualRoast(sessionId);
  });

  ipcMain.on(IPC.copyText, (event, text: unknown) => {
    if (!isTrustedSender(event) || typeof text !== 'string' || text.length > 10_000) return;
    clipboard.writeText(text);
  });

  ipcMain.on(IPC.setPaused, (event, paused: unknown) => {
    if (!isTrustedSender(event) || typeof paused !== 'boolean' || !settings) return;
    settings.paused = paused;
    runtime?.setPaused(paused);
    persistSettings();
  });

  ipcMain.on(IPC.setMuted, (event, muted: unknown) => {
    if (!isTrustedSender(event) || typeof muted !== 'boolean' || !settings) return;
    settings.muted = muted;
    runtime?.setMuted(muted);
    mainWindow?.webContents.setAudioMuted(muted);
    persistSettings();
  });

  ipcMain.on(IPC.stopAnimation, (event) => {
    if (!isTrustedSender(event)) return;
    // Animation state lives only in the renderer; this named signal has no task-side effect.
  });

  ipcMain.handle(IPC.approveRoot, async (event, source: unknown) => {
    if (!isTrustedSender(event) || !mainWindow || !settings) return false;
    if (source !== 'claude-code' && source !== 'codex') return false;
    const approvedSource: AgentSource = source;
    const selection = await dialog.showOpenDialog(mainWindow, {
      title:
        approvedSource === 'codex'
          ? '选择 Codex sessions 根目录'
          : '选择 Claude Code transcripts 根目录',
      properties: ['openDirectory'],
    });
    const approvedRoot = selection.filePaths[0];
    if (selection.canceled || !approvedRoot) return false;

    if (approvedSource === 'codex') settings.approvedCodexRoot = approvedRoot;
    else settings.approvedClaudeRoot = approvedRoot;
    persistSettings();
    await runtime?.setRoot(approvedSource, approvedRoot);
    return true;
  });
}

async function initialize(): Promise<void> {
  mainWindow = createWindow();
  settingsStore = new SettingsStore(app.getPath('userData'));
  settings = await settingsStore.load();
  runtime = new CompanionRuntime({
    processPresent: getAgentProcessPresence,
    onSnapshot(snapshot) {
      latestSnapshot = snapshot;
      sendToRenderer(IPC.snapshot, snapshot);
    },
    onCatharsis(event) {
      sendToRenderer(IPC.catharsis, event);
    },
  });
  runtime.setPaused(settings.paused);
  runtime.setMuted(settings.muted);
  mainWindow.webContents.setAudioMuted(settings.muted);
  registerIpc();

  await runtime.start({
    'claude-code': settings.approvedClaudeRoot,
    codex: settings.approvedCodexRoot,
  });
}

void app.whenReady().then(initialize);
app.on('before-quit', () => runtime?.stop());
app.on('window-all-closed', () => app.quit());
