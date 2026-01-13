/**
 * electron/ipc/portfolioIpc.js
 * --------------------------------
 * IPC Authority — Portfolio (Editable V1)
 *
 * Rules:
 * - Engine-first mutation
 * - IPC is a thin transport layer
 * - No analytics ownership here
 * - Deterministic, boot-safe
 */

const { ipcMain } = require("electron");
const path = require("path");

/**
 * IMPORTANT:
 * Use absolute path resolution to avoid ESM/CJS ambiguity
 */
const portfolioEnginePath = path.resolve(
  __dirname,
  "../../engine/portfolio/portfolioEngine.js"
);

const {
  getPortfolioSnapshot,
  addHolding,
  updateHolding,
  removeHolding
} = require(portfolioEnginePath);

/* =========================
   READ — SNAPSHOT
   ========================= */

function registerPortfolioIpc() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    const snapshot = getPortfolioSnapshot();

    return Object.freeze({
      ...snapshot,
      authority: "PORTFOLIO_ENGINE_V1_IPC"
    });
  });

  ipcMain.handle("portfolio:refreshNow", async () => {
    const snapshot = getPortfolioSnapshot();

    return Object.freeze({
      ...snapshot,
      authority: "PORTFOLIO_ENGINE_V1_IPC"
    });
  });

  /* =========================
     MUTATION — ENGINE FIRST
     ========================= */

  ipcMain.handle("portfolio:addHolding", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }

    return addHolding(payload.symbol, payload.qty);
  });

  ipcMain.handle("portfolio:updateHolding", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }

    return updateHolding(payload.symbol, payload.qty);
  });

  ipcMain.handle("portfolio:removeHolding", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }

    return removeHolding(payload.symbol);
  });
}

module.exports = { registerPortfolioIpc };
