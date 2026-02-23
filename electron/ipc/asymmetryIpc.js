// electron/ipc/asymmetryIpc.js
// Moonshot Asymmetry IPC — read-only bridge
// ESM (Electron) → CommonJS (Engine)

import autonomousMoonshotScanner from "../../engine/asymmetry/autonomousMoonshotScanner.js";
import universeScheduler from "../../engine/asymmetry/universeScheduler.js";

/**
 * Register Moonshot / Asymmetry IPC
 * STRICTLY READ-ONLY
 */
export default function registerAsymmetryIpc(ipcMain) {
  // Universe provider (delegated to scheduler)
  ipcMain.handle("market:universe:get", async () => {
    if (typeof universeScheduler.buildUniverse === "function") {
      return universeScheduler.buildUniverse();
    }

    if (typeof universeScheduler.getUniverse === "function") {
      return universeScheduler.getUniverse();
    }

    throw new Error(
      "UniverseScheduler does not expose a universe builder"
    );
  });

  // Asymmetry scan
  ipcMain.handle("asymmetry:scan", async (_evt, { universe }) => {
    return autonomousMoonshotScanner(universe);
  });

  /**
   * asymmetry:results
   * Returns the last cached scan result from universeScheduler.
   * Shape: { surfaced: [...], surfacedCount, regime, scannedAt } | null
   * Returns null if scheduler hasn't completed a scan yet (cold cache).
   * READ-ONLY — never triggers a new scan.
   */
  ipcMain.handle("asymmetry:results", async () => {
    if (typeof universeScheduler.getCachedScanResult !== "function") {
      console.warn("[asymmetryIpc] universeScheduler.getCachedScanResult not available");
      return null;
    }

    const result = universeScheduler.getCachedScanResult();

    if (!result) {
      console.warn("[asymmetryIpc] asymmetry:results — cache is cold (no scan yet)");
      return null;
    }

    return result;
  });

  /**
   * asymmetry:cache:meta
   * Returns scheduler metadata: lastBuiltAt, lastScannedAt, universeSize, hasScanResult.
   * Useful for UI to show freshness indicators.
   */
  ipcMain.handle("asymmetry:cache:meta", async () => {
    if (typeof universeScheduler.getCacheMeta !== "function") return null;
    return universeScheduler.getCacheMeta();
  });
}
