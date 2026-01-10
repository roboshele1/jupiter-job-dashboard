// electron/ipc/registerIpc.js
// Canonical IPC registry for JUPITER (append-only discipline)

import { interpretPortfolio } from "../../engine/insightsV2/insightsEngine.js";

export function registerAllIpc(ipcMain) {
  // -----------------------------
  // INSIGHTS V2 — READ-ONLY
  // -----------------------------
  ipcMain.handle("insights:v2:get", async (_event, portfolioSnapshot) => {
    try {
      if (!portfolioSnapshot) {
        return {
          status: "INVALID_SNAPSHOT",
          interpretations: []
        };
      }

      const interpretation = interpretPortfolio(portfolioSnapshot);

      return {
        status: "OK",
        generatedAt: Date.now(),
        interpretations: interpretation.interpretations || []
      };
    } catch (err) {
      return {
        status: "ERROR",
        message: err.message
      };
    }
  });
}
