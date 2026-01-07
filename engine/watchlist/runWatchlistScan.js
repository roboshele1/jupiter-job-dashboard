/**
 * D10.7 — Watchlist Candidates Engine
 * ----------------------------------
 * Purpose:
 * Identify assets worth monitoring WITHOUT conviction.
 *
 * This engine:
 * - Does NOT rank
 * - Does NOT recommend actions
 * - Does NOT depend on price targets
 *
 * Output is read-only, deterministic, explainable.
 */

function runWatchlistScan({ discoveryResults = [] } = {}) {
  if (!Array.isArray(discoveryResults)) {
    throw new Error("INVALID_INPUT: discoveryResults must be an array");
  }

  const candidates = discoveryResults.filter((r) => {
    const normalized = r?.conviction?.normalized;
    return normalized != null && normalized >= 0.3 && normalized < 0.6;
  });

  const watchlist = candidates.map((r, idx) => ({
    watchId: `WATCH_${idx + 1}`,
    symbol: r.symbol?.symbol || "UNKNOWN",
    regime: r.regime?.label || "UNKNOWN",
    reason:
      "Asset shows mixed signals with insufficient conviction, warranting monitoring but not action.",
  }));

  return Object.freeze({
    metadata: Object.freeze({
      contract: "WATCHLIST_ENGINE_V1",
      generatedAt: new Date().toISOString(),
      inputCount: discoveryResults.length,
      watchlistCount: watchlist.length,
    }),
    watchlist,
  });
}

module.exports = Object.freeze({
  runWatchlistScan,
});
