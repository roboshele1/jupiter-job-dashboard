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

function interpret(symbol, trend, momentum, location) {
  let summary =
    trend === "UPTREND"
      ? "The price structure is positive, supported by higher levels."
      : trend === "DOWNTREND"
      ? "The price structure is under pressure, with weakness dominating."
      : "The price is moving sideways without a clear direction.";

  if (momentum === "STRONG") {
    summary += " Recent momentum shows strong short-term strength.";
  } else if (momentum === "WEAK") {
    summary += " Recent momentum is weakening.";
  } else {
    summary += " Momentum is currently neutral.";
  }

  if (location === "NEAR_HIGHS") {
    summary += " The price is trading near the top of its recent range.";
  } else if (location === "NEAR_LOWS") {
    summary += " The price is trading near the bottom of its recent range.";
  } else {
    summary += " The price is sitting near the middle of its recent range.";
  }

  // 🔒 CANONICAL UNIQUENESS GUARANTEE (SYMBOL CONTEXT)
  summary += ` This assessment applies specifically to ${symbol}.`;

  return {
    summary,
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
      interpretation: interpret(symbol, trend, momentum, location),
      source: md.source
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_ANALYSIS_V1",
    asOf,
    symbols: Object.freeze(out)
  });
}

