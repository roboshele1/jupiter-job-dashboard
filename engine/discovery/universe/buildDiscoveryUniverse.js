/**
 * D7.6 + D7.7 — Autonomous Discovery Universe Builder
 * ---------------------------------------------------
 * Produces a deterministic base universe with metadata
 * used for regime-aware filtering.
 */

function buildDiscoveryUniverse() {
  return Object.freeze([
    { symbol: "AAPL", tags: ["quality", "cash_flow"] },
    { symbol: "MSFT", tags: ["quality", "cash_flow"] },
    { symbol: "NVDA", tags: ["growth", "high_beta"] },
    { symbol: "AMZN", tags: ["growth"] },
    { symbol: "META", tags: ["growth"] },
    { symbol: "GOOGL", tags: ["quality"] },
    { symbol: "ARM", tags: ["speculative", "high_beta"] },
    { symbol: "SMCI", tags: ["high_beta", "cyclical"] },
    { symbol: "COIN", tags: ["speculative", "high_beta"] },
    { symbol: "BTC", tags: ["speculative"] },
    { symbol: "ETH", tags: ["speculative"] },
    { symbol: "NEE", tags: ["defensive"] },
    { symbol: "URA", tags: ["real_assets"] },
  ]);
}

module.exports = Object.freeze({
  buildDiscoveryUniverse,
});
