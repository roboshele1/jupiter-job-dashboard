/**
 * LLM Provider Registry — Canonical
 * --------------------------------
 * SINGLE authority for provider selection
 */

import { createMockLLMProvider } from "./mockLLMProvider.js";

export function getActiveLLMProvider() {
  const provider = createMockLLMProvider();

  if (typeof provider.invoke !== "function") {
    throw new Error(
      "Provider Registry Error: active provider does not implement invoke()"
    );
  }

  return provider;
}

