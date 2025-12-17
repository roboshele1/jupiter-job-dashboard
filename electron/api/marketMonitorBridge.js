const { ipcMain } = require("electron");
const marketMonitorEngine = require("../../engine/marketMonitorEngine");

function registerMarketMonitorIPC() {
  ipcMain.handle("marketMonitor:getSnapshot", async () => {
    return marketMonitorEngine.getMarketSnapshot();
  });
}

module.exports = {
  registerMarketMonitorIPC
};

