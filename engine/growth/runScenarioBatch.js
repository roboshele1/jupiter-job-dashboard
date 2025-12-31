/**
 * Growth Engine — Scenario Batch Runner
 *
 * Contract:
 *  - Deterministic
 *  - Math-only
 *  - No IPC / UI / side effects
 *
 * Pipeline:
 *  REQUIRED_RETURN → GOAL_FEASIBILITY
 */

import { requiredReturnScenario } from "./scenarios/requiredReturnScenario.js";
import { goalFeasibilityScenario } from "./scenarios/goalFeasibilityScenario.js";

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

  return {
    batch: "REQUIRED_RETURN → GOAL_FEASIBILITY",
    inputs: { startingValue, targetValue, months },
    requiredReturn,
    feasibility
  };
}
