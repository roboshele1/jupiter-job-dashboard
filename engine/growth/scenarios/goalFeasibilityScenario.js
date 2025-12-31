/**
 * GOAL_FEASIBILITY scenario
 * Deterministic math only — no market assumptions.
 *
 * Inputs:
 *  - startingValue (number)
 *  - targetValue (number)
 *  - months (number)
 *
 * Outputs:
 *  - requiredCAGR
 *  - feasibility
 *  - interpretation
 */

export function goalFeasibilityScenario({
  startingValue,
  targetValue,
  months
}) {
  if (
    startingValue <= 0 ||
    targetValue <= 0 ||
    months <= 0
  ) {
    throw new Error("Invalid GOAL_FEASIBILITY inputs");
  }

  const years = months / 12;
  const requiredCAGR =
    Math.pow(targetValue / startingValue, 1 / years) - 1;

  let feasibility = "REALISTIC";
  let interpretation = "Achievable with disciplined execution.";

  if (requiredCAGR > 0.15) {
    feasibility = "STRETCHED";
    interpretation = "Requires above-average performance and favorable conditions.";
  }

  if (requiredCAGR > 0.30) {
    feasibility = "AGGRESSIVE";
    interpretation = "High risk; historically uncommon without concentration or leverage.";
  }

  if (requiredCAGR > 0.50) {
    feasibility = "UNREALISTIC";
    interpretation = "Mathematically possible, but statistically implausible.";
  }

  return {
    scenario: "GOAL_FEASIBILITY",
    startingValue,
    targetValue,
    months,
    requiredCAGR,
    feasibility,
    interpretation
  };
}
