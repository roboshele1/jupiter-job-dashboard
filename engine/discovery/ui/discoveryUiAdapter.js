/**
 * D6.3 — Discovery UI Consumption Adapter
 * ---------------------------------------
 * Purpose:
 * Provide a STRICT, READ-ONLY, renderer-safe contract
 * for consuming Discovery outputs in the UI.
 *
 * This file:
 * - Does NOT compute scores
 * - Does NOT mutate state
 * - Does NOT infer decisions
 * - Does NOT rephrase logic
 *
 * It only:
 * - Shapes already-computed Discovery output
 * - Ensures UI receives a stable, predictable schema
 */

function adaptDiscoveryForUi(discoveryExplanation) {
  if (!discoveryExplanation || typeof discoveryExplanation !== 'object') {
    throw new Error('INVALID_INPUT: Discovery UI adapter requires an object');
  }

  const {
    symbol,
    decision,
    conviction,
    explanation,
    attribution,
    regime,
    validation,
  } = discoveryExplanation;

  if (!symbol || !decision || !conviction) {
    throw new Error(
      'MISSING_FIELDS: symbol, decision, and conviction are required for UI output'
    );
  }

  return Object.freeze({
    header: Object.freeze({
      symbol,
      decision,
      convictionScore: conviction.score,
      convictionNormalized: conviction.normalized,
    }),

    explanation: explanation || '',

    factorAttribution: attribution
      ? Object.freeze({ ...attribution })
      : Object.freeze({}),

    regimeContext: regime
      ? Object.freeze({
          label: regime.label,
          assumption: regime.assumption,
        })
      : null,

    validation: validation
      ? Object.freeze({
          available: validation.available,
          summary: validation.summary,
        })
      : Object.freeze({
          available: false,
          summary:
            'Historical validation is not yet available for this asset.',
        }),

    governanceNote:
      'Discovery outputs are mathematical classifications only. No actions are executed.',
  });
}

module.exports = Object.freeze({
  adaptDiscoveryForUi,
});
