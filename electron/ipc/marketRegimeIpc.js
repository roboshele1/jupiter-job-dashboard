// WARNING: HARDCODED INPUTS — BETA KNOWN ISSUE
// vixLevel and breadthPctAbove50DMA are static placeholder values.
// TODO before v1.0: wire to live data:
//   vixLevel:             Polygon options API or FRED (^VIX)
//   breadthPctAbove50DMA: Polygon snapshot across SPY constituents
// ---------------------------------------------------------------
// electron/ipc/marketRegimeIpc.js
import { computeMarketRegime } from "../../engine/marketRegime/marketRegimeEngine.js";

/**
 * Market Regime IPC — V1 (Shadow)
 * --------------------------------
 * Read-only IPC surface.
 * Deterministic.
 * No registry mutation.
 * No UI coupling.
 */

let cachedSnapshot = null;

function buildDeterministicInputs() {
  return {
    vixLevel: 22,
    breadthPctAbove50DMA: 52,
    indexTrend: "SIDEWAYS"
  };
}

export function registerMarketRegimeIpc(ipcMain) {
  ipcMain.handle("marketRegime:get", async () => {
    if (!cachedSnapshot) {
      const inputs = buildDeterministicInputs();

      const regime = computeMarketRegime(inputs);

      cachedSnapshot = {
        timestamp: Date.now(),
        regime
      };
    }

    return cachedSnapshot;
  });
}
