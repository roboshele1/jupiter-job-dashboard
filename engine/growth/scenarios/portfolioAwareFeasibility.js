/**
 * PORTFOLIO_AWARE_FEASIBILITY
 * Math-only comparison of REQUIRED_RETURN vs portfolio return bands.
 *
 * Inputs:
 *  - requiredCAGR (number)
 *  - portfolioBands { conservative, expected, aggressive } (CAGR decimals)
 *
 * Output:
 *  - classification
 *  - buffer
 *  - interpretation
 */

export function portfolioAwareFeasibility({ requiredCAGR, portfolioBands }) {
  if (
    typeof requiredCAGR !== "number" ||
    !portfolioBands ||
    typeof portfolioBands.expected !== "number"
  ) {
    throw new Error("Invalid PORTFOLIO_AWARE_FEASIBILITY inputs");
  }

  const { conservative, expected, aggressive } = portfolioBands;

  let classification = "WITHIN_EXPECTATION";
  let interpretation = "Goal aligns with portfolio’s expected return profile.";

  if (requiredCAGR > expected && requiredCAGR <= aggressive) {
    classification = "STRETCH";
    interpretation = "Goal exceeds expected return; requires strong execution.";
  }

  if (requiredCAGR > aggressive) {
    classification = "OUT_OF_BOUNDS";
    interpretation = "Goal exceeds portfolio’s aggressive return band.";
  }

  const buffer = expected - requiredCAGR;

  return {
    scenario: "PORTFOLIO_AWARE_FEASIBILITY",
    requiredCAGR,
    portfolioBands,
    classification,
    buffer,
    interpretation
  };
}
