/**
 * CHAT_V2_SYNTHESIS_ENGINE
 * =======================
 * Phase 16 — Synthesis layer with enrichment wiring
 *
 * PURPOSE
 * -------
 * - Merge Intelligence + Reasoning + Enrichment into ONE UI-ready envelope
 * - Preserve deterministic, read-only guarantees
 * - Present output in SIMPLE ENGLISH
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No new reasoning
 */

export const CHAT_V2_SYNTHESIS_CONTRACT = {
  name: "CHAT_V2_SYNTHESIS",
  version: "2.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   HELPERS
========================================================= */

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function safeNumber(v, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function inferStatus(intelStatus, reasoningStatus) {
  if (intelStatus === "READY" && reasoningStatus === "READY") return "READY";
  return "INCOMPLETE";
}

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Synthesis({
  intelligenceResult,
  reasoningResult,
  enrichmentResult = null,
  meta = {},
} = {}) {
  const hasIntel = !!intelligenceResult;
  const hasReasoning = !!reasoningResult;

  if (!hasIntel || !hasReasoning) {
    return {
      contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent:
        intelligenceResult?.intent ||
        reasoningResult?.intent ||
        null,
      confidence: 0,
      response: {
        headline: "Not enough information yet",
        bullets: [
          "Some required information is missing.",
          "Try again once all inputs are available.",
        ],
        sections: {
          summary: safeArray(intelligenceResult?.intelligence?.summary),
          observations: safeArray(intelligenceResult?.intelligence?.observations),
          risks: safeArray(intelligenceResult?.intelligence?.risks),
          reasoning: {
            assumptions: safeArray(reasoningResult?.reasoning?.assumptions),
            logicalSteps: safeArray(reasoningResult?.reasoning?.logicalSteps),
            exclusions: safeArray(reasoningResult?.reasoning?.exclusions),
            confidenceDrivers: safeArray(reasoningResult?.reasoning?.confidenceDrivers),
          },
          context: enrichmentResult?.context || {},
          constraints: [
            "Execution is disabled.",
            "Advice is disabled.",
          ],
        },
      },
      governance: {
        executionAllowed: false,
        adviceAllowed: false,
        mutationAllowed: false,
      },
      timestamps: {
        intelligence: safeNumber(intelligenceResult?.timestamp, null),
        reasoning: safeNumber(reasoningResult?.timestamp, null),
        synthesized: Date.now(),
      },
      meta,
    };
  }

  const intent = intelligenceResult.intent || reasoningResult.intent || null;
  const confidence = safeNumber(intelligenceResult.confidence, 0);

  const status = inferStatus(
    intelligenceResult.status,
    reasoningResult.status
  );

  const summary = safeArray(intelligenceResult.intelligence?.summary);
  const observations = safeArray(intelligenceResult.intelligence?.observations);
  const risks = safeArray(intelligenceResult.intelligence?.risks);

  const reasoning = {
    assumptions: safeArray(reasoningResult.reasoning?.assumptions),
    logicalSteps: safeArray(reasoningResult.reasoning?.logicalSteps),
    exclusions: safeArray(reasoningResult.reasoning?.exclusions),
    confidenceDrivers: safeArray(reasoningResult.reasoning?.confidenceDrivers),
  };

  // SIMPLE ENGLISH headline preference:
  const headline =
    enrichmentResult?.context?.portfolioOverview?.title ||
    summary[0] ||
    "Here is a simple overview";

  // SIMPLE ENGLISH bullets (no jargon)
  const bullets = []
    .concat(
      enrichmentResult?.context?.portfolioOverview?.description
        ? [enrichmentResult.context.portfolioOverview.description]
        : []
    )
    .concat(summary.slice(0, 1))
    .concat(observations.slice(0, 1))
    .slice(0, 3);

  return {
    contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
    status,
    intent,
    confidence,
    response: {
      headline,
      bullets,
      sections: {
        summary,
        observations,
        risks,
        reasoning,
        context: enrichmentResult?.context || {},
        constraints: [
          "Execution is disabled.",
          "Advice is disabled.",
          "All output is descriptive only.",
        ],
      },
    },
    governance: {
      executionAllowed: false,
      adviceAllowed: false,
      mutationAllowed: false,
    },
    timestamps: {
      intelligence: safeNumber(intelligenceResult.timestamp, null),
      reasoning: safeNumber(reasoningResult.timestamp, null),
      synthesized: Date.now(),
    },
    meta,
  };
}
