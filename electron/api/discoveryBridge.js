/**
 * D6.4 — Discovery IPC Bridge (READ-ONLY)
 * --------------------------------------
 * Exposes Discovery outputs to the renderer
 * without allowing mutation, execution, or recomputation.
 */

import { ipcMain } from "electron";
import { adaptDiscoveryForUi } from "../../engine/discovery/ui/discoveryUiAdapter.js";
import { runDiscoveryEngine } from "../../engine/discovery/discoveryEngine.js";

export function registerDiscoveryIpc() {
  ipcMain.handle("discovery:run", async (_event, payload = {}) => {
    // Hard guard — Discovery is autonomous
    if (Object.keys(payload).length !== 0) {
      throw new Error("READ_ONLY_VIOLATION: Discovery does not accept inputs");
    }

    const rawResult = await runDiscoveryEngine();

    const adapted = rawResult.map((r) =>
      adaptDiscoveryForUi(r)
    );

    return Object.freeze({
      contract: "DISCOVERY_LAB_V1",
      status: "READY",
      timestamp: Date.now(),
      results: Object.freeze(adapted),
    });
  });
}
