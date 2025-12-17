/**
 * JUPITER — Market Data Normalizer
 * Phase 11 Step 3
 *
 * Converts raw market snapshots into canonical price objects.
 * No portfolio math. No execution.
 */

import { getMarketSnapshot } from "./marketDataAdapter";

/**
 * Canonical price schema:
 * {
 *   symbol,
 *   price,
 *   open,
 *   high,
 *   low,
 *   volume,
 *   change,
 *   changePct,
 *   timestamp
 * }
 */

export function getNormalizedPrices() {
  const snapshot = getMarketSnapshot();
  if (!snapshot || !snapshot.data) return [];

  return snapshot.data.map((row) => {
    const change = row.price - row.open;
    const changePct = row.open ? (change / row.open) * 100 : 0;

    return {
      symbol: row.symbol,
      price: row.price,
      open: row.open,
      high: row.high,
      low: row.low,
      volume: row.volume,
      change,
      changePct,
      timestamp: row.timestamp,
      source: row.source,
    };
  });
}

