/**
 * LLM Sandbox Adapter — Phase 15 (contract-hardened)
 * --------------------------------------------------
 * Purpose:
 * - Single execution path for LLM-like behavior
 * - Still sandboxed, still read-only
 * - Delegates to provider registry (swap-safe)
 *
 * Hard Contract:
 * - Providers MUST expose: invoke(validatedInput) -> schema-valid output
 * - No provider.run(), no alternate names
 * - If contract is broken, fail fast with a precise error
 */

import { validateLLMInput } from "./schemas/llmInputSchema.js";
import { validateLLMOutput } from "./schemas/llmOutputSchema.js";
import { getActiveLLMProvider } from "./providers/providerRegistry.js";

/**
 * @param {any} provider
 * @returns {{ invoke: Function }}
 */
function assertProviderContract(provider) {
  if (!provider || typeof provider !== "object") {
    throw new Error("LLM Provider Contract Violation: provider is missing");
  }

  if (typeof provider.invoke !== "function") {
    const keys = Object.keys(provider);
    throw new Error(
      `LLM Provider Contract Violation: provider must define invoke(validatedInput). Found keys: ${keys.join(
        ", "
      )}`
    );
  }

  return provider;
}

export function runLLMSandbox(chatExposure) {
  // Phase 8 — Input validation
  const validatedInput = validateLLMInput({
    system: {
      mode: "observer",
      sandboxed: true,
    },
    payload: chatExposure,
  });

  // Phase 15 — Provider delegation (swap-safe)
  const provider = assertProviderContract(getActiveLLMProvider());

  // Single contract call (NO provider.run)
  const rawOutput = provider.invoke(validatedInput);

  // Phase 8 — Output validation
  return validateLLMOutput(rawOutput);
}

