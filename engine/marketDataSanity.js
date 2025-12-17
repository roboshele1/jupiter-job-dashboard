/**
 * JUPITER — Market Data Sanity Check
 * Activation Phase A — Step 4
 *
 * Performs non-destructive validation of live price data.
 * No persistence. No execution. Dry-run only.
 */

import { getLiveMarketPrices } from "./marketDataContract";

/**
 * Sanity Check Result Schema:
 * {
 *   symbol
 *   price
 *   valid
 *   reason
 * }
 */

export async function runMarketDataSanity(symbols = []) {
  const snapshots = await getLiveMarketPrices(symbols);

  return snapshots.map((s) => {
    let valid = true;
    let reason = "OK";

    if (typeof s.price !== "number" || isNaN(s.price)) {
      valid = false;
      reason = "Price is not a number";
    }

    if (s.price <= 0) {
      valid = false;
      reason = "Non-positive price";
    }

    if (!s.timestamp) {
      valid = false;
      reason = "Missing timestamp";
    }

    return {
      symbol: s.symbol,
      price: s.price,
      valid,
      reason,
    };
  });
}

/**
 * Metadata
 */
export const MARKET_DATA_SANITY_META = Object.freeze({
  phase: "Activation Phase A",
  step: 4,
  destructive: false,
  executionSafe: true,
});

