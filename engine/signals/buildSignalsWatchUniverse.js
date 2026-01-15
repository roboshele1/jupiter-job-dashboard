/**
 * SIGNALS — WATCH UNIVERSE BUILDER (V1)
 * ------------------------------------
 * PURPOSE:
 * - Define the ONLY symbols Signals is allowed to reason about
 * - Deterministic, read-only, auditable
 * - No scoring, no ranking, no UI coupling
 *
 * SOURCES (explicit):
 * 1. Current Portfolio holdings (authoritative ownership context)
 * 2. Discovery Lab surfaced symbols (pre-approved opportunity set)
 *
 * RULES:
 * - Small, bounded universe
 * - Explicit provenance per symbol
 * - No silent expansion
 * - No market-wide scans
 */

const { runDiscoveryScan } = require("../discovery/runDiscoveryScan.js");
const {
  getPortfolioSnapshot,
} = require("../portfolio/portfolioEngine.js");

const MAX_UNIVERSE_SIZE = 25;

async function buildSignalsWatchUniverse() {
  /* =========================
     SOURCE 1 — PORTFOLIO
     ========================= */
  let portfolioSymbols = [];
  try {
    const snap = getPortfolioSnapshot();
    portfolioSymbols = Array.isArray(snap?.positions)
      ? snap.positions.map((p) => p.symbol)
      : [];
  } catch {
    portfolioSymbols = [];
  }

  /* =========================
     SOURCE 2 — DISCOVERY
     ========================= */
  let discoverySymbols = [];
  try {
    const discovery = await runDiscoveryScan();
    discoverySymbols = Array.isArray(discovery?.surfaced)
      ? discovery.surfaced.map((r) => r.symbol)
      : [];
  } catch {
    discoverySymbols = [];
  }

  /* =========================
     NORMALIZATION
     ========================= */
  const provenance = {};
  const union = [];

  function add(symbol, source) {
    if (!symbol || union.includes(symbol)) return;
    union.push(symbol);
    provenance[symbol] = provenance[symbol]
      ? [...provenance[symbol], source]
      : [source];
  }

  portfolioSymbols.forEach((s) => add(s, "PORTFOLIO"));
  discoverySymbols.forEach((s) => add(s, "DISCOVERY"));

  const cappedUniverse = union.slice(0, MAX_UNIVERSE_SIZE);

  /* =========================
     RETURN (IMMUTABLE)
     ========================= */
  return Object.freeze({
    contract: "SIGNALS_WATCH_UNIVERSE_V1",
    generatedAt: new Date().toISOString(),
    universe: Object.freeze(cappedUniverse),
    provenance: Object.freeze(provenance),
    telemetry: Object.freeze({
      portfolioCount: portfolioSymbols.length,
      discoveryCount: discoverySymbols.length,
      unionCount: cappedUniverse.length,
      cap: MAX_UNIVERSE_SIZE,
    }),
  });
}

module.exports = Object.freeze({
  buildSignalsWatchUniverse,
});
