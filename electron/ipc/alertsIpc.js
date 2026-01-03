// electron/ipc/alertsIpc.js
// IPC Authority — Alerts Engine V1 (READ ONLY)
// Contract: Renderer may READ alerts only. No mutation. No recomputation.

const { ipcMain } = require("electron");
const { runAlertsEngineV1 } = require("../../engine/alerts/alertsEngineV1.js");

function registerAlertsIpc() {
  ipcMain.handle("alerts:getSnapshot", async () => {
    const output = runAlertsEngineV1();

    return {
      engine: output.engine,
      count: output.count,
      alerts: output.alerts,
      authority: "IPC_ALERTS_ENGINE_V1_LOCK",
      readonly: true,
      timestamp: Date.now(),
    };
  });
}

module.exports = { registerAlertsIpc };

