/**
 * DISCOVERY LAB — REGIME-CONDITIONED SCORING HOOKS (D2.3)
 * ------------------------------------------------------
 * Adjusts composite conviction score *contextually*
 * based on macro regime.
 *
 * - No mutation of raw scores
 * - Deterministic
 * - Discovery-only
 * - Transparent adjustments
 */

const REGIME_ADJUSTMENTS = Object.freeze({
  RISK_ON_GROWTH: Object.freeze({
    growth: 1.15,
    quality: 1.0,
    risk: 0.95,
    momentum: 1.1,
  }),

  INFLATIONARY_EXPANSION: Object.freeze({
    growth: 1.0,
    quality: 1.1,
    risk: 1.0,
    momentum: 0.95,
  }),

  TIGHT_MONETARY: Object.freeze({
    growth: 0.85,
    quality: 1.15,
    risk: 1.2,
    momentum: 0.9,
  }),

  RISK_OFF_DEFENSIVE: Object.freeze({
    growth: 0.75,
    quality: 1.25,
    risk: 1.3,
    momentum: 0.8,
  }),
});

/**
 * Input:
 * {
 *   regime: string,
 *   factors: {
 *     growth: number,
 *     quality: number,
 *     risk: number,
 *     momentum: number
 *   }
 * }
 */
function applyRegimeAdjustments(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: regime scoring requires input object");
  }

  const { regime, factors } = input;

  if (!REGIME_ADJUSTMENTS[regime]) {
    throw new Error(`UNKNOWN_REGIME: ${regime}`);
  }

  if (!factors || typeof factors !== "object") {
    throw new Error("INVALID_INPUT: missing factor scores");
  }

  const adjustments = REGIME_ADJUSTMENTS[regime];

  const adjustedFactors = Object.freeze({
    growth: factors.growth * adjustments.growth,
    quality: factors.quality * adjustments.quality,
    risk: factors.risk * adjustments.risk,
    momentum: factors.momentum * adjustments.momentum,
  });

  return Object.freeze({
    regime,
    baseFactors: Object.freeze({ ...factors }),
    adjustments,
    adjustedFactors,
    note:
      "Scores are context-adjusted based on economic regime. Raw metrics remain unchanged.",
  });
}

module.exports = Object.freeze({
  applyRegimeAdjustments,
});
