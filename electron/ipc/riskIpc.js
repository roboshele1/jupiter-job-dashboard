// electron/ipc/riskIpc.js

import { ipcMain } from "electron";
import { deriveRiskSnapshot } from "../../engine/risk/riskEngine.js";

export function registerRiskIpc() {
  ipcMain.handle("risk:getSnapshot", async () => {
    return await deriveRiskSnapshot();
  });
}

