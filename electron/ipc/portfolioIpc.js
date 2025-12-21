// electron/ipc/portfolioIpc.js
// JUPITER — Portfolio IPC (READ-ONLY)

import { ipcMain } from "electron";
import { calculatePortfolioSnapshot } from "../../engine/portfolio/portfolioSnapshotService.js";

export function registerPortfolioIpc() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    const snapshot = await calculatePortfolioSnapshot();
    return { ok: true, data: snapshot };
  });
}

