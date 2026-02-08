/**
 * Portfolio Technical Analysis Engine — V2 (WITH INTERPRETATION)
 *
 * Invariants:
 * - Always-on (never silent)
 * - One output per holding
 * - Deterministic
 * - Read-only
 * - Interpretation ALWAYS present
 */

function classifyTrend(price, sma50, sma200) {
  if (!price || !sma50 || !sma200) return "UNKNOWN";
  if (price > sma50 && sma50 > sma200) return "UPTREND";
  if (price < sma50 && sma50 < sma200) return "DOWNTREND";
  return "RANGE";
}

function classifyMomentum(price, sma20) {
  if (!price || !sma20) return "UNKNOWN";
  if (price > sma20 * 1.02) return "STRONG";
  if (price < sma20 * 0.98) return "WEAK";
  return "NEUTRAL";
}

function classifyLocation(price, low, high) {
  if (!price || high <= low) return "UNKNOWN";
  const pct = (price - low) / (high - low);
  if (pct > 0.8) return "NEAR_HIGHS";
  if (pct < 0.2) return "NEAR_LOWS";
  return "MID_RANGE";
}

function interpret({ trend, momentum, location }) {
  // Summary
  let summary = "Price is consolidating without a clear directional bias.";

  if (trend === "UPTREND" && momentum === "STRONG") {
    summary = "Price is in a strong uptrend with positive momentum.";
  } else if (trend === "DOWNTREND" && momentum === "WEAK") {
    summary = "Price is in a sustained downtrend with weak momentum.";
  } else if (trend === "UPTREND") {
    summary = "Price remains in an uptrend but momentum has moderated.";
  } else if (trend === "DOWNTREND") {
    summary = "Price remains in a downtrend but selling pressure is easing.";
  }

  return {
    summary,
    trendContext:
      trend === "UPTREND"
        ? "Price is above rising long-term averages."
        : trend === "DOWNTREND"
        ? "Price is below declining long-term averages."
        : "Long-term averages are mixed or flat.",
    momentumContext:
      momentum === "STRONG"
        ? "Short-term momentum is accelerating."
        : momentum === "WEAK"
        ? "Short-term momentum is deteriorating."
        : "Short-term momentum is neutral.",
    locationContext:
      location === "NEAR_HIGHS"
        ? "Price is trading near the top of its recent range."
        : location === "NEAR_LOWS"
        ? "Price is trading near the bottom of its recent range."
        : "Price is positioned near the middle of its recent range.",
    riskNote:
      trend === "RANGE"
        ? "Range resolution will determine the next directional move."
        : "Trend remains intact unless key levels are violated.",
  };
}

export function buildPortfolioTechnicalAnalysis(portfolioSnapshot) {
  if (
    !portfolioSnapshot?.positions ||
    !portfolioSnapshot?.marketData?.prices
  ) {
    throw new Error("PORTFOLIO_TECHNICAL_ANALYSIS_INVALID_INPUT");
  }

  const symbols = {};
  const asOf = new Date().toISOString();

  for (const p of portfolioSnapshot.positions) {
    const symbol = p.symbol;
    const price = p.livePrice;

    // Placeholder SMAs (until historical engine is layered)
    const sma20 = price || null;
    const sma50 = price || null;
    const sma200 = price || null;

    const trend = classifyTrend(price, sma50, sma200);
    const momentum = classifyMomentum(price, sma20);
    const location = classifyLocation(price, price * 0.9, price * 1.1);

    const interpretation = interpret({ trend, momentum, location });

    symbols[symbol] = Object.freeze({
      symbol,
      price,
      trend,
      momentum,
      location,
      interpretation,
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_ANALYSIS_V2",
    asOf,
    symbols: Object.freeze(symbols),
  });
}

export default Object.freeze({ buildPortfolioTechnicalAnalysis });
