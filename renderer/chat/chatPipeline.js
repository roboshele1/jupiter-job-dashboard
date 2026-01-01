/**
 * Chat Pipeline — Phase 16
 * -----------------------
 * Purpose:
 * - Single controlled wiring path:
 *   interpretation → exposure builder → LLM sandbox → serializer → UI
 *
 * Constraints:
 * - No logic beyond orchestration
 * - No mutations
 * - No IPC
 * - No side effects
 *
 * This file is the ONLY place Chat data is wired.
 */

import { buildChatExposure } from "../../engine/llm/chatExposureBuilder.js";
import { runLLMSandbox } from "../../engine/llm/llmSandboxAdapter.js";
import { serializeChatExposure } from "../../engine/llm/chatExposureSerializer.js";

/**
 * Build Chat-safe output from interpretation snapshot
 * @param {Object} interpretation
 * @returns {Object|null}
 */
export function buildChatOutput(interpretation) {
  if (!interpretation) {
    return null;
  }

  // Phase 16 — authoritative narrative construction
  const chatExposure = buildChatExposure(interpretation);

  if (!chatExposure) {
    return null;
  }

  // Phase 15 — sandbox execution (provider-backed, schema-validated)
  const sandboxOutput = runLLMSandbox(chatExposure);

  // Phase 11 — controlled serialization (UI-safe shape)
  return serializeChatExposure(sandboxOutput);
}

