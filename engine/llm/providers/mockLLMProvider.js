/**
 * Mock LLM Provider — Phase 16
 * ---------------------------
 * Purpose:
 * - Pass through authored narrative without modification
 * - Fully comply with sandbox provider contract
 * - Zero hallucination, zero inference
 */

export function createMockLLMProvider() {
  return {
    name: "mock-pass-through",

    /**
     * REQUIRED CONTRACT METHOD
     * @param {Object} validatedInput
     * @returns {Object}
     */
    invoke(validatedInput) {
      const { payload } = validatedInput;

      if (!payload || !payload.summary || !payload.disclaimer) {
        throw new Error(
          "MockLLMProvider Contract Error: missing authored narrative payload"
        );
      }

      return {
        summary: payload.summary,
        metadata: {
          mode: "observer",
          phase: 16,
          advice: false,
          recommendation: false,
          prediction: false,
          instruction: false,
          command: false,
          optimization: false,
        },
        disclaimer: payload.disclaimer,
      };
    },
  };
}

