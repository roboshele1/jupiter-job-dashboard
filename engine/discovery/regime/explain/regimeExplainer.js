/**
 * DISCOVERY LAB — REGIME EXPLANATION LAYER (D2.2)
 * ----------------------------------------------
 * Translates regime classification into
 * plain, non-financial English.
 *
 * Deterministic.
 * No advice.
 * No mutation.
 */

const EXPLANATIONS = Object.freeze({
  RISK_ON_GROWTH: {
    summary: "Markets are generally supportive of growth.",
    explanation:
      "Money is flowing into the system, borrowing costs are relatively low, and investors are comfortable taking risk. In environments like this, growing companies tend to perform better than defensive ones.",
  },

  INFLATIONARY_EXPANSION: {
    summary: "Economic growth is happening alongside rising prices.",
    explanation:
      "Demand in the economy is strong, but prices are rising at the same time. Companies that can pass higher costs to customers or benefit from real assets tend to hold up better in this environment.",
  },

  TIGHT_MONETARY: {
    summary: "Financial conditions are restrictive.",
    explanation:
      "Borrowing is more expensive and money is harder to access. This often slows growth and puts pressure on highly leveraged or speculative businesses.",
  },

  RISK_OFF_DEFENSIVE: {
    summary: "Markets are prioritizing safety over growth.",
    explanation:
      "Uncertainty is elevated and investors are cautious. Capital tends to move toward stability and away from aggressive growth, as protecting value becomes more important than chasing returns.",
  },
});

/**
 * Input:
 * {
 *   regime: string
 * }
 */
function explainRegime(input) {
  if (!input || typeof input !== "object" || !input.regime) {
    throw new Error("INVALID_INPUT: regime explanation requires a regime key");
  }

  const explanation = EXPLANATIONS[input.regime];

  if (!explanation) {
    throw new Error(`UNKNOWN_REGIME: ${input.regime}`);
  }

  return Object.freeze({
    regime: input.regime,
    summary: explanation.summary,
    explanation: explanation.explanation,
    note:
      "This explanation describes the broader economic environment. It does not issue investment instructions.",
  });
}

module.exports = Object.freeze({
  explainRegime,
});
