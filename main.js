// main.js — JUPITER Electron main process
// Append-only: includes Decisions IPC registration

import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path';
import { registerAllIpc } from './electron/ipc/registerIpc.js';
import { registerDecisionsIpc } from './engine/ipc/registerDecisionsIpc.js';
import { startLiveRuntime } from './engine/runtime/liveRuntime.js';

let mainWindow;

// ── JUPITER DMG patch: path resolver for packaged app ──────────────────────

// ───────────────────────────────────────────────────────────────────────────


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'electron/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  
  // Register all canonical IPC
  registerAllIpc(ipcMain);

  // 🔵 Append-only: register Decisions IPC handler
  registerDecisionsIpc();

  // Initialize live runtime
  startLiveRuntime();

  // Launch renderer window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
