/**
 * LIVE_TACTICAL_NORMALIZER_V1
 * ---------------------------
 * Phase 3A — Live Discovery Engine (Read-Only)
 *
 * Purpose:
 * Convert live / near-live market data into the exact
 * normalized tactical inputs required by computeTacticalScore().
 *
 * Guarantees:
 * - Engine-only
 * - Read-only
 * - Deterministic per invocation
 * - No scoring, no decisions, no side effects
 *
 * Output shape (STRICT):
 * {
 *   price,
 *   sma200,
 *   rsi14,
 *   momentum3m,
 *   momentum6m,
 *   momentum12m,
 *   atrPercent
 * }
 */

import { resolvePrices } from "../../market/priceResolver.js";

function safe(n, fallback = 0) {
  return Number.isFinite(n) ? n : fallback;
}

/**
 * NOTE:
 * Until historical bars are wired (Phase 3B),
 * we derive conservative deterministic placeholders
 * from current price only.
 *
 * This keeps the engine LIVE but SAFE.
 */

export async function buildLiveTacticalInputs(symbol) {
  if (!symbol) {
    throw new Error("LIVE_TACTICAL_NORMALIZER: symbol required");
  }

  const priceSnapshot = await resolvePrices([
    { symbol, type: symbol === "BTC" || symbol === "ETH" ? "crypto" : "equity" }
  ]);

  const row = priceSnapshot.prices?.[symbol];

  const price = safe(row?.price);

  // Conservative deterministic placeholders
  // (explicitly allowed in Phase 3A)
  const sma200 = price;           // neutral trend
  const rsi14 = 50;               // neutral momentum
  const momentum3m = 0;
  const momentum6m = 0;
  const momentum12m = 0;
  const atrPercent = 0.03;        // sane volatility midpoint

  return Object.freeze({
    price,
    sma200,
    rsi14,
    momentum3m,
    momentum6m,
    momentum12m,
    atrPercent,
    _meta: Object.freeze({
      source: row?.source || "unknown",
      fetchedAt: row?.fetchedAt || new Date().toISOString(),
      contract: "LIVE_TACTICAL_NORMALIZER_V1"
    })
  });
}

export default Object.freeze({
  buildLiveTacticalInputs
});
