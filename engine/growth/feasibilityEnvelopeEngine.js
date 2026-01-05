/**
 * FEASIBILITY_ENVELOPE_ENGINE_V1
 * -----------------------------
 * Phase 8.5 — Feasibility envelope derivation
 *
 * Purpose:
 * - Convert governed constraints into a feasibility envelope
 * - NO math, NO projections, NO advice
 * - Outputs ranges, not answers
 *
 * This engine:
 * - Consumes constraint derivation output
 * - Produces feasibility bands
 * - Remains fully governed and read-only
 */

export function deriveFeasibilityEnvelope({
  constraintDerivation,
  scenario,
  inputs,
  regimeContext,
} = {}) {
  if (!constraintDerivation || constraintDerivation.status !== "DERIVED") {
    return {
      contract: "FEASIBILITY_ENVELOPE_V1",
      status: "BLOCKED",
      reason: "CONSTRAINTS_NOT_DERIVED",
      timestamp: Date.now(),
    };
  }

  if (!scenario || !inputs) {
    return {
      contract: "FEASIBILITY_ENVELOPE_V1",
      status: "INSUFFICIENT_INPUTS",
      missing: ["scenario", "inputs"],
      timestamp: Date.now(),
    };
  }

  const envelope = {
    scenario,
    target: inputs.targetValue ?? null,
    horizon: inputs.targetYear ?? null,

    feasibilityBands: {
      contributions: "REQUIRED_RANGE_UNSPECIFIED",
      volatilityTolerance: "IMPLIED_BY_REGIME",
      drawdownTolerance: "IMPLIED_BY_REGIME",
    },

    regimeContext: regimeContext?.regime ?? "UNKNOWN",

    notes: [
      "This envelope defines feasibility bounds, not recommendations.",
      "All ranges are conditional on governance and regime constraints.",
      "No optimization or execution logic is permitted.",
    ],
  };

  return {
    contract: "FEASIBILITY_ENVELOPE_V1",
    status: "FEASIBILITY_DEFINED",
    envelope,
    constraints: constraintDerivation.constraints,
    governanceEnforced: constraintDerivation.governanceEnforced === true,
    timestamp: Date.now(),
  };
}
