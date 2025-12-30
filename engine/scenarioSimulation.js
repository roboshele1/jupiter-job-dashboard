// engine/scenarioSimulation.js

/**
 * Scenario Simulation Engine — Phase 5
 *
 * Purpose:
 * - Generate counterfactual, narrative-only scenarios
 * - Built on top of Growth Planning outputs
 *
 * Non-goals:
 * - No forecasts
 * - No probabilities
 * - No calculations
 * - No portfolio mutation
 * - No IPC
 */

export function buildScenarios({ growthPlan }) {
  if (!growthPlan?.available) {
    return {
      available: false,
      reason: "Growth plan unavailable",
      scenarios: [],
    };
  }

  const scenarios = growthPlan.paths.map((path) => ({
    id: `scenario_${path.id}`,
    title: `If ${path.title.toLowerCase()} dominates`,
    narrative:
      `This scenario explores outcomes if the portfolio evolves primarily along the "${path.title}" growth path.`,
    assumptions: path.assumptions,
    limitations: [
      "Narrative-only scenario",
      "No probability weighting",
      "No performance projection",
    ],
    mode: "counterfactual",
  }));

  return {
    available: true,
    generatedAt: new Date().toISOString(),
    scenarios,
  };
}

