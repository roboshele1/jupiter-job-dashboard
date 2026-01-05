/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 17 — Enrichment → Orchestrator Wiring
 *
 * PURPOSE
 * -------
 * - Orchestrate Chat V2 Intelligence, Reasoning, Enrichment, and Synthesis
 * - Enforce strict execution order
 * - Preserve read-only, deterministic guarantees
 * - Produce a single UI-ready response in simple English
 *
 * EXECUTION ORDER
 * ---------------
 * 1. Intelligence (10.2)
 * 2. Reasoning (10.3)
 * 3. Enrichment Aggregation (15)
 * 4. Synthesis (10.4 + 16)
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
import { runChatV2Reasoning } from "../reasoning/chatV2ReasoningEngine.js";
import { runEnrichmentAggregator } from "../enrichment/enrichmentAggregator.js";
import { runChatV2Synthesis } from "../synthesis/chatV2SynthesisEngine.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_ORCHESTRATOR_CONTRACT = {
  name: "CHAT_V2_ORCHESTRATOR",
  version: "2.0",
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
  intent,
  portfolioSnapshot = null,
  marketSnapshot = null,
  context = null,
  meta = {},
} = {}) {
  // -------------------------------------------------
  // 1. Intelligence
  // -------------------------------------------------
  const intelligenceResult = runChatV2Intelligence({
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
