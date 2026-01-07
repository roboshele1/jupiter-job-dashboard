// electron/ipc/registerIpc.js
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

  registerSignalsIpc(ipcMain, async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  /* =========================================================
     PORTFOLIO SNAPSHOT (READ-ONLY)
     ========================================================= */
  ipcMain.handle("portfolio:getSnapshot", async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  /* =========================================================
     DECISION ENGINE (READ-ONLY)
     ========================================================= */
  ipcMain.handle("decision:run", async (_event, payload) => {
    const { runDecisionEngine } = await import(
      "../../engine/decision/decisionEngine.js"
    );
    return runDecisionEngine(payload);
  });

  /* =========================================================
     CHAT V2 — AUTHORITATIVE IPC (CANONICAL)
     ========================================================= */
  ipcMain.handle("chat:v2:run", async (_event, payload = {}) => {
    const { runChatV2Orchestrator } = await import(
      "../../engine/chat/v2/orchestrator/chatV2Orchestrator.js"
    );

    if (!cachedSnapshot) await computeSnapshot();

    return runChatV2Orchestrator({
      query: payload.query,
      portfolioSnapshot: cachedSnapshot,
      marketSnapshot: payload.marketSnapshot || null,
      userPreferences: payload.userPreferences || {},
      memoryContext: payload.memoryContext || null,
      context: payload.context || null
    });
  });

  /* =========================================================
     DISCOVERY LAB — RANKED AUTONOMOUS SCAN (D7.14)
     ========================================================= */
  ipcMain.handle("discovery:run", async () => {
    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const runDiscoveryScan = discoveryModule.default.runDiscoveryScan;

    const results = await runDiscoveryScan();

    return Object.freeze(results);
  });
}
