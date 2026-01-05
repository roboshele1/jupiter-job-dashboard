/**
 * GROWTH_SYNTHESIS_ENGINE_V1
 * --------------------------
 * Phase 8.9 — Growth synthesis layer (FINAL, governed)
 *
 * Purpose:
 * - Aggregate growth-related derivations into a single governed output
 * - Provide a coherent feasibility narrative WITHOUT math or advice
 *
 * This engine:
 * - DOES NOT calculate returns
 * - DOES NOT recommend actions
 * - DOES NOT execute trades
 * - DOES NOT optimize
 *
 * It only synthesizes:
 * - Scenario intake
 * - Constraint derivation
 * - Feasibility envelope
 * - Sensitivity signals
 *
 * Observer mode only.
 */

import { runScenarioIntake } from "./scenarioIntake.js";
import { deriveGrowthConstraints } from "./constraintDerivationEngine.js";
import { deriveFeasibilityEnvelope } from "./feasibilityEnvelopeEngine.js";
import { deriveContributionSensitivity } from "./contributionSensitivityEngine.js";
import { deriveTimeSensitivity } from "./timeSensitivityEngine.js";

/* =========================================================
   MAIN SYNTHESIS ENTRYPOINT
========================================================= */

export function runGrowthSynthesis({
  scenarioKey,
  inputs = {},
  regimeContext = {},
} = {}) {
  // -------------------------------------------------------
  // 1. Scenario intake & validation
  // -------------------------------------------------------
  const intake = runScenarioIntake({
    scenarioKey,
    inputs,
    regimeContext,
  });

  if (intake.status !== "READY_FOR_SIMULATION") {
    return {
      contract: "GROWTH_SYNTHESIS_V1",
      status: "BLOCKED",
      reason: "SCENARIO_INTAKE_FAILED",
      intake,
      timestamp: Date.now(),
    };
  }

  // -------------------------------------------------------
  // 2. Constraint derivation (governance enforced)
  // -------------------------------------------------------
  const constraints = deriveGrowthConstraints({
    scenario: scenarioKey,
    regimeContext,
  });

  // -------------------------------------------------------
  // 3. Feasibility envelope derivation
  // -------------------------------------------------------
  const feasibility = deriveFeasibilityEnvelope({
    scenario: scenarioKey,
    inputs,
    regimeContext,
    constraintDerivation: constraints,
  });

  // -------------------------------------------------------
  // 4. Sensitivity derivations (qualitative only)
  // -------------------------------------------------------
  const contributionSensitivity = deriveContributionSensitivity({
    scenario: scenarioKey,
    inputs,
    regimeContext,
  });

  const timeSensitivity = deriveTimeSensitivity({
    scenario: scenarioKey,
    inputs,
    regimeContext,
  });

  // -------------------------------------------------------
  // 5. Final synthesis (NON-EXECUTING)
  // -------------------------------------------------------
  return {
    contract: "GROWTH_SYNTHESIS_V1",
    status: "SYNTHESIZED",
    scenario: scenarioKey,

    synthesis: {
      feasibilityEnvelope: feasibility.envelope,
      sensitivities: {
        contributionPressure: contributionSensitivity.contributionPressure,
        timePressure: timeSensitivity.timePressure,
      },
    },

    governance: {
      enforced: true,
      adviceAllowed: false,
      executionAllowed: false,
      optimizationAllowed: false,
    },

    rationale: [
      "This synthesis defines feasibility boundaries, not actions.",
      "All outputs are constrained by governance and regime context.",
      "No projections, recommendations, or execution paths are produced.",
    ],

    timestamp: Date.now(),
  };
}
