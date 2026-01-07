/**
 * D6.1 — Unified Discovery Explanation Contract (ENHANCED)
 * -------------------------------------------------------
 * Merges fundamentals, tactical behavior, regime context,
 * and conviction confidence into a single explainable object.
 */

const { explainTacticalContext } = require("./tacticalExplanation.js");
const { explainFundamentalContext } = require("./fundamentalExplanation.js");
const { explainConvictionContext } = require("./convictionExplanation.js");

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

  const tacticalContext = explainTacticalContext(
    tactical?.inputs || {},
    tactical || {}
  );

  const fundamentalContext = explainFundamentalContext(fundamentals || {});

  const convictionContext = explainConvictionContext({
    convictionScore: conviction?.score,
    normalized: conviction?.normalized,
    ownership: false,
  });

  return Object.freeze({
    symbol,

    decision,

    convictionScore: conviction?.score,
    convictionNormalized: conviction?.normalized,

    convictionContext,

    regime: {
      label: regime?.label || "UNKNOWN",
      assumption:
        regime?.assumption || "No explicit macro regime assumption applied.",
    },

    fundamentals: fundamentalContext,

    tacticalContext,

    factorAttribution: attribution || {},

    historicalValidation:
      validation || {
        available: false,
        summary:
          "This asset has not yet accumulated sufficient historical Discovery observations.",
      },

    plainEnglishSummary: [
      `Jupiter classified this asset as ${decision.replace("_", " ")} using measured data.`,
      convictionContext?.summary,
      fundamentalContext?.summary,
      tacticalContext?.summary,
      regime?.label
        ? `This assessment assumes a ${regime.label
            .replace("_", " ")
            .toLowerCase()} environment.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),

    disclaimer:
      "This output is an explainable analytical classification. It is not advice and does not trigger actions.",
  });
}

module.exports = Object.freeze({
  explainDiscoveryResult,
});
