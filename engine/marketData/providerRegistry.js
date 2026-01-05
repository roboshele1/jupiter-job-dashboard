/**
 * MARKET_DATA_PROVIDER_REGISTRY
 * =============================
 * Phase 22.3 — Provider registry & adapter switching
 *
 * PURPOSE
 * -------
 * - Route raw provider responses to the correct adapter
 * - Enforce a single canonical MARKET_DATA_CONTRACT output
 * - Prevent provider-specific leakage beyond this layer
 *
 * NON-GOALS
 * ---------
 * - No fetching
 * - No execution
 * - No decisions
 * - No forecasts
 */

import { normalizePolygonQuote } from "./adapters/polygonAdapter.js";

/* =========================================================
   PROVIDER MAP
========================================================= */

const PROVIDER_ADAPTERS = {
  polygon: normalizePolygonQuote,
  // yahoo: normalizeYahooQuote,
  // coingecko: normalizeCoinGeckoQuote,
};

/* =========================================================
   REGISTRY ENTRYPOINT
========================================================= */

export function normalizeMarketData({
  provider,
  symbol,
  rawData,
} = {}) {
  if (!provider || !PROVIDER_ADAPTERS[provider]) {
    return {
      contract: "MARKET_DATA_CONTRACT",
      status: "UNSUPPORTED_PROVIDER",
      data: null,
      constraints: [
        "Market data provider is not supported.",
        "No normalization was performed.",
        "Execution is disabled by contract.",
      ],
      timestamp: Date.now(),
    };
  }

  return PROVIDER_ADAPTERS[provider]({
    symbol,
    rawQuote: rawData,
  });
}
