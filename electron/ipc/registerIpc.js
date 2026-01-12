// electron/ipc/registerIpc.js
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
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
     INSIGHTS (ENGINE V1)
     ========================= */
  ipcMain.handle("insights:compute", async () => {
    if (!cachedSnapshot) await computeSnapshot();
    return computeInsights(cachedSnapshot);
  });

  /* =========================
     DISCOVERY — AUTONOMOUS
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
     DISCOVERY — MANUAL ANALYSIS (RESOLVER-GATED)
     ========================= */
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
     MARKET REGIME (REGISTRY V1)
     ========================= */
  ipcMain.handle("marketRegime:get", async () => {
    const regimeModule = await import(
      "../../engine/marketRegime/marketRegimeEngine.js"
    );

    const computeMarketRegime =
      regimeModule.computeMarketRegime ||
      regimeModule.default?.computeMarketRegime;

    if (typeof computeMarketRegime !== "function") {
      throw new Error("MARKET_REGIME_ENGINE_INVALID");
    }

    const input = {
      vixLevel: 22,
      breadthPctAbove50DMA: 52,
      indexTrend: "SIDEWAYS"
    };

    return {
      timestamp: Date.now(),
      regime: computeMarketRegime(input)
    };
  });
}
