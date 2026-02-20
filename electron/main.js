import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import "dotenv/config";

import { valuePortfolio } from "../engine/portfolio/portfolioValuation.js";
import { registerAllIpc } from "./ipc/registerIpc.js";

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
  await computeAndCache();           // Portfolio cache
  createWindow();                    // UI
  startAsymmetryOnce();              // 🔥 AUTONOMOUS SCANS + TELEMETRY
});

