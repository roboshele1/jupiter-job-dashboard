/**
 * Risk Centre Live IPC
 * -------------------
 * PURPOSE:
 * - Expose live Risk Centre intelligence over IPC
 * - Compose snapshot infra + Risk Centre engine
 *
 * CONTRACT:
 * - Channel: "riskCentre:getLiveSnapshot"
 * - Returns: {
 *     timestamp,
 *     source: "live",
 *     riskCentre
 *   }
 *
 * GUARANTEES:
 * - Read-only
 * - Deterministic
 * - Renderer-safe
 */

import pkg from "electron";
const { ipcMain } = pkg;

import { loadEngineSnapshot } from "../engineSnapshotService.js";
import { buildRiskCentre } from "../../renderer/engine/riskCentreEngine.js";

export function registerRiskCentreLiveIpc() {
  ipcMain.handle("riskCentre:getLiveSnapshot", async () => {
    const portfolioSnapshot = loadEngineSnapshot("portfolio");

    if (!portfolioSnapshot) {
      return {
        timestamp: Date.now(),
        source: "live",
        riskCentre: null,
        error: "No portfolio snapshot available"
      };
    }

    const riskCentre = buildRiskCentre({
      portfolioSnapshot
    });

    return {
      timestamp: Date.now(),
      source: "live",
      riskCentre
    };
  });
}
