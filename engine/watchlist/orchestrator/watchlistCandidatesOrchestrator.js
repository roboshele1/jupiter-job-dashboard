/**
 * D10.5 — Watchlist Candidates Orchestrator
 * ----------------------------------------
 * Enriches WATCHLIST_ENGINE_V1 output into a cognition layer.
 *
 * Rules:
 * - Read-only
 * - Deterministic
 * - No ranking
 * - No recommendations
 * - No prices
 */

function buildWatchlistCandidates({
  watchlistResult = {},
  discoveryResults = [],
} = {}) {
  if (!watchlistResult || typeof watchlistResult !== "object") {
    throw new Error("INVALID_INPUT: watchlistResult must be an object");
  }
  if (!Array.isArray(discoveryResults)) {
    throw new Error("INVALID_INPUT: discoveryResults must be an array");
  }

  const watchlist = Array.isArray(watchlistResult.watchlist)
    ? watchlistResult.watchlist
    : [];

  // Helper to find discovery row for context
  const bySymbol = new Map(
    discoveryResults.map((r) => [r.symbol?.symbol, r])
  );

  const candidates = watchlist.map((w, idx) => {
    const ctx = bySymbol.get(w.symbol) || {};
    const normalized = ctx?.conviction?.normalized ?? 0;

    // Confidence qualifier (institutional semantics)
    const confidenceQualifier =
      normalized < 0.4 ? "Early" : normalized < 0.5 ? "Monitoring" : "Watching";

    // Monitor reason (why it’s here)
    const monitorReason =
      "Signals are mixed with improving components, but conviction remains insufficient for action.";

    // Upgrade / downgrade triggers (what would change)
    const upgradeTriggers = [
      "Sustained improvement in fundamental quality or growth factors",
      "Conviction normalization rising above 0.6",
      "Regime alignment strengthening relative to peers",
    ];

    const downgradeTriggers = [
      "Conviction normalization falling below 0.3",
      "Deterioration in fundamental or tactical signals",
      "Regime shift that structurally penalizes the asset",
    ];

    return Object.freeze({
      watchId: w.watchId || `WATCH_${idx + 1}`,
      symbol: w.symbol || "UNKNOWN",
      regime: w.regime || "UNKNOWN",
      monitorReason,
      confidenceQualifier,
      upgradeTriggers,
      downgradeTriggers,
    });
  });

  return Object.freeze({
    metadata: Object.freeze({
      contract: "WATCHLIST_CANDIDATES_V1",
      generatedAt: new Date().toISOString(),
      inputCount: watchlist.length,
      candidateCount: candidates.length,
    }),
    candidates,
  });
}

module.exports = Object.freeze({
  buildWatchlistCandidates,
});
