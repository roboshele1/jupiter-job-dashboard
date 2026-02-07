// engine/portfolioTechnicalAnalysis/portfolioTechnicalAnalysisEngine.js
// Portfolio Technical Analysis Engine — V1 (ALWAYS-ON)
//
// Contract:
// - Deterministic
// - Read-only
// - Runs for EVERY holding (no silence)
// - No trading advice, no actions
//
// Inputs:
// - portfolio.positions
// - portfolio.marketData (MARKETDATA_SNAPSHOT_V1)
//
// Outputs:
// - Per-symbol technical state (trend, momentum, location)

function sma(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
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

/**
 * PUBLIC API
 */
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
      out[symbol] = {
        symbol,
        state: "UNAVAILABLE",
        reason: "NO_MARKET_DATA",
      };
      continue;
    }

    const daily = md.dailyCloses || [];
    const weekly = md.weeklyCloses || [];

    const price = daily[daily.length - 1] || null;

    const sma20 = sma(daily, 20);
    const sma50 = sma(daily, 50);
    const sma200w = sma(weekly, 40); // ~200 trading weeks

    out[symbol] = Object.freeze({
      symbol,
      price,
      trend: classifyTrend(price, sma50, sma200w),
      momentum: classifyMomentum(price, sma20),
      location: classifyLocation(price, daily, daily),
      movingAverages: {
        sma20,
        sma50,
        sma200w,
      },
      source: md.source,
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_ANALYSIS_V1",
    asOf,
    symbols: Object.freeze(out),
  });
}

module.exports = Object.freeze({ buildPortfolioTechnicalAnalysis });
