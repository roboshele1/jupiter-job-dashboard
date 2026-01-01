/**
 * Insight Renderer Adapter — Phase 17
 * -----------------------------------
 * Purpose:
 * - Transform schema-validated chat output into a Bloomberg-style insight shape
 * - Renderer-only, no logic or engine calls
 * - Read-only, deterministic
 */

/**
 * Map chatExposure to UI-safe Insight Object
 * @param {Object|null} chatExposure
 * @returns {Object|null} insight
 */
export function mapToInsight(chatExposure) {
  if (!chatExposure) return null;

  return {
    headline: chatExposure.summary ?? "No dominant insight detected.",
    context: chatExposure.summary ?? "Portfolio data is available, but no elevated signals.",
    footer: chatExposure.disclaimer ?? "Observer mode only. Descriptive summary. No advice or actions implied."
  };
}

