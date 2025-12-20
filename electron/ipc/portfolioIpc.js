// electron/ipc/portfolioIpc.js
import { ipcMain } from "electron";
import { calculatePortfolioSnapshot } from "../../engine/portfolio/portfolioSnapshotService.js";

export function registerPortfolioIpc() {
  ipcMain.handle("portfolio:getSnapshot", async () => {
    try {
      const snapshot = await calculatePortfolioSnapshot();
      return { ok: true, data: snapshot };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

