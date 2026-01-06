/**
 * Discovery Decision Explanation Layer (D1.4c)
 * --------------------------------------------
 * Purpose:
 * - Translate BUY / BUY MORE / HOLD / SELL / AVOID
 *   into plain, non-finance English
 * - No advice, no persuasion, no execution
 * - Deterministic and explainable
 */

function explainDiscoveryDecision(input) {
  const {
    symbol,
    decision,
    convictionScore,
    normalized,
    rationale,
  } = input;

  let explanation;

  switch (decision) {
    case "BUY":
      explanation =
        "This company stands out strongly compared to others right now. Its business fundamentals and market conditions align in a way that historically supports future growth. Jupiter sees this as a high-quality opportunity, not a short-term trade.";
      break;

    case "BUY MORE (OWNED)":
      explanation =
        "This is a company you already own, and its strengths remain intact. The business continues to perform well, and current conditions support adding gradually rather than reducing exposure.";
      break;

    case "HOLD":
      explanation =
        "The company is doing many things right, but there are enough risks or uncertainties that make aggressive action unnecessary. Staying put is the most balanced option for now.";
      break;

    case "SELL":
      explanation =
        "The company’s strengths have weakened compared to earlier periods. Risks are becoming more prominent, and Jupiter sees fewer reasons to stay invested at the same level.";
      break;

    case "AVOID":
      explanation =
        "The risks around this company outweigh its strengths. Preserving capital is more important than seeking growth here.";
      break;

    default:
      explanation =
        "Jupiter could not form a clear classification due to insufficient data.";
  }

  return Object.freeze({
    symbol,
    decision,
    convictionScore,
    normalized,
    explanation,
    note:
      "This explanation describes how Jupiter arrived at its classification. It is not financial advice and does not trigger actions.",
  });
}

module.exports = Object.freeze({
  explainDiscoveryDecision,
});
