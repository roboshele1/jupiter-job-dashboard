/**
 * CHAT_V2_PERSONALIZATION_PRESETS
 * ==============================
 * Defines deterministic personalization presets
 */

export function getPersonalizationPreset({
  memoryContext = [],
  userPreferences = {},
  confidence = 0,
}) {
  const prefersSimple = memoryContext.some(
    m => m.type === "USER_PREFERENCE" && m.summary.toLowerCase().includes("simple")
  );

  if (userPreferences.tone === "simple" || prefersSimple) {
    return {
      name: "SIMPLE",
      maxBullets: 3,
      maxSections: 3,
      explanationDepth: "LOW",
    };
  }

  if (confidence < 0.4) {
    return {
      name: "LOW_CONFIDENCE",
      maxBullets: 4,
      maxSections: 4,
      explanationDepth: "HIGH",
    };
  }

  return {
    name: "DEFAULT",
    maxBullets: 3,
    maxSections: 3,
    explanationDepth: "MEDIUM",
  };
}
