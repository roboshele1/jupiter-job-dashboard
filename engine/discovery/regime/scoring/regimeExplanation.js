/**
 * DISCOVERY LAB — REGIME ATTRIBUTION EXPLANATION (D2.4)
 * ----------------------------------------------------
 * Converts regime-conditioned scoring into
 * plain-English explanations.
 *
 * No math.
 * No persuasion.
 * No trading language.
 * Deterministic output.
 */

function explainRegimeImpact(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: explanation requires input object");
  }

  const { regime, adjustedFactors } = input;

  if (!regime || !adjustedFactors) {
    throw new Error("INVALID_INPUT: missing regime or factors");
  }

  let explanation = "";

  switch (regime) {
    case "RISK_ON_GROWTH":
      explanation =
        "The current environment favors companies that are growing quickly and attracting investor interest. In periods like this, businesses with strong revenue expansion and positive price momentum tend to outperform. Because of that, growth and momentum were given slightly more importance in this evaluation.";
      break;

    case "INFLATIONARY_EXPANSION":
      explanation =
        "In inflationary periods, companies that can protect margins and operate efficiently tend to hold up better. For this reason, quality and operational strength were emphasized more than pure growth.";
      break;

    case "TIGHT_MONETARY":
      explanation =
        "When interest rates are high and money is tighter, markets reward stability over speed. Companies with strong balance sheets and controlled risk profiles perform better, so risk and quality were weighted more heavily.";
      break;

    case "RISK_OFF_DEFENSIVE":
      explanation =
        "During uncertain or defensive market phases, preserving capital becomes more important than chasing growth. In this environment, stability and downside protection matter most, which reduced the influence of aggressive growth signals.";
      break;

    default:
      explanation =
        "The economic environment influenced how different company traits were evaluated in this analysis.";
  }

  return Object.freeze({
    regime,
    explanation,
    adjustedFactors,
    note:
      "This explanation describes context only. Scores and decisions remain math-driven.",
  });
}

module.exports = Object.freeze({
  explainRegimeImpact,
});
