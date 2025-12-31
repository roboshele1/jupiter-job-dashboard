/**
 * Growth Engine — Scenario Batch Runner (Extended)
 *
 * Contract:
 *  - Deterministic
 *  - Math-only
 *  - No IPC / UI / side effects
 *
 * Pipeline:
 *  REQUIRED_RETURN → GOAL_FEASIBILITY → HISTORICAL_SANITY
 */

import { requiredReturnScenario } from "./scenarios/requiredReturnScenario.js";
import { goalFeasibilityScenario } from "./scenarios/goalFeasibilityScenario.js";
import { historicalSanityBands } from "./scenarios/historicalSanityBands.js";

export function runScenarioBatch({ startingValue, targetValue, months }) {
  const requiredReturn = requiredReturnScenario({
    startingValue,
    targetValue,
    months
  });

  const feasibility = goalFeasibilityScenario({
    startingValue,
    targetValue,
    months
  });

  const historicalSanity = historicalSanityBands({
    requiredCAGR: requiredReturn.requiredCAGR
  });

  return {
    batch: "REQUIRED_RETURN → GOAL_FEASIBILITY → HISTORICAL_SANITY",
    inputs: { startingValue, targetValue, months },
    requiredReturn,
    feasibility,
    historicalSanity
  };
}
