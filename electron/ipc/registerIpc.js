import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";

/**
 * IPC Registry — Authoritative
 * -----------------------------
 * Registers all read-only IPC surfaces.
 * No mutation. No UI logic.
 */

let cachedSnapshot = null;

async function computeSnapshot() {
  // NOTE: Must stay in sync with main.js holdings authority
  const HOLDINGS = [
    { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13, currency: "CAD" },
    { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52, currency: "CAD" },
    { symbol: "AVGO", qty: 74, assetClass: "equity", totalCostBasis: 26190.68, currency: "CAD" },
    { symbol: "MSTR", qty: 24, assetClass: "equity", totalCostBasis: 12496.18, currency: "CAD" },
    { symbol: "HOOD", qty: 70, assetClass: "equity", totalCostBasis: 3316.68, currency: "CAD" },
    { symbol: "BMNR", qty: 115, assetClass: "equity", totalCostBasis: 6320.18, currency: "CAD" },
    { symbol: "APLD", qty: 150, assetClass: "equity", totalCostBasis: 1615.58, currency: "CAD" },
    { symbol: "BTC", qty: 0.251083, assetClass: "crypto", totalCostBasis: 24764.31, currency: "CAD" },
    { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.9, currency: "CAD" }
  ];

  const valuation = await valuePortfolio(HOLDINGS);

  cachedSnapshot = {
    timestamp: Date.now(),
    totalValue: valuation.totalValue,
    allocation: valuation.allocation,
    topHoldings: valuation.topHoldings,
    holdings: valuation.holdings,
    deltas: valuation.deltas || {},
    confidence: valuation.confidence || {}
  };

  return cachedSnapshot;
}

export function registerAllIpc(ipcMain) {
  registerGrowthEngineIpc(ipcMain);

  // Portfolio snapshot
  ipcMain.handle("portfolio:getSnapshot", async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  // Signals snapshot (engine-sourced)
  registerSignalsIpc(ipcMain, async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  /* =========================================================
     DECISION ENGINE IPC (READ-ONLY, APPENDED)
     =========================================================
     - Renderer never imports engine files
     - Main process owns execution
     - Deterministic output only
  */

  ipcMain.handle("decision:run", async (_event, query) => {
    const { runDecisionEngine } = await import(
      "../../engine/decision/decisionEngine.js"
    );

    return runDecisionEngine(query);
  });
}
