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
}
