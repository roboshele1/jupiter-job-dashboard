/**
 * DECISION IPC BRIDGE — READ ONLY
 * Contract: DECISION_ENGINE_V1
 *
 * Rules:
 * - Main process owns execution
 * - Renderer never imports engine
 * - No mutation, no side effects
 */

import { runDecisionEngine } from "../../engine/decision/decisionEngine.js";

export function registerDecisionIpc(ipcMain) {
  /**
   * Run decision engine with a query
   * @returns deterministic decision snapshot
   */
  ipcMain.handle("decision:run", async (_event, query) => {
    return await runDecisionEngine(query);
  });

  /**
   * Health check / contract validation
   */
  ipcMain.handle("decision:ping", async () => {
    return {
      contract: "DECISION_ENGINE_V1",
      status: "OK",
      timestamp: Date.now()
    };
  });
}
