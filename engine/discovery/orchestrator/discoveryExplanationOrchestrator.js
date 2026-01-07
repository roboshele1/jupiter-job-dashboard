/**
 * D6.2 — Discovery Explanation Orchestrator
 * -----------------------------------------
 * Purpose:
 * Wire all Discovery intelligence layers into a single,
 * deterministic, plain-English explanation object.
 *
 * Inputs are READ-ONLY.
 * Outputs are READ-ONLY.
 * No execution. No mutation. No persuasion.
 */

const { explainDiscoveryResult } = require('../explain/unifiedDiscoveryExplanation.js');

function buildDiscoveryExplanation(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('INVALID_INPUT: Discovery orchestrator requires an object');
  }

  const {
    symbol,
    decisionResult,
    compositeConviction,
    fundamentalExplanation,
    tacticalExplanation,
    regimeExplanation,
    factorAttribution,
    longitudinalSummary,
  } = payload;

  if (!symbol || !decisionResult || !compositeConviction) {
    throw new Error(
      'MISSING_FIELDS: symbol, decisionResult, and compositeConviction are required'
    );
  }

  const explanationInput = Object.freeze({
    symbol,

    decision: decisionResult.decision,

    conviction: Object.freeze({
      score: compositeConviction.score,
      normalized: compositeConviction.normalized,
    }),

    fundamentals: fundamentalExplanation
      ? Object.freeze({
          score: fundamentalExplanation.score,
          summary: fundamentalExplanation.summary,
        })
      : null,

    tactical: tacticalExplanation
      ? Object.freeze({
          score: tacticalExplanation.score,
          summary: tacticalExplanation.summary,
        })
      : null,

    regime: regimeExplanation
      ? Object.freeze({
          label: regimeExplanation.regime,
          assumption: regimeExplanation.assumption,
        })
      : null,

    attribution: factorAttribution
      ? Object.freeze({ ...factorAttribution })
      : {},

    validation: longitudinalSummary
      ? Object.freeze({
          available: true,
          summary: longitudinalSummary.summary,
        })
      : Object.freeze({
          available: false,
          summary:
            'This asset does not yet have enough historical Discovery decisions to evaluate outcomes.',
        }),
  });

  return explainDiscoveryResult(explanationInput);
}

module.exports = Object.freeze({
  buildDiscoveryExplanation,
});
