/**
 * LLM Provider Registry — Phase 14
 * --------------------------------
 * Purpose:
 * - Single authoritative selector for LLM providers
 * - Enables swap between mock and real providers without behavior drift
 * - Enforces adapter contract
 *
 * Constraints:
 * - Read-only
 * - Deterministic
 * - No network
 * - No execution side effects
 */

import { mockLLMProvider } from "./mockLLMProvider";

/**
 * Registry of available providers
 * NOTE: Only mock is allowed in sandbox phases
 */
const PROVIDERS = {
  mock: mockLLMProvider,
};

/**
 * Resolve LLM provider by name
 *
 * @param {string} name
 * @returns {Object} provider
 */
export function getLLMProvider(name = "mock") {
  const provider = PROVIDERS[name];

  if (!provider) {
    throw new Error(
      `LLM Provider Registry Violation: unknown provider "${name}"`
    );
  }

  return provider;
}

