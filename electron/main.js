// electron/main.js — JUPITER
// Canonical Electron entrypoint (LOCKED BASELINE + MUTATION LAYER)

import electron from "electron";
import path from "path";
import "dotenv/config";

import { registerAllIpc } from "./ipc/registerIpc.js";
import { registerPortfolioMutationIpc } from "./ipc/portfolioMutationIpc.js";

const { app, BrowserWindow, ipcMain } = electron;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(process.cwd(), "electron/preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
}

app.whenReady().then(() => {
  // READ-ONLY SNAPSHOT AUTHORITY (unchanged)
  registerAllIpc(ipcMain);

  // WRITE-ONLY MUTATION LAYER (NO SNAPSHOT OWNERSHIP)
  registerPortfolioMutationIpc(ipcMain);

  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
