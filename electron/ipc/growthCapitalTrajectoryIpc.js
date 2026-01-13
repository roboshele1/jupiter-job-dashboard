/**
 * GROWTH CAPITAL TRAJECTORY IPC — V2
 * =================================
 * Purpose:
 * - Expose Capital Trajectory & What-If math to renderer
 * - Read-only, deterministic, portfolio-authoritative
 *
 * NON-GOALS:
 * - No execution
 * - No advice
 * - No mutation
 */

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";

/* ======================================================
   CONTRACT
====================================================== */

export const GROWTH_CAPITAL_TRAJECTORY_CONTRACT = {
  name: "GROWTH_CAPITAL_TRAJECTORY_V2",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "PORTFOLIO_SNAPSHOT",
  mutationAllowed: false
};

/* ======================================================
   INPUT VALIDATION (ALLOW-LIST)
====================================================== */

function validatePayload(payload = {}) {
  const allowedKeys = ["portfolioSnapshot", "horizonMonths", "assumptions", "scenarios"];

  for (const k of Object.keys(payload)) {
    if (!allowedKeys.includes(k)) {
      throw new Error(`READ_ONLY_VIOLATION: ${k}`);
    }
  }

  if (typeof payload.horizonMonths !== "number") {
    throw new Error("INVALID_INPUT: horizonMonths required");
  }

  return payload;
}

/* ======================================================
   IPC REGISTRATION
====================================================== */

export function registerGrowthCapitalTrajectoryIpc(ipcMain) {
  ipcMain.handle(
    "growth:capitalTrajectory:run",
    async (_event, payload = {}) => {
      const safePayload = validatePayload(payload);

      const result = await runCapitalTrajectoryV2({
        portfolioSnapshot: safePayload.portfolioSnapshot,
        horizonMonths: safePayload.horizonMonths,
        assumptions: safePayload.assumptions,
        scenarios: safePayload.scenarios
      });

      return Object.freeze({
        contract: GROWTH_CAPITAL_TRAJECTORY_CONTRACT.name,
        status: "READY",
        timestamp: Date.now(),
        result
      });
    }
  );
}
