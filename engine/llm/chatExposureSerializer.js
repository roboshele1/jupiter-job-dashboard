/**
 * Chat Exposure Serializer — Phase 11
 * ----------------------------------
 * Purpose:
 * - Convert internal chatExposure objects into a stable, UI-safe shape
 * - Explicitly control what leaves the engine layer
 * - Prevent accidental leakage of internal fields or future expansions
 *
 * Constraints:
 * - Read-only
 * - Deterministic
 * - No IPC
 * - No UI
 * - No mutations
 */

/**
 * Serialize chat exposure for downstream consumers
 *
 * @param {Object|null} chatExposure
 * @returns {Object|null}
 */
export function serializeChatExposure(chatExposure) {
  if (!chatExposure) {
    return null;
  }

  return {
    summary: chatExposure.summary ?? null,
    disclaimer: chatExposure.disclaimer ?? null,
  };
}

