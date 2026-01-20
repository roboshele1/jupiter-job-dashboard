// electron/ipc/telemetryIpc.js
// ======================================================
// Moonshot Telemetry IPC (Read-Only)
// ------------------------------------------------------
// Exposes live asymmetry scan telemetry to the renderer
// Passive observer only — NO control, NO mutation
// ======================================================

import { getTelemetrySnapshot } from "../../engine/asymmetry/telemetry/scanTelemetryBus.js";

/**
 * Register Moonshot Telemetry IPC
 * @param {Electron.IpcMain} ipcMain
 */
export function registerTelemetryIpc(ipcMain) {
  ipcMain.handle("moonshot:telemetry:get", async () => {
    return Object.freeze(getTelemetrySnapshot());
  });
}
