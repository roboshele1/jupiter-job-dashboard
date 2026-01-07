/**
 * D8.2 — Canonical Price Snapshot
 * --------------------------------
 * Purpose:
 * Provide a single, authoritative, read-only market price snapshot
 * for Jupiter engines (Portfolio, Discovery, Risk, Market Monitor).
 *
 * Guarantees:
 * - Deterministic per invocation
 * - Read-only
 * - No UI access
 * - No scoring, no inference
 * - Delegates raw fetching to liveMarketDataAdapter
 *
 * This file DOES NOT:
 * - Decide live vs delayed pricing
 * - Infer signals
 * - Cache across runs
 */

const { getLiveQuotes } = require("./liveMarketDataAdapter.js");

async function getPriceSnapshot(symbols = []) {
  if (!Array.isArray(symbols) || symbols.length === 0) {
    throw new Error("PRICE_SNAPSHOT: symbols array required");
  }

  const snapshot = await getLiveQuotes(symbols);

  const normalized = {};
  snapshot.quotes.forEach(q => {
    normalized[q.symbol] = Object.freeze({
      price: q.price,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
    });
  });

  return Object.freeze({
    contract: "PRICE_SNAPSHOT_V1",
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
    prices: Object.freeze(normalized),
  });
}

module.exports = Object.freeze({
  getPriceSnapshot,
});

