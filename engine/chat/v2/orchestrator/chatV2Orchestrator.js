/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 26.1 — Live Market Intelligence Wiring
 *
 * PURPOSE
 * -------
 * - Route Chat V2 queries based on resolved intent
 * - Support:
 *   • Portfolio intelligence
 *   • General market intelligence
 *   • LIVE market / ticker intelligence (API-backed)
 * - Preserve strict read-only, deterministic guarantees
 * - Produce a single UI-ready response
 *
 * EXECUTION ORDER
 * ---------------
 * 1. Intelligence (intent-aware routing)
 * 2. Reasoning
 * 3. Enrichment aggregation
 * 4. Synthesis
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No LLM calls
 * - No IPC logic
 */

import { runChatV2Intelligence } from "../chatV2IntelligenceEngine.js";
import { runGeneralMarketIntelligence } from "../intelligence/generalMarketIntelligenceEngine.js";
import { runLiveMarketIntelligence } from "../intelligence/liveMarketIntelligenceEngine.js";
import { runChatV2Reasoning } from "../reasoning/chatV2ReasoningEngine.js";
import { runEnrichmentAggregator } from "../enrichment/enrichmentAggregator.js";
import { runChatV2Synthesis } from "../synthesis/chatV2SynthesisEngine.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_ORCHESTRATOR_CONTRACT = {
  name: "CHAT_V2_ORCHESTRATOR",
  version: "4.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INTELLIGENCE ROUTING
========================================================= */

function resolveIntelligence({
  query,
  intent,
  portfolioSnapshot,
  marketSnapshot,
  context,
}) {
  // -----------------------------
  // LIVE MARKET / TICKER QUERIES
  // -----------------------------
  if (intent === "LIVE_MARKET" && marketSnapshot?.symbol) {
    return runLiveMarketIntelligence({
      symbol: marketSnapshot.symbol,
      marketData: marketSnapshot.data || null,
    });
  }

  // -----------------------------
  // GENERAL MARKET / FINANCE
  // -----------------------------
  if (
    intent === "GENERAL_MARKET" ||
    intent === "GENERAL_FINANCE" ||
    intent === "TICKER_INFO" ||
    intent === "ETF_INFO" ||
    intent === "CRYPTO_INFO"
  ) {
    return runGeneralMarketIntelligence({ query });
  }

  // -----------------------------
  // PORTFOLIO-AWARE DEFAULT
  // -----------------------------
  return runChatV2Intelligence({
    query,
    intent,
    portfolioSnapshot,
    context,
  });
}

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Orchestrator({
  query,
  intent,
  portfolioSnapshot = null,
  marketSnapshot = null,
  context = null,
  meta = {},
} = {}) {
  // -------------------------------------------------
  // 1. Intelligence (intent-aware)
  // -------------------------------------------------
  const intelligenceResult = resolveIntelligence({
    query,
    intent,
    portfolioSnapshot,
    marketSnapshot,
    context,
  });

  // -------------------------------------------------
  // 2. Reasoning (read-only explanation)
  // -------------------------------------------------
  const reasoningResult = runChatV2Reasoning({
    intelligence: intelligenceResult.intelligence,
    intent,
  });

  // -------------------------------------------------
  // 3. Enrichment (portfolio + market context)
  // -------------------------------------------------
  const enrichmentResult = runEnrichmentAggregator({
    portfolioSnapshot,
    marketSnapshot,
  });

  // -------------------------------------------------
  // 4. Synthesis (UI-ready envelope)
  // -------------------------------------------------
  return runChatV2Synthesis({
    intelligenceResult,
    reasoningResult,
    enrichmentResult,
    meta: {
      ...meta,
      query,
    },
  });
}
