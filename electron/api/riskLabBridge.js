// electron/api/riskLabBridge.js
// Risk Lab IPC Bridge — mirrors Portfolio / Signals / Insights pattern

const { ipcMain } = require("electron");
const riskLabEngine = require("../../engine/riskLabEngine");

function registerRiskLabIPC() {
  ipcMain.handle("risk:getSnapshot", async () => {
    try {
      return await riskLabEngine.getRiskSnapshot();
    } catch (err) {
      return {
        status: "error",
        ts: new Date().toISOString(),
        error: err.message,
        flags: [],
      };
    }
  });
}

module.exports = {
  registerRiskLabIPC,
};

