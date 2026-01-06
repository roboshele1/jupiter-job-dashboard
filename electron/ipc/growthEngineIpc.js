// electron/ipc/growthEngineIpc.js
import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { runGrowthEngine } from "../../engine/growthEngine.js";

/**
 * GROWTH ENGINE IPC — G7.2 SOURCE LABELING
 * ---------------------------------------
 * - Read-only enforcement (G7.1)
 * - Explicit source labeling (G7.2)
 * - Deterministic, projection-only execution
 */

/* =============================
   IMMUTABLE PORTFOLIO SNAPSHOT
============================= */
const HOLDINGS = Object.freeze([
  { symbol: "NVDA", qty: 73, assetClass: "equity", totalCostBasis: 12881.13, currency: "CAD" },
  { symbol: "ASML", qty: 10, assetClass: "equity", totalCostBasis: 8649.52, currency: "CAD" },
  { symbol: "AVGO", qty: 74, assetClass: "equity", totalCostBasis: 26190.68, currency: "CAD" },
  { symbol: "MSTR", qty: 24, assetClass: "equity", totalCostBasis: 12496.18, currency: "CAD" },
  { symbol: "HOOD", qty: 70, assetClass: "equity", totalCostBasis: 3316.68, currency: "CAD" },
  { symbol: "BMNR", qty: 115, assetClass: "equity", totalCostBasis: 6320.18, currency: "CAD" },
  { symbol: "APLD", qty: 150, assetClass: "equity", totalCostBasis: 1615.58, currency: "CAD" },
  { symbol: "BTC", qty: 0.251083, assetClass: "crypto", totalCostBasis: 24764.31, currency: "CAD" },
  { symbol: "ETH", qty: 0.25, assetClass: "crypto", totalCostBasis: 597.9, currency: "CAD" }
]);

/* =============================
   INPUT CONTRACT (ALLOW-LIST)
============================= */
function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return {};

  const allowedKeys = ["candidateAllocation"];
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`READ_ONLY_VIOLATION: Disallowed payload key "${key}"`);
    }
  }

  const ca = payload.candidateAllocation;
  if (!ca) return {};

  if (
    typeof ca.symbol !== "string" ||
    typeof ca.amount !== "number" ||
    typeof ca.assumedCAGR !== "number"
  ) {
    throw new Error("INVALID_INPUT: candidateAllocation schema mismatch");
  }

  return {
    candidateAllocation: Object.freeze({
      symbol: ca.symbol,
      amount: ca.amount,
      assumedCAGR: ca.assumedCAGR,
    }),
  };
}

/* =============================
   IPC REGISTRATION
============================= */
export function registerGrowthEngineIpc(ipcMain) {
  ipcMain.handle("growthEngine:run", async (_event, payload = {}) => {
    const safePayload = validatePayload(payload);

    const valuation = await valuePortfolio(HOLDINGS);

    const baseAllocations = Object.freeze([
      { symbol: "NVDA", amount: 60000, assumedCAGR: 0.25 },
      { symbol: "ASML", amount: 40000, assumedCAGR: 0.18 },
    ]);

    const engineResult = await runGrowthEngine({
      holdings: HOLDINGS,
      startingValue: Math.round(valuation.totals.liveValue),
      authority: "PORTFOLIO_VALUATION_V1",
      assetAllocations: baseAllocations,
      candidateAllocation: safePayload.candidateAllocation || {
        symbol: "MSTR",
        amount: 20000,
        assumedCAGR: 0.30,
      },
    });

    return Object.freeze({
      contract: "GROWTH_ENGINE_V1",
      status: "READY",
      authority: "PORTFOLIO_VALUATION_V1",
      timestamp: Date.now(),

      sources: Object.freeze({
        holdings: "PORTFOLIO_DERIVED",
        startingValue: "PORTFOLIO_DERIVED",
        baseAllocations: "ENGINE_ASSUMPTION",
        candidateAllocation: safePayload.candidateAllocation
          ? "USER_ASSUMPTION"
          : "ENGINE_DEFAULT",
        growthProfile: "ENGINE_COMPUTED",
      }),

      growthProfile: engineResult.growthProfile,
    });
  });
}
