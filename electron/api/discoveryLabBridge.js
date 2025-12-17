// electron/api/discoveryLabBridge.js
// Discovery Lab IPC Bridge — mirrors Signals & Market Monitor pattern

const { ipcMain } = require("electron");
const discoveryLabEngine = require("../../engine/discoveryLabEngine");

function registerDiscoveryLabIPC() {
  ipcMain.handle("discovery:getSnapshot", async () => {
    try {
      return discoveryLabEngine.getDiscoverySnapshot();
    } catch (err) {
      return {
        status: "error",
        ts: new Date().toISOString(),
        error: err.message,
        universe: []
      };
    }
  });
}

module.exports = {
  registerDiscoveryLabIPC
};

