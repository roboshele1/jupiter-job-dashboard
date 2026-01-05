/**
 * CHAT_V2_INTELLIGENCE_ENGINE
 * ==========================
 * Phase 25.3 — Canonical intent wiring
 *
 * PURPOSE
 * -------
 * - Consume the authoritative Chat V2 intent resolver
 * - Route intelligence deterministically based on resolved intent
 * - Remove duplicated intent heuristics
 * - Preserve read-only, SIMPLE_ENGLISH guarantees
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No LLM calls
 */

import { resolveChatV2Intent } from "./intent/chatV2IntentResolver.js";
import { runGeneralMarketIntelligence } from "./intelligence/generalMarketIntelligenceEngine.js";
import { runLiveMarketIntelligence } from "./intelligence/liveMarketIntelligenceEngine.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_INTELLIGENCE_CONTRACT = {
  name: "CHAT_V2_INTELLIGENCE",
  version: "4.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Intelligence({
  query,
  portfolioSnapshot = null,
  context = null,
} = {}) {
  // -----------------------------
  // Guardrails
  // -----------------------------
  if (!query) {
    return {
      contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: null,
      confidence: 0,
      intelligence: {
        summary: ["No valid question was provided."],
        observations: [],
        risks: [],
        constraints: [
          "A query is required.",
          "No advice or actions are provided.",
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Canonical intent resolution
  // -----------------------------
  const intentResult = resolveChatV2Intent({
    query,
    portfolioSnapshot,
  });

  const { intent } = intentResult;

  // -----------------------------
  // Route by resolved intent
  // -----------------------------

  if (intent === "LIVE_MARKET") {
    return runLiveMarketIntelligence({
      symbol: query.trim().toUpperCase(),
      context,
    });
  }

  if (intent === "GENERAL_MARKET") {
    return runGeneralMarketIntelligence({ query });
  }

  if (intent === "PORTFOLIO_OVERVIEW" && portfolioSnapshot) {
    return {
      contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
      status: "READY",
      intent,
      confidence: 0,
      intelligence: {
        summary: ["This question relates to your portfolio."],
        observations: [
          "Your portfolio data was reviewed in read-only mode.",
        ],
        risks: [
          "No portfolio risk analysis is performed at this stage.",
        ],
        constraints: [
          "Execution disabled by contract.",
          "Advice disabled by contract.",
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Fallback — general finance
  // -----------------------------
  return {
    contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
    status: "READY",
    intent,
    confidence: 0,
    intelligence: {
      summary: ["This is a general finance-related question."],
      observations: [
        "The question is not tied to live prices or a portfolio.",
      ],
      risks: [],
      constraints: [
        "This response is educational only.",
        "No advice or actions are provided.",
      ],
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now(),
  };
}
