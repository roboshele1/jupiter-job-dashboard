/**
 * PRICE_FRESHNESS_ENGINE_V1
 * -------------------------
 * Purpose:
 * Annotate resolved prices with freshness intelligence.
 *
 * This engine does NOT fetch prices.
 * It only evaluates:
 * - How old a price is
 * - Whether it should be trusted for decisions
 *
 * Guarantees:
 * - Read-only
 * - Deterministic
 * - Engine-only
 * - No renderer access
 *
 * Input Contract:
 * UNIFIED_PRICE_RESOLVER_V1
 *
 * Output:
 * Same shape + freshness metadata per symbol
 */

const CONTRACT = "PRICE_FRESHNESS_ENGINE_V1";

// Hard freshness thresholds (seconds)
const THRESHOLDS = Object.freeze({
  LIVE: 120,          // ≤ 2 minutes
  RECENT: 900,        // ≤ 15 minutes
  STALE: 3600,        // ≤ 1 hour
  EXPIRED: Infinity
});

function classifyFreshness(ageSeconds) {
  if (ageSeconds <= THRESHOLDS.LIVE) return "LIVE";
  if (ageSeconds <= THRESHOLDS.RECENT) return "RECENT";
  if (ageSeconds <= THRESHOLDS.STALE) return "STALE";
  return "EXPIRED";
}

function confidenceFromFreshness(level) {
  switch (level) {
    case "LIVE":
      return "HIGH";
    case "RECENT":
      return "MEDIUM";
    case "STALE":
      return "LOW";
    default:
      return "NONE";
  }
}

export function applyPriceFreshness(priceSnapshot) {
  if (!priceSnapshot || typeof priceSnapshot !== "object") {
    throw new Error("PRICE_FRESHNESS: invalid snapshot");
  }

  const now = Date.now();
  const prices = {};

  for (const [symbol, p] of Object.entries(priceSnapshot.prices || {})) {
    const fetchedAt = new Date(p.fetchedAt).getTime();
    const ageSeconds = Math.max(0, Math.floor((now - fetchedAt) / 1000));

    const freshness = classifyFreshness(ageSeconds);

    prices[symbol] = Object.freeze({
      ...p,
      freshness: {
        level: freshness,
        ageSeconds,
        confidence: confidenceFromFreshness(freshness)
      }
    });
  }

  return Object.freeze({
    contract: CONTRACT,
    source: priceSnapshot.source,
    fetchedAt: priceSnapshot.fetchedAt,
    prices: Object.freeze(prices)
  });
}

export default Object.freeze({
  applyPriceFreshness
});

