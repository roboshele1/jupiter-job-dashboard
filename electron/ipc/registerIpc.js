// electron/ipc/registerIpc.js
// IPC Registry — Authoritative (DET)
// Session 7: added registerMarketRegimeIpc

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { registerPortfolioIpc } from "./portfolioIpc.js";
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";
import { registerPortfolioTechnicalSignalsIpc } from "./portfolioTechnicalSignalsIpc.js";
import { registerSystemStateIpc } from "./systemStateIpc.js";
import { registerKellyDecisionsIpc } from "./kellyDecisionsIpc.js";
import { registerCryptoPriceBridge } from "../../engine/ipc/cryptoPriceBridge.js";
import { registerMarketRegimeIpc } from "./marketRegimeIpc.js";   // ← Session 7

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";
import { getLivePrices } from "../../engine/market/getLivePrices.js";
import { registerMoonshotRegistryIpc } from "../../engine/asymmetry/registry/moonshotRegistryIpc.js";
import { registerRiskCentreIpc } from "./riskCentreIpc.js";

const require = createRequire(import.meta.url);

let cachedSnapshot = null;

const __ipc_filename = fileURLToPath(import.meta.url);
const __ipc_dirname  = path.dirname(__ipc_filename);
const HOLDINGS_JSON  = path.resolve(__ipc_dirname, "../../engine/data/users/default/holdings.json");

function normalizeSymbol(symbol) {
  return String(symbol || "").trim().toUpperCase();
}

function asNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function loadHoldingsFull() {
  let raw;
  try {
    raw = fs.readFileSync(HOLDINGS_JSON, "utf-8");
  } catch (err) {
    console.error("[registerIpc] Cannot read holdings.json:", err.message);
    throw new Error("HOLDINGS_FILE_MISSING");
  }

  const h = JSON.parse(raw);
  if (!Array.isArray(h)) throw new Error("HOLDINGS_FILE_INVALID");

  console.log(`[registerIpc] Loaded ${h.length} holdings from holdings.json`);

  return h.map(x => ({
    symbol:         normalizeSymbol(x.symbol),
    qty:            asNumber(x.qty),
    totalCostBasis: asNumber(x.totalCostBasis),
    assetClass:     x.assetClass === "crypto" ? "crypto" : "equity",
    currency:       String(x.currency || "CAD")
  }));
}

async function computeSnapshot() {
  const HOLDINGS = loadHoldingsFull();

  const valuation = await valuePortfolio(
    HOLDINGS.map(h => ({
      symbol:         h.symbol,
      qty:            h.qty,
      assetClass:     h.assetClass,
      totalCostBasis: h.totalCostBasis,
      currency:       h.currency
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

function registerHandler(ipcMain, channel, fn) {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, fn);
}

export function registerAllIpc(ipcMain) {
  registerPortfolioIpc();
  registerGrowthEngineIpc(ipcMain);
  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });
  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerKellyDecisionsIpc(ipcMain);

  // ── Priority 1: Crypto live price (Coinbase) ──────────────────────────────
  registerCryptoPriceBridge(ipcMain);

  // ── Market Regime — macro context for MarketMonitor tab ───────────────────
  registerMarketRegimeIpc(ipcMain);

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

  // ── Holdings cache invalidation — call after Manage Holdings saves ────────
  registerHandler(ipcMain, "holdings:invalidate", async () => {
    console.log("[IPC] holdings:invalidate — busting snapshot cache");
    cachedSnapshot = null;
    return { success: true, timestamp: Date.now() };
  });

  registerPortfolioTechnicalSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerSystemStateIpc(ipcMain);
  registerRiskCentreIpc(ipcMain);

  registerHandler(ipcMain, "insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  registerHandler(ipcMain, "discovery:run", async () => {
    const discoveryModule = await import("../../engine/discovery/runDiscoveryScan.js");
    const themeModule     = await import("../../engine/discovery/orchestrator/discoveryThemeOrchestrator.js");

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

  registerHandler(ipcMain, "discovery:evaluation:rejected", async () => {
    const discoveryModule = await import("../../engine/discovery/runDiscoveryScan.js");

    const runDiscoveryScan =
      discoveryModule.runDiscoveryScan || discoveryModule.default?.runDiscoveryScan;

    if (!runDiscoveryScan) throw new Error("DISCOVERY_PIPELINE_INVALID");

    const results = await runDiscoveryScan();

    return Object.freeze({
      contract:  "DISCOVERY_REJECTED_V1",
      timestamp: Date.now(),
      rejected:  Array.isArray(results.rejected) ? results.rejected : []
    });
  });

  registerHandler(ipcMain, "discovery:analyze:symbol", async (_event, payload) => {
    if (!payload || typeof payload.symbol !== "string") {
      throw new Error("INVALID_PAYLOAD");
    }

    const resolution = await resolveInvestableSymbol(payload.symbol);
    if (!resolution?.valid) {
      throw new Error("INVALID_SYMBOL");
    }

    const engineModule     = await import("../../engine/discovery/discoveryEngine.js");
    const runDiscoveryEngine =
      engineModule.runDiscoveryEngine || engineModule.default?.runDiscoveryEngine;

    if (typeof runDiscoveryEngine !== "function") {
      throw new Error("DISCOVERY_ENGINE_INVALID");
    }

    const engineResult = await runDiscoveryEngine({
      symbol:    resolution.symbol,
      assetType: resolution.assetClass,
      ownership: payload.ownership === true
    });

    const priceMap = await getLivePrices([resolution.symbol]).catch(() => ({}));
    const priceData = priceMap[resolution.symbol] || { price: null, source: "unavailable" };

    return Object.freeze({
      mode:       "MANUAL_RESEARCH",
      resolution,
      price:      priceData,
      result: Object.freeze({
        ...engineResult,
        symbol: {
          symbol:     resolution.symbol,
          name:       resolution.name || resolution.symbol,
          exchange:   resolution.exchange   || null,
          assetClass: resolution.assetClass || null
        }
      })
    });
  });

  registerHandler(ipcMain, "watchlist:candidates", async () => {
    return Object.freeze({
      contract:  "WATCHLIST_CANDIDATES_V0_STUB",
      timestamp: Date.now(),
      candidates: [],
      note:      "Stubbed — engine to be wired later"
    });
  });

  import("./asymmetryTelemetryIpc.js").then(module => {
    module.registerAsymmetryTelemetryIpc(ipcMain);
  });

  registerMoonshotRegistryIpc(ipcMain);

  // ─── MEMORY LAYER IPC ───────────────────────────────────────────────────────
  registerHandler(ipcMain, "memory:recordAIInteraction", async (_, payload) => {
    const { recordAIInteraction } = await import("../../engine/learning/jupiterMemory.js");
    recordAIInteraction(payload);
    return { ok: true };
  });
  registerHandler(ipcMain, "memory:getSummary", async () => {
    const { getMemorySummary } = await import("../../engine/learning/jupiterMemory.js");
    return getMemorySummary();
  });
  registerHandler(ipcMain, "memory:getRecentEvents", async (_, n) => {
    const { getRecentEvents } = await import("../../engine/learning/jupiterMemory.js");
    return getRecentEvents(n || 50);
  });

  // ─── LCPE FEEDBACK LOOP IPC ──────────────────────────────────────────────────
  registerHandler(ipcMain, "lcpe:recordExecution", async (_, payload) => {
    const { recordLCPEExecution } = await import("../../engine/learning/lcpeFeedbackLoop.js");
    recordLCPEExecution(payload);
    return { ok: true };
  });
  registerHandler(ipcMain, "lcpe:scorePending", async () => {
    const { scorePendingExecutions } = await import("../../engine/learning/lcpeFeedbackLoop.js");
    return scorePendingExecutions(process.env.POLYGON_API_KEY);
  });
  registerHandler(ipcMain, "lcpe:getFeedbackSummary", async () => {
    const { getLCPEFeedbackSummary } = await import("../../engine/learning/lcpeFeedbackLoop.js");
    return getLCPEFeedbackSummary();
  });

  
  // ─── HOLDINGS CRUD IPC ───────────────────────────────────────────────────────
  registerHandler(ipcMain, "holdings:getRaw", async () => {
    const raw = fs.readFileSync(HOLDINGS_JSON, "utf-8");
    return JSON.parse(raw);
  });

  registerHandler(ipcMain, "holdings:upsert", async (_, payload) => {
    if (!payload?.symbol) throw new Error("INVALID_PAYLOAD: symbol required");
    let holdings = [];
    try {
      const raw = fs.readFileSync(HOLDINGS_JSON, "utf-8");
      holdings = JSON.parse(raw);
      if (!Array.isArray(holdings)) holdings = [];
    } catch { holdings = []; }

    const idx = holdings.findIndex(h =>
      String(h.symbol).toUpperCase() === String(payload.symbol).toUpperCase()
    );
    const record = {
      symbol:         String(payload.symbol).toUpperCase(),
      qty:            Number(payload.qty),
      assetClass:     payload.assetClass === "crypto" ? "crypto" : payload.assetClass === "etf" ? "etf" : "equity",
      totalCostBasis: Number(payload.totalCostBasis),
      currency:       String(payload.currency || "CAD"),
    };

    if (idx >= 0) {
      holdings[idx] = record;
      console.log(`[IPC] holdings:upsert — updated ${record.symbol}`);
    } else {
      holdings.push(record);
      console.log(`[IPC] holdings:upsert — added ${record.symbol}`);
    }

    fs.writeFileSync(HOLDINGS_JSON, JSON.stringify(holdings, null, 2), "utf-8");
    cachedSnapshot = null;
    return { ok: true, action: idx >= 0 ? "updated" : "added", symbol: record.symbol };
  });

  registerHandler(ipcMain, "holdings:delete", async (_, payload) => {
    if (!payload?.symbol) throw new Error("INVALID_PAYLOAD: symbol required");
    const raw = fs.readFileSync(HOLDINGS_JSON, "utf-8");
    let holdings = JSON.parse(raw);
    if (!Array.isArray(holdings)) throw new Error("HOLDINGS_FILE_INVALID");

    const before = holdings.length;
    holdings = holdings.filter(h =>
      String(h.symbol).toUpperCase() !== String(payload.symbol).toUpperCase()
    );
    if (holdings.length === before) throw new Error(`SYMBOL_NOT_FOUND: ${payload.symbol}`);

    fs.writeFileSync(HOLDINGS_JSON, JSON.stringify(holdings, null, 2), "utf-8");
    cachedSnapshot = null;
    console.log(`[IPC] holdings:delete — removed ${payload.symbol}`);
    return { ok: true, symbol: payload.symbol };
  });

  console.log("[IPC] All handlers registered: crypto price bridge, discovery rejected, Kelly Decisions, Market Regime \u2713");
}
