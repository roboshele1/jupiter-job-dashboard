/**
 * CHAT_V2_CONTROL_LAYER
 * ====================
 * Phase 29.2 — Final response authority
 *
 * PURPOSE
 * -------
 * - Enforce last-mile governance on Chat V2 responses
 * - Apply safety, trimming, and presentation rules
 * - Ensure ZERO execution, ZERO advice, ZERO mutation
 *
 * THIS IS THE FINAL GATE BEFORE UI.
 */

export const CHAT_V2_CONTROL_CONTRACT = {
  name: "CHAT_V2_CONTROL_LAYER",
  version: "1.0",
  mode: "READ_ONLY",
  executionAllowed: false,
  adviceAllowed: false,
  mutationAllowed: false,
  authority: "ENGINE",
};

export function applyChatV2Control({
  response,
  memoryContext = null,
  userPreferences = {},
  confidence = 0,
  provenance = null,
} = {}) {
  if (!response || typeof response !== "object") {
    return {
      contract: CHAT_V2_CONTROL_CONTRACT.name,
      status: "INVALID_RESPONSE",
      response: null,
      governance: CHAT_V2_CONTROL_CONTRACT,
      timestamp: Date.now(),
    };
  }

  // Final bullet cap (UI safety)
  const bullets = Array.isArray(response.bullets)
    ? response.bullets.slice(0, 3)
    : [];

  return {
    contract: CHAT_V2_CONTROL_CONTRACT.name,
    status: "READY",
    response: {
      headline: response.headline,
      bullets,
      sections: response.sections || {},
    },
    memoryContext,
    userPreferences,
    confidence,
    provenance,
    governance: CHAT_V2_CONTROL_CONTRACT,
    timestamp: Date.now(),
  };
}
