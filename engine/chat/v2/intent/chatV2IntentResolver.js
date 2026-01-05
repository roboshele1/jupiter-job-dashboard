/**
 * CHAT_V2_INTENT_RESOLVER
 * ======================
 * Phase 25 — Canonical query understanding for Chat V2
 *
 * PURPOSE
 * -------
 * - Derive a normalized, deterministic intent from raw user queries
 * - Serve as the single source of truth for Chat V2 intent resolution
 * - Support portfolio, market, live ticker, and general finance questions
 * - Preserve SIMPLE_ENGLISH and read-only guarantees
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No probabilistic inference
 * - No LLM calls
 */

export const CHAT_V2_INTENT_RESOLVER_CONTRACT = {
  name: "CHAT_V2_INTENT_RESOLVER",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INTENT ENUM
========================================================= */

export const CHAT_V2_INTENTS = {
  GENERAL_MARKET: "GENERAL_MARKET",
  LIVE_MARKET: "LIVE_MARKET",
  PORTFOLIO_OVERVIEW: "PORTFOLIO_OVERVIEW",
  RISK_CONTEXT: "RISK_CONTEXT",
  UNKNOWN: "UNKNOWN",
};

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function resolveChatV2Intent({
  query,
  portfolioSnapshot = null,
} = {}) {
  if (!query || typeof query !== "string") {
    return {
      contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      intent: CHAT_V2_INTENTS.UNKNOWN,
      reason: "No valid query provided.",
      timestamp: Date.now(),
    };
  }

  const q = query.toLowerCase();

  // -----------------------------
  // Portfolio-related queries
  // -----------------------------
  if (
    portfolioSnapshot &&
    (q.includes("portfolio") ||
      q.includes("holdings") ||
      q.includes("allocation") ||
      q.includes("exposure"))
  ) {
    return {
      contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
      status: "READY",
      intent: CHAT_V2_INTENTS.PORTFOLIO_OVERVIEW,
      reason: "Query references portfolio structure.",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Risk-related queries
  // -----------------------------
  if (q.includes("risk") || q.includes("volatile") || q.includes("drawdown")) {
    return {
      contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
      status: "READY",
      intent: CHAT_V2_INTENTS.RISK_CONTEXT,
      reason: "Query references risk characteristics.",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Live ticker / price queries
  // -----------------------------
  if (
    q.includes("price") ||
    q.includes("trading at") ||
    q.includes("market cap") ||
    q.match(/^[a-z]{1,5}$/)
  ) {
    return {
      contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
      status: "READY",
      intent: CHAT_V2_INTENTS.LIVE_MARKET,
      reason: "Query references live market data.",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // General finance / market
  // -----------------------------
  if (
    q.includes("stock") ||
    q.includes("etf") ||
    q.includes("crypto") ||
    q.includes("bitcoin") ||
    q.includes("market") ||
    q.includes("interest rate")
  ) {
    return {
      contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
      status: "READY",
      intent: CHAT_V2_INTENTS.GENERAL_MARKET,
      reason: "Query references general market concepts.",
      timestamp: Date.now(),
    };
  }

  // -----------------------------
  // Fallback
  // -----------------------------
  return {
    contract: CHAT_V2_INTENT_RESOLVER_CONTRACT.name,
    status: "READY",
    intent: CHAT_V2_INTENTS.UNKNOWN,
    reason: "No clear intent match found.",
    timestamp: Date.now(),
  };
}
