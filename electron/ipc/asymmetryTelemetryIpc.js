// electron/ipc/asymmetryTelemetryIpc.js
import { ipcMain } from "electron";
import {
  getTelemetrySnapshot,
  subscribe
} from "../../engine/asymmetry/telemetry/scanTelemetryBus.js";

/**
 * Asymmetry Telemetry IPC
 * -----------------------
 * Read-only, event-driven telemetry bridge
 *
 * HARD RULES:
 * - No mutation
 * - No engine control
 * - Push-only events
 */

export function registerAsymmetryTelemetryIpc(ipcMain) {
  // Snapshot pull (polling-safe)
  ipcMain.handle("asymmetry:telemetry:get", async () => {
    return getTelemetrySnapshot();
  });

  // Push stream (event-driven)
  subscribe(event => {
    ipcMain.emit("asymmetry:telemetry:event", null, event);
  });
}
