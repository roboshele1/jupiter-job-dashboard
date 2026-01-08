/**
 * D12.1 — Confidence Transition Engine (V1)
 * ----------------------------------------
 * Purpose:
 * Deterministically evolve confidence states based on
 * discovery conviction and regime constraints.
 *
 * This engine:
 * - Does NOT use prices
 * - Does NOT trigger actions
 * - Does NOT rank assets
 * - Does NOT perform IPC or UI work
 *
 * It reasons only.
 */

const CONFIDENCE_STATES = Object.freeze([
  "AVOID",
  "HOLD",
  "BUY",
  "BUY_MORE",
]);

const REGIME_CONSTRAINTS = Object.freeze({
  TIGHT_MONETARY: {
    max: "HOLD",
  },
  NEUTRAL: {
    max: "BUY",
  },
  RISK_ON_GROWTH: {
    max: "BUY_MORE",
  },
});

/**
 * Helper: clamp confidence to regime ceiling
 */
function clampToRegime(confidence, regime) {
  const ceiling =
    REGIME_CONSTRAINTS[regime]?.max || "HOLD";

  const idx = CONFIDENCE_STATES.indexOf(confidence);
  const maxIdx = CONFIDENCE_STATES.indexOf(ceiling);

  return CONFIDENCE_STATES[Math.min(idx, maxIdx)];
}

/**
 * Helper: move confidence one step up or down
 */
function stepConfidence(current, direction) {
  const idx = CONFIDENCE_STATES.indexOf(current);

  if (idx === -1) return "AVOID";

  if (direction === "UP") {
    return CONFIDENCE_STATES[Math.min(idx + 1, CONFIDENCE_STATES.length - 1)];
  }

  if (direction === "DOWN") {
    return CONFIDENCE_STATES[Math.max(idx - 1, 0)];
  }

  return current;
}

/**
 * Core Engine
 */
function runConfidenceTransition({
  symbol,
  priorConfidence = "AVOID",
  discoveryDecision,
  convictionNormalized = 0,
  regime = "NEUTRAL",
} = {}) {
  if (!symbol) {
    throw new Error("CONFIDENCE_TRANSITION_MISSING_SYMBOL");
  }

  let direction = "STAY";
  let reason = "No sufficient evidence to change confidence.";

  // ---- Rule Set (V1) ----

  if (convictionNormalized < 0.3) {
    direction = "DOWN";
    reason =
      "Conviction is weak (< 0.3), indicating insufficient structural support.";
  } else if (convictionNormalized >= 0.3 && convictionNormalized < 0.6) {
    direction = "STAY";
    reason =
      "Conviction is moderate (0.3–0.6). Confidence remains stable pending stronger evidence.";
  } else if (convictionNormalized >= 0.6) {
    direction = "UP";
    reason =
      "Conviction is strong (> 0.6), supporting a confidence upgrade.";
  }

  // Decision bias (discovery can block upgrades)
  if (discoveryDecision === "AVOID" && direction === "UP") {
    direction = "STAY";
    reason =
      "Discovery decision is AVOID, preventing confidence upgrade despite conviction strength.";
  }

  // Apply step
  let nextConfidence = stepConfidence(priorConfidence, direction);

  // Apply regime ceiling
  const regimeClamped = clampToRegime(nextConfidence, regime);

  if (regimeClamped !== nextConfidence) {
    reason += ` Regime (${regime}) imposes a ceiling on confidence.`;
  }

  return Object.freeze({
    symbol,
    priorConfidence,
    nextConfidence: regimeClamped,
    convictionNormalized,
    regime,
    rationale: reason,
    disclaimer:
      "Confidence transitions are analytical only. They do not imply timing, prediction, or action.",
  });
}

module.exports = Object.freeze({
  CONFIDENCE_STATES,
  runConfidenceTransition,
});
