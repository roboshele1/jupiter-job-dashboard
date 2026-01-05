/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 29.2 — Personalization + Control wiring
 *
 * PURPOSE
 * -------
 * - Orchestrate Intelligence → Reasoning → Enrichment → Synthesis
 * - Apply Personalization (read-only)
 * - Apply Control Layer (final authority)
 * - Return a single UI-safe response
 *
 * ORDER (STRICT)
 * --------------
 * 1. Intelligence (routed)
 * 2. Reasoning
 * 3. Enrichment
 * 4. Synthesis
 * 5. Personalization
 * 6. Control Layer (final)
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No LLM calls
 */

import { runChatV2Intelligence } from "../chatV2IntelligenceEngine.js";
import { runChatV2Reasoning } from "../reasoning/chatV2ReasoningEngine.js";
import { runEnrichmentAggregator } from "../enrichment/enrichmentAggregator.js";
import { runChatV2Synthesis } from "../synthesis/chatV2SynthesisEngine.js";
import { applyChatV2Personalization } from "../personalization/chatV2PersonalizationEngine.js";
import { applyChatV2Control } from "../control/chatV2ControlLayer.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_ORCHESTRATOR_CONTRACT = {
  name: "CHAT_V2_ORCHESTRATOR",
  version: "5.1",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Orchestrator({
  query,
  portfolioSnapshot = null,
  marketSnapshot = null,
  context = null,
  memoryContext = null,
  userPreferences = {},
  meta = {},
} = {}) {
  // 1. Intelligence
  const intelligenceResult = runChatV2Intelligence({
    query,
    portfolioSnapshot,
    context,
  });

  // 2. Reasoning
  const reasoningResult = runChatV2Reasoning({
    intelligence: intelligenceResult.intelligence,
    intent: intelligenceResult.intent,
  });

  // 3. Enrichment (APPENDED: query passthrough)
  const enrichmentResult = runEnrichmentAggregator({
    portfolioSnapshot,
    marketSnapshot,
    query,
  });

  // 4. Synthesis
  const synthesized = runChatV2Synthesis({
    intelligenceResult,
    reasoningResult,
    enrichmentResult,
    meta: { ...meta, query },
  });

  // 5. Personalization (read-only shaping)
  const personalized = applyChatV2Personalization({
    response: synthesized.response,
    memoryContext,
    confidence: synthesized.confidence,
    userPreferences,
  });

  // 6. Control Layer (final authority)
  return applyChatV2Control({
    response: personalized.response,
    memoryContext,
    userPreferences,
    confidence: synthesized.confidence,
    provenance: synthesized.provenance || null,
  });
}
