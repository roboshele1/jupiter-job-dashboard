/**
 * DISCOVERY METRIC CONTRACT — V1
 * --------------------------------
 * Canonical, normalized, read-only metric schema
 * Used by Discovery Lab scoring engines only
 */

export const DISCOVERY_METRIC_VERSION = "1.0";

export function createDiscoveryMetricObject({
  symbol,
  financials,
  market,
  efficiency,
  risk,
}) {
  return Object.freeze({
    contract: "DISCOVERY_METRIC_V1",
    version: DISCOVERY_METRIC_VERSION,
    symbol,

    sources: Object.freeze({
      financials: "FINANCIAL_STATEMENT",
      market: "MARKET_DATA",
      efficiency: "DERIVED",
      risk: "DERIVED",
    }),

    financials: Object.freeze(financials),
    market: Object.freeze(market),
    efficiency: Object.freeze(efficiency),
    risk: Object.freeze(risk),
  });
}
