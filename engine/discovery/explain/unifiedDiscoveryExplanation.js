/**
 * D6.2 — Unified Discovery Explanation Contract (LIVE)
 * ---------------------------------------------------
 * Purpose:
 * Provide a single, deterministic, human-readable explanation object
 * that merges all Discovery intelligence layers, including LIVE tactical context.
 *
 * Guarantees:
 * - Read-only
 * - Deterministic
 * - Explainable in everyday English
 * - No advice, no actions
 */

const { explainTacticalContext } = require("./tacticalExplanation.js");

function explainDiscoveryResult(input) {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_INPUT: Discovery explanation requires an object");
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
    throw new Error(
      "MISSING_FIELDS: symbol, decision, and conviction are required"
    );
  }

  // LIVE tactical explanation (safe even if inputs are partial)
  const tacticalExplanation = explainTacticalContext(
    tactical?.inputs || {},
    tactical || {}
  );

  const explanation = Object.freeze({
    symbol,

    decision,

    convictionScore: conviction.score,
    convictionNormalized: conviction.normalized,

    regime: {
      label: regime?.label || "UNKNOWN",
      assumption:
        regime?.assumption ||
        "No explicit economic regime assumption was provided.",
    },

    fundamentals: {
      score: fundamentals?.score ?? null,
      summary:
        fundamentals?.summary ||
        "Business fundamentals were evaluated for strength, profitability, and financial quality.",
    },

    tacticalContext: {
      score: tactical?.score ?? null,
      summary: tacticalExplanation.summary,
      details: tacticalExplanation.details,
      disclaimer: tacticalExplanation.disclaimer,
    },

    factorAttribution: attribution || {},

    historicalValidation:
      validation || {
        available: false,
        summary:
          "This asset does not yet have enough historical Discovery observations.",
      },

    plainEnglishSummary: buildPlainEnglishSummary({
      decision,
      regime,
      fundamentals,
      tacticalSummary: tacticalExplanation.summary,
      validation,
    }),

    disclaimer:
      "This classification is a mathematical assessment based on observed data. It is not financial advice and does not instruct actions.",
  });

  return explanation;
}

function buildPlainEnglishSummary({
  decision,
  regime,
  fundamentals,
  tacticalSummary,
  validation,
}) {
  const lines = [];

  lines.push(
    `Jupiter classified this asset as ${decision.replace(
      "_",
      " "
    )} based on measured data, not opinions.`
  );

  if (fundamentals?.summary) {
    lines.push(`From a business perspective: ${fundamentals.summary}`);
  }

  if (tacticalSummary) {
    lines.push(`From a market behavior perspective: ${tacticalSummary}`);
  }

  if (regime?.label) {
    lines.push(
      `This assessment assumes a ${regime.label
        .replace("_", " ")
        .toLowerCase()} economic environment.`
    );
  }

  if (validation?.summary) {
    lines.push(`Historically: ${validation.summary}`);
  }

  return lines.join(" ");
}

module.exports = Object.freeze({
  explainDiscoveryResult,
});
