/**
 * DISCOVERY UNIVERSE — PORTFOLIO-AUGMENTED (APPEND-ONLY)
 * ------------------------------------------------------
 * Purpose:
 * Ensure ALL portfolio holdings are ALWAYS evaluated by Discovery
 * every cycle, regardless of live market snapshot coverage.
 *
 * Rules preserved:
 * - No mutation of discovery scoring
 * - No biasing logic
 * - No ranking influence
 * - Pure universe expansion only
 */

const { getLiveMarketSnapshot } = require("../../market/live/liveMarketSnapshotService.js");

// -------------------------------
// PORTFOLIO HOLDINGS — FORCE INJECTION
// -------------------------------
const PORTFOLIO_SYMBOLS = Object.freeze([
  "NVDA",
  "ASML",
  "AVGO",
  "MSTR",
  "HOOD",
  "BMNR",
  "APLD",
  "BTC",
  "ETH",
  "NOW"
]);

// -------------------------------
// MAIN UNIVERSE BUILDER
// -------------------------------
async function buildDiscoveryUniverse() {
  // ---- Pull live market snapshot ----
  const snapshot = await getLiveMarketSnapshot();

  const rawUniverse = snapshot?.universe || [];

  // ---- Normalize snapshot universe ----
  const normalizedMarketUniverse = rawUniverse
    .map((u) => {
      if (typeof u === "string") return { symbol: u, tags: [] };
      if (u && typeof u.symbol === "string") {
        return { symbol: u.symbol, tags: u.tags || [] };
      }
      return null;
    })
    .filter(Boolean);

  // ---- PORTFOLIO INJECTION (APPEND-ONLY, NO FILTERING) ----
  const injectedPortfolioUniverse = PORTFOLIO_SYMBOLS.map((symbol) => ({
    symbol,
    tags: ["portfolio_forced"]
  }));

  // ---- MERGE MARKET + PORTFOLIO ----
  const mergedUniverseMap = new Map();

  normalizedMarketUniverse.forEach((asset) => {
    mergedUniverseMap.set(asset.symbol, asset);
  });

  injectedPortfolioUniverse.forEach((asset) => {
    if (!mergedUniverseMap.has(asset.symbol)) {
      mergedUniverseMap.set(asset.symbol, asset);
    }
  });

  const finalUniverse = Array.from(mergedUniverseMap.values());

  // ---- TELEMETRY ----
  const telemetry = {
    rawSnapshotCount: rawUniverse.length,
    normalizedMarketCount: normalizedMarketUniverse.length,
    portfolioInjectedCount: PORTFOLIO_SYMBOLS.length,
    finalUniverseCount: finalUniverse.length,
    volumeFloorUsed: snapshot?.telemetry?.volumeFloorUsed ?? null,
    notes: []
  };

  if (rawUniverse.length === 0) {
    telemetry.notes.push("Live market snapshot returned zero assets.");
  }

  if (normalizedMarketUniverse.length === 0 && rawUniverse.length > 0) {
    telemetry.notes.push(
      "Snapshot populated but normalization removed all market assets."
    );
  }

  telemetry.notes.push(
    "Portfolio holdings injected into Discovery universe (forced evaluation enabled)."
  );

  return {
    universe: finalUniverse,
    telemetry
  };
}

module.exports = {
  buildDiscoveryUniverse
};
