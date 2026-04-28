import { app, BrowserWindow, ipcMain, Notification } from "electron";
import { startBackgroundMonitorDaemon } from "./daemon/backgroundMonitorDaemon.js";
import path from "path";
import "dotenv/config";

import { valuePortfolio } from "../engine/portfolio/portfolioValuation.js";
import { registerAllIpc } from "./ipc/registerIpc.js";
import { registerPortfolioHandlers } from "./ipc/registerIpc.js";
import { registerMoonshotHandlers } from "./ipc/registerIpc.js";
import { registerDaemonHandlers } from "./ipc/registerIpc.js";
import { registerCalculatorHandlers } from "./ipc/registerIpc.js";
import { registerOptimizerHandlers, registerRebalanceHandlers, registerThesisTrackerHandlers } from "./ipc/registerIpc.js";

// =====================================================
// MOONSHOT — ASYMMETRY SCHEDULER (AUTHORITATIVE)
// =====================================================
import { startScheduler as startAsymmetryScheduler } from "../engine/asymmetry/universeScheduler.js";

let mainWindow;

// -----------------------------------------------------
// PORTFOLIO BOOTSTRAP (AUTHORITATIVE)
// -----------------------------------------------------
const HOLDINGS = [
  { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13, currency: "CAD" },
  { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52, currency: "CAD" },
  { symbol: "AVGO", qty: 74, assetClass: "equity", totalCostBasis: 26190.68, currency: "CAD" },
  { symbol: "MSTR", qty: 24, assetClass: "equity", totalCostBasis: 12496.18, currency: "CAD" },
  { symbol: "HOOD", qty: 70, assetClass: "equity", totalCostBasis: 3316.68, currency: "CAD" },
  { symbol: "BMNR", qty: 115, assetClass: "equity", totalCostBasis: 6320.18, currency: "CAD" },
  { symbol: "APLD", qty: 150, assetClass: "equity", totalCostBasis: 1615.58, currency: "CAD" },
  { symbol: "BTC", qty: 0.251083, assetClass: "crypto", totalCostBasis: 24764.31, currency: "CAD" },
  { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.9, currency: "CAD" }
];

let cachedValuation = null;

async function computeAndCache() {
  cachedValuation = await valuePortfolio(HOLDINGS);
  cachedValuation._asOf = Date.now();
  console.log("[PORTFOLIO CACHED]", JSON.stringify(cachedValuation, null, 2));
  return cachedValuation;
}

// -----------------------------------------------------
// WINDOW
// -----------------------------------------------------
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

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(require("path").join(__dirname, "../renderer/dist/index.html"));
  }
}

// -----------------------------------------------------
// BOOT SEQUENCE (DETERMINISTIC)
// -----------------------------------------------------
let runtimeStarted = false;
let asymmetryStarted = false;

function startAsymmetryOnce() {
  if (asymmetryStarted) return;
  asymmetryStarted = true;

  console.log("[ASYMMETRY] UniverseScheduler started (telemetry live)");
  startAsymmetryScheduler();
}

app.whenReady().then(async () => {
  registerAllIpc(ipcMain);           // IPC FIRST (required)
registerMoonshotHandlers(ipcMain);
registerDaemonHandlers(ipcMain);
registerCalculatorHandlers(ipcMain);
  registerOptimizerHandlers(ipcMain);
  registerRebalanceHandlers(ipcMain);
  registerThesisTrackerHandlers(ipcMain);
registerPortfolioHandlers(ipcMain);
  await computeAndCache();           // Portfolio cache
  createWindow();                    // UI
  startAsymmetryOnce();              // 🔥 AUTONOMOUS SCANS + TELEMETRY

  // Start background monitor daemon — broadcasts position alerts to renderer
  startBackgroundMonitorDaemon((payload) => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      const alerts = payload?.alerts || [];
      alerts.forEach(alert => {
        mainWindow.webContents.send('jupiter:alert', alert);
        // Native macOS notification — fires even if app is minimized
        if (Notification.isSupported()) {
          new Notification({
            title: `JUPITER — ${alert.type === 'ENTRY_OPPORTUNITY' ? '🟢 Entry Signal' : '🔴 Position Alert'}`,
            body: alert.message,
            silent: false,
          }).show();
        }
      });
    } catch (err) {
      console.error('[Main] Alert broadcast failed:', err.message);
    }
  });
});

