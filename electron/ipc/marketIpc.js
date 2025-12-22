// electron/ipc/marketIpc.js

import { ipcMain } from "electron";
import { getMarketSnapshot } from "../../engine/market/marketSnapshotService.js";

export function registerMarketIpc() {
  ipcMain.handle("market:getSnapshot", async () => {
    return await getMarketSnapshot();
  });
}

