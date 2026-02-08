// Portfolio Technical Analysis Engine — V1 (DETERMINISTIC)
//
// Contract:
// - Pure technical computation ONLY
// - No BUY / SELL / HOLD logic
// - No side effects
// - Safe for regime engines to consume

function sma(values, period) {
  if (!Array.isArray(values) || values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
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

function interpret(trend, momentum, location, symbol) {
  return {
    summary: `${symbol}: ${trend.toLowerCase()} trend, ${momentum.toLowerCase()} momentum, trading ${location.replace("_", " ").toLowerCase()}.`
  };
}

export function buildPortfolioTechnicalAnalysis({ positions = [], marketData = {} }) {
  if (!Array.isArray(positions)) {
    throw new Error("PORTFOLIO_TECHNICAL_ANALYSIS_INVALID_INPUT");
  }

  const out = {};
  const asOf = new Date().toISOString();

  for (const p of positions) {
    const symbol = p.symbol;
    const md = marketData?.symbols?.[symbol];

    if (!md) {
      out[symbol] = Object.freeze({
        symbol,
        trend: "UNKNOWN",
        momentum: "UNKNOWN",
        location: "UNKNOWN"
      });
      continue;
    }

    const daily = md.dailyCloses || [];
    const weekly = md.weeklyCloses || [];
    const price = daily[daily.length - 1] ?? null;

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
      interpretation: interpret(trend, momentum, location, symbol),
      source: md.source
    });
  }

  return Object.freeze({
    contract: "PORTFOLIO_TECHNICAL_ANALYSIS_V1",
    asOf,
    symbols: Object.freeze(out)
  });
}

export default Object.freeze({ buildPortfolioTechnicalAnalysis });
