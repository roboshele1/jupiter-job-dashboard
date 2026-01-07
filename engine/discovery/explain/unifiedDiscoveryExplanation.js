/**
 * D6.1 → D10.3f — Unified Discovery Explanation Contract
 * -----------------------------------------------------
 * Single authoritative explanation surface.
 * Read-only. Deterministic. Institutional-grade.
 */

const { explainTacticalContext } = require("./tacticalExplanation.js");
const { explainFundamentalContext } = require("./fundamentalExplanation.js");
const { explainConvictionContext } = require("./convictionExplanation.js");
const { explainRegimeContext } = require("./regimeExplanation.js");

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

  const plainEnglishSummary = buildPlainEnglishSummary({
    decision,
    conviction,
    regime,
    fundamentals,
    tactical,
  });

  const explanation = {
    symbol,
    decision,

    convictionContext: explainConvictionContext({
      convictionScore: conviction.score,
      normalized: conviction.normalized,
    }),

    fundamentalContext: explainFundamentalContext(fundamentals || {}),

    tacticalContext: explainTacticalContext(
      tactical || {},
      tactical || {}
    ),

    regimeContext: explainRegimeContext(regime || {}),

    factorAttribution: attribution || {},

    historicalValidation: validation || {
      available: false,
      summary:
        "This asset does not yet have enough historical Discovery observations.",
    },

    // ✅ SYNTHESIS (AUTHORITATIVE)
    plainEnglishSummary,

    disclaimer:
      "This explanation describes how the Discovery classification was formed. It is not advice and does not trigger actions.",
  };

  return Object.freeze(explanation);
}

function buildPlainEnglishSummary({
  decision,
  conviction,
  regime,
  fundamentals,
  tactical,
}) {
  const lines = [];

  lines.push(
    `Jupiter classified this asset as ${decision.decision} using measured data.`
  );

  if (conviction?.normalized != null) {
    lines.push(
      `Confidence is ${
        conviction.normalized >= 0.7
          ? "high"
          : conviction.normalized >= 0.4
          ? "moderate"
          : "low"
      }, based on aggregate evidence.`
    );
  }

  if (fundamentals) {
    lines.push(
      "Business fundamentals were reviewed to assess strength, durability, and financial quality."
    );
  }

  if (tactical) {
    lines.push(
      "Market behavior was reviewed to understand stability and emotional extremes, not to time trades."
    );
  }

  if (regime?.label) {
    lines.push(
      `This assessment assumes a ${regime.label
        .replaceAll("_", " ")
        .toLowerCase()} economic environment.`
    );
  }

  return lines.join(" ");
}

module.exports = Object.freeze({
  explainDiscoveryResult,
});
