/**
 * CONTRIBUTION_SENSITIVITY_ENGINE_V1
 * ---------------------------------
 * Phase 8.7 — Contribution Sensitivity Layer
 *
 * Purpose:
 * - Derive qualitative contribution pressure bands
 * - Based on target value and time horizon ONLY
 *
 * This engine:
 * - Performs NO math
 * - Performs NO optimization
 * - Emits symbolic pressure ranges only
 *
 * Governed. Non-executing. Observer-only.
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
      "Contribution sensitivity blocked: GOVERNANCE_CONTRACT.md missing."
    );
  }
}

/* =========================================================
   CONTRIBUTION PRESSURE DERIVATION (SYMBOLIC ONLY)
========================================================= */

function deriveContributionPressure({ targetValue, targetYear }) {
  const currentYear = new Date().getFullYear();
  const yearsRemaining = targetYear - currentYear;

  if (yearsRemaining <= 0) {
    return {
      band: "INVALID",
      rationale: "Target year must be in the future.",
    };
  }

  if (yearsRemaining >= 15) {
    return {
      band: "LOW",
      rationale:
        "Extended time horizon reduces required contribution pressure.",
    };
  }

  if (yearsRemaining >= 7) {
    return {
      band: "MEDIUM",
      rationale:
        "Moderate horizon implies balanced contribution pressure.",
    };
  }

  return {
    band: "HIGH",
    rationale:
      "Short horizon implies elevated contribution pressure under governance.",
  };
}

/* =========================================================
   MAIN ENTRYPOINT
========================================================= */

export function deriveContributionSensitivity({
  scenario,
  inputs = {},
  regimeContext = {},
} = {}) {
  assertGovernancePresent();

  const { targetValue, targetYear } = inputs;

  if (!targetValue || !targetYear) {
    return {
      contract: "CONTRIBUTION_SENSITIVITY_V1",
      status: "INSUFFICIENT_INPUTS",
      missing: ["targetValue", "targetYear"].filter(
        k => !inputs[k]
      ),
      timestamp: Date.now(),
    };
  }

  const pressure = deriveContributionPressure({
    targetValue,
    targetYear,
  });

  return {
    contract: "CONTRIBUTION_SENSITIVITY_V1",
    status: "DERIVED",
    scenario,
    contributionPressure: pressure.band,
    rationale: pressure.rationale,
    regimeContext: regimeContext.regime || "UNSPECIFIED",
    governanceEnforced: true,
    executionAllowed: false,
    adviceAllowed: false,
    timestamp: Date.now(),
  };
}
