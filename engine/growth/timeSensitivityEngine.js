/**
 * TIME_SENSITIVITY_ENGINE_V1
 * -------------------------
 * Phase 8.8 — Time sensitivity derivation (governed, non-executing)
 *
 * Purpose:
 * - Assess how time horizon affects feasibility pressure
 * - NO math, NO projections
 * - Governance- and regime-constrained
 *
 * Output:
 * - Qualitative time pressure classification
 * - Audit-friendly, deterministic structure
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
      "Time sensitivity blocked: GOVERNANCE_CONTRACT.md is missing."
    );
  }
}

/* =========================================================
   TIME PRESSURE DERIVATION (STRUCTURAL)
========================================================= */

function classifyTimePressure({ targetYear }) {
  const currentYear = new Date().getFullYear();
  const yearsRemaining = targetYear - currentYear;

  if (yearsRemaining <= 0) return "INVALID_HORIZON";
  if (yearsRemaining <= 5) return "HIGH";
  if (yearsRemaining <= 10) return "MODERATE";
  return "LOW";
}

/* =========================================================
   MAIN ENTRYPOINT
========================================================= */

export function deriveTimeSensitivity({
  scenario = null,
  inputs = {},
  regimeContext = {},
} = {}) {
  // Enforce governance
  assertGovernancePresent();

  if (!scenario) {
    return {
      contract: "TIME_SENSITIVITY_V1",
      status: "INSUFFICIENT_INPUTS",
      reason: "SCENARIO_MISSING",
      timestamp: Date.now(),
    };
  }

  const { targetYear } = inputs;

  if (!targetYear) {
    return {
      contract: "TIME_SENSITIVITY_V1",
      status: "INSUFFICIENT_INPUTS",
      reason: "TARGET_YEAR_MISSING",
      timestamp: Date.now(),
    };
  }

  const timePressure = classifyTimePressure({ targetYear });

  return {
    contract: "TIME_SENSITIVITY_V1",
    status: "DERIVED",
    scenario,
    timePressure,
    regimeContext: regimeContext?.regime || "UNSPECIFIED",
    governanceEnforced: true,
    executionAllowed: false,
    adviceAllowed: false,
    rationale:
      timePressure === "HIGH"
        ? "Short horizon increases sensitivity to timing and contribution discipline under governance."
        : timePressure === "MODERATE"
        ? "Moderate horizon allows flexibility but remains sensitive to regime shifts."
        : "Long horizon reduces time pressure under governed growth exploration.",
    timestamp: Date.now(),
  };
}
