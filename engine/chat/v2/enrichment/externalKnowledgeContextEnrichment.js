/**
 * EXTERNAL_KNOWLEDGE_CONTEXT_ENRICHMENT
 * ====================================
 * Phase 31 — Deterministic external knowledge framing
 *
 * PURPOSE
 * -------
 * - Provide structured, non-LLM, non-browsing knowledge context
 * - Expand response richness without hallucination
 * - Support general finance questions safely
 *
 * WHAT THIS IS
 * ------------
 * - A rule-based knowledge classifier
 * - A vocabulary + concept mapper
 * - A context expander (NOT an answer engine)
 *
 * WHAT THIS IS NOT
 * ----------------
 * - No LLM
 * - No live browsing
 * - No Google
 * - No execution
 * - No advice
 */

export const EXTERNAL_KNOWLEDGE_CONTEXT_CONTRACT = {
  name: "EXTERNAL_KNOWLEDGE_CONTEXT_ENRICHMENT",
  version: "1.0",
  mode: "READ_ONLY",
  language: "SIMPLE_ENGLISH",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE"
};

/* =========================================================
   STATIC KNOWLEDGE MAP (DETERMINISTIC)
   ========================================================= */

const KNOWLEDGE_DOMAINS = {
  markets: {
    keywords: ["market", "volatility", "index", "stocks", "bonds", "equities"],
    description:
      "General concepts related to financial markets and asset behavior."
  },
  investing_basics: {
    keywords: ["etf", "diversification", "risk", "return", "portfolio"],
    description:
      "Foundational investing concepts commonly used by long-term investors."
  },
  crypto: {
    keywords: ["bitcoin", "btc", "ethereum", "crypto", "blockchain"],
    description:
      "Digital asset concepts and crypto-market structure."
  },
  macro: {
    keywords: ["inflation", "rates", "economy", "recession", "growth"],
    description:
      "High-level economic and macro-financial concepts."
  }
};

/* =========================================================
   ENGINE ENTRYPOINT
   ========================================================= */

export function runExternalKnowledgeContextEnrichment({ query = "" } = {}) {
  if (!query || typeof query !== "string") {
    return {
      contract: EXTERNAL_KNOWLEDGE_CONTEXT_CONTRACT.name,
      status: "NO_QUERY",
      context: null,
      timestamp: Date.now()
    };
  }

  const normalized = query.toLowerCase();

  const matchedDomains = Object.entries(KNOWLEDGE_DOMAINS)
    .filter(([, domain]) =>
      domain.keywords.some((k) => normalized.includes(k))
    )
    .map(([key, domain]) => ({
      domain: key,
      description: domain.description
    }));

  return {
    contract: EXTERNAL_KNOWLEDGE_CONTEXT_CONTRACT.name,
    status: "READY",
    context: {
      type: "EXTERNAL_KNOWLEDGE",
      note:
        "This context is based on static financial knowledge, not live data.",
      domains: matchedDomains.length > 0 ? matchedDomains : [],
      limitations: [
        "No live data used",
        "No personalized advice",
        "No predictive statements"
      ]
    },
    language: "SIMPLE_ENGLISH",
    timestamp: Date.now()
  };
}
