/**
 * GOAL_CAGR_SOLVER
 * =================
 * Phase G2.1 — Goal-Based CAGR Requirement Engine
 *
 * PURPOSE
 * -------
 * - Compute required CAGR to go from X → Y in Z months
 * - No asset assumptions
 * - No UI constraints
 * - Pure deterministic math
 *
 * NON-GOALS
 * ---------
 * - No recommendations
 * - No portfolio mutation
 * - No projections beyond math
 */

export const GOAL_CAGR_SOLVER_CONTRACT = {
  name: "GOAL_CAGR_SOLVER",
  version: "1.0",
  mode: "READ_ONLY",
  authority: "MATH",
};

export function runGoalCagrSolver({
  startingValue,
  targetValue,
  months,
  expectedReturn = 0.10,
  aggressiveReturn = 0.18,
} = {}) {
  if (
    !startingValue ||
    !targetValue ||
    !months ||
    startingValue <= 0 ||
    targetValue <= 0 ||
    months <= 0
  ) {
    return {
      contract: GOAL_CAGR_SOLVER_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      timestamp: Date.now(),
    };
  }

  const years = months / 12;
  const requiredCAGR = Math.pow(targetValue / startingValue, 1 / years) - 1;

  let classification = "FEASIBLE";
  if (requiredCAGR > aggressiveReturn) classification = "EXTREME";
  else if (requiredCAGR > expectedReturn) classification = "OUT_OF_BOUNDS";

  const feasibleMonths =
    (12 * Math.log(targetValue / startingValue)) /
    Math.log(1 + expectedReturn);

  const feasibleTarget =
    startingValue * Math.pow(1 + expectedReturn, years);

  return {
    contract: GOAL_CAGR_SOLVER_CONTRACT.name,
    status: "READY",
    timestamp: Date.now(),
    inputs: {
      startingValue,
      targetValue,
      months,
    },
    outputs: {
      requiredCAGR,
      classification,
      feasibleMonths: Math.ceil(feasibleMonths),
      feasibleTarget: Math.round(feasibleTarget),
    },
    explanations: [
      "Required CAGR calculated using compound growth formula",
      "Classification based on expected vs aggressive return thresholds",
      "No asset assumptions applied",
    ],
  };
}
