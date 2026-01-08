/**
 * D11.3 — Live Discovery Divergence Engine
 * ---------------------------------------
 * Purpose:
 * Compare Jupiter's internal discovery beliefs against live market reality
 * WITHOUT influencing decisions, rankings, or cognition.
 *
 * This engine is:
 * - Read-only
 * - Shadow mode only
 * - Deterministic
 * - Explainable
 *
 * Output = diagnostic insight, not action.
 */

function runLiveDiscoveryDivergence({
  discoveryResults = [],
  liveMarketSnapshot = {},
} = {}) {
  if (!Array.isArray(discoveryResults)) {
    throw new Error("INVALID_INPUT: discoveryResults must be an array");
  }

  if (
    !liveMarketSnapshot ||
    typeof liveMarketSnapshot !== "object" ||
    !Array.isArray(liveMarketSnapshot.data)
  ) {
    throw new Error("INVALID_INPUT: liveMarketSnapshot.data must be an array");
  }

  const liveBySymbol = new Map(
    liveMarketSnapshot.data.map((d) => [d.symbol, d])
  );

  const divergences = discoveryResults
    .map((d) => {
      const symbol = d.symbol?.symbol;
      if (!symbol) return null;

      const live = liveBySymbol.get(symbol);
      if (!live) return null;

      const conviction = d.conviction?.normalized ?? null;
      if (conviction == null) return null;

      const price = live.price;
      const open = live.open;

      if (!price || !open) return null;

      const intradayMovePct = ((price - open) / open) * 100;

      // Divergence logic (conservative, interpretable)
      let divergenceType = null;
      let explanation = null;

      if (conviction < 0.4 && intradayMovePct > 2) {
        divergenceType = "PRICE_OUTPACING_CONVICTION";
        explanation =
          "Market price strength exceeds Jupiter’s internal conviction assessment.";
      }

      if (conviction > 0.7 && intradayMovePct < -2) {
        divergenceType = "CONVICTION_OUTPACING_PRICE";
        explanation =
          "Jupiter’s conviction remains strong while market price weakens.";
      }

      if (!divergenceType) return null;

      return Object.freeze({
        symbol,
        divergenceType,
        convictionNormalized: conviction,
        intradayMovePct: Number(intradayMovePct.toFixed(2)),
        regime: d.regime?.label || "UNKNOWN",
        discoveryDecision: d.decision?.decision || "UNKNOWN",
        livePrice: price,
        explanation,
        disclaimer:
          "This divergence is observational only and does not affect decisions, rankings, or actions.",
      });
    })
    .filter(Boolean);

  return Object.freeze({
    metadata: Object.freeze({
      contract: "LIVE_DISCOVERY_DIVERGENCE_V1",
      mode: "SHADOW",
      generatedAt: new Date().toISOString(),
      discoveryCount: discoveryResults.length,
      divergenceCount: divergences.length,
    }),
    divergences,
  });
}

module.exports = Object.freeze({
  runLiveDiscoveryDivergence,
});
