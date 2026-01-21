// main.js — JUPITER (Canonical Electron Bootstrap)
// -----------------------------------------------
// Restores Electron lifecycle, preload bridge, and IPC authority.
// NO business logic. NO engine logic. NO UI logic.

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// IPC registry (authoritative)
import { registerAllIpc } from "./electron/ipc/registerIpc.js";

// 🔵 LIVE RUNTIME (Electron-owned)
import { startLiveRuntime } from "./engine/runtime/liveRuntime.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "renderer/index.html"));
  }
}

app.whenReady().then(() => {
  // Register ALL IPC surfaces (Discovery, Portfolio, Chat, etc.)
  registerAllIpc(ipcMain);

  // 🔵 Initialize live runtime ONCE (no scanners yet)
  startLiveRuntime();

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
