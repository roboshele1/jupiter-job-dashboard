/**
 * SCENARIO_REGISTRY_V1
 * -------------------
 * Phase 8.2 — Governed Scenario Definitions
 *
 * This file defines ALL allowed growth “what-if” scenarios in JUPITER.
 *
 * ❗ This is NOT a calculator
 * ❗ This is NOT a recommendation system
 * ❗ This is NOT a portfolio modifier
 *
 * It is a registry of:
 * - Allowed scenario types
 * - Required user inputs
 * - Governance constraints
 * - Permitted language & outputs
 *
 * Any scenario not defined here MUST NOT EXECUTE.
 */

export const SCENARIO_REGISTRY = {
  /**
   * ---------------------------------------------------------
   * TARGET VALUE SCENARIO
   * ---------------------------------------------------------
   * Example:
   * "I want $1M by 2037"
   */
  TARGET_VALUE: {
    id: "TARGET_VALUE",
    description:
      "Evaluates feasibility envelopes for reaching a target portfolio value within a given time horizon.",
    requiredInputs: [
      "targetValue",
      "targetYear",
    ],
    optionalInputs: [
      "contributionRange",
      "cadence",
    ],
    prohibitedOutputs: [
      "recommendedContribution",
      "requiredAction",
      "optimalStrategy",
    ],
    governedBy: "GOVERNANCE_CONTRACT_V1",
    executionRules: {
      allowMath: false,
      allowOptimization: false,
      allowAdvice: false,
    },
    outputLanguage: {
      tone: "conditional",
      framing: "scenario-based",
      certainty: "probabilistic",
    },
  },

  /**
   * ---------------------------------------------------------
   * CONTRIBUTION SENSITIVITY SCENARIO
   * ---------------------------------------------------------
   * Example:
   * "What happens if I contribute between $500–$1,000 per month?"
   */
  CONTRIBUTION_SENSITIVITY: {
    id: "CONTRIBUTION_SENSITIVITY",
    description:
      "Explores how varying contribution levels influence growth feasibility under current regime constraints.",
    requiredInputs: [
      "contributionRange",
      "timeHorizon",
    ],
    optionalInputs: [
      "targetValue",
    ],
    prohibitedOutputs: [
      "bestContribution",
      "recommendedAmount",
    ],
    governedBy: "GOVERNANCE_CONTRACT_V1",
    executionRules: {
      allowMath: false,
      allowOptimization: false,
      allowAdvice: false,
    },
    outputLanguage: {
      tone: "neutral",
      framing: "sensitivity-band",
      certainty: "conditional",
    },
  },

  /**
   * ---------------------------------------------------------
   * REGIME STRESS SCENARIO
   * ---------------------------------------------------------
   * Example:
   * "What if markets turn risk-off for 2 years?"
   */
  REGIME_STRESS: {
    id: "REGIME_STRESS",
    description:
      "Evaluates how growth feasibility envelopes shift under adverse or changing market regimes.",
    requiredInputs: [
      "stressRegime",
      "duration",
    ],
    optionalInputs: [
      "targetValue",
    ],
    prohibitedOutputs: [
      "exitTiming",
      "riskAvoidanceInstructions",
    ],
    governedBy: "GOVERNANCE_CONTRACT_V1",
    executionRules: {
      allowMath: false,
      allowOptimization: false,
      allowAdvice: false,
    },
    outputLanguage: {
      tone: "descriptive",
      framing: "risk-envelope",
      certainty: "scenario-conditional",
    },
  },
};

/**
 * ---------------------------------------------------------
 * REGISTRY ACCESSOR
 * ---------------------------------------------------------
 */

export function getScenarioDefinition(scenarioId) {
  const scenario = SCENARIO_REGISTRY[scenarioId];

  if (!scenario) {
    throw new Error(
      `Growth scenario '${scenarioId}' is not registered or not permitted.`
    );
  }

  return scenario;
}
