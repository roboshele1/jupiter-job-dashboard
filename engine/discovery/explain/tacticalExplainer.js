/**
 * engine/discovery/explain/tacticalExplainer.js
 *
 * D1.3a — Tactical Explanation Layer (Plain English)
 * -------------------------------------------------
 * - Read-only
 * - Deterministic
 * - No trading language
 * - Context-only interpretation of tactical conditions
 * - Mirrors Growth tab explainer discipline
 */

function clampPct(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function explainComponent(label, score01, positive, neutral, negative) {
  const pct = clampPct(score01 * 100);

  if (pct >= 67) {
    return {
      label,
      contribution: pct,
      interpretation: positive,
    };
  }

  if (pct >= 34) {
    return {
      label,
      contribution: pct,
      interpretation: neutral,
    };
  }

  return {
    label,
    contribution: pct,
    interpretation: negative,
  };
}

/**
 * explainTacticalScore
 *
 * @param {Object} input
 * @param {number} input.score              // overall tactical score [0–1]
 * @param {Object} input.breakdown           // component scores [0–1]
 * @returns {Object} explanation payload
 */
function explainTacticalScore(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: tactical explanation requires an object");
  }

  const { score, breakdown } = input;

  if (typeof score !== "number" || !breakdown || typeof breakdown !== "object") {
    throw new Error("INVALID_INPUT: malformed tactical score payload");
  }

  const components = [
    explainComponent(
      "Momentum",
      breakdown.momentum || 0,
      "Recent price performance is strong across multiple timeframes.",
      "Price momentum is mixed and provides limited confirmation.",
      "Recent price performance is weak or inconsistent."
    ),
    explainComponent(
      "Trend Position",
      breakdown.trendDistance || 0,
      "Price is comfortably above long-term trend levels.",
      "Price is near its long-term trend and lacks clear separation.",
      "Price is close to or below its long-term trend."
    ),
    explainComponent(
      "Extension",
      breakdown.extension || 0,
      "Price is extended in a controlled and orderly way.",
      "Price extension is moderate and not decisive.",
      "Price extension suggests limited near-term follow-through."
    ),
    explainComponent(
      "Volatility",
      breakdown.volatility || 0,
      "Volatility is contained and supportive of stable trends.",
      "Volatility is elevated but not extreme.",
      "Volatility is high and increases short-term uncertainty."
    ),
  ];

  const overallPct = clampPct(score * 100);

  let summary;
  if (overallPct >= 70) {
    summary =
      "Market conditions are broadly supportive, with price behavior confirming underlying strength.";
  } else if (overallPct >= 40) {
    summary =
      "Market conditions are mixed and provide limited confirmation either way.";
  } else {
    summary =
      "Market conditions are unstable or unsupportive, reducing near-term confidence.";
  }

  return Object.freeze({
    score: overallPct,
    summary,
    components,
    note:
      "This tactical context does not issue signals or timing instructions. It only describes current market conditions.",
  });
}

module.exports = Object.freeze({
  explainTacticalScore,
});
