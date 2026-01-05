/**
 * GROWTH_SIMULATION_ENGINE_V1
 * --------------------------
 * Phase 8.1 — Growth engine skeleton (no math, no projections)
 *
 * Purpose:
 * - Define a governed simulation envelope
 * - Validate presence of governance contract
 * - Accept “what-if” growth queries
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

  // Validate intent (structure only)
  if (!targetValue || !targetYear) {
    return {
      contract: "GROWTH_SIMULATION_V1",
      status: "INSUFFICIENT_INPUTS",
      message:
        "Growth simulation requires a target value and target year.",
      timestamp: Date.now(),
    };
  }

  const envelope = buildSimulationEnvelope({
    targetValue,
    targetYear,
    cadence,
  });

  return {
    contract: "GROWTH_SIMULATION_V1",
    status: "READY_FOR_MODELING",
    envelope,
    constraints: {
      governanceEnforced: true,
      adviceAllowed: false,
      executionAllowed: false,
    },
    timestamp: Date.now(),
  };
}
