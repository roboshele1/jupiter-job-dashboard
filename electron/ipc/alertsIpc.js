// electron/ipc/alertsIpc.js
// IPC Authority — Alerts Engine V1
// ESM-only. Read-only. Deterministic. Engine-owned.
// Renderer may ONLY consume alerts via IPC.

import pkg from "electron";
const { ipcMain } = pkg;

export function registerAlertsIpc() {
  ipcMain.handle("alerts:getSnapshot", async () => {
    const { runAlertsEngineV1 } = await import(
      "../../engine/alerts/alertsEngineV1.js"
    );

    const output = runAlertsEngineV1({
      decisionOutput: { alerts: [] },
      riskEngine: { engine: "RISK_ENGINE_V1", metrics: {} },
    });

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

