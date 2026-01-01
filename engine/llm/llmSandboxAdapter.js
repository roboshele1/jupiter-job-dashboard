/**
 * LLM Sandbox Adapter — Phase 9
 * -----------------------------
 * Purpose:
 * - Single execution path for LLM-like behavior
 * - Still sandboxed, still read-only
 * - Uses dry-run mock instead of real model
 */

import { validateLLMInput } from "./schemas/llmInputSchema";
import { validateLLMOutput } from "./schemas/llmOutputSchema";
import { mockLLMResponse } from "./llmDryRunMock";

export function runLLMSandbox(chatExposure) {
  // Phase 8 — Input validation
  const validatedInput = validateLLMInput({
    system: {
      mode: "observer",
      sandboxed: true,
    },
    payload: chatExposure,
  });

  // Phase 9 — Dry-run mock (no model)
  const mockOutput = mockLLMResponse(validatedInput);

  // Phase 8 — Output validation
  return validateLLMOutput(mockOutput);
}

