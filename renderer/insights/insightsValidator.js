/**
 * INSIGHTS VALIDATION LAYER — Phase 1E
 * Deterministic, schema-safe gate before UI
 */

export function validateInsights(insights) {
  if (!insights || !insights.meta) {
    return {
      valid: false,
      reason: "Insights object missing meta"
    };
  }

  if (!insights.snapshot || insights.snapshot.available !== true) {
    return {
      valid: false,
      reason: "Snapshot unavailable — observer mode"
    };
  }

  if (!insights.signals || insights.signals.available !== true) {
    return {
      valid: false,
      reason: "Signals unavailable — observer mode"
    };
  }

  return {
    valid: true
  };
}

