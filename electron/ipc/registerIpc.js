// electron/ipc/registerIpc.js
// IPC Registry — Authoritative (DET)
// - Renderer calls window.jupiter.invoke(channel, payload)
// - Handlers registered ONCE (we remove existing handler first)
// - Must include stubs for tabs that expect IPC (Discovery/Watchlist)

import { createRequire } from "module";

import { registerGrowthEngineIpc } from "./growthEngineIpc.js";
import { registerSignalsIpc } from "./signalsIpc.js";
import { registerGrowthCapitalTrajectoryV2Ipc } from "./growthCapitalTrajectoryV2Ipc.js";

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
   =========================
   engine/data/holdings.js is CommonJS: module.exports = [...]
   Contains objects: symbol, qty, totalCostBasis, assetClass, currency
*/
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

function persistHoldingsFull(next) {
  const fs = require("fs");
  const path = require("path");

  const abs = path.resolve(process.cwd(), "engine/data/holdings.js");

  const content = `/**
 * JUPITER — Canonical Holdings Authority (V1)
 * AUTO-GENERATED — DO NOT EDIT MANUALLY
 */
module.exports = ${JSON.stringify(next, null, 2)};
`;

  fs.writeFileSync(abs,mad(content), "utf8");

  // local helper to ensure string
  function mad(s) { return String(s); }
}

function findIndexBySymbol(holdings, symbol) {
  const sym = normalizeSymbol(symbol);
  return holdings.findIndex(h => h.symbol === sym);
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
  // Existing registries
  registerGrowthEngineIpc(ipcMain);

  registerSignalsIpc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  registerGrowthCapitalTrajectoryV2Ipc(ipcMain, async () => {
    return await getCachedSnapshot();
  });

  // =========================
  // PORTFOLIO — AUTHORITATIVE
  // =========================
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
  // PORTFOLIO ACTIONS — MUTATION (DISK)
  // Expected channels:
  // - portfolio:addHolding      payload: { symbol, qty, assetClass?, totalCostBasis?, currency? }
  // - portfolio:updateHolding   payload: { symbol, qty, assetClass?, totalCostBasis?, currency? }
  // - portfolio:removeHolding   payload: { symbol }
  // =========================
  registerHandler(ipcMain, "portfolio:addHolding", async (_event, payload) => {
    const symbol = normalizeSymbol(payload?.symbol);
    const qty = asNumber(payload?.qty);

    if (!symbol) throw new Error("INVALID_SYMBOL");
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("INVALID_QTY");

    const holdings = loadHoldingsFull();
    if (findIndexBySymbol(holdings, symbol) >= 0) throw new Error("HOLDING_ALREADY_EXISTS");

    holdings.push({
      symbol,
      qty,
      totalCostBasis: Number.isFinite(asNumber(payload?.totalCostBasis)) ? asNumber(payload.totalCostBasis) : 0,
      assetClass: payload?.assetClass === "crypto" ? "crypto" : "equity",
      currency: String(payload?.currency || "CAD")
    });

    persistHoldingsFull(holdings);
    cachedSnapshot = null;

    // Return updated valuation so UI can refresh deterministically
    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  registerHandler(ipcMain, "portfolio:updateHolding", async (_event, payload) => {
    const symbol = normalizeSymbol(payload?.symbol);
    const qty = asNumber(payload?.qty);

    if (!symbol) throw new Error("INVALID_SYMBOL");
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("INVALID_QTY");

    const holdings = loadHoldingsFull();
    const idx = findIndexBySymbol(holdings, symbol);
    if (idx < 0) throw new Error("HOLDING_NOT_FOUND");

    const next = {
      ...holdings[idx],
      qty
    };

    if (payload?.totalCostBasis != null) {
      const tcb = asNumber(payload.totalCostBasis);
      if (!Number.isFinite(tcb) || tcb < 0) throw new Error("INVALID_TOTAL_COST_BASIS");
      next.totalCostBasis = tcb;
    }
    if (payload?.assetClass) {
      next.assetClass = payload.assetClass === "crypto" ? "crypto" : "equity";
    }
    if (payload?.currency) {
      next.currency = String(payload.currency);
    }

    holdings[idx] = next;

    persistHoldingsFull(holdings);
    cachedSnapshot = null;

    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  registerHandler(ipcMain, "portfolio:removeHolding", async (_event, payload) => {
    const symbol = normalizeSymbol(payload?.symbol);
    if (!symbol) throw new Error("INVALID_SYMBOL");

    const holdings = loadHoldingsFull();
    const idx = findIndexBySymbol(holdings, symbol);
    if (idx < 0) throw new Error("HOLDING_NOT_FOUND");

    holdings.splice(idx, 1);

    persistHoldingsFull(holdings);
    cachedSnapshot = null;

    const snap = await getCachedSnapshot();
    return snap.portfolio;
  });

  // =========================
  // INSIGHTS
  // =========================
  registerHandler(ipcMain, "insights:compute", async () => {
    const snap = await getCachedSnapshot();
    return computeInsights(snap);
  });

  // =========================
  // DISCOVERY — AUTONOMOUS
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
  // WATCHLIST (STUB) — REQUIRED BY DISCOVERY LAB UI
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
  // MOONSHOT — TELEMETRY (READ-ONLY)
  // =========================
  import("./asymmetryTelemetryIpc.js").then(module => {
    module.registerAsymmetryTelemetryIpc(ipcMain);
  });

  // =========================
  // 🟢 MOONSHOT — REGISTRY (READ-ONLY, APPEND-ONLY)
  // =========================
  registerMoonshotRegistryIpc(ipcMain);
}
