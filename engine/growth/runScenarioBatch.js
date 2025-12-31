/**
 * Growth Engine — Unified Feasibility Batch
 *
 * Contract:
 *  - Deterministic
 *  - Math-only
 *  - Read-only
 *
 * Pipeline:
 *  REQUIRED_RETURN
 *    → GOAL_FEASIBILITY
 *    → PORTFOLIO_AWARE_FEASIBILITY
 *    → HISTORICAL_SANITY
 */

import { requiredReturnScenario } from "./scenarios/requiredReturnScenario.js";
import { goalFeasibilityScenario } from "./scenarios/goalFeasibilityScenario.js";
import { portfolioAwareFeasibility } from "./scenarios/portfolioAwareFeasibility.js";
import { historicalSanityBands } from "./scenarios/historicalSanityBands.js";

export function runScenarioBatch({
  startingValue,
  targetValue,
  months,
  portfolioBands
}) {
  const requiredReturn = requiredReturnScenario({
    startingValue,
    targetValue,
    months
  });

  const goalFeasibility = goalFeasibilityScenario({
    startingValue,
    targetValue,
    months
  });

  const portfolioFeasibility = portfolioAwareFeasibility({
    requiredCAGR: requiredReturn.requiredCAGR,
    portfolioBands
  });

  const historicalSanity = historicalSanityBands({
    requiredCAGR: requiredReturn.requiredCAGR
  });

  return {
    batch: "UNIFIED_FEASIBILITY",
    inputs: {
      startingValue,
      targetValue,
      months,
      portfolioBands
    },
    requiredReturn,
    goalFeasibility,
    portfolioFeasibility,
    historicalSanity
  };
}
