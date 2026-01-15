// electron/ipc/registerIpc.js
// IPC Registry — Authoritative (Additive, Resolver-Gated)
// ------------------------------------------------------
// Rules:
// - Read-only IPC only
// - Engine is the source of truth
// - No UI logic
// - No mutations
// - Backward-compatible handlers MUST remain registered

import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";
import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

import portfolioEngine from "../../engine/portfolio/portfolioEngine.js";
import { getPortfolioReadSnapshotV1 } from "../../engine/portfolio/portfolioReadSnapshotV1.js";
import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

/**
 * Registers all IPC handlers.
 * This function is the ONLY place IPC handlers may be declared.
 */
export async function registerAllIpc(ipcMain) {
  /* =========================
     PORTFOLIO — LEGACY SNAPSHOT (KEEP)
     ========================= */
  ipcMain.handle("portfolio:getSnapshot", async () => {
    const snap = portfolioEngine.getPortfolioSnapshot();

    const valuation = await valuePortfolio(
      snap.positions.map(h => ({
        ...h,
        assetClass: ["BTC", "ETH"].includes(h.symbol) ? "crypto" : "equity",
        totalCostBasis: 0
      }))
    );

    return Object.freeze({
      timestamp: snap.timestamp,
      portfolio: valuation
    });
  });

  /* =========================
     PORTFOLIO — READ SNAPSHOT V1 (NEW, AUTHORITATIVE)
     ========================= */
  ipcMain.handle("portfolio:readSnapshotV1", async () => {
    return getPortfolioReadSnapshotV1();
  });

  /* =========================
     SIGNALS
     ========================= */
  ipcMain.handle("signals:getSnapshotV2", async () => {
    return buildSignalsV2Snapshot();
  });

  /* =========================
     RISK CENTRE
     ========================= */
  ipcMain.handle("risk:getIntelligenceV2", async () => {
    return buildRiskCentreIntelligenceV2();
  });

  /* =========================
     GROWTH ENGINE
     ========================= */
  registerGrowthEngineIpc(ipcMain);

  ipcMain.handle("growth:capitalTrajectoryV2", async (_, payload) => {
    return runCapitalTrajectoryV2(payload);
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain);

  /* =========================
     INSIGHTS
     ========================= */
  ipcMain.handle("insights:get", async (_, payload) => {
    return computeInsights(payload);
  });

  /* =========================
     SYMBOL RESOLUTION
     ========================= */
  ipcMain.handle("symbol:resolve", async (_, symbol) => {
    return resolveInvestableSymbol(symbol);
  });

  /* =========================
     SIGNALS IPC (LEGACY + V2)
     ========================= */
  registerSignalsIpc(ipcMain);
}
