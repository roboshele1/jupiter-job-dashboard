/**
 * LLM Sandbox Adapter — Phase 15
 * -----------------------------
 * Purpose:
 * - Single execution path for LLM behavior
 * - Delegates execution to provider registry
 * - Still sandboxed, still observer-only
 *
 * Guarantees:
 * - Schema validated input/output
 * - Provider swap without drift
 */

import { validateLLMInput } from "./schemas/llmInputSchema";
import { validateLLMOutput } from "./schemas/llmOutputSchema";
import { getLLMProvider } from "./providers/providerRegistry";

/**
 * Run LLM sandbox using selected provider
 *
 * @param {Object} chatExposure
 * @param {string} providerName
 * @returns {Object}
 */
export function runLLMSandbox(chatExposure, providerName = "mock") {
  // Phase 8 — Input validation
  const validatedInput = validateLLMInput({
    system: {
      mode: "observer",
      sandboxed: true,
    },
    payload: chatExposure,
  });

  // Phase 15 — Resolve provider (mock by default)
  const provider = getLLMProvider(providerName);

  // Provider execution (still sandboxed)
  const rawOutput = provider.run(validatedInput);

  // Phase 8 — Output validation
  return validateLLMOutput(rawOutput);
}

