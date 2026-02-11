// electron/ipc/registerIpc.js
// IPC Registry — Authoritative (DET)
// - Renderer calls window.jupiter.invoke(channel, payload)
// - Handlers registered ONCE (we remove existing handler first)
// - Must include stubs for tabs that expect IPC (Discovery/Watchlist)

import { createRequire } from "module";

/* ✅ PORTFOLIO MUTATION IPC (AUTHORITATIVE) */
import { registerPortfolioIpc } from "./portfolioIpc.js";

import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

/* 🟢 APPEND-ONLY: PORTFOLIO TECHNICAL SIGNALS IPC */
import { registerPortfolioTechnicalSignalsIpc } from "./portfolioTechnicalSignalsIpc.js";

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";

/* ============================
   🟢 APPEND-ONLY: MOONSHOT REGISTRY IPC
   ============================ */
import { registerMoonshotRegistryIpc } from "../../engine/asymmetry/registry/moonshotRegistryIpc.js";

const require = createRequire(import.meta.url);

let cachedSnapshot = null;

/* =========================
   HOLDINGS AUTHORITY (DISK)
   ========================= */
const HOLDINGS_PATH = "../../engine/data/holdings.js";

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function loadHoldingsFull() {
  const resolved = require.resolve(HOLDINGS_PATH);
  delete require.cache[resolved];

  const h = require(HOLDINGS_PATH);
  if (!Array.isArray(h)) throw new Error("HOLDINGS_FILE_INVALID");

  return h.map(x => ({
    symbol: normalizeSymbol(x.symbol),
    qty: asNumber(x.qty),
    totalCostBasis: asNumber(x.totalCostBasis),
    assetClass: x.assetClass === "crypto" ? "crypto" : "equity",
    currency: String(x.currency || "CAD")
  }));
}

/* =========================
   SNAPSHOT AUTHORITY
   ========================= */
async function computeSnapshot() {
  const HOLDINGS = loadHoldingsFull();

  const valuation = await valuePortfolio(
    HOLDINGS.map(h => ({
      symbol: h.symbol,
      qty: h.qty,
      assetClass: h.assetClass,
      totalCostBasis: h.totalCostBasis,
      currency: h.currency
    }))
  );

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
   SAFE REGISTRATION (NO DUPES)
   ========================= */
function registerHandler(ipcMain, channel, fn) {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, fn);
}

/* =========================
   REGISTER ALL IPC
   ============================ */
export function registerAllIpc(ipcMain) {
  // ✅ 1) PORTFOLIO MUTATION CONTRACTS (add/update/remove)
  // Must be registered so portfolio:add, portfolio:update, portfolio:remove exist.
  registerPortfolioIpc();

  // Existing registries
  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // PORTFOLIO — AUTHORITATIVE (READ)
  // =========================
  // We intentionally re-register portfolio:getSnapshot using safe removeHandler
  // so it never collides and always returns the cached snapshot form expected by UI.
  registerHandler(ipcMain, "portfolio:getSnapshot", async () => {
    return await getCachedSnapshot();
  });

  registerHandler(ipcMain, "portfolio:getValuation", async () => {
    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  registerHandler(ipcMain, "portfolio:refreshValuation", async () => {
    cachedSnapshot = null;
    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  // =========================
  // 🟢 PORTFOLIO — TECHNICAL SIGNALS (READ-ONLY)
  // =========================
  registerPortfolioTechnicalSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // INSIGHTS
  // =========================
  registerHandler(ipcMain, "insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  // =========================
  // DISCOVERY — AUTONOMOUS ✅ (THIS FIXES discovery:run)
  // =========================
  registerHandler(ipcMain, "discovery:run", async () => {
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
  registerHandler(ipcMain, "discovery:analyze:symbol", async (_event, payload) => {
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
  registerHandler(ipcMain, "watchlist:candidates", async () => {
    return Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: [],
      note: "Stubbed — engine to be wired later"
    });
  });

  // =========================
  // MOONSHOT — TELEMETRY ✅ (THIS FIXES asymmetry:telemetry:get)
  // =========================
  import("./asymmetryTelemetryIpc.js").then(module => {
    module.registerAsymmetryTelemetryIpc(ipcMain);
  });

  // =========================
  // MOONSHOT — REGISTRY
  // =========================
  registerMoonshotRegistryIpc(ipcMain);
}

