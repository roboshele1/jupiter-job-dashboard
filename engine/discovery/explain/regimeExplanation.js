/**
 * D10.3e — Regime Explanation Layer
 * --------------------------------
 * Purpose:
 * Translate macro regime assumptions into plain English.
 *
 * This layer:
 * - Explains the environment assets are being judged under
 * - Does NOT score, rank, or influence conviction
 * - Is strictly explanatory and read-only
 */

function explainRegimeContext(regime) {
  if (!regime || typeof regime !== "object") {
    return Object.freeze({
      summary: "No explicit macroeconomic regime assumption was applied.",
      details: [],
      disclaimer:
        "This explanation reflects contextual assumptions only and does not predict outcomes."
    });
  }

  const label = regime.label || "UNKNOWN";

  let summary = "";
  const details = [];

  switch (label) {
    case "TIGHT_MONETARY":
      summary =
        "Interest rates are elevated and liquidity conditions are restrictive.";
      details.push(
        "Borrowing costs are high, which pressures growth and speculative assets.",
        "Investors tend to favor balance sheet strength and cash flow.",
        "Risk appetite is generally lower in this environment."
      );
      break;

    case "RISK_ON_GROWTH":
      summary =
        "Financial conditions are supportive and investors are willing to take risk.";
      details.push(
        "Capital is flowing toward growth-oriented and higher-beta assets.",
        "Liquidity conditions favor expansion and valuation multiple growth."
      );
      break;

    case "INFLATIONARY_EXPANSION":
      summary =
        "Economic growth is strong but inflation pressures are elevated.";
      details.push(
        "Real assets and pricing power become more important.",
        "Margins can be pressured if costs rise faster than revenues."
      );
      break;

    case "RISK_OFF_DEFENSIVE":
      summary =
        "Economic uncertainty is high and capital preservation is prioritized.";
      details.push(
        "Investors favor defensive, stable, and lower-volatility assets.",
        "Growth expectations are typically discounted."
      );
      break;

    default:
      summary =
        "A macroeconomic regime was applied, but its characteristics are not explicitly defined.";
  }

  return Object.freeze({
    label,
    summary,
    details,
    disclaimer:
      "This regime explanation provides economic context only. It does not influence scoring or decisions."
  });
}

module.exports = Object.freeze({
  explainRegimeContext
});
