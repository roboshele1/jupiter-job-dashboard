/**
 * Growth Scenarios IPC (Read-Only)
 * Contract:
 *  - Read-only
 *  - Deterministic
 *  - No portfolio mutation
 */

import { runScenarioBatch } from "../../engine/growth/runScenarioBatch.js";

export function registerGrowthScenariosIpc(ipcMain) {
  ipcMain.handle("growthScenarios:runBatch", async (_event, inputs) => {
    return runScenarioBatch(inputs);
  });
}
