/**
 * Market Ingestor — Context Only (Non-trading)
 */

export function ingestMarketData(raw) {
  return {
    priceMomentum3M: raw.priceMomentum3M ?? null,
    priceMomentum6M: raw.priceMomentum6M ?? null,
    priceMomentum12M: raw.priceMomentum12M ?? null,

    volumeTrend: raw.volumeTrend ?? null,
    volatility: raw.volatility ?? null,
  };
}
