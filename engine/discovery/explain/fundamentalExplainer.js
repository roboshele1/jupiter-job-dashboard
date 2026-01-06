/**
 * D1.2a — Fundamental Score Explanation Layer
 * -------------------------------------------
 * Pure explanation layer.
 * Does NOT affect scores.
 * Deterministic, read-only, lay-person language.
 */

function explainFundamentalScore({
  symbol,
  score,
  factors,
}) {
  const explanations = [];

  if (factors.growth >= 0.35) {
    explanations.push(
      "The company is growing revenues and earnings at a strong pace."
    );
  } else if (factors.growth >= 0.2) {
    explanations.push(
      "The company shows moderate growth but not at a breakout level."
    );
  } else {
    explanations.push(
      "Growth has slowed, which reduces long-term compounding potential."
    );
  }

  if (factors.quality >= 0.25) {
    explanations.push(
      "It consistently converts profits into shareholder value through strong returns on capital."
    );
  } else {
    explanations.push(
      "Returns on capital are weaker than top-tier companies."
    );
  }

  if (factors.cash >= 0.15) {
    explanations.push(
      "The business generates healthy cash flow relative to its size."
    );
  } else {
    explanations.push(
      "Cash generation is limited, reducing financial flexibility."
    );
  }

  if (factors.balance >= 0.15) {
    explanations.push(
      "Debt levels are manageable and do not meaningfully constrain operations."
    );
  } else {
    explanations.push(
      "Debt levels increase financial risk, especially during downturns."
    );
  }

  if (factors.penalties > 0) {
    explanations.push(
      "Certain financial weaknesses materially reduce overall conviction."
    );
  }

  return Object.freeze({
    symbol,
    score,
    summary:
      `${symbol} scores ${score}/10 based on measurable financial performance.`,
    explanation: explanations.join(" "),
    factorAttribution: Object.freeze({
      growth: Math.round(factors.growth * 100),
      quality: Math.round(factors.quality * 100),
      cash: Math.round(factors.cash * 100),
      balance: Math.round(factors.balance * 100),
      penalties: Math.round(factors.penalties * 100),
    }),
  });
}

module.exports = Object.freeze({
  explainFundamentalScore,
});
