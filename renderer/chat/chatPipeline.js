/**
 * Chat Pipeline — Phase 17
 * -----------------------
 * Purpose:
 * - Single controlled wiring path:
 *   interpretation → exposure builder → sandbox → insight renderer → UI
 * - Deterministic, read-only
 */

import { buildChatExposure } from "../../engine/llm/chatExposureBuilder.js";
import { runLLMSandbox } from "../../engine/llm/llmSandboxAdapter.js";
import { mapToInsight } from "./insightRendererAdapter.js";

/**
 * Build Chat Insight — Phase 17
 * @param {Object} interpretation
 * @returns {Object|null} insight for UI rendering
 */
export function buildChatInsight(interpretation) {
  if (!interpretation) return null;

  // Step 1 — Build authoritative chatExposure
  const chatExposure = buildChatExposure(interpretation);
  if (!chatExposure) return null;

  // Step 2 — Run sandbox (Phase 15)
  const sandboxOutput = runLLMSandbox(chatExposure);

  // Step 3 — Map sandbox output to UI-safe Insight Object (Phase 17)
  const insight = mapToInsight(sandboxOutput);

  return insight;
}

/**
 * Build Chat Output — Phase 17
 * Legacy entry point (returns same as buildChatInsight)
 */
export function buildChatOutput(interpretation) {
  return buildChatInsight(interpretation);
}

