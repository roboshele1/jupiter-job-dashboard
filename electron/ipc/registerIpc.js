// electron/ipc/registerIpc.js
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";
import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

import { getRuntimeHealth } from "../../engine/runtime/runtimeStore.js";

/**
 * IPC Registry — Authoritative
 * -----------------------------
 * Registers all read-only IPC surfaces.
 * Resolver-gated.
 * No mutation.
 * No UI logic.
 */

let cachedSnapshot = null;

/* =========================
   SNAPSHOT AUTHORITY
   ========================= */
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

  cachedSnapshot = Object.freeze({
    timestamp: Date.now(),
    portfolio: valuation
  });

  return cachedSnapshot;
}

async function getCachedSnapshot() {
  if (!cachedSnapshot) await computeSnapshot();
  return cachedSnapshot;
}

/* =========================
   REGISTER ALL IPC
   ========================= */
export function registerAllIpc(ipcMain) {
  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  ipcMain.handle("signals:getSnapshot:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: {
        contract: "PORTFOLIO_SNAPSHOT_V1",
        timestamp: cached.timestamp,
        currency: cached.portfolio.currency || "CAD",
        holdings: cached.portfolio.positions.map(p => ({
          symbol: p.symbol,
          value: p.liveValue
        })),
        totalValue: cached.portfolio.totals.liveValue
      },
      horizonMonths: 60,
      assumptions: { expectedReturn: 0.10, aggressiveReturn: 0.18 }
    });

    return Object.freeze(
      buildSignalsV2Snapshot({
        portfolioSnapshot: cached,
        growthTrajectory,
        riskSnapshot: null,
        confidenceEvaluations: []
      })
    );
  });

  ipcMain.handle("riskCentre:intelligence:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: {
        contract: "PORTFOLIO_SNAPSHOT_V1",
        timestamp: cached.timestamp,
        currency: cached.portfolio.currency || "CAD",
        holdings: cached.portfolio.positions.map(p => ({
          symbol: p.symbol,
          value: p.liveValue
        })),
        totalValue: cached.portfolio.totals.liveValue
      },
      horizonMonths: 60,
      assumptions: { expectedReturn: 0.10, aggressiveReturn: 0.18 }
    });

    const signalsSnapshot = buildSignalsV2Snapshot({
      portfolioSnapshot: cached,
      growthTrajectory,
      riskSnapshot: null,
      confidenceEvaluations: []
    });

    return Object.freeze(
      buildRiskCentreIntelligenceV2({
        portfolioSnapshot: cached,
        growthTrajectory,
        signalsSnapshot,
        previousState: null
      })
    );
  });

  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  ipcMain.handle("insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  /* =========================
     RUNTIME HEALTH (TRUTH SOURCE)
     ========================= */
  ipcMain.handle("runtime:getHealth", async () => {
    return Object.freeze(getRuntimeHealth());
  });
}

