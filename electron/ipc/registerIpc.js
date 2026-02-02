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

/* ============================
   🟢 APPEND-ONLY: MOONSHOT REGISTRY IPC
   ============================ */
import {
  registerMoonshotRegistryIpc
} from "../../engine/asymmetry/registry/moonshotRegistryIpc.js";

/* ============================
   🧩 PORTFOLIO ACTIONS ENGINE (CJS → ESM SAFE IMPORT)
   ============================ */
import portfolioEnginePkg from "../../engine/portfolio/portfolioEngine.js";

const {
  addHolding,
  updateHolding,
  removeHolding
} = portfolioEnginePkg;

/**
 * IPC Registry — Authoritative
 * -----------------------------
 * Read-only unless explicitly stated
 * Resolver-gated
 * No UI logic
 */

let cachedSnapshot = null;

/* =========================
   SNAPSHOT AUTHORITY
   ============================ */
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
   ============================ */
export function registerAllIpc(ipcMain) {
  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  /* =========================
     PORTFOLIO — READ
     ============================ */
  ipcMain.handle("portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  /* =========================
     PORTFOLIO — ACTIONS (ENGINE-BACKED)
     ============================ */
  ipcMain.handle("portfolio:addHolding", async (_event, payload) => {
    const result = await addHolding(payload);
    cachedSnapshot = null;
    return result;
  });

  ipcMain.handle("portfolio:updateHolding", async (_event, payload) => {
    const result = await updateHolding(payload);
    cachedSnapshot = null;
    return result;
  });

  ipcMain.handle("portfolio:removeHolding", async (_event, payload) => {
    const result = await removeHolding(payload);
    cachedSnapshot = null;
    return result;
  });

  /* =========================
     INSIGHTS
     ============================ */
  ipcMain.handle("insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  /* =========================
     DISCOVERY — AUTONOMOUS
     ============================ */
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

  /* =========================
     DISCOVERY — MANUAL
     ============================ */
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

  /* =========================
     STUBS / TELEMETRY
     ============================ */
  ipcMain.handle("watchlist:candidates", async () => {
    return Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: []
    });
  });

  import("./asymmetryTelemetryIpc.js").then(module => {
    module.registerAsymmetryTelemetryIpc(ipcMain);
  });

  registerMoonshotRegistryIpc(ipcMain);
}
