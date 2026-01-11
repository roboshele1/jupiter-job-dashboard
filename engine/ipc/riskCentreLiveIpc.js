/**
 * Risk Centre Live IPC
 * -------------------
 * PURPOSE:
 * - Expose live Risk Centre intelligence over IPC
 * - Add delta intelligence vs previous snapshot
 *
 * CONTRACT:
 * - Channel: "riskCentre:getLiveSnapshot"
 * - Returns: {
 *     timestamp,
 *     source: "live",
 *     current,
 *     deltas
 *   }
 *
 * GUARANTEES:
 * - Read-only (portfolio snapshot)
 * - Deterministic
 * - Renderer-safe
 */

import pkg from "electron";
const { ipcMain } = pkg;

import { loadEngineSnapshot, persistEngineSnapshot } from "../engineSnapshotService.js";
import { buildRiskCentre } from "../../renderer/engine/riskCentreEngine.js";
import { computeRiskCentreDeltas } from "../risk/riskCentreDeltaEngine.js";

export function registerRiskCentreLiveIpc() {
  ipcMain.handle("riskCentre:getLiveSnapshot", async () => {
    const portfolioSnapshot = loadEngineSnapshot("portfolio");

    if (!portfolioSnapshot) {
      return {
        timestamp: Date.now(),
        source: "live",
        current: null,
        deltas: null,
        error: "No portfolio snapshot available"
      };
    }

    const current = buildRiskCentre({
      portfolioSnapshot
    });

    const previous = loadEngineSnapshot("riskCentre");

    const deltas = computeRiskCentreDeltas({
      previous,
      current
    });

    // Persist for next comparison
    persistEngineSnapshot("riskCentre", current);

    return {
      timestamp: Date.now(),
      source: "live",
      current,
      deltas
    };
  });
}
