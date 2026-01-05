/**
 * CHAT_V2_SYNTHESIS_ENGINE
 * =======================
 * Phase 23 — Confidence & provenance overlay (read-only)
 *
 * PURPOSE
 * -------
 * - Add confidence labels and provenance metadata
 * - Preserve intent-aware headline and bullet selection
 * - Keep language simple and deterministic
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No new analysis
 */

export const CHAT_V2_SYNTHESIS_CONTRACT = {
  name: "CHAT_V2_SYNTHESIS",
  version: "3.1",
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

function deriveConfidenceLabel(confidence) {
  if (confidence >= 0.7) return "HIGH";
  if (confidence > 0) return "MEDIUM";
  return "LOW";
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
  const synthesizedAt = Date.now();

  if (!intelligenceResult || !reasoningResult) {
    return {
      contract: CHAT_V2_SYNTHESIS_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: intelligenceResult?.intent || null,
      confidence: 0,
      confidenceLabel: "LOW",
      response: {
        headline: "Not enough information yet.",
        bullets: ["Some required information is missing."],
        sections: {},
      },
      provenance: {
        sources: ["CHAT_V2_SYNTHESIS"],
        timestamps: {
          intelligence: null,
          reasoning: null,
          synthesis: synthesizedAt,
        },
      },
      governance: {
        executionAllowed: false,
        adviceAllowed: false,
        mutationAllowed: false,
      },
      meta,
    };
  }

  const intent = intelligenceResult.intent || reasoningResult.intent || null;
  const confidence = safeNumber(intelligenceResult.confidence, 0);
  const confidenceLabel = deriveConfidenceLabel(confidence);

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
    confidenceLabel,
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
    provenance: {
      sources: [
        intelligenceResult.contract,
        "CHAT_V2_REASONING",
        enrichmentResult ? "ENRICHMENT_AGGREGATOR" : null,
        "CHAT_V2_SYNTHESIS",
      ].filter(Boolean),
      timestamps: {
        intelligence: safeNumber(intelligenceResult.timestamp, null),
        reasoning: safeNumber(reasoningResult.timestamp, null),
        synthesis: synthesizedAt,
      },
    },
    governance: {
      executionAllowed: false,
      adviceAllowed: false,
      mutationAllowed: false,
    },
    meta,
  };
}
