/**
 * Discovery Decision Classification Engine (D1.4b)
 * ------------------------------------------------
 * Purpose:
 * - Convert composite conviction into a deterministic classification
 * - BUY / BUY MORE (OWNED) / HOLD / SELL / AVOID
 * - No advice, no execution, no mutation
 */

function classifyDiscoveryDecision(input) {
  const {
    convictionScore,   // 0–10
    normalized,        // 0–1
    ownership = false, // boolean: already owned?
  } = input;

  let decision;
  let rationale;

  if (normalized >= 0.8) {
    decision = ownership ? "BUY MORE (OWNED)" : "BUY";
    rationale =
      "Overall conviction is very strong, with positives clearly outweighing risks.";
  } else if (normalized >= 0.6) {
    decision = "HOLD";
    rationale =
      "The company shows solid strengths, but risks or uncertainty limit conviction.";
  } else if (normalized >= 0.4) {
    decision = "SELL";
    rationale =
      "Conviction has weakened as risks are beginning to outweigh positives.";
  } else {
    decision = "AVOID";
    rationale =
      "Risks materially outweigh strengths, making capital preservation the priority.";
  }

  return Object.freeze({
    decision,
    convictionScore: Math.round(convictionScore * 10) / 10,
    normalized,
    rationale,
    note:
      "This classification is a mathematical outcome of Discovery analysis. It is not advice and does not trigger actions.",
  });
}

module.exports = Object.freeze({
  classifyDiscoveryDecision,
});
