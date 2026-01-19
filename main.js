// main.js — JUPITER (Canonical Electron Bootstrap)
// -----------------------------------------------
// Restores Electron lifecycle, preload bridge, IPC authority,
// and activates autonomous runtime (Discovery-only, V1).
// NO UI logic. NO renderer logic. NO business logic.

import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// IPC registry (authoritative)
import { registerAllIpc } from "./electron/ipc/registerIpc.js";

// Autonomy runtime (Discovery-only)
import { startRuntimeLoop } from "./engine/runtime/runtimeLoop.js";
import { TASKS } from "./engine/runtime/taskRegistry.js";

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

  // 🔒 AUTONOMY V1 ACTIVATION — DISCOVERY ONLY
  const discoveryTask = TASKS.filter((t) => t.key === "discovery");
  startRuntimeLoop(discoveryTask);

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

