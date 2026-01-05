/**
 * SCENARIO_INTAKE_ENGINE_V1
 * ------------------------
 * Phase 8.3 — Scenario Intake & Validation Layer
 *
 * Purpose:
 * - Translate user "what-if" intent into governed simulation requests
 * - Enforce governance BEFORE any growth logic executes
 *
 * This layer:
 * - Does NOT calculate outcomes
 * - Does NOT recommend actions
 * - Does NOT assume missing inputs
 * - Does NOT mutate system state
 *
 * Observer + gatekeeper only.
 */

import fs from "fs";
import path from "path";

/* =========================================================
   GOVERNANCE CONTRACT CHECK
========================================================= */

const GOVERNANCE_PATH = path.resolve(
  process.cwd(),
  "engine/growth/GOVERNANCE_CONTRACT.md"
);

function assertGovernancePresent() {
  if (!fs.existsSync(GOVERNANCE_PATH)) {
    return {
      status: "BLOCKED",
      reason: "GOVERNANCE_CONTRACT_MISSING",
    };
  }

  return { status: "OK" };
}

/* =========================================================
   SCENARIO REGISTRY (LOCKED)
========================================================= */

const SCENARIO_REGISTRY = {
  TARGET_VALUE_BY_DATE: {
    requiredInputs: ["targetValue", "targetYear"],
    description:
      "Feasibility of reaching a target value by a given year under constraints.",
  },

  CONTRIBUTION_SENSITIVITY: {
    requiredInputs: ["targetValue", "targetYear", "contributionRange"],
    description:
      "Sensitivity of feasibility to different contribution levels.",
  },

  REGIME_STRESS_TEST: {
    requiredInputs: ["targetValue", "targetYear"],
    description:
      "Outcome envelope under adverse regime transitions.",
  },
};

/* =========================================================
   INPUT VALIDATION
========================================================= */

function validateInputs(scenarioKey, inputs = {}) {
  const scenario = SCENARIO_REGISTRY[scenarioKey];

  if (!scenario) {
    return {
      valid: false,
      reason: "SCENARIO_NOT_REGISTERED",
    };
  }

  const missing = scenario.requiredInputs.filter(
    (key) => inputs[key] === undefined || inputs[key] === null
  );

  if (missing.length > 0) {
    return {
      valid: false,
      reason: "INSUFFICIENT_INPUTS",
      missing,
    };
  }

  return { valid: true };
}

/* =========================================================
   MAIN ENTRYPOINT
========================================================= */

export function runScenarioIntake({
  scenarioKey = null,
  inputs = {},
  regimeContext = null,
} = {}) {
  // 1. Governance enforcement (hard stop)
  const governance = assertGovernancePresent();
  if (governance.status !== "OK") {
    return {
      contract: "SCENARIO_INTAKE_V1",
      status: "BLOCKED",
      reason: governance.reason,
      timestamp: Date.now(),
    };
  }

  // 2. Scenario validation
  if (!scenarioKey) {
    return {
      contract: "SCENARIO_INTAKE_V1",
      status: "INSUFFICIENT_INPUTS",
      reason: "SCENARIO_KEY_MISSING",
      timestamp: Date.now(),
    };
  }

  const validation = validateInputs(scenarioKey, inputs);

  if (!validation.valid) {
    return {
      contract: "SCENARIO_INTAKE_V1",
      status: validation.reason,
      missing: validation.missing || [],
      timestamp: Date.now(),
    };
  }

  // 3. Regime awareness (no enforcement yet — labeling only)
  const regimeLabel = regimeContext
    ? regimeContext.regime || "UNKNOWN"
    : "UNKNOWN";

  // 4. Approved intake (READY — but NOT executed)
  return {
    contract: "SCENARIO_INTAKE_V1",
    status: "READY_FOR_SIMULATION",
    scenario: scenarioKey,
    inputs,
    constraints: {
      governanceEnforced: true,
      regime: regimeLabel,
      executionAllowed: false,
      adviceAllowed: false,
    },
    timestamp: Date.now(),
  };
}
