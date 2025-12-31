/**
 * REQUIRED_RETURN scenario
 * Deterministic math only — no market assumptions.
 *
 * Inputs:
 *  - startingValue (number)
 *  - targetValue (number)
 *  - months (number)
 *
 * Outputs:
 *  - requiredCAGR
 *  - requiredMonthlyReturn
 *  - riskBand
 */

export function requiredReturnScenario({
  startingValue,
  targetValue,
  months
}) {
  if (
    startingValue <= 0 ||
    targetValue <= 0 ||
    months <= 0
  ) {
    throw new Error("Invalid REQUIRED_RETURN inputs");
  }

  const years = months / 12;

  // CAGR formula
  const requiredCAGR =
    Math.pow(targetValue / startingValue, 1 / years) - 1;

  // Monthly compounding equivalent
  const requiredMonthlyReturn =
    Math.pow(1 + requiredCAGR, 1 / 12) - 1;

  let riskBand = "Conservative";
  if (requiredCAGR > 0.10) riskBand = "Moderate";
  if (requiredCAGR > 0.20) riskBand = "Aggressive";
  if (requiredCAGR > 0.40) riskBand = "Speculative";

  return {
    scenario: "REQUIRED_RETURN",
    startingValue,
    targetValue,
    months,
    requiredCAGR,
    requiredMonthlyReturn,
    riskBand
  };
}
