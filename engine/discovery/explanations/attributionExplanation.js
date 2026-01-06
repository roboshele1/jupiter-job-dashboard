/**
 * DISCOVERY LAB — ATTRIBUTION EXPLANATION ENGINE (D4.3)
 * ----------------------------------------------------
 * Purpose:
 * - Convert factor attribution into plain-English reasoning
 * - No finance jargon
 * - No persuasion
 * - Deterministic output
 *
 * Inputs:
 * {
 *   growth: number,
 *   quality: number,
 *   momentum: number,
 *   risk: number
 * }
 */

function explainAttribution(attribution) {
  if (!attribution || typeof attribution !== "object") {
    throw new Error("INVALID_INPUT: attribution explanation");
  }

  const { growth = 0, quality = 0, momentum = 0, risk = 0 } = attribution;

  const explanations = [];

  if (growth >= 30) {
    explanations.push(
      "A large part of this decision comes from strong business growth, meaning the company is expanding its revenue and earnings at a healthy pace."
    );
  } else if (growth > 0) {
    explanations.push(
      "Business growth played a smaller role, indicating steady but not exceptional expansion."
    );
  }

  if (quality >= 25) {
    explanations.push(
      "The company shows strong quality characteristics, such as efficient use of capital, healthy margins, and solid financial discipline."
    );
  } else if (quality > 0) {
    explanations.push(
      "Company quality contributed modestly, suggesting the business is stable but not outstanding in efficiency or profitability."
    );
  }

  if (momentum >= 20) {
    explanations.push(
      "Recent price movement supports the decision, meaning the stock has been trending in a consistent and controlled way rather than moving randomly."
    );
  } else if (momentum > 0) {
    explanations.push(
      "Price trends had a limited impact, indicating the stock is neither strongly accelerating nor clearly weakening."
    );
  }

  if (risk >= 15) {
    explanations.push(
      "Risk factors reduced concern, as the company shows manageable debt levels and controlled volatility."
    );
  } else {
    explanations.push(
      "Risk played a cautionary role, meaning factors like debt, instability, or uncertainty limited confidence."
    );
  }

  return Object.freeze({
    summary:
      explanations.length > 0
        ? explanations.join(" ")
        : "This decision reflects a balanced mix of strengths and risks.",
    breakdown: Object.freeze({
      growth,
      quality,
      momentum,
      risk,
    }),
  });
}

module.exports = Object.freeze({
  explainAttribution,
});
