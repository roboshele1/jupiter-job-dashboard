// Market Data Sufficiency Gate — V1 (AUTHORITATIVE)
//
// Purpose:
// - Prevents regime decisions without enough historical data
// - Ensures BUY / HOLD / TRIM are structurally valid
// - Emits deterministic eligibility + reason
//
// LOCKED INVARIANT:
// - dailyCloses >= 50
// - weeklyCloses >= 40

export function assessMarketDataSufficiency(symbol, marketData) {
  const md = marketData?.symbols?.[symbol];

  if (!md) {
    return {
      eligible: false,
      reason: "NO_MARKET_DATA"
    };
  }

  const dailyCount = Array.isArray(md.dailyCloses)
    ? md.dailyCloses.length
    : 0;

  const weeklyCount = Array.isArray(md.weeklyCloses)
    ? md.weeklyCloses.length
    : 0;

  if (dailyCount < 50 || weeklyCount < 40) {
    return {
      eligible: false,
      reason: "INSUFFICIENT_HISTORY",
      details: {
        dailyCloses: dailyCount,
        weeklyCloses: weeklyCount,
        required: { daily: 50, weekly: 40 }
      }
    };
  }

  return {
    eligible: true
  };
}

export default Object.freeze({ assessMarketDataSufficiency });
