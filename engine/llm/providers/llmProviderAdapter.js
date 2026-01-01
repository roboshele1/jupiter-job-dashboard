/**
 * LLM Provider Adapter — Phase 12
 * -------------------------------
 * Purpose:
 * - Define a single, swappable interface for real LLM providers
 * - Preserve all upstream guarantees (schemas, sandbox, serializer)
 * - Prevent behavior drift by enforcing observer-only contracts
 *
 * Rules:
 * - NO network calls in Phase 12
 * - NO execution side effects
 * - NO schema bypass
 * - NO UI / IPC / engine imports
 *
 * This file is an INTERFACE + GUARD, not an implementation.
 */

/**
 * Provider contract every real LLM must satisfy
 * @param {Object} validatedInput - output of validateLLMInput()
 * @returns {Object} rawModelOutput (must pass validateLLMOutput)
 */
export function invokeProvider(validatedInput) {
  throw new Error(
    "LLM provider not configured. Phase 12 defines the adapter only."
  );
}

/**
 * Capability declaration for auditing and safety checks
 */
export const LLM_PROVIDER_CAPABILITIES = Object.freeze({
  mode: "observer",
  allowsAdvice: false,
  allowsPredictions: false,
  allowsActions: false,
  allowsCommands: false,
  allowsOptimization: false,
  networkAccess: false,
  mutableState: false,
});

/**
 * Provider identity metadata (filled when real provider is wired)
 */
export const LLM_PROVIDER_METADATA = Object.freeze({
  name: "UNCONFIGURED",
  version: "0.0.0",
  sandboxed: true,
  phase: 12,
});

