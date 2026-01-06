/**
 * Composite Conviction Explanation Layer (D1.4a)
 * ----------------------------------------------
 * Purpose:
 * - Translate composite conviction math into plain English
 * - No finance jargon
 * - No advice, no persuasion
 * - Deterministic, read-only
 */

function explainCompositeConviction(input) {
  const {
    score,
    normalized,
    attribution = { fundamental: 0, tactical: 0, risk: 0 },
  } = input;

  const roundedScore = Math.round(score * 10) / 10;

  let tone;
  if (roundedScore >= 8) tone = "high";
  else if (roundedScore >= 5) tone = "moderate";
  else tone = "low";

  let summary;
  if (tone === "high") {
    summary =
      "Overall conviction is strong. The company’s underlying business strength clearly outweighs current risks.";
  } else if (tone === "moderate") {
    summary =
      "Overall conviction is mixed. There are solid positives, but they are balanced by noticeable risks or uncertainty.";
  } else {
    summary =
      "Overall conviction is weak. Risks or weaknesses outweigh the positives at this time.";
  }

  const drivers = [];
  if (attribution.fundamental >= attribution.tactical && attribution.fundamental >= attribution.risk) {
    drivers.push("the strength of the business itself");
  }
  if (attribution.tactical > 20) {
    drivers.push("supportive market conditions");
  }
  if (attribution.risk > 20) {
    drivers.push("risk factors that limit confidence");
  }

  const driverSentence =
    drivers.length > 0
      ? `This assessment is mainly driven by ${drivers.join(", ")}.`
      : "This assessment reflects a balanced mix of positives and risks.";

  return Object.freeze({
    score: roundedScore,
    normalized,
    summary,
    explanation: `${summary} ${driverSentence}`,
    attribution: {
      fundamental: Math.round(attribution.fundamental),
      tactical: Math.round(attribution.tactical),
      risk: Math.round(attribution.risk),
    },
    note:
      "This explanation describes how conviction was formed. It does not issue recommendations or instructions.",
  });
}

module.exports = Object.freeze({
  explainCompositeConviction,
});
