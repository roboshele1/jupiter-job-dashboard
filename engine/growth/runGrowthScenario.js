/**
 * Growth Engine — Scenario Orchestrator
 * Single authority for all Growth Scenarios
 *
 * Contract:
 *  - Deterministic
 *  - No side effects
 *  - No UI / IPC awareness
 */

import { runBaseScenario } from "./scenarios/baseScenario.js";
import { requiredReturnScenario } from "./scenarios/requiredReturnScenario.js";
import { goalFeasibilityScenario } from "./scenarios/goalFeasibilityScenario.js";

export function runGrowthScenario({ scenario, inputs }) {
  if (!scenario || !inputs) {
    throw new Error("Scenario and inputs are required");
  }

  switch (scenario) {
    case "BASELINE":
      return runBaseScenario(inputs);

    case "REQUIRED_RETURN":
      return requiredReturnScenario(inputs);

    case "GOAL_FEASIBILITY":
      return goalFeasibilityScenario(inputs);

    default:
      throw new Error(`Unknown Growth Scenario: ${scenario}`);
  }
}
