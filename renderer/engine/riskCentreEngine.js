/**
 * Risk Centre Engine — V1
 * --------------------------------
 * Canonical composer for Risk Centre intelligence.
 * Deterministic. Read-only. Renderer-safe.
 */

import { computeRiskPosture } from "./riskPostureEngine.js";
import { runRiskScenarios } from "./riskScenarioEngine.js";

export function buildRiskCentre({ portfolioSnapshot = {} } = {}) {
  const generatedAt = Date.now();

  // 1. Compute overall risk posture
  const posture = computeRiskPosture({ portfolioSnapshot });

  // 2. Run deterministic stress scenarios
  const scenarioResult = runRiskScenarios({ portfolioSnapshot });

  return {
    meta: {
      engine: "RISK_CENTRE_V1",
      generatedAt
    },

    posture: posture.posture,
    postureDrivers: posture.drivers,
    postureExplanations: posture.explanations,

    scenarios: scenarioResult.scenarios,

    guarantees: {
      deterministic: true,
      readOnly: true,
      rendererSafe: true,
      noAdvice: true
    }
  };
}
