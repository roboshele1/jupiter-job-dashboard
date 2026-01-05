/**
 * CHAT_V2_MEMORY_ENRICHMENT
 * ========================
 * Phase 28.2 — Memory recall for intelligence context
 *
 * PURPOSE
 * -------
 * - Recall relevant stored memory
 * - Provide it as CONTEXT ONLY to intelligence
 * - Never mutate, decide, or execute
 *
 * NON-GOALS
 * ---------
 * - No learning
 * - No personalization changes
 * - No automation
 */

import { readChatMemory } from "./chatV2MemoryStore.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_MEMORY_ENRICHMENT_CONTRACT = {
  name: "CHAT_V2_MEMORY_ENRICHMENT",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   MEMORY RECALL
========================================================= */

export function recallChatMemory({ intent } = {}) {
  const memory = readChatMemory();

  // Deterministic, simple filter
  const relevant = memory.filter(m =>
    intent === "GENERAL_MARKET"
      ? m.type === "USER_PREFERENCE"
      : true
  );

  return {
    contract: CHAT_V2_MEMORY_ENRICHMENT_CONTRACT.name,
    status: "READY",
    context: {
      recalledMemory: relevant.map(m => ({
        summary: m.summary,
        source: m.source,
        timestamp: m.timestamp,
      })),
    },
    constraints: [
      "Memory is descriptive only.",
      "Memory does not influence execution.",
    ],
    timestamp: Date.now(),
  };
}
