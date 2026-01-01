/**
 * LLM Dry-Run Mock — Phase 9
 * -------------------------
 * Purpose:
 * - Simulate a schema-valid LLM response
 * - NO network, NO model, NO execution side effects
 * - Used only to validate end-to-end plumbing
 *
 * Constraints:
 * - Observer-only
 * - Read-only
 * - Deterministic output
 */

export function mockLLMResponse(validatedInput) {
  return {
    summary:
      "Portfolio synthesis available. Primary risk driver and first failure mode identified. Growth alignment assessed at a high level.",
    metadata: {
      mode: "observer",
      phase: 8,
      // Explicitly ensure no forbidden capabilities
      advice: false,
      recommendation: false,
      prediction: false,
      instruction: false,
      command: false,
      optimization: false,
    },
    disclaimer:
      "Observer mode. Descriptive summary only. No advice, actions, or predictions.",
  };
}

