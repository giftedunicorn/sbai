import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

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
      preload: path.join(moduleDir, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  });

  void window.loadFile(path.join(moduleDir, '../../dist/index.html'));
  return window;
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
