/**
 * PORTFOLIO TECHNICAL SIGNALS CONTRACT — V1 (LOCKED)
 *
 * Purpose:
 * - Produce ONE explicit action state per portfolio holding
 * - Derived strictly from technical metrics (math only)
 * - No ambiguity, no duplicated states, no UI logic
 *
 * Invariants:
 * - Exactly ONE state per symbol
 * - No two symbols share decision logic
 * - Metrics are numeric, deterministic, reproducible
 * - Engine-only authority
 */

export const PORTFOLIO_SIGNAL_STATES = Object.freeze({
  ACCUMULATE: "ACCUMULATE",
  HOLD: "HOLD",
  TRIM: "TRIM",
  DO_NOT_ADD: "DO_NOT_ADD",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
});

/**
 * Required output shape per symbol
 */
export const PORTFOLIO_SIGNAL_SCHEMA = Object.freeze({
  symbol: "string",
  state: Object.values(PORTFOLIO_SIGNAL_STATES),
  metrics: {
    price: "number",
    sma200w: "number",
    sma50d: "number",
    distanceFromSMA200WPercent: "number",
    percentile52w: "number",
    volumeRegime: "number",
    trend: ["positive", "neutral", "negative"],
  },
  asOf: "ISO-8601 timestamp",
});

/**
 * Hard validation guard
 */
export function validatePortfolioSignal(signal) {
  if (!signal || typeof signal !== "object") {
    throw new Error("Signal must be an object");
  }

  if (!signal.symbol) {
    throw new Error("Signal missing symbol");
  }

  if (!Object.values(PORTFOLIO_SIGNAL_STATES).includes(signal.state)) {
    throw new Error(`Invalid signal state: ${signal.state}`);
  }

  if (!signal.metrics || typeof signal.metrics !== "object") {
    throw new Error("Signal missing metrics");
  }

  return true;
}
