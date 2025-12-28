/**
 * Risk Standalone IPC
 * -------------------
 * PURPOSE:
 * - Expose standalone risk snapshot over IPC
 * - Independent of Portfolio / Dashboard
 *
 * CONTRACT:
 * - Channel: "riskStandalone:getSnapshot"
 * - Returns: computeStandaloneRiskSnapshot()
 */

import pkg from "electron";
const { ipcMain } = pkg;

import { computeStandaloneRiskSnapshot } from "../riskStandalone/riskStandaloneEngine.js";

export function registerRiskStandaloneIpc() {
  ipcMain.handle("riskStandalone:getSnapshot", async () => {
    return computeStandaloneRiskSnapshot();
  });
}

