// electron/ipc/riskAlertsIpc.js

import { ipcMain } from "electron";
import { readLatestRiskSnapshot } from "../../engine/risk/riskSnapshotReader.js";
import { deriveRiskAlerts } from "../../engine/risk/riskAlertsEngine.js";

export function registerRiskAlertsIpc() {
  ipcMain.handle("risk:getAlerts", async () => {
    const risk = await readLatestRiskSnapshot();
    return deriveRiskAlerts(risk);
  });
}

