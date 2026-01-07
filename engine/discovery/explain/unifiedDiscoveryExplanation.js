/**
 * D6.1 — Unified Discovery Explanation Contract
 * ---------------------------------------------
 * Purpose:
 * Provide a single, deterministic, human-readable explanation object
 * that merges all Discovery intelligence layers.
 *
 * This file does NOT:
 * - Issue advice
 * - Trigger actions
 * - Mutate state
 *
 * It ONLY explains how a Discovery classification was formed.
 */

function explainDiscoveryResult(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('INVALID_INPUT: Discovery explanation requires an object');
  }

  const {
    symbol,
    decision,
    conviction,
    fundamentals,
    tactical,
    regime,
    attribution,
    validation,
  } = input;

  if (!symbol || !decision || conviction == null) {
    throw new Error('MISSING_FIELDS: symbol, decision, and conviction are required');
  }

  const explanation = {
    symbol,

    decision,

    convictionScore: conviction.score,
    convictionNormalized: conviction.normalized,

    regime: {
      label: regime?.label || 'UNKNOWN',
      assumption: regime?.assumption || 'No explicit regime assumption provided.',
    },

    fundamentals: {
      score: fundamentals?.score ?? null,
      summary:
        fundamentals?.summary ||
        'Fundamental data was used to assess business strength and financial quality.',
    },

    tacticalContext: {
      score: tactical?.score ?? null,
      summary:
        tactical?.summary ||
        'Market behavior was reviewed for stability and consistency, not timing.',
      note:
        'This context does not provide entry or exit timing.',
    },

    factorAttribution: attribution || {},

    historicalValidation: validation || {
      available: false,
      summary:
        'This asset has not yet accumulated sufficient historical Discovery decisions.',
    },

    plainEnglishSummary: buildPlainEnglishSummary({
      decision,
      regime,
      fundamentals,
      tactical,
      validation,
    }),

    disclaimer:
      'This classification is a mathematical assessment based on historical data. It is not financial advice and does not instruct actions.',
  };

  return Object.freeze(explanation);
}

function buildPlainEnglishSummary({
  decision,
  regime,
  fundamentals,
  tactical,
  validation,
}) {
  const lines = [];

  lines.push(
    `Jupiter classified this asset as ${decision.replace('_', ' ')} based on measured data, not opinions.`
  );

  if (fundamentals?.summary) {
    lines.push(`From a business perspective: ${fundamentals.summary}`);
  }

  if (tactical?.summary) {
    lines.push(`From a market behavior perspective: ${tactical.summary}`);
  }

  if (regime?.label) {
    lines.push(
      `This assessment assumes a ${regime.label.replace('_', ' ').toLowerCase()} economic environment.`
    );
  }

  if (validation?.summary) {
    lines.push(`Historically: ${validation.summary}`);
  }

  return lines.join(' ');
}

module.exports = Object.freeze({
  explainDiscoveryResult,
});
