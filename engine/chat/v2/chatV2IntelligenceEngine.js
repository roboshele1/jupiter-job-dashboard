/**
 * CHAT_V2_INTELLIGENCE_ENGINE
 * ==========================
 * Phase 18.2 — Intelligence routing layer
 *
 * PURPOSE
 * -------
 * - Route Chat V2 queries to the correct intelligence engine
 * - Support portfolio-aware AND general finance questions
 * - Preserve deterministic, read-only guarantees
 * - Ensure all outputs use SIMPLE_ENGLISH
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No recommendations
 * - No mutation
 * - No LLM calls
 */

import { runGeneralMarketIntelligence } from "./intelligence/generalMarketIntelligenceEngine.js";

/* =========================================================
   CONTRACT METADATA
========================================================= */

export const CHAT_V2_INTELLIGENCE_CONTRACT = {
  name: "CHAT_V2_INTELLIGENCE",
  version: "3.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ROUTING HELPERS
========================================================= */

function isPortfolioQuery(intent) {
  return [
    "PORTFOLIO_OVERVIEW",
    "RISK_ASSESSMENT",
    "HOLDINGS_SUMMARY",
    "ALLOCATION_OVERVIEW",
  ].includes(intent);
}

function isGeneralMarketQuery(query) {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    q.includes("stock") ||
    q.includes("etf") ||
    q.includes("crypto") ||
    q.includes("bitcoin") ||
    q.includes("interest rate") ||
    q.includes("market") ||
    q.includes("inflation")
  );
}

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Intelligence({
  query,
  intent,
  portfolioSnapshot = null,
  context = null,
} = {}) {
  // -----------------------------
  // Guardrails
  // -----------------------------
  if (!query || !intent) {
    return {
      contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: intent || null,
      confidence: 0,
      intelligence: {
        summary: ["No valid question was provided."],
        observations: [],
        risks: [],
        constraints: [
          "Query and intent are required.",
          "No advice or actions are provided.",
        ],
      },
      language: "SIMPLE_ENGLISH",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Route: Portfolio-aware queries
  // -----------------------------
  if (isPortfolioQuery(intent) && portfolioSnapshot) {
    return {
      contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
      status: "READY",
      intent,
      confidence: 0,
      intelligence: {
        summary: [
          "This question relates to your portfolio.",
        ],
        observations: [
          "Your portfolio data was received and reviewed in read-only mode.",
        ],
        risks: [
          "No risk evaluation is performed at this stage.",
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
  // Route: General market queries
  // -----------------------------
  if (isGeneralMarketQuery(query)) {
    return runGeneralMarketIntelligence({ query });
  }

  // -----------------------------
  // Fallback: General finance
  // -----------------------------
  return {
    contract: CHAT_V2_INTELLIGENCE_CONTRACT.name,
    status: "READY",
    intent,
    confidence: 0,
    intelligence: {
      summary: [
        "This is a general finance-related question.",
      ],
      observations: [
        "The question is not tied to a specific portfolio.",
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
