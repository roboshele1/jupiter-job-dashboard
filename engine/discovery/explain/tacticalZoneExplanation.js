/**
 * Tactical Zone Explanation — D10.4
 * --------------------------------
 * Purpose:
 * Deterministically classify tactical context into a user-facing zone
 * using EXISTING tactical breakdown values.
 *
 * HARD RULES:
 * - No new math
 * - No trading instructions
 * - No thresholds invented outside tacticalScore.js
 * - Read-only, deterministic, append-only
 */

function classifyTacticalZone(breakdown = {}) {
  const {
    extension,
    trendDistance,
    momentum,
    volatility,
  } = breakdown;

  if (
    typeof extension !== "number" ||
    typeof trendDistance !== "number" ||
    typeof momentum !== "number" ||
    typeof volatility !== "number"
  ) {
    return Object.freeze({
      zone: "UNCLASSIFIED",
      rationale: "Insufficient tactical data available for zone classification.",
      signalsUsed: [],
    });
  }

  /* =============================
     HIGH RISK
  ============================== */
  if (volatility <= 0.4 || momentum <= 0.3) {
    return Object.freeze({
      zone: "HIGH RISK",
      rationale:
        "Volatility or momentum conditions indicate elevated instability or breakdown risk.",
      signalsUsed: ["volatility", "momentum"],
    });
  }

  /* =============================
     EXTENDED
  ============================== */
  if (extension <= 0.2 || trendDistance <= 0.2) {
    return Object.freeze({
      zone: "EXTENDED",
      rationale:
        "Price behavior suggests expectations may be stretched relative to long-term trend.",
      signalsUsed: ["extension", "trendDistance"],
    });
  }

  /* =============================
     MOMENTUM
  ============================== */
  if (momentum === 1.0 && trendDistance >= 0.6 && extension >= 0.5) {
    return Object.freeze({
      zone: "MOMENTUM",
      rationale:
        "Trend and momentum are aligned, indicating sustained directional strength.",
      signalsUsed: ["momentum", "trendDistance", "extension"],
    });
  }

  /* =============================
     BALANCED
  ============================== */
  if (
    extension === 1.0 &&
    trendDistance === 1.0 &&
    volatility === 1.0
  ) {
    return Object.freeze({
      zone: "BALANCED",
      rationale:
        "Price, trend, and volatility are aligned with long-term expectations.",
      signalsUsed: ["extension", "trendDistance", "volatility"],
    });
  }

  /* =============================
     ACCUMULATION
  ============================== */
  const accumulationSignals = [
    extension >= 0.7,
    trendDistance >= 0.8,
    momentum <= 0.6,
    volatility >= 0.7,
  ].filter(Boolean).length;

  if (accumulationSignals >= 2) {
    return Object.freeze({
      zone: "ACCUMULATION",
      rationale:
        "Price appears discounted relative to trend, with signs of pessimism or neglect rather than instability.",
      signalsUsed: ["extension", "trendDistance", "momentum", "volatility"],
    });
  }

  return Object.freeze({
    zone: "BALANCED",
    rationale:
      "Market conditions are mixed but remain within normal historical bounds.",
    signalsUsed: ["extension", "trendDistance", "momentum", "volatility"],
  });
}

module.exports = Object.freeze({
  classifyTacticalZone,
});
