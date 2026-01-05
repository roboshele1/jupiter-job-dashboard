/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 21.2 — Live Market Intelligence → Orchestrator Integration
 *
 * PURPOSE
 * -------
 * - Route between general, portfolio, and live market intelligence
 * - Introduce live ticker support (stocks, ETFs, crypto)
 * - Preserve deterministic, simple-English, read-only behavior
 *
 * EXECUTION ORDER
 * ---------------
 * 1. Intelligence (dynamic routing)
 * 2. Reasoning
 * 3. Enrichment
 * 4. Synthesis
 *
 * NON-GOALS
 * ---------
 * - No advice, no execution, no prediction
 * - No mutation or external calls beyond deterministic API results
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
   INTELLIGENCE ROUTING (EXTENDED)
========================================================= */

function resolveIntelligence({ query, intent, portfolioSnapshot, context, marketData }) {
  // 1. Live market / ticker queries
  if (
    intent === "LIVE_MARKET" ||
    intent === "TICKER_INFO" ||
    intent === "ETF_INFO" ||
    intent === "CRYPTO_INFO"
  ) {
    return runLiveMarketIntelligence({
      symbol: marketData?.symbol || query?.toUpperCase?.() || "UNKNOWN",
      marketData,
    });
  }

  // 2. General finance / market awareness
  if (intent === "GENERAL_MARKET" || intent === "GENERAL_FINANCE") {
    return runGeneralMarketIntelligence({ query });
  }

  // 3. Default — portfolio-aware logic
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
  marketData = null,
  context = null,
  meta = {},
} = {}) {
  // 1. Intelligence (dynamic route)
  const intelligenceResult = resolveIntelligence({
    query,
    intent,
    portfolioSnapshot,
    context,
    marketData,
  });

  // 2. Reasoning
  const reasoningResult = runChatV2Reasoning({
    intelligence: intelligenceResult.intelligence,
    intent,
  });

  // 3. Enrichment
  const enrichmentResult = runEnrichmentAggregator({
    portfolioSnapshot,
    marketSnapshot,
  });

  // 4. Synthesis (UI envelope)
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
