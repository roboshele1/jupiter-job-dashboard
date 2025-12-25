// engine/risk/riskIpc.js

import { deriveRiskSnapshot } from "./riskEngine.js";

export function registerRiskIpc(ipcMain) {
  ipcMain.handle("risk:getSnapshot", async () => {
    const snapshot = await deriveRiskSnapshot();
    return snapshot;
  });
}

