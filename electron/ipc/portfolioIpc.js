/**
 * Portfolio IPC — Mutation Layer V1 (CANONICAL)
 * ---------------------------------------------
 * Engine-first, disk-backed, deterministic.
 *
 * FIX (authoritative):
 * - Channel names are: portfolio:add | portfolio:update | portfolio:remove
 * - Payloads are delegated EXACTLY to engine contract:
 *     addHolding({ symbol, qty, cost })
 *     updateHolding({ symbol, qtyDelta })
 *     removeHolding({ symbol })
 * - Safe re-registration: removeHandler first to prevent duplicates
 */

import electronPkg from "electron";
import path from "path";
import { fileURLToPath } from "url";

const { ipcMain } = electronPkg;

/* =========================
   RESOLVE ENGINE PATH SAFELY
   ========================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portfolioEngine = await import(
  path.resolve(__dirname, "../../engine/portfolio/portfolioEngine.js")
);

// portfolioEngine is CommonJS default export object
const engine = portfolioEngine?.default || portfolioEngine;

const {
  getPortfolioSnapshot,
  addHolding,
  updateHolding,
  removeHolding
} = engine;

/* =========================
   SAFE HANDLER REGISTRATION
   ========================= */
function safeHandle(channel, fn) {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, fn);
}

/* =========================
   IPC REGISTRATION
   ========================= */
export function registerPortfolioIpc() {
  // READ (engine snapshot)
  safeHandle("portfolio:getSnapshot", async () => {
    return getPortfolioSnapshot();
  });

  // MUTATIONS — aligned to engine contract
  safeHandle("portfolio:add", async (_e, payload) => {
    // payload must be { symbol, qty, cost }
    return addHolding(payload);
  });

  safeHandle("portfolio:update", async (_e, payload) => {
    // payload must be { symbol, qtyDelta }
    return updateHolding(payload);
  });

  safeHandle("portfolio:remove", async (_e, payload) => {
    // payload must be { symbol }
    return removeHolding(payload);
  });

  console.log("[IPC] Portfolio mutation layer registered (portfolio:add/update/remove)");
}
