/**
 * Portfolio IPC — Mutation Layer V1
 * --------------------------------
 * Engine-first, disk-backed, deterministic.
 *
 * RULES:
 * - Engine owns all mutation
 * - IPC performs validation + delegation
 * - No pricing, no analytics
 */

import electronPkg from "electron";
import path from "path";
import { fileURLToPath } from "url";

/* =========================
   ELECTRON (CJS SAFE)
   ========================= */

const { ipcMain } = electronPkg;

/* =========================
   RESOLVE ENGINE PATH SAFELY
   ========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portfolioEngine = await import(
  path.resolve(__dirname, "../../engine/portfolio/portfolioEngine.js")
);

const {
  getPortfolioSnapshot,
  addHolding,
  updateHolding,
  removeHolding
} = portfolioEngine;

/* =========================
   IPC REGISTRATION
   ========================= */

export function registerPortfolioIpc() {
  // READ
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return getPortfolioSnapshot();
  });

  // MUTATIONS
  ipcMain.handle("portfolio:add", async (_e, { symbol, qty }) => {
    return addHolding(symbol, qty);
  });

  ipcMain.handle("portfolio:update", async (_e, { symbol, qty }) => {
    return updateHolding(symbol, qty);
  });

  ipcMain.handle("portfolio:remove", async (_e, { symbol }) => {
    return removeHolding(symbol);
  });

  console.log("[IPC] Portfolio mutation layer V1 registered");
}
