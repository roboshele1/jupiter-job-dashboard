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
   NORMALIZERS (V2 CONSUMERS)
   ========================= */
function buildGrowthV2PortfolioSnapshotFromCached(cached) {
  const totalValue = cached?.portfolio?.totals?.liveValue;

  if (!totalValue) {
    throw new Error("PORTFOLIO_SNAPSHOT_INVALID");
  }

  const positions = Array.isArray(cached?.portfolio?.positions)
    ? cached.portfolio.positions
    : [];

  return Object.freeze({
    contract: "PORTFOLIO_SNAPSHOT_V1",
    timestamp: cached.timestamp,
    currency: cached.portfolio.currency || "CAD",
    holdings: positions.map(p => ({
      symbol: p.symbol,
      value: p.liveValue
    })),
    totalValue
  });
}

function buildSignalsV2PortfolioSnapshotFromCached(cached) {
  const positions = Array.isArray(cached?.portfolio?.positions)
    ? cached.portfolio.positions
    : [];

  return Object.freeze({
    contract: "PORTFOLIO_SNAPSHOT_V1",
    timestamp: cached.timestamp,
    holdings: positions.map(p => ({
      symbol: p.symbol,
      assetClass: p.assetClass,
      deltaPct: typeof p.deltaPct === "number" ? p.deltaPct : 0
    }))
  });
}

/* =========================
   REGISTER ALL IPC
   ========================= */
export function registerAllIpc(ipcMain) {
  // =========================
  // GROWTH ENGINE (V1)
  // =========================
  registerGrowthEngineIpc(ipcMain);

  // =========================
  // SIGNALS (V1) — MUST BE WIRED WITH SNAPSHOT GETTER
  // =========================
  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // GROWTH — CAPITAL TRAJECTORY V2 (AUTHORITATIVE IPC)
  // =========================
  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // SIGNALS V2 — ENGINE-BUILT (NO IPC CHAINING)
  // =========================
  ipcMain.handle("signals:getSnapshot:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: buildGrowthV2PortfolioSnapshotFromCached(cached),
      horizonMonths: 60,
      assumptions: {
        expectedReturn: 0.10,
        aggressiveReturn: 0.18
      }
    });

    const signalsV2 = buildSignalsV2Snapshot({
      portfolioSnapshot: buildSignalsV2PortfolioSnapshotFromCached(cached),
      growthTrajectory,
      riskSnapshot: null,
      confidenceEvaluations: cached?.confidenceEvaluations || []
    });

    return Object.freeze(signalsV2);
  });

  // =========================
  // RISK CENTRE — INTELLIGENCE V2 (PURE DEPENDENCY CONSUMER)
  // =========================
  ipcMain.handle("riskCentre:intelligence:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: buildGrowthV2PortfolioSnapshotFromCached(cached),
      horizonMonths: 60,
      assumptions: {
        expectedReturn: 0.10,
        aggressiveReturn: 0.18
      }
    });

    const signalsSnapshot = buildSignalsV2Snapshot({
      portfolioSnapshot: buildSignalsV2PortfolioSnapshotFromCached(cached),
      growthTrajectory,
      riskSnapshot: null,
      confidenceEvaluations: cached?.confidenceEvaluations || []
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

  // =========================
  // PORTFOLIO
  // =========================
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // INSIGHTS (ENGINE V1)
  // =========================
  ipcMain.handle("insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  // =========================
  // DISCOVERY — AUTONOMOUS
  // =========================
  ipcMain.handle("discovery:run", async () => {
    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );
    const themeModule = await import(
      "../../engine/discovery/orchestrator/discoveryThemeOrchestrator.js"
    );

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan ||
      discoveryModule.default?.runDiscoveryScan;

    const buildThemes =
      themeModule.buildThemes ||
      themeModule.default?.buildThemes;

    if (!runDiscoveryScan || !buildThemes) {
      throw new Error("DISCOVERY_PIPELINE_INVALID");
    }

    const results = await runDiscoveryScan();

    return Object.freeze({
      ...results,
      emergingThemes: buildThemes({ canonical: results.canonical || [] })
    });
  });

  // =========================
  // DISCOVERY — MANUAL ANALYSIS (RESOLVER-GATED)
  // =========================
  ipcMain.handle("discovery:analyze:symbol", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD: symbol required");
    }

    const resolution = await resolveInvestableSymbol(payload.symbol);

    if (!resolution?.valid) {
      const err = new Error("INVALID_SYMBOL");
      err.code = "INVALID_SYMBOL";
      throw err;
    }

    const discoveryEngineModule = await import(
      "../../engine/discovery/discoveryEngine.js"
    );

    const runDiscoveryEngine =
      discoveryEngineModule.runDiscoveryEngine ||
      discoveryEngineModule.default?.runDiscoveryEngine;

    if (typeof runDiscoveryEngine !== "function") {
      throw new Error("DISCOVERY_ENGINE_INVALID");
    }

    const result = await runDiscoveryEngine({
      symbol: resolution.canonicalSymbol,
      assetType: resolution.assetType,
      ownership: payload.ownership === true
    });

    return Object.freeze({
      mode: "MANUAL_RESEARCH",
      resolution,
      result
    });
  });
}
