/**
 * LLM Sandbox Adapter — Phase 7
 * -----------------------------
 * Purpose:
 * - Define the ONLY boundary where an LLM may ever connect to JUPITER
 * - Enforce strict sandboxing, read-only access, and zero side effects
 *
 * IMPORTANT:
 * - This file does NOT call any LLM
 * - This file does NOT import engines, IPC, UI, or filesystem
 * - This file is an adapter + choke point ONLY
 *
 * Behavior Drift Protection:
 * - Input MUST be pre-sanitized (contract-approved only)
 * - Output MUST be validated elsewhere before UI exposure
 *
 * Status:
 * - Phase 7 scaffold (inactive)
 * - Safe to exist without execution
 */

/**
 * Allowed inputs into LLM sandbox
 * NOTE: This will later be validated by llmInputSchema.js
 */
export function prepareLLMInput(chatExposure) {
  return {
    system: {
      phase: 7,
      mode: "observer",
      sandboxed: true,
    },

    payload: chatExposure ?? null,

    invariants: {
      readOnly: true,
      noIPC: true,
      noEngines: true,
      noUI: true,
    },
  };
}

/**
 * Placeholder for future LLM invocation
 * DO NOT IMPLEMENT IN PHASE 7
 */
export function invokeLLM(_) {
  throw new Error(
    "LLM invocation is disabled. Phase 7 is sandbox preparation only."
  );
}

