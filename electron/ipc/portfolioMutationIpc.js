// electron/ipc/portfolioMutationIpc.js
// =====================================================
// PORTFOLIO MUTATION IPC — ENGINE BACKED, WRITE ONLY
// =====================================================

import pkg from "../../engine/portfolio/portfolioEngine.js";
import { invalidateSnapshotCache } from "./registerIpc.js";

const {
  addHolding,
  updateHolding,
  removeHolding
} = pkg;

// =====================================================
// REGISTRATION (NO READ CHANNELS)
// =====================================================

export function registerPortfolioMutationIpc(ipcMain) {
  if (!ipcMain?.handle) {
    throw new Error("IPC_MAIN_INVALID");
  }

  // ADD
  ipcMain.handle("portfolio:add", async (_e, payload) => {
    if (!payload?.symbol || typeof payload.qty !== "number") {
      throw new Error("INVALID_PAYLOAD");
    }

    const result = addHolding(payload.symbol, payload.qty);
    invalidateSnapshotCache();
    return result;
  });

  // UPDATE
  ipcMain.handle("portfolio:update", async (_e, payload) => {
    if (!payload?.symbol || typeof payload.qty !== "number") {
      throw new Error("INVALID_PAYLOAD");
    }

    const result = updateHolding(payload.symbol, payload.qty);
    invalidateSnapshotCache();
    return result;
  });

  // REMOVE
  ipcMain.handle("portfolio:remove", async (_e, payload) => {
    if (!payload?.symbol) {
      throw new Error("INVALID_PAYLOAD");
    }

    const result = removeHolding(payload.symbol);
    invalidateSnapshotCache();
    return result;
  });

  console.log("✅ Portfolio mutation IPC registered (write-only)");
}
