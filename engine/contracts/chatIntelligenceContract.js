/**
 * Chat Intelligence Contract — Phase 6
 * -----------------------------------
 * Purpose:
 * - Define what Chat is allowed to surface from synthesis/reasoning
 * - Enforce read-only, observer-safe output
 * - Prevent advice, actions, predictions, or free-form reasoning
 *
 * This is a SCHEMA + GUARD, not UI.
 */

export const CHAT_INTELLIGENCE_CONTRACT = Object.freeze({
  phase: 6,
  mode: "observer",
  exposure: "controlled",

  allowedSections: {
    synthesisSummary: true,
    dominantRiskDriver: true,
    firstFailureMode: true,
    growthAlignment: true,
  },

  forbiddenSections: {
    recommendations: true,
    actions: true,
    predictions: true,
    optimization: true,
    commands: true,
    freeFormReasoning: true,
  },

  outputShape: {
    synthesisSummary: "string | null",
    dominantRiskDriver: "string | null",
    firstFailureMode: "string | null",
    growthAlignment: "aligned | misaligned | unknown",
    disclaimer: "string",
  },

  disclaimer:
    "Observer mode. Read-only synthesis summary. No advice, actions, or predictions.",
});

/**
 * Enforce contract on synthesized output
 */
export function enforceChatIntelligenceContract(synthesis) {
  if (!synthesis) {
    return {
      synthesisSummary: null,
      dominantRiskDriver: null,
      firstFailureMode: null,
      growthAlignment: "unknown",
      disclaimer: CHAT_INTELLIGENCE_CONTRACT.disclaimer,
    };
  }

  return {
    synthesisSummary: synthesis?.synthesis?.narrative ?? null,
    dominantRiskDriver: synthesis?.synthesis?.dominantRiskDriver ?? null,
    firstFailureMode: synthesis?.synthesis?.firstFailureMode ?? null,
    growthAlignment:
      synthesis?.synthesis?.growthVsRiskAlignment ?? "unknown",
    disclaimer: CHAT_INTELLIGENCE_CONTRACT.disclaimer,
  };
}

