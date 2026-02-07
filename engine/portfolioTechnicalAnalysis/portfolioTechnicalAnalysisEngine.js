// engine/portfolioTechnicalAnalysis/portfolioTechnicalAnalysisEngine.js
// Portfolio Technical Analysis Engine — V1 (ALWAYS-ON, EQUITIES ONLY)
//
// Contract:
// - Deterministic
// - Read-only
// - ALWAYS runs for ALL holdings
// - Explicitly scoped to EQUITIES
// - Crypto is EXCLUDED by design (not failure)
//
// Invariants:
// - No silence
// - No mixed asset semantics
// - No trading advice
//
// Inputs:
// - portfolio.positions
// - portfolio.marketData (MARKETDATA_SNAPSHOT_V1)
//
// Outputs:
// - Per-symbol technical state or explicit exclusion

function sma(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function classifyTrend(price, sma50, sma200w) {
  if (!price || !sma50 || !sma200w) return "UNKNOWN";
  if (price > sma50 && sma50 > sma200w) return "UPTREND";
  if (price < sma50 && sma50 < sma200w) return "DOWNTREND";
  return "RANGE";
}

function classifyMomentum(price, sma20) {
  if (!price || !sma20) return "UNKNOWN";
  if (price > sma20 * 1.02) return "STRONG";
  if (price < sma20 * 0.98) return "WEAK";
  return "NEUTRAL";
}

function classifyLocation(price, highs) {
  if (!price || !Array.isArray(highs) || highs.length === 0) return "UNKNOWN";

  const high = Math.max(...highs);
  const low = Math.min(...highs);
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
  if (
    !portfolioSnapshot ||
    !Array.isArray(portfolioSnapshot.positions) ||
    !portfolioSnapshot.marketData ||
    !portfolioSnapshot.marketData.symbols
  ) {
    throw new Error("PORTFOLIO_TECHNICAL_ANALYSIS_INVALID_INPUT");
  }

  const out = {};
  const asOf = new Date().toISOString();

  for (const position of portfolioSnapshot.positions) {
    const symbol = position.symbol;

    // 🔒 HARD SCOPE: EQUITIES ONLY
    if (position.assetClass !== "equity") {
      out[symbol] = Object.freeze({
        symbol,
        state: "EXCLUDED",
        reason: "ASSET_CLASS_NOT_SUPPORTED",
        assetClass: position.assetClass,
      });
      continue;
    }

    const md = portfolioSnapshot.marketData.symbols[symbol];

    if (!md || !Array.isArray(md.dailyCloses) || md.dailyCloses.length === 0) {
      out[symbol] = Object.freeze({
        symbol,
        state: "UNAVAILABLE",
        reason: "NO_MARKET_DATA",
        assetClass: "equity",
        source: md?.source || "unavailable",
      });
      continue;
    }

    const daily = md.dailyCloses;
    const weekly = Array.isArray(md.weeklyCloses) ? md.weeklyCloses : [];

    const price = daily[daily.length - 1] ?? null;

    const sma20 = sma(daily, 20);
    const sma50 = sma(daily, 50);
    const sma200w = sma(weekly, 40); // ~200 trading weeks

    out[symbol] = Object.freeze({
      symbol,
      assetClass: "equity",
      state: "ANALYZED",
      price,
      trend: classifyTrend(price, sma50, sma200w),
      momentum: classifyMomentum(price, sma20),
      location: classifyLocation(price, daily),
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
    scope: "EQUITIES_ONLY",
    asOf,
    symbols: Object.freeze(out),
  });
}

export default Object.freeze({ buildPortfolioTechnicalAnalysis });
