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
     CHAT V2 — AUTHORITATIVE IPC
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
     DISCOVERY LAB — RANKED AUTONOMOUS SCAN (D10.4)
     ========================================================= */
  ipcMain.handle("discovery:run", async () => {
    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const themeModule = await import(
      "../../engine/discovery/orchestrator/discoveryThemeOrchestrator.js"
    );

    const buildThemes =
      themeModule.buildThemes ||
      themeModule.default?.buildThemes;

    if (typeof buildThemes !== "function") {
      throw new Error("DISCOVERY_THEME_ORCHESTRATOR_INVALID");
    }

    const runDiscoveryScan = discoveryModule.runDiscoveryScan;
    const results = await runDiscoveryScan();

    const emergingThemes = buildThemes({
      canonical: results.canonical || []
    });

    return Object.freeze({
      ...results,
      emergingThemes
    });
  });

  /* =========================================================
     WATCHLIST ENGINE — BASE (READ-ONLY)
     ========================================================= */
  ipcMain.handle("watchlist:run", async () => {
    const { runWatchlistScan } = await import(
      "../../engine/watchlist/runWatchlistScan.js"
    );

    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const discoveryResults =
      discoveryModule.runDiscoveryScan
        ? (await discoveryModule.runDiscoveryScan()).canonical
        : [];

    return Object.freeze(
      runWatchlistScan({ discoveryResults })
    );
  });

  /* =========================================================
     WATCHLIST CANDIDATES — COGNITION LAYER (D10.5)
     ========================================================= */
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

    if (typeof runWatchlistScan !== "function") {
      throw new Error("WATCHLIST_ENGINE_INVALID");
    }

    if (typeof buildWatchlistCandidates !== "function") {
      throw new Error("WATCHLIST_CANDIDATES_ORCHESTRATOR_INVALID");
    }

    const discoveryResults =
      discoveryModule.runDiscoveryScan
        ? (await discoveryModule.runDiscoveryScan()).canonical
        : [];

    const baseWatchlist = runWatchlistScan({ discoveryResults });

    return Object.freeze(
      buildWatchlistCandidates({
        watchlistResult: baseWatchlist,
        discoveryResults
      })
    );
  });

  /* =========================================================
     DISCOVERY DIVERGENCE EXPLANATIONS — SHADOW (D11.4)
     ========================================================= */
  ipcMain.handle("discovery:divergence:explanations", async () => {
    const discoveryModule = await import(
      "../../engine/discovery/runDiscoveryScan.js"
    );

    const liveMarketModule = await import(
      "../../engine/market/live/liveMarketSnapshotService.js"
    );

    const explanationModule = await import(
      "../../engine/discovery/explain/divergenceExplanationEngine.js"
    );

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan ||
      discoveryModule.default?.runDiscoveryScan;

    const getLiveMarketSnapshot =
      liveMarketModule.getLiveMarketSnapshot ||
      liveMarketModule.default?.getLiveMarketSnapshot;

    const buildDivergenceExplanations =
      explanationModule.buildDivergenceExplanations ||
      explanationModule.default?.buildDivergenceExplanations;

    if (typeof runDiscoveryScan !== "function") {
      throw new Error("DISCOVERY_ENGINE_INVALID");
    }

    if (typeof getLiveMarketSnapshot !== "function") {
      throw new Error("LIVE_MARKET_SNAPSHOT_INVALID");
    }

    if (typeof buildDivergenceExplanations !== "function") {
      throw new Error("DIVERGENCE_EXPLANATION_ENGINE_INVALID");
    }

    const discovery = await runDiscoveryScan();
    const symbols = discovery.canonical.map(r => r.symbol.symbol);

    const liveSnapshot = await getLiveMarketSnapshot({ symbols });

    return Object.freeze(
      buildDivergenceExplanations({
        discoveryResults: discovery.canonical,
        liveMarketData: liveSnapshot.data || []
      })
    );
  });
}
