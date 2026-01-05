/**
 * CHAT_V2_PERSONALIZATION_ENGINE
 * ==============================
 * Phase 29 — Personalization Engine (Read-only)
 *
 * PURPOSE
 * -------
 * - Shape Chat V2 responses to feel user-specific
 * - Apply tone, verbosity, and confidence-based adjustments
 * - NEVER alter intelligence, facts, or decisions
 *
 * NON-GOALS
 * ---------
 * - No execution
 * - No advice
 * - No mutation
 * - No intelligence rewriting
 */

import { getPersonalizationPreset } from "./chatV2PersonalizationPresets.js";
import { applyPersonalizationRules } from "./chatV2PersonalizationRules.js";

/* =========================================================
   CONTRACT
========================================================= */

export const CHAT_V2_PERSONALIZATION_CONTRACT = {
  name: "CHAT_V2_PERSONALIZATION_ENGINE",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

/* =========================================================
   ENGINE ENTRYPOINT
========================================================= */

export function applyChatV2Personalization({
  response,
  memoryContext = [],
  confidence = 0,
  userPreferences = {},
} = {}) {
  if (!response) {
    return {
      contract: CHAT_V2_PERSONALIZATION_CONTRACT.name,
      status: "INSUFFICIENT_INPUTS",
      response: null,
      governance: CHAT_V2_PERSONALIZATION_CONTRACT,
      timestamp: Date.now(),
    };
  }

  const preset = getPersonalizationPreset({
    memoryContext,
    userPreferences,
    confidence,
  });

  const personalizedResponse = applyPersonalizationRules({
    response,
    preset,
  });

  return {
    contract: CHAT_V2_PERSONALIZATION_CONTRACT.name,
    status: "READY",
    response: personalizedResponse,
    appliedPreset: preset.name,
    governance: CHAT_V2_PERSONALIZATION_CONTRACT,
    timestamp: Date.now(),
  };
}
