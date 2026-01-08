/**
 * D12.3 — Confidence Evaluation Orchestrator
 * ------------------------------------------
 * Purpose:
 * - Wire Discovery + Composite Signals + Confidence Transition
 * - Produce an authoritative, read-only confidence evaluation
 *
 * Rules:
 * - No execution
 * - No portfolio mutation
 * - No UI logic
 * - Deterministic
 * - Shadow autonomy only
 */

const {
  runCompositeSignalEngine
} = require("../../signals/composite/compositeSignalEngine.js");

const {
  runConfidenceTransition
} = require("../transition/confidenceTransitionEngine.js");

function runConfidenceEvaluation({
  symbol,
  priorConfidence,
  discoveryDecision,
  convictionNormalized,
  regime,
  fundamentals,
  marketContext
} = {}) {
  if (!symbol) {
    throw new Error("CONFIDENCE_EVAL_INVALID_INPUT: symbol required");
  }

  if (typeof convictionNormalized !== "number") {
    throw new Error(
      "CONFIDENCE_EVAL_INVALID_INPUT: convictionNormalized must be numeric"
    );
  }

  if (!regime) {
    throw new Error("CONFIDENCE_EVAL_INVALID_INPUT: regime required");
  }

  /* ---------------------------------------
     STEP 1: Composite Signal (fundamentals + regime)
  --------------------------------------- */
  const composite = runCompositeSignalEngine({
    symbol,
    regime,
    fundamentals: fundamentals || {},
    marketContext: marketContext || {}
  });

  /* ---------------------------------------
     STEP 2: Confidence Transition (logic only)
  --------------------------------------- */
  const transition = runConfidenceTransition({
    symbol,
    priorConfidence,
    discoveryDecision,
    convictionNormalized,
    regime
  });

  /* ---------------------------------------
     STEP 3: Orchestrated Output
  --------------------------------------- */
  return Object.freeze({
    symbol,

    discovery: Object.freeze({
      decision: discoveryDecision,
      convictionNormalized,
      regime
    }),

    compositeSignal: Object.freeze({
      score: composite?.signals?.compositeScore ?? null,
      inputs: composite?.inputs ?? {},
      interpretation: composite?.interpretation ?? {}
    }),

    confidenceTransition: Object.freeze({
      priorConfidence,
      nextConfidence: transition.nextConfidence,
      rationale: transition.rationale
    }),

    metadata: Object.freeze({
      contract: "CONFIDENCE_EVALUATION_V1",
      mode: "SHADOW",
      generatedAt: new Date().toISOString()
    }),

    disclaimer:
      "Confidence evaluation is analytical only. It does not imply execution, timing, prediction, or action."
  });
}

module.exports = Object.freeze({
  runConfidenceEvaluation
});
