// electron/api/insightsBridge.js
// Insights IPC Bridge — mirrors Discovery / Growth pattern

const { ipcMain } = require("electron");
const insightsEngine = require("../../engine/insightsEngine");

function registerInsightsIPC() {
  ipcMain.handle("insights:getSnapshot", async () => {
    try {
      return insightsEngine.getInsightsSnapshot();
    } catch (err) {
      return {
        status: "error",
        ts: new Date().toISOString(),
        error: err.message,
        insights: [],
      };
    }
  });
}

module.exports = {
  registerInsightsIPC,
};

