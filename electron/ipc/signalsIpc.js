// electron/ipc/signalsIpc.js
const { ipcMain } = require("electron");
const { recordSnapshot } = require("../../engine/signalsSnapshotEngine");
const { getLivePortfolioSnapshot } = require("../../engine/portfolio");

ipcMain.handle("signals:getSnapshot", async () => {
  const snapshot = await getLivePortfolioSnapshot();
  if (!snapshot?.signals) return null;
  return recordSnapshot(snapshot);
});

