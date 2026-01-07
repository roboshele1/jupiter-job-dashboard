/**
 * PRICE_SNAPSHOT_V1
 * -----------------
 * Deterministic, read-only market price snapshot.
 * Uses Polygon previous-close pricing unless live tier allows otherwise.
 *
 * Guarantees:
 * - Engine-only
 * - Deterministic per invocation
 * - Explicit source + timestamp
 */

import { getLiveQuotes } from "./liveMarketDataAdapter.js";

export async function getPriceSnapshot(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("PRICE_SNAPSHOT: symbols array required");
  }

  const live = await getLiveQuotes(symbols);

  const prices = {};
  for (const q of live.quotes) {
    prices[q.symbol] = {
      price: q.price,
      source: q.source,
      fetchedAt: q.fetchedAt,
    };
  }

  return Object.freeze({
    contract: "PRICE_SNAPSHOT_V1",
    source: live.source,
    fetchedAt: live.fetchedAt,
    prices: Object.freeze(prices),
  });
}

