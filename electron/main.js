// electron/main.js
// AUTHORITATIVE ELECTRON BOOTSTRAP

import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ---- MUST RUN FIRST ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Load environment BEFORE any engine import
dotenv.config({ path: path.join(PROJECT_ROOT, ".env") });

// Fail fast (institutional rule)
if (!process.env.POLYGON_API_KEY) {
  throw new Error("FATAL: POLYGON_API_KEY missing at Electron boot");
}

// ---- SAFE TO IMPORT ENGINE NOW ----
import { registerPortfolioIpc } from "./ipc/portfolioIpc.js";
import { registerDashboardIpc } from "./ipc/dashboardIpc.js";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  registerPortfolioIpc();
  registerDashboardIpc();
  createWindow();
});

