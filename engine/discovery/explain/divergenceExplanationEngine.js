/**
 * D11.4 — Discovery vs Live Market Divergence Explanation Engine
 * ---------------------------------------------------------------
 * Purpose:
 * Explain why live market behavior may differ from discovery conclusions.
 *
 * Rules:
 * - Read-only
 * - Deterministic
 * - No decisions
 * - No price-driven logic
 * - Explanatory only
 */

function buildDivergenceExplanations({
  discoveryResults = [],
  liveMarketData = []
} = {}) {
  if (!Array.isArray(discoveryResults)) {
    throw new Error("INVALID_INPUT: discoveryResults must be an array");
  }

  if (!Array.isArray(liveMarketData)) {
    throw new Error("INVALID_INPUT: liveMarketData must be an array");
  }

  const liveBySymbol = new Map(
    liveMarketData.map(d => [d.symbol, d])
  );

  const explanations = discoveryResults.map(d => {
    const symbol = d.symbol?.symbol;
    const live = liveBySymbol.get(symbol);

    if (!symbol || !live) return null;

    const conviction = d.conviction?.normalized ?? null;
    const regime = d.regime?.label ?? "UNKNOWN";
    const decision = d.decision?.decision ?? "UNDEFINED";

    return Object.freeze({
      symbol,
      discoveryDecision: decision,
      convictionNormalized: conviction,
      regimeAtDiscovery: regime,
      liveMarketContext: {
        price: live.price,
        marketState: live.marketState,
        volume: live.volume
      },
      summary:
        "Live market behavior diverges from discovery conclusions due to short-term price dynamics operating independently of structural conviction.",
      interpretation:
        "Discovery operates on slow-moving fundamentals and regime alignment, while live prices may reflect liquidity, positioning, or sentiment. This divergence does not invalidate discovery output.",
      disclaimer:
        "This explanation is descriptive only. It does not imply timing, prediction, or action."
    });
  }).filter(Boolean);

  return Object.freeze({
    metadata: Object.freeze({
      contract: "DISCOVERY_DIVERGENCE_EXPLANATIONS_V1",
      generatedAt: new Date().toISOString(),
      explanationCount: explanations.length
    }),
    explanations
  });
}

module.exports = Object.freeze({
  buildDivergenceExplanations
});
