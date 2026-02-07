// Portfolio Technical Analysis Engine — V1 (ALWAYS-ON + INTERPRETATION)
//
// Contract:
// - Deterministic
// - Read-only
// - Runs for EVERY holding
// - No actions, no buy/sell/hold
// - Interpretation is descriptive, not prescriptive

function sma(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

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

function classifyLocation(price, highs, lows) {
  if (!price || !highs.length || !lows.length) return "UNKNOWN";
  const high = Math.max(...highs);
  const low = Math.min(...lows);
  const range = high - low;
  if (range === 0) return "UNKNOWN";
  const pct = (price - low) / range;
  if (pct > 0.8) return "NEAR_HIGHS";
  if (pct < 0.2) return "NEAR_LOWS";
  return "MID_RANGE";
}

/* =========================
   INTERPRETATION (APPENDED)
   ========================= */

function interpret(trend, momentum, location) {
  return {
    summary:
      trend === "UPTREND"
        ? "Price structure is positive with higher-level support intact."
        : trend === "DOWNTREND"
        ? "Price structure is under pressure with downside dominance."
        : "Price is consolidating without a clear directional bias.",

    trendContext:
      trend === "UPTREND"
        ? "Longer-term averages are aligned upward."
        : trend === "DOWNTREND"
        ? "Longer-term averages are stacked bearishly."
        : "Longer-term averages are mixed or flat.",

    momentumContext:
      momentum === "STRONG"
        ? "Short-term strength is elevated relative to recent history."
        : momentum === "WEAK"
        ? "Short-term momentum is deteriorating."
        : "Short-term momentum is neutral.",

    locationContext:
      location === "NEAR_HIGHS"
        ? "Price is trading near the upper end of its recent range."
        : location === "NEAR_LOWS"
        ? "Price is trading near the lower end of its recent range."
        : "Price is positioned near the middle of its recent range.",

    riskNote:
      location === "NEAR_HIGHS"
        ? "Upside continuation may require sustained momentum."
        : location === "NEAR_LOWS"
        ? "Downside risk remains elevated without structural improvement."
        : "Range resolution will determine the next directional move."
  };
}

/* =========================
   PUBLIC API
   ========================= */

export function buildPortfolioTechnicalAnalysis(portfolioSnapshot) {
  if (!portfolioSnapshot?.positions || !portfolioSnapshot?.marketData) {
    throw new Error("PORTFOLIO_TECHNICAL_ANALYSIS_INVALID_INPUT");
  }

  const out = {};
  const asOf = new Date().toISOString();

  for (const position of portfolioSnapshot.positions) {
    const symbol = position.symbol;
    const md = portfolioSnapshot.marketData.symbols?.[symbol];

    if (!md) {
      out[symbol] = { symbol, state: "UNAVAILABLE" };
      continue;
    }

    const daily = md.dailyCloses || [];
    const weekly = md.weeklyCloses || [];
    const price = daily[daily.length - 1] || null;

    const sma20 = sma(daily, 20);
    const sma50 = sma(daily, 50);
    const sma200w = sma(weekly, 40);

    const trend = classifyTrend(price, sma50, sma200w);
    const momentum = classifyMomentum(price, sma20);
    const location = classifyLocation(price, daily, daily);

    out[symbol] = Object.freeze({
      symbol,
      price,
      trend,
      momentum,
      location,
      movingAverages: { sma20, sma50, sma200w },
      interpretation: interpret(trend, momentum, location),
      source: md.source
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_ANALYSIS_V1",
    asOf,
    symbols: Object.freeze(out)
  });
}
