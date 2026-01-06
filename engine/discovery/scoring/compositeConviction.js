/**
 * DISCOVERY LAB — D1.4 COMPOSITE CONVICTION
 * ----------------------------------------
 * Combines Fundamental + Tactical + Risk into a single,
 * deterministic conviction score used for BUY / HOLD / SELL.
 *
 * Rules:
 * - Read-only
 * - Deterministic
 * - No portfolio mutation
 * - No execution
 * - Explainable
 */

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function computeCompositeConviction({
  fundamentalScore,
  tacticalScore,
  riskPenalty = 0,
}) {
  if (typeof fundamentalScore !== "number") {
    throw new Error("INVALID_INPUT: fundamentalScore must be numeric");
  }

  const f = clamp(fundamentalScore / 10);
  const t = clamp(tacticalScore);
  const r = clamp(riskPenalty);

  // Locked institutional weights
  const WEIGHTS = Object.freeze({
    fundamental: 0.6,
    tactical: 0.25,
    risk: 0.15,
  });

  const raw =
    f * WEIGHTS.fundamental +
    t * WEIGHTS.tactical -
    r * WEIGHTS.risk;

  const normalized = clamp(raw);
  const score = Math.round(normalized * 10 * 100) / 100;

  const attribution = Object.freeze({
    fundamental: 60,
    tactical: 25,
    risk: 15,
  });

  let summary;
  if (score >= 8) {
    summary =
      "Overall conviction is high, driven mainly by strong business fundamentals and supportive market conditions.";
  } else if (score >= 5) {
    summary =
      "Overall conviction is moderate, with positives balanced by risks or mixed market conditions.";
  } else {
    summary =
      "Overall conviction is weak, as risks or lack of strength outweigh positives.";
  }

  return Object.freeze({
    score,
    normalized,
    attribution,
    summary,
  });
}

module.exports = Object.freeze({
  computeCompositeConviction,
});
