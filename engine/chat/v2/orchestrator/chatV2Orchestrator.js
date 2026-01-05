/**
 * CHAT_V2_ORCHESTRATOR
 * ====================
 * Phase 10.5 — Deterministic orchestration layer
 *
 * PURPOSE
 * -------
 * - Orchestrate Chat V2 Intelligence (10.2), Reasoning (10.3), and Synthesis (10.4)
 * - Enforce execution order and governance
 * - Return a single, UI-ready response envelope
 *
 * NON-GOALS
 * ---------
 * - No LLM calls
 * - No execution
 * - No advice
 * - No portfolio mutation
 * - No IPC exposure
 *
 * This engine answers: "HOW do the Chat V2 layers work together?"
 */

import { runChatV2Intelligence } from "../chatV2IntelligenceEngine.js";
import { runChatV2Reasoning } from "../reasoning/chatV2ReasoningEngine.js";
import { runChatV2Synthesis } from "../synthesis/chatV2SynthesisEngine.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_ORCHESTRATOR_CONTRACT = {
  name: "CHAT_V2_ORCHESTRATOR",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   INPUT SHAPE
========================================================= */
/**
 * Expected input:
 * {
 *   query: string,
 *   intent: string,
 *   portfolioSnapshot?: object | null,
 *   context?: object | null,
 *   meta?: {
 *     requestId?: string
 *   }
 * }
 */

/* =========================================================
   OUTPUT SHAPE
========================================================= */
/**
 * Returned structure:
 * - Exactly the output of Chat V2 Synthesis (10.4)
 */

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function runChatV2Orchestrator({
  query,
  intent,
  portfolioSnapshot = null,
  context = null,
  meta = {},
} = {}) {
  // -----------------------------
  // Step 1: Intelligence
  // -----------------------------
  const intelligenceResult = runChatV2Intelligence({
    query,
    intent,
    portfolioSnapshot,
    context,
  });

  // -----------------------------
  // Step 2: Reasoning
  // -----------------------------
  const reasoningResult = runChatV2Reasoning({
    intelligence: intelligenceResult.intelligence,
    intent,
  });

  // -----------------------------
  // Step 3: Synthesis
  // -----------------------------
  return runChatV2Synthesis({
    intelligenceResult,
    reasoningResult,
    meta: {
      ...meta,
      query,
    },
  });
}
