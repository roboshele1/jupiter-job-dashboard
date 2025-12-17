const { ipcMain } = require("electron");
const riskEngine = require("../../engine/riskEngine");

/**
 * Registers Risk Lab IPC handlers
 * Contract: renderer → IPC → engine → snapshot
 */
function registerRiskIPC() {
  ipcMain.handle("risk:getSnapshot", async () => {
    try {
      return await riskEngine.getRiskSnapshot();
    } catch (err) {
      return {
        error: true,
        message: err.message
      };
    }
  });
}

module.exports = {
  registerRiskIPC
};

