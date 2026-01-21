// electron/ipc/registerIpc.js
import { ipcMain } from "electron";

import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

import { runCapitalTrajectoryV2 } from "../../engine/growth/capitalTrajectoryEngineV2.js";
import { buildSignalsV2Snapshot } from "../../engine/signals/signalsV2Engine.js";
import { buildRiskCentreIntelligenceV2 } from "../../engine/risk/riskCentreIntelligenceV2.js";

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

/* =========================
   DEMO MODE (APPEND-ONLY)
   ========================= */
import { isDemoMode } from "../../demo/demoMode.js";
import { registerDemoIpc } from "../../demo/ipc/demoIpcRegistry.js";

/**
 * IPC Registry — Authoritative
 * -----------------------------
 * Read-only IPC
 * Resolver-gated
 * No UI logic
 * No mutation
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

  /* =========================
     DEMO MODE GATE (APPEND-ONLY)
     ========================= */
  if (isDemoMode()) {
    console.log("[IPC] Demo mode active — registering demo IPC only");
    registerDemoIpc(ipcMain);
    return;
  }

  /* ===== LIVE MODE (UNCHANGED) ===== */

  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

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
    if (!resolution?.valid) {
      throw new Error("INVALID_SYMBOL");
    }

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
        symbol: resolution.symbol,
        assetType: resolution.assetClass,
        ownership: payload.ownership === true
      })
    });
  });

  // =========================
  // WATCHLIST (STUB)
  // =========================
  ipcMain.handle("watchlist:candidates", async () => {
    return Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: [],
      note: "Stubbed — engine to be wired later"
    });
  });

  // =========================
  // MOONSHOT — TELEMETRY (READ-ONLY)
  // =========================
  import("./asymmetryTelemetryIpc.js").then(module => {
    module.registerAsymmetryTelemetryIpc(ipcMain);
  });
}
