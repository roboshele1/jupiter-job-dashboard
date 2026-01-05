/**
 * CHAT_V2_RESPONSE_GUARD
 * =====================
 * Phase 24 — Response safety, scope & guardrails (engine-only)
 *
 * PURPOSE
 * -------
 * - Enforce response scope (education-only)
 * - Prevent advice, execution, or prediction language
 * - Ensure simple, plain English output
 * - Provide safe fallbacks for out-of-scope questions
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No UI logic
 * - No LLM calls
 */

export const CHAT_V2_RESPONSE_GUARD_CONTRACT = {
  name: "CHAT_V2_RESPONSE_GUARD",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ALLOWED / DISALLOWED INTENTS
========================================================= */

const ALLOWED_INTENTS = [
  "GENERAL_MARKET",
  "GENERAL_FINANCE",
  "TICKER_INFO",
  "ETF_INFO",
  "CRYPTO_INFO",
  "PORTFOLIO_OVERVIEW",
  "PORTFOLIO_STRUCTURE",
];

const DISALLOWED_KEYWORDS = [
  "buy",
  "sell",
  "short",
  "long",
  "leverage",
  "should i",
  "what should i",
  "guarantee",
  "predict",
  "next week",
  "price target",
];

/* =========================================================
   HELPERS
========================================================= */

function containsDisallowedLanguage(text = "") {
  const lower = text.toLowerCase();
  return DISALLOWED_KEYWORDS.some(word => lower.includes(word));
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2ResponseGuard({
  intent,
  response,
  confidence,
  provenance,
} = {}) {
  // Basic validation
  if (!response || typeof response !== "object") {
    return {
      contract: CHAT_V2_RESPONSE_GUARD_CONTRACT.name,
      status: "BLOCKED",
      response: {
        headline: "I can’t answer that right now.",
        bullets: [
          "There isn’t enough information to give a clear explanation.",
        ],
        sections: {},
      },
      confidence: 0,
      provenance,
      governance: CHAT_V2_RESPONSE_GUARD_CONTRACT,
      timestamp: Date.now(),
    };
  }

  // Intent scope enforcement
  if (!ALLOWED_INTENTS.includes(intent)) {
    return {
      contract: CHAT_V2_RESPONSE_GUARD_CONTRACT.name,
      status: "OUT_OF_SCOPE",
      response: {
        headline: "This question is outside my scope.",
        bullets: [
          "I focus on explaining finance and market topics.",
          "I don’t give advice or instructions.",
        ],
        sections: {},
      },
      confidence: 0,
      provenance,
      governance: CHAT_V2_RESPONSE_GUARD_CONTRACT,
      timestamp: Date.now(),
    };
  }

  // Language safety enforcement
  const allText = [
    response.headline,
    ...safeArray(response.bullets),
  ].join(" ");

  if (containsDisallowedLanguage(allText)) {
    return {
      contract: CHAT_V2_RESPONSE_GUARD_CONTRACT.name,
      status: "SANITIZED",
      response: {
        headline: "Here is a general explanation.",
        bullets: [
          "This information is educational only.",
          "I don’t provide advice or instructions.",
        ],
        sections: response.sections || {},
      },
      confidence: Math.min(confidence || 0, 0.3),
      provenance,
      governance: CHAT_V2_RESPONSE_GUARD_CONTRACT,
      timestamp: Date.now(),
    };
  }

  // Pass-through (safe)
  return {
    contract: CHAT_V2_RESPONSE_GUARD_CONTRACT.name,
    status: "SAFE",
    response,
    confidence,
    provenance,
    governance: CHAT_V2_RESPONSE_GUARD_CONTRACT,
    timestamp: Date.now(),
  };
}
