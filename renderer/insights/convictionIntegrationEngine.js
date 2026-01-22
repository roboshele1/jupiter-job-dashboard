/**
 * Conviction Integration Engine — V1
 * ----------------------------------
 * Time-under-pressure conviction evaluator.
 *
 * PURPOSE:
 * - Convert confidence duration into conviction zones
 * - Deterministic, signal-free
 * - Read-only (Insights-only)
 *
 * NO pricing logic
 * NO execution
 * NO portfolio mutation
 */

export function runConvictionIntegration({
  confidence,
  symbols = []
}) {
  if (!Array.isArray(symbols) || symbols.length === 0) return [];

  const daysInState = confidence?.time?.daysInState ?? 0;
  const confidenceState = confidence?.state ?? "UNKNOWN";

  return symbols.map(symbol => {
    let convictionZone = "HOLD";
    let severity = "LOW";
    let rationale = "No prolonged pressure detected.";

    if (daysInState >= 180) {
      convictionZone = "CORE_ACCUMULATE";
      severity = "HIGH";
      rationale =
        "Extended failure to break despite prolonged adverse conditions.";
    } else if (daysInState >= 90) {
      convictionZone = "ACCUMULATE";
      severity = "MODERATE";
      rationale =
        "Asset has remained unbroken despite prolonged low-conviction pressure.";
    }

    return {
      symbol,
      convictionZone,
      confidenceState,
      daysInState,
      rationale,
      interpretation:
        "Time is validating the thesis; accumulation favored over reaction.",
      timeThresholdMet: daysInState >= 90,
      severity,
      guarantees: {
        deterministic: true,
        signalFree: true,
        readOnly: true
      }
    };
  });
}
