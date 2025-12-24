import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import "dotenv/config";

import { valuePortfolio } from "../engine/portfolio/portfolioValuation.js";

let mainWindow;

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
  console.log("[AUTHORITATIVE PORTFOLIO CACHED]", JSON.stringify(cachedValuation, null, 2));
  return cachedValuation;
}

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

app.whenReady().then(async () => {
  await computeAndCache();
  createWindow();
});

ipcMain.handle("portfolio:getValuation", async () => {
  if (!cachedValuation) await computeAndCache();
  return cachedValuation; // NO REFRESH (deterministic)
});

ipcMain.handle("portfolio:refreshValuation", async () => {
  return await computeAndCache(); // explicit refresh only
});

