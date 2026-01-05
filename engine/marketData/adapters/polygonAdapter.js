/**
 * POLYGON_MARKET_DATA_ADAPTER
 * ==========================
 * Phase 22.2 — Provider → canonical normalization
 *
 * PURPOSE
 * -------
 * - Convert Polygon API payloads into MARKET_DATA_CONTRACT
 * - No fetching, no retries, no validation beyond shape mapping
 */

import { createMarketDataSnapshot } from "../contracts/marketDataContract.js";

export function normalizePolygonQuote({
  symbol,
  rawQuote,
} = {}) {
  if (!symbol || !rawQuote) {
    return null;
  }

  return createMarketDataSnapshot({
    symbol,
    assetType: "equity",
    price: rawQuote.c,          // last price
    changePercent: rawQuote.dp, // percent change
    marketCap: null,            // Polygon may provide elsewhere
    volume: rawQuote.v,
    currency: "USD",
    exchange: rawQuote.x || null,
    source: "polygon",
    timestamp: rawQuote.t || Date.now(),
  });
}
