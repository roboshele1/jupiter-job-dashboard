// electron/ipc/growthEngineIpc.js
import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { runGrowthEngine } from "../../engine/growthEngine.js";

/**
 * GROWTH ENGINE IPC — DETERMINISTIC G5
 * -----------------------------------
 * Pass-through candidateAllocation + default assetAllocations
 * Ensures Candidate Injection always runs deterministically.
 */

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

export function registerGrowthEngineIpc(ipcMain) {
  ipcMain.handle("growthEngine:run", async (_event, payload = {}) => {
    const valuation = await valuePortfolio(HOLDINGS);

    // Build a deterministic baseline allocation
    const baseAllocations = [
      { symbol: "NVDA", amount: 60000, assumedCAGR: 0.25 },
      { symbol: "ASML", amount: 40000, assumedCAGR: 0.18 },
    ];

    const engineResult = await runGrowthEngine({
      holdings: HOLDINGS,
      startingValue: Math.round(valuation.totals.liveValue),
      authority: "PORTFOLIO_VALUATION_V1",
      assetAllocations: baseAllocations,
      candidateAllocation: payload.candidateAllocation || {
        symbol: "MSTR",
        amount: 20000,
        assumedCAGR: 0.30,
      },
    });

    return {
      contract: "GROWTH_ENGINE_V1",
      status: "READY",
      authority: "PORTFOLIO_VALUATION_V1",
      timestamp: Date.now(),
      growthProfile: engineResult.growthProfile,
    };
  });
}
