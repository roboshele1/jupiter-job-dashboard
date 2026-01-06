/**
 * DISCOVERY LAB — D1.4 COMPOSITE CONVICTION
 * ----------------------------------------
 * Purpose:
 * Combine Fundamental, Tactical, and Risk context into a single
 * deterministic conviction score used downstream for BUY / HOLD / SELL logic.
 *
 * Design rules:
 * - Read-only
 * - Deterministic (same inputs → same output)
 * - No portfolio awareness
 * - No execution or advice
 * - Fully explainable
 */

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

/**
 * computeCompositeConviction
 *
 * Inputs:
 * - fundamentalScore: number (0–10)
 * - tacticalScore: number (0–1)
 * - riskPenalty: number (0–1)  // higher = more risk
 *
 * Output:
 * {
 *   score: number (0–10),
 *   normalized: number (0–1),
 *   attribution: { fundamental, tactical, risk },
 *   summary: string
 * }
 */
function computeCompositeConviction({
  fundamentalScore,
  tacticalScore,
  riskPenalty = 0,
}) {
  if (typeof fundamentalScore !== "number") {
    throw new Error("INVALID_INPUT: fundamentalScore must be numeric");
  }

  const f = clamp(fundamentalScore / 10); // normalize to 0–1
  const t = clamp(tacticalScore);
  const r = clamp(riskPenalty);

  // Locked weights (institutional bias toward fundamentals)
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
    fundamental: Math.round(WEIGHTS.fundamental * 100),
    tactical: Math.round(WEIGHTS.tactical * 100),
    risk: Math.round(WEIGHTS.risk * 100),
  });

  let summary;
  if (score >= 8) {
    summary =
      "Overall conviction is high, driven primarily by strong underlying business quality and supportive market conditions.";
  } else if (score >= 5) {
    summary =
      "Overall conviction is moderate, with strengths present but balanced by mixed market conditions or risks.";
  } else {
    summary =
      "Overall conviction is weak, with risks or lack of strength outweighing positives at this time.";
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
