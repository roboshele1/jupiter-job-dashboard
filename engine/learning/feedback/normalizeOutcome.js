// engine/learning/feedback/normalizeOutcome.js
export function normalizeOutcome(rawOutcome) {
  return {
    decisionType: rawOutcome.decisionType,
    success: rawOutcome.output?.success ?? true,
    magnitude: rawOutcome.output?.capitalGap ?? 0,
    confidence: rawOutcome.confidence ?? 0.5
  };
}

