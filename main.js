import { ipcMain } from "electron";
import { getPortfolioSnapshot } from "./engine/ipc/portfolioSnapshotService.js";

ipcMain.handle("portfolio:getSnapshot", async (_event, payload) => {
  const { positions, previousSnapshot } = payload;
  return await getPortfolioSnapshot(positions, previousSnapshot);
});

