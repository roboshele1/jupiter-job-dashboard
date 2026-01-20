/**
 * Asset State Normalizer
 * Canonical, deterministic normalization layer
 * Converts raw market + financial data into asymmetry-ready state
 */

module.exports = function assetStateNormalizer(raw = {}) {
  const now = new Date().toISOString();

  const liquidity = {
    avgDailyDollarVolume:
      Number(raw?.market?.volume?.avg30d || 0) *
      Number(raw?.market?.price?.last || 0),

    trend: raw?.market?.volume?.trend || 'UNKNOWN'
  };

  const balanceSheet = {
    cashRunwayMonths: Number(
      raw?.financials?.cashRunwayMonths ??
      raw?.financials?.runwayMonths ??
      0
    )
  };

  const structure = {
    dilutionRisk: Boolean(raw?.financials?.dilutionRisk),
    recentOfferings: Number(raw?.financials?.recentOfferings || 0),
    reverseSplits: Number(raw?.financials?.reverseSplits || 0),
    floatShares: Number(raw?.financials?.floatShares || 0),
    binaryEventRisk: Boolean(raw?.financials?.binaryEventRisk)
  };

  const market = {
    venue: raw?.market?.venue || 'UNKNOWN',

    volume: {
      avg30d: Number(raw?.market?.volume?.avg30d || 0),
      recent5d: Number(raw?.market?.volume?.recent5d || 0)
    },

    price: {
      last: Number(raw?.market?.price?.last || 0),
      change30d: Number(raw?.market?.price?.change30d || 0)
    },

    volatility: {
      atr14: Number(raw?.market?.volatility?.atr14 || 0),
      atr90: Number(raw?.market?.volatility?.atr90 || 0)
    }
  };

  return {
    symbol: raw.symbol,
    assetClass: raw.assetClass || 'EQUITY',

    liquidity,
    balanceSheet,
    structure,
    market,

    meta: {
      normalizedAt: now,
      source: 'assetStateNormalizer'
    }
  };
};
