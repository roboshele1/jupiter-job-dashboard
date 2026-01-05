/**
 * CHAT_V2_SYNTHESIS_ENGINE
 * =======================
 * Phase 19 — Headline & response prioritization (Simple English)
 *
 * PURPOSE
 * -------
 * - Decide what the user sees first
 * - Prioritize clarity and simplicity
 * - Present answers in plain English for non-finance users
 * - Keep deterministic ordering and no new reasoning
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
  version: "2.1",
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

function pickHeadline({ enrichmentResult, intelligenceResult }) {
  if (enrichmentResult?.context?.portfolioOverview?.title) {
    return enrichmentResult.context.portfolioOverview.title;
  }
  if (intelligenceResult?.intelligence?.summary?.[0]) {
    return intelligenceResult.intelligence.summary[0];
  }
  return "Here’s a simple overview based on your question.";
}

function buildBullets({ enrichmentResult, intelligenceResult }) {
  const bullets = [];
  if (enrichmentResult?.context?.portfolioOverview?.description) {
    bullets.push(enrichmentResult.context.portfolioOverview.description);
  }
  const summaries = safeArray(intelligenceResult?.intelligence?.summary);
  summaries.forEach(s => bullets.push(s));
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
        bullets: ["Missing intelligence or reasoning data."],
        sections: {},
      },
      governance: CHAT_V2_SYNTHESIS_CONTRACT,
      timestamps: { synthesized: Date.now() },
      meta,
    };
  }

  const intent = intelligenceResult.intent || reasoningResult.intent || null;
  const confidence = safeNumber(intelligenceResult.confidence, 0);
  const status = inferStatus(intelligenceResult.status, reasoningResult.status);

  const headline = pickHeadline({ enrichmentResult, intelligenceResult });
  const bullets = buildBullets({ enrichmentResult, intelligenceResult });

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
