/**
 * CONSTRAINT_DERIVATION_ENGINE_V1
 * -------------------------------
 * Phase 8.4 — Constraint Derivation Layer
 *
 * Purpose:
 * - Translate scenario + regime + governance into explicit constraints
 * - Produce a deterministic constraint map
 *
 * This engine:
 * - Does NOT simulate
 * - Does NOT optimize
 * - Does NOT recommend
 * - Does NOT mutate state
 *
 * Output is descriptive, not prescriptive.
 */

import fs from "fs";
import path from "path";

/* =========================================================
   GOVERNANCE VALIDATION
========================================================= */

const GOVERNANCE_PATH = path.resolve(
  process.cwd(),
  "engine/growth/GOVERNANCE_CONTRACT.md"
);

function assertGovernancePresent() {
  if (!fs.existsSync(GOVERNANCE_PATH)) {
    throw new Error(
      "Constraint derivation blocked: GOVERNANCE_CONTRACT.md missing."
    );
  }
}

/* =========================================================
   CONSTRAINT LOGIC
========================================================= */

function deriveConstraints({ scenario, inputs, regimeContext }) {
  const constraints = [];

  // Universal constraints
  constraints.push({
    type: "ENGINE",
    rule: "NO_ADVICE",
    enforced: true,
  });

  constraints.push({
    type: "ENGINE",
    rule: "NO_EXECUTION",
    enforced: true,
  });

  // Regime-based constraints
  if (regimeContext?.regime === "RISK_OFF") {
    constraints.push({
      type: "REGIME",
      rule: "LEVERAGE_RESTRICTED",
      enforced: true,
      rationale: "Risk-off regime increases drawdown sensitivity.",
    });
  }

  if (regimeContext?.regime === "RISK_ON") {
    constraints.push({
      type: "REGIME",
      rule: "GROWTH_ALLOWED",
      enforced: true,
      rationale: "Risk-on regime permits growth exploration under governance.",
    });
  }

  // Scenario-based constraints
  if (scenario === "TARGET_VALUE_BY_DATE") {
    constraints.push({
      type: "SCENARIO",
      rule: "CONTRIBUTIONS_REQUIRED",
      enforced: true,
      rationale:
        "Target-value scenarios require explicit contribution assumptions.",
    });
  }

  // Input completeness checks
  if (!inputs?.targetValue || !inputs?.targetYear) {
    constraints.push({
      type: "INPUT",
      rule: "INSUFFICIENT_INPUTS",
      enforced: true,
      rationale: "Missing required scenario inputs.",
    });
  }

  return constraints;
}

/* =========================================================
   MAIN ENTRYPOINT
========================================================= */

export function deriveGrowthConstraints({
  scenario = null,
  inputs = {},
  regimeContext = {},
} = {}) {
  assertGovernancePresent();

  if (!scenario) {
    return {
      contract: "CONSTRAINT_DERIVATION_V1",
      status: "BLOCKED",
      reason: "SCENARIO_MISSING",
      timestamp: Date.now(),
    };
  }

  const constraints = deriveConstraints({
    scenario,
    inputs,
    regimeContext,
  });

  return {
    contract: "CONSTRAINT_DERIVATION_V1",
    status: "DERIVED",
    scenario,
    constraints,
    governanceEnforced: true,
    timestamp: Date.now(),
  };
}
