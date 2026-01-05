/**
 * CHAT_V2_SYNTHESIS_ENGINE
 * =======================
 * Phase 20 — Intent-aware headline & response selection (Simple English)
 *
 * PURPOSE
 * -------
 * - Select headlines and bullets based on user intent
 * - Keep language simple and non-technical
 * - Preserve deterministic ordering
 * - Never add new analysis or advice
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No LLM calls
 */

export const CHAT_V2_SYNTHESIS_CONTRACT = {
  name: "CHAT_V2_SYNTHESIS",
  version: "3.0",
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
  return intelStatus === "READY" && reasoningStatus === "READY"
    ? "READY"
    : "INCOMPLETE";
}

/* =========================================================
   INTENT-AWARE HEADLINE SELECTION
========================================================= */

function selectHeadline({ intent, enrichmentResult, intelligenceResult }) {
  if (intent === "GENERAL_MARKET") {
    return (
      intelligenceResult?.intelligence?.summary?.[0] ||
      "Here is a simple explanation."
    );
  }

  if (intent === "PORTFOLIO_OVERVIEW") {
    return (
      enrichmentResult?.context?.portfolioOverview?.title ||
      "Here is a simple view of your portfolio."
    );
  }

  return (
    intelligenceResult?.intelligence?.summary?.[0] ||
    "Here is a simple overview."
  );
}

function selectBullets({ intent, enrichmentResult, intelligenceResult }) {
  const bullets = [];

  if (intent === "PORTFOLIO_OVERVIEW") {
    if (enrichmentResult?.context?.portfolioOverview?.description) {
      bullets.push(enrichmentResult.context.portfolioOverview.description);
    }
  }

  safeArray(intelligenceResult?.intelligence?.summary).forEach(s =>
    bullets.push(s)
  );

  safeArray(intelligenceResult?.intelligence?.observations).forEach(o =>
    bullets.push(o)
  );

  return bullets.slice(0, 3);
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
  if (!intelligenceResult || !reasoningResult) {
    return {
      contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: intelligenceResult?.intent || null,
      confidence: 0,
      response: {
        headline: "Not enough information yet.",
        bullets: ["Some required information is missing."],
        sections: {},
      },
      governance: {
        executionAllowed: false,
        adviceAllowed: false,
        mutationAllowed: false,
      },
      timestamps: { synthesized: Date.now() },
      meta,
    };
  }

  const intent = intelligenceResult.intent || reasoningResult.intent || null;
  const confidence = safeNumber(intelligenceResult.confidence, 0);
  const status = inferStatus(
    intelligenceResult.status,
    reasoningResult.status
  );

  const headline = selectHeadline({
    intent,
    enrichmentResult,
    intelligenceResult,
  });

  const bullets = selectBullets({
    intent,
    enrichmentResult,
    intelligenceResult,
  });

  return {
    contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
    status,
    intent,
    confidence,
    response: {
      headline,
      bullets,
      sections: {
        summary: safeArray(intelligenceResult.intelligence?.summary),
        observations: safeArray(intelligenceResult.intelligence?.observations),
        risks: safeArray(intelligenceResult.intelligence?.risks),
        reasoning: reasoningResult.reasoning || {},
        context: enrichmentResult?.context || {},
        constraints: [
          "This explanation is general and educational only.",
          "No advice or actions are provided.",
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
