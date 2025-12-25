// electron/ipc/dashboardSnapshotIpc.js

import { ipcMain } from "electron";
import { readPortfolioSnapshot } from "../../engine/portfolio/readPortfolioSnapshot.js";

export function registerDashboardSnapshotIpc() {
  ipcMain.handle("dashboard:getSnapshot", async () => {
    const snapshot = await readPortfolioSnapshot();

    if (!snapshot) {
      return {
        status: "NO_SNAPSHOT",
        snapshot: null
      };
    }

    return {
      status: "OK",
      snapshot
    };
  });
}

