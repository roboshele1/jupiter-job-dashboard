/**
 * CHAT_V2_PERSONALIZATION_PRESETS
 * ===============================
 * Phase 29 — Personalization presets (read-only)
 *
 * PURPOSE
 * -------
 * - Derive tone + verbosity preferences
 * - MUST be null-safe and deterministic
 * - No advice, no mutation, no execution
 */

export const CHAT_V2_PERSONALIZATION_PRESETS_CONTRACT = {
  name: "CHAT_V2_PERSONALIZATION_PRESETS",
  version: "1.1",
  mode: "READ_ONLY",
  authority: "ENGINE",
};

/* =========================================================
   PRESET DERIVATION (NULL-SAFE)
========================================================= */

export function getPersonalizationPreset({
  memoryContext = [],
  userPreferences = {},
} = {}) {
  // --- HARD NULL GUARD (CRITICAL) ---
  const safeMemory = Array.isArray(memoryContext) ? memoryContext : [];

  const prefersSimple = safeMemory.some(
    (m) => m?.signal === "PREFERS_SIMPLE_LANGUAGE"
  );

  const prefersDetail = safeMemory.some(
    (m) => m?.signal === "PREFERS_DETAILED_EXPLANATION"
  );

  return {
    contract: CHAT_V2_PERSONALIZATION_PRESETS_CONTRACT.name,
    status: "READY",
    preset: {
      tone: userPreferences.tone || "NEUTRAL",
      verbosity: prefersDetail
        ? "DETAILED"
        : prefersSimple
        ? "SIMPLE"
        : "STANDARD",
      confidenceStyle: "CALM_EXPLANATORY",
    },
  };
}
