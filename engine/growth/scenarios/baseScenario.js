/**
 * Growth Scenario – Base
 * Contract: pure function, no side effects
 * Input: { startingValue, years }
 * Output: { scenarioName, projections }
 */

export function runBaseScenario({ startingValue, years = 5 }) {
  return {
    scenarioName: "BASELINE",
    projections: Array.from({ length: years }).map((_, i) => ({
      year: i + 1,
      value: startingValue,
    })),
  };
}
