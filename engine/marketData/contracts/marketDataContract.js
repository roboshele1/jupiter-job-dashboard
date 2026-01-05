/**
 * MARKET_DATA_CONTRACT
 * ====================
 * Phase 22.1 — Canonical market data contract
 *
 * PURPOSE
 * -------
 * - Define the ONLY allowed internal representation of live market data
 * - Serve as the normalization target for all external providers
 * - Guarantee consistency across intelligence, enrichment, and synthesis
 *
 * NON-GOALS
 * ---------
 * - No API calls
 * - No fetching
 * - No calculations
 * - No predictions
 * - No decisions
 */

export const MARKET_DATA_CONTRACT = {
  name: "MARKET_DATA_CONTRACT",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "ENGINE",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
};

/**
 * Canonical shape — ALL providers must map to this exactly.
 *
 * Required fields are intentionally minimal.
 * Optional fields allow gradual enrichment without breaking compatibility.
 */

export function createMarketDataSnapshot({
  symbol,
  assetType,           // 'equity' | 'etf' | 'crypto' | 'index'
  price,
  changePercent,
  marketCap = null,
  volume = null,
  currency = "USD",
  exchange = null,
  source,              // provider name (e.g. 'polygon', 'coingecko')
  timestamp = Date.now(),
} = {}) {
  return {
    contract: MARKET_DATA_CONTRACT.name,
    status: "READY",
    data: {
      symbol,
      assetType,
      price,
      changePercent,
      marketCap,
      volume,
      currency,
      exchange,
      source,
    },
    constraints: [
      "Market data is factual and descriptive only.",
      "No forecasts or recommendations are included.",
      "Execution is disabled by contract.",
    ],
    timestamp,
  };
}
