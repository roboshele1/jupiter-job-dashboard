/**
 * JUPITER — Market Data Contract
 * Activation Phase A — Step 3
 *
 * Canonical, engine-facing interface for live market prices.
 * All engines must consume prices ONLY through this contract.
 */

import { fetchLivePrices } from "./marketDataAdapter";

/**
 * Price Snapshot Schema:
 * {
 *   symbol: string
 *   price: number
 *   timestamp: number
 *   source: string
 * }
 */

export async function getLiveMarketPrices(symbols = []) {
  const prices = await fetchLivePrices(symbols);

  return prices.map((p) => ({
    symbol: p.symbol,
    price: p.price,
    timestamp: p.timestamp,
    source: p.source,
  }));
}

/**
 * Contract metadata
 */
export const MARKET_DATA_CONTRACT = Object.freeze({
  version: "1.0.0",
  phase: "Activation Phase A",
  step: 3,
  live: true,
  mutable: false,
  description:
    "Authoritative live market data contract. Engines must not bypass this interface.",
});

