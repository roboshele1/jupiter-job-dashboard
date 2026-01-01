/**
 * Mock LLM Provider — Phase 13
 * ---------------------------
 * Purpose:
 * - Concrete implementation of the LLM provider adapter
 * - Still sandboxed, still deterministic
 * - Zero network, zero model, zero side effects
 *
 * This file proves swap-readiness without behavior drift.
 */

import { createLLMProvider } from "./llmProviderAdapter";

export const mockLLMProvider = createLLMProvider({
  name: "mock-provider",
  mode: "observer",
  phase: 13,

  /**
   * Execute provider call
   * @param {Object} validatedInput
   * @returns {Object}
   */
  execute(validatedInput) {
    return {
      summary:
        "Mock provider active. Portfolio context ingested and synthesized under observer constraints.",
      metadata: {
        mode: "observer",
        phase: 13,
        provider: "mock",
        advice: false,
        recommendation: false,
        prediction: false,
        instruction: false,
        command: false,
        optimization: false,
      },
      disclaimer:
        "Observer-only mock provider. No advice, actions, or predictions.",
    };
  },
});

