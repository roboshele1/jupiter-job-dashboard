// electron/api/growthBridge.js
const { ipcMain } = require("electron");
const growthEngine = require("../../engine/growthEngine");

function registerGrowthIPC() {
  ipcMain.handle("growth:getSnapshot", async () => {
    try {
      if (typeof growthEngine.getGrowthSnapshot !== "function") {
        return {
          status: "error",
          message: "Growth engine not initialized"
        };
      }

      const snapshot = await growthEngine.getGrowthSnapshot();
      return {
        status: "ok",
        data: snapshot
      };
    } catch (err) {
      return {
        status: "error",
        message: err.message
      };
    }
  });
}

module.exports = { registerGrowthIPC };

