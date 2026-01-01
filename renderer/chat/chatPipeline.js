/**
 * Chat Pipeline — Phase 11
 * -----------------------
 * Purpose:
 * - Single controlled wiring path from interpretation → LLM sandbox → serializer → UI
 * - No logic beyond orchestration
 * - No mutations, no IPC, no side effects
 *
 * This file is the ONLY place Chat data is wired.
 */

import { runLLMSandbox } from "../../engine/llm/llmSandboxAdapter";
import { serializeChatExposure } from "../../engine/llm/chatExposureSerializer";

/**
 * Build Chat-safe output from interpretation snapshot
 * @param {Object} interpretation
 * @returns {Object|null}
 */
export function buildChatOutput(interpretation) {
  if (!interpretation || !interpretation.chatExposure) {
    return null;
  }

  // Phase 9 — sandbox execution (dry-run, schema-validated)
  const sandboxOutput = runLLMSandbox(interpretation.chatExposure);

  // Phase 11 — controlled serialization (UI-safe shape)
  return serializeChatExposure(sandboxOutput);
}

