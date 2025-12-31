/**
 * HISTORICAL_SANITY_BANDS
 * Math-only comparison of required CAGR vs long-term market return bands.
 *
 * Assumptions (configurable constants):
 *  - Long-term equity real returns cluster ~6–8%
 *  - Nominal broad market ~9–11%
 *
 * Inputs:
 *  - requiredCAGR (number)
 *
 * Outputs:
 *  - band
 *  - interpretation
 */

export function historicalSanityBands({ requiredCAGR }) {
  if (typeof requiredCAGR !== "number") {
    throw new Error("Invalid HISTORICAL_SANITY_BANDS inputs");
  }

  let band = "HISTORICALLY_NORMAL";
  let interpretation = "Aligned with long-term market outcomes.";

  if (requiredCAGR > 0.12 && requiredCAGR <= 0.20) {
    band = "ABOVE_HISTORICAL_AVERAGE";
    interpretation = "Achievable but historically less common without concentration.";
  }

  if (requiredCAGR > 0.20 && requiredCAGR <= 0.35) {
    band = "RARE_OUTCOME";
    interpretation = "Historically rare without leverage or exceptional selection.";
  }

  if (requiredCAGR > 0.35) {
    band = "EXTREME_OUTLIER";
    interpretation = "Statistical outlier relative to long-term market history.";
  }

  return {
    scenario: "HISTORICAL_SANITY_BANDS",
    requiredCAGR,
    band,
    interpretation
  };
}
