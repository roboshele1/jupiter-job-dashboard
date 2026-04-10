// electron/ipc/registerIpc.js
// IPC Registry — Authoritative (DET)
// Session 7: added registerMarketRegimeIpc

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { registerPortfolioValuesIpc } from "./portfolioValuesIpc.js";
import { registerHoldingsIpc } from "./holdingsIpc.js";
import { fileURLToPath } from "url";

import { registerPortfolioIpc } from "./portfolioIpc.js";
import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";
import { registerPortfolioTechnicalSignalsIpc } from "./portfolioTechnicalSignalsIpc.js";
import { registerSystemStateIpc } from "./systemStateIpc.js";
import { registerKellyDecisionsIpc } from "./kellyDecisionsIpc.js";
import { registerUnifiedDecisionsIpc } from "./unifiedDecisionsIpc.js";
import { registerInvestmentJournalIpc } from "./investmentJournalIpc.js";
import { registerPerformanceDashboardIpc } from "./performanceDashboardIpc.js";
import { registerRebalancingEngineIpc } from "./rebalancingEngineIpc.js";
import { registerInsightsIpc } from "./insightsIpc.js";
import { registerCryptoPriceBridge } from "../../engine/ipc/cryptoPriceBridge.js";
import { registerExecutionEngineIpc } from "./executionEngineIpc.js";
import { registerLearningLoopIpc } from "./learningLoopIpc.js";
import { registerDaemonControlIpc } from "./daemonControlIpc.js";
import { registerMarketRegimeIpc } from "./marketRegimeIpc.js";   // ← Session 7

import { valuePortfolio } from "../../engine/portfolio/portfolioValuation.js";
import { computeInsights } from "../../engine/insights/insightsEngine.js";
import { resolveInvestableSymbol } from "../../engine/symbolUniverse/resolveInvestableSymbol.js";
import { getLivePrices } from "../../engine/market/getLivePrices.js";
import { registerMoonshotRegistryIpc } from "../../engine/asymmetry/registry/moonshotRegistryIpc.js";
import { registerRiskCentreIpc } from "./riskCentreIpc.js";
import registerAsymmetryIpc from "./asymmetryIpc.js";

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
    assetClass:     x.assetClass === "crypto" ? "crypto" : x.assetClass === "etf" ? "etf" : "equity",
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

  const marketData = {};
  const positions = valuation.positions || [];
  positions.forEach(item => {
    marketData[item.symbol] = item.livePrice || 0;
  });

  cachedSnapshot = Object.freeze({
    timestamp: Date.now(),
    portfolio: valuation,
    marketData: marketData
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
  registerPortfolioValuesIpc();

  registerHoldingsIpc();
export function registerAllIpc(ipcMain) {
  ipcMain.handle("dca-audit:update-prices-live", async () => {
    const snap = await getCachedSnapshot();
    const { updateExecutionPricesFromSnapshot } = await import("../../engine/audit/dcaAuditEngine.js");
    return updateExecutionPricesFromSnapshot(snap.marketData);
  });
  registerPortfolioIpc();
  registerGrowthEngineIpc(ipcMain);
  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });
  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerKellyDecisionsIpc(ipcMain);
  registerUnifiedDecisionsIpc(ipcMain);
  registerInsightsIpc(ipcMain);
  registerRebalancingEngineIpc(ipcMain);
  registerExecutionEngineIpc(ipcMain);
  registerDaemonControlIpc(ipcMain, (data) => { /* broadcast to renderer */ });
  registerLearningLoopIpc(ipcMain);
  registerPerformanceDashboardIpc(ipcMain);
  registerInvestmentJournalIpc(ipcMain);

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
          name:       (resolution.name && resolution.name !== resolution.symbol.replace(".TO","").replace(".TSX",""))
                        ? resolution.name
                        : resolution.symbol,
          exchange:   resolution.exchange   || null,
          assetClass: resolution.assetClass || null,
          currency:   resolution.currency   || "USD",
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
  registerAsymmetryIpc(ipcMain);
  registerMoonshotHandlers(ipcMain);

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
  registerExecutionRecorder(ipcMain);
}

// Portfolio Constraints
export function registerPortfolioHandlers(ipcMain) {
  ipcMain.handle('portfolio:validateConstraints', async (event, { holdings, portfolioTypeId = 'CORE_GROWTH' }) => {
    try {
      const { validatePortfolioConstraints, generateRebalanceRecommendations } = await import('../../engine/constraintEngine.js');
      const { portfolioTypes } = await import('../../engine/portfolioTypes.js');
      const pt = portfolioTypes[portfolioTypeId] || portfolioTypes.CORE_GROWTH;
      const md = (holdings || []).reduce((a, h) => ({ ...a, [h.symbol]: { avgVolume: 5e6, dividendYield: 0 } }), {});
      const v = validatePortfolioConstraints(holdings || [], pt, md);
      return { ok: true, data: { validation: v, recommendations: generateRebalanceRecommendations(holdings || [], pt, md) } };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
}

// Moonshot Screener
export function registerMoonshotHandlers(ipcMain) {
  ipcMain.handle('moonshot:screen', async (event, { symbols, profiles, options }) => {
    try {
      const { getOverviewData, getIncomeStatement, getQuoteData } = await import('../../engine/alphaVantageConnector.js');
      const { extractGrowthProfile, scoreAgainstProfile, calculate2x3xProbability } = await import('../../engine/growthProfiler.js');

      const candidates = [];

      for (const symbol of symbols) {
        try {
          const overview = await getOverviewData(symbol);
          if (!overview || overview.marketCap < options.marketCapMin || overview.marketCap > options.marketCapMax) continue;

          const incomeStmt = await getIncomeStatement(symbol);
          if (!incomeStmt || incomeStmt.length < 2) continue;

          const profile = extractGrowthProfile(incomeStmt);
          if (!profile || profile.revenueCAGR < options.minRevenueCAGR) continue;

          let bestMatch = 0;
          for (const portfolioProfile of profiles) {
            const score = scoreAgainstProfile(profile, portfolioProfile);
            bestMatch = Math.max(bestMatch, score);
          }

          if (bestMatch < options.minTrajectoryScore) continue;

          const quote = await getQuoteData(symbol);
          if (!quote) continue;

          const prob2x = calculate2x3xProbability(quote.price, quote.price * 2, 12, 0.35);
          const prob3x = calculate2x3xProbability(quote.price, quote.price * 3, 24, 0.35);

          candidates.push({
            symbol: overview.symbol,
            name: overview.name,
            sector: overview.sector,
            currentPrice: quote.price,
            marketCap: overview.marketCap,
            peRatio: overview.peRatio,
            growth: {
              revenueCAGR: (profile.revenueCAGR * 100).toFixed(1) + '%',
              marginExpansion: (profile.marginExpansion * 100).toFixed(1) + '%',
              trajectoryScore: profile.trajectoryScore.toFixed(0)
            },
            technicals: {
              grossMargin: (overview.grossMargin * 100).toFixed(1) + '%',
              operatingMargin: (overview.operatingMargin * 100).toFixed(1) + '%'
            },
            targets: {
              prob2x: prob2x.probability,
              prob3x: prob3x.probability
            }
          });
        } catch (e) {
          console.error(`Error screening ${symbol}:`, e);
        }
      }

      return { ok: true, data: candidates.sort((a, b) => parseFloat(b.growth.trajectoryScore) - parseFloat(a.growth.trajectoryScore)) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

// Continuous Monitoring Daemon
export function registerDaemonHandlers(ipcMain) {
  ipcMain.handle('daemon:runMonitoring', async (event, { holdings }) => {
    try {
      const { runContinuousMonitoring } = await import('../../engine/continuousDaemon.js');
      const alerts = [];
      
      await runContinuousMonitoring(holdings, (alert) => {
        alerts.push(alert);
      });

      return { ok: true, data: alerts };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

function registerExecutionRecorder(ipcMain) {
  ipcMain.handle('execution:record', async (e, { symbol, entryPrice, kellySize, thesisType, conviction }) => {
    try {
      const { recordExecution } = await import('../../engine/execution/decisionRecorder.js');
      const result = recordExecution(symbol, entryPrice, kellySize, thesisType, conviction);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('execution:recordOutcome', async (e, { executionId, currentPrice, daysElapsed }) => {
    try {
      const { recordOutcome } = await import('../../engine/execution/decisionRecorder.js');
      const result = recordOutcome(executionId, currentPrice, daysElapsed);
      return { ok: true, data: result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('execution:getThesisAccuracy', async (e, { thesisType }) => {
    try {
      const { getThesisAccuracy } = await import('../../engine/execution/decisionRecorder.js');
      const accuracy = getThesisAccuracy(thesisType);
      return { ok: true, data: { thesisType, accuracy } };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
