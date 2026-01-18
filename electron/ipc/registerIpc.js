// electron/ipc/registerIpc.js
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";
import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

import { getPortfolioReadSnapshotV1 } from "../../engine/portfolio/portfolioReadSnapshotV1.js";

/**
 * IPC Registry — Authoritative (V8)
 * --------------------------------
 * Canonical READ-ONLY IPC surface.
 *
 * RULES:
 * - NO hard-coded holdings
 * - NO pricing logic
 * - NO valuation logic
 * - Engine snapshot is the single source of truth
 * - Deterministic + cacheable
 */

let cachedSnapshot = null;

/* =========================
   SNAPSHOT AUTHORITY (V8)
   ========================= */
async function computeSnapshot() {
  const snapshot = await getPortfolioReadSnapshotV1();

  cachedSnapshot = Object.freeze({
    timestamp: Date.now(),
    portfolio: snapshot.valuation,
    holdings: snapshot.holdings
  });

  return cachedSnapshot;
}

async function getCachedSnapshot() {
  if (!cachedSnapshot) {
    await computeSnapshot();
  }
  return cachedSnapshot;
}

/* =========================
   NORMALIZERS (V2 CONSUMERS)
   ========================= */
function buildGrowthV2PortfolioSnapshotFromCached(cached) {
  const totalValue = cached?.portfolio?.totals?.liveValue;

  if (!Number.isFinite(totalValue)) {
    throw new Error("PORTFOLIO_SNAPSHOT_INVALID");
  }

  const positions = Array.isArray(cached?.portfolio?.positions)
    ? cached.portfolio.positions
    : [];

  return Object.freeze({
    contract: "PORTFOLIO_SNAPSHOT_V2",
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
    contract: "PORTFOLIO_SNAPSHOT_V2",
    timestamp: cached.timestamp,
    holdings: positions.map(p => ({
      symbol: p.symbol,
      assetClass: p.assetClass,
      deltaPct: Number.isFinite(p.deltaPct) ? p.deltaPct : 0
    }))
  });
}

/* =========================
   REGISTER ALL IPC (READ-ONLY)
   ========================= */
export function registerAllIpc(ipcMain) {
  // =========================
  // GROWTH ENGINE (V1)
  // =========================
  registerGrowthEngineIpc(ipcMain);

  // =========================
  // SIGNALS (V1)
  // =========================
  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // GROWTH — CAPITAL TRAJECTORY V2
  // =========================
  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // SIGNALS V2
  // =========================
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
        confidenceEvaluations: cached?.confidenceEvaluations || []
      })
    );
  });

  // =========================
  // RISK CENTRE — INTELLIGENCE V2
  // =========================
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
  // PORTFOLIO — CANONICAL READ
  // =========================
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // INSIGHTS
  // =========================
  ipcMain.handle("insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  // =========================
  // DISCOVERY — AUTONOMOUS
  // =========================
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

  // =========================
  // DISCOVERY — MANUAL
  // =========================
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

  // =========================
  // WATCHLIST — STUB (BOOT-SAFE)
  // =========================
  ipcMain.handle("watchlist:candidates", async () => {
    return Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: [],
      note: "Stubbed — engine to be wired in Phase D2.3"
    });
  });
}
