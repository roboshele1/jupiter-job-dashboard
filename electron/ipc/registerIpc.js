// electron/ipc/registerIpc.js
// =====================================================
// SNAPSHOT AUTHORITY — READ-ONLY + INVALIDATION SUPPORT
// =====================================================

import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";
import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

// =====================================================
// SNAPSHOT CACHE (SINGLE SOURCE OF TRUTH)
// =====================================================

let cachedSnapshot = null;

// =====================================================
// SNAPSHOT INVALIDATION HOOK (MUTATION SAFE)
// =====================================================

export function invalidateSnapshotCache() {
  cachedSnapshot = null;
  console.log("[SNAPSHOT] Cache invalidated");
}

// =====================================================
// SNAPSHOT COMPUTATION
// =====================================================

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
  if (!cachedSnapshot) {
    await computeSnapshot();
  }
  return cachedSnapshot;
}

// =====================================================
// NORMALIZERS (V2 CONSUMERS)
// =====================================================

function buildGrowthV2PortfolioSnapshotFromCached(cached) {
  const positions = Array.isArray(cached?.portfolio?.positions)
    ? cached.portfolio.positions
    : [];

  const totalValue = cached?.portfolio?.totals?.liveValue;

  if (!totalValue) {
    throw new Error("PORTFOLIO_SNAPSHOT_INVALID");
  }

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

// =====================================================
// REGISTER ALL READ-ONLY IPC (SINGLE AUTHORITY)
// =====================================================

export async function registerAllIpc(ipcMain) {
  // Growth Engine (V1)
  registerGrowthEngineIpc(ipcMain);

  // Signals (V1)
  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // Growth Capital Trajectory (V2)
  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // Signals Snapshot (V2)
  ipcMain.handle("signals:getSnapshot:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: buildGrowthV2PortfolioSnapshotFromCached(cached),
      horizonMonths: 60,
      assumptions: { expectedReturn: 0.10, aggressiveReturn: 0.18 }
    });

    return Object.freeze(
      buildSignalsV2Snapshot({
        portfolioSnapshot: buildSignalsV2PortfolioSnapshotFromCached(cached),
        growthTrajectory,
        riskSnapshot: null,
        confidenceEvaluations: []
      })
    );
  });

  // Risk Centre (V2)
  ipcMain.handle("riskCentre:intelligence:v2", async () => {
    const cached = await getCachedSnapshot();

    const growthTrajectory = await runCapitalTrajectoryV2({
      portfolioSnapshot: buildGrowthV2PortfolioSnapshotFromCached(cached),
      horizonMonths: 60,
      assumptions: { expectedReturn: 0.10, aggressiveReturn: 0.18 }
    });

    const signalsSnapshot = buildSignalsV2Snapshot({
      portfolioSnapshot: buildSignalsV2PortfolioSnapshotFromCached(cached),
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

  // Portfolio Snapshot (READ-ONLY)
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  // Portfolio Valuation (Dashboard / Market Monitor)
  ipcMain.handle("portfolio:getValuation", async () => {
    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  // Insights
  ipcMain.handle("insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  // Discovery — Autonomous
  ipcMain.handle("discovery:run", async () => {
    const discoveryModule = await import("../../engine/discovery/runDiscoveryScan.js");
    const themeModule = await import("../../engine/discovery/orchestrator/discoveryThemeOrchestrator.js");

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan || discoveryModule.default?.runDiscoveryScan;
    const buildThemes =
      themeModule.buildThemes || themeModule.default?.buildThemes;

    if (!runDiscoveryScan || !buildThemes) {
      throw new Error("DISCOVERY_PIPELINE_INVALID");
    }

    const results = await runDiscoveryScan();

    return Object.freeze({
      ...results,
      emergingThemes: buildThemes({ canonical: results.canonical || [] })
    });
  });

  // Discovery — Manual
  ipcMain.handle("discovery:analyze:symbol", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }

    const resolution = await resolveInvestableSymbol(payload.symbol);
    if (!resolution?.valid) throw new Error("INVALID_SYMBOL");

    const engineModule = await import("../../engine/discovery/discoveryEngine.js");
    const runDiscoveryEngine =
      engineModule.runDiscoveryEngine || engineModule.default?.runDiscoveryEngine;

    if (typeof runDiscoveryEngine !== "function") {
      throw new Error("DISCOVERY_ENGINE_INVALID");
    }

    return Object.freeze({
      mode: "MANUAL_RESEARCH",
      resolution,
      result: await runDiscoveryEngine({
        symbol: resolution.canonicalSymbol,
        assetType: resolution.assetType,
        ownership: payload.ownership === true
      })
    });
  });

  // Watchlist (Stub)
  ipcMain.handle("watchlist:candidates", async () => {
    return Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: []
    });
  });

  console.log("✅ registerAllIpc loaded — snapshot authority intact");
}
