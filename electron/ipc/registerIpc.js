// electron/ipc/registerIpc.js
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";

/**
 * IPC Registry — Authoritative
 * -----------------------------
 * Registers all read-only IPC surfaces.
 * No mutation. No UI logic.
 * No execution.
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
    portfolio: valuation
  };

  return cachedSnapshot;
}

export function registerAllIpc(ipcMain) {
  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  /* =========================
     PORTFOLIO
     ========================= */
  ipcMain.handle("portfolio:getSnapshot", async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return cachedSnapshot;
  });

  /* =========================
     DISCOVERY
     ========================= */
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

  /* =========================
     WATCHLIST
     ========================= */
  ipcMain.handle("watchlist:candidates", async () => {
    const watchlistModule = await import(
      "../../engine/watchlist/runWatchlistScan.js"
    );
    const orchestratorModule = await import(
      "../../engine/watchlist/orchestrator/watchlistCandidatesOrchestrator.js"
    );
    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const runWatchlistScan =
      watchlistModule.runWatchlistScan ||
      watchlistModule.default?.runWatchlistScan;

    const buildWatchlistCandidates =
      orchestratorModule.buildWatchlistCandidates ||
      orchestratorModule.default?.buildWatchlistCandidates;

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan ||
      discoveryModule.default?.runDiscoveryScan;

    if (!runWatchlistScan || !buildWatchlistCandidates || !runDiscoveryScan) {
      throw new Error("WATCHLIST_PIPELINE_INVALID");
    }

    const discoveryResults = (await runDiscoveryScan()).canonical;

    return Object.freeze(
      buildWatchlistCandidates({
        watchlistResult: runWatchlistScan({ discoveryResults }),
        discoveryResults
      })
    );
  });

  /* =========================
     DIVERGENCE EXPLANATIONS
     ========================= */
  ipcMain.handle("discovery:divergence:explanations", async () => {
    const divergenceModule = await import(
      "../../engine/discovery/explain/divergenceExplanationEngine.js"
    );

    const buildDivergenceExplanations =
      divergenceModule.buildDivergenceExplanations ||
      divergenceModule.default?.buildDivergenceExplanations;

    if (typeof buildDivergenceExplanations !== "function") {
      throw new Error("DIVERGENCE_ENGINE_INVALID");
    }

    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan ||
      discoveryModule.default?.runDiscoveryScan;

    const liveModule = await import(
      "../../engine/market/live/liveMarketSnapshotService.js"
    );

    const getLiveMarketSnapshot =
      liveModule.getLiveMarketSnapshot ||
      liveModule.default?.getLiveMarketSnapshot;

    const discoveryResults = await runDiscoveryScan();
    const symbols = (discoveryResults.canonical || []).map(
      r => r.symbol.symbol
    );

    const liveSnapshot = await getLiveMarketSnapshot({ symbols });

    return buildDivergenceExplanations({
      discoveryResults: discoveryResults.canonical || [],
      liveMarketData: liveSnapshot.data || []
    });
  });

  /* =========================
     CONFIDENCE (SHADOW)
     ========================= */
  ipcMain.handle("confidence:evaluate", async (_event, payload) => {
    const confidenceModule = await import(
      "../../engine/confidence/orchestrator/confidenceEvaluationOrchestrator.js"
    );

    const runConfidenceEvaluation =
      confidenceModule.runConfidenceEvaluation ||
      confidenceModule.default?.runConfidenceEvaluation;

    if (typeof runConfidenceEvaluation !== "function") {
      throw new Error("CONFIDENCE_EVALUATION_ENGINE_INVALID");
    }

    return runConfidenceEvaluation(payload);
  });

  /* =========================
     EXECUTION EXPOSURE (SHADOW)
     ========================= */
  ipcMain.handle("execution:exposure:evaluate", async (_event, payload) => {
    const exposureModule = await import(
      "../../engine/execution/executionExposureEngine.js"
    );

    const evaluateExecutionExposure =
      exposureModule.evaluateExecutionExposure ||
      exposureModule.default?.evaluateExecutionExposure;

    if (typeof evaluateExecutionExposure !== "function") {
      throw new Error("EXECUTION_EXPOSURE_ENGINE_INVALID");
    }

    return evaluateExecutionExposure(payload);
  });
}
