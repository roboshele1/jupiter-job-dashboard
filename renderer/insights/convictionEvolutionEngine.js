/**
 * Conviction Evolution Engine — V1
 * --------------------------------
 * Purpose:
 * - Convert time-under-pressure into explicit conviction outcomes.
 * - Structural, non-reactive, signal-free.
 *
 * Guarantees:
 * - Deterministic
 * - Read-only
 * - No UI coupling
 * - No portfolio mutation
 */

export function buildConvictionEvolution(input = {}) {
  const rows = [];

  const symbol = input.symbol;
  const confidence = input.confidence || {};
  const state = confidence.state;
  const daysInState = confidence.time?.daysInState ?? 0;

  if (!symbol || !state) {
    return rows;
  }

  /*
   * Core Rule: Time-under-pressure
   * ------------------------------
   * If the market has failed to break the asset
   * after sufficient time in a LOW confidence state,
   * conviction increases structurally.
   */

  if (
    (state === "LOW" || state === "DEGRADED") &&
    daysInState >= 90
  ) {
    rows.push({
      symbol,
      convictionZone: "ACCUMULATE",
      confidenceState: state,
      daysInState,
      rationale:
        "Asset has remained unbroken despite prolonged low-conviction pressure.",
      interpretation:
        "Time is validating the thesis; accumulation favored over reaction.",
      timeThresholdMet: true,
      severity: daysInState >= 180 ? "HIGH" : "MODERATE",
      guarantees: {
        deterministic: true,
        signalFree: true,
        readOnly: true
      }
    });
  }

  /*
   * Escalation Rule: Excessive pressure
   * ----------------------------------
   * Extremely long persistence without recovery
   * elevates conviction strength.
   */

  if (
    state === "LOW" &&
    daysInState >= 180
  ) {
    rows.push({
      symbol,
      convictionZone: "STRONG_ACCUMULATE",
      confidenceState: state,
      daysInState,
      rationale:
        "Extended failure to break the asset suggests strong underlying resilience.",
      interpretation:
        "Market stress has failed repeatedly; conviction strengthens further.",
      timeThresholdMet: true,
      severity: "HIGH",
      guarantees: {
        deterministic: true,
        signalFree: true,
        readOnly: true
      }
    });
  }

  return rows;
}
