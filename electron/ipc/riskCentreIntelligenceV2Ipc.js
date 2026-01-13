// electron/ipc/riskCentreIntelligenceV2Ipc.js
// Risk Centre Intelligence V2 — PURE CONSUMER
// No internal engine execution
// Deterministic, read-only, dependency-driven

import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

let pinnedSnapshot = null;

export function registerRiskCentreIntelligenceV2Ipc(
  ipcMain,
  {
    getPortfolioSnapshot,
    getGrowthTrajectoryV2,
    getSignalsV2Snapshot
  }
) {
  ipcMain.handle("riskCentre:intelligence:v2", async () => {
    // 🔒 SESSION PIN
    if (pinnedSnapshot) return pinnedSnapshot;

    // ---------------------------
    // DEPENDENCY RESOLUTION
    // ---------------------------
    const portfolioSnapshot = await getPortfolioSnapshot();
    const growthTrajectory = await getGrowthTrajectoryV2();
    const signalsSnapshot = await getSignalsV2Snapshot();

    if (!portfolioSnapshot || !growthTrajectory || !signalsSnapshot) {
      throw new Error("RISK_CENTRE_V2_DEPENDENCY_MISSING");
    }

    // ---------------------------
    // PURE INTELLIGENCE BUILD
    // ---------------------------
    const intelligence = buildRiskCentreIntelligenceV2({
      portfolioSnapshot,
      growthTrajectory,
      signalsSnapshot,
      previousState: null
    });

    pinnedSnapshot = intelligence;
    return pinnedSnapshot;
  });

  // Safe reset hook (not used by UI)
  ipcMain.handle("riskCentre:resetIntelligence:v2", async () => {
    pinnedSnapshot = null;
    return { ok: true };
  });
}
