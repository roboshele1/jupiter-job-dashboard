/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 18.3 — Intelligence → Orchestrator Routing
 *
 * PURPOSE
 * -------
 * - Route queries to the correct intelligence engine
 *   (portfolio-aware vs general market)
 * - Preserve deterministic execution order
 * - Maintain read-only, simple-English guarantees
 *
 * EXECUTION ORDER
 * ---------------
 * 1. Intelligence (routed)
 * 2. Reasoning
 * 3. Enrichment Aggregation
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
import { runChatV2Reasoning } from "../reasoning/chatV2ReasoningEngine.js";
import { runEnrichmentAggregator } from "../enrichment/enrichmentAggregator.js";
import { runChatV2Synthesis } from "../synthesis/chatV2SynthesisEngine.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_ORCHESTRATOR_CONTRACT = {
  name: "CHAT_V2_ORCHESTRATOR",
  version: "3.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INTELLIGENCE ROUTING
========================================================= */

function resolveIntelligence({ query, intent, portfolioSnapshot, context }) {
  // General market / finance / ticker questions
  if (
    intent === "GENERAL_MARKET" ||
    intent === "GENERAL_FINANCE" ||
    intent === "TICKER_INFO" ||
    intent === "ETF_INFO" ||
    intent === "CRYPTO_INFO"
  ) {
    return runGeneralMarketIntelligence({ query });
  }

  // Default: portfolio-aware intelligence
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
  // 1. Intelligence (ROUTED)
  // -------------------------------------------------
  const intelligenceResult = resolveIntelligence({
    query,
    intent,
    portfolioSnapshot,
    context,
  });

  // -------------------------------------------------
  // 2. Reasoning
  // -------------------------------------------------
  const reasoningResult = runChatV2Reasoning({
    intelligence: intelligenceResult.intelligence,
    intent,
  });

  // -------------------------------------------------
  // 3. Enrichment (aggregated, ordered, simple English)
  // -------------------------------------------------
  const enrichmentResult = runEnrichmentAggregator({
    portfolioSnapshot,
    marketSnapshot,
  });

  // -------------------------------------------------
  // 4. Synthesis (final UI-ready envelope)
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
