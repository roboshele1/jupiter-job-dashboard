/**
 * GROWTH_SIMULATION_ENGINE_V1
 * --------------------------
 * Phase 8.1 — Growth engine skeleton (no math, no projections)
 * Phase 9.4 — Contract shape normalization
 *
 * Purpose:
 * - Define a governed simulation envelope
 * - Validate presence of governance contract
 * - Accept “what-if” growth queries
 * - Emit a stable, deterministic contract
 *
 * This engine:
 * - Does NOT calculate outcomes
 * - Does NOT recommend actions
 * - Does NOT modify portfolio state
 *
 * Observer mode only.
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
      "Growth engine blocked: GOVERNANCE_CONTRACT.md is missing."
    );
  }
}

/* =========================================================
   CONTRACT METADATA
========================================================= */

const CONTRACT_NAME = "GROWTH_SIMULATION_V1";
const CONTRACT_VERSION = "1.0.0";

/* =========================================================
   SIMULATION ENVELOPE (STRUCTURE ONLY)
========================================================= */

function buildSimulationEnvelope({ targetValue, targetYear, cadence }) {
  return {
    targetValue,
    targetYear,
    cadence,
    assumptions: {
      returns: "UNSPECIFIED",
      contributions: "UNSPECIFIED",
      volatility: "UNSPECIFIED",
    },
    status: "DEFINED_NOT_EVALUATED",
  };
}

/* =========================================================
   MAIN ENTRYPOINT
========================================================= */

export function runGrowthSimulation({
  targetValue = null,
  targetYear = null,
  cadence = "MONTHLY",
} = {}) {
  // Enforce governance
  assertGovernancePresent();

  const timestamp = Date.now();

  // Validate intent (structure only)
  if (!targetValue || !targetYear) {
    return {
      contract: CONTRACT_NAME,
      contractVersion: CONTRACT_VERSION,
      status: "INSUFFICIENT_INPUTS",
      envelope: null,
      constraints: {
        governanceEnforced: true,
        adviceAllowed: false,
        executionAllowed: false,
      },
      message:
        "Growth simulation requires a target value and target year.",
      timestamp,
    };
  }

  const envelope = buildSimulationEnvelope({
    targetValue,
    targetYear,
    cadence,
  });

  return {
    contract: CONTRACT_NAME,
    contractVersion: CONTRACT_VERSION,
    status: "READY_FOR_MODELING",
    envelope,
    constraints: {
      governanceEnforced: true,
      adviceAllowed: false,
      executionAllowed: false,
    },
    timestamp,
  };
}
